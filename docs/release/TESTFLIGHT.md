# TestFlight: the alpha in two builds (option B, D-106)

Status: 15 Oct 2026. Owner: S20 (release). Replaces the 4 Oct "first on-device build" page.

D-106 (founder, 15 Oct 2026): option B ships as an alpha, a TestFlight build with server features on against the staging Supabase project, for the founder's family and invited friends, target **Thu 29 Oct 2026**. It comes in two builds:

| | Alpha build 1 | Alpha build 2 |
|---|---|---|
| `eas.json` profile | `testflight` | `preview` |
| Server features | **off**: no accounts, nothing leaves the phone | **on**: sign-in, sync and co-parent sharing against **staging** |
| Recording backup, status report | off (build flags `EXPO_PUBLIC_BACKUP`, `EXPO_PUBLIC_STATUS_REPORT`) | off (same) |
| Analytics | off (`EXPO_PUBLIC_ANALYTICS`) | off |
| App id | `com.earlyletters.scribe.preview` | `com.earlyletters.scribe.preview` (same App Store Connect record) |
| Who | anyone you invite | **the family only** until the R-17 gate passes (D-100, see "Who may have which build") |
| When | as soon as steps 1 to 3 are done | when steps 6 to 9 are done as well |
| Preflight | `npm run preflight:testflight -w @scribe/mobile` | `npm run preflight:alpha -w @scribe/mobile` |

**No build has been made and nothing has been uploaded.** Both need the founder's Apple Developer and Expo accounts. **Where builds run:** every build, submit and store action runs in GitHub Actions (`.github/workflows/testflight.yml`, from the Actions tab) or on your own computer, with secrets held in GitHub and EAS. Agent sandboxes cannot reach expo.dev, api.expo.dev or App Store Connect, so no agent ever builds, signs or uploads. Further release automation comes through `docs/release/AUTOMATION.md` (in review). Anything marked *unverified* is a fact about Apple, Expo or Supabase that has not been confirmed from a primary source here; check it on the screen before relying on it. Times are estimates of your hands-on time [A], plus waits that are not yours.

## The founder steps, in order

Each step names what it unblocks. The preflight prints the open ones by these names and numbers.

### For alpha build 1 (servers off)

**Step 1. Apple Developer Program enrolment (FT-01).** About 45 minutes, then Apple's identity check (often a day or two for an individual [A]; it can take longer). US $99 a year. Enrol as an individual with your two-factor Apple Account; when it says Active, accept the latest agreements.
*Unblocks:* every Apple step (2, 5, 8, 11). Nothing Apple-side can start before it, so do it first.

**Step 2. App Store Connect: the `.preview` App ID, the app record and testers (FT-07, FT-08).** About 45 minutes.
1. Certificates, Identifiers & Profiles > Identifiers: register `com.earlyletters.scribe.preview` with **Sign in with Apple** and **Associated Domains** ticked (EAS may do this at the first build when it manages credentials, *unverified*; ticking them yourself does no harm). Note your 10-character **Team ID** (Membership details): steps 8 and 10 need it.
2. App Store Connect > Apps > New App: iOS, bundle id `com.earlyletters.scribe.preview`, a name such as "Early Letters Preview" (testers see it in TestFlight), primary language English (U.S.), any SKU. The permanent production id `com.earlyletters.scribe` is not used by either alpha build.
3. Users and Access: add each internal tester (they need an Apple Account; give the least access the tester role allows, *unverified* role names). About 5 minutes each; they accept an email.
4. Optional, for Plus in the sandbox: the Paid Apps agreement (FT-06) and the two products `plus.monthly` and `plus.annual` **on this .preview record** (FT-09, about 1 hour). Without them the Plan screen cannot load products; everything else works.
5. For builds and uploads from GitHub Actions without a prompt: an **App Store Connect API key** (Users and Access > Integrations > App Store Connect API, role App Manager; the `.p8` downloads once; note the Key ID and Issuer ID), stored in EAS for this project, never in the repo or GitHub (*unverified* menu names; 15 minutes). Send the record's **Apple ID** (the number on App Information): S20 adds it as `submit.preview.ascAppId` and `submit.testflight.ascAppId` in `eas.json` (not a secret).
*Unblocks:* the first upload (step 5) and the TestFlight groups.

