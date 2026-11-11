import { Global, Module } from "@nestjs/common";
import { JwtModule, type JwtModuleOptions } from "@nestjs/jwt";
import { ENVIRONMENT } from "@/config/configuration.module";
import type { Environment } from "@/config/environment";
import { AuthController } from "@/features/auth/auth.controller";
import { AuthService, sessionDurationSeconds } from "@/features/auth/auth.service";
import { AuthBudgetService } from "@/features/auth/auth-budget.service";

@Global()
@Module({
  imports: [JwtModule.registerAsync({
    inject: [ENVIRONMENT],
    useFactory: (environment: Environment): JwtModuleOptions => ({
      secret: environment.JWT_SECRET,
      signOptions: { algorithm: "HS256", expiresIn: sessionDurationSeconds, issuer: "portal-voluntario", audience: "portal-api" },
      verifyOptions: { algorithms: ["HS256"], issuer: "portal-voluntario", audience: "portal-api" },
    }),
  })],
  controllers: [AuthController], providers: [AuthService, AuthBudgetService], exports: [AuthService],
})
export class AuthModule {}
