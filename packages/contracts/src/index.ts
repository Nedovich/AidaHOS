import { z } from 'zod';

/**
 * Shared web <-> FastAPI contracts. Phase 0 covers the provisioning call the
 * web app makes when a super_admin creates a hotel (writes FreeRADIUS `nas`).
 * Extend per module; generate matching Pydantic models on the API side.
 */
export const provisionHotelRequest = z.object({
  hotelId: z.string().uuid(),
  mikrotikIp: z.string().min(1),
  nasSecret: z.string().min(8),
  exitIp: z.string().optional(),
  tailscaleHost: z.string().optional(),
});
export type ProvisionHotelRequest = z.infer<typeof provisionHotelRequest>;

export const healthResponse = z.object({
  status: z.literal('ok'),
  service: z.string(),
});
export type HealthResponse = z.infer<typeof healthResponse>;
