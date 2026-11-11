import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ParticipationCertificateEntity } from "@/features/certificates/participation-certificate.entity";
import { DashboardController } from "@/features/dashboard/dashboard.controller";
import { DashboardService } from "@/features/dashboard/dashboard.service";
import { EnrollmentEntity } from "@/features/opportunities/enrollment.entity";
import { SubmissionEntity } from "@/features/certificates/submission.entity";

@Module({
  imports: [TypeOrmModule.forFeature([EnrollmentEntity, ParticipationCertificateEntity, SubmissionEntity])],
  controllers: [DashboardController], providers: [DashboardService],
})
export class DashboardModule {}
