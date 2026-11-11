import { Controller, Get, Header } from "@nestjs/common";
import { ApiOkResponse, ApiOperation, ApiServiceUnavailableResponse, ApiTags } from "@nestjs/swagger";

import { HealthService } from "@/features/health/health.service";
import { Public } from "@/features/auth/auth-context";

@ApiTags("Saúde")
@Controller("health")
export class HealthController {
  constructor(private readonly health: HealthService) {}

  @Get()
  @Public()
  @Header("Cache-Control", "no-store")
  @ApiOperation({ summary: "Verificar API e banco SQLite" })
  @ApiOkResponse({ description: "{ status: \"ok\", database: \"up\" }" })
  @ApiServiceUnavailableResponse({ description: "Banco indisponível." })
  check(): Promise<{ status: "ok"; database: "up" }> {
    return this.health.check();
  }
}
