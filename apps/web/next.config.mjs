import { fileURLToPath } from 'node:url';
import '../../scripts/load-root-env.mjs';

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Self-contained server bundle for Docker/Coolify (traces the monorepo workspace deps).
  output: 'standalone',
  outputFileTracingRoot: fileURLToPath(new URL('../../', import.meta.url)),
  transpilePackages: ['@aidahos/ui', '@aidahos/auth', '@aidahos/db', '@aidahos/contracts', '@aidahos/i18n'],
  // Run these as Node modules instead of bundling (better-auth pulls in kysely with a
  // mismatched export that breaks webpack; postgres is a native-ish driver).
  serverExternalPackages: ['better-auth', 'kysely', 'postgres'],
};

export default nextConfig;
