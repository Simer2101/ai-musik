# Sonari API

Hono server on Node.js. It serves the catalog, signs listeners in (Telegram or an SMS code)
and keeps accounts, likes and reports in PostgreSQL. Tables are created on start from
`db/schema.sql`, so a new database needs no manual setup.

## Local

```bash
cp .env.example .env
npm install
npm run dev
```

Health check: `GET http://localhost:8787/health` shows whether the database, Telegram and
SMS are configured. Without `DATABASE_URL` the API still serves the catalog, and sign-in
returns 503.

To try phone sign-in without sms.ru, set `SMS_DEV_ECHO=true`: codes are printed to the log.
This is ignored when `NODE_ENV=production`.

## Timeweb Cloud

1. **Database.** Databases → Create → PostgreSQL, region Russia. Copy the connection string
   into `DATABASE_URL`. If the API connects to its public address, set `DATABASE_SSL=true`.
2. **App.** Apps → Create → Backend → from GitHub `Simer2101/ai-musik`, branch `main`,
   project folder `apps/api`. Either pick the Dockerfile in that folder, or Node.js with
   build command `npm ci && npm run build` and start command `npm start`. Port `8787`.
3. **Environment variables.** Everything from `.env.example`, plus `NODE_ENV=production`.
4. **Domain.** Timeweb gives the app an HTTPS address; put it into the mobile app's
   `EXPO_PUBLIC_API_URL`.

## Endpoints

| Method | Path | What it does |
| --- | --- | --- |
| GET | `/health` | Configuration and database status |
| GET | `/v1/tracks`, `/v1/tracks/:id` | Catalog with live like counts |
| POST | `/v1/auth/telegram` | Telegram login result → session token |
| POST | `/v1/auth/phone/send` | Texts a 6-digit code (one per minute per number) |
| POST | `/v1/auth/phone/verify` | Code → session token |
| POST | `/v1/auth/logout` | Ends this session |
| GET | `/v1/me`, `/v1/me/likes` | The account and its liked tracks |
| POST/DELETE | `/v1/tracks/:id/like` | Like or unlike |
| POST | `/v1/tracks/:id/report` | Report a track |
| DELETE | `/v1/me` | Delete the account with its likes and sessions |

Signed-in calls send `Authorization: Bearer <token>`. The database stores only a SHA-256 of
each token.
