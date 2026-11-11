import { Body, Controller, Delete, Get, HttpCode, Param, ParseUUIDPipe, Patch, Post, StreamableFile, UploadedFile, UseInterceptors } from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { ApiBody, ApiConflictResponse, ApiConsumes, ApiCreatedResponse, ApiNoContentResponse, ApiOkResponse, ApiOperation, ApiParam, ApiPayloadTooLargeResponse, ApiProduces, ApiTags } from "@nestjs/swagger";
import { ApiNotFound, ApiRole, ApiValidation, ErrorResponseDto } from "@/common/http/api-docs";
import { CurrentAuth, Roles, type AuthIdentity } from "@/features/auth/auth-context";
import { CreateSubmissionDto, SubmissionFieldsDto, UpdateSubmissionDto } from "@/features/certificates/submission.dto";
import { SubmissionsService } from "@/features/certificates/submissions.service";

const idParam = ApiParam({ name: "id", format: "uuid", description: "Id do certificado enviado." });

@ApiTags("Certificados externos")
@ApiRole("volunteer")
@Roles("volunteer")
@Controller("submissions")
export class SubmissionsController {
  constructor(private readonly submissions: SubmissionsService) {}

  @Get()
  @ApiOperation({ summary: "Listar meus certificados" }) @ApiOkResponse({ description: "{ items: Submission[] }" })
  list(@CurrentAuth() identity: AuthIdentity) { return this.submissions.list(identity.user.id); }

  @Post()
  // Browsers send UTF-8 filenames without RFC 5987 encoding; multer defaults to latin1.
  @UseInterceptors(FileInterceptor("document", {
    defParamCharset: "utf8",
    limits: { fileSize: 5 * 1024 * 1024, files: 1, fields: 4, fieldSize: 10000, parts: 6 },
  }))
  @ApiOperation({ summary: "Enviar certificado com comprovante", description: "multipart/form-data. O conteúdo do arquivo é conferido (assinatura PDF/PNG/JPEG)." })
  @ApiConsumes("multipart/form-data") @ApiBody({ type: CreateSubmissionDto })
  @ApiCreatedResponse({ description: "Certificado registrado com status Em análise." }) @ApiValidation()
  @ApiPayloadTooLargeResponse({ description: "Arquivo acima de 5 MB ou campos demais.", type: ErrorResponseDto })
  create(@CurrentAuth() identity: AuthIdentity, @Body() input: SubmissionFieldsDto, @UploadedFile() file: unknown) {
    return this.submissions.create(identity.user.id, input, file);
  }

  @Get(":id") @idParam
  @ApiOperation({ summary: "Detalhar meu certificado" }) @ApiOkResponse({ description: "Certificado." }) @ApiValidation() @ApiNotFound("Certificado não encontrado (ou de outro usuário).")
  get(@CurrentAuth() identity: AuthIdentity, @Param("id", ParseUUIDPipe) id: string) { return this.submissions.get(identity.user.id, id); }

  @Patch(":id") @idParam
  @ApiOperation({ summary: "Atualizar meu certificado", description: "Permitido apenas enquanto o status for Em análise." }) @ApiOkResponse({ description: "Certificado atualizado." }) @ApiValidation() @ApiNotFound()
  @ApiConflictResponse({ description: "Certificado já avaliado.", type: ErrorResponseDto })
  update(@CurrentAuth() identity: AuthIdentity, @Param("id", ParseUUIDPipe) id: string, @Body() input: UpdateSubmissionDto) {
    return this.submissions.update(identity.user.id, id, input);
  }

  @Delete(":id") @HttpCode(204) @idParam
  @ApiOperation({ summary: "Excluir meu certificado", description: "Permitido apenas enquanto o status for Em análise." }) @ApiNoContentResponse({ description: "Excluído." }) @ApiValidation() @ApiNotFound()
  @ApiConflictResponse({ description: "Certificado já avaliado.", type: ErrorResponseDto })
  remove(@CurrentAuth() identity: AuthIdentity, @Param("id", ParseUUIDPipe) id: string) { return this.submissions.remove(identity.user.id, id); }

  @Get(":id/document") @idParam
  @ApiOperation({ summary: "Baixar o comprovante original" }) @ApiProduces("application/pdf", "image/png", "image/jpeg")
  @ApiOkResponse({ description: "Arquivo original como anexo.", schema: { type: "string", format: "binary" } }) @ApiValidation() @ApiNotFound()
  async document(@CurrentAuth() identity: AuthIdentity, @Param("id", ParseUUIDPipe) id: string): Promise<StreamableFile> {
    const document = await this.submissions.document(identity.user.id, id);
    return new StreamableFile(document.document, {
      type: document.documentType, length: document.documentSize,
      disposition: `attachment; filename*=UTF-8''${encodeURIComponent(document.documentName)}`,
    });
  }
}
