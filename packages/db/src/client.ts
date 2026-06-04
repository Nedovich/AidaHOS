import { drizzle } from 'drizzle-orm/postgres-js';
import { sql } from 'drizzle-orm';
import postgres from 'postgres';
import * as schema from './schema';

const connectionString =
  process.env.DATABASE_URL ?? 'postgres://aidahos:aidahos@localhost:5432/aidahos';

// Single shared pool. In serverless/edge consider per-request clients instead.
const queryClient = postgres(connectionString, { max: 10 });

export const db = drizzle(queryClient, { schema });
export type Database = typeof db;

export interface TenantContext {
  role: 'super_admin' | 'admin' | 'user' | 'customer';
  hotelId?: string | null;
  hotelGroupId?: string | null;
}

/**
 * Runs `fn` inside a transaction with Postgres RLS context set via session GUCs.
 * RLS policies (defined in schema/tenancy.ts) read these to scope rows:
 *   app.current_role, app.current_hotel, app.current_hotel_group
 */
export async function withTenant<T>(
  ctx: TenantContext,
  fn: (tx: Database) => Promise<T>,
): Promise<T> {
  return db.transaction(async (tx) => {
    await tx.execute(sql`select set_config('app.current_role', ${ctx.role}, true)`);
    await tx.execute(
      sql`select set_config('app.current_hotel', ${ctx.hotelId ?? ''}, true)`,
    );
    await tx.execute(
      sql`select set_config('app.current_hotel_group', ${ctx.hotelGroupId ?? ''}, true)`,
    );
    return fn(tx as unknown as Database);
  });
}
