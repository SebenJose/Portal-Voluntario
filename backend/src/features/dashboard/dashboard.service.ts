import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import type { Repository } from "typeorm";
import { categorySchema } from "@/common/domain";
import { EnrollmentEntity, type Enrollment } from "@/features/opportunities/enrollment.entity";
import { ParticipationCertificateEntity, type ParticipationCertificate } from "@/features/certificates/participation-certificate.entity";

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(EnrollmentEntity) private readonly enrollments: Repository<Enrollment>,
    @InjectRepository(ParticipationCertificateEntity) private readonly certificates: Repository<ParticipationCertificate>,
  ) {}

  async summary(userId: string) {
    const registrations = await this.enrollments.find({ where: { userId }, relations: { opportunity: { organization: true } } });
    const certificates = await this.certificates.find({ where: { enrollment: { userId } } });
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
