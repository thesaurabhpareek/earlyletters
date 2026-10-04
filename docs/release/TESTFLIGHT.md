# TestFlight: the first build of v1.0 (on this phone only)

Status: 4 Oct 2026. Written for the first internal build, made from `develop`, for the founder and Ishita.

**No build has been made and nothing has been uploaded.** That needs the founder's Apple Developer and Expo accounts. Everything that can be checked without them is checked by `npm run preflight:testflight -w @scribe/mobile` (what it checks is below). Anything marked *unverified* is a fact about Apple or Expo that has not been confirmed from a primary source here: check it in App Store Connect or the Expo docs before relying on it.

## What this build is

`EXPO_PUBLIC_SERVER_FEATURES=off` (PR #54, merged). The `testflight` profile in `apps/mobile/eas.json` sets it, and sets `EXPO_PUBLIC_APP_ENV=preview`, so the app id is **`com.earlyletters.scribe.preview`**. The permanent production id `com.earlyletters.scribe` is not used up by testing.

### What testers get (in `develop` today)
- First run: the age question, the promise, a child (name, birth or due date, twins), the signature, spoken language.
- Tonight: a prompt, Speak or Type, "Not much today".
- Speaking a letter: listening, pause, finish, Review with each small fix marked, put back or "Exactly what was said", edit words, keep to the Book or keep private.
- Typing a letter with autosaved drafts.
- The Book by month, the letter page (original words, reading size, private, delete with undo), Read together.
- Settings: children, reminders (local notifications), appearance (light, dark, reading size), Recordings, spoken language, storage, Export (a ZIP with every letter and recording), privacy switch for usage reports, helplines, licences, Help (email row).
- Plus in the app, as StoreKit 2 purchases (`plus.annual`, `plus.monthly`). Whether they load depends on the App Store Connect setup below.
- Family tab and "Write this book together" show **coming soon**; "Tell me when it's here" stores a flag on the phone and sends nothing.

### What does not exist in this build
- **No accounts, no sign-in, no sync, no co-parent sharing, no invites, no delete-account.** The code exists but is switched off; no Supabase client is created and no sign-in or sync network call is made.
- **No backup of our own.** A person's letters live on the phone. Safety is the iPhone or iCloud backup plus Export (D-085). The app must not claim more.
- **No in-app feedback form.** Testers use the Help email row (see Feedback).
- **No analytics or crash reporting reaches us:** no PostHog key is in the build. The "Help us make it better?" sheet can appear on a later session; choosing Share sends nothing here.
- No Android, no iPad layout, English interface only.

### The membership gate: what state it is in
D-082 and D-083 (first 2 letters free, then Plus; Keep gate) are decisions on `origin/docs/decisions-4-oct` (PR #91, **open, not merged**), and the engine is PR #96 `feat/mobile-membership-engine` (**open, not merged**). So a build from `develop` today does **not** have it. It has the older rule: the first book free, Read together free for 3 sessions per book, starting another book needs Plus, and some screens still say "free, always" (journey review, J03-08, J11-05, J12-01). Do not tell testers about "2 free letters". Decide before the build: merge #96 (and #91) first, or build without it and say so in "What to test".

Other 4 Oct decisions are also still open PRs, so they are **not** in a `develop` build: quiet-day marks with no sentence D-084 (#92: today "Not much today" stores a sentence that the Book shows), resilience for crashes and bad links (#93: today a crashing screen is blank), child editing and the birthday default (#94), dark mode and states (#95). The delete shelf and kill-and-restore drills of D-085 have no PR yet. Check `gh pr list` before the build; this paragraph goes stale the day any of them merges.

## What only the founder can do

| # | Step | Backlog | Notes |
|---|---|---|---|
| 1 | Enrol in the Apple Developer Program as an individual and accept agreements | FT-01 | Everything below waits on it. Time to approve: *unverified*. |
| 2 | Create an Expo account | FT-17 | The cloud builder. |
| 3 | App Store Connect: create an app record, iOS, bundle id `com.earlyletters.scribe.preview` (register the id first under Certificates, Identifiers & Profiles if it is not offered), a name such as "Early Letters Preview", primary language English (US) | FT-08 | *Unverified*: exact menu names. |
| 4 | Add Ishita as an App Store Connect user so she can be an **internal** tester | | She needs an Apple ID. Role and limits: *unverified*. |
| 5 | For Plus in the sandbox: accept the Paid Apps agreement and create the two subscription products **on this .preview record** with ids exactly `plus.annual` and `plus.monthly` | FT-06, FT-09 | Without this the Plan screen cannot load products. Skip it for a first build that does not test purchases. |
| 6 | Language packs and speech: host, signing key | FT-16 | See "Without this, no words". Skip only if the first build tests typing, the Book and everything except speech. |
| 7 | `eas init`, then send the project id it prints so it is added to `extra.eas.projectId` in `apps/mobile/app.config.ts` | FT-17 | `app.config.ts` is a dynamic config, so the CLI may not be able to write it (*unverified*). The preflight warns until the id is there. |
| 8 | The two build commands below | FT-25 | |

### Without this, no words (read before building)
Speech runs on the phone, but the speech model (about 575 MB) is a downloaded pack. It only installs from a **signed pack manifest**, which needs both:
1. `EXPO_PUBLIC_DOCS_BASE_URL` in the build: an `https://` origin with no path (`apps/mobile/src/lib/remote/base.logic.ts`). v1.0 never falls back to Supabase. It is a plain-text, non-secret value: put it in the `testflight` profile `env` or in an EAS "preview" environment variable.
2. A public signing key in `packages/api/src/keys.ts` (`TRUSTED_SIGNING_KEYS`, from `node scripts/packs/keygen.ts`). It is empty today, and the app fails closed.

Missing either one: recordings are kept safely on the phone, but **words are never written down** (Review stays on "Writing down what you said", Book cards say words are waiting) and no language pack downloads. Typed letters are unaffected. The preflight reports both as WARN with this consequence. A TestFlight build without them is useful for typing, the Book, reading and layout, not for the spoken path.

## The two commands
```bash
git checkout develop && git pull
npm ci
npm run preflight:testflight -w @scribe/mobile     # read every WARN and UNVERIFIED line
cd apps/mobile
npx eas-cli@latest login
npx eas-cli@latest build --platform ios --profile testflight
npx eas-cli@latest submit --platform ios --profile testflight --latest
```
- The first `build` is expected to ask for your Apple sign-in (two-factor) and offer to create the certificate and provisioning profile. Say yes. *Unverified.*
- EAS should register the capabilities the build needs on the `.preview` App ID (Data Protection, Sign in with Apple, Associated Domains; see App Review notes). *Unverified.*
- The first `submit` asks which App Store Connect app (the record from step 3). An App Store Connect API key stored in EAS makes later submits prompt-free. *Unverified.*
- Apple processes the build after upload before it shows under TestFlight. Duration: *unverified*.
- The build number is the EAS remote counter and goes up on each build (`autoIncrement`); version is `1.0.0` from `app.config.ts`.
- **Internal testers first**: people added in App Store Connect can install without a beta review (*unverified*). External testers need a Beta App Review of the first build (*unverified*). Testers install the free TestFlight app, accept the invitation, and install Early Letters.

`.github/workflows/testflight.yml` does the same from the Actions tab, on `develop` or an `ios-v*` tag only: typecheck, all tests, preflight, then build (and submit if ticked). It needs the `EXPO_TOKEN` secret, the linked project id, and credentials already stored in EAS (so one build is made from a computer first). It has never run: expect to fix a flag on the first try (`--auto-submit` and `--non-interactive` behaviour are *unverified*).

## What the preflight checks
`npm run preflight:testflight -w @scribe/mobile` (add `-- --skip-prebuild` to skip the native project, about a minute). FAIL stops (exit 1); WARN does not.
- **eas.json**: `testflight` profile (store distribution, `EXPO_PUBLIC_APP_ENV=preview`, `EXPO_PUBLIC_SERVER_FEATURES=off`), every profile off, EAS-owned build number, submit profile, no secret-looking values.
- **Config** (`expo config --type public`): bundle id is production id plus `.preview`, URL scheme matches `packages/brand`, microphone purpose string, no background audio, no permission besides the microphone, privacy manifest declared, `usesNonExemptEncryption: false`, version `1.0.0`, no build number in the config.
- **Icons**: the four brand icons exist, are 1024 x 1024, the light one has no alpha; no Expo scaffold icon files.
- **Env files** hold nothing but APP_ENV and `SERVER_FEATURES=off`; the profile sets no Supabase or analytics key.
- **Packs**: WARN for a missing `EXPO_PUBLIC_DOCS_BASE_URL` and for an empty signing key, with the consequence above.
- **No real family data**: runs `packages/content/test/no-real-family-data.test.ts`.
- **Native project**: `expo prebuild --platform ios --no-install` in a temporary copy (the repo is untouched), then checks the generated Info.plist (microphone is the only usage string, no background modes, encryption flag, URL scheme), entitlements, and `PrivacyInfo.xcprivacy`. It cannot compile or sign: that is only proven by the first EAS build.
- It does **not** require Supabase URL or keys, a Sign in with Apple key or a pack key.

### App Review notes (the preflight prints these)
Sign in with Apple and Associated Domains (`applinks:earlyletters.com`) entitlements and the Apple sign-in module are in the build but dormant behind the off switch. If App Review asks: sign-in is not offered in v1.0. The `expo-dev-client` local-network permission string is stripped from Release builds by a build phase (present in the generated project; the stripped result is *unverified* until the first build is inspected). These matter for the store submission, not for internal TestFlight.

## What to check on a real phone (nobody has)
The team has never run this on a device. Before anyone else gets it, the founder or Ishita checks:
1. **Recording**: speak for a minute, finish, Review opens. (Needs the speech model, see above.) Finish at once; a very long take.
2. **Permissions**: the microphone alert shows our wording; deny it, see the calm card, type instead; allow it again from iOS Settings.
3. **Kill mid-record**: force-quit while recording, reopen: the launch sweep keeps the take and it plays.
4. **Backgrounding**: lock the phone and switch apps during a recording and during playback; a phone call or Siri during a recording.
5. **Playback**: letter player, Read together voice, autoplay, silent switch, headphones.
6. **Purchases in the sandbox** (needs step 5 in the table above): products load, buy, restore, Manage subscription, cancel; check the Plan screen after each. Sandbox behaviour and TestFlight subscription renewal timing: *unverified*.
7. **Notifications**: the priming sheet, the system alert, a reminder arriving, tapping it, turning it off.
8. **Dynamic Type** at the largest and the accessibility sizes, plus the in-app reading sizes, on Tonight, Review, the Book and the letter page.
9. **Dark mode**: Match this phone, Light, Dark; switch while the app is open.
10. **Export**: build the ZIP and open the share sheet; an empty book.
11. **Cold start** speed, the size of the install, offline use (airplane mode) of everything except Plus.
12. The first-run birthday and due-date pickers, the 305 day limit, twins.

## "What to test" text for TestFlight
Plain words. The limit on this field is *unverified*; this is short.
> This is the first test of Early Letters, and it is early. Everything stays on your phone: there are no accounts and no sync. Please try: opening the app for the first time, adding your child, speaking or typing a letter, looking at it in Review, keeping it, reading the Book, and Read together. Please also try it with the phone locked mid-recording, in dark mode, and with large text. The words from a recording may be missing or wrong in this version. Tell us anything that felt confusing, slow, or wrong, and what you were doing when it happened.

If a build goes out without the speech model, replace "speaking or typing a letter" with "typing a letter" and add: "Recording works, but the words will not appear yet."

## How testers send feedback today
Help in Settings opens an email to the support address (`hello@earlyletters.com`, from `packages/brand`) with a subject line. That is the only route. TestFlight's own feedback (screenshot or crash feedback inside the TestFlight app) also reaches App Store Connect (*unverified*: check it is enabled for this app). The in-app feedback form is later work and is not in this build (D-088: the v1.0 submission keeps "Data Not Collected" and uses the Help email row, with a content-free block of version, build and screen to be added to the email). Ask testers not to paste a child's name or a letter's words into feedback.

Crashes from testers appear in App Store Connect under TestFlight (*unverified*); no crash SDK is in the app by design.

## Known limitations (from the journey review)
From `docs/release/journey/INDEX.md` and its product critique on `origin/qa/journey-flows` (PR #83; a web run, so these are what the review could not see or found wanting, not a device test).
- **Never exercised on a device**: native permission alerts, real speech and level metering, audio playback, StoreKit (buy, restore, trial, manage), notifications (priming, schedule, delivery, tap), Export success and the share sheet, the speech language and storage screens, native pickers and alerts (Let it go, Hide this book), haptics, VoiceOver, Dynamic Type, interruptions and the launch sweep, real safe areas.
- **Speech model download is silent** (575 MB for English): no consent, Wi-Fi, progress or failure states, and a letter can sit on "waiting for its words" with no action.
- **Delete is immediate** on a saved letter, with Undo only until the person leaves the screen; no Recently deleted shelf (D-085, not built).
- **"Not much today" writes a sentence** that the Book shows (D-084, PR #92 open): against the constitution until merged.
- **A crashing screen is blank**, and a bad link shows Expo's default "Unmatched Route" page (PR #93 open).
- **The birthday defaults to today** at first run (PR #94 open).
- **Dead doors**: "I was invited" and the Family tab promise things that do not exist yet (D-087 hides the first and keeps the tab).
- **Wording**: "Lightly tidied" and "tidy" still appear on many screens (D-086, "Word for word").
- **Durability**: on-device only; Export is the only safety net and there is no new-phone story. The website says Plus "backs up every recording": that does not match this build.
- The journey review did not capture the real purchase screens (price, trial and renewal terms beside the buy button, Apple 3.1.2): look at them on the phone before any store submission.

## After the first build
- Each re-run bumps the build number automatically.
- Production later: a second App Store Connect record for `com.earlyletters.scribe`, the `production` profile, and `docs/ROADMAP.md`. The production id is permanent from the first upload to it. The production profile also has server features off for v1.0.
