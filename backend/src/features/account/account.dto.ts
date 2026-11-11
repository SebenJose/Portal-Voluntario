import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import { IsOptional, IsString, MaxLength, MinLength } from "class-validator";
import { trimText } from "@/common/dto-transforms";

export class UpdateProfileDto {
  @ApiPropertyOptional({ type: String, minLength: 2, maxLength: 100, example: "Maria Souza" })
  @IsOptional() @Transform(trimText) @IsString() @MinLength(2) @MaxLength(100)
  declare name?: string;

  @ApiPropertyOptional({ type: String, minLength: 2, maxLength: 150, description: "Somente para contas de organização.", example: "Instituto Mãos Dadas" })
  @IsOptional() @Transform(trimText) @IsString() @MinLength(2) @MaxLength(150)
  declare organizationName?: string;
}

export class ChangePasswordDto {
  @ApiProperty({ type: String, format: "password", minLength: 1 })
  @IsString() @MinLength(1) @MaxLength(72)
  declare currentPassword: string;

  @ApiProperty({ type: String, format: "password", minLength: 8, description: "Até 72 bytes em UTF-8." })
  @IsString() @MinLength(8) @MaxLength(72)
  declare newPassword: string;

  @ApiProperty({ type: String, format: "password", minLength: 8, description: "Deve ser igual a newPassword." })
  @IsString() @MinLength(8) @MaxLength(72)
  declare newPasswordConfirmation: string;
}