**Step 3. Expo account, the project id and `EXPO_TOKEN` (FT-17, BL-339).** About 20 minutes, then a one-line PR the same day.
1. An Expo account with two-factor. Create the project in the expo.dev dashboard (slug `scribe`), or run `npx eas-cli@latest init` in `apps/mobile` on your own computer; either shows the **project id**. `app.config.ts` is a dynamic config, so the CLI cannot write the id into it (*unverified*). Send the id and your Expo account name; S20 adds `extra.eas.projectId` and `owner` in a small PR. Neither is a secret.
2. An Expo access token (expo.dev > Account settings > Access tokens) as the GitHub **repository secret `EXPO_TOKEN`**. `.github/workflows/testflight.yml` reads it in its build step only and never prints it.
*Unblocks:* every EAS build (steps 5 and 11).

**Step 4. Words from speech: two pack signing keys and the R2 bucket `packs.earlyletters.app` (FT-16, D-097).** About 2.5 hours, plus DNS propagation (up to a day [A]). Optional for both builds, but without it no recording ever gets its words. `docs/ops/PACKS_HOSTING.md` does not exist; the steps are FT-16 in `docs/FOUNDER_TASKS.md` and `docs/ops/DOMAINS.md` section 6:
1. Cloudflare account with two-factor; add the `earlyletters.app` zone (Free plan), recreate its records from DOMAINS section 4, switch its nameservers at Porkbun, DNSSEC on. `earlyletters.com` stays at Porkbun.
2. R2 bucket `early-letters-packs`, public only through the custom domain `packs.earlyletters.app` (every `eas.json` profile already points the app there).
3. `npx tsx scripts/packs/keygen.ts`, twice (two keys, R2 AR-28). The secret halves go only in your password manager. Send the two **public** lines for `packages/api/src/keys.ts`; they must be in the build.
4. After that PR merges: `npx tsx scripts/packs/publish.ts all` and the upload commands it prints.
*Unblocks:* the speech model and language packs, and every signed remote document (config, kill switches, content). Without it: typing, the Book, Read together and export work; recordings are kept safely but stay on "Writing down what you said".

**Step 5. Build 1: preflight, build, submit, testers.** About 30 minutes of yours; the EAS queue and Apple's processing add an hour or more (*unverified*).
- **From GitHub (the usual way):** Actions > testflight > Run workflow, branch `develop`, profile `testflight`, upload ticked. It runs typecheck, every test and `preflight:testflight` (read its log: WARN lines and the founder steps at the end), then builds on EAS and submits.
- **Signing, the first time:** the workflow runs `--non-interactive`, so the iOS distribution certificate and profile for `.preview` must already be in EAS. Either let EAS create them from the API key of step 2.5 (*unverified* in non-interactive mode), or run `npx eas-cli@latest credentials --platform ios` once on your own computer (10 minutes). The automation plan may add a one-off credentials job instead.
- **From your own computer** (same result): `npm ci`, `npm run preflight:testflight -w @scribe/mobile`, then in `apps/mobile`: `npx eas-cli@latest build --platform ios --profile testflight` and `npx eas-cli@latest submit --platform ios --profile testflight --latest`.

The build number is the EAS remote counter; the version comes from `app.config.ts`. Then add the build to a TestFlight group (below).
*Unblocks:* testers on build 1.

### For alpha build 2 (servers on, staging)

