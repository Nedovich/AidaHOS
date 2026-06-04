# Coolify deployment

Three services + a managed Postgres, each from this monorepo.

| Service | Dockerfile | Port | Notes |
|---|---|---|---|
| web   | `infra/docker/web.Dockerfile`   | 3000 | BetterAuth; needs `DATABASE_URL`, `BETTER_AUTH_*`, `API_BASE_URL`, `API_SERVICE_TOKEN` |
| guest | `infra/docker/guest.Dockerfile` | 3001 | public captive portal; `NEXT_PUBLIC_GUEST_DEFAULT_HOTEL` |
| api   | `infra/docker/api.Dockerfile`   | 8000 | `SERVICE_TOKEN`, `TAILSCALE_AUTHKEY` (joins tailnet) |
| postgres | managed | 5432 | shared-schema + RLS |

## Steps

1. Create a Postgres resource; copy its connection string into `web` (`DATABASE_URL`).
2. Deploy `web`, `guest`, `api` as separate applications pointing at this repo.
3. Set env from `.env.example`. Use the **same** `API_SERVICE_TOKEN` on `web` and `api`.
4. Give `api` a tagged ephemeral `TAILSCALE_AUTHKEY` (see `infra/tailscale`).
5. After first deploy: run `pnpm db:push` then apply `packages/db/migrations/rls.sql`.

`docker compose -f infra/docker/docker-compose.yml up` reproduces this locally.
