import { Controller, Get, Header } from "@nestjs/common";

import { HealthService } from "@/features/health/health.service";
import { Public } from "@/features/auth/auth-context";

@Controller("health")
export class HealthController {
  constructor(private readonly health: HealthService) {}

  @Get()
  @Public()
  @Header("Cache-Control", "no-store")
  check(): Promise<{ status: "ok"; database: "up" }> {
    return this.health.check();
  }
}
