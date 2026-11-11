import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import type { Repository } from "typeorm";
import { TransactionsService } from "@/database/transactions.service";
import { SubmissionEntity, type Submission } from "@/features/certificates/submission.entity";
import { submissionRecord } from "@/features/certificates/submissions.service";
import { OpportunityEntity, type Opportunity } from "@/features/opportunities/opportunity.entity";
import { OrganizationEntity, type Organization } from "@/features/organizations/organization.entity";
import type { OrganizationDecisionDto, OrganizationQueryDto, SubmissionQueryDto, SubmissionReviewDto } from "@/features/admin/admin.dto";

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(OrganizationEntity) private readonly organizations: Repository<Organization>,
    @InjectRepository(OpportunityEntity) private readonly opportunities: Repository<Opportunity>,
    @InjectRepository(SubmissionEntity) private readonly submissions: Repository<Submission>,
    private readonly transactions: TransactionsService,
  ) {}

  private async presentOrganization(item: Organization) {
    if (!item.owner) throw new NotFoundException("Responsável da organização não encontrado.");
    return {
      id: item.id, name: item.name, status: item.status, reviewedAt: item.reviewedAt?.toISOString() ?? null,
      owner: { name: item.owner.name, email: item.owner.email },
      activities: await this.opportunities.countBy({ organizationId: item.id }),
    };
  }

  async listOrganizations(query: OrganizationQueryDto) {
    const items = await this.organizations.find({
      where: query.status ? { status: query.status } : {}, relations: { owner: true }, order: { name: "ASC" },
    });
    return Promise.all(items.map((item) => this.presentOrganization(item)));
  }

  async decideOrganization(id: string, input: OrganizationDecisionDto) {
    await this.transactions.run(async (manager) => {
      const repository = manager.withRepository(this.organizations);
      const item = await repository.findOneBy({ id });
      if (!item) throw new NotFoundException("Organização não encontrada.");
      if (item.status === input.status) throw new ConflictException("A organização já está com este status.");
      await repository.update({ id }, { status: input.status, reviewedAt: new Date() });
    });
    const updated = await this.organizations.findOne({ where: { id }, relations: { owner: true } });
    if (!updated) throw new NotFoundException("Organização não encontrada.");
    return this.presentOrganization(updated);
  }

  private presentSubmission(item: Submission) {
    if (!item.user) throw new NotFoundException("Voluntário do certificado não encontrado.");
    return { ...submissionRecord(item), volunteer: { name: item.user.name, email: item.user.email } };
  }

  async listSubmissions(query: SubmissionQueryDto) {
    const items = await this.submissions.find({
      where: query.status ? { status: query.status } : {}, relations: { user: true }, order: { createdAt: "ASC", id: "ASC" },
    });
    return { items: items.map((item) => this.presentSubmission(item)) };
  }

  async reviewSubmission(reviewerId: string, id: string, input: SubmissionReviewDto) {
    await this.transactions.run(async (manager) => {
      const repository = manager.withRepository(this.submissions);
      const item = await repository.findOneBy({ id });
      if (!item) throw new NotFoundException("Certificado não encontrado.");
      if (item.status !== "Em análise") throw new ConflictException("Este certificado já foi avaliado.");
      await repository.update({ id }, { status: input.status, reviewNote: input.note ?? null, reviewedAt: new Date(), reviewerId });
    });
    const updated = await this.submissions.findOne({ where: { id }, relations: { user: true } });
    if (!updated) throw new NotFoundException("Certificado não encontrado.");
    return this.presentSubmission(updated);
  }

  async document(id: string): Promise<Submission> {
    const item = await this.submissions.createQueryBuilder("submission").addSelect("submission.document")
      .where("submission.id = :id", { id }).getOne();
    if (!item) throw new NotFoundException("Certificado não encontrado.");
    return item;
  }
}
