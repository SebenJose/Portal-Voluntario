import assert from "node:assert/strict";
import { randomBytes, randomUUID } from "node:crypto";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { after, test } from "node:test";
import { NextRequest } from "next/server";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { z } from "zod";

import { POST as loginRoute } from "@/app/api/auth/login/route";
import { POST as registerRoute } from "@/app/api/auth/register/route";
import { POST as logoutRoute } from "@/app/api/auth/logout/route";
import { POST as enrollRoute, DELETE as cancelEnrollmentRoute } from "@/app/api/opportunities/[id]/registrations/route";
import { createAccount, authenticateAccount } from "@/features/auth/services/accounts";
import { getSafeRedirectPath } from "@/features/auth/services/safe-redirect";
import { createSessionToken, verifySessionToken, revokeSessionToken, SESSION_DURATION_SECONDS } from "@/features/auth/services/session";
import { requireOrganizationRequest, organizationBackendUnavailable } from "@/features/organizations/services/server-authorization";
import { getOpportunityCatalog, enrollInOpportunity } from "@/features/opportunities/services/enrollments";
import { cancellationResponseSchema } from "@/features/opportunities/schemas/opportunity-schema";
import { getAgendaEntries, getNextSessions, agendaDate, dateKey } from "@/features/opportunities/lib/agenda";
import { getDashboardSummary } from "@/features/dashboard/services/dashboard-summary";
import { updateParticipantsAttendance } from "@/features/organizations/services/organization-activities";
import { MAX_AUTH_BODY_BYTES, readAuthJson, requireMutationOrigin, RequestSecurityError } from "@/lib/server/request-security";
import { handlers } from "@/mocks/handlers";

const origin = "http://localhost:3189";
const dataDirectory = mkdtempSync(path.join(tmpdir(), "portal-test-data-"));
process.env.PORTAL_DATA_DIR = dataDirectory;
process.env.PORTAL_ORIGIN = origin;
process.env.SESSION_SECRET = randomBytes(48).toString("base64url");
after(() => rmSync(dataDirectory, { recursive: true, force: true }));

function accountValues(email = `${randomUUID()}@example.test`) {
  const password = randomBytes(18).toString("base64url");
  return { name: "Pessoa de teste", email, password, passwordConfirmation: password };
}

