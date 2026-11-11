import { Body, Controller, HttpCode, Patch } from "@nestjs/common";
import { ApiBadRequestResponse, ApiForbiddenResponse, ApiNoContentResponse, ApiOkResponse, ApiOperation, ApiTags } from "@nestjs/swagger";
import { ApiPrivate, ApiValidation, ErrorResponseDto } from "@/common/http/api-docs";
import { ChangePasswordDto, UpdateProfileDto } from "@/features/account/account.dto";
import { AccountService } from "@/features/account/account.service";
import { CurrentAuth, type AuthIdentity } from "@/features/auth/auth-context";

@ApiTags("Conta")
@ApiPrivate()
@Controller("account")
export class AccountController {
  constructor(private readonly account: AccountService) {}

  @Patch("profile")
  @ApiOperation({ summary: "Atualizar meu perfil", description: "Nome do usuário e, para organizações, o nome da organização." })
  @ApiOkResponse({ description: "{ user }" }) @ApiValidation()
  @ApiForbiddenResponse({ description: "organizationName enviado por conta que não é organização.", type: ErrorResponseDto })
  profile(@CurrentAuth() identity: AuthIdentity, @Body() input: UpdateProfileDto) { return this.account.updateProfile(identity, input); }

  @Patch("password") @HttpCode(204)
  @ApiOperation({ summary: "Trocar minha senha", description: "Exige a senha atual e encerra as demais sessões da conta." })
  @ApiNoContentResponse({ description: "Senha alterada." })
  @ApiBadRequestResponse({ description: "Dados inválidos ou senha atual incorreta.", type: ErrorResponseDto })
  password(@CurrentAuth() identity: AuthIdentity, @Body() input: ChangePasswordDto): Promise<void> { return this.account.changePassword(identity, input); }
}
