import { Transform } from "class-transformer";
import { IsEmail, IsString, MaxLength, MinLength } from "class-validator";
import { normalizeEmail, trimText } from "@/common/dto-transforms";

export class LoginDto {
  @Transform(normalizeEmail) @IsEmail() @MaxLength(254)
  declare email: string;

  @IsString() @MinLength(1) @MaxLength(72)
  declare password: string;
}

export class RegisterDto extends LoginDto {
  @Transform(trimText) @IsString() @MinLength(2) @MaxLength(100)
  declare name: string;

  @IsString() @MinLength(8) @MaxLength(72)
  declare passwordConfirmation: string;
}
