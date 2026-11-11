import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post, Query } from "@nestjs/common";
import { ApiBearerAuth, ApiConflictResponse, ApiCreatedResponse, ApiNoContentResponse, ApiOkResponse, ApiOperation, ApiParam, ApiTags } from "@nestjs/swagger";
import { ApiNotFound, ApiRole, ApiValidation, BEARER_AUTH, ErrorResponseDto } from "@/common/http/api-docs";
import { CurrentAuth, OptionalAuth, OptionalUser, Roles, type AuthIdentity } from "@/features/auth/auth-context";
import type { User } from "@/features/auth/user.entity";
import { CreateOpportunityDto, OpportunityQueryDto, UpdateOpportunityDto } from "@/features/opportunities/opportunity.dto";
import { OpportunitiesService } from "@/features/opportunities/opportunities.service";

const idParam = ApiParam({ name: "id", description: "Identificador (slug) da oportunidade.", example: "horta-comunitaria" });
const conflict = (description: string) => ApiConflictResponse({ description, type: ErrorResponseDto });

@ApiTags("Oportunidades")
@Controller("opportunities")
export class OpportunitiesController {
  constructor(private readonly opportunities: OpportunitiesService) {}

  @Get() @OptionalAuth() @ApiBearerAuth(BEARER_AUTH)
  @ApiOperation({ summary: "Catálogo de oportunidades", description: "Público. Com token, `registeredIds` traz as inscrições do usuário." })
  @ApiOkResponse({ description: "{ items: Opportunity[], registeredIds: string[] }" }) @ApiValidation()
  list(@OptionalUser() user: User | undefined, @Query() query: OpportunityQueryDto) { return this.opportunities.catalog(user?.id, query); }

  @Get(":id") @OptionalAuth() @idParam
  @ApiOperation({ summary: "Detalhar oportunidade" }) @ApiOkResponse({ description: "Oportunidade com sessões e inscritos." }) @ApiNotFound()
  get(@Param("id") id: string) { return this.opportunities.get(id); }

  @Post() @Roles("organization") @ApiRole("organization")
  @ApiOperation({ summary: "Criar oportunidade" }) @ApiCreatedResponse({ description: "Oportunidade criada." })
  @ApiValidation() @conflict("Identificador já em uso.")
  create(@CurrentAuth() identity: AuthIdentity, @Body() input: CreateOpportunityDto) { return this.opportunities.create(identity.user.id, input); }

  @Patch(":id") @Roles("organization") @ApiRole("organization") @idParam
  @ApiOperation({ summary: "Atualizar oportunidade própria" }) @ApiOkResponse({ description: "Oportunidade atualizada." })
  @ApiValidation() @ApiNotFound() @conflict("Certificados já emitidos ou vagas abaixo do número de inscritos.")
  update(@CurrentAuth() identity: AuthIdentity, @Param("id") id: string, @Body() input: UpdateOpportunityDto) { return this.opportunities.update(identity.user.id, id, input); }

  @Delete(":id") @Roles("organization") @HttpCode(204) @ApiRole("organization") @idParam
  @ApiOperation({ summary: "Excluir oportunidade própria" }) @ApiNoContentResponse({ description: "Excluída." })
  @ApiNotFound() @conflict("Há inscrições ou certificados.")
  remove(@CurrentAuth() identity: AuthIdentity, @Param("id") id: string) { return this.opportunities.remove(identity.user.id, id); }

  @Post(":id/registrations") @Roles("volunteer") @ApiRole("volunteer") @idParam
  @ApiOperation({ summary: "Inscrever-se" }) @ApiCreatedResponse({ description: "{ opportunityId, registered: true, enrolled }" })
  @ApiNotFound() @conflict("Já inscrito, vagas preenchidas ou inscrições encerradas.")
  enroll(@CurrentAuth() identity: AuthIdentity, @Param("id") id: string) { return this.opportunities.enroll(identity.user.id, id); }

  @Delete(":id/registrations") @Roles("volunteer") @ApiRole("volunteer") @idParam
  @ApiOperation({ summary: "Cancelar inscrição" }) @ApiOkResponse({ description: "{ opportunityId, registered: false, enrolled }" })
  @ApiNotFound("Oportunidade ou inscrição não encontrada.") @conflict("Participação encerrada após a emissão dos certificados.")
  cancel(@CurrentAuth() identity: AuthIdentity, @Param("id") id: string) { return this.opportunities.cancel(identity.user.id, id); }
}
