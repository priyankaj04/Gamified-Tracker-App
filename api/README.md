# KaizenArc API

Express + TypeScript backend for the KaizenArc tracker app. Talks to Supabase
(PostgreSQL) and exposes the JSON API described in the project root README.

## Quick start

```bash
cp .env.example .env       # fill SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY
npm install
npm run dev                # starts http://localhost:3000
```

Apply the schema once by pasting `schema.sql` into the Supabase SQL editor.

## Layout

```
src/
  index.ts          Express bootstrap + route mounting
  routes/           One file per resource
  services/         Database logic + gamification engine
  middleware/       errorHandler, validate (Zod)
  lib/              xp.ts, levels.ts, badges.ts, date.ts
  types/            Shared TS types
```

All responses follow `{ data, error }`.

## Health check

```bash
curl http://localhost:3000/api/health
# → {"data":{"status":"ok","uptime":...},"error":null}
```
