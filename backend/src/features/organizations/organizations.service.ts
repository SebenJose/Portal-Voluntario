import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import type { Repository } from "typeorm";
import type { Attendance } from "@/common/domain";
import { TransactionsService } from "@/database/transactions.service";
import { OpportunityEntity, type Opportunity } from "@/features/opportunities/opportunity.entity";
import { EnrollmentEntity, type Enrollment } from "@/features/opportunities/enrollment.entity";
import { OpportunitiesService } from "@/features/opportunities/opportunities.service";
import { ParticipationCertificateEntity, type ParticipationCertificate } from "@/features/certificates/participation-certificate.entity";

function participant(item: Enrollment) {
  if (!item.user) throw new NotFoundException("Participante não encontrado.");
  return { id: item.id, name: item.user.name, email: item.user.email, status: item.status, registeredAt: item.registeredAt.toLocaleDateString("pt-BR", { timeZone: "UTC" }) };
}

@Injectable()
export class OrganizationsService {
  constructor(
    @InjectRepository(OpportunityEntity) private readonly activities: Repository<Opportunity>,
    @InjectRepository(EnrollmentEntity) private readonly enrollments: Repository<Enrollment>,
    @InjectRepository(ParticipationCertificateEntity) private readonly certificates: Repository<ParticipationCertificate>,
    private readonly transactions: TransactionsService,
    private readonly opportunities: OpportunitiesService,
  ) {}

  async list(ownerId: string) {
    const activities = await this.activities.find({
      where: { organization: { ownerId } }, order: { title: "ASC" },
    });
    return Promise.all(activities.map(async (activity) => ({
      id: activity.id, title: activity.title, dateLabel: activity.dateLabel,
      certificatesDispatched: activity.certificatesDispatched,
      participants: (await this.enrollments.find({
        where: { opportunityId: activity.id }, relations: { user: true }, order: { registeredAt: "ASC" },
      })).map(participant),
    })));
  }

  async attendance(ownerId: string, activityId: string, participantId: string, status: Attendance) {
    return this.transactions.run(async (manager) => {
      const activity = await this.opportunities.owned(manager, activityId, ownerId);
      if (activity.certificatesDispatched) throw new ConflictException("A presença está encerrada após a emissão dos certificados.");
      const repository = manager.withRepository(this.enrollments);
      const enrollment = await repository.findOne({ where: { id: participantId, opportunityId: activityId }, relations: { user: true } });
      if (!enrollment) throw new NotFoundException("Participante não encontrado nesta atividade.");
      enrollment.status = status;
      await repository.save(enrollment);
      return { participant: participant(enrollment) };
    });
  }

  async dispatch(ownerId: string, activityId: string) {
    return this.transactions.run(async (manager) => {
      const activity = await this.opportunities.owned(manager, activityId, ownerId);
      if (activity.certificatesDispatched) throw new ConflictException("Os certificados desta atividade já foram emitidos.");
      const present = await manager.withRepository(this.enrollments).findBy({ opportunityId: activityId, status: "Presente" });
      if (present.length === 0) throw new ConflictException("Não há participantes com presença confirmada.");
      const repository = manager.withRepository(this.certificates);
      await repository.save(present.map((enrollment) => repository.create({ enrollmentId: enrollment.id, hours: activity.hours, category: activity.category })));
      await manager.withRepository(this.activities).update(activityId, { certificatesDispatched: true });
      return { activityId, sentCount: present.length, certificatesDispatched: true };
    });
  }
}
