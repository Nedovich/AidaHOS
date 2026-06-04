import { toNextJsHandler } from 'better-auth/next-js';
import { auth } from '@aidahos/auth';

// BetterAuth handler — sign-in/up/session/impersonation endpoints.
// Wired in Phase 1; safe to expose now (no-op until auth UI lands).
export const { GET, POST } = toNextJsHandler(auth);
