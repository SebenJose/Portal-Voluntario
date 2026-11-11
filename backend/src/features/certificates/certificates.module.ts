import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { SubmissionEntity } from "@/features/certificates/submission.entity";
import { SubmissionsController } from "@/features/certificates/submissions.controller";
import { SubmissionsService } from "@/features/certificates/submissions.service";

@Module({ imports: [TypeOrmModule.forFeature([SubmissionEntity])], controllers: [SubmissionsController], providers: [SubmissionsService] })
export class CertificatesModule {}
