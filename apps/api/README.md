# AidaHOS Integration API (FastAPI)

Integration / data-movement layer between the cloud and on-prem hotel systems.
**Does not authenticate end users** — BetterAuth (in `apps/web`) owns that. This
service only trusts the shared service token (`X-Service-Token`) on calls from the
web app, and reaches on-prem boxes (MSSQL / MikroTik / FreeRADIUS) over **Tailscale**.

## Dev

```bash
cd apps/api
uv sync
uv run uvicorn app.main:app --reload --port 8000
# health: curl localhost:8000/health  -> {"status":"ok","service":"api"}
# docs:   http://localhost:8000/docs
```

## Layout

```
app/
  core/        config, service-token auth, (Tailscale) — security.py, config.py
  connectors/  pms_mssql · mikrotik · freeradius        (Phase 3/6)
  services/    guest_sync · provisioning · ai           (Phase 3/6+)
  jobs/        scheduled sync                            (Phase 6)
  routers/     health, provisioning                     (grows per module)
```
