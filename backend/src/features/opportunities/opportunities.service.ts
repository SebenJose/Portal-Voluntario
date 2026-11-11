import { BadRequestException, ConflictException, ForbiddenException, Injectable, InternalServerErrorException, NotFoundException } from "@nestjs/common";
import { InjectDataSource } from "@nestjs/typeorm";
import { DataSource, type EntityManager } from "typeorm";
import { TransactionsService } from "@/database/transactions.service";
import { OpportunityEntity, type Opportunity } from "@/features/opportunities/opportunity.entity";
import { ActivitySessionEntity } from "@/features/opportunities/activity-session.entity";
import { EnrollmentEntity } from "@/features/opportunities/enrollment.entity";
import { OrganizationEntity } from "@/features/organizations/organization.entity";
import type { ActivitySessionDto, CreateOpportunityDto, OpportunityQueryDto, UpdateOpportunityDto } from "@/features/opportunities/opportunity.dto";

function validateSessions(sessions: ActivitySessionDto[]): void {
  const keys = new Set<string>();
  for (const session of sessions) {
    const key = `${session.date}/${session.startsAt}`;
    if (session.endsAt <= session.startsAt || keys.has(key)) throw new BadRequestException("Confira os horários: término posterior ao início e encontros sem duplicidade.");
    keys.add(key);
  }
}

@Injectable()
export class OpportunitiesService {
  constructor(@InjectDataSource() private readonly database: DataSource, private readonly transactions: TransactionsService) {}

  private async present(item: Opportunity) {
    if (!item.organization || !item.sessions) throw new InternalServerErrorException();
    return {
      id: item.id, title: item.title, organization: item.organization.name, description: item.description,
      category: item.category, format: item.format, location: item.location, dateLabel: item.dateLabel,
      durationLabel: item.durationLabel, hours: item.hours, vacancies: item.vacancies, featured: item.featured,
      enrolled: await this.database.getRepository(EnrollmentEntity).countBy({ opportunityId: item.id }),
      sessions: item.sessions.sort((a, b) => `${a.date}${a.startsAt}`.localeCompare(`${b.date}${b.startsAt}`))
        .map(({ date, startsAt, endsAt }) => ({ date, startsAt, endsAt })),
    };
  }

  async catalog(userId?: string, query: OpportunityQueryDto = {}) {
    const builder = this.database.getRepository(OpportunityEntity).createQueryBuilder("activity")
      .innerJoinAndSelect("activity.organization", "organization").leftJoinAndSelect("activity.sessions", "session");
    if (query.category) builder.andWhere("activity.category = :category", { category: query.category });
    if (query.format) builder.andWhere("activity.format = :format", { format: query.format });
    if (query.search) builder.andWhere("(activity.title LIKE :search OR organization.name LIKE :search)", { search: `%${query.search}%` });
    builder.orderBy(query.sort === "hours" ? "activity.hours" : "activity.title", "ASC");
    const items = await Promise.all((await builder.getMany()).map((item) => this.present(item)));
    const registrations = userId ? await this.database.getRepository(EnrollmentEntity).findBy({ userId }) : [];
    return { items, registeredIds: registrations.map((item) => item.opportunityId) };
  }

  async get(id: string) {
    const item = await this.database.getRepository(OpportunityEntity).findOne({ where: { id }, relations: { organization: true, sessions: true } });
    if (!item) throw new NotFoundException("Oportunidade não encontrada.");
    return this.present(item);
  }

  async owned(manager: EntityManager, id: string, ownerId: string): Promise<Opportunity> {
    const item = await manager.getRepository(OpportunityEntity).findOne({ where: { id }, relations: { organization: true } });
    if (!item) throw new NotFoundException("Oportunidade não encontrada.");
    if (item.organization?.ownerId !== ownerId) throw new ForbiddenException("Esta atividade pertence a outra organização.");
    return item;
  }

