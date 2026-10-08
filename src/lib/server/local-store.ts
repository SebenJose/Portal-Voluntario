import "server-only";

import { randomUUID } from "node:crypto";
import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import path from "node:path";
import { z } from "zod";

function dataPath(name: string): string {
  const directory = z.string().min(1).parse(process.env.PORTAL_DATA_DIR ?? path.join(process.cwd(), ".local-data"));
  return path.join(directory, name);
}

export function readLocalData<T>(name: string, schema: z.ZodType<T>, initialData: T): T {
  let contents: string;
  try {
    contents = readFileSync(dataPath(name), "utf8");
  } catch (error: unknown) {
    if (error instanceof Error && "code" in error && error.code === "ENOENT") {
      return schema.parse(initialData);
    }
    throw error;
  }
  const input: unknown = JSON.parse(contents);
  return schema.parse(input);
}

// A synchronous transaction avoids overlapping read/write operations in the local server.
// This adapter is intended for one server process; production needs a database adapter.
export function updateLocalData<T>(
  name: string,
  schema: z.ZodType<T>,
  initialData: T,
  update: (currentData: T) => T,
): T {
  const nextData = schema.parse(update(readLocalData(name, schema, initialData)));
  const destination = dataPath(name);
  mkdirSync(path.dirname(destination), { recursive: true, mode: 0o700 });
  const temporaryPath = `${destination}.${randomUUID()}.tmp`;
  writeFileSync(temporaryPath, JSON.stringify(nextData), { mode: 0o600, flag: "wx" });
  renameSync(temporaryPath, destination);
  return nextData;
}
