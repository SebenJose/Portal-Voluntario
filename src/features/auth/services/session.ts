import { sessionPayloadSchema, type AuthUser, type SessionPayload } from "@/features/auth/schemas/session-schema";

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
  const issuedAt = Math.floor(Date.now() / 1000);
  const expiresAtSeconds = issuedAt + SESSION_DURATION_SECONDS;
  const payload: SessionPayload = {
    user,
    issuedAt,
    expiresAt: expiresAtSeconds,
  };
  const validatedPayload = sessionPayloadSchema.parse(payload);
  const encodedPayload = encodeText(JSON.stringify(validatedPayload));
  const signature = await crypto.subtle.sign("HMAC", await getSigningKey(), new TextEncoder().encode(encodedPayload));

  return {
    token: `${encodedPayload}.${encodeBase64Url(new Uint8Array(signature))}`,
    expiresAt: new Date(expiresAtSeconds * 1000),
  };
}

export async function verifySessionToken(token: string | undefined): Promise<AuthUser | null> {
  if (!token) return null;
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
    return payloadResult.data.user;
  } catch {
    return null;
  }
}
