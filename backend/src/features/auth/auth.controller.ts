import { Body, Controller, Get, HttpCode, Post } from "@nestjs/common";
import { ApiAcceptedResponse, ApiNoContentResponse, ApiOkResponse, ApiOperation, ApiTags, ApiTooManyRequestsResponse, ApiUnauthorizedResponse } from "@nestjs/swagger";
import { ApiPrivate, ApiValidation, ErrorResponseDto } from "@/common/http/api-docs";
import { CurrentAuth, Public, type AuthIdentity } from "@/features/auth/auth-context";
import { LoginDto, RegisterDto, RegisterOrganizationDto } from "@/features/auth/auth.dto";
import { AuthService } from "@/features/auth/auth.service";

const tooMany = ApiTooManyRequestsResponse({ description: "Muitas tentativas para a conta ou para o serviço.", type: ErrorResponseDto });

@ApiTags("Autenticação")
@Controller("auth")
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Public() @Post("register") @HttpCode(202)
  @ApiOperation({ summary: "Cadastrar voluntário", description: "Sempre cria o papel volunteer. A resposta é a mesma se o e-mail já existir (evita enumeração)." })
  @ApiAcceptedResponse({ description: "Cadastro processado." }) @ApiValidation() @tooMany
  register(@Body() input: RegisterDto) { return this.auth.register(input); }

  @Public() @Post("register/organization") @HttpCode(202)
  @ApiOperation({ summary: "Cadastrar organização", description: "Cria o responsável com papel organization e a organização com status pending. A gestão só é liberada após aprovação de um administrador." })
  @ApiAcceptedResponse({ description: "Cadastro processado; aguarda aprovação." }) @ApiValidation() @tooMany
  registerOrganization(@Body() input: RegisterOrganizationDto) { return this.auth.registerOrganization(input); }

  @Public() @Post("login") @HttpCode(200)
  @ApiOperation({ summary: "Entrar e obter o JWT", description: "Retorna `accessToken` (JWT HS256, 8h). Use-o no botão Authorize." })
  @ApiOkResponse({ description: "Login realizado: { accessToken, expiresAt, user }." }) @ApiValidation()
  @ApiUnauthorizedResponse({ description: "E-mail ou senha incorretos.", type: ErrorResponseDto }) @tooMany
  login(@Body() input: LoginDto) { return this.auth.login(input); }

  @Get("session") @ApiPrivate()
  @ApiOperation({ summary: "Usuário da sessão atual" }) @ApiOkResponse({ description: "{ user: { id, name, email, role, organization? } }" })
  async session(@CurrentAuth() identity: AuthIdentity) { return { user: await this.auth.present(identity.user, identity.organization) }; }

  @Post("logout") @HttpCode(204) @ApiPrivate()
  @ApiOperation({ summary: "Sair", description: "Revoga somente a sessão do token enviado." }) @ApiNoContentResponse({ description: "Sessão revogada." })
  logout(@CurrentAuth() identity: AuthIdentity): Promise<void> { return this.auth.logout(identity.sessionId); }
}
