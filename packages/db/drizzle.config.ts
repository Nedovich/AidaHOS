import { defineConfig } from 'drizzle-kit';
import '../../scripts/load-root-env.mjs';

export default defineConfig({
  schema: './src/schema/index.ts',
  out: './migrations',
  dialect: 'postgresql',
  dbCredentials: {
    // DDL must run as the table owner; fall back to the runtime URL for local use.
    url:
      process.env.MIGRATION_DATABASE_URL ??
      process.env.DATABASE_URL ??
      'postgres://aidahos:aidahos@localhost:5432/aidahos',
  },
  verbose: true,
  strict: false,
});
