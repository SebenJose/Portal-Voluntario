import { Injectable } from "@nestjs/common";
import { InjectDataSource } from "@nestjs/typeorm";
import { DataSource } from "typeorm";
import { categorySchema } from "@/common/domain";
import { EnrollmentEntity } from "@/features/opportunities/enrollment.entity";
import { ParticipationCertificateEntity } from "@/features/certificates/participation-certificate.entity";

@Injectable()
export class DashboardService {
  constructor(@InjectDataSource() private readonly database: DataSource) {}

  async summary(userId: string) {
    const registrations = await this.database.getRepository(EnrollmentEntity).find({ where: { userId }, relations: { opportunity: { organization: true } } });
    const certificates = await this.database.getRepository(ParticipationCertificateEntity).find({ where: { enrollment: { userId } } });
    return {
      hoursSummary: categorySchema.options.map((category) => ({ category, completed: certificates.filter((item) => item.category === category).reduce((sum, item) => sum + item.hours, 0) })),
      registrations: registrations.length,
      upcomingActivities: registrations.flatMap((item) => item.opportunity?.organization ? [{
        id: item.opportunity.id, title: item.opportunity.title, organization: item.opportunity.organization.name,
        dateLabel: item.opportunity.dateLabel, status: item.status,
      }] : []),
    };
  }
}
