import { Controller, Get } from "@nestjs/common";
import { CurrentAuth, type AuthIdentity } from "@/features/auth/auth-context";
import { DashboardService } from "@/features/dashboard/dashboard.service";

@Controller("dashboard")
export class DashboardController {
  constructor(private readonly dashboard: DashboardService) {}
  @Get()
  summary(@CurrentAuth() identity: AuthIdentity) { return this.dashboard.summary(identity.user.id); }
}
