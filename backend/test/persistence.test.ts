import "reflect-metadata";
import { strict as assert } from "node:assert";
import { randomBytes, randomUUID } from "node:crypto";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { DataSource } from "typeorm";
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
    assert.equal(await database.getRepository(UserEntity).count(), 7);
    assert.equal(await database.getRepository(OrganizationEntity).count(), 5);
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
    assert.equal(await users.count(), 7);
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
    await database.runMigrations();
    assert.equal(await database.getRepository(UserEntity).count(), 0);
  } finally {
    await database.destroy();
  }
});