**Step 6. Supabase staging project and its schema (FT-10).** About 1.5 hours.
1. `docs/ops/DEPLOY.md` founder steps 1 and 2: the "Early Letters" organisation (two-factor), the project `scribe-staging` in a US region, the session pooler URL as the GitHub Environment secret `SUPABASE_DB_URL_STAGING`.
2. The schema reaches staging through CI only (D-041). Today `.github/workflows/deploy-db.yml` applies migrations to staging only from `main`, and `main` does not have `develop`'s migrations. **This blocks build 2.** The change "staging from `develop`, by manual run with the `approve-migration` label" (PRD V2 08 section 5.2, P2; owner S20, a fenced founder merge) is assigned through `docs/release/AUTOMATION.md`; it must merge by **Thu 22 Oct** for build 2 on Thu 29 Oct. When it merges, allow `develop` on the `staging` Environment and run it. The preflight lists step 6 as MISSING until `deploy-db.yml` accepts `develop`. FT-10 describes applying by hand from `supabase/APPLY.md`; that predates D-041's CI rule, so use it only as your own decision, and record what was applied.
3. The per-project settings from `supabase/APPLY.md`: step 6 (the consent pepper, a new random value, kept in the password manager), step 7 (purge cron), step 8 (publish the beta policy versions `terms` and `sensitive-data`; until they exist every new account stops at "We couldn't finish setting up your account"), step 15. Spend cap on.
4. **Staging now holds real family letters.** Treat it like production for access and deletion while the alpha runs (`docs/ops/ENVIRONMENTS.md`): only you have dashboard access, no load tests, no fixture resets, no restore drills against it.
*Unblocks:* everything in build 2 that talks to a server.

**Step 7. Supabase Auth on staging, with Resend SMTP for sign-in email (FT-12, FT-13).** About 2 hours. Follow `docs/ops/AUTH_SETUP.md` sections 1, 4, 5.1 and 6 on `scribe-staging`, with these alpha notes:
- Resend (AUTH_SETUP 4.1): click and open tracking **off**; a sending-only key `supabase-auth-smtp` for Auth SMTP (4.2); email rate limit about 100 an hour (4.3).
- Email provider (4.4): the **Email OTP length** must equal the app's `EXPO_PUBLIC_EMAIL_OTP_LENGTH` (6 when unset), or every typed code is refused. The length itself is **your open decision** (FT-04 item 8): 6 in the app and AUTH_SETUP 4.4 today, 8 in the security review and PRD V2 A-REQ-018 Rev (WP-F02-14). Pick one and set Supabase and, if 8, the EAS variable in step 9 together. Set **Email OTP expiration to 900 seconds**: the templates in `supabase/templates/` tell people the link and code last 15 minutes (`config.toml.snippet`); AUTH_SETUP 4.4's 3600 predates them.
- URL configuration (5.1): Site URL `https://earlyletters.com`; redirect URLs `https://earlyletters.com/auth/callback`, `https://earlyletters.com/auth/confirm` and `scribe://auth/callback`.
- Templates (6): paste `supabase/templates/magic_link.html` and `confirmation.html` with the subjects in `supabase/templates/config.toml.snippet`. Their link is `{{ .SiteURL }}/auth/callback#token_hash=...`, the path the app on `develop` reads; the website serves the same page at `/auth/callback` and `/auth/confirm` (step 10).
- Anonymous sign-ins off, confirm email on, sign-ups on.
*Unblocks:* email sign-in and the confirm-your-email message in build 2.

**Step 8. Sign in with Apple: Team ID, key and the Supabase Apple provider (FT-07, FT-12).** About 45 minutes. AUTH_SETUP 2.1, 2.2, 2.4, 2.5 and 2.6:
- The Sign in with Apple key (`.p8`, downloadable **once**) with its Key ID and your Team ID in the password manager, never in the repo. Native sign-in in the alpha does not use it yet; the `apple-token` function (BL-330, part of the R-17 gate) and account deletion's token revocation will.
- Email relay for Hide My Email: domain `earlyletters.com`, address `hello@earlyletters.com`.
- Supabase > Authentication > Providers > Apple: enabled, **Client IDs** include `com.earlyletters.scribe.preview` (AUTH_SETUP 2.6 lists all three ids). No secret for native sign-in.
*Unblocks:* Sign in with Apple in build 2.

