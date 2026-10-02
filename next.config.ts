import path from "node:path";

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
