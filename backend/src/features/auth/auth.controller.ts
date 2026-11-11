import { Body, Controller, Get, HttpCode, Post } from "@nestjs/common";
import { CurrentAuth, Public, type AuthIdentity } from "@/features/auth/auth-context";
import { LoginDto, RegisterDto } from "@/features/auth/auth.dto";
import { AuthService } from "@/features/auth/auth.service";
import { publicUser } from "@/features/auth/user.entity";

@Controller("auth")
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Public() @Post("register") @HttpCode(202)
  register(@Body() input: RegisterDto) { return this.auth.register(input); }

  @Public() @Post("login") @HttpCode(200)
  login(@Body() input: LoginDto) { return this.auth.login(input); }

  @Get("session")
  session(@CurrentAuth() identity: AuthIdentity) { return { user: publicUser(identity.user) }; }

  @Post("logout") @HttpCode(204)
  logout(@CurrentAuth() identity: AuthIdentity): Promise<void> { return this.auth.logout(identity.sessionId); }
}
