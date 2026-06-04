import { pgEnum } from 'drizzle-orm/pg-core';

/** AidaHOS application roles. See plan: super_admin / admin / user / customer. */
export const userRole = pgEnum('user_role', ['super_admin', 'admin', 'user', 'customer']);

/** Scope a membership grants the user over. */
export const membershipScope = pgEnum('membership_scope', ['hotel_group', 'hotel']);

/** Lifecycle status shared by tenant entities. */
export const tenantStatus = pgEnum('tenant_status', ['active', 'trial', 'suspended', 'archived']);

/** PMS vendor a hotel integrates with (extend as connectors land). */
export const pmsType = pgEnum('pms_type', ['none', 'mssql_generic', 'opera', 'protel', 'sis', 'elektraweb']);
