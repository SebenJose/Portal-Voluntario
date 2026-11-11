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

    await context.test("organização se cadastra pendente e só gerencia atividades após aprovação do admin", async () => {
      const adminToken = (await login("admin@portal.example")).accessToken;
      const email = `org-${randomUUID().slice(0, 8)}@portal.example`;
      const registration = { name: "Responsável Novo", email, password, passwordConfirmation: password, organizationName: "Coletivo Novo" };
      assert.equal((await send("/auth/register/organization", "POST", undefined, { ...registration, status: "approved" })).status, 400, "status não pode ser enviado");
      assert.equal((await send("/auth/register/organization", "POST", undefined, { ...registration, organizationName: "x" })).status, 400);
      assert.equal((await send("/auth/register/organization", "POST", undefined, registration)).status, 202);
      const pending = await data(await send("/auth/login", "POST", undefined, { email, password }), loginSchema.extend({
        user: z.object({ role: z.literal("organization"), organization: z.object({ id: z.uuid(), name: z.literal("Coletivo Novo"), status: z.literal("pending") }) }),
      }));
      const orgToken = pending.accessToken;
      for (const [method, path] of [["GET", "/organizations/activities"], ["POST", "/opportunities"]] as const) {
        const response = await send(path, method, orgToken, method === "POST" ? { ...fields, id: "atividade-pendente" } : undefined);
        assert.equal(response.status, 403, `${method} ${path}`);
      }
      const blocked = z.object({ message: z.string() }).parse(await (await send("/organizations/activities", "GET", orgToken)).json());
      assert.match(blocked.message, /aguarda aprovação/u);
      for (const token of [volunteerToken, organizationToken, orgToken]) assert.equal((await send("/admin/organizations", "GET", token)).status, 403);
      const organizationSchema = z.object({ id: z.uuid(), name: z.string(), status: z.string(), owner: z.object({ email: z.string() }), activities: z.number() });
      const listed = await data(await send("/admin/organizations?status=pending", "GET", adminToken), z.array(organizationSchema));
      const target = listed.find((item) => item.owner.email === email);
      assert.ok(target, "organização pendente listada para o admin");
      assert.ok(listed.every((item) => item.status === "pending"));
      assert.equal((await send(`/admin/organizations/${target.id}`, "PATCH", adminToken, { status: "pending" })).status, 400);
      assert.equal((await send(`/admin/organizations/${target.id}`, "PATCH", adminToken, { status: "approved" })).status, 200);
      assert.equal((await send(`/admin/organizations/${target.id}`, "PATCH", adminToken, { status: "approved" })).status, 409);
      assert.equal((await send("/organizations/activities", "GET", orgToken)).status, 200, "aprovação vale para o token já emitido");
      const session = await data(await send("/auth/session", "GET", orgToken), z.object({ user: z.object({ organization: z.object({ status: z.literal("approved") }) }) }));
      assert.equal(session.user.organization.status, "approved");
      assert.equal((await send(`/admin/organizations/${target.id}`, "PATCH", adminToken, { status: "rejected" })).status, 200);
      const rejected = await send("/organizations/activities", "GET", orgToken);
      assert.equal(rejected.status, 403);
      assert.match(z.object({ message: z.string() }).parse(await rejected.json()).message, /recusado/u);
      // E-mail já cadastrado: mesma resposta e nenhuma alteração de papel.
      assert.equal((await send("/auth/register/organization", "POST", undefined, { ...registration, email: "outro@portal.example" })).status, 202);
      assert.equal((await login("outro@portal.example")).user.role, "volunteer");
    });

    await context.test("admin avalia certificados externos; aprovados somam horas e avaliados não são editados", async () => {
      const adminToken = (await login("admin@portal.example")).accessToken;
      const submit = async (title: string, category: string, hours: string) => {
        const form = new FormData();
        form.set("title", title); form.set("category", category); form.set("hours", hours); form.set("description", "Comprovante para avaliação.");
        form.set("document", new Blob([documentBytes], { type: "application/pdf" }), "avaliacao.pdf");
        const response = await send("/submissions", "POST", otherToken, form);
        assert.equal(response.status, 201);
        return (await data(response, z.object({ id: z.uuid() }))).id;
      };
      const hoursSchema = z.object({ hoursSummary: z.array(z.object({ category: z.string(), completed: z.number() })) });
      const hoursOf = async (category: string) => (await data(await send("/dashboard", "GET", otherToken), hoursSchema)).hoursSummary.find((item) => item.category === category)?.completed ?? -1;
      const before = { Pesquisa: await hoursOf("Pesquisa"), Ensino: await hoursOf("Ensino") };
      const approvedId = await submit("Congresso de pesquisa", "Pesquisa", "5");
      const rejectedId = await submit("Oficina de ensino", "Ensino", "3");
      assert.equal(await hoursOf("Pesquisa"), before.Pesquisa, "em análise não soma horas");

      const queue = await data(await send(`/admin/submissions?status=${encodeURIComponent("Em análise")}`, "GET", adminToken), z.object({ items: z.array(z.object({ id: z.uuid(), status: z.string(), volunteer: z.object({ email: z.string() }) })) }));
      assert.ok(queue.items.some((item) => item.id === approvedId && item.volunteer.email === "outro@portal.example"));
      assert.ok(queue.items.every((item) => item.status === "Em análise"));
      for (const token of [otherToken, organizationToken]) assert.equal((await send("/admin/submissions", "GET", token)).status, 403);
      assert.equal((await send(`/admin/submissions/${approvedId}/document`, "GET", otherToken)).status, 403);
      const download = await send(`/admin/submissions/${approvedId}/document`, "GET", adminToken);
      assert.equal(download.status, 200);
      assert.equal(await download.text(), documentBytes);

      assert.equal((await send(`/admin/submissions/${rejectedId}/review`, "PATCH", adminToken, { status: "Recusado" })).status, 400, "recusa exige justificativa");
      assert.equal((await send(`/admin/submissions/${approvedId}/review`, "PATCH", adminToken, { status: "Em análise" })).status, 400);
      assert.equal((await send(`/admin/submissions/${approvedId}/review`, "PATCH", adminToken, { status: "Aprovado" })).status, 200);
      assert.equal((await send(`/admin/submissions/${approvedId}/review`, "PATCH", adminToken, { status: "Recusado", note: "Mudança de ideia." })).status, 409);
      assert.equal((await send(`/admin/submissions/${rejectedId}/review`, "PATCH", adminToken, { status: "Recusado", note: "Comprovante sem carga horária." })).status, 200);

      assert.equal(await hoursOf("Pesquisa"), before.Pesquisa + 5);
      assert.equal(await hoursOf("Ensino"), before.Ensino, "recusado não soma horas");
      const mine = await data(await send("/submissions", "GET", otherToken), z.object({ items: z.array(z.object({ id: z.uuid(), status: z.string(), review: z.object({ note: z.string().nullable(), reviewedAt: z.iso.datetime() }).nullable() })) }));
      assert.equal(mine.items.find((item) => item.id === rejectedId)?.review?.note, "Comprovante sem carga horária.");
      assert.equal(mine.items.find((item) => item.id === approvedId)?.status, "Aprovado");
      assert.equal((await send(`/submissions/${approvedId}`, "PATCH", otherToken, { hours: 50 })).status, 409);
      assert.equal((await send(`/submissions/${rejectedId}`, "DELETE", otherToken)).status, 409);
      for (const path of ["/submissions", "/dashboard"]) assert.equal((await send(path, "GET", organizationToken)).status, 403, `organização em ${path}`);
    });

    await context.test("conta: perfil por papel e troca de senha revoga as outras sessões", async () => {
      const email = `conta-${randomUUID().slice(0, 8)}@portal.example`;
      assert.equal((await send("/auth/register", "POST", undefined, { name: "Conta Perfil", email, password, passwordConfirmation: password })).status, 202);
      const first = (await login(email)).accessToken;
      const second = (await login(email)).accessToken;
      const profile = await data(await send("/account/profile", "PATCH", first, { name: "  Nome Atualizado  " }), z.object({ user: z.object({ name: z.string() }) }));
      assert.equal(profile.user.name, "Nome Atualizado");
      assert.equal((await send("/account/profile", "PATCH", first, { organizationName: "Indevida" })).status, 403);
      assert.equal((await send("/account/profile", "PATCH", first, { role: "admin" })).status, 400);
      const newPassword = `${password}-novo`;
      assert.equal((await send("/account/password", "PATCH", first, { currentPassword: "errada-123", newPassword, newPasswordConfirmation: newPassword })).status, 400);
      assert.equal((await send("/account/password", "PATCH", first, { currentPassword: password, newPassword, newPasswordConfirmation: "diferente1" })).status, 400);
      assert.equal((await send("/account/password", "PATCH", first, { currentPassword: password, newPassword, newPasswordConfirmation: newPassword })).status, 204);
      assert.equal((await send("/auth/session", "GET", first)).status, 200, "sessão atual continua");
      assert.equal((await send("/auth/session", "GET", second)).status, 401, "outras sessões são encerradas");
      assert.equal((await send("/auth/login", "POST", undefined, { email, password })).status, 401);
      assert.equal((await send("/auth/login", "POST", undefined, { email, password: newPassword })).status, 200);
      assert.equal((await send("/account/profile", "PATCH", undefined, { name: "Sem token" })).status, 401);
    });
  } finally {
    await app.close();
    await rm(directory, { recursive: true, force: true });
  }
});
