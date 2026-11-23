import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Permite que Next.js compile archivos de @inventa/contracts,
  // instalado localmente desde Shared/contracts/.
  transpilePackages: ["@inventa/contracts"],
};

export default nextConfig;
