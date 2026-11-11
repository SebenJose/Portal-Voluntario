import type { MigrationInterface, QueryRunner } from "typeorm";

export class EnrollmentConstraints1794330557259 implements MigrationInterface {
  name = "EnrollmentConstraints1794330557259";
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TRIGGER "enrollment_capacity" BEFORE INSERT ON "enrollments"
      BEGIN
        SELECT CASE WHEN (SELECT "certificatesDispatched" FROM "opportunities" WHERE "id" = NEW."opportunityId") = 1
          THEN RAISE(ABORT, 'activity_closed') END;
        SELECT CASE WHEN (SELECT COUNT(*) FROM "enrollments" WHERE "opportunityId" = NEW."opportunityId") >=
          (SELECT "vacancies" FROM "opportunities" WHERE "id" = NEW."opportunityId")
          THEN RAISE(ABORT, 'capacity_exceeded') END;
      END`);
    await queryRunner.query(`CREATE TRIGGER "opportunity_capacity" BEFORE UPDATE OF "vacancies" ON "opportunities"
      WHEN NEW."vacancies" < (SELECT COUNT(*) FROM "enrollments" WHERE "opportunityId" = NEW."id")
      BEGIN SELECT RAISE(ABORT, 'capacity_below_enrollment'); END`);
    await queryRunner.query(`CREATE TRIGGER "certificate_presence" BEFORE INSERT ON "participation_certificates"
      WHEN (SELECT "status" FROM "enrollments" WHERE "id" = NEW."enrollmentId") <> 'Presente'
      BEGIN SELECT RAISE(ABORT, 'participant_not_present'); END`);
  }
  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TRIGGER "certificate_presence"');
    await queryRunner.query('DROP TRIGGER "opportunity_capacity"');
    await queryRunner.query('DROP TRIGGER "enrollment_capacity"');
  }
}
