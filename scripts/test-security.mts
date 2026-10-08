import { mkdtempSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import ts from "typescript";

const root = process.cwd();
const output = mkdtempSync(path.join(tmpdir(), "portal-security-tests-"));

function compile(directory: string): void {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const source = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      compile(source);
      continue;
    }
    if (!/\.(ts|tsx)$/u.test(source) || source.endsWith(".d.ts")) continue;
    const target = path.join(output, path.relative(root, source)).replace(/\.(ts|tsx)$/u, ".js");
    mkdirSync(path.dirname(target), { recursive: true });
    // Next enforces server-only at build time. Only the isolated Node test output omits this marker.
    const contents = readFileSync(source, "utf8").replace(/^import "server-only";\r?\n/gmu, "");
    const compiled = ts.transpileModule(contents, {
      fileName: source,
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2022,
        jsx: ts.JsxEmit.ReactJSX,
        esModuleInterop: true,
      },
    }).outputText.replace(/require\("@\/([^"\n]+)"\)/gu, (_match: string, relative: string): string =>
      `require(${JSON.stringify(path.join(output, "src", relative))})`);
    writeFileSync(target, `module.paths.unshift(${JSON.stringify(path.join(root, "node_modules"))});\n${compiled}`);
  }
}

try {
  compile(path.join(root, "src"));
  compile(path.join(root, "tests"));
  // node:test runs registered tests automatically in this isolated process.
  const result = spawnSync(process.execPath, [path.join(output, "tests/security.test.js")], {
    cwd: root,
    stdio: "inherit",
    env: { ...process.env, NODE_ENV: "test" },
  });
  process.exitCode = result.status ?? 1;
} finally {
  // This directory was allocated by this invocation and contains only generated test artifacts.
  rmSync(output, { recursive: true, force: true });
}
