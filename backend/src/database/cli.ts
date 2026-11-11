import "reflect-metadata";
import { DataSource } from "typeorm";
import { z } from "zod";
import { databaseOptions } from "@/database/options";
import { environmentSchema } from "@/config/environment";
import { seedDatabase } from "@/database/seed";

async function run(): Promise<void> {
  const command = z.enum(["migrate", "seed"]).parse(process.argv[2]);
  const configuration = environmentSchema.pick({ DATABASE_PATH: true }).parse(process.env);
  const database = await new DataSource(databaseOptions(configuration)).initialize();
  try {
    if (command === "seed") await seedDatabase(database, process.env.SEED_PASSWORD);
    process.stdout.write(command === "seed" ? "Seed concluído sem redefinir dados existentes.\n" : "Migrations aplicadas.\n");
  } finally {
    await database.destroy();
  }
}

void run().catch(() => {
  process.stderr.write("Falha na preparação do banco. Confira DATABASE_PATH e, para o seed, SEED_PASSWORD (8 caracteres, até 72 bytes).\n");
  process.exitCode = 1;
});
