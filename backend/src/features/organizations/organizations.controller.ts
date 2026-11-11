import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post } from "@nestjs/common";
import { ApiConflictResponse, ApiCreatedResponse, ApiOkResponse, ApiOperation, ApiParam, ApiTags } from "@nestjs/swagger";
import { ApiNotFound, ApiRole, ApiValidation, ErrorResponseDto } from "@/common/http/api-docs";
import { CurrentAuth, Roles, type AuthIdentity } from "@/features/auth/auth-context";
import { AttendanceDto } from "@/features/organizations/attendance.dto";
import { OrganizationsService } from "@/features/organizations/organizations.service";

const activityParam = ApiParam({ name: "id", description: "Identificador (slug) da atividade da organização.", example: "horta-comunitaria" });

@ApiTags("Gestão da organização")
@ApiRole("organization")
@Controller("organizations/activities")
@Roles("organization")
export class OrganizationsController {
  constructor(private readonly organizations: OrganizationsService) {}

  @Get()
  @ApiOperation({ summary: "Listar atividades próprias com participantes" }) @ApiOkResponse({ description: "Atividades da organização autenticada." })
  list(@CurrentAuth() identity: AuthIdentity) { return this.organizations.list(identity.user.id); }

  @Patch(":id/participants/:participantId") @activityParam
  @ApiParam({ name: "participantId", format: "uuid", description: "Id da inscrição (participante)." })
  @ApiOperation({ summary: "Registrar presença" }) @ApiOkResponse({ description: "{ participant }" })
  @ApiValidation() @ApiNotFound("Atividade ou participante não encontrado.")
  @ApiConflictResponse({ description: "Presença encerrada após a emissão dos certificados.", type: ErrorResponseDto })
  attendance(@CurrentAuth() identity: AuthIdentity, @Param("id") id: string,
    @Param("participantId", ParseUUIDPipe) participantId: string, @Body() input: AttendanceDto) {
    return this.organizations.attendance(identity.user.id, id, participantId, input.status);
  }

  @Post(":id/certificates") @activityParam
  @ApiOperation({ summary: "Emitir certificados", description: "Concede as horas aos participantes com status Presente e encerra a atividade." })
  @ApiCreatedResponse({ description: "{ activityId, sentCount, certificatesDispatched: true }" }) @ApiNotFound()
  @ApiConflictResponse({ description: "Já emitidos ou nenhum participante presente.", type: ErrorResponseDto })
  dispatch(@CurrentAuth() identity: AuthIdentity, @Param("id") id: string) { return this.organizations.dispatch(identity.user.id, id); }
}
