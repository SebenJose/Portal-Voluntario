/**
 * Cabeçalhos de segurança das páginas e rotas do Next (aplicados em next.config.ts).
 *
 * A CSP segue a abordagem "Without Nonces" do guia do Next: scripts inline do framework são
 * permitidos, mas plugins, iframes de terceiros, troca de <base>, envio de formulários e conexões
 * para outras origens ficam bloqueados. `upgrade-insecure-requests` e HSTS só valem em HTTPS,
 * para não quebrar o uso local em http://localhost.
 */
export function buildSecurityHeaders({ development, https }: { development: boolean; https: boolean }): Array<{ key: string; value: string }> {
  const contentSecurityPolicy = [
    "default-src 'self'",
    `script-src 'self' 'unsafe-inline'${development ? " 'unsafe-eval'" : ""}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' blob: data:",
    "font-src 'self'",
    "connect-src 'self'",
    "worker-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    ...(https ? ["upgrade-insecure-requests"] : []),
  ].join("; ");

  return [
    { key: "Content-Security-Policy", value: contentSecurityPolicy },
    { key: "X-Content-Type-Options", value: "nosniff" },
    { key: "X-Frame-Options", value: "DENY" },
    { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
    { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()" },
    { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
    ...(https ? [{ key: "Strict-Transport-Security", value: "max-age=63072000" }] : []),
  ];
}
