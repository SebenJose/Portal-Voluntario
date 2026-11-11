import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Query, StreamableFile } from "@nestjs/common";
import { ApiConflictResponse, ApiOkResponse, ApiOperation, ApiParam, ApiProduces, ApiTags } from "@nestjs/swagger";
import { ApiNotFound, ApiRole, ApiValidation, ErrorResponseDto } from "@/common/http/api-docs";
import { OrganizationDecisionDto, OrganizationQueryDto, SubmissionQueryDto, SubmissionReviewDto } from "@/features/admin/admin.dto";
import { AdminService } from "@/features/admin/admin.service";
import { CurrentAuth, Roles, type AuthIdentity } from "@/features/auth/auth-context";

const uuidParam = (description: string) => ApiParam({ name: "id", format: "uuid", description });
const conflict = (description: string) => ApiConflictResponse({ description, type: ErrorResponseDto });

@ApiTags("Administração")
@ApiRole("admin")
@Roles("admin")
@Controller("admin")
export class AdminController {
  constructor(private readonly admin: AdminService) {}

  @Get("organizations")
  @ApiOperation({ summary: "Listar organizações cadastradas" }) @ApiOkResponse({ description: "Organizações com responsável, status e número de atividades." }) @ApiValidation()
  organizations(@Query() query: OrganizationQueryDto) { return this.admin.listOrganizations(query); }

  @Patch("organizations/:id") @uuidParam("Id da organização.")
  @ApiOperation({ summary: "Aprovar ou recusar organização", description: "Organizações só gerenciam atividades depois de aprovadas." })
  @ApiOkResponse({ description: "Organização com o novo status." }) @ApiValidation() @ApiNotFound() @conflict("A organização já está com este status.")
  decide(@Param("id", ParseUUIDPipe) id: string, @Body() input: OrganizationDecisionDto) { return this.admin.decideOrganization(id, input); }

  @Get("submissions")
  @ApiOperation({ summary: "Listar certificados externos para avaliação" }) @ApiOkResponse({ description: "{ items: certificados com dados do voluntário }" }) @ApiValidation()
  submissions(@Query() query: SubmissionQueryDto) { return this.admin.listSubmissions(query); }

  @Patch("submissions/:id/review") @uuidParam("Id do certificado.")
  @ApiOperation({ summary: "Avaliar certificado externo", description: "Aprovado soma as horas ao banco do voluntário. Recusado exige justificativa." })
  @ApiOkResponse({ description: "Certificado avaliado." }) @ApiValidation() @ApiNotFound() @conflict("Certificado já avaliado.")
  review(@CurrentAuth() identity: AuthIdentity, @Param("id", ParseUUIDPipe) id: string, @Body() input: SubmissionReviewDto) {
    return this.admin.reviewSubmission(identity.user.id, id, input);
  }

  @Get("submissions/:id/document") @uuidParam("Id do certificado.")
  @ApiOperation({ summary: "Baixar comprovante para avaliação" }) @ApiProduces("application/pdf", "image/png", "image/jpeg")
  @ApiOkResponse({ description: "Arquivo original como anexo.", schema: { type: "string", format: "binary" } }) @ApiValidation() @ApiNotFound()
  async document(@Param("id", ParseUUIDPipe) id: string): Promise<StreamableFile> {
    const document = await this.admin.document(id);
    return new StreamableFile(document.document, {
      type: document.documentType, length: document.documentSize,
      disposition: `attachment; filename*=UTF-8''${encodeURIComponent(document.documentName)}`,
    });
  }
}
