import type { MigrationInterface, QueryRunner } from "typeorm";

/**
 * TypeORM disables foreign keys before `up`, but `undoLastMigration` opens its transaction first,
 * and SQLite ignores `PRAGMA foreign_keys` inside a transaction. Rebuilding referenced tables would
 * then hit ON DELETE RESTRICT/CASCADE. This helper leaves the (still empty) managed transaction,
 * runs the rebuild in its own transaction with foreign keys off, verifies integrity, restores the
 * pragma and reopens a transaction for TypeORM to finish.
 */
async function withForeignKeysDisabled(queryRunner: QueryRunner, rebuild: () => Promise<void>): Promise<void> {
  const managed = queryRunner.isTransactionActive;
  if (managed) await queryRunner.commitTransaction();
  await queryRunner.query(`PRAGMA foreign_keys = OFF`);
  try {
    await queryRunner.startTransaction();
    try {
      await rebuild();
      const violations: unknown = await queryRunner.query(`PRAGMA foreign_key_check`);
      if (!Array.isArray(violations) || violations.length > 0) throw new Error("Foreign key check failed after rebuilding tables.");
      await queryRunner.commitTransaction();
    } catch (error: unknown) {
      await queryRunner.rollbackTransaction();
      throw error;
    }
  } finally {
    await queryRunner.query(`PRAGMA foreign_keys = ON`);
    if (managed) await queryRunner.startTransaction();
  }
}

// SQLite does not alter CHECK constraints: users, organizations and submissions are rebuilt with the
// documented 12-step procedure. TypeORM disables foreign_keys before running migrations,
// so dropping the old tables does not cascade; the final foreign_key_check guards integrity.
export class RolesAndReviews1794330557260 implements MigrationInterface {
  name = "RolesAndReviews1794330557260";

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TABLE "users_new" ("id" varchar PRIMARY KEY NOT NULL, "name" varchar(100) NOT NULL, "email" varchar(254) COLLATE NOCASE NOT NULL, "passwordHash" varchar NOT NULL, "role" varchar NOT NULL DEFAULT ('volunteer'), "createdAt" datetime NOT NULL DEFAULT (datetime('now')), CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"), CONSTRAINT "CHK_9fef5294e87cf8d2c75f17d193" CHECK ("role" IN ('volunteer', 'organization', 'admin')))`);
    await queryRunner.query(`INSERT INTO "users_new" ("id", "name", "email", "passwordHash", "role", "createdAt") SELECT "id", "name", "email", "passwordHash", "role", "createdAt" FROM "users"`);
    await queryRunner.query(`DROP TABLE "users"`);
    await queryRunner.query(`ALTER TABLE "users_new" RENAME TO "users"`);

    // Existing organizations were created by the seed and are approved.
    await queryRunner.query(`CREATE TABLE "organizations_new" ("id" varchar PRIMARY KEY NOT NULL, "name" varchar(150) NOT NULL, "ownerId" varchar NOT NULL, "status" varchar NOT NULL DEFAULT ('approved'), "reviewedAt" datetime, CONSTRAINT "UQ_cdf778d13ea7fe8095e013e34f0" UNIQUE ("ownerId"), CONSTRAINT "CHK_3a162ec4f1d19921b632d97a81" CHECK ("status" IN ('pending', 'approved', 'rejected')), CONSTRAINT "FK_cdf778d13ea7fe8095e013e34f0" FOREIGN KEY ("ownerId") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE NO ACTION)`);
    await queryRunner.query(`INSERT INTO "organizations_new" ("id", "name", "ownerId", "status") SELECT "id", "name", "ownerId", 'approved' FROM "organizations"`);
    await queryRunner.query(`DROP TABLE "organizations"`);
    await queryRunner.query(`ALTER TABLE "organizations_new" RENAME TO "organizations"`);

    await queryRunner.query(`CREATE TABLE "submissions_new" ("id" varchar PRIMARY KEY NOT NULL, "userId" varchar NOT NULL, "title" varchar(150) NOT NULL, "category" varchar NOT NULL, "hours" integer NOT NULL, "description" text NOT NULL, "status" varchar NOT NULL DEFAULT ('Em análise'), "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "documentName" varchar(255) NOT NULL, "documentType" varchar NOT NULL, "documentSize" integer NOT NULL, "document" blob NOT NULL, "reviewNote" varchar(1000), "reviewedAt" datetime, "reviewerId" varchar, CONSTRAINT "CHK_bdaa6d178f19f5a9914e04c0c1" CHECK ("category" IN ('Ensino', 'Pesquisa', 'Extensão')), CONSTRAINT "CHK_9b060e073bfe297286f8b54b29" CHECK ("status" IN ('Em análise', 'Aprovado', 'Recusado')), CONSTRAINT "CHK_37a7f2017ad474a9e6f62e05ed" CHECK ("hours" BETWEEN 1 AND 200), CONSTRAINT "CHK_ecea577845f10440031835643b" CHECK ("documentType" IN ('application/pdf', 'image/jpeg', 'image/png')), CONSTRAINT "CHK_b5869a35fc47a33ed784a29b35" CHECK ("documentSize" BETWEEN 1 AND 5242880 AND length("document") = "documentSize"), CONSTRAINT "CHK_674dc27b74df37fc1a3ce5ac91" CHECK (("status" = 'Em análise' AND "reviewedAt" IS NULL) OR ("status" <> 'Em análise' AND "reviewedAt" IS NOT NULL)), CONSTRAINT "FK_eae888413ab8fc63cc48759d46a" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE NO ACTION, CONSTRAINT "FK_8b8c22bf66ee5dfe28437344a81" FOREIGN KEY ("reviewerId") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE NO ACTION)`);
    await queryRunner.query(`INSERT INTO "submissions_new" ("id", "userId", "title", "category", "hours", "description", "status", "createdAt", "documentName", "documentType", "documentSize", "document") SELECT "id", "userId", "title", "category", "hours", "description", "status", "createdAt", "documentName", "documentType", "documentSize", "document" FROM "submissions"`);
    await queryRunner.query(`DROP TABLE "submissions"`);
    await queryRunner.query(`ALTER TABLE "submissions_new" RENAME TO "submissions"`);
    await queryRunner.query(`CREATE INDEX "IDX_eae888413ab8fc63cc48759d46" ON "submissions" ("userId")`);
    await queryRunner.query(`CREATE INDEX "IDX_d4842916487f15fcca89b1a918" ON "submissions" ("status")`);

    const violations: unknown = await queryRunner.query(`PRAGMA foreign_key_check`);
    if (!Array.isArray(violations) || violations.length > 0) throw new Error("Foreign key check failed after rebuilding tables.");
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    const admins: unknown = await queryRunner.query(`SELECT 1 FROM "users" WHERE "role" = 'admin' LIMIT 1`);
    if (!Array.isArray(admins) || admins.length > 0) throw new Error("Remova as contas de administrador antes de reverter esta migration.");
    await withForeignKeysDisabled(queryRunner, () => this.rebuildPreviousSchema(queryRunner));
  }

