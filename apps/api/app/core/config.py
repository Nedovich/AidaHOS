from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Runtime configuration for the AidaHOS integration API."""

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    app_env: str = "development"
    # Shared HMAC/JWT secret the Next.js web app signs service calls with.
    service_token: str = "change-me-shared-hmac-secret"
    # Tailscale: how the API reaches on-prem hotel boxes (no public ports).
    tailscale_authkey: str = ""
    tailscale_hostname: str = "aidahos-api"


@lru_cache
def get_settings() -> Settings:
    return Settings()
