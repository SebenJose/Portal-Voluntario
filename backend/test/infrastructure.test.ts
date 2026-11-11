import "reflect-metadata";

import { strict as assert } from "node:assert";
import { mkdtemp, readFile, rm, stat } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { randomBytes } from "node:crypto";
import { Body, Controller, Delete, Get, HttpCode, type INestApplication, type LoggerService, Module, Post, StreamableFile } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { IsString, MinLength } from "class-validator";
import { DataSource } from "typeorm";
import { z } from "zod";

import { AppModule } from "@/app.module";
import { configureApplication, createApplication } from "@/application";
import { loadEnvironment } from "@/config/environment";
import { Public } from "@/features/auth/auth-context";

class TestLogger implements LoggerService {
  readonly records: unknown[] = [];
  log(message: unknown): void { this.records.push(message); }
  error(message: unknown): void { this.records.push(message); }
  warn(message: unknown): void { this.records.push(message); }
}

class ProbeDto {
  @IsString()
  @MinLength(3)
  name: string = "";
}

// Test-only routes exercise global configuration without adding fictitious product endpoints.
@Controller("__probe")
@Public()
class ProbeController {
  @Post()
  create(@Body() input: ProbeDto): { name: string } { return { name: input.name }; }

  @Delete()
  @HttpCode(204)
  remove(): void {}

  @Get("file")
  file(): StreamableFile {
    return new StreamableFile(Buffer.from("%PDF-probe"), { type: "application/pdf" });
  }

  @Get("failure")
  fail(): never { throw new Error("senha-interna-nao-publica"); }
}

@Module({})
class TestRootModule {}

async function readJson(response: Response): Promise<unknown> {
  return response.json();
}

