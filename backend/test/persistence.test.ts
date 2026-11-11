import "reflect-metadata";
import { strict as assert } from "node:assert";
import { randomBytes, randomUUID } from "node:crypto";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { DataSource } from "typeorm";
import { z } from "zod";
import { databaseOptions } from "@/database/options";
import { seedDatabase } from "@/database/seed";
import { UserEntity } from "@/features/auth/user.entity";
import { checkPassword } from "@/features/auth/passwords";
import { OrganizationEntity } from "@/features/organizations/organization.entity";
import { OpportunityEntity } from "@/features/opportunities/opportunity.entity";
import { ActivitySessionEntity } from "@/features/opportunities/activity-session.entity";
import { EnrollmentEntity } from "@/features/opportunities/enrollment.entity";

test("migrations, seed idempotente, relações, constraints e persistência de domínio", async () => {
  const directory = await mkdtemp(join(tmpdir(), "portal-domain-"));
  const options = databaseOptions({ DATABASE_PATH: join(directory, "domain.sqlite") });
  const password = randomBytes(18).toString("base64url");
  let database = await new DataSource(options).initialize();
  try {
    await seedDatabase(database, password);
    assert.equal(await database.getRepository(UserEntity).count(), 9);
    assert.equal(await database.getRepository(OrganizationEntity).count(), 6);
    assert.equal(await database.getRepository(OpportunityEntity).count(), 5);
    assert.equal(await database.getRepository(EnrollmentEntity).count(), 2);
    assert.equal(await database.getRepository(ActivitySessionEntity).count(), 21);
    assert.deepEqual(await database.runMigrations(), []);
    assert.equal((await database.driver.createSchemaBuilder().log()).upQueries.length, 0);

    const users = database.getRepository(UserEntity);
    const volunteer = await users.findOneByOrFail({ email: "voluntario@portal.example" });
    assert.equal("passwordHash" in volunteer, false);
    const credential = await users.createQueryBuilder("user").addSelect("user.passwordHash")
      .where("user.id = :id", { id: volunteer.id }).getOneOrFail();
    assert.match(credential.passwordHash, /^\$2[ab]\$12\$/u);
    assert.ok(await checkPassword(password, credential.passwordHash));
    await users.update(volunteer.id, { name: "Nome alterado" });
    await database.getRepository(OpportunityEntity).update("horta-comunitaria", { title: "Título alterado" });
    await seedDatabase(database, randomBytes(18).toString("base64url"));
    assert.equal(await users.count(), 9);
    assert.equal(await database.getRepository(EnrollmentEntity).count(), 2);
    assert.equal(await database.getRepository(ActivitySessionEntity).count(), 21);
    const preservedCredential = await users.createQueryBuilder("user").addSelect("user.passwordHash")
      .where("user.id = :id", { id: volunteer.id }).getOneOrFail();
    assert.equal(preservedCredential.passwordHash, credential.passwordHash);

    await assert.rejects(users.insert({ email: "VOLUNTARIO@PORTAL.EXAMPLE", name: "Duplicado", role: "volunteer", passwordHash: credential.passwordHash }));
    const enrollments = database.getRepository(EnrollmentEntity);
    await assert.rejects(enrollments.insert({ userId: volunteer.id, opportunityId: "horta-comunitaria" }));
    await assert.rejects(enrollments.insert({ userId: randomUUID(), opportunityId: "horta-comunitaria" }));
    await assert.rejects(database.getRepository(OpportunityEntity).delete("horta-comunitaria"));

    await database.destroy();
    database = await new DataSource(options).initialize();
    assert.equal((await database.getRepository(UserEntity).findOneByOrFail({ id: volunteer.id })).name, "Nome alterado");
    const activity = await database.getRepository(OpportunityEntity).findOneOrFail({
      where: { id: "horta-comunitaria" }, relations: { organization: true, sessions: true },
    });
    assert.equal(activity.title, "Título alterado");
    assert.equal(activity.organization?.name, "Instituto Sementes do Amanhã");
    assert.equal(activity.sessions?.length, 5);
    assert.deepEqual(await database.query("PRAGMA foreign_key_check"), []);
  } finally {
    if (database.isInitialized) await database.destroy();
    await rm(directory, { recursive: true, force: true });
  }
});

