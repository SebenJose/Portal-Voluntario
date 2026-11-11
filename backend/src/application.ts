import "reflect-metadata";

import { ConsoleLogger, type INestApplication, type LoggerService, ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";

import { AppModule } from "@/app.module";
import { securityHeaders } from "@/common/http/security-headers.middleware";
import { setupApiDocs } from "@/common/http/api-docs";
import { loadEnvironment, type Environment } from "@/config/environment";

export async function createApplication(
  input: unknown = process.env,
  logger: LoggerService | false = new ConsoleLogger(),
): Promise<INestApplication> {
  const environment = loadEnvironment(input);
  const app = await NestFactory.create(AppModule.register(environment), { logger, abortOnError: false });
  configureApplication(app, environment);
  return app;
}

function hasExpressSettings(value: unknown): value is { disable: (setting: string) => unknown } {
  // A aplicação Express é uma função (handler de requisição) com métodos como `disable`.
  return (typeof value === "function" || (typeof value === "object" && value !== null)) && "disable" in value && typeof value.disable === "function";
}

export function configureApplication(app: INestApplication, environment: Environment): void {
  // Não anunciar o framework (X-Powered-By: Express).
  const server: unknown = app.getHttpAdapter().getInstance();
  if (hasExpressSettings(server)) server.disable("x-powered-by");
  app.use(securityHeaders);
  app.setGlobalPrefix("api");
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    forbidUnknownValues: true,
    transform: true,
    validationError: { target: false, value: false },
  }));
  app.enableCors({
    origin: environment.CORS_ORIGINS,
    methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: false,
    maxAge: 600,
  });
  app.enableShutdownHooks();
  if (environment.API_DOCS === "enabled") setupApiDocs(app);
}
