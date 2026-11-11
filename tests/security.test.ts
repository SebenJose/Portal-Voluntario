import assert from "node:assert/strict";
import { randomBytes, randomUUID } from "node:crypto";
import { mkdtempSync, rmSync } from "node:fs";
import { spawn, spawnSync, type ChildProcess } from "node:child_process";
import { once } from "node:events";
import { createServer } from "node:net";
import { tmpdir } from "node:os";
import path from "node:path";
import { after, before, test } from "node:test";
import { NextRequest } from "next/server";
import { setupServer } from "msw/node";
import { z } from "zod";
import { POST as loginRoute } from "@/app/api/auth/login/route";
import { POST as registerRoute } from "@/app/api/auth/register/route";
import { POST as logoutRoute } from "@/app/api/auth/logout/route";
import { GET as sessionRoute } from "@/app/api/auth/session/route";
import { GET as catalogRoute } from "@/app/api/opportunities/route";
import { GET as dashboardRoute } from "@/app/api/dashboard/route";
import { POST as enrollRoute, DELETE as cancelEnrollmentRoute } from "@/app/api/opportunities/[id]/registrations/route";
import { GET as organizationsRoute } from "@/app/api/organizations/activities/route";
import { POST as submissionsRoute, GET as certificateListRoute } from "@/app/api/submissions/route";
import { GET as documentRoute } from "@/app/api/submissions/[id]/document/route";
import { DELETE as deleteSubmissionRoute } from "@/app/api/submissions/[id]/route";
import { getSafeRedirectPath } from "@/features/auth/services/safe-redirect";
import { verifySessionToken } from "@/features/auth/services/session";
import { cancellationResponseSchema, opportunitiesResponseSchema, opportunitySchema } from "@/features/opportunities/schemas/opportunity-schema";
import { opportunities } from "@/features/opportunities/data/opportunities";
import { getAgendaEntries, getNextSessions, agendaDate, dateKey } from "@/features/opportunities/lib/agenda";
import { dashboardSummarySchema } from "@/features/dashboard/schemas/dashboard-schema";
import { dashboardPresentationSchema } from "@/features/dashboard/schemas/presentation-schema";
import { updateParticipantsAttendance } from "@/features/organizations/services/organization-activities";
import { certificateRecordSchema } from "@/features/certificates/schemas/certificate-schema";
import { BackendApiError } from "@/lib/server/backend-api";
import { newPasswordSchema } from "@/features/auth/schemas/password-schema";
import { MAX_AUTH_BODY_BYTES, readAuthJson, requireMutationOrigin, RequestSecurityError } from "@/lib/server/request-security";
import { handlers } from "@/mocks/handlers";

const origin = "http://localhost:3189";
const directory = mkdtempSync(path.join(tmpdir(), "portal-bff-"));
const password = randomBytes(18).toString("base64url");
let api: ChildProcess | undefined;
let apiUrl = "";
let token = "";
let otherToken = "";

function accountValues(email = `${randomUUID()}@example.test`) {
  return { name: "Pessoa de teste", email, password, passwordConfirmation: password };
}

function request(url: string, body?: unknown, cookie?: string, headers: Record<string, string> = {}, method: "GET" | "POST" | "PATCH" | "DELETE" = "POST"): NextRequest {
  const form = body instanceof FormData;
  return new NextRequest(new URL(url, origin), {
    method,
    headers: { Origin: origin, ...(body !== undefined && !form ? { "Content-Type": "application/json" } : {}), ...(cookie ? { Cookie: `portal_session=${cookie}` } : {}), ...headers },
    body: body instanceof FormData ? body : body === undefined ? undefined : JSON.stringify(body),
  });
}

async function login(email: string): Promise<string> {
  const response = await loginRoute(request("/api/auth/login", { email, password }));
  assert.equal(response.status, 200);
  const raw: unknown = await response.json();
  z.object({ user: z.object({ id: z.uuid(), role: z.string() }) }).parse(raw);
  assert.equal("accessToken" in z.record(z.string(), z.unknown()).parse(raw), false);
  const cookie = response.headers.get("set-cookie") ?? "";
  assert.match(cookie, /HttpOnly/iu);
  assert.match(cookie, /SameSite=lax/iu);
  assert.equal(response.headers.get("cache-control"), "no-store");
  const value = /^portal_session=([^;]+)/u.exec(cookie)?.[1];
  assert.ok(value);
  return value;
}