test("seed não promove conta existente e reverte toda a transação em conflito", async () => {
  const database = await new DataSource(databaseOptions({ DATABASE_PATH: ":memory:" })).initialize();
  try {
    await database.getRepository(UserEntity).insert({ email: "organizacao@portal.example", name: "Conta existente", role: "volunteer", passwordHash: "hash-inacessivel" });
    await assert.rejects(seedDatabase(database, randomBytes(18).toString("base64url")));
    assert.equal(await database.getRepository(UserEntity).count(), 1);
    assert.equal(await database.getRepository(OpportunityEntity).count(), 0);
    assert.equal((await database.getRepository(UserEntity).findOneByOrFail({ email: "organizacao@portal.example" })).role, "volunteer");
    await database.undoLastMigration();
    await database.undoLastMigration();
    await database.undoLastMigration();
    await database.runMigrations();
    assert.equal(await database.getRepository(UserEntity).count(), 0);
  } finally {
    await database.destroy();
  }
});

test("migration de perfis atualiza banco com dados existentes e reverte sem perdas", async () => {
  const directory = await mkdtemp(join(tmpdir(), "portal-upgrade-"));
  const options = databaseOptions({ DATABASE_PATH: join(directory, "upgrade.sqlite") });
  const previous = await new DataSource({ ...options, migrations: Array.isArray(options.migrations) ? options.migrations.slice(0, 2) : [] }).initialize();
  const ids = { volunteer: randomUUID(), owner: randomUUID(), organization: randomUUID() };
  try {
    await previous.query(`INSERT INTO "users" ("id", "name", "email", "passwordHash", "role") VALUES (?, 'Voluntário', 'v@upgrade.example', 'hash', 'volunteer'), (?, 'Responsável', 'o@upgrade.example', 'hash', 'organization')`, [ids.volunteer, ids.owner]);
    await previous.query(`INSERT INTO "sessions" ("id", "userId", "expiresAt") VALUES (?, ?, datetime('now', '+1 day'))`, [randomUUID(), ids.volunteer]);
    await previous.query(`INSERT INTO "organizations" ("id", "name", "ownerId") VALUES (?, 'Organização antiga', ?)`, [ids.organization, ids.owner]);
    await previous.query(`INSERT INTO "opportunities" ("id", "organizationId", "title", "description", "category", "format", "location", "dateLabel", "durationLabel", "hours", "vacancies") VALUES ('antiga', ?, 'Atividade antiga', 'Descrição da atividade antiga.', 'Ensino', 'Online', 'Remoto', 'data', 'horário', 2, 5)`, [ids.organization]);
    await previous.query(`INSERT INTO "enrollments" ("id", "userId", "opportunityId") VALUES (?, ?, 'antiga')`, [randomUUID(), ids.volunteer]);
    await previous.query(`INSERT INTO "submissions" ("id", "userId", "title", "category", "hours", "description", "documentName", "documentType", "documentSize", "document") VALUES (?, ?, 'Certificado antigo', 'Pesquisa', 3, 'Descrição do certificado.', 'a.pdf', 'application/pdf', 5, X'255044462D')`, [randomUUID(), ids.volunteer]);
  } finally {
    await previous.destroy();
  }

  const database = await new DataSource(options).initialize();
  const count = async (table: string) => z.array(z.object({ total: z.number() })).parse(await database.query(`SELECT count(*) AS "total" FROM "${table}"`))[0]?.total;
  try {
    for (const [table, total] of [["users", 2], ["sessions", 1], ["organizations", 1], ["enrollments", 1], ["submissions", 1]] as const) {
      assert.equal(await count(table), total, `${table} preservada no upgrade`);
    }
    assert.equal((await database.getRepository(OrganizationEntity).findOneByOrFail({ id: ids.organization })).status, "approved");
    assert.equal((await database.driver.createSchemaBuilder().log()).upQueries.length, 0);
    assert.deepEqual(await database.query("PRAGMA foreign_key_check"), []);
    await assert.rejects(database.query(`UPDATE "submissions" SET "status" = 'Aprovado'`), "aprovação exige data de avaliação");
    await assert.rejects(database.query(`DELETE FROM "users" WHERE "id" = ?`, [ids.volunteer]), "RESTRICT continua ativo");

    await database.undoLastMigration();
    for (const [table, total] of [["users", 2], ["sessions", 1], ["organizations", 1], ["enrollments", 1], ["submissions", 1]] as const) {
      assert.equal(await count(table), total, `${table} preservada no rollback`);
    }
    assert.deepEqual(await database.query("PRAGMA foreign_keys"), [{ foreign_keys: 1 }]);
    assert.deepEqual(await database.query("PRAGMA foreign_key_check"), []);
    assert.equal((await database.runMigrations()).length, 1, "a migration pode ser reaplicada");
    assert.equal(await count("submissions"), 1);
  } finally {
    await database.destroy();
    await rm(directory, { recursive: true, force: true });
  }
});