  private async rebuildPreviousSchema(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TABLE "submissions_old" ("id" varchar PRIMARY KEY NOT NULL, "userId" varchar NOT NULL, "title" varchar(150) NOT NULL, "category" varchar NOT NULL, "hours" integer NOT NULL, "description" text NOT NULL, "status" varchar NOT NULL DEFAULT ('Em análise'), "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "documentName" varchar(255) NOT NULL, "documentType" varchar NOT NULL, "documentSize" integer NOT NULL, "document" blob NOT NULL, CONSTRAINT "CHK_bdaa6d178f19f5a9914e04c0c1" CHECK ("category" IN ('Ensino', 'Pesquisa', 'Extensão')), CONSTRAINT "CHK_53ee4b4e163675c4496fd38b5d" CHECK ("status" = 'Em análise'), CONSTRAINT "CHK_37a7f2017ad474a9e6f62e05ed" CHECK ("hours" BETWEEN 1 AND 200), CONSTRAINT "CHK_ecea577845f10440031835643b" CHECK ("documentType" IN ('application/pdf', 'image/jpeg', 'image/png')), CONSTRAINT "CHK_b5869a35fc47a33ed784a29b35" CHECK ("documentSize" BETWEEN 1 AND 5242880 AND length("document") = "documentSize"), CONSTRAINT "FK_eae888413ab8fc63cc48759d46a" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE NO ACTION)`);
    // Reviewed submissions cannot be represented in the previous schema; they return to analysis.
    await queryRunner.query(`INSERT INTO "submissions_old" SELECT "id", "userId", "title", "category", "hours", "description", 'Em análise', "createdAt", "documentName", "documentType", "documentSize", "document" FROM "submissions"`);
    await queryRunner.query(`DROP TABLE "submissions"`);
    await queryRunner.query(`ALTER TABLE "submissions_old" RENAME TO "submissions"`);
    await queryRunner.query(`CREATE INDEX "IDX_eae888413ab8fc63cc48759d46" ON "submissions" ("userId")`);
    await queryRunner.query(`CREATE TABLE "organizations_old" ("id" varchar PRIMARY KEY NOT NULL, "name" varchar(150) NOT NULL, "ownerId" varchar NOT NULL, CONSTRAINT "UQ_cdf778d13ea7fe8095e013e34f0" UNIQUE ("ownerId"), CONSTRAINT "FK_cdf778d13ea7fe8095e013e34f0" FOREIGN KEY ("ownerId") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE NO ACTION)`);
    await queryRunner.query(`INSERT INTO "organizations_old" SELECT "id", "name", "ownerId" FROM "organizations"`);
    await queryRunner.query(`DROP TABLE "organizations"`);
    await queryRunner.query(`ALTER TABLE "organizations_old" RENAME TO "organizations"`);
    await queryRunner.query(`CREATE TABLE "users_old" ("id" varchar PRIMARY KEY NOT NULL, "name" varchar(100) NOT NULL, "email" varchar(254) COLLATE NOCASE NOT NULL, "passwordHash" varchar NOT NULL, "role" varchar NOT NULL DEFAULT ('volunteer'), "createdAt" datetime NOT NULL DEFAULT (datetime('now')), CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"), CONSTRAINT "CHK_a071a72bb83bf965a92ba9f392" CHECK ("role" IN ('volunteer', 'organization')))`);
    await queryRunner.query(`INSERT INTO "users_old" SELECT * FROM "users"`);
    await queryRunner.query(`DROP TABLE "users"`);
    await queryRunner.query(`ALTER TABLE "users_old" RENAME TO "users"`);
  }
}
