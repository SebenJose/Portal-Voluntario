import { ApiProperty, ApiPropertyOptional, OmitType, PartialType } from "@nestjs/swagger";
import { Transform, Type } from "class-transformer";
import { ArrayMaxSize, ArrayMinSize, IsArray, IsBoolean, IsDateString, IsIn, IsInt, IsOptional, IsString, Matches, Max, MaxLength, Min, MinLength, ValidateIf, ValidateNested } from "class-validator";
import { categorySchema, formatSchema, type ActivityFormat, type Category } from "@/common/domain";
import { trimText } from "@/common/dto-transforms";

export class ActivitySessionDto {
  @ApiProperty({ type: String, format: "date", example: "2027-01-10" })
  @IsDateString({ strict: true })
  @Matches(/^\d{4}-\d{2}-\d{2}$/u)
  declare date: string;

  @ApiProperty({ type: String, pattern: "^([01]\\d|2[0-3]):[0-5]\\d$", example: "08:00" })
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/u)
  declare startsAt: string;

  @ApiProperty({ type: String, pattern: "^([01]\\d|2[0-3]):[0-5]\\d$", example: "12:00", description: "Deve ser posterior a startsAt." })
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/u)
  declare endsAt: string;
}

export class CreateOpportunityDto {
  @ApiProperty({ type: String, maxLength: 100, pattern: "^[a-z0-9]+(?:-[a-z0-9]+)*$", example: "mutirao-de-leitura", description: "Identificador (slug) único." })
  @IsString() @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/u) @MaxLength(100)
  declare id: string;

  @ApiProperty({ type: String, minLength: 5, maxLength: 150, example: "Mutirão de leitura" })
  @Transform(trimText) @IsString() @MinLength(5) @MaxLength(150)
  declare title: string;

  @ApiProperty({ type: String, minLength: 10, maxLength: 5000, example: "Leitura mediada para crianças da rede pública." })
  @Transform(trimText) @IsString() @MinLength(10) @MaxLength(5000)
  declare description: string;

  @ApiProperty({ enum: categorySchema.options, example: "Extensão" })
  @IsIn(categorySchema.options)
  declare category: Category;

  @ApiProperty({ enum: formatSchema.options, example: "Presencial" })
  @IsIn(formatSchema.options)
  declare format: ActivityFormat;

  @ApiProperty({ type: String, minLength: 2, maxLength: 200, example: "Biblioteca Municipal" })
  @Transform(trimText) @IsString() @MinLength(2) @MaxLength(200)
  declare location: string;

  @ApiProperty({ type: String, minLength: 2, maxLength: 200, example: "10 de janeiro de 2027" })
  @Transform(trimText) @IsString() @MinLength(2) @MaxLength(200)
  declare dateLabel: string;

  @ApiProperty({ type: String, minLength: 2, maxLength: 200, example: "Das 8h às 12h" })
  @Transform(trimText) @IsString() @MinLength(2) @MaxLength(200)
  declare durationLabel: string;

  @ApiProperty({ type: Number, minimum: 1, maximum: 200, example: 4 })
  @IsInt() @Min(1) @Max(200)
  declare hours: number;

  @ApiProperty({ type: Number, minimum: 1, maximum: 10000, example: 10 })
  @IsInt() @Min(1) @Max(10000)
  declare vacancies: number;

  @ApiPropertyOptional({ type: Boolean, default: false })
  @ValidateIf((_object: unknown, value: unknown) => value !== undefined) @IsBoolean()
  declare featured?: boolean;

  @ApiProperty({ type: () => [ActivitySessionDto], minItems: 1, maxItems: 100 })
  @IsArray() @ArrayMinSize(1) @ArrayMaxSize(100) @ValidateNested({ each: true }) @Type(() => ActivitySessionDto)
  declare sessions: ActivitySessionDto[];
}

export class UpdateOpportunityDto extends PartialType(OmitType(CreateOpportunityDto, ["id"]), { skipNullProperties: false }) {}

export class OpportunityQueryDto {
  @ApiPropertyOptional({ type: String, maxLength: 100, description: "Busca em título, organização, descrição e local.", example: "leitura" })
  @IsOptional() @IsString() @MaxLength(100)
  declare search?: string;

  @ApiPropertyOptional({ enum: categorySchema.options })
  @IsOptional() @IsIn(categorySchema.options)
  declare category?: Category;

  @ApiPropertyOptional({ enum: formatSchema.options })
  @IsOptional() @IsIn(formatSchema.options)
  declare format?: ActivityFormat;

  @ApiPropertyOptional({ enum: ["title", "hours"], default: "title" })
  @IsOptional() @IsIn(["title", "hours"])
  declare sort?: "title" | "hours";
}