function request(url: string, body?: unknown, cookie?: string, headers: Record<string, string> = {}, method: "POST" | "DELETE" = "POST"): NextRequest {
  return new NextRequest(new URL(url, origin), {
    method,
    headers: { Origin: origin, ...(body === undefined ? {} : { "Content-Type": "application/json" }), ...(cookie ? { Cookie: `portal_session=${cookie}` } : {}), ...headers },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
}

const publicUserSchema = z.object({ user: z.object({ id: z.string(), role: z.literal("volunteer") }) });

test("redirecionamento após login preserva destinos internos, filtros e âncoras", () => {
  for (const destination of ["/painel", "/minhas-atividades", "/certificados?scenario=empty#registrar-certificado", "/oportunidades", "/organizacao"]) {
    assert.equal(getSafeRedirectPath(destination), destination);
  }
});

test("redirecionamento após login rejeita destinos externos e evita retornar a formulários de acesso", () => {
  for (const destination of [undefined, ["/certificados"], "https://attacker.example", "//attacker.example", "/\\attacker.example", "/painel\n", "/entrar", "/entrar?next=%2Fcertificados", "/entrar/", "/criar-conta#cadastro", "/painel/../entrar"]) {
    assert.equal(getSafeRedirectPath(destination), "/painel");
  }
});

test("cadastro novo e duplicado têm a mesma resposta, não autenticam e não permitem role injetado", async () => {
  const values = accountValues();
  const first = await registerRoute(request("/api/auth/register", { ...values, role: "organization" }));
  const duplicate = await registerRoute(request("/api/auth/register", values));
  assert.equal(first.status, 202);
  assert.equal(duplicate.status, 202);
  assert.equal(await first.text(), await duplicate.text());
  assert.equal(first.headers.get("set-cookie"), null);
  assert.equal(duplicate.headers.get("set-cookie"), null);
  const login = await loginRoute(request("/api/auth/login", values));
  assert.equal(login.status, 200);
  assert.equal(publicUserSchema.parse(await login.json()).user.role, "volunteer");
  const cookie = login.headers.get("set-cookie") ?? "";
  assert.match(cookie, /HttpOnly/iu);
  assert.match(cookie, /SameSite=lax/iu);
  assert.equal(login.headers.get("cache-control"), "no-store");
});

test("login, cadastro, logout, inscrição e cancelamento rejeitam origens externas e de outra porta", async () => {
  const values = accountValues();
  for (const attacker of ["https://attacker.example", "http://localhost:3190", "null"]) {
    for (const [route, endpoint] of [[loginRoute, "/api/auth/login"], [registerRoute, "/api/auth/register"], [logoutRoute, "/api/auth/logout"]] satisfies Array<[(input: NextRequest) => Promise<Response>, string]>) {
      const result = await route(request(endpoint, values, undefined, { Origin: attacker }));
      assert.equal(result.status, 403);
    }
    assert.equal((await enrollRoute(request("/api/opportunities/example/registrations", undefined, undefined, { Origin: attacker }), { params: Promise.resolve({ id: "example" }) })).status, 403);
    assert.equal((await cancelEnrollmentRoute(request("/api/opportunities/example/registrations", undefined, undefined, { Origin: attacker }, "DELETE"), { params: Promise.resolve({ id: "example" }) })).status, 403);
  }
  assert.throws(() => requireMutationOrigin(new Request(origin, { method: "POST" })), (error: unknown) => error instanceof RequestSecurityError && error.status === 403);
});

test("JSON exige Content-Type e limita o corpo mesmo sem Content-Length", async () => {
  assert.equal((await loginRoute(request("/api/auth/login", accountValues(), undefined, { "Content-Type": "text/plain" }))).status, 415);
  assert.equal((await registerRoute(request("/api/auth/register", { ...accountValues(), padding: "x".repeat(MAX_AUTH_BODY_BYTES) }))).status, 413);
  const body = new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(new Uint8Array(MAX_AUTH_BODY_BYTES));
      controller.enqueue(new Uint8Array(1));
      controller.close();
    },
  });
  const streamed = new NextRequest(origin, { method: "POST", headers: { "Content-Type": "application/json" }, body, duplex: "half" });
  await assert.rejects(readAuthJson(streamed), (error: unknown) => error instanceof RequestSecurityError && error.status === 413);
});

test("leitura lenta do corpo é cancelada com 408", async (context) => {
  context.mock.timers.enable({ apis: ["setTimeout"] });
  const input = new NextRequest(origin, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: new ReadableStream<Uint8Array>(),
    duplex: "half",
  });
  const rejected = assert.rejects(readAuthJson(input), (error: unknown) =>
    error instanceof RequestSecurityError && error.status === 408,
  );
  context.mock.timers.tick(5000);
  await rejected;
});

test("tokens assinados dependem de sessão persistida; logout revoga só a sessão atual", async () => {
  const user = await createAccount(accountValues());
  const current = await createSessionToken(user);
  const otherDevice = await createSessionToken(user);
  assert.equal((await verifySessionToken(current.token))?.id, user.id);
  assert.equal((await logoutRoute(request("/api/auth/logout", undefined, current.token))).status, 204);
  assert.equal(await verifySessionToken(current.token), null);
  assert.equal((await verifySessionToken(otherDevice.token))?.id, user.id);
  assert.equal((await enrollRoute(request("/api/opportunities/horta-comunitaria/registrations", undefined, current.token), { params: Promise.resolve({ id: "horta-comunitaria" }) })).status, 401);
  await revokeSessionToken(otherDevice.token);
  assert.equal(await verifySessionToken(otherDevice.token), null);
  assert.equal(await verifySessionToken(`${current.token}x`), null);
});

test("tokens antigos com identidade embutida e nenhuma sessão persistida são inválidos", async () => {
  const now = Math.floor(Date.now() / 1000);
  const payload = Buffer.from(JSON.stringify({ user: { id: "demo-voluntario-001", name: "Conta antiga", email: "obsolete@example.test", role: "volunteer" }, issuedAt: now, expiresAt: now + 1000 })).toString("base64url");
  const { createHmac } = await import("node:crypto");
  const signature = createHmac("sha256", process.env.SESSION_SECRET ?? "").update(payload).digest("base64url");
  assert.equal(await verifySessionToken(`${payload}.${signature}`), null);
  assert.equal(await authenticateAccount({ email: "nonexistent@example.test", password: "SenhaInexistente" }), null);
});

