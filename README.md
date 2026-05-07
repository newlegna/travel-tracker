# Travel Tracker — Year-by-Year

Personal web app: import Google Location History / Timeline (Takeout), see trips and places **by year** on a map.

## Status

Scaffold in progress: `package.json` defines the planned stack (Next.js 15, Drizzle + Neon, MapLibre, offline reverse geocoding). Implementation is intended to follow the product plan (Google Timeline old + new JSON formats, trip clustering, year views).

## Setup (after code lands)

1. Copy `.env.example` to `.env` and set `DATABASE_URL` (Neon) and app secrets.
2. `npm install`
3. `npm run db:push` or `npm run db:migrate`
4. `npm run dev`

## Pointing Cursor Cloud Agent here

Open this repo in a Cloud Agent and ask it to implement the Travel Tracker plan: Next.js App Router, Drizzle schema, Timeline import + parser, geocoding, trip detection, pages `/`, `/year/[year]`, `/trip/[id]`, `/all-time`, `/place/[id]`, `/import`, `/settings`, password middleware.
