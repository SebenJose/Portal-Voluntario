import { Module } from "@nestjs/common";
import { OpportunitiesModule } from "@/features/opportunities/opportunities.module";
import { OrganizationsController } from "@/features/organizations/organizations.controller";
import { OrganizationsService } from "@/features/organizations/organizations.service";

@Module({ imports: [OpportunitiesModule], controllers: [OrganizationsController], providers: [OrganizationsService] })
export class OrganizationsModule {}
