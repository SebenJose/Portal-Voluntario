import { Module } from "@nestjs/common";
import { SubmissionsController } from "@/features/certificates/submissions.controller";
import { SubmissionsService } from "@/features/certificates/submissions.service";

@Module({ controllers: [SubmissionsController], providers: [SubmissionsService] })
export class CertificatesModule {}
