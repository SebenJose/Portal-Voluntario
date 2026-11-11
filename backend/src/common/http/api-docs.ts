import { applyDecorators, type INestApplication } from "@nestjs/common";
import {
  ApiBadRequestResponse, ApiBearerAuth, ApiForbiddenResponse, ApiNotFoundResponse, ApiProperty,
  ApiPropertyOptional, ApiUnauthorizedResponse, DocumentBuilder, SwaggerModule,
} from "@nestjs/swagger";

export const BEARER_AUTH = "jwt";

/** Formato padronizado produzido pelo HttpExceptionFilter. */
export class ErrorResponseDto {
  @ApiProperty({ type: Number, example: 400 })
  declare statusCode: number;

  @ApiProperty({ type: String, example: "Bad Request" })
  declare error: string;

  @ApiProperty({ type: String, example: "Confira os dados enviados." })
  declare message: string;

  @ApiPropertyOptional({ type: [String], example: ["email must be an email"] })
  declare details?: string[];
}

export const ApiValidation = () => ApiBadRequestResponse({ description: "Dados inválidos (DTO/class-validator).", type: ErrorResponseDto });
export const ApiNotFound = (description = "Recurso não encontrado.") => ApiNotFoundResponse({ description, type: ErrorResponseDto });

/** Rota protegida pelo JwtGuard: exige Bearer token e responde 401 sem ele. */
export const ApiPrivate = () => applyDecorators(
  ApiBearerAuth(BEARER_AUTH),
  ApiUnauthorizedResponse({ description: "Token ausente, inválido, expirado ou revogado.", type: ErrorResponseDto }),
);

/** Rota protegida também pelo RolesGuard: responde 403 para outro papel. */
export const ApiRole = (role: "volunteer" | "organization") => applyDecorators(
  ApiPrivate(),
  ApiForbiddenResponse({ description: `Disponível apenas para o papel "${role}".`, type: ErrorResponseDto }),
);

export function setupApiDocs(app: INestApplication): void {
  const config = new DocumentBuilder()
    .setTitle("Portal Voluntário — API")
    .setDescription([
      "API REST do Portal Voluntário (NestJS + TypeORM + SQLite).",
      "",
      "Respostas de sucesso vêm no envelope `{ \"data\": ... }`; erros seguem `{ statusCode, error, message, details? }`.",
      "Para rotas privadas: faça `POST /api/auth/login`, copie `data.accessToken` e use o botão **Authorize**.",
    ].join("\n"))
    .setVersion("0.1.0")
    .addBearerAuth({ type: "http", scheme: "bearer", bearerFormat: "JWT", description: "accessToken retornado pelo login" }, BEARER_AUTH)
    .build();
  const document = SwaggerModule.createDocument(app, config, { extraModels: [ErrorResponseDto] });
  SwaggerModule.setup("api/docs", app, document, {
    jsonDocumentUrl: "api/docs-json",
    customSiteTitle: "Portal Voluntário — API",
    swaggerOptions: { persistAuthorization: false, displayRequestDuration: true },
  });
}
