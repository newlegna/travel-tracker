# Travel Tracker — Year-by-Year

Personal web app: import Google Location History / Timeline (Takeout), see trips and places **by year** on a map.

## What it does

- Single-user password gate with a signed session cookie.
- Import Google Timeline / Location History exports:
  - old `timelineObjects[].placeVisit` JSON
  - newer top-level arrays containing `visit.topCandidate.placeLocation`
  - Google Takeout `.zip` files or multiple monthly `.json` files
- Offline reverse-geocode visits to city/country using `offline-geocode-city`.
- Detect trips by clustering consecutive visits more than 100 km from home with gaps under 2 days.
- Browse:
  - `/` newest-first year stack with mini maps and stats
  - `/year/[year]` full map, clustered points, chronological path, stats, trips, top places
  - `/trip/[id]` trip map, day-by-day list, rename/notes, merge, split
  - `/all-time` lifetime heatmap-style map and year-over-year stats
  - `/place/[id]` repeat visits to one place
  - `/import` upload, preview, exclude spurious trips, commit
  - `/settings` home location, password hash, JSON export, delete all travel data

Maps use MapLibre GL JS with OpenFreeMap vector tiles and do not require an API key.

## Environment variables

Copy `.env.example` to `.env.local` for local development.

| Variable | Required | Description |
| --- | --- | --- |
| `DATABASE_URL` | Yes for persistence | Neon Postgres connection string. Pages render empty states without it, but imports/settings require it. |
| `APP_PASSWORD` | Required in production | Initial single-user password. If a password is set in `/settings`, the app stores `password_hash` in the `settings` table and uses that for future logins. |
| `SESSION_SECRET` | Strongly recommended | Secret used to sign the session cookie. Use at least 32 random characters. Defaults to `APP_PASSWORD` in development. |

## Local development

```bash
npm install
cp .env.example .env.local
# edit .env.local
npm run db:push
npm run dev
```

Open <http://localhost:3000>, sign in with `APP_PASSWORD`, visit `/import`, upload a Timeline export, confirm home, preview trips, commit, then browse `/` or `/year/[year]`.

## Database

The schema is defined in `app/db/schema.ts` using Drizzle ORM:

- `places` deduplicated by rounded latitude/longitude (`place_key`)
- `visits`
- `trips`
- `settings`
- `imports`

For local or Neon schema changes, use:

```bash
npm run db:push
```

`npm run db:generate` is available if you prefer generated migrations. `npm run db:migrate` runs migrations from the `drizzle/` folder.

## Deploy to Vercel + Neon

1. Create a Neon database and copy the pooled Postgres connection string.
2. In Vercel project settings, set `DATABASE_URL`, `APP_PASSWORD`, and `SESSION_SECRET`.
3. Run `npm run db:push` against the Neon database from your local environment or CI.
4. Deploy the Next.js app.

No map or geocoding API keys are needed.

## Smoke test

```bash
npm install
npm run test
npm run build
```

Then:

1. Start the app with `npm run dev`.
2. Sign in.
3. Upload a small old-format or new-format Timeline JSON in `/import`.
4. Recalculate if home needs adjustment.
5. Uncheck any spurious trips and commit.
6. Confirm `/`, `/year/[year]`, `/trip/[id]`, `/all-time`, and `/place/[id]` render.
