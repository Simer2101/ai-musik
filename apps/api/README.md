# AImusik API

Hono server that creates AI tracks through ElevenLabs, stores them in Supabase, and serves the catalog.

## Local

```bash
cp ../../.env.example .env
npm install
npm run dev
```

Health check: `GET http://localhost:8787/health`

## Railway

1. Create a new Railway project from this GitHub repo.
2. Set the root directory to `apps/api`.
3. Add the variables from `.env.example`.
4. Deploy. Railway provides HTTPS automatically.
