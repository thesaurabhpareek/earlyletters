# TestFlight: from this repository to testers' phones

Status 4 Oct 2026. Everything below that can be checked without Apple or Expo accounts has been checked (the preflight passes, the native iOS project generates from the config). **No build has been made and nothing has been uploaded**: that needs your Apple Developer and Expo accounts, which only you hold. Anything marked *unverified* has not been confirmed from a primary source here.

## What testers will get
This tree is `develop` (the app of record: auth, billing on device, sync, export, family, player, reminders, languages, speech) plus the website and the 4 Oct membership decisions. Exactly what works in a first build, and what does not, comes from a fresh end-to-end audit of this tree (in progress; the earlier audit described a thinner app and is superseded). Until it lands, tell testers only this, which is true of any first build: it is an early version, it can make mistakes, and nothing here has been tried on a device by the team.

Suggested text for TestFlight's "What to test" (plain words; edit once the audit is in):
> This is an early test of Early Letters. Please try: opening the app for the first time, adding a child, recording or typing a letter, keeping it, and looking at the book. Tell us anything that felt confusing, slow or wrong. This version can make mistakes.

## Your 30-day checklist already exists
`docs/FOUNDER_TASKS.md` is the full ordered list (FT-01 Apple enrolment, FT-06 Paid Apps agreement, FT-07 Sign in with Apple key, FT-08 and FT-09 app record and products, FT-10 Supabase, FT-12 Supabase Auth, FT-16 signing key and bucket, FT-17 Expo account and the first build on a real iPhone). This runbook is the TestFlight slice of it.

## What you need before building (only you can do these)
| # | You do | Why | Typical time (unverified) |
|---|---|---|---|
| 1 | Join the Apple Developer Program as an individual (developer.apple.com/programs) | Needed for any TestFlight build; the seller name is your legal name (D-004) | Enrollment can take from minutes to a couple of days |
| 2 | Create an Expo account (expo.dev) | The cloud builder | 5 minutes |
| 3 | In App Store Connect create an app record: platform iOS, bundle id **com.earlyletters.scribe.preview** (register it under Certificates, Identifiers & Profiles first if it is not offered), a unique name such as "Early Letters Preview", primary language English (US) | TestFlight needs a record to receive builds | 10 minutes |
| 4 | Have a computer with Node 22 (Mac, Windows or Linux; EAS builds iOS in the cloud, so a Mac is not required, *unverified here*) | To run the build command once | |

The `.preview` id is deliberate: the **permanent production id (`com.earlyletters.scribe`) is not used up** while you test. When you are ready for the real listing you create a second record with the real id.

## Fastest path: two commands
```bash
git checkout release/ios-v1.0 && git pull
npm ci
npm run preflight:testflight -w @scribe/mobile        # must say "Preflight passed"
cd apps/mobile
npx eas-cli@latest login                               # your Expo account
npx eas-cli@latest build --platform ios --profile testflight
npx eas-cli@latest submit --platform ios --profile testflight --latest
```
- The first `build` asks you to sign in to your Apple account (2FA) and sets up the certificate and provisioning profile for you. Say yes to everything it offers to manage.
- If it says the project is not linked, run `npx eas-cli@latest init` and send me the `projectId` it prints if it asks you to edit `app.config.ts`; I will add it (the config is a file, not JSON).
- The first `submit` asks for the App Store Connect app (choose the record from step 3). An App Store Connect API key makes later submits prompt-free.
- Apple processes the build for a while after upload (*unverified*: usually under an hour), then it appears in App Store Connect under TestFlight.
- Add testers: **internal testers** are people you add under Users and Access in App Store Connect; they can install without a beta review (*unverified here: check the current limits and rules in App Store Connect*). **External testers** (anyone with an email or a public link) need a short Beta App Review for the first build (*unverified*: the roadmap assumes 1 to 3 days). For tomorrow, use internal testers.
- Testers install the free **TestFlight** app from the App Store, accept your invitation, and install Early Letters.

## Without a computer in front of you: the workflow
`.github/workflows/testflight.yml` does the same from GitHub's Actions tab (run workflow, tick "Upload to TestFlight"). It first runs the typecheck, all tests and the preflight, then builds and submits. It needs, once: the `EXPO_TOKEN` secret, and Apple credentials stored in EAS (run `eas credentials` once, or add an App Store Connect API key to EAS). It has never been run: expect to fix one or two things on the first try.

## Before you press build: which branch
Build from `integration/develop-plus-main` (the combined tree: typecheck clean, all workspace tests and all 15 database test files pass, preflight passes, the native iOS project generates with Sign in with Apple, universal links for earlyletters.com and no background modes). Do not build from `main`: it holds the website and a thinner app.

Things the app needs that only you can supply, or the build runs but features do nothing: a Supabase project (staging) and its public URL and anon key as EAS environment variables (FT-10, FT-12), the Sign in with Apple key (FT-07), the pack signing public key (FT-16). Without them the app opens but sign-in, sync and remote content will not work. Universal links also need `APPLE_TEAM_ID` and the bundle id set for the website's association file (it returns 404 until then), and for the `.preview` id the file must list that id too.

## What I could not check, so check it on the first build
- That the build **compiles and signs** (needs Apple and Expo).
- The speech engine's native module (`whisper.rn`) and the file module under `apps/mobile/modules/scribe-files` building in a cloud build: the native project generates, but linking and compiling are unverified.
- That the app opens on a real phone, the microphone prompt shows our wording, a recording survives backgrounding, and the keyboard and Dynamic Type behave.
- App icon: it is still the scaffold icon (`TODO(design)` in `app.config.ts`); fine for TestFlight, not for the store.
- Export compliance: the build declares standard operating-system encryption only (`usesNonExemptEncryption: false`). That is accurate for this build; **re-assess with counsel before audio upload (D-032) ships**.

## After the first build
- Each re-run bumps the build number automatically.
- Crashes from TestFlight testers appear in App Store Connect under TestFlight, Crashes (no crash SDK is in the app by design; analytics and crash reporting are opt-in and not built yet).
- Production: when the preview build has been tested, create the real record for `com.earlyletters.scribe`, use the `production` profile, and follow `docs/ROADMAP.md` section 2, M12 and M13. The bundle id is permanent from that moment.
