import { PartialType } from "@nestjs/mapped-types";
import { Transform } from "class-transformer";
import { IsIn, IsInt, IsString, Max, MaxLength, Min, MinLength } from "class-validator";
import { categorySchema, type Category } from "@/common/domain";
import { trimText } from "@/common/dto-transforms";

export class SubmissionFieldsDto {
  @Transform(trimText) @IsString() @MinLength(5) @MaxLength(150)
  declare title: string;

  @IsIn(categorySchema.options)
  declare category: Category;

  @Transform(({ value }: { value: unknown }) => typeof value === "string" && /^\d+$/u.test(value) ? Number(value) : value)
  @IsInt() @Min(1) @Max(200)
  declare hours: number;

  @Transform(trimText) @IsString() @MinLength(10) @MaxLength(5000)
  declare description: string;
}

export class UpdateSubmissionDto extends PartialType(SubmissionFieldsDto, { skipNullProperties: false }) {}
