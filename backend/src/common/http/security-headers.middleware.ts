import type { NextFunction, Request, Response } from "express";

/** Rotas do Swagger UI: precisam de scripts e estilos próprios, então não recebem a CSP restritiva. */
const documentationPath = /^\/api\/docs(?:[/?-]|$)/u;

/**
 * Cabeçalhos de segurança de todas as respostas. É registrado direto no Express, antes das rotas,
 * para valer também no 404 e no Swagger UI (que não passam pelos middlewares do módulo Nest).
 */
export function securityHeaders(request: Request, response: Response, next: NextFunction): void {
  response.setHeader("X-Content-Type-Options", "nosniff");
  response.setHeader("X-Frame-Options", "DENY");
  response.setHeader("Referrer-Policy", "no-referrer");
  response.setHeader("Cross-Origin-Opener-Policy", "same-origin");
  // JSON e arquivos da API nunca precisam executar scripts nem ser exibidos em iframes.
  if (!documentationPath.test(request.originalUrl)) {
    response.setHeader("Content-Security-Policy", "default-src 'none'; frame-ancestors 'none'; base-uri 'none'; form-action 'none'");
  }
  next();
}
