# FreeRADIUS — schema reference

AidaHOS provisions and reads the standard FreeRADIUS SQL tables. The integration
API (`apps/api/app/connectors/freeradius`) writes these; the schema below is the
canonical reference (Phase 3).

- **`nas`** — RADIUS clients. One row per hotel MikroTik gateway. Written on hotel
  provisioning from `hotels.mikrotik_ip` + `hotels.nas_secret`, so MikroTik RADIUS works.
- **`radcheck`** — per-user auth attributes. Guests (customer role) are written here
  so they can log in at the MikroTik hotspot.
- **`radacct`** — accounting/session records. Source for connectivity analytics.
- **`radreply` / `radusergroup`** — reply attributes & group mapping (bandwidth, session limits).

Mirror these as Postgres tables in `packages/db` (RADIUS/Network module) so the admin
console and FastAPI share one source of truth. Keep column names matching FreeRADIUS
defaults so the `sql` module can point straight at them.
