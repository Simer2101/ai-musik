# Sonari

Mobile app for listening to AI music from the in-app catalog. Users cannot create or upload tracks.

## Stack

- Expo / React Native (`apps/mobile`) for iPhone, Android and web
- Hono API (`apps/api`) for the catalog, sign-in, likes, reports
- PostgreSQL for accounts, sessions, likes, reports
- Timeweb Cloud for hosting the API and the database
- sms.ru for sign-in codes, Telegram for Telegram sign-in
- Expo EAS for store builds

## Layout

```
apps/
  mobile/        Expo app
    app/           screens (Expo Router)
    components/    shared UI
    providers/     auth, player, profile, settings, tokens
    lib/           API client, catalog, i18n, helpers
    constants/     colors and fonts
    assets/        icons, splash, demo covers
  api/           API (Hono)
    db/            schema.sql, applied automatically on start
catalog/         tracks.json plus audio/ and covers/ served by the API
site/            Landing, Privacy, Terms, Telegram login callback
STORE_CHECKLIST.md   App Store and Google Play steps
```

## First-time setup

1. Copy `apps/api/.env.example` to `apps/api/.env` and `apps/mobile/.env.example` to `apps/mobile/.env`.
2. Point `DATABASE_URL` at a PostgreSQL database. Tables are created when the API starts.

## Run locally

```bash
cd apps/api
npm install
npm run dev

cd apps/mobile
npm install
npx expo start
```

On a physical phone set `EXPO_PUBLIC_API_URL` to your computer LAN IP, not localhost.

Typecheck before committing:

```bash
cd apps/api && npm run typecheck
cd apps/mobile && npx tsc --noEmit
```

## Host on Timeweb Cloud

See `apps/api/README.md`: a managed PostgreSQL and an App Platform backend built from
`apps/api`. Put the app's HTTPS address into `EXPO_PUBLIC_API_URL`.

Privacy pages: publish the `site/` folder with Cloudflare Pages or any static hosting.

## Publish to stores

See `STORE_CHECKLIST.md`.

```bash
cd apps/mobile
npx eas build --platform android --profile production
npx eas submit --platform android
npx eas build --platform ios --profile production
npx eas submit --platform ios
```

Google Play is $25 once. Apple Developer is $99 per year. A Mac is not required.

## MVP rules

- Every track is labeled AI-generated
- Users can report a track and delete their account
