import "reflect-metadata";
import { strict as assert } from "node:assert";
import { randomBytes, randomUUID } from "node:crypto";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import type { INestApplication } from "@nestjs/common";
import { DataSource } from "typeorm";
import { z } from "zod";
import { createApplication } from "@/application";
import { seedDatabase } from "@/database/seed";

const loginSchema = z.object({ accessToken: z.string(), expiresAt: z.iso.datetime(), user: z.object({ id: z.uuid(), role: z.string() }) });

async function data<T>(response: Response, schema: z.ZodType<T>): Promise<T> {
  const body: unknown = await response.json();
  return z.object({ data: schema }).parse(body).data;
}

// Instância própria: os limites de tentativas de login são por processo e não devem
// ser compartilhados com os testes de bloqueio de api.test.ts.
test("perfis: aprovação de organizações, avaliação de certificados e conta", async (context) => {
  const directory = await mkdtemp(join(tmpdir(), "portal-api-roles-"));
  const password = randomBytes(18).toString("base64url");
  const app: INestApplication = await createApplication({ JWT_SECRET: randomBytes(32).toString("hex"), DATABASE_PATH: join(directory, "roles.sqlite") }, false);
  let baseUrl = "";
  const send = (path: string, method = "GET", token?: string, body?: unknown): Promise<Response> => {
    const headers: Record<string, string> = {};
    if (token) headers.Authorization = `Bearer ${token}`;
    if (body !== undefined && !(body instanceof FormData)) headers["Content-Type"] = "application/json";
    return fetch(`${baseUrl}/api${path}`, { method, headers, body: body instanceof FormData ? body : body === undefined ? undefined : JSON.stringify(body) });
  };
  const login = async (email: string) => {
    const response = await send("/auth/login", "POST", undefined, { email, password });
    assert.equal(response.status, 200);
    return data(response, loginSchema);
  };
  const fields = {
    title: "Atividade pendente", description: "Atividade de organização ainda não aprovada.", category: "Extensão",
    format: "Presencial", location: "Santa Helena", dateLabel: "10 de janeiro de 2027", durationLabel: "Das 8h às 12h",
    hours: 4, vacancies: 1, sessions: [{ date: "2027-01-10", startsAt: "08:00", endsAt: "12:00" }],
  };
  const documentBytes = "%PDF-1.4\nComprovante demonstrativo de teste.\n%%EOF";

  try {
    await seedDatabase(app.get(DataSource), password);
    await app.listen(0, "127.0.0.1");
    baseUrl = await app.getUrl();
    const volunteerToken = (await login("voluntario@portal.example")).accessToken;
    const otherToken = (await login("outro@portal.example")).accessToken;
    const organizationToken = (await login("organizacao@portal.example")).accessToken;

    await context.test("seed traz administrador e organização pendente", async () => {
      assert.equal((await login("admin@portal.example")).user.role, "admin");
      const pending = await data(await send("/auth/login", "POST", undefined, { email: "organizacao-pendente@portal.example", password }), z.object({ user: z.object({ organization: z.object({ status: z.literal("pending") }) }) }));
      assert.equal(pending.user.organization.status, "pending");
    });
  } finally {
    await app.close();
    await rm(directory, { recursive: true, force: true });
  }
});
