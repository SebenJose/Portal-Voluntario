import { z } from "zod";

const originSchema = z.url().refine((value) => {
  if (!URL.canParse(value)) return false;
  const url = new URL(value);
  return ["http:", "https:"].includes(url.protocol) && url.origin === value;
}, "Informe uma origem HTTP(S) exata, sem caminho, credenciais ou barra final.");

export const environmentSchema = z.object({
  API_HOST: z.enum(["127.0.0.1", "0.0.0.0", "::1"]).default("127.0.0.1"),
  API_PORT: z.coerce.number().int().min(1).max(65535).default(3001),
  DATABASE_PATH: z.string().trim().min(1).default(".data/portal.sqlite"),
  JWT_SECRET: z.string().min(32),
  CORS_ORIGINS: z.string().default("http://localhost:3000")
    .transform((value) => value.split(",").map((origin) => origin.trim()))
    .pipe(z.array(originSchema).min(1)),
});

export type Environment = z.infer<typeof environmentSchema>;

export function loadEnvironment(input: unknown): Environment {
  const parsed = environmentSchema.safeParse(input);
  if (!parsed.success) {
    const fields = [...new Set(parsed.error.issues.map((issue) => issue.path.join(".")))];
    throw new Error(`Configuração inválida. Verifique: ${fields.join(", ")}.`);
  }
  return parsed.data;
}
