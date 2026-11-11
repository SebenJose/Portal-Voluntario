import { type CanActivate, type ExecutionContext, ForbiddenException, Injectable, UnauthorizedException } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import type { Request } from "express";
import type { Role } from "@/common/domain";
import { ACCESS_MODE, REQUIRED_ROLES, requestIdentities } from "@/features/auth/auth-context";
import { AuthService } from "@/features/auth/auth.service";

@Injectable()
export class JwtGuard implements CanActivate {
  constructor(private readonly reflector: Reflector, private readonly auth: AuthService) {}
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const mode = this.reflector.getAllAndOverride<string>(ACCESS_MODE, [context.getHandler(), context.getClass()]);
    if (mode === "public") return true;
    const request = context.switchToHttp().getRequest<Request>();
    const authorization = request.headers.authorization;
    if (!authorization && mode === "optional") return true;
    const match = authorization && authorization.length <= 4096 ? /^Bearer ([A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+)$/u.exec(authorization) : null;
    const token = match?.[1];
    if (!token) throw new UnauthorizedException("Entre na sua conta.");
    requestIdentities.set(request, await this.auth.identity(token));
    return true;
  }
}

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}
  canActivate(context: ExecutionContext): boolean {
    const roles = this.reflector.getAllAndOverride<Role[]>(REQUIRED_ROLES, [context.getHandler(), context.getClass()]);
    if (!roles) return true;
    const identity = requestIdentities.get(context.switchToHttp().getRequest<Request>());
    if (!identity) throw new UnauthorizedException("Entre na sua conta.");
    if (!roles.includes(identity.user.role)) throw new ForbiddenException("Sua conta não tem permissão para esta operação.");
    // Organizations only manage activities after an administrator approves the registration.
    if (identity.user.role === "organization" && identity.organization?.status !== "approved") {
      throw new ForbiddenException(identity.organization?.status === "rejected"
        ? "O cadastro da organização foi recusado pela administração."
        : "O cadastro da organização aguarda aprovação da administração.");
    }
    return true;
  }
}