**Step 9. EAS environment variables for the `preview` environment.** About 10 minutes. Both alpha profiles build in the EAS environment `preview`; the staging values live there and **never in `eas.json`, `app.config.ts` or a committed `.env` file** (the config tests and the preflight fail on them).

| Name | Value | Visibility |
|---|---|---|
| `EXPO_PUBLIC_SUPABASE_URL` | the staging Project URL, `https://<ref>.supabase.co` | Sensitive |
| `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | the staging **publishable** (anon) key, `sb_publishable_...` or the legacy anon key. **Never** the secret or `service_role` key | Sensitive |
| `EXPO_PUBLIC_EMAIL_OTP_LENGTH` | only if step 7's OTP length is not 6 | Plain text |

Expo dashboard > the project > Environment variables > Add, environment **preview** (or `npx eas-cli@latest env:create`, flags *unverified*). Both values are public by design (row-level security is the authority), and every `EXPO_PUBLIC_` value is inlined into the app, so "Sensitive" only keeps them out of logs. To check them: `npx eas-cli@latest env:list --environment preview`, or export them in your shell and run `npm run preflight:alpha -w @scribe/mobile`: it checks their shape and fails on a secret key. Build 1 shares this environment and so carries the same two public values, but with the switch off it never constructs a Supabase client (`apps/mobile/test/capabilities.test.ts`, "boot with server features off").
*Unblocks:* build 2 reaching staging. Without them the switch is on but the sign-in sheet says sign-in is not available in this build.

**Step 10. Website: the AASA file and `/auth/confirm` live.** About 15 minutes, then up to a day for Apple's CDN (*unverified*). In the Vercel project, Production environment: `APPLE_TEAM_ID` (step 2) and `IOS_BUNDLE_ID=com.earlyletters.scribe` (the production id; the site adds `.preview` itself and refuses a suffixed id). Merge the website PR `chore/web-auth-wiring` into `main` and let it deploy. Check:
```bash
curl -sI https://earlyletters.com/.well-known/apple-app-site-association   # 200, application/json, no redirect
curl -s https://app-site-association.cdn-apple.com/a/v1/earlyletters.com  # what Apple has fetched
```
*Unblocks:* sign-in links and invite links opening the app from Mail and Messages; the calm fallback page when a link opens in a browser. Without it the links open the website, and the code from the same email still signs the person in.

**Step 11. Build 2: preflight, build, submit, the family group only.** About 20 minutes of yours, plus the queue. Actions > testflight > Run workflow, branch `develop`, profile `preview`, upload ticked (it runs `preflight:alpha`). From your own computer instead: `npm run preflight:alpha -w @scribe/mobile`, then `npx eas-cli@latest build --platform ios --profile preview` and `npx eas-cli@latest submit --platform ios --profile preview --latest` in `apps/mobile`.
Add the build to the **Family** internal group only (below).
*Unblocks:* the alpha with servers.

**Step 12. Staging function secrets: the purge worker and the Resend key (FT-11).** About 1 hour; do it before anyone tries Delete account in build 2. A second sending-only Resend key as the staging secret `RESEND_API_KEY` (not the SMTP key), the purge worker deployed and scheduled (`docs/ops/SECURITY.md` 1.1, `docs/ops/runbooks/purge-failing.md`). The status and reminder emails (D-080) will use the same function key when they ship; build 2 sends none (`EXPO_PUBLIC_STATUS_REPORT` is off).
*Unblocks:* account deletion in build 2; later, status emails.

### What each build needs

| | Needs | Optional |
|---|---|---|
| Build 1 | Steps 1, 2 (with 2.5 for Actions), 3, 5, and iOS credentials in EAS | Step 4 (words from speech); Plus products (step 2.4) |
| Build 2 | Everything build 1 needs, plus steps 6, 7, 8, 9, 11, and the "staging from `develop`" change for step 6 | Step 10 (links open the app; codes work without it), step 12 (before Delete account is tried), step 4, Plus products |

Your hands-on time [A]: about 2.5 hours for build 1 (without step 4) and about 7 more for build 2 (with steps 10 and 12), plus Apple's identity check and DNS waits. Started by Mon 19 Oct, both builds fit before Thu 29 Oct if Apple enrolment is Active by Fri 23 Oct (T04).

## Who may have which build, and the internal-tester flow

D-100's gate: nobody outside the family signs in before the R-17 security gate passes (BL-347, BL-330, BL-331 with BL-332, `peek_invite` with BL-334, BL-322 and BL-349 merged and reviewed together; PRD V2 09 R-17, target T16, Fri 13 Nov). So:
- **Family:** build 2 (and build 1 if useful). Internal testers, in an internal group "Family".
- **Legal pages:** D-100 also asks that legal pages describing a server product are live before sign-in. The pages on `main` were written for an on-device v1.0 (WP-F21-08 with counsel). Whether the family alpha needs them first is your call; for anyone outside the family it is required.
- **Invites:** `/i/<token>` and `/j` have no page on the website yet (WP-F11-11). Between two phones that both have build 2, the link opens the app; on a phone without the app it shows the site's 404, so install from TestFlight first.
- **Invited friends:** build 1 only until the gate passes. Either an internal group "Friends" with **automatic distribution off**, adding build 1 by hand, or an external group (which needs Beta App Review of the build first, about a day, *unverified*, and gives a public link). Both builds share one App Store Connect record, so never let a group take new builds automatically.

The flow for one tester:
1. Users and Access: add them (step 2.3). They accept the email.
2. TestFlight > Internal Testing: add them to "Family" or "Friends"; add the build to that group.
3. They install the TestFlight app, open the invitation, and install. TestFlight builds expire after 90 days (*unverified*).
4. Feedback: the Help row in Settings (an email to the support address) and TestFlight's screenshot feedback. Ask testers never to paste a child's name or a letter's words into feedback.

## The flip after the R-17 gate (one line)

When the gate passes and you approve it, the `testflight` profile turns on in **one line** of `apps/mobile/eas.json`:
```diff
     "testflight": {
       ...
-        "EXPO_PUBLIC_SERVER_FEATURES": "off",
+        "EXPO_PUBLIC_SERVER_FEATURES": "on",
```
`apps/mobile/test/config.test.ts` holds `testflight` equal to `preview` in everything but that line, and its tests pass before and after the flip (one of them applies the flip to a copy and checks it), so the flip PR is that one line and nothing else. It is a founder merge. After it, friends may get servers-on builds. `production` stays off until the store submission is re-planned (D-106).

## If something goes wrong (the kill path)

The switch is the kill path (D-100): a build made with `EXPO_PUBLIC_SERVER_FEATURES=off` constructs no Supabase client, starts no sync and offers no sign-in (`apps/mobile/src/lib/capabilities.ts` and its tests). In order of speed:
1. **Stop the server side now.** If family data may be exposed, **pause the staging project first**: it is the only immediate stop, because a signed-in phone's access token stays valid until it expires (AUTH_SETUP 1.3 sets 900 seconds; check the project's value). Otherwise: Authentication > turn off "Allow new users to sign up", and sign the users out (Authentication > Users) if sessions must end (menu names *unverified*). Letters already on phones stay on the phones (local first); sync waits.
2. **Rotate anything that leaked.** If a secret or `service_role` key was ever in the EAS environment, a build or a log: rotate it in Supabase (Project Settings > API Keys) and delete it from EAS. The publishable key is public by design and needs no rotation.
3. **Stop the build.** App Store Connect > TestFlight > the build > Expire build: no new installs, and installed copies stop opening (*unverified*).
4. **Ship a servers-off build** to the family: a profile with the switch off (`testflight` before the flip; after it, a one-line revert of the flip), added to "Family".
5. **Data and people:** follow `docs/ops/runbooks/suspected-data-leak.md` for the first hour and `docs/ops/runbooks/incident-notification.md` for who is told and when; staging holds the family's real letters during the alpha.
6. Remote kill switches do not help in the alpha: `sync` and `invites` have no consumers yet (WP-F19-12s, -12f), and no signed remote config reaches a phone before step 4's keys are in a build. Backup and the status report are not in either build (build flags off), so there is nothing to pause.

## What testers get

Both builds, from `develop`: first run (the 18+ question, the promise, a child, the signature, the spoken language, asked before the speech download), Tonight (a prompt, Speak or Type, Not much today), speaking a letter with Review and Word for word, typing a letter with drafts, the Book, the letter page, Recently deleted, Read together, Settings (children, reminders, appearance, recordings, language, storage, export, helplines, licences, Help), and the membership rule (2 free letters, then Plus, D-082) with StoreKit 2 purchases if step 2.4 is done.

Build 1 only: no accounts, no sign-in, no sync, no co-parent sharing (the Family tab shows coming soon), no delete-account.

Build 2 adds: Sign in with Apple and email sign-in (link or code) on Welcome and at the Keep the book moment, the consent sheets, sync of letters to staging, co-parent invite and join through the Family tab, Account and Delete account (needs step 12). Recordings are not uploaded (backup is off), no Google sign-in, no analytics in either build.

## What to check on a real phone (nobody has)

Before anyone else gets a build, the founder checks on one iPhone: recording (a minute, finish at once, a long take), the microphone alert and denying it, force-quit mid-record and reopen, locking and switching apps during recording and playback, playback (silent switch, headphones), sandbox purchases if set up, notifications, Dynamic Type at the largest sizes, dark mode, export and the share sheet, cold start and airplane mode.

Build 2 adds `docs/ops/AUTH_SETUP.md` section 11 items 1, 3, 4, 5 and 6: Apple sign-in and the two consent sheets; email link from Mail, the code typed by hand, an expired link, the link opened on a laptop (the page shows the code instruction and signs nothing in); the laptop page's Open button on the phone opens the code screen; an invite between two phones; offline cold start signed in.

## "What to test" text for TestFlight

Build 1:
> This is an early test, and everything stays on your phone: there are no accounts and no sync. Please try opening the app for the first time, adding your child, speaking or typing a letter, looking at it in Review, keeping it, reading the Book, and Read together. Try it with the phone locked mid-recording, in dark mode, and with large text. Tell us anything that felt confusing, slow, or wrong, and what you were doing when it happened.

Build 2:
> This test adds signing in and sharing a book with the other parent. Please sign in with Apple or your email, keep a few letters, and check they are there after you sign out and back in on this phone. If you are two parents, invite the other one from the Family tab and write one letter each. Tell us anything that felt confusing, slow, or wrong, and what you were doing when it happened.

If a build goes out without step 4, add: "Recording works, but the words will not appear yet."

## What the preflight checks

`npm run preflight:testflight -w @scribe/mobile` (build 1) and `npm run preflight:alpha -w @scribe/mobile` (build 2); add `-- --skip-prebuild` to skip the native project (about a minute). It never builds, never goes online and needs no secret. FAIL stops (exit 1); WARN does not.
- **eas.json:** the profile is a store build with `EXPO_PUBLIC_APP_ENV=preview`, EAS-owned build numbers and a submit profile; server features `off` in `testflight` (a WARN if the R-17 flip is in), `on` in `preview`, never on in `production`; the two build flags written as `off`; no Supabase URL or key and nothing named like a secret in the file.
- **Config:** the `.preview` bundle id, URL scheme, microphone string, no background audio, no other permission, privacy manifest, export compliance, version, icons, and `extra` recording the switch and the build flags.
- **Build 2 only:** if you export `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY` in the shell, their shape (and a FAIL for a secret or `service_role` key); the email code length to match in Supabase; a WARN that the privacy manifest declares no collected data although the build syncs (fine for internal TestFlight, *unverified*; BL-349 and WP-F21-09 before any external group).
- **Packs:** the docs base, the signing key and a published manifest (step 4).
- **No real family data** in the tree; the native project generates in a temporary copy.
- **At the end:** the founder steps above that are missing, or that it cannot see, by number and name.
