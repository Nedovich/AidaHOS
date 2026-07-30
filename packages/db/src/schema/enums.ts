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

/** Lifecycle of a hotel event (mirrors the Events list status pills). */
export const eventStatusType = pgEnum('event_status', ['draft', 'scheduled', 'live', 'full', 'completed', 'cancelled']);

/** What kind of popup a guest_popup_sends row shows: survey, event announcement, or free-text announcement. */
export const popupSendType = pgEnum('popup_send_type', ['survey', 'event', 'announcement']);

/** Which recurring popup rule a popup_automations row represents. */
export const popupAutomationKind = pgEnum('popup_automation_kind', ['checkout', 'default']);

/** Whether an automation is currently applied to guest logins. */
export const popupAutomationStatus = pgEnum('popup_automation_status', ['active', 'paused']);

/**
 * Canonical timing set for popup_automations. 'every' is the only meaningful value
 * for kind='default' — hasGuestResponded only supports "keep offering until answered
 * this stay", there is no honest way to express "ask only once ever".
 */
export const popupAutomationTiming = pgEnum('popup_automation_timing', ['d3', 'd2', 'd1', 'd0', 'every']);
