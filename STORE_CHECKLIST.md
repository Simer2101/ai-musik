# Store launch checklist

Use this after the app builds and the API is live.

## Accounts

- [ ] Expo account at https://expo.dev
- [ ] `npm i -g eas-cli` then `eas login`
- [ ] In `apps/mobile` run `eas init` and paste the project ID into `app.json` → `extra.eas.projectId`
- [ ] Google Play Console ($25 one-time)
- [ ] Apple Developer Program ($99 / year)
- [ ] Public privacy policy URL. In the GitHub repo: Settings → Pages → Deploy from branch `master` / folder `/site`, or drop `site/` onto Cloudflare Pages.

## Android

1. Create the app in Play Console: name **AImusik**, package `com.aimusik.app`, category Music & Audio.
2. Complete content rating, data safety, target audience 13+, and declare AI-generated UGC with moderation.
3. Add 512 icon, 1024×500 feature graphic, phone screenshots.
4. Point privacy policy to `https://YOUR_DOMAIN/privacy.html`.
5. From `apps/mobile`:

```bash
npx eas build --platform android --profile production
npx eas submit --platform android
```

6. First upload lands on internal testing. Promote to production after testers sign off.

## iPhone

1. Create the app in App Store Connect, bundle id `com.aimusik.app`.
2. Mac is not required. EAS builds the `.ipa` in the cloud.
3. From `apps/mobile`:

```bash
npx eas build --platform ios --profile production
npx eas submit --platform ios
```

4. Install from TestFlight, then Submit for Review.
5. Review notes: “All audio is AI-generated via ElevenLabs. Users submit text prompts. We rate-limit and accept reports.”
6. Screenshots for 6.7" iPhone, age 12+, category Music.

## Legal copy stores expect

- Privacy Policy and Terms on a public URL
- Account deletion in Profile
- “AI-generated” label on every track
- Report button on track pages
- No claim of human/label authorship
