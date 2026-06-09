# AidaHOS — Coolify deploy (web + guest)

Aynı monorepo'dan **iki uygulama** kuruyoruz (aida-api ile aynı mantık):

| Uygulama | Build arg | Port | Domain |
|---|---|---|---|
| Konsol (panel) | `APP=web` | 3000 | `aidahos.kreatinmedya.com` |
| Guest portal | `APP=guest` | 3000 | `aidaguest.kreatinmedya.com` |

Repo'da hazır: kök `Dockerfile` (build-arg `APP` ile tek app derler, Next **standalone** çıktısı → küçük imaj), `.dockerignore`, `next.config` (output standalone).

---

## 0) DNS (Cloudflare — kreatinmedya.com)
İki kayıt ekle (sunucu IP'sine). Coolify TLS'i Let's Encrypt ile alır.
- `aidahos`  → A → `<SUNUCU_IP>`  (Proxied **kapalı / DNS only** önerilir; Coolify LE sertifikası alabilsin)
- `aidaguest` → A → `<SUNUCU_IP>` (aynı şekilde)

> Cloudflare proxy (turuncu bulut) açık kalacaksa SSL/TLS modunu **Full (strict)** yap, yoksa redirect döngüsü olur. En sorunsuzu: ilk kurulumda **DNS only**, çalışınca proxy'i açarsın.
> Eski `guest.kreatinmedya.com` CNAME kaydı kaldıysa sil.

---

## 1) Konsol uygulaması (web)
Coolify → ilgili Project → **+ New** → **Application** → **Public/Private GitHub** → repoyu seç (branch `main`).

**Build:**
- Build Pack: **Dockerfile**
- Dockerfile Location: `/Dockerfile`  · Base Directory: `/`
- (Monorepo'nun tamamı context; .dockerignore zaten gereksizleri eler.)

**Network / Domains:**
- Ports Exposes: `3000`
- Domains (FQDN): `https://aidahos.kreatinmedya.com`

**Environment Variables** (aşağıdaki tablo) — `APP=web` satırında **Build Variable = ON**, diğerleri runtime (Build Variable = OFF).

**Deploy.**

## 2) Guest uygulaması
Aynı repodan ikinci bir **Application** daha ekle.
- Build Pack: **Dockerfile** · Location `/Dockerfile`
- Ports Exposes: `3000`
- Domain: `https://aidaguest.kreatinmedya.com`
- Env: `APP=guest` (**Build Variable = ON**) + guest runtime env'leri.

---

## Environment Variables

> Değerleri yerel `.env` dosyandan kopyala; sadece URL'leri prod domaine çevir.
> `APP` = **Build Variable (ON)**. Diğer hepsi normal (runtime) env.

### Konsol (web)
| Key | Değer | Not |
|---|---|---|
| `APP` | `web` | **Build Variable ON** |
| `DATABASE_URL` | `.env`'deki ile aynı | aidahos_app rolü (RLS) |
| `RADIUS_DATABASE_URL` | `.env` ile aynı | Connections sekmesi okur |
| `BETTER_AUTH_SECRET` | `.env` ile aynı | |
| `BETTER_AUTH_URL` | `https://aidahos.kreatinmedya.com` | **değişti** |
| `GUEST_PUBLIC_URL` | `https://aidaguest.kreatinmedya.com` | anket public link tabanı |
| `API_BASE_URL` | `.env` ile aynı | (aida-api kullanılıyorsa) |
| `API_SERVICE_TOKEN` | `.env` ile aynı | (aida-api kullanılıyorsa) |
| `NODE_ENV` | `production` | |

### Guest portal
| Key | Değer | Not |
|---|---|---|
| `APP` | `guest` | **Build Variable ON** |
| `DATABASE_URL` | `.env` ile aynı | otel/anket okuma + yanıt yazma |
| `RADIUS_DATABASE_URL` | `.env` ile aynı | captive login → radcheck yazımı |
| `GUEST_VERIFIER` | `sim` | DEV doğrulama (hotel_simulation) |
| `NODE_ENV` | `production` | |

> `NEXT_PUBLIC_GUEST_DEFAULT_HOTEL` Dockerfile'da `esken-bodrum` olarak bake'li (`/` kök yönlendirmesi). Değiştirmek istersen guest app'te `Build Variable` olarak ekle.

> **DB bağlantısı:** Postgres Coolify'da yönetiliyorsa, app'leri aynı projeye/networke koyup `DATABASE_URL`'de **internal hostname**'i kullan (public IP yerine) — daha hızlı + güvenli. Şu anki public URL de çalışır.

---

## 3) Deploy sonrası
1. İki app da **Running** olunca:
   - `https://aidahos.kreatinmedya.com` → login ekranı
   - `https://aidaguest.kreatinmedya.com/esken-bodrum` → guest portal
2. MikroTik `login.html` zaten `https://aidaguest.kreatinmedya.com/esken-bodrum`'a bakıyor (repo'da güncel). MikroTik'e bir kez yükle:
   ```
   curl -T infra/mikrotik/flash/aida/login.html "ftp://admin:<PW>@192.168.88.1/flash/aida/login.html" --ftp-create-dirs
   ```
   Walled-garden: `/ip hotspot walled-garden add dst-host=*.kreatinmedya.com action=allow`
3. Artık tünel yok, URL sabit — captive doğrudan prod guest portala gider.

## Migration / seed (gerekirse, bir kez)
Şema zaten remote DB'de. Yeni bir DB'ye kuruyorsan, **yerelden** remote'a karşı:
```
pnpm --filter @aidahos/db run push      # şema + RLS
pnpm --filter @aidahos/db run seed:surveys
```
(MIGRATION_DATABASE_URL owner bağlantısı `.env`'de.)

## Her değişiklikte
GitHub'a push → Coolify her app için otomatik (veya manuel) yeniden deploy. Konsolda geliştirmeye lokalde devam edebilirsin; sadece guest/konsol prod davranışını test edeceğinde push yeterli.
