import "reflect-metadata";
import { strict as assert } from "node:assert";
import { randomBytes, randomUUID } from "node:crypto";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import type { INestApplication } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { DataSource } from "typeorm";
import { z } from "zod";
import { createApplication } from "@/application";
import { seedDatabase } from "@/database/seed";
import { UserEntity } from "@/features/auth/user.entity";
import { SessionEntity } from "@/features/auth/session.entity";

const loginSchema = z.object({ accessToken: z.string(), expiresAt: z.iso.datetime(), user: z.object({ id: z.uuid(), role: z.string() }) });
const catalogSchema = z.object({ items: z.array(z.object({ id: z.string(), enrolled: z.number(), title: z.string() })), registeredIds: z.array(z.string()) });
const activitiesSchema = z.array(z.object({ id: z.string(), participants: z.array(z.object({ id: z.uuid(), email: z.email(), status: z.string() })), certificatesDispatched: z.boolean() }));

async function data<T>(response: Response, schema: z.ZodType<T>): Promise<T> {
  const body: unknown = await response.json();
  return z.object({ data: schema }).parse(body).data;
}

test("API de domínio: autenticação, autorização, CRUD, inscrições, arquivos e persistência", async (context) => {
  const directory = await mkdtemp(join(tmpdir(), "portal-api-domain-"));
  const environment = { JWT_SECRET: randomBytes(32).toString("hex"), DATABASE_PATH: join(directory, "api.sqlite") };
  const password = randomBytes(18).toString("base64url");
  let app: INestApplication = await createApplication(environment, false);
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
    id: "atividade-api", title: "Atividade da API", description: "Atividade para validar integração real.", category: "Extensão",
    format: "Presencial", location: "Santa Helena", dateLabel: "10 de janeiro de 2027", durationLabel: "Das 8h às 12h",
    hours: 4, vacancies: 1, sessions: [{ date: "2027-01-10", startsAt: "08:00", endsAt: "12:00" }],
  };
  const documentBytes = "%PDF-1.4\nComprovante demonstrativo de teste.\n%%EOF";
  let uploadedId = "";
  let volunteerToken = "";
  let otherToken = "";
  let organizationToken = "";
  let otherOrganizationToken = "";
  let winnerToken = "";
  let participantId = "";

  try {
    await seedDatabase(app.get(DataSource), password);
    await app.listen(0, "127.0.0.1");
    baseUrl = await app.getUrl();
    const volunteer = await login("voluntario@portal.example");
    volunteerToken = volunteer.accessToken;
    otherToken = (await login("outro@portal.example")).accessToken;
    organizationToken = (await login("organizacao@portal.example")).accessToken;
    otherOrganizationToken = (await login("organizacao2@portal.example")).accessToken;

    await context.test("cadastro valida DTO, confirmação, limite bcrypt e impede papel privilegiado", async () => {
      const registration = { name: "Conta nova", email: " NOVA@PORTAL.EXAMPLE ", password, passwordConfirmation: password };
      for (const invalid of [
        { ...registration, email: "inválido" }, { ...registration, role: "organization" },
        { ...registration, passwordConfirmation: "diferente" }, { ...registration, password: "curta", passwordConfirmation: "curta" },
        { ...registration, password: "😀".repeat(30), passwordConfirmation: "😀".repeat(30) },
        { ...registration, password: "😀".repeat(4), passwordConfirmation: "😀".repeat(4) },
      ]) assert.equal((await send("/auth/register", "POST", undefined, invalid)).status, 400);
      const created = await send("/auth/register", "POST", undefined, registration);
      assert.equal(created.status, 202);
      const createdBody: unknown = await created.json();
      const duplicate = await send("/auth/register", "POST", undefined, registration);
      assert.equal(duplicate.status, 202);
      assert.deepEqual(await duplicate.json(), createdBody);
      const newAccount = await login("nova@portal.example");
      assert.equal(newAccount.user.role, "volunteer");
      assert.equal((await app.get(DataSource).getRepository(UserEntity).countBy({ email: "nova@portal.example" })), 1);
    });

    await context.test("login inválido, JWT adulterado/expirado e rotas privadas retornam 401", async () => {
      assert.equal((await send("/auth/login", "POST", undefined, { email: "voluntario@portal.example", password: "incorreta" })).status, 401);
      for (const path of ["/auth/session", "/dashboard", "/submissions", "/organizations/activities"]) {
        assert.equal((await send(path)).status, 401);
      }
      assert.equal((await send("/auth/session", "GET", `${volunteerToken}x`)).status, 401);
      const expired = await new JwtService({ secret: environment.JWT_SECRET }).signAsync({ sub: volunteer.user.id, sid: randomUUID(), exp: 1 }, {
        algorithm: "HS256", issuer: "portal-voluntario", audience: "portal-api",
      });
      assert.equal((await send("/auth/session", "GET", expired)).status, 401);
      const activeSession = await send("/auth/session", "GET", volunteerToken);
      assert.equal(activeSession.status, 200);
      assert.doesNotMatch(JSON.stringify(await activeSession.json()), /password|Hash/u);
    });

    await context.test("papel atual no banco controla 403 e gestão permanece isolada por organização", async () => {
      assert.equal((await send("/organizations/activities", "GET", volunteerToken)).status, 403);
      assert.equal((await send("/opportunities", "POST", volunteerToken, fields)).status, 403);
      assert.equal((await send("/opportunities/horta-comunitaria", "PATCH", otherOrganizationToken, { title: "Tentativa indevida" })).status, 403);
      const before = await data(await send("/organizations/activities", "GET", organizationToken), activitiesSchema);
      assert.deepEqual(before.map((item) => item.id), ["horta-comunitaria"]);
      await app.get(DataSource).getRepository(UserEntity).update(volunteer.user.id, { role: "organization" });
      assert.equal((await send("/organizations/activities", "GET", volunteerToken)).status, 200);
      await app.get(DataSource).getRepository(UserEntity).update(volunteer.user.id, { role: "volunteer" });
      assert.equal((await send("/organizations/activities", "GET", volunteerToken)).status, 403);
    });

    await context.test("catálogo público calcula inscritos reais, filtra e valida query params", async () => {
      const anonymous = await data(await send("/opportunities"), catalogSchema);
      assert.equal(anonymous.items.length, 5);
      assert.deepEqual(anonymous.registeredIds, []);
      assert.equal(anonymous.items.find((item) => item.id === "horta-comunitaria")?.enrolled, 1);
      const own = await data(await send("/opportunities", "GET", volunteerToken), catalogSchema);
      assert.equal(own.registeredIds.length, 2);
      const filtered = await data(await send("/opportunities?category=Ensino&search=Monitoria&sort=hours"), catalogSchema);
      assert.equal(filtered.items.length, 1);
      assert.equal((await send("/opportunities?category=Inexistente")).status, 400);
      assert.equal((await send("/opportunities/inexistente")).status, 404);
    });

    await context.test("CRUD de oportunidades: validação, atualização, exclusão e propriedade", async () => {
      assert.equal((await send("/opportunities", "POST", organizationToken, { ...fields, sessions: [{ date: "2027-01-10", startsAt: "12:00", endsAt: "08:00" }] })).status, 400);
      assert.equal((await send("/opportunities", "POST", organizationToken, { ...fields, id: "crud-api" })).status, 201);
      assert.equal((await send("/opportunities/crud-api", "PATCH", otherOrganizationToken, { hours: 5 })).status, 403);
      assert.equal((await send("/opportunities/crud-api", "PATCH", organizationToken, { hours: null })).status, 400);
      const updated = await send("/opportunities/crud-api", "PATCH", organizationToken, { title: "Título atualizado", hours: 5 });
      assert.equal(updated.status, 200);
      const saved = await data(await send("/opportunities/crud-api"), z.object({ title: z.string(), hours: z.number() }));
      assert.deepEqual(saved, { title: "Título atualizado", hours: 5 });
      assert.equal((await send("/opportunities/crud-api", "DELETE", organizationToken)).status, 204);
      assert.equal((await send("/opportunities/crud-api")).status, 404);
    });

    await context.test("inscrições concorrentes respeitam capacidade, duplicidade e cancelamento libera vaga", async () => {
      assert.equal((await send("/opportunities", "POST", organizationToken, fields)).status, 201);
      assert.equal((await send("/opportunities/atividade-api/registrations", "POST")).status, 401);
      assert.equal((await send("/opportunities/atividade-api/registrations", "POST", organizationToken)).status, 403);
      const results = await Promise.all([volunteerToken, otherToken].map((token) => send("/opportunities/atividade-api/registrations", "POST", token)));
      assert.deepEqual(results.map((response) => response.status).sort(), [201, 409]);
      winnerToken = results[0]?.status === 201 ? volunteerToken : otherToken;
      assert.equal((await send("/opportunities/atividade-api/registrations", "POST", winnerToken)).status, 409);
      assert.equal((await send("/opportunities/atividade-api", "DELETE", organizationToken)).status, 409);
      assert.equal((await send("/opportunities/atividade-api/registrations", "DELETE", winnerToken)).status, 200);
      assert.equal((await data(await send("/opportunities/atividade-api"), z.object({ enrolled: z.number() }))).enrolled, 0);
      assert.equal((await send("/opportunities/atividade-api/registrations", "DELETE", winnerToken)).status, 404);
      assert.equal((await send("/opportunities/atividade-api/registrations", "POST", winnerToken)).status, 201);
    });

    await context.test("gestão exige propriedade e presença; emissão concede horas uma única vez", async () => {
      assert.equal((await send("/organizations/activities/atividade-api/certificates", "POST", organizationToken)).status, 409);
      const activities = await data(await send("/organizations/activities", "GET", organizationToken), activitiesSchema);
      const participant = activities.find((item) => item.id === "atividade-api")?.participants[0];
      assert.ok(participant);
      participantId = participant.id;
      const path = `/organizations/activities/atividade-api/participants/${participantId}`;
      assert.equal((await send(path, "PATCH", otherOrganizationToken, { status: "Presente" })).status, 403);
      assert.equal((await send(path, "PATCH", organizationToken, { status: "Inválido" })).status, 400);
      assert.equal((await send(path, "PATCH", organizationToken, { status: "Presente" })).status, 200);
      const issued = await send("/organizations/activities/atividade-api/certificates", "POST", organizationToken);
      assert.equal(issued.status, 201);
      assert.equal((await data(issued, z.object({ sentCount: z.number() }))).sentCount, 1);
      assert.equal((await send("/organizations/activities/atividade-api/certificates", "POST", organizationToken)).status, 409);
      assert.equal((await send(path, "PATCH", organizationToken, { status: "Ausente" })).status, 409);
      assert.equal((await send("/opportunities/atividade-api/registrations", "DELETE", winnerToken)).status, 409);
      const dashboard = await data(await send("/dashboard", "GET", winnerToken), z.object({ hoursSummary: z.array(z.object({ completed: z.number() })) }));
      assert.equal(dashboard.hoursSummary.reduce((sum, item) => sum + item.completed, 0), 4);
    });

    await context.test("submissão multipart, atualização, download original e isolamento por proprietário", async () => {
      const body = new FormData();
      body.set("title", "Comprovante externo"); body.set("category", "Ensino"); body.set("hours", "8");
      body.set("description", "Descrição da atividade externa."); body.set("document", new Blob([documentBytes], { type: "application/pdf" }), "certificação-extensão.pdf");
      const response = await send("/submissions", "POST", volunteerToken, body);
      assert.equal(response.status, 201);
      const uploaded = await data(response, z.object({ id: z.uuid(), status: z.literal("Em análise"), document: z.object({ name: z.string(), size: z.number() }) }));
      uploadedId = uploaded.id;
      assert.equal(uploaded.document.size, Buffer.byteLength(documentBytes));
      // Nomes com acentos chegam em UTF-8 no multipart e devem ser preservados.
      assert.equal(uploaded.document.name, "certificação-extensão.pdf");
      assert.equal((await send(`/submissions/${uploadedId}`, "PATCH", volunteerToken, { title: "Comprovante atualizado", hours: 9 })).status, 200);
      const download = await send(`/submissions/${uploadedId}/document`, "GET", volunteerToken);
      assert.equal(download.status, 200);
      assert.equal(download.headers.get("content-type"), "application/pdf");
      assert.equal(download.headers.get("content-disposition"), `attachment; filename*=UTF-8''${encodeURIComponent("certificação-extensão.pdf")}`);
      assert.equal(await download.text(), documentBytes);
      for (const method of ["GET", "PATCH", "DELETE"]) assert.equal((await send(`/submissions/${uploadedId}`, method, otherToken, method === "PATCH" ? { hours: 1 } : undefined)).status, 404);
      assert.equal((await send(`/submissions/${uploadedId}/document`, "GET", otherToken)).status, 404);
      assert.equal((await send(`/submissions/${uploadedId}`, "PATCH", volunteerToken, { status: "Aprovado" })).status, 400);
    });

    await context.test("upload recusa formato falso, arquivo ausente e tamanho acima de 5 MB", async () => {
      const upload = (blob?: Blob) => {
        const form = new FormData();
        form.set("title", "Comprovante inválido"); form.set("category", "Ensino"); form.set("hours", "1"); form.set("description", "Descrição da atividade externa.");
        if (blob) form.set("document", blob, "arquivo.pdf");
        return send("/submissions", "POST", volunteerToken, form);
      };
      assert.equal((await upload()).status, 400);
      assert.equal((await upload(new Blob(["conteúdo falso"], { type: "application/pdf" }))).status, 400);
      assert.equal((await upload(new Blob([new Uint8Array(5 * 1024 * 1024 + 1)], { type: "application/pdf" }))).status, 413);
    });

    await context.test("logout revoga somente o JWT da sessão atual", async () => {
      const anotherSession = (await login("voluntario@portal.example")).accessToken;
      const loggedOut = await send("/auth/logout", "POST", anotherSession);
      assert.equal(loggedOut.status, 204);
      assert.equal(await loggedOut.text(), "");
      assert.equal((await send("/auth/session", "GET", anotherSession)).status, 401);
      assert.equal((await send("/auth/session", "GET", volunteerToken)).status, 200);
      assert.ok(await app.get(DataSource).getRepository(SessionEntity).count() > 0);
    });

    await app.close();
    app = await createApplication(environment, false);
    await app.listen(0, "127.0.0.1");
    baseUrl = await app.getUrl();

    await context.test("reinício preserva JWT revogável, presença, certificados, metadados e arquivo", async () => {
      assert.equal((await send("/auth/session", "GET", volunteerToken)).status, 200);
      const saved = await data(await send(`/submissions/${uploadedId}`, "GET", volunteerToken), z.object({ title: z.string(), hours: z.number() }));
      assert.deepEqual(saved, { title: "Comprovante atualizado", hours: 9 });
      assert.equal(await (await send(`/submissions/${uploadedId}/document`, "GET", volunteerToken)).text(), documentBytes);
      const activities = await data(await send("/organizations/activities", "GET", organizationToken), activitiesSchema);
      const activity = activities.find((item) => item.id === "atividade-api");
      assert.equal(activity?.certificatesDispatched, true);
      assert.equal(activity?.participants.find((item) => item.id === participantId)?.status, "Presente");
      assert.equal((await send(`/submissions/${uploadedId}`, "DELETE", volunteerToken)).status, 204);
      assert.equal((await send(`/submissions/${uploadedId}/document`, "GET", volunteerToken)).status, 404);
      assert.deepEqual(await app.get(DataSource).query("PRAGMA foreign_key_check"), []);
    });

    await context.test("limite por conta protege login mesmo com cabeçalhos de IP diferentes", async () => {
      const email = `${randomUUID()}@portal.example`;
      for (let attempt = 0; attempt < 10; attempt += 1) {
        const response = await fetch(`${baseUrl}/api/auth/login`, {
          method: "POST", headers: { "Content-Type": "application/json", "X-Forwarded-For": `192.0.2.${attempt}` },
          body: JSON.stringify({ email, password: "SenhaInexistente" }),
        });
        assert.equal(response.status, 401);
      }
      assert.equal((await send("/auth/login", "POST", undefined, { email, password: "SenhaInexistente" })).status, 429);
    });

    await context.test("logins simultâneos aguardam o bcrypt em fila em vez de responder 429", async () => {
      const emails = ["voluntario", "outro", "organizacao", "organizacao2", "organizacao3"].map((name) => `${name}@portal.example`);
      const responses = await Promise.all(emails.map((email) => send("/auth/login", "POST", undefined, { email, password })));
      assert.deepEqual(responses.map((response) => response.status), emails.map(() => 200));
    });

    await context.test("login correto zera as falhas da conta e cadastro não bloqueia o login", async () => {
      const email = "organizacao4@portal.example";
      const attempt = (secret: string) => send("/auth/login", "POST", undefined, { email, password: secret });
      for (let index = 0; index < 9; index += 1) assert.equal((await attempt("SenhaErrada")).status, 401);
      assert.equal((await attempt(password)).status, 200);
      for (let index = 0; index < 9; index += 1) assert.equal((await attempt("SenhaErrada")).status, 401);
      assert.equal((await attempt(password)).status, 200);
      for (let index = 0; index < 10; index += 1) {
        await send("/auth/register", "POST", undefined, { name: "Repetido", email, password, passwordConfirmation: password });
      }
      assert.equal((await send("/auth/register", "POST", undefined, { name: "Repetido", email, password, passwordConfirmation: password })).status, 429);
      assert.equal((await attempt(password)).status, 200);
    });
  } finally {
    await app.close();
    await rm(directory, { recursive: true, force: true });
  }
});
