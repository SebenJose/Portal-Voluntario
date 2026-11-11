import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AdminController } from "@/features/admin/admin.controller";
import { AdminService } from "@/features/admin/admin.service";
import { SubmissionEntity } from "@/features/certificates/submission.entity";
import { OpportunityEntity } from "@/features/opportunities/opportunity.entity";
import { OrganizationEntity } from "@/features/organizations/organization.entity";

@Module({
  imports: [TypeOrmModule.forFeature([OrganizationEntity, OpportunityEntity, SubmissionEntity])],
  controllers: [AdminController], providers: [AdminService],
})
export class AdminModule {}
