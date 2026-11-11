import { Body, Controller, Delete, Get, HttpCode, Param, ParseUUIDPipe, Patch, Post, StreamableFile, UploadedFile, UseInterceptors } from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { CurrentAuth, type AuthIdentity } from "@/features/auth/auth-context";
import { SubmissionFieldsDto, UpdateSubmissionDto } from "@/features/certificates/submission.dto";
import { SubmissionsService } from "@/features/certificates/submissions.service";

@Controller("submissions")
export class SubmissionsController {
  constructor(private readonly submissions: SubmissionsService) {}

  @Get()
  list(@CurrentAuth() identity: AuthIdentity) { return this.submissions.list(identity.user.id); }

  @Post()
  @UseInterceptors(FileInterceptor("document", { limits: { fileSize: 5 * 1024 * 1024, files: 1, fields: 4, fieldSize: 10000, parts: 6 } }))
  create(@CurrentAuth() identity: AuthIdentity, @Body() input: SubmissionFieldsDto, @UploadedFile() file: unknown) {
    return this.submissions.create(identity.user.id, input, file);
  }

  @Get(":id")
  get(@CurrentAuth() identity: AuthIdentity, @Param("id", ParseUUIDPipe) id: string) { return this.submissions.get(identity.user.id, id); }

  @Patch(":id")
  update(@CurrentAuth() identity: AuthIdentity, @Param("id", ParseUUIDPipe) id: string, @Body() input: UpdateSubmissionDto) {
    return this.submissions.update(identity.user.id, id, input);
  }

  @Delete(":id") @HttpCode(204)
  remove(@CurrentAuth() identity: AuthIdentity, @Param("id", ParseUUIDPipe) id: string) { return this.submissions.remove(identity.user.id, id); }

  @Get(":id/document")
  async document(@CurrentAuth() identity: AuthIdentity, @Param("id", ParseUUIDPipe) id: string): Promise<StreamableFile> {
    const document = await this.submissions.document(identity.user.id, id);
    return new StreamableFile(document.document, {
      type: document.documentType, length: document.documentSize,
      disposition: `attachment; filename*=UTF-8''${encodeURIComponent(document.documentName)}`,
    });
  }
}
