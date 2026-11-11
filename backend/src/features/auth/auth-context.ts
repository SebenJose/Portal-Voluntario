import { createParamDecorator, type ExecutionContext, SetMetadata, UnauthorizedException } from "@nestjs/common";
import type { Request } from "express";
import type { Role } from "@/common/domain";
import type { User } from "@/features/auth/user.entity";

export interface AuthIdentity { user: User; sessionId: string }
export const requestIdentities = new WeakMap<Request, AuthIdentity>();
export const ACCESS_MODE = "portal:access";
export const REQUIRED_ROLES = "portal:roles";
export const Public = () => SetMetadata(ACCESS_MODE, "public");
export const OptionalAuth = () => SetMetadata(ACCESS_MODE, "optional");
export const Roles = (...roles: Role[]) => SetMetadata(REQUIRED_ROLES, roles);

export const CurrentAuth = createParamDecorator((_data: unknown, context: ExecutionContext): AuthIdentity => {
  const identity = requestIdentities.get(context.switchToHttp().getRequest<Request>());
  if (!identity) throw new UnauthorizedException("Entre na sua conta.");
  return identity;
});

export const OptionalUser = createParamDecorator((_data: unknown, context: ExecutionContext): User | undefined =>
  requestIdentities.get(context.switchToHttp().getRequest<Request>())?.user);
