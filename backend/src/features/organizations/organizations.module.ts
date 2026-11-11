import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ParticipationCertificateEntity } from "@/features/certificates/participation-certificate.entity";
import { EnrollmentEntity } from "@/features/opportunities/enrollment.entity";
import { OpportunitiesModule } from "@/features/opportunities/opportunities.module";
import { OpportunityEntity } from "@/features/opportunities/opportunity.entity";
import { OrganizationsController } from "@/features/organizations/organizations.controller";
import { OrganizationsService } from "@/features/organizations/organizations.service";

@Module({
  imports: [TypeOrmModule.forFeature([OpportunityEntity, EnrollmentEntity, ParticipationCertificateEntity]), OpportunitiesModule],
  controllers: [OrganizationsController], providers: [OrganizationsService],
})
export class OrganizationsModule {}
