# KPI Dashboard

**English** | [Français](README.fr.md)

Internal dashboard for monitoring Advantech WISE-4000 I/O modules deployed across Savoura
sites. Tracks a `Site → Machine → Device → Channel` hierarchy, polls each device's channels on
a configurable interval, and stores the history for KPI reporting.

## Stack

- **Next.js 16** (App Router) + React 19
- **Prisma 7** + **PostgreSQL**
- **Tailwind CSS 4**
- **Docker Compose** for local/prod deployment

## Data model

- `Site` → `Machine` → `Device` (identified by MAC/IP, with encrypted credentials)
- `Device` → `Channel_Config` (per-channel mode/pause settings, channels 1–4)
- `Device_Poll` → `Channel_Log` / `Message_Log` (one row per poll attempt, with per-channel
  values and any device messages)

See `prisma/schema.prisma` for the authoritative schema and `project-notes.md` for the UML
diagram.

## Polling

Each device gets its own in-process timer (`src/lib/polling/scheduler.ts`) so a slow or
unreachable device never blocks polling for the others. A device auto-escalates from `active`
to `error` after 5 consecutive failures, falls back to a slower retry cadence, and auto-recovers
to `active` on the next successful poll. Device credentials are encrypted at rest
(`src/lib/security/device-credential.ts`).

## Running locally

```bash
npm install
```

Create a `.env` with:

```
DATABASE_URL=postgresql://user:password@localhost:5432/mydb?schema=public
DEVICE_CREDENTIAL_KEY=<32-byte AES-256-GCM key, base64>
```

Then run migrations and start the dev server:

```bash
npx prisma migrate dev
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Running with Docker

```bash
docker compose up --build
```

This builds the standalone Next.js image and starts it alongside a Postgres container
(`compose.yml`). `DEVICE_CREDENTIAL_KEY` must be set in `.env` — the compose file will refuse to
start without it.

## Project layout

- `src/app/(app)/sites/...` — Sites → Machines → Devices pages
- `src/components/device/` — device card, config panel, debug panel
- `src/lib/data/` — Prisma queries per entity
- `src/lib/polling/` — scheduler + poll persistence
- `prisma/migrations/` — schema history

## Screenshots
![device overview](./screenshots/device-overview.png)
![new device](./screenshots/new-device.png)
