import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import { IsIn, IsOptional, IsString, MaxLength, MinLength, ValidateIf } from "class-validator";
import { organizationStatusSchema, submissionStatusSchema, type OrganizationStatus, type SubmissionStatus } from "@/common/domain";
import { trimText } from "@/common/dto-transforms";

export class OrganizationQueryDto {
  @ApiPropertyOptional({ enum: organizationStatusSchema.options, description: "Filtra pelo status do cadastro." })
  @IsOptional() @IsIn(organizationStatusSchema.options)
  declare status?: OrganizationStatus;
}

export class OrganizationDecisionDto {
  @ApiProperty({ enum: ["approved", "rejected"], example: "approved" })
  @IsIn(["approved", "rejected"])
  declare status: "approved" | "rejected";
}

export class SubmissionQueryDto {
  @ApiPropertyOptional({ enum: submissionStatusSchema.options, description: "Filtra pelo status da avaliação." })
  @IsOptional() @IsIn(submissionStatusSchema.options)
  declare status?: SubmissionStatus;
}

export class SubmissionReviewDto {
  @ApiProperty({ enum: ["Aprovado", "Recusado"], example: "Aprovado" })
  @IsIn(["Aprovado", "Recusado"])
  declare status: "Aprovado" | "Recusado";

  @ApiPropertyOptional({ type: String, minLength: 5, maxLength: 1000, description: "Obrigatória ao recusar.", example: "O comprovante não informa a carga horária." })
  @Transform(trimText)
  @ValidateIf((object: SubmissionReviewDto, value: unknown) => object.status === "Recusado" || value !== undefined)
  @IsString() @MinLength(5) @MaxLength(1000)
  declare note?: string;
}
