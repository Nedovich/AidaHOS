# AidaHOS

Multi-tenant **Hotel Operating System**. Hotel IT teams manage hotspot screens,
FreeRADIUS users and the guest portal across many hotels; super admins manage the
whole fleet (accounts, users, hotels, RADIUS, MikroTik).

Roles: **super_admin · admin · user · customer**.

## Architecture

```
On-prem (closed network)            Tailscale mesh          Cloud (Coolify / Docker)
  MSSQL/PMS · MikroTik · RADIUS  ◄──────────────►  apps/api (FastAPI, integration)
                                                            │
  apps/web  (Next.js + BetterAuth, admin) ◄ service token ─┤
  apps/guest (Next.js, captive portal)                     │
                          PostgreSQL (shared schema + RLS) ◄┘
```

- **apps/web** — admin console (Super Admin / Operations / Hotel Admin) + BetterAuth.
- **apps/guest** — lightweight captive/guest portal (per-hotel brand, TR/EN/DE/RU).
- **apps/api** — FastAPI integration layer; reaches on-prem boxes over **Tailscale**.
  Never authenticates end users — trusts a shared service token from the web app.
- **PostgreSQL** — one schema, `tenant_id` + Row-Level Security.

## Workspace

```
apps/      web · guest · api
packages/  db (Drizzle + RLS) · auth (BetterAuth) · ui (shadcn/tokens) · contracts (zod) · i18n
infra/     docker · coolify · tailscale · freeradius
```

## Prerequisites

Node ≥ 20, **pnpm** (`corepack enable`), **uv** (for the FastAPI app), and a Postgres
(local or `docker compose`).

## Dev

```bash
pnpm install                 # JS deps
cp .env.example .env         # fill DATABASE_URL etc.

# 1) DB  (RLS policies are part of the Drizzle schema — push manages them)
pnpm db:push                                  # create core tables + RLS

# 2) Web + Guest (Turborepo)
pnpm dev                     # web :3000, guest :3001

# 3) Integration API
cd apps/api && uv sync && uv run uvicorn app.main:app --reload --port 8000
```

Health checks: `:3000/api/health`, `:3001/api/health`, `:8000/health` → `{"status":"ok"}`.

Full stack via Docker: `docker compose -f infra/docker/docker-compose.yml up --build`.

## Roadmap (phases)

0 Skeleton (this) · 1 Auth & tenancy · 2 Super Admin · 3 RADIUS/MikroTik + FastAPI +
Tailscale · 4 Hotel Admin · 5 Guest Portal · 6 PMS sync · 7+ Surveys · Notifications ·
Dining/Spa · Events · AI Assistant.

See `/Users/username/.claude/plans/` for the full architecture plan.
