import { ApiProperty } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import { IsEmail, IsString, MaxLength, MinLength } from "class-validator";
import { normalizeEmail, trimText } from "@/common/dto-transforms";

export class LoginDto {
  @ApiProperty({ type: String, format: "email", maxLength: 254, example: "voluntario@portal.example" })
  @Transform(normalizeEmail) @IsEmail() @MaxLength(254)
  declare email: string;

  @ApiProperty({ type: String, format: "password", minLength: 1, description: "Até 72 bytes em UTF-8 (limite do bcrypt)." })
  @IsString() @MinLength(1) @MaxLength(72)
  declare password: string;
}

export class RegisterDto extends LoginDto {
  @ApiProperty({ type: String, minLength: 2, maxLength: 100, example: "Maria Souza" })
  @Transform(trimText) @IsString() @MinLength(2) @MaxLength(100)
  declare name: string;

  @ApiProperty({ type: String, format: "password", minLength: 8, description: "Deve ser igual a password." })
  @IsString() @MinLength(8) @MaxLength(72)
  declare passwordConfirmation: string;
}

export class RegisterOrganizationDto extends RegisterDto {
  @ApiProperty({ type: String, minLength: 2, maxLength: 150, example: "Instituto Mãos Dadas", description: "Nome público da organização." })
  @Transform(trimText) @IsString() @MinLength(2) @MaxLength(150)
  declare organizationName: string;
}
