import "server-only";
import { z } from "zod";

const errorSchema = z.object({ message: z.string().min(1).max(1000) });
const baseUrlSchema = z.url().refine((value) => {
  if (!URL.canParse(value)) return false;
  const url = new URL(value);
  return ["http:", "https:"].includes(url.protocol) && !url.username && !url.password && !url.search && !url.hash;
});

export class BackendApiError extends Error {
  constructor(message: string, readonly status: number) { super(message); this.name = "BackendApiError"; }
}

export interface BackendOptions {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  token?: string;
  body?: unknown;
}

export async function backendRequest(path: string, options: BackendOptions = {}): Promise<Response> {
  const base = baseUrlSchema.safeParse(process.env.BACKEND_API_URL ?? "http://127.0.0.1:3001/api");
  if (!base.success) throw new BackendApiError("A conexão com a API não está configurada corretamente.", 503);
  const headers: Record<string, string> = {};
  if (options.token) headers.Authorization = `Bearer ${options.token}`;
  const form = options.body instanceof FormData;
  if (options.body !== undefined && !form) headers["Content-Type"] = "application/json";
  let response: Response;
  try {
    response = await fetch(`${base.data.replace(/\/$/u, "")}${path}`, {
      method: options.method ?? "GET", headers,
      body: options.body instanceof FormData ? options.body : options.body === undefined ? undefined : JSON.stringify(options.body),
      cache: "no-store", redirect: "error", signal: AbortSignal.timeout(15000),
    });
  } catch {
    throw new BackendApiError("Não foi possível conectar ao serviço. Tente novamente.", 503);
  }
  if (!response.ok) {
    const payload: unknown = await response.json().catch(() => null);
    const parsed = errorSchema.safeParse(payload);
    throw new BackendApiError(parsed.success ? parsed.data.message : "O serviço não pôde concluir a solicitação.", response.status);
  }
  return response;
}

export async function backendData<T>(path: string, schema: z.ZodType<T>, options?: BackendOptions): Promise<T> {
  const response = await backendRequest(path, options);
  const payload: unknown = await response.json().catch(() => null);
  const result = z.object({ data: schema }).safeParse(payload);
  if (!result.success) throw new BackendApiError("O serviço retornou dados inválidos. Tente novamente.", 502);
  return result.data.data;
}
