import { Injectable, Logger, type NestMiddleware } from "@nestjs/common";
import type { NextFunction, Request, Response } from "express";

@Injectable()
export class RequestLoggerMiddleware implements NestMiddleware {
  private readonly logger = new Logger("HTTP");

  use(request: Request, response: Response, next: NextFunction): void {
    response.setHeader("Cache-Control", "no-store");
    const startedAt = performance.now();
    // Never log the query string, headers or body. Strip control characters from paths.
    const path = (request.originalUrl.split("?", 1)[0] ?? "/")
      .replace(/[\u0000-\u001f\u007f]/gu, "").slice(0, 256);
    response.once("finish", () => {
      this.logger.log({
        method: request.method,
        path,
        statusCode: response.statusCode,
        durationMs: Math.round((performance.now() - startedAt) * 100) / 100,
      });
    });
    next();
  }
}