test("infraestrutura HTTP real, SQLite em arquivo e reinicialização", async (context) => {
  const directory = await mkdtemp(join(tmpdir(), "portal-api-test-"));
  const databasePath = join(directory, "nested", "portal.sqlite");
  const JWT_SECRET = randomBytes(32).toString("hex");
  const environment = loadEnvironment({ DATABASE_PATH: databasePath, JWT_SECRET });
  const logger = new TestLogger();
  let app: INestApplication | undefined;

  try {
    app = await NestFactory.create({
      module: TestRootModule,
      imports: [AppModule.register(environment)],
      controllers: [ProbeController],
    }, { logger, abortOnError: false });
    configureApplication(app, environment);
    await app.listen(0, "127.0.0.1");
    const baseUrl = await app.getUrl();
    const database = app.get(DataSource);

    await context.test("health consulta SQLite de verdade, sem cache", async () => {
      const response = await fetch(`${baseUrl}/api/health`);
      assert.equal(response.status, 200);
      assert.equal(response.headers.get("cache-control"), "no-store");
      assert.deepEqual(await readJson(response), { data: { status: "ok", database: "up" } });
      // SQLite can leave a newly opened database empty until its first write.
      assert.ok((await stat(databasePath)).isFile());
    });

    await context.test("sucesso mantém 201; DTO rejeita campo extra e valores inválidos", async () => {
      const create = (body: unknown): Promise<Response> => fetch(`${baseUrl}/api/__probe`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const valid = await create({ name: "Portal" });
      assert.equal(valid.status, 201);
      assert.deepEqual(await readJson(valid), { data: { name: "Portal" } });
      for (const body of [{ name: "a" }, {}, { name: 123 }, { name: "Portal", role: "organization" }]) {
        const invalid = await create(body);
        assert.equal(invalid.status, 400);
        const result = z.object({
          statusCode: z.literal(400), error: z.literal("Bad Request"),
          message: z.string(), details: z.array(z.string()).min(1),
        }).parse(await readJson(invalid));
        assert.equal(result.message, "Confira os dados enviados.");
      }
    });

    await context.test("JSON malformado é erro 400 padronizado", async () => {
      const response = await fetch(`${baseUrl}/api/__probe`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: "{",
      });
      assert.equal(response.status, 400);
      z.object({ statusCode: z.literal(400), error: z.literal("Bad Request"), message: z.string() })
        .parse(await readJson(response));
    });

    await context.test("204 permanece sem corpo e arquivo não recebe envelope JSON", async () => {
      const empty = await fetch(`${baseUrl}/api/__probe`, { method: "DELETE" });
      assert.equal(empty.status, 204);
      assert.equal(await empty.text(), "");
      const file = await fetch(`${baseUrl}/api/__probe/file`);
      assert.equal(file.status, 200);
      assert.equal(file.headers.get("content-type"), "application/pdf");
      assert.equal(await file.text(), "%PDF-probe");
    });

    await context.test("404 padronizado e 500 sem vazamento de erro interno", async () => {
      const missing = await fetch(`${baseUrl}/api/missing`);
      assert.equal(missing.status, 404);
      z.object({ statusCode: z.literal(404), error: z.literal("Not Found"), message: z.string() })
        .parse(await readJson(missing));
      const failure = await fetch(`${baseUrl}/api/__probe/failure`);
      assert.equal(failure.status, 500);
      assert.deepEqual(await readJson(failure), {
        statusCode: 500, error: "Internal Server Error", message: "O serviço está indisponível. Tente novamente.",
      });
    });

    await context.test("CORS aceita somente origens configuradas, incluindo preflight", async () => {
      const allowed = await fetch(`${baseUrl}/api/health`, { headers: { Origin: "http://localhost:3000" } });
      assert.equal(allowed.headers.get("access-control-allow-origin"), "http://localhost:3000");
      const denied = await fetch(`${baseUrl}/api/health`, { headers: { Origin: "https://untrusted.example.org" } });
      assert.equal(denied.headers.get("access-control-allow-origin"), null);
      const preflight = await fetch(`${baseUrl}/api/__probe`, {
        method: "OPTIONS",
        headers: { Origin: "http://localhost:3000", "Access-Control-Request-Method": "POST" },
      });
      assert.equal(preflight.status, 204);
      assert.equal(preflight.headers.get("access-control-allow-origin"), "http://localhost:3000");
      assert.equal(preflight.headers.get("access-control-allow-credentials"), null);
    });

    await context.test("logs registram método, caminho, status e tempo sem dados sensíveis", async () => {
      await fetch(`${baseUrl}/api/__probe?token=token-que-nao-deve-aparecer`, {
        method: "POST", headers: { "Content-Type": "application/json", Authorization: "Bearer token-secreto" },
        body: JSON.stringify({ name: "senha-do-corpo-oculta" }),
      });
      const requestLogSchema = z.object({
        method: z.literal("POST"), path: z.literal("/api/__probe"),
        statusCode: z.literal(201), durationMs: z.number().nonnegative(),
      });
      assert.ok(logger.records.some((record) => requestLogSchema.safeParse(record).success));
      assert.doesNotMatch(JSON.stringify(logger.records), /token-que|token-secreto|senha-do-corpo|senha-interna/u);
    });

    await context.test("conexão fechada provoca 503, sem falso health positivo", async () => {
      await database.query("CREATE TABLE infrastructure_probe (value TEXT NOT NULL)");
      await database.query("INSERT INTO infrastructure_probe (value) VALUES (?)", ["persistiu"]);
      await database.destroy();
      const response = await fetch(`${baseUrl}/api/health`);
      assert.equal(response.status, 503);
      assert.deepEqual(await readJson(response), {
        statusCode: 503, error: "Service Unavailable", message: "O serviço está indisponível. Tente novamente.",
      });
    });

    await app.close();
    app = undefined;

    await context.test("factory de produção reabre o mesmo arquivo preservando dados", async () => {
      app = await createApplication({ DATABASE_PATH: databasePath, JWT_SECRET }, false);
      await app.listen(0, "127.0.0.1");
      const result: unknown = await app.get(DataSource).query("SELECT value FROM infrastructure_probe");
      assert.deepEqual(result, [{ value: "persistiu" }]);
      const header = await readFile(databasePath);
      assert.equal(header.subarray(0, 16).toString(), "SQLite format 3\u0000");
      const response = await fetch(`${await app.getUrl()}/api/health`);
      assert.equal(response.status, 200);
      assert.deepEqual(await readJson(response), { data: { status: "ok", database: "up" } });
    });
  } finally {
    await app?.close();
    await rm(directory, { recursive: true, force: true });
  }
});
