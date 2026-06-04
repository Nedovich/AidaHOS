import '../../scripts/load-root-env.mjs';

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@aidahos/ui', '@aidahos/auth', '@aidahos/db', '@aidahos/contracts', '@aidahos/i18n'],
  // Run these as Node modules instead of bundling (better-auth pulls in kysely with a
  // mismatched export that breaks webpack; postgres is a native-ish driver).
  serverExternalPackages: ['better-auth', 'kysely', 'postgres'],
};

export default nextConfig;