before(async () => {
  const reservation = createServer();
  reservation.listen(0, "127.0.0.1");
  await once(reservation, "listening");
  const address = reservation.address();
  assert.ok(address && typeof address === "object");
  const port = address.port;
  await new Promise<void>((resolve) => reservation.close(() => resolve()));
  const environment = { ...process.env, JWT_SECRET: randomBytes(32).toString("hex"), API_PORT: String(port), DATABASE_PATH: path.join(directory, "bff.sqlite"), SEED_PASSWORD: password };
  const seed = spawnSync(process.execPath, ["--env-file-if-exists=backend/.env", "backend/dist/database/cli.js", "seed"], { env: environment, encoding: "utf8" });
  assert.equal(seed.status, 0, seed.stderr);
  api = spawn(process.execPath, ["backend/dist/main.js"], { env: environment, stdio: "pipe" });
  let logs = "";
  api.stderr?.on("data", (chunk: unknown) => { if (Buffer.isBuffer(chunk)) logs += chunk.toString(); });
  api.stdout?.resume();
  apiUrl = `http://127.0.0.1:${port}/api`;
  for (let attempt = 0; attempt < 80; attempt += 1) {
    if (api.exitCode !== null) throw new Error(`API de teste não iniciou: ${logs}`);
    try { if ((await fetch(`${apiUrl}/health`)).ok) break; } catch { /* Wait for our test server to listen. */ }
    await new Promise<void>((resolve) => setTimeout(resolve, 100));
  }
  process.env.BACKEND_API_URL = apiUrl;
  process.env.PORTAL_ORIGIN = origin;
  token = await login("voluntario@portal.example");
  otherToken = await login("outro@portal.example");
});

after(async () => {
  if (api && api.exitCode === null) {
    const stopped = once(api, "exit");
    api.kill("SIGTERM");
    const timer = setTimeout(() => api?.kill("SIGKILL"), 3000);
    await stopped;
    clearTimeout(timer);
  }
  rmSync(directory, { recursive: true, force: true });
});

test("validação da senha conta caracteres Unicode e respeita os 72 bytes do bcrypt", () => {
  assert.equal(newPasswordSchema.safeParse("😀".repeat(4)).success, false);
  assert.equal(newPasswordSchema.safeParse("😀".repeat(8)).success, true);
  assert.equal(newPasswordSchema.safeParse("a".repeat(72)).success, true);
  assert.equal(newPasswordSchema.safeParse("a".repeat(73)).success, false);
  assert.equal(newPasswordSchema.safeParse("😀".repeat(19)).success, false);
});

test("cadastro e login atravessam Next e Nest sem expor JWT no corpo", async () => {
  const values = accountValues();
  const first = await registerRoute(request("/api/auth/register", { ...values, role: "organization" }));
  const duplicate = await registerRoute(request("/api/auth/register", values));
  assert.equal(first.status, 202);
  assert.equal(duplicate.status, 202);
  assert.equal(await first.text(), await duplicate.text());
  assert.equal(first.headers.get("set-cookie"), null);
  const current = await login(values.email);
  assert.equal((await verifySessionToken(current))?.role, "volunteer");
  assert.equal((await sessionRoute(request("/api/auth/session", undefined, current, {}, "GET"))).status, 200);
  const invalid = { ...values, password: "😀".repeat(30), passwordConfirmation: "😀".repeat(30) };
  assert.equal((await registerRoute(request("/api/auth/register", invalid))).status, 400);
});

test("sessão HttpOnly é revogável; logout não encerra outras sessões da conta", async () => {
  const disposable = await login("voluntario@portal.example");
  const response = await logoutRoute(request("/api/auth/logout", undefined, disposable));
  assert.equal(response.status, 204);
  assert.match(response.headers.get("set-cookie") ?? "", /Max-Age=0/u);
  assert.equal(await verifySessionToken(disposable), null);
  assert.ok(await verifySessionToken(token));
  assert.equal(await verifySessionToken(`${token}x`), null);
  assert.equal((await sessionRoute(request("/api/auth/session", undefined, undefined, {}, "GET"))).status, 401);
});

test("catálogo, inscrições e painel usam a API real e isolam contas", async () => {
  const id = "dados-abertos";
  const routeContext = { params: Promise.resolve({ id }) };
  const before = opportunitiesResponseSchema.parse(await (await catalogRoute(request("/api/opportunities", undefined, token, {}, "GET"))).json());
  assert.equal(before.items.length, 5);
  assert.equal(before.items.find((item) => item.id === id)?.enrolled, 0);
  assert.equal((await enrollRoute(request(`/api/opportunities/${id}/registrations`, undefined, token), routeContext)).status, 201);
  assert.equal((await enrollRoute(request(`/api/opportunities/${id}/registrations`, undefined, token), routeContext)).status, 409);
  const own = dashboardSummarySchema.parse(await (await dashboardRoute(request("/api/dashboard", undefined, token, {}, "GET"))).json());
  const other = dashboardSummarySchema.parse(await (await dashboardRoute(request("/api/dashboard", undefined, otherToken, {}, "GET"))).json());
  assert.equal(own.registrations, 3);
  assert.equal(other.registrations, 0);
  assert.ok(own.hoursSummary.every((item) => item.completed === 0));
  const cancelled = await cancelEnrollmentRoute(request(`/api/opportunities/${id}/registrations`, undefined, token, {}, "DELETE"), routeContext);
  assert.deepEqual(cancellationResponseSchema.parse(await cancelled.json()), { opportunityId: id, enrolled: 0, registered: false });
  assert.equal((await cancelEnrollmentRoute(request(`/api/opportunities/${id}/registrations`, undefined, token, {}, "DELETE"), routeContext)).status, 404);
  assert.equal((await organizationsRoute(request("/api/organizations/activities", undefined, token, {}, "GET"))).status, 403);
});

