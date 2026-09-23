# AImusik

Mobile app only for AI music: generate a track from a text prompt, then listen to music already created inside the app.

## Stack

- Expo / React Native (`apps/mobile`) for iPhone and Android
- Hono API (`apps/api`) for generation, catalog, likes, reports
- Supabase for auth, Postgres, Storage
- ElevenLabs Music API for official generation
- Expo EAS for store builds
- Railway for API hosting

## Layout

- `apps/mobile` Expo app
- `apps/api` Generation and catalog API
- `supabase` SQL for tables, RLS, storage
- `site` Privacy, Terms, landing
- `STORE_CHECKLIST.md` App Store and Google Play steps

## First-time setup

1. Create a Supabase project.
2. Run `supabase/schema.sql` then `supabase/storage.sql` in the SQL editor.
3. Get a paid ElevenLabs API key.
4. Copy `.env.example` to `apps/api/.env` and `apps/mobile/.env`.

## Run locally

```bash
cd apps/api
npm install
npm run dev

cd apps/mobile
npx expo start
```

On a physical phone set `EXPO_PUBLIC_API_URL` to your computer LAN IP, not localhost.

## Host API on Railway

1. Create a Railway project from this GitHub repo.
2. Set the root directory to `apps/api`.
3. Add env vars from `.env.example`.
4. Put the Railway HTTPS URL into `EXPO_PUBLIC_API_URL`.

Privacy pages: enable GitHub Pages for the `site/` folder.

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

- 3 generations per user per day (`DAILY_GENERATION_LIMIT`)
- Prompts that name a specific living artist are rejected
- Every track is labeled AI-generated
- Users can report a track and delete their account
