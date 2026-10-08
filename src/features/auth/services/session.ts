import "server-only";

import { randomUUID } from "node:crypto";
import { z } from "zod";
import { sessionPayloadSchema, type AuthUser, type SessionPayload } from "@/features/auth/schemas/session-schema";
import { getAccountUser } from "@/features/auth/services/accounts";
import { readLocalData, updateLocalData } from "@/lib/server/local-store";

const storedSessionSchema = sessionPayloadSchema.extend({ userId: z.string().min(1) });
const storedSessionsSchema = z.array(storedSessionSchema);
const sessionsFile = "sessions.json";

export const SESSION_COOKIE_NAME = "portal_session";
export const SESSION_DURATION_SECONDS = 60 * 60 * 8;

function getSigningKey(): Promise<CryptoKey> {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("SESSION_SECRET must be configured with at least 32 characters.");
  }

  return crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
}

function encodeBase64Url(value: Uint8Array): string {
  let binary = "";
  for (const byte of value) binary += String.fromCharCode(byte);
  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/u, "");
}

function decodeBase64Url(value: string): Uint8Array | null {
  if (!/^[A-Za-z0-9_-]+$/u.test(value)) return null;
  const base64 = value.replaceAll("-", "+").replaceAll("_", "/");
  try {
    const binary = atob(base64 + "=".repeat((4 - (base64.length % 4)) % 4));
    return Uint8Array.from(binary, (character) => character.charCodeAt(0));
  } catch {
    return null;
  }
}

function encodeText(value: string): string {
  return encodeBase64Url(new TextEncoder().encode(value));
}

function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  const buffer = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(buffer).set(bytes);
  return buffer;
}

export async function createSessionToken(user: AuthUser): Promise<{ token: string; expiresAt: Date }> {
  if (!getAccountUser(user.id)) throw new Error("Account is unavailable.");
  const issuedAt = Math.floor(Date.now() / 1000);
  const expiresAtSeconds = issuedAt + SESSION_DURATION_SECONDS;
  const payload: SessionPayload = {
    sessionId: randomUUID(),
    issuedAt,
    expiresAt: expiresAtSeconds,
  };
  const validatedPayload = sessionPayloadSchema.parse(payload);
  const encodedPayload = encodeText(JSON.stringify(validatedPayload));
  const signature = await crypto.subtle.sign("HMAC", await getSigningKey(), new TextEncoder().encode(encodedPayload));

  updateLocalData(sessionsFile, storedSessionsSchema, [], (sessions) => [
    ...sessions.filter((session) => session.expiresAt > issuedAt),
    { ...validatedPayload, userId: user.id },
  ]);

  return {
    token: `${encodedPayload}.${encodeBase64Url(new Uint8Array(signature))}`,
    expiresAt: new Date(expiresAtSeconds * 1000),
  };
}

async function readSignedSession(token: string | undefined): Promise<SessionPayload | null> {
  if (!token || token.length > 2048) return null;
  const [encodedPayload, encodedSignature, extraPart] = token.split(".");
  if (!encodedPayload || !encodedSignature || extraPart !== undefined) return null;

  const signature = decodeBase64Url(encodedSignature);
  const payloadBytes = decodeBase64Url(encodedPayload);
  if (!signature || !payloadBytes) return null;

  try {
    const validSignature = await crypto.subtle.verify(
      "HMAC",
      await getSigningKey(),
      toArrayBuffer(signature),
      toArrayBuffer(new TextEncoder().encode(encodedPayload)),
    );
    if (!validSignature) return null;

    const payloadText = new TextDecoder("utf-8", { fatal: true }).decode(payloadBytes);
    const payloadResult = sessionPayloadSchema.safeParse(JSON.parse(payloadText));
    if (!payloadResult.success) return null;

    const currentTime = Math.floor(Date.now() / 1000);
    if (payloadResult.data.expiresAt <= currentTime || payloadResult.data.issuedAt > currentTime) return null;
    return payloadResult.data;
  } catch {
    return null;
  }
}

export async function verifySessionToken(token: string | undefined): Promise<AuthUser | null> {
  const payload = await readSignedSession(token);
  if (!payload) return null;
  try {
    const session = readLocalData(sessionsFile, storedSessionsSchema, []).find((item) =>
      item.sessionId === payload.sessionId && item.issuedAt === payload.issuedAt && item.expiresAt === payload.expiresAt,
    );
    return session ? getAccountUser(session.userId) : null;
  } catch {
    return null;
  }
}

export async function revokeSessionToken(token: string | undefined): Promise<void> {
  const payload = await readSignedSession(token);
  if (!payload) return;
  updateLocalData(sessionsFile, storedSessionsSchema, [], (sessions) =>
    sessions.filter((session) => session.sessionId !== payload.sessionId && session.expiresAt > Math.floor(Date.now() / 1000)),
  );
}