test("upload e download passam pelo Next e persistem no SQLite com autorização", async () => {
  const bytes = "%PDF-1.4\nArquivo original do teste.\n%%EOF";
  const body = new FormData();
  body.set("title", "Comprovante do teste"); body.set("category", "Ensino"); body.set("hours", "3");
  body.set("description", "Atividade externa para teste de integração.");
  body.set("document", new Blob([bytes], { type: "application/pdf" }), "comprovante.pdf");
  const response = await submissionsRoute(request("/api/submissions", body, token));
  assert.equal(response.status, 201);
  const saved = certificateRecordSchema.parse(await response.json());
  const routeContext = { params: Promise.resolve({ id: saved.id }) };
  const original = await documentRoute(request(`/api/submissions/${saved.id}/document`, undefined, token, {}, "GET"), routeContext);
  assert.equal(original.status, 200);
  assert.equal(await original.text(), bytes);
  assert.equal((await documentRoute(request(`/api/submissions/${saved.id}/document`, undefined, otherToken, {}, "GET"), routeContext)).status, 404);
  const listed: unknown = await (await certificateListRoute(request("/api/submissions", undefined, token, {}, "GET"))).json();
  assert.equal(z.object({ items: z.array(certificateRecordSchema) }).parse(listed).items.length, 1);
  assert.equal((await deleteSubmissionRoute(request(`/api/submissions/${saved.id}`, undefined, token, {}, "DELETE"), routeContext)).status, 204);
  assert.equal((await documentRoute(request(`/api/submissions/${saved.id}/document`, undefined, token, {}, "GET"), routeContext)).status, 404);
});

test("indisponibilidade e contrato inválido são apresentados sem fallback local", async () => {
  const originalFetch = globalThis.fetch;
  try {
    globalThis.fetch = async () => { throw new TypeError("Falha de rede simulada"); };
    assert.equal((await catalogRoute(request("/api/opportunities", undefined, token, {}, "GET"))).status, 503);
    await assert.rejects(verifySessionToken(token), (error: unknown) => error instanceof BackendApiError && error.status === 503);
    globalThis.fetch = async () => Response.json({ data: { items: "inválido" } });
    assert.equal((await catalogRoute(request("/api/opportunities", undefined, undefined, {}, "GET"))).status, 502);
  } finally { globalThis.fetch = originalFetch; }
});

test("MSW intercepta apenas demonstrações e não substitui operações da conta", async () => {
  const server = setupServer(...handlers);
  const locationDescriptor = Object.getOwnPropertyDescriptor(globalThis, "location");
  Object.defineProperty(globalThis, "location", { value: new URL(origin), configurable: true });
  server.listen({ onUnhandledFrame: "error" });
  try {
    const presentation = dashboardPresentationSchema.parse(await (await fetch(`${origin}/api/demo/dashboard`)).json());
    assert.equal(presentation.completedActivities.length, 3);
    const demo = await fetch(`${origin}/api/demo/organizations/activities`);
    assert.equal(demo.status, 200);
    assert.ok(handlers.every((handler) => handler.info.header.includes("/api/demo/")));
    assert.equal((await fetch(`${origin}/api/demo/dashboard?scenario=server-error`)).status, 500);
    await assert.rejects(fetch(`${origin}/api/demo/dashboard?scenario=network-error`));
  } finally {
    server.close();
    if (locationDescriptor) Object.defineProperty(globalThis, "location", locationDescriptor);
    else Reflect.deleteProperty(globalThis, "location");
  }
});

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

test("agenda conserva recorrências e datas locais e exclui encontros já encerrados", () => {
  const activity = z.array(opportunitySchema).parse(opportunities).find((item) => item.id === "horta-comunitaria");
  assert.ok(activity);
  const entries = getAgendaEntries([activity]);
  assert.deepEqual(entries.map((entry) => entry.date), ["2026-10-17", "2026-10-24", "2026-10-31", "2026-11-07", "2026-11-14"]);
  for (const entry of entries) assert.equal(dateKey(agendaDate(entry.date)), entry.date);
  assert.equal(getNextSessions(entries, new Date("2026-10-17T12:00:00")).length, 5);
  assert.equal(getNextSessions(entries, new Date("2026-10-17T12:00:01")).length, 4);
  assert.deepEqual(getNextSessions(entries, new Date("2026-11-14T12:00:01")), []);
  assert.deepEqual(getAgendaEntries([]), []);
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
