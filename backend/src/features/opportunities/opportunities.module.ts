import { Module } from "@nestjs/common";
import { OpportunitiesController } from "@/features/opportunities/opportunities.controller";
import { OpportunitiesService } from "@/features/opportunities/opportunities.service";

@Module({ controllers: [OpportunitiesController], providers: [OpportunitiesService], exports: [OpportunitiesService] })
export class OpportunitiesModule {}
