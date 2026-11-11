import { type CallHandler, type ExecutionContext, Injectable, type NestInterceptor, StreamableFile } from "@nestjs/common";
import type { Response } from "express";
import { map, type Observable } from "rxjs";

@Injectable()
export class ResponseInterceptor implements NestInterceptor<unknown, unknown> {
  intercept(context: ExecutionContext, next: CallHandler<unknown>): Observable<unknown> {
    return next.handle().pipe(map((data: unknown) => {
      const response = context.switchToHttp().getResponse<Response>();
      if (response.statusCode === 204 || data instanceof StreamableFile) return data;
      return { data };
    }));
  }
}
