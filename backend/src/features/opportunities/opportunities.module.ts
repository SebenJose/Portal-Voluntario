import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ActivitySessionEntity } from "@/features/opportunities/activity-session.entity";
import { EnrollmentEntity } from "@/features/opportunities/enrollment.entity";
import { OpportunitiesController } from "@/features/opportunities/opportunities.controller";
import { OpportunitiesService } from "@/features/opportunities/opportunities.service";
import { OpportunityEntity } from "@/features/opportunities/opportunity.entity";
import { OrganizationEntity } from "@/features/organizations/organization.entity";

@Module({
  imports: [TypeOrmModule.forFeature([OpportunityEntity, ActivitySessionEntity, EnrollmentEntity, OrganizationEntity])],
  controllers: [OpportunitiesController], providers: [OpportunitiesService], exports: [OpportunitiesService],
})
export class OpportunitiesModule {}
