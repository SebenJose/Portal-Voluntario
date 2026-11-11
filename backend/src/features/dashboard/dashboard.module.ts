import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ParticipationCertificateEntity } from "@/features/certificates/participation-certificate.entity";
import { DashboardController } from "@/features/dashboard/dashboard.controller";
import { DashboardService } from "@/features/dashboard/dashboard.service";
import { EnrollmentEntity } from "@/features/opportunities/enrollment.entity";

@Module({
  imports: [TypeOrmModule.forFeature([EnrollmentEntity, ParticipationCertificateEntity])],
  controllers: [DashboardController], providers: [DashboardService],
})
export class DashboardModule {}
