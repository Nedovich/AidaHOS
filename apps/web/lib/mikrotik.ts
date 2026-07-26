import 'server-only';

export interface MikroTikConfig {
  host: string;       // IP or hostname
  port: number;       // web/REST port (e.g. 85)
  user: string;
  password: string;
}

export interface HotspotProfile {
  id: string;         // MikroTik internal .id
  name: string;
  rateLimit: string;  // e.g. "10M/10M"
  sharedUsers: number;
  sessionTimeout: string;
  idleTimeout: string;
  isDefault: boolean;
}

/** Build a MikroTik REST client bound to one router. */
export function mikrotikClient(cfg: MikroTikConfig) {
  const base = `http://${cfg.host}:${cfg.port}/rest`;
  const auth = 'Basic ' + Buffer.from(`${cfg.user}:${cfg.password}`).toString('base64');

  async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
    const res = await fetch(`${base}${path}`, {
      method,
      headers: {
        Authorization: auth,
        'Content-Type': 'application/json',
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
      // Short timeout — router is reachable or it isn't.
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`MikroTik ${method} ${path} → HTTP ${res.status}: ${text}`);
    }
    if (res.status === 204 || res.headers.get('content-length') === '0') return undefined as T;
    return res.json() as Promise<T>;
  }

  type RawProfile = {
    '.id': string;
    name: string;
    'rate-limit'?: string;
    'shared-users'?: string;
    'session-timeout'?: string;
    'idle-timeout'?: string;
    default?: string;
  };

  function parseProfile(r: RawProfile): HotspotProfile {
    return {
      id: r['.id'],
      name: r.name,
      rateLimit: r['rate-limit'] ?? '',
      sharedUsers: Number(r['shared-users'] ?? 1),
      sessionTimeout: r['session-timeout'] ?? '',
      idleTimeout: r['idle-timeout'] ?? '',
      isDefault: r.name === 'default' || r.default === 'true' || r.default === 'yes',
    };
  }

  return {
    /** List all hotspot user profiles on this router. */
    async listHotspotProfiles(): Promise<HotspotProfile[]> {
      const rows = await request<RawProfile[]>('GET', '/ip/hotspot/user/profile');
      return rows.map(parseProfile);
    },

    /** Create a new hotspot user profile. Returns the created profile. */
    async createHotspotProfile(input: {
      name: string;
      rateLimit: string;
      sharedUsers?: number;
      sessionTimeout?: string;
      idleTimeout?: string;
    }): Promise<HotspotProfile> {
      const body: Record<string, string> = {
        name: input.name,
        'rate-limit': input.rateLimit,
        'shared-users': String(input.sharedUsers ?? 1),
      };
      if (input.sessionTimeout) body['session-timeout'] = input.sessionTimeout;
      if (input.idleTimeout) body['idle-timeout'] = input.idleTimeout;
      const row = await request<RawProfile>('PUT', '/ip/hotspot/user/profile', body);
      return parseProfile(row);
    },

    /** Update an existing profile by its MikroTik .id. */
    async updateHotspotProfile(
      mtId: string,
      input: { name?: string; rateLimit?: string; sharedUsers?: number; sessionTimeout?: string; idleTimeout?: string },
    ): Promise<HotspotProfile> {
      const body: Record<string, string> = {};
      if (input.name !== undefined) body.name = input.name;
      if (input.rateLimit !== undefined) body['rate-limit'] = input.rateLimit;
      if (input.sharedUsers !== undefined) body['shared-users'] = String(input.sharedUsers);
      if (input.sessionTimeout !== undefined) body['session-timeout'] = input.sessionTimeout;
      if (input.idleTimeout !== undefined) body['idle-timeout'] = input.idleTimeout;
      const row = await request<RawProfile>('PATCH', `/ip/hotspot/user/profile/${mtId}`, body);
      return parseProfile(row);
    },

    /** Delete a hotspot profile by its MikroTik .id. */
    async deleteHotspotProfile(mtId: string): Promise<void> {
      await request<void>('DELETE', `/ip/hotspot/user/profile/${mtId}`);
    },

    /** Quick connectivity check — returns router identity or throws. */
    async ping(): Promise<{ identity: string }> {
      const r = await request<{ name: string }[]>('GET', '/system/identity');
      return { identity: r[0]?.name ?? 'unknown' };
    },

    /**
     * Disconnect an active hotspot session by username.
     * Returns true if a session was found and removed, false if not found.
     */
    async disconnectHotspotUser(username: string): Promise<boolean> {
      type ActiveRow = { '.id': string; user: string };
      const active = await request<ActiveRow[]>('GET', '/ip/hotspot/active');
      const match = active.find((r) => r.user === username);
      if (!match) return false;
      await request<void>('DELETE', `/ip/hotspot/active/${match['.id']}`);
      return true;
    },
  };
}

/** Build a MikroTik client from hotel DB row fields. Throws if credentials missing. */
export function mikrotikClientFromHotel(hotel: {
  mikrotikIp?: string | null;
  mikrotikApiUser?: string | null;
  mikrotikApiPassword?: string | null;
  mikrotikApiPort?: number | null;
}) {
  if (!hotel.mikrotikIp || !hotel.mikrotikApiUser || !hotel.mikrotikApiPassword) {
    throw new Error('MikroTik API credentials are not configured for this hotel.');
  }
  return mikrotikClient({
    host: hotel.mikrotikIp,
    port: hotel.mikrotikApiPort ?? 80,
    user: hotel.mikrotikApiUser,
    password: hotel.mikrotikApiPassword,
  });
}
