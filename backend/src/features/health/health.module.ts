import { Module } from "@nestjs/common";

import { HealthController } from "@/features/health/health.controller";
import { HealthService } from "@/features/health/health.service";

@Module({ controllers: [HealthController], providers: [HealthService] })
export class HealthModule {}
