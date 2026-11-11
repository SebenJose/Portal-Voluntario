import { type DynamicModule, type MiddlewareConsumer, Module, type NestModule } from "@nestjs/common";
import { APP_FILTER, APP_INTERCEPTOR } from "@nestjs/core";

import { HttpExceptionFilter } from "@/common/http/http-exception.filter";
import { ResponseInterceptor } from "@/common/http/response.interceptor";
import { RequestLoggerMiddleware } from "@/common/logging/request-logger.middleware";
import { ConfigurationModule } from "@/config/configuration.module";
import type { Environment } from "@/config/environment";
import { DatabaseModule } from "@/database/database.module";
import { HealthModule } from "@/features/health/health.module";

@Module({
  imports: [DatabaseModule, HealthModule],
  providers: [
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
