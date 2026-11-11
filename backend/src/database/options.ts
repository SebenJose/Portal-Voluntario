import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import type { DataSourceOptions } from "typeorm";
import type { Environment } from "@/config/environment";
import { entities } from "@/database/entities";
import { InitialSchema1794330557258 } from "@/database/migrations/1794330557258-InitialSchema";
import { EnrollmentConstraints1794330557259 } from "@/database/migrations/1794330557259-EnrollmentConstraints";

export function databaseOptions(environment: Pick<Environment, "DATABASE_PATH">): DataSourceOptions {
  const database = environment.DATABASE_PATH === ":memory:" ? ":memory:" : resolve(environment.DATABASE_PATH);
  if (database !== ":memory:") mkdirSync(dirname(database), { recursive: true, mode: 0o700 });
  return {
    type: "better-sqlite3", database, entities,
    migrations: [InitialSchema1794330557258, EnrollmentConstraints1794330557259],
    migrationsRun: true,
    synchronize: false, logging: false,
    enableWAL: true,
  };
}
