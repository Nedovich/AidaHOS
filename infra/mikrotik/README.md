# MikroTik hotspot → AidaHOS guest portal

How a guest gets online:

```
Phone joins SSID "Radiuss"
   → MikroTik hotspot intercepts, serves hotspot/login.html
   → login.html redirects to  https://<portal-host>/<hotel-slug>?ll=…&orig=…&mac=…
   → guest enters room-no + birth-date (DDMMYYYY)
   → portal verifies (hotel_simulation in dev) + writes radcheck
   → portal navigates to  $(link-login-only)?username=<slug-room>&password=<dob>&dst=<portal>/<slug>?connected=1
   → MikroTik authenticates that against FreeRADIUS (which now has the radcheck row)
   → client online, redirected back to the app
```

## Prerequisites (FreeRADIUS side — already provisioned for Esken)

The `nas` table must have a client row whose `nasname` = the **public IP FreeRADIUS sees
the MikroTik from**, with a matching secret:

| nasname (exit IP) | shortname        | secret            |
|-------------------|------------------|-------------------|
| 37.155.20.172     | mt-esken-bodrum  | sk_demo_4f9c2a1   |

- On the MikroTik, the RADIUS client secret (IP/Web Proxy → RADIUS) **must equal**
  `sk_demo_4f9c2a1`.
- The MikroTik's current public IP **must equal** `37.155.20.172`. If it changed,
  update the hotel's **Exit IP** in the AidaHOS admin (Hotels → Esken → Edit) — that
  rewrites the `nas` row automatically.

## RouterOS configuration

```rsc
# 1) RADIUS client → our FreeRADIUS (you already have this)
/radius
add service=hotspot address=91.99.60.129 secret=sk_demo_4f9c2a1 protocol=udp

# 2) Hotspot must use RADIUS for auth
/ip hotspot profile
set [find name=hsprof3] use-radius=yes login-by=http-pap,http-chap

#    ^ enabling http-pap lets the portal submit a plaintext password (room+dob).
#      RADIUS stores Cleartext-Password, so PAP matches. (CHAP also works but the
#      external portal can't compute it across hosts reliably.)

# 3) Walled garden — let unauthenticated clients reach the portal + its assets
/ip hotspot walled-garden
add dst-host=*.trycloudflare.com      comment="AidaHOS portal (tunnel)"
add dst-host=images.unsplash.com      comment="portal imagery"
add dst-host=fonts.googleapis.com
add dst-host=fonts.gstatic.com
# If you deploy the portal to a fixed domain, add that host instead of the tunnel.
```

## Install login.html

1. Edit `login.html` in this folder: set `PORTAL` to `https://<your-host>/esken-bodrum`.
2. Upload it into the hotspot directory:
   - WinBox/WebFig → **Files** → open the `hotspot` folder → drag `login.html` in
     (replace the existing one). The directory is the one in
     Server Profiles → `<profile>` → **General → HTML Directory** (default `hotspot`).
3. Reconnect to the SSID; the hotspot page should bounce to the AidaHOS portal.

## Dev exposure (local portal → public)

The portal runs on `localhost:3001`. Expose it with a quick Cloudflare tunnel:

```sh
brew install cloudflared
# --protocol http2 forces TCP/443 (QUIC/UDP-7844 flaps through the MikroTik → intermittent 502s)
cloudflared tunnel --protocol http2 --url http://127.0.0.1:3001
# → prints  https://<random>.trycloudflare.com
```

Easier: `MIKROTIK_PW=••• infra/mikrotik/refresh-tunnel.sh` does the restart + login.html
rewrite + FTP push in one shot (quick-tunnel URLs change every restart).

Put that host into `login.html` `PORTAL` and into the walled garden.
Test rooms (Esken): `101 / 08051990`, `102 / 15071985`, `205 / 23111978`, `250 / 01011990`.
