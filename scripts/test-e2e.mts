import { spawn, spawnSync, type ChildProcess } from "node:child_process";
import { randomBytes } from "node:crypto";
import { once } from "node:events";
import { mkdtemp, rm } from "node:fs/promises";
import { createServer } from "node:net";
import { tmpdir } from "node:os";
import path from "node:path";

async function freePort(): Promise<number> {
  const server = createServer();
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  const address = server.address();
  if (!address || typeof address === "string") throw new Error("Porta de teste indisponível.");
  await new Promise<void>((resolve) => server.close(() => resolve()));
  return address.port;
}

async function ready(url: string, process: ChildProcess): Promise<void> {
  for (let attempt = 0; attempt < 100; attempt += 1) {
    if (process.exitCode !== null) throw new Error("Um servidor de teste encerrou antes de iniciar.");
    try { if ((await fetch(url, { signal: AbortSignal.timeout(1000) })).ok) return; } catch { /* Our server is starting. */ }
    await new Promise<void>((resolve) => setTimeout(resolve, 150));
  }
  throw new Error("O servidor de teste não respondeu no prazo.");
}

async function stop(child: ChildProcess | undefined): Promise<void> {
  if (!child || child.exitCode !== null) return;
  const exit = once(child, "exit");
  const timer = setTimeout(() => child.kill("SIGKILL"), 3000);
  child.kill("SIGTERM");
  await exit;
  clearTimeout(timer);
}

const directory = await mkdtemp(path.join(tmpdir(), "portal-browser-tests-"));
let backend: ChildProcess | undefined;
let frontend: ChildProcess | undefined;
try {
  const apiPort = await freePort();
  let webPort = await freePort();
  while (apiPort === webPort) webPort = await freePort();
  const password = randomBytes(18).toString("base64url");
  const baseUrl = `http://127.0.0.1:${webPort}`;
  const apiUrl = `http://127.0.0.1:${apiPort}/api`;
  const environment = { ...process.env, JWT_SECRET: randomBytes(32).toString("hex"), API_PORT: String(apiPort),
    DATABASE_PATH: path.join(directory, "e2e.sqlite"), SEED_PASSWORD: password, BACKEND_API_URL: apiUrl,
    PORTAL_ORIGIN: baseUrl, E2E_BASE_URL: baseUrl, E2E_SEED_PASSWORD: password, NEXT_PUBLIC_API_MOCKING: "disabled" };
  const seed = spawnSync(process.execPath, ["backend/dist/database/cli.js", "seed"], { env: environment, encoding: "utf8" });
  if (seed.status !== 0) throw new Error(`Não foi possível criar o banco dos testes. ${seed.stderr}`);
  backend = spawn(process.execPath, ["backend/dist/main.js"], { env: environment, stdio: ["ignore", "ignore", "inherit"] });
  await ready(`${apiUrl}/health`, backend);
  frontend = spawn(process.execPath, ["node_modules/next/dist/bin/next", "start", "--hostname", "127.0.0.1", "--port", String(webPort)], { env: environment, stdio: ["ignore", "ignore", "inherit"] });
  await ready(`${baseUrl}/entrar`, frontend);
  const browser = spawn("pnpm", ["exec", "playwright", "test", ...process.argv.slice(2)], { env: environment, stdio: "inherit" });
  const [code] = await once(browser, "exit");
  process.exitCode = typeof code === "number" ? code : 1;
} finally {
  await stop(frontend);
  await stop(backend);
  await rm(directory, { recursive: true, force: true });
}
