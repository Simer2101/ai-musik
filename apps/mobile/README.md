# AImusik mobile

```bash
cp .env.example .env
npx expo start
```

Store builds (from this folder):

```bash
npx eas login
npx eas init
npx eas build --platform all --profile production
npx eas submit --platform all
```

See `../../STORE_CHECKLIST.md`.
