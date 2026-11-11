import path from "node:path";

import type { NextConfig } from "next";

import { buildSecurityHeaders } from "./src/lib/security-headers";

const securityHeaders = buildSecurityHeaders({
  development: process.env.NODE_ENV === "development",
  https: process.env.PORTAL_ORIGIN?.startsWith("https://") ?? false,
});

const nextConfig: NextConfig = {
  // Não anunciar o framework (X-Powered-By: Next.js).
  poweredByHeader: false,
  async headers() {
    return [{ source: "/(.*)", headers: securityHeaders }];
  },
  experimental: {
    // Mantém a checagem de tipos ativa sem depender do processo CLI separado.
    useTypeScriptCli: false,
  },
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      // O Webpack do Next não resolve o export condicional do MSW diretamente.
      "msw/browser": path.resolve(process.cwd(), "node_modules/msw/lib/browser/index.js"),
    };

    return config;
  },
};

export default nextConfig;
