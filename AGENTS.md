## Cursor Cloud specific instructions

### Overview

Travel Tracker is a Next.js 15 (App Router) + TypeScript app for visualizing Google Timeline data on maps. It uses PostgreSQL via Neon serverless driver (`@neondatabase/serverless` with `drizzle-orm/neon-http`), MapLibre GL JS for maps, and offline geocoding.

### Local Database Setup

The app uses the Neon HTTP driver (`neon()` function), which cannot connect directly to a local PostgreSQL instance. A **local neon HTTP proxy** is required:

1. PostgreSQL must be running on port 5432 with `scram-sha-256` authentication.
2. The Docker-based `ghcr.io/timowilhelm/local-neon-http-proxy:main` container bridges the Neon HTTP protocol to local PostgreSQL. Run with `--network=host` and `PG_CONNECTION_STRING=postgres://postgres:postgres@127.0.0.1:5432/travel_tracker`.
3. The proxy exposes HTTPS on port 4445. An iptables NAT rule redirects port 443 to 4445 so the `neon()` driver's default `fetchEndpoint` (`https://{host}/sql` on port 443) works without code changes.
4. `NODE_TLS_REJECT_UNAUTHORIZED=0` is required in `.env.local` for the self-signed certificate.
5. `DATABASE_URL=postgresql://postgres:postgres@db.localtest.me/travel_tracker` — the `neon()` driver transforms `db.localtest.me` to `api.localtest.me` for the fetch endpoint. Both resolve to `127.0.0.1` via the `localtest.me` DNS service.

### Starting Services

```bash
# 1. Start PostgreSQL
sudo pg_ctlcluster 16 main start

# 2. Start neon HTTP proxy (Docker must be running)
sudo dockerd &>/dev/null &
sleep 3
docker start neon-proxy 2>/dev/null || docker run -d --name neon-proxy --network=host \
  -e PG_CONNECTION_STRING="postgres://postgres:postgres@127.0.0.1:5432/travel_tracker" \
  ghcr.io/timowilhelm/local-neon-http-proxy:main

# 3. Redirect port 443 → 4445 (idempotent check)
sudo iptables -t nat -C OUTPUT -p tcp -d 127.0.0.1 --dport 443 -j REDIRECT --to-port 4445 2>/dev/null || \
  sudo iptables -t nat -A OUTPUT -p tcp -d 127.0.0.1 --dport 443 -j REDIRECT --to-port 4445

# 4. Push schema (if first time)
DATABASE_URL="postgresql://postgres:postgres@db.localtest.me/travel_tracker" NODE_TLS_REJECT_UNAUTHORIZED=0 npx drizzle-kit push

# 5. Start dev server
npm run dev
```

### Key Commands

| Task | Command |
|------|---------|
| Dev server | `npm run dev` (port 3000) |
| Tests | `npm run test` (vitest, no DB needed) |
| Lint | `npm run lint` |
| Build | `npm run build` |
| Push schema | `DATABASE_URL=... NODE_TLS_REJECT_UNAUTHORIZED=0 npx drizzle-kit push` |

### Authentication

In dev mode, if `APP_PASSWORD` is not set, any password is accepted. With `APP_PASSWORD=devpassword123` in `.env.local`, use that password to log in. The session cookie is signed with `SESSION_SECRET`.

### Gotchas

- `drizzle-kit` does not read `.env.local` automatically — pass `DATABASE_URL` and `NODE_TLS_REJECT_UNAUTHORIZED=0` as environment variables explicitly.
- The `neon()` function transforms the hostname from `DATABASE_URL` (e.g., `db.localtest.me` → `api.localtest.me`) when constructing the fetch endpoint. Both must resolve to `127.0.0.1`.
- `eslint-config-next` v16 exports flat config arrays directly — do not use `FlatCompat` wrapper (causes circular reference errors).
- The ESLint config (`eslint.config.mjs`) and its dependencies (`eslint`, `eslint-config-next`, `@eslint/eslintrc`) are dev setup files added for lint support.
