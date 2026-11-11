import "reflect-metadata";

import { ConsoleLogger, type INestApplication, type LoggerService, ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";

import { AppModule } from "@/app.module";
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

export function configureApplication(app: INestApplication, environment: Environment): void {
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
}