  async create(ownerId: string, input: CreateOpportunityDto) {
    validateSessions(input.sessions);
    await this.transactions.run(async (manager) => {
      const organization = await manager.getRepository(OrganizationEntity).findOneBy({ ownerId });
      if (!organization) throw new ForbiddenException("A conta não possui uma organização cadastrada.");
      const repository = manager.getRepository(OpportunityEntity);
      if (await repository.existsBy({ id: input.id })) throw new ConflictException("Este identificador de atividade já está em uso.");
      const { sessions, ...fields } = input;
      await repository.save(repository.create({ ...fields, featured: input.featured ?? false, organizationId: organization.id }));
      const sessionRepository = manager.getRepository(ActivitySessionEntity);
      await sessionRepository.save(sessions.map((session) => sessionRepository.create({ ...session, opportunityId: input.id })));
    });
    return this.get(input.id);
  }

  async update(ownerId: string, id: string, input: UpdateOpportunityDto) {
    if (input.sessions) validateSessions(input.sessions);
    await this.transactions.run(async (manager) => {
      const item = await this.owned(manager, id, ownerId);
      if (item.certificatesDispatched) throw new ConflictException("A atividade está encerrada após a emissão dos certificados.");
      const occupied = await manager.getRepository(EnrollmentEntity).countBy({ opportunityId: id });
      if (input.vacancies !== undefined && input.vacancies < occupied) throw new ConflictException("A capacidade não pode ser menor que as inscrições existentes.");
      const { sessions, ...fields } = input;
      if (Object.keys(fields).length > 0) await manager.getRepository(OpportunityEntity).update(id, fields);
      if (sessions) {
        const repository = manager.getRepository(ActivitySessionEntity);
        await repository.delete({ opportunityId: id });
        await repository.save(sessions.map((session) => repository.create({ ...session, opportunityId: id })));
      }
    });
    return this.get(id);
  }

  async remove(ownerId: string, id: string): Promise<void> {
    await this.transactions.run(async (manager) => {
      const item = await this.owned(manager, id, ownerId);
      if (item.certificatesDispatched || await manager.getRepository(EnrollmentEntity).existsBy({ opportunityId: id })) {
        throw new ConflictException("Não é possível excluir uma atividade com inscrições ou certificados.");
      }
      await manager.getRepository(OpportunityEntity).delete(id);
    });
  }

  async enroll(userId: string, opportunityId: string) {
    return this.transactions.run(async (manager) => {
      const opportunity = await manager.getRepository(OpportunityEntity).findOneBy({ id: opportunityId });
      if (!opportunity) throw new NotFoundException("Oportunidade não encontrada.");
      if (opportunity.certificatesDispatched) throw new ConflictException("As inscrições desta atividade estão encerradas.");
      const repository = manager.getRepository(EnrollmentEntity);
      if (await repository.existsBy({ userId, opportunityId })) throw new ConflictException("Você já está inscrito nesta oportunidade.");
      const enrolled = await repository.countBy({ opportunityId });
      if (enrolled >= opportunity.vacancies) throw new ConflictException("As vagas desta oportunidade foram preenchidas.");
      await repository.save(repository.create({ userId, opportunityId }));
      return { opportunityId, registered: true, enrolled: enrolled + 1 };
    });
  }

  async cancel(userId: string, opportunityId: string) {
    return this.transactions.run(async (manager) => {
      const opportunity = await manager.getRepository(OpportunityEntity).findOneBy({ id: opportunityId });
      if (!opportunity) throw new NotFoundException("Oportunidade não encontrada.");
      if (opportunity.certificatesDispatched) throw new ConflictException("A participação foi encerrada após a emissão dos certificados.");
      const repository = manager.getRepository(EnrollmentEntity);
      const result = await repository.delete({ userId, opportunityId });
      if (!result.affected) throw new NotFoundException("Inscrição não encontrada.");
      return { opportunityId, registered: false, enrolled: await repository.countBy({ opportunityId }) };
    });
  }
}
