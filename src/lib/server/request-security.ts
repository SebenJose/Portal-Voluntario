import "server-only";

import { createHash } from "node:crypto";
import { NextResponse } from "next/server";

export class RequestSecurityError extends Error {
  constructor(message: string, readonly status: number, readonly retryAfter?: number) {
    super(message);
    this.name = "RequestSecurityError";
  }
}

export function applicationOrigin(request: Request): string {
  const configured = process.env.PORTAL_ORIGIN;
  if (process.env.NODE_ENV === "production" && !configured) {
    throw new RequestSecurityError("O serviço está indisponível. Tente novamente.", 503);
  }
  try {
    const url = new URL(configured ?? request.url);
    if (!["http:", "https:"].includes(url.protocol) || url.username || url.password ||
        (configured && (url.pathname !== "/" || url.search || url.hash))) throw new Error("Invalid origin");
    if (process.env.NODE_ENV === "production" && url.protocol !== "https:" &&
        !["localhost", "127.0.0.1", "[::1]"].includes(url.hostname)) throw new Error("HTTPS is required");
    return url.origin;
  } catch {
    throw new RequestSecurityError("O serviço está indisponível. Tente novamente.", 503);
  }
}

export function requireMutationOrigin(request: Request): void {
  const origin = applicationOrigin(request);
  if (request.headers.get("origin") !== origin || request.headers.get("sec-fetch-site") === "cross-site") {
    throw new RequestSecurityError("Origem da solicitação não permitida.", 403);
  }
}

const budgets = new Map<string, { attempts: number; expiresAt: number }>();

// Local single-process adapter: aggregate budget cannot be bypassed with spoofed IP headers.
function consumeBudget(key: string, limit: number, windowMs: number): void {
  const now = Date.now();
  for (const [storedKey, budget] of budgets) {
    if (budget.expiresAt <= now) budgets.delete(storedKey);
  }
  const budget = budgets.get(key) ?? { attempts: 0, expiresAt: now + windowMs };
  if (budget.attempts >= limit) {
    throw new RequestSecurityError("Muitas tentativas. Aguarde e tente novamente.", 429, Math.ceil((budget.expiresAt - now) / 1000));
  }
  budget.attempts += 1;
  budgets.set(key, budget);
}

export function limitAuthRequests(): void {
  consumeBudget("auth:aggregate", 30, 60_000);
}

export function limitAccountAttempts(email: string): void {
  const key = createHash("sha256").update(email.trim().toLowerCase()).digest("hex");
  consumeBudget(`account:${key}`, 10, 15 * 60_000);
}

export const MAX_AUTH_BODY_BYTES = 8192;

export async function readAuthJson(request: Request): Promise<unknown> {
  if (request.headers.get("content-type")?.split(";")[0]?.trim().toLowerCase() !== "application/json") {
    throw new RequestSecurityError("Envie os dados em JSON.", 415);
  }
  const length = request.headers.get("content-length");
  if (length !== null && (!/^\d+$/u.test(length) || Number(length) > MAX_AUTH_BODY_BYTES)) {
    throw new RequestSecurityError("A solicitação excede o tamanho permitido.", 413);
  }
  const reader = request.body?.getReader();
  if (!reader) throw new RequestSecurityError("Envie dados válidos.", 400);
  const chunks: Uint8Array[] = [];
  let size = 0;
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      reject(new RequestSecurityError("O envio dos dados demorou demais.", 408));
      void reader.cancel().catch(() => undefined);
    }, 5000);
  });
  try {
    while (true) {
      const chunk = await Promise.race([reader.read(), timeout]);
      if (chunk.done) break;
      size += chunk.value.byteLength;
      if (size > MAX_AUTH_BODY_BYTES) {
        void reader.cancel().catch(() => undefined);
        throw new RequestSecurityError("A solicitação excede o tamanho permitido.", 413);
      }
      chunks.push(chunk.value);
    }
    const bytes = new Uint8Array(size);
    let offset = 0;
    for (const chunk of chunks) {
      bytes.set(chunk, offset);
      offset += chunk.byteLength;
    }
    const input: unknown = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes));
    return input;
  } catch (error: unknown) {
    if (error instanceof RequestSecurityError) throw error;
    throw new RequestSecurityError("Envie dados válidos.", 400);
  } finally {
    clearTimeout(timer);
    reader.releaseLock();
  }
}

export function securityErrorResponse(error: unknown, fallback: string): NextResponse {
  const status = error instanceof RequestSecurityError ? error.status : 500;
  const message = error instanceof RequestSecurityError ? error.message : fallback;
  const headers: Record<string, string> = { "Cache-Control": "no-store" };
  if (error instanceof RequestSecurityError && error.retryAfter) headers["Retry-After"] = String(error.retryAfter);
  return NextResponse.json({ error: message, message }, { status, headers });
}
