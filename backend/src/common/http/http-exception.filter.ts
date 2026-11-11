import { type ArgumentsHost, Catch, type ExceptionFilter, HttpException, HttpStatus, Logger } from "@nestjs/common";
import type { Response } from "express";
import { STATUS_CODES } from "node:http";
import { z } from "zod";
import { QueryFailedError } from "typeorm";

const exceptionBodySchema = z.object({
  message: z.union([z.string(), z.array(z.string())]).optional(),
  error: z.string().optional(),
});

@Catch()
export class HttpExceptionFilter implements ExceptionFilter<unknown> {
  private readonly logger = new Logger("HttpExceptionFilter");

  catch(exception: unknown, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();
    const databaseError = exception instanceof QueryFailedError
      ? z.object({ code: z.string() }).safeParse(exception.driverError) : null;
    const conflict = databaseError?.success && /^(SQLITE_CONSTRAINT|SQLITE_BUSY)/u.test(databaseError.data.code);
    const statusCode = conflict ? HttpStatus.CONFLICT : exception instanceof HttpException
      ? exception.getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR;
    const safeError = STATUS_CODES[statusCode] ?? "Error";
    const body: { statusCode: number; error: string; message: string; details?: string[] } = {
      statusCode,
      error: safeError,
      message: statusCode >= 500 ? "O serviço está indisponível. Tente novamente." : safeError,
    };
    if (conflict) body.message = "A operação conflita com os dados atuais. Atualize a página e tente novamente.";

    if (exception instanceof HttpException && statusCode < 500) {
      const payload: unknown = exception.getResponse();
      const parsed = exceptionBodySchema.safeParse(payload);
      if (typeof payload === "string") body.message = payload;
      else if (parsed.success) {
        if (typeof parsed.data.message === "string") body.message = parsed.data.message;
        else if (Array.isArray(parsed.data.message)) {
          body.message = "Confira os dados enviados.";
          body.details = parsed.data.message;
        }
      }
    }

    // SQL/driver errors may contain submitted values. Log only the status, never the exception.
    if (statusCode >= 500) this.logger.error({ statusCode, error: safeError });
    response.status(statusCode).json(body);
  }
}
