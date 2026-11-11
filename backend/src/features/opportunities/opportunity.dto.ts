import { OmitType, PartialType } from "@nestjs/mapped-types";
import { Transform, Type } from "class-transformer";
import { ArrayMaxSize, ArrayMinSize, IsArray, IsBoolean, IsDateString, IsIn, IsInt, IsOptional, IsString, Matches, Max, MaxLength, Min, MinLength, ValidateIf, ValidateNested } from "class-validator";
import { categorySchema, formatSchema, type ActivityFormat, type Category } from "@/common/domain";
import { trimText } from "@/common/dto-transforms";

export class ActivitySessionDto {
  @IsDateString({ strict: true })
  @Matches(/^\d{4}-\d{2}-\d{2}$/u)
  declare date: string;

  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/u)
  declare startsAt: string;

  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/u)
  declare endsAt: string;
}

export class CreateOpportunityDto {
  @IsString() @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/u) @MaxLength(100)
  declare id: string;

  @Transform(trimText) @IsString() @MinLength(5) @MaxLength(150)
  declare title: string;

  @Transform(trimText) @IsString() @MinLength(10) @MaxLength(5000)
  declare description: string;

  @IsIn(categorySchema.options)
  declare category: Category;

  @IsIn(formatSchema.options)
  declare format: ActivityFormat;

  @Transform(trimText) @IsString() @MinLength(2) @MaxLength(200)
  declare location: string;

  @Transform(trimText) @IsString() @MinLength(2) @MaxLength(200)
  declare dateLabel: string;

  @Transform(trimText) @IsString() @MinLength(2) @MaxLength(200)
  declare durationLabel: string;

  @IsInt() @Min(1) @Max(200)
  declare hours: number;

  @IsInt() @Min(1) @Max(10000)
  declare vacancies: number;

  @ValidateIf((_object: unknown, value: unknown) => value !== undefined) @IsBoolean()
  declare featured?: boolean;

  @IsArray() @ArrayMinSize(1) @ArrayMaxSize(100) @ValidateNested({ each: true }) @Type(() => ActivitySessionDto)
  declare sessions: ActivitySessionDto[];
}

export class UpdateOpportunityDto extends PartialType(OmitType(CreateOpportunityDto, ["id"]), { skipNullProperties: false }) {}

export class OpportunityQueryDto {
  @IsOptional() @IsString() @MaxLength(100)
  declare search?: string;

  @IsOptional() @IsIn(categorySchema.options)
  declare category?: Category;

  @IsOptional() @IsIn(formatSchema.options)
  declare format?: ActivityFormat;

  @IsOptional() @IsIn(["title", "hours"])
  declare sort?: "title" | "hours";
}
