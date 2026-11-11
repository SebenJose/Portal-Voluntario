import type { DataSource, EntityManager } from "typeorm";
import { z } from "zod";
import type { Role } from "@/common/domain";
import { categorySchema, formatSchema } from "@/common/domain";
import { UserEntity, type User } from "@/features/auth/user.entity";
import { hashPassword } from "@/features/auth/passwords";
import { OrganizationEntity } from "@/features/organizations/organization.entity";
import { OpportunityEntity } from "@/features/opportunities/opportunity.entity";
import { ActivitySessionEntity } from "@/features/opportunities/activity-session.entity";
import { EnrollmentEntity } from "@/features/opportunities/enrollment.entity";
import { seedOpportunities } from "@/database/seed-opportunities";

const seedPasswordSchema = z.string().refine((value) => Array.from(value).length >= 8)
  .refine((value) => Buffer.byteLength(value, "utf8") <= 72);
const seedCatalogSchema = z.array(z.object({
  id: z.string().min(1), title: z.string().min(5).max(150), organization: z.string().min(1),
  description: z.string().min(10).max(5000), category: categorySchema, format: formatSchema,
  location: z.string().min(2), dateLabel: z.string().min(2), durationLabel: z.string().min(2),
  hours: z.number().int().min(1).max(200), vacancies: z.number().int().min(1).max(10000),
  featured: z.boolean().optional(), enrolled: z.number().int().nonnegative(),
  sessions: z.array(z.object({ date: z.iso.date(), startsAt: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/u), endsAt: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/u) })
    .refine((session) => session.endsAt > session.startsAt)).min(1),
}));

async function ensureUser(manager: EntityManager, email: string, name: string, role: Role, passwordHash: string): Promise<User> {
  const repository = manager.getRepository(UserEntity);
  const existing = await repository.findOneBy({ email });
  if (existing) {
    if (existing.role !== role) throw new Error("O e-mail do seed já pertence a outro papel. Nenhum privilégio foi alterado.");
    return existing;
  }
  return repository.save(repository.create({ email, name, role, passwordHash }));
}

export async function seedDatabase(database: DataSource, input: unknown): Promise<void> {
  const password = seedPasswordSchema.parse(input);
  const fixtures = seedCatalogSchema.parse(seedOpportunities);
  const passwordHash = await hashPassword(password);
  await database.transaction(async (manager) => {
    const volunteer = await ensureUser(manager, "voluntario@portal.example", "Voluntário demonstrativo", "volunteer", passwordHash);
    await ensureUser(manager, "outro@portal.example", "Outro voluntário demonstrativo", "volunteer", passwordHash);
    for (const [index, fixture] of fixtures.entries()) {
      const email = index === 0 ? "organizacao@portal.example" : `organizacao${index + 1}@portal.example`;
      const owner = await ensureUser(manager, email, `Responsável demonstrativo ${index + 1}`, "organization", passwordHash);
      const organizations = manager.getRepository(OrganizationEntity);
      const organization = await organizations.findOneBy({ ownerId: owner.id })
        ?? await organizations.save(organizations.create({ ownerId: owner.id, name: fixture.organization, status: "approved", reviewedAt: null }));
      const opportunities = manager.getRepository(OpportunityEntity);
      // Never reset edited opportunities, attendance, accounts or passwords when repeating the seed.
      if (await opportunities.existsBy({ id: fixture.id })) continue;
      const { organization: organizationName, sessions, enrolled, ...fields } = fixture;
      void organizationName;
      void enrolled;
      await opportunities.save(opportunities.create({ ...fields, featured: fixture.featured ?? false, organizationId: organization.id, certificatesDispatched: false }));
      const sessionRepository = manager.getRepository(ActivitySessionEntity);
      await sessionRepository.save(sessions.map((session) => sessionRepository.create({ ...session, opportunityId: fixture.id })));
      if (index < 2) {
        const registrations = manager.getRepository(EnrollmentEntity);
        await registrations.save(registrations.create({ userId: volunteer.id, opportunityId: fixture.id, status: index === 0 ? "Presente" : "Inscrito" }));
      }
    }
    await ensureUser(manager, "admin@portal.example", "Administração demonstrativa", "admin", passwordHash);
    // A pending organization lets the approval flow be demonstrated without extra setup.
    const pendingOwner = await ensureUser(manager, "organizacao-pendente@portal.example", "Responsável aguardando aprovação", "organization", passwordHash);
    const organizations = manager.getRepository(OrganizationEntity);
    if (!await organizations.existsBy({ ownerId: pendingOwner.id })) {
      await organizations.save(organizations.create({ ownerId: pendingOwner.id, name: "Coletivo Mãos Dadas", status: "pending", reviewedAt: null }));
    }
  });
}
