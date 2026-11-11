import { type DynamicModule, type MiddlewareConsumer, Module, type NestModule } from "@nestjs/common";
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from "@nestjs/core";

import { HttpExceptionFilter } from "@/common/http/http-exception.filter";
import { ResponseInterceptor } from "@/common/http/response.interceptor";
import { RequestLoggerMiddleware } from "@/common/logging/request-logger.middleware";
import { ConfigurationModule } from "@/config/configuration.module";
import type { Environment } from "@/config/environment";
import { DatabaseModule } from "@/database/database.module";
import { HealthModule } from "@/features/health/health.module";
import { AuthModule } from "@/features/auth/auth.module";
import { JwtGuard, RolesGuard } from "@/features/auth/auth.guards";
import { OpportunitiesModule } from "@/features/opportunities/opportunities.module";
import { OrganizationsModule } from "@/features/organizations/organizations.module";
import { CertificatesModule } from "@/features/certificates/certificates.module";
import { DashboardModule } from "@/features/dashboard/dashboard.module";
import { AdminModule } from "@/features/admin/admin.module";

@Module({
  imports: [DatabaseModule, HealthModule, AuthModule, OpportunitiesModule, OrganizationsModule, CertificatesModule, DashboardModule, AdminModule],
  providers: [
    { provide: APP_GUARD, useClass: JwtGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
    { provide: APP_INTERCEPTOR, useClass: ResponseInterceptor },
    { provide: APP_FILTER, useClass: HttpExceptionFilter },
  ],
})
export class AppModule implements NestModule {
  static register(environment: Environment): DynamicModule {
    return { module: AppModule, imports: [ConfigurationModule.register(environment)] };
  }

  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(RequestLoggerMiddleware).forRoutes("{*path}");
  }
}