test("sessões futuras, expiradas ou verificadas sem segredo falham de forma fechada", async () => {
  const user = await createAccount(accountValues());
  const session = await createSessionToken(user);
  const now = Date.now;
  const secret = process.env.SESSION_SECRET;
  try {
    Date.now = () => now() + (SESSION_DURATION_SECONDS + 1) * 1000;
    assert.equal(await verifySessionToken(session.token), null);
    Date.now = () => now() + 30_000;
    const future = await createSessionToken(user);
    Date.now = now;
    assert.equal(await verifySessionToken(future.token), null);
    delete process.env.SESSION_SECRET;
    assert.equal(await verifySessionToken(session.token), null);
    await assert.rejects(createSessionToken(user));
  } finally {
    Date.now = now;
    if (secret !== undefined) process.env.SESSION_SECRET = secret;
  }
});

test("identidade atual da conta controla autorização e contas removidas perdem acesso", async () => {
  const user = await createAccount(accountValues());
  const session = await createSessionToken(user);
  await assert.rejects(requireOrganizationRequest(request("/api/organizations/activities", undefined, session.token)), (error: unknown) => error instanceof RequestSecurityError && error.status === 403);
  assert.equal((await organizationBackendUnavailable(request("/api/organizations/activities"))).status, 401);
  const file = path.join(dataDirectory, "accounts.json");
  const accounts = z.array(z.object({ user: z.object({ id: z.string(), name: z.string(), email: z.string(), role: z.enum(["volunteer", "organization"]) }), salt: z.string(), passwordHash: z.string() })).parse(JSON.parse(readFileSync(file, "utf8")));
  const account = accounts.find((item) => item.user.id === user.id);
  assert.ok(account);
  account.user.role = "organization";
  writeFileSync(file, JSON.stringify(accounts));
  assert.equal((await requireOrganizationRequest(request("/api/organizations/activities", undefined, session.token))).role, "organization");
  assert.equal((await organizationBackendUnavailable(request("/api/organizations/activities", undefined, session.token))).status, 501);
  writeFileSync(file, JSON.stringify(accounts.filter((item) => item.user.id !== user.id)));
  assert.equal(await verifySessionToken(session.token), null);
});

test("painel novo começa vazio e inscrições não atravessam usuários nem concedem horas", async () => {
  const first = await createAccount(accountValues());
  const second = await createAccount(accountValues());
  const empty = getDashboardSummary(first.id);
  assert.equal(empty.registrations, 0);
  assert.deepEqual(empty.upcomingActivities, []);
  assert.ok(empty.hoursSummary.every((item) => item.completed === 0));
  enrollInOpportunity(first.id, "horta-comunitaria");
  assert.equal(getDashboardSummary(first.id).registrations, 1);
  assert.equal(getDashboardSummary(second.id).registrations, 0);
  assert.deepEqual(getOpportunityCatalog(second.id).registeredIds, []);
  assert.ok(getDashboardSummary(first.id).hoursSummary.every((item) => item.completed === 0));
  assert.throws(() => enrollInOpportunity(first.id, "horta-comunitaria"));
});

