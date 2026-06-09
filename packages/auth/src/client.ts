import { createAuthClient } from 'better-auth/react';
import { adminClient } from 'better-auth/client/plugins';

/**
 * Browser-side auth client for the admin app.
 * No baseURL → requests go to the CURRENT origin (window.location.origin), so login
 * works from any host (localhost, the WireGuard IP, the phone, a prod domain) with no
 * env juggling. The server's trustedOrigins allowlist (see index.ts) authorizes them.
 */
export const authClient = createAuthClient({
  plugins: [adminClient()],
});

export const { signIn, signOut, signUp, useSession } = authClient;
