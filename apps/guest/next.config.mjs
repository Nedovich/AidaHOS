import { fileURLToPath } from 'node:url';
import '../../scripts/load-root-env.mjs';

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Self-contained server bundle for Docker/Coolify (traces the monorepo workspace deps).
  output: 'standalone',
  outputFileTracingRoot: fileURLToPath(new URL('../../', import.meta.url)),
  transpilePackages: ['@aidahos/ui', '@aidahos/i18n', '@aidahos/db'],
  serverExternalPackages: ['postgres'],
};

export default nextConfig;