test("cancelamento exige sessão, preserva outras contas, libera vaga e permite reinscrição", async () => {
  const first = await createAccount(accountValues());
  const second = await createAccount(accountValues());
  const firstSession = await createSessionToken(first);
  const secondSession = await createSessionToken(second);
  const id = "monitoria-programacao";
  const endpoint = `/api/opportunities/${id}/registrations`;
  const context = { params: Promise.resolve({ id }) };
  const before = getOpportunityCatalog().items.find((item) => item.id === id);
  assert.ok(before);
  enrollInOpportunity(first.id, id);
  assert.equal((await cancelEnrollmentRoute(request(endpoint, undefined, undefined, {}, "DELETE"), context)).status, 401);
  assert.equal((await cancelEnrollmentRoute(request(endpoint, undefined, secondSession.token, {}, "DELETE"), context)).status, 404);
  assert.deepEqual(getOpportunityCatalog(first.id).registeredIds, [id]);
  enrollInOpportunity(second.id, id);

  const response = await cancelEnrollmentRoute(request(endpoint, undefined, firstSession.token, {}, "DELETE"), context);
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("cache-control"), "no-store");
  assert.deepEqual(cancellationResponseSchema.parse(await response.json()), {
    opportunityId: id, registered: false, enrolled: before.enrolled + 1,
  });
  assert.deepEqual(getOpportunityCatalog(first.id).registeredIds, []);
  assert.deepEqual(getOpportunityCatalog(second.id).registeredIds, [id]);
  assert.equal(getDashboardSummary(first.id).registrations, 0);
  assert.equal(getDashboardSummary(second.id).registrations, 1);
  assert.equal((await cancelEnrollmentRoute(request(endpoint, undefined, firstSession.token, {}, "DELETE"), context)).status, 404);
  assert.equal((await cancelEnrollmentRoute(request(endpoint, undefined, firstSession.token, {}, "DELETE"), { params: Promise.resolve({ id: "inexistente" }) })).status, 404);
  assert.equal(enrollInOpportunity(first.id, id).enrolled, before.enrolled + 2);
  await revokeSessionToken(firstSession.token);
  assert.equal((await cancelEnrollmentRoute(request(endpoint, undefined, firstSession.token, {}, "DELETE"), context)).status, 401);
  assert.deepEqual(getOpportunityCatalog(first.id).registeredIds, [id]);
});

test("agenda conserva recorrências e datas locais e exclui encontros já encerrados", () => {
  const activity = getOpportunityCatalog().items.find((item) => item.id === "horta-comunitaria");
  assert.ok(activity);
  const entries = getAgendaEntries([activity]);
  assert.deepEqual(entries.map((entry) => entry.date), ["2026-10-17", "2026-10-24", "2026-10-31", "2026-11-07", "2026-11-14"]);
  for (const entry of entries) assert.equal(dateKey(agendaDate(entry.date)), entry.date);
  assert.equal(getNextSessions(entries, new Date("2026-10-17T12:00:00")).length, 5);
  assert.equal(getNextSessions(entries, new Date("2026-10-17T12:00:01")).length, 4);
  assert.deepEqual(getNextSessions(entries, new Date("2026-11-14T12:00:01")), []);
  assert.deepEqual(getAgendaEntries([]), []);
});

test("rate limiting devolve 429 com Retry-After para conta inexistente", async () => {
  const credentials = { email: `${randomUUID()}@example.test`, password: "SenhaInexistente" };
  for (let index = 0; index < 10; index += 1) {
    assert.equal((await loginRoute(request("/api/auth/login", credentials))).status, 401);
  }
  const limited = await loginRoute(request("/api/auth/login", credentials));
  assert.equal(limited.status, 429);
  assert.ok(Number(limited.headers.get("retry-after")) > 0);
});

test("limite por e-mail também protege conta existente", async () => {
  const values = accountValues();
  await createAccount(values);
  for (let index = 0; index < 10; index += 1) {
    assert.equal((await loginRoute(request("/api/auth/login", { email: values.email, password: "SenhaErrada" }))).status, 401);
  }
  assert.equal((await loginRoute(request("/api/auth/login", values))).status, 429);
});

test("orçamento agregado não pode ser contornado trocando cabeçalhos de IP", async () => {
  let limited = false;
  for (let index = 0; index <= 30; index += 1) {
    const response = await loginRoute(request("/api/auth/login", {}, undefined, { "X-Forwarded-For": `192.0.2.${index}` }));
    if (response.status === 429) {
      limited = true;
      break;
    }
    assert.equal(response.status, 400);
  }
  assert.equal(limited, true);
});

