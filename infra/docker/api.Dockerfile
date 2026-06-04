# AidaHOS integration API (FastAPI) — build from monorepo root:
#   docker build -f infra/docker/api.Dockerfile -t aidahos-api .
# Joins the Tailscale tailnet at runtime to reach on-prem hotel boxes.
FROM python:3.12-slim
WORKDIR /app

COPY --from=ghcr.io/astral-sh/uv:latest /uv /usr/local/bin/uv

COPY apps/api/pyproject.toml ./
RUN uv pip install --system fastapi "uvicorn[standard]" pydantic pydantic-settings httpx

COPY apps/api/app ./app
EXPOSE 8000
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
