import { ApiProperty, PartialType } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import { IsIn, IsInt, IsString, Max, MaxLength, Min, MinLength } from "class-validator";
import { categorySchema, type Category } from "@/common/domain";
import { trimText } from "@/common/dto-transforms";

export class SubmissionFieldsDto {
  @ApiProperty({ type: String, minLength: 5, maxLength: 150, example: "Semana de iniciação científica" })
  @Transform(trimText) @IsString() @MinLength(5) @MaxLength(150)
  declare title: string;

  @ApiProperty({ enum: categorySchema.options, example: "Pesquisa" })
  @IsIn(categorySchema.options)
  declare category: Category;

  @ApiProperty({ type: Number, minimum: 1, maximum: 200, example: 8 })
  @Transform(({ value }: { value: unknown }) => typeof value === "string" && /^\d+$/u.test(value) ? Number(value) : value)
  @IsInt() @Min(1) @Max(200)
  declare hours: number;

  @ApiProperty({ type: String, minLength: 10, maxLength: 5000, example: "Apresentação de pôster no evento do campus." })
  @Transform(trimText) @IsString() @MinLength(10) @MaxLength(5000)
  declare description: string;
}

/** Corpo multipart do upload: campos do certificado + o arquivo `document`. */
export class CreateSubmissionDto extends SubmissionFieldsDto {
  @ApiProperty({ type: "string", format: "binary", description: "PDF, JPG ou PNG com até 5 MB." })
  declare document: unknown;
}

export class UpdateSubmissionDto extends PartialType(SubmissionFieldsDto, { skipNullProperties: false }) {}
