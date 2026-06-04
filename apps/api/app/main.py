from fastapi import FastAPI

from app.routers import health, provisioning

app = FastAPI(
    title="AidaHOS Integration API",
    version="0.0.0",
    summary="PMS (MSSQL) / MikroTik / FreeRADIUS bridge, reached over Tailscale.",
)

app.include_router(health.router)
app.include_router(provisioning.router)
