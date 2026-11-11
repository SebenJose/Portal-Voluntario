import { Controller, Get } from "@nestjs/common";
import { ApiOkResponse, ApiOperation, ApiTags } from "@nestjs/swagger";
import { ApiRole } from "@/common/http/api-docs";
import { CurrentAuth, Roles, type AuthIdentity } from "@/features/auth/auth-context";
import { DashboardService } from "@/features/dashboard/dashboard.service";

@ApiTags("Painel")
@Controller("dashboard")
export class DashboardController {
  constructor(private readonly dashboard: DashboardService) {}
  @Get() @Roles("volunteer") @ApiRole("volunteer")
  @ApiOperation({ summary: "Resumo do usuário", description: "Horas homologadas por eixo (certificados de participação e certificados externos aprovados), inscrições e atividades." })
  @ApiOkResponse({ description: "{ hoursSummary, registrations, upcomingActivities }" })
  summary(@CurrentAuth() identity: AuthIdentity) { return this.dashboard.summary(identity.user.id); }
}
