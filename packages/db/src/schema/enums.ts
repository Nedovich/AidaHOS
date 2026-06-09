import { pgEnum } from 'drizzle-orm/pg-core';

/** AidaHOS application roles. See plan: super_admin / admin / user / customer. */
export const userRole = pgEnum('user_role', ['super_admin', 'admin', 'user', 'customer']);

/** Scope a membership grants the user over. */
export const membershipScope = pgEnum('membership_scope', ['hotel_group', 'hotel']);

/** Lifecycle status shared by tenant entities. */
export const tenantStatus = pgEnum('tenant_status', ['active', 'trial', 'suspended', 'archived']);

/** PMS vendor a hotel integrates with (extend as connectors land). */
export const pmsType = pgEnum('pms_type', ['none', 'mssql_generic', 'opera', 'protel', 'sis', 'elektraweb']);

/**
 * Where a hotel's RADIUS lives:
 *  - central_freeradius: our hosted FreeRADIUS (we write nas + radcheck, read radacct)
 *  - local_mikrotik:     the hotel's own MikroTik (RouterOS v7 REST API over Tailscale)
 */
export const radiusBackendType = pgEnum('radius_backend_type', ['central_freeradius', 'local_mikrotik']);

/** Survey lifecycle. Mirrors the design pills (Published / Draft / Archived + Paused). */
export const surveyStatusType = pgEnum('survey_status', ['draft', 'published', 'paused', 'archived']);

/** Triage state of a single guest response. */
export const responseStatusType = pgEnum('survey_response_status', ['new', 'reviewed', 'flagged']);
