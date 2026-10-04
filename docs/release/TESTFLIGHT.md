# TestFlight: from this repository to testers' phones

Status 4 Oct 2026. Everything below that can be checked without Apple or Expo accounts has been checked (the preflight passes, the native iOS project generates from the config). **No build has been made and nothing has been uploaded**: that needs your Apple Developer and Expo accounts, which only you hold. Anything marked *unverified* has not been confirmed from a primary source here.

## What testers will get (be honest with them)
The first build is a **local-only alpha**. From the end-to-end audit (`docs/release/audit/`):
- Works: the 18+ gate, onboarding, adding a child, Tonight with prompts, recording a spoken letter or typing one, review, keeping it, the quiet day, the book by month, letter detail.
- Playback of a recording and Read together with audio: included only if the playback branch is merged into the build you make (`feat/mobile-playback-read-together`). No word highlight yet.
- Export: included only if the export branch is merged (`feat/export-offline-book`).
- **Not in this build:** sign-in, sync, backup, restore, family invites, Plus and purchases, offer codes, account deletion, push reminders, and **transcription of spoken letters** (the speech model and decoder are not built, so a spoken letter is kept as a recording and Review offers to keep it; typing works). Product fonts fall back to Georgia and the system font.
- **Data stays on the phone only.** Deleting the app or losing the phone loses every letter. Tell testers this before they write anything they care about.

Suggested text for TestFlight's "What to test" (testers see it; plain words):
> This is an early test of Early Letters. Everything you write stays on your phone and is not backed up: if you delete the app, it is gone. Please try: opening the app for the first time, adding a child, writing a letter by typing, recording a letter by voice, keeping it, and looking at the book. Spoken letters are saved as recordings; turning them into words is not in this version yet. Tell us anything that felt confusing, slow or wrong.

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

## Before you press build: put the work in the build
A build contains the branch you build from. The overnight agent branches are not merged yet. The order I will follow before you build tomorrow:
1. Review and merge the fix and QA branches into `release/ios-v1.0` (I integrate them and show you the result).
2. I run the full tests and the preflight on the merged branch.
3. You build from `release/ios-v1.0`.
If you want a build earlier, building from the branch as it is now is safe but contains none of the playback, export or test work.

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
