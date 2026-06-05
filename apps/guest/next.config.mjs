import '../../scripts/load-root-env.mjs';

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@aidahos/ui', '@aidahos/i18n', '@aidahos/db'],
  serverExternalPackages: ['postgres'],
};

export default nextConfig;
