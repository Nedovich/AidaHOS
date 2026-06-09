import { z } from 'zod';

/**
 * Shared web <-> FastAPI contracts. Phase 0 covers the provisioning call the
 * web app makes when a super_admin creates a hotel (writes FreeRADIUS `nas`).
 * Extend per module; generate matching Pydantic models on the API side.
 */
export const radiusBackend = z.enum(['central_freeradius', 'local_mikrotik']);
export type RadiusBackend = z.infer<typeof radiusBackend>;

export const provisionHotelRequest = z.object({
  hotelId: z.string().uuid(),
  radiusBackend: radiusBackend.default('central_freeradius'),
  // central_freeradius
  mikrotikIp: z.string().min(1),
  nasSecret: z.string().min(8).optional(),
  exitIp: z.string().optional(),
  tailscaleHost: z.string().optional(),
  // local_mikrotik (RouterOS v7 REST over Tailscale) — used by the deferred apps/api client
  mikrotikApiUser: z.string().optional(),
  mikrotikApiPassword: z.string().optional(),
  mikrotikApiPort: z.number().int().optional(),
});
export type ProvisionHotelRequest = z.infer<typeof provisionHotelRequest>;

export const healthResponse = z.object({
  status: z.literal('ok'),
  service: z.string(),
});
export type HealthResponse = z.infer<typeof healthResponse>;
