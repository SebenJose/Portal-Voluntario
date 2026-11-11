import { strict as assert } from "node:assert";
import { test } from "node:test";
import { randomBytes } from "node:crypto";

import { loadEnvironment } from "@/config/environment";
const JWT_SECRET = randomBytes(32).toString("hex");

test("configuração possui padrões locais e aceita portas e origens explícitas", () => {
  assert.deepEqual(loadEnvironment({ JWT_SECRET }), {
    API_HOST: "127.0.0.1",
    API_PORT: 3001,
    DATABASE_PATH: ".data/portal.sqlite",
    JWT_SECRET,
    API_DOCS: "enabled",
    CORS_ORIGINS: ["http://localhost:3000"],
  });
  assert.equal(loadEnvironment({ JWT_SECRET, API_DOCS: "disabled" }).API_DOCS, "disabled");
  assert.throws(() => loadEnvironment({ JWT_SECRET, API_DOCS: "talvez" }), /API_DOCS/u);
  const environment = loadEnvironment({
    JWT_SECRET,
    API_PORT: "4100",
    CORS_ORIGINS: "https://portal.example.org, http://127.0.0.1:3000",
  });
  assert.equal(environment.API_PORT, 4100);
  assert.deepEqual(environment.CORS_ORIGINS, ["https://portal.example.org", "http://127.0.0.1:3000"]);
});

test("configuração rejeita portas, caminhos vazios e origens inválidas sem expor valores", () => {
  const invalidInputs: unknown[] = [
    null,
    { API_PORT: "abc" },
    { JWT_SECRET: "curto" },
    { API_PORT: "" },
    { API_PORT: "0" },
    { API_PORT: "65536" },
    { API_PORT: "3.5" },
    { API_HOST: "example.org" },
    { DATABASE_PATH: " " },
    { CORS_ORIGINS: "*" },
    { CORS_ORIGINS: "" },
    { CORS_ORIGINS: "https://portal.example.org/" },
    { CORS_ORIGINS: "https://portal.example.org/path" },
    { CORS_ORIGINS: "https://user:segredo@portal.example.org" },
    { CORS_ORIGINS: "https://portal.example.org?token=segredo" },
    { CORS_ORIGINS: "file:///tmp/portal" },
  ];
  for (const input of invalidInputs) {
    const configuration = input && typeof input === "object" ? { JWT_SECRET, ...input } : input;
    assert.throws(() => loadEnvironment(configuration), (error: unknown) => {
      assert.ok(error instanceof Error);
      assert.match(error.message, /Configuração inválida/u);
      assert.doesNotMatch(error.message, /segredo/u);
      return true;
    });
  }
  assert.throws(() => loadEnvironment({}), /JWT_SECRET/u);
});