test("lote aguarda todos, mantém sucessos e identifica falhas para retry", async () => {
  const originalFetch = globalThis.fetch;
  let lateCompleted = false;
  globalThis.fetch = async (input) => {
    if (String(input).includes("/failure")) return new Response(null, { status: 500 });
    await new Promise<void>((resolve) => setTimeout(resolve, 30));
    lateCompleted = true;
    return Response.json({ participant: { id: "success", name: "Teste", email: "test@example.test", registeredAt: "Hoje", status: "Presente" } });
  };
  try {
    const result = await updateParticipantsAttendance("activity", ["failure", "success"], "Presente");
    assert.equal(lateCompleted, true);
    assert.deepEqual(result.failedIds, ["failure"]);
    assert.deepEqual(result.updated.map((item) => item.id), ["success"]);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("MSW permite demo pública isolada e exige papel na gestão de organizações", async () => {
  let identity: { id: string; name: string; email: string; role: "organization" | "volunteer" } | null = null;
  let sessionRequests = 0;
  const server = setupServer(...handlers);
  const locationDescriptor = Object.getOwnPropertyDescriptor(globalThis, "location");
  Object.defineProperty(globalThis, "location", { value: new URL(origin), configurable: true });
  server.listen({ onUnhandledFrame: "error" });
  // Override passthrough only in this test: the real session endpoint is tested separately.
  server.use(http.get(`${origin}/api/auth/session`, () => {
    sessionRequests += 1;
    return identity ? HttpResponse.json({ user: identity }) : new HttpResponse(null, { status: 401 });
  }));
  const interceptedFetch = globalThis.fetch;
  globalThis.fetch = (input, init) => interceptedFetch(typeof input === "string" ? new URL(input, origin) : input, init);
  try {
    const demoEndpoint = "/api/demo/organizations/activities";
    assert.equal((await fetch(demoEndpoint)).status, 200);
    assert.equal((await fetch(`${demoEndpoint}/horta-comunitaria/participants/p-002`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: "Presente" }) })).status, 200);
    assert.equal((await fetch(`${demoEndpoint}/horta-comunitaria/participants/p-002`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: "Inválido" }) })).status, 400);
    assert.equal((await fetch(`${demoEndpoint}/horta-comunitaria/certificates`, { method: "POST" })).status, 201);
    assert.equal((await fetch(`${demoEndpoint}/horta-comunitaria/participants/p-001`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: "Ausente" }) })).status, 409);
    assert.equal(sessionRequests, 0);
    assert.equal((await fetch("/api/organizations/activities")).status, 401);
    identity = { id: randomUUID(), name: "Teste", email: "test@example.test", role: "volunteer" };
    assert.equal((await fetch("/api/organizations/activities")).status, 403);
    assert.equal((await fetch("/api/organizations/activities/horta-comunitaria/certificates", { method: "POST" })).status, 403);
    assert.equal((await fetch("/api/organizations/activities/horta-comunitaria/participants/p-001", { method: "PATCH", body: JSON.stringify({ status: "Presente" }) })).status, 403);
    identity.role = "organization";
    const organizationResponse = await fetch("/api/organizations/activities");
    assert.equal(organizationResponse.status, 200);
    const organizationActivities = z.array(z.object({ id: z.string(), certificatesDispatched: z.boolean(), participants: z.array(z.object({ id: z.string(), status: z.string() })) })).parse(await organizationResponse.json());
    const organizationActivity = organizationActivities.find((activity) => activity.id === "horta-comunitaria");
    assert.ok(organizationActivity);
    assert.equal(organizationActivity.certificatesDispatched, false);
    assert.equal(organizationActivity.participants.find((participant) => participant.id === "p-002")?.status, "Inscrito");
    assert.equal((await fetch("/api/organizations/activities/horta-comunitaria/certificates", { method: "POST" })).status, 201);
    assert.equal((await fetch("/api/organizations/activities/horta-comunitaria/participants/p-001", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: "Ausente" }) })).status, 409);
    assert.equal((await fetch("/api/organizations/activities/horta-comunitaria/certificates", { method: "POST" })).status, 409);
    identity.id = randomUUID();
    assert.equal((await fetch("/api/organizations/activities/horta-comunitaria/certificates", { method: "POST" })).status, 201);
  } finally {
    globalThis.fetch = interceptedFetch;
    server.close();
    if (locationDescriptor) Object.defineProperty(globalThis, "location", locationDescriptor);
    else Reflect.deleteProperty(globalThis, "location");
  }
});
