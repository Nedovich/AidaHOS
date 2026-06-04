from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field

from app.core.security import require_service_token

router = APIRouter(prefix="/provisioning", tags=["provisioning"])


class ProvisionHotelRequest(BaseModel):
    """Mirrors @aidahos/contracts provisionHotelRequest.

    Called when a super_admin creates a hotel: writes the MikroTik gateway into
    FreeRADIUS `nas` so RADIUS auth works. Phase 3 implements the FreeRADIUS write
    + Tailscale reachability check.
    """

    hotel_id: str = Field(alias="hotelId")
    mikrotik_ip: str = Field(alias="mikrotikIp")
    nas_secret: str = Field(alias="nasSecret")
    exit_ip: str | None = Field(default=None, alias="exitIp")
    tailscale_host: str | None = Field(default=None, alias="tailscaleHost")


@router.post("/hotel", dependencies=[Depends(require_service_token)])
async def provision_hotel(req: ProvisionHotelRequest) -> dict[str, str]:
    # Phase 3: insert into FreeRADIUS `nas`, verify Tailscale reachability.
    return {"status": "accepted", "hotelId": req.hotel_id}
