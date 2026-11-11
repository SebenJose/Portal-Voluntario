import { Module } from "@nestjs/common";
import { DashboardController } from "@/features/dashboard/dashboard.controller";
import { DashboardService } from "@/features/dashboard/dashboard.service";

@Module({ controllers: [DashboardController], providers: [DashboardService] })
export class DashboardModule {}
