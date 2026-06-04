# Tailscale — on-prem reachability

The integration API (`apps/api`) joins the tailnet to reach hotel boxes
(MSSQL / MikroTik / FreeRADIUS) on closed networks — **no public ports**.

## Cloud side (Coolify)

Set `TAILSCALE_AUTHKEY` (ephemeral, tagged) on the `api` service. The container
brings up `tailscaled` (or a Tailscale sidecar) and dials hotel boxes by their
`100.x` addresses, stored per-hotel in the DB (`hotels.tailscale_host/ip`).

## Hotel side

Either install Tailscale on each device, or run a **subnet router** at the hotel
advertising the LAN that holds MSSQL/MikroTik/FreeRADIUS.

## ACLs (scope each cloud node to its hotels)

```jsonc
{
  "tagOwners": { "tag:aidahos-cloud": ["autogroup:admin"], "tag:hotel": ["autogroup:admin"] },
  "acls": [
    // cloud API may reach hotel boxes on PMS/MikroTik/RADIUS ports only
    { "action": "accept", "src": ["tag:aidahos-cloud"], "dst": ["tag:hotel:1433,8728,1812,1813"] }
  ]
}
```

Use per-hotel tags (e.g. `tag:hotel-esken`) to limit blast radius further.
