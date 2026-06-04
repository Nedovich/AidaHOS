// Applies rls.sql as the table owner. Runs automatically after `db:push`.
// Uses MIGRATION_DATABASE_URL (owner) since enabling RLS / creating policies is a
// DDL/owner operation.
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import postgres from 'postgres';
import '../../../scripts/load-root-env.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const url = process.env.MIGRATION_DATABASE_URL ?? process.env.DATABASE_URL;
if (!url) {
  console.error('apply-rls: no MIGRATION_DATABASE_URL / DATABASE_URL');
  process.exit(1);
}

const ddl = readFileSync(resolve(here, '..', 'rls.sql'), 'utf8');
const sql = postgres(url, { ssl: 'prefer', max: 1, connect_timeout: 15, onnotice: () => {} });
try {
  await sql.unsafe(ddl);
  console.log('apply-rls: RLS policies applied.');
} catch (e) {
  console.error('apply-rls ERROR:', e.code ?? '', e.message);
  process.exitCode = 1;
} finally {
  await sql.end({ timeout: 3 });
}
