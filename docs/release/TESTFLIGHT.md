# TestFlight: the alpha in two builds (option B, D-106)

Status: 24 Oct 2026. Owner: S20 (release). Replaces the 4 Oct "first on-device build" page.

D-106 (founder, 15 Oct 2026): option B ships as an alpha, a TestFlight build with server features on against the staging Supabase project, for the founder's family and invited friends, target **Thu 29 Oct 2026** at the time. The dates now planned are proposed until the founder confirms (`docs/release/AUTOMATION.md`, #267): build 1 Mon 26 Oct and go/no-go Thu 5 Nov, proposed by the coordinator; build 2 at the freeze, Tue 3 Nov 5:00 AM PT (D-089). It comes in two builds:

| | Alpha build 1 | Alpha build 2 |
|---|---|---|
| `eas.json` profile | `testflight` | `preview` |
| Server features | **off**: no accounts, nothing leaves the phone | **on**: sign-in, sync and co-parent sharing against **staging** |
| Recording backup, status report | off (build flags `EXPO_PUBLIC_BACKUP`, `EXPO_PUBLIC_STATUS_REPORT`) | off (same) |
| Analytics | off (`EXPO_PUBLIC_ANALYTICS`) | off |
| App id | `com.earlyletters.scribe.preview` | `com.earlyletters.scribe.preview` (same App Store Connect record) |
| Who | anyone you invite | **the family only** until the R-17 gate passes (D-100, see "Who may have which build") |
| When | as soon as steps 1 to 4 are done (step 4 is the signed pack, D-115) | when steps 6 to 9 are done as well |
| Preflight | `npm run preflight:testflight -w @scribe/mobile` | `npm run preflight:alpha -w @scribe/mobile` |
| Cut from | a commit that includes #247 (the picker offers English only) and #260 (a language stored before it waits for its language, and the person is told) | the same |

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
4. App Store Connect > the app > App Information: copy the numeric **Apple ID** of this record and send it. It is not a secret; S20 puts it in `eas.json` as `submit.testflight.ios.ascAppId` and `submit.preview.ios.ascAppId`. `eas submit` from your computer asks for the app instead, but the GitHub workflow's non-interactive `--auto-submit` needs it, plus an App Store Connect API key stored on EAS (*unverified*; the preflight WARNs until it is in).
5. Optional, for Plus in the sandbox: the Paid Apps agreement (FT-06) and the two products `plus.monthly` and `plus.annual` **on this .preview record** (FT-09, about 1 hour). Without them the Plan screen cannot load products; everything else works.
6. For builds and uploads from GitHub Actions without a prompt: an **App Store Connect API key** (Users and Access > Integrations > App Store Connect API, role App Manager; the `.p8` downloads once; note the Key ID and Issuer ID), stored in EAS for this project, never in the repo or GitHub (*unverified* menu names; 15 minutes).
*Unblocks:* the first upload (step 5) and the TestFlight groups.

**Step 3. Expo account, the project id and `EXPO_TOKEN` (FT-17, BL-339).** About 20 minutes, then a one-line PR the same day.
1. An Expo account with two-factor. Create the project in the expo.dev dashboard (slug `scribe`), or run `npx eas-cli@latest init` in `apps/mobile` on your own computer; either shows the **project id**. `app.config.ts` is a dynamic config, so the CLI cannot write the id into it, and `eas build` stops until the id is there, interactive or not (eas-cli 24.10.0). Send the id and your Expo account name; S20 adds `extra.eas.projectId` and `owner` in a small PR. Neither is a secret.
2. An access token for an Expo **robot user** with the Developer role (`docs/security/SECRETS_REVIEW.md` section 1; never a personal token) as the secret `EXPO_TOKEN` of the GitHub **Environment `testflight`**. Create the environment first, with branch `develop` only: FT-20's script `scripts/release/github-settings.ts` does it (`docs/FOUNDER_TASKS.md` FT-20), or by hand with you as required reviewer. `.github/workflows/testflight.yml` runs its build job in that environment (RA-20-06a), reads the token in its build step only and never prints it; with a reviewer on `testflight`, each run waits for that approval before it builds. If a repository secret `EXPO_TOKEN` exists from before, keep it until one run with the environment secret is green, then delete it (AF-07, AF-22).
*Unblocks:* every EAS build (steps 5 and 11).

**Step 4. Words from speech: two pack signing keys and the R2 bucket `packs.earlyletters.app` (FT-16, D-097).** About 2.5 hours, plus DNS propagation (up to a day [A]). Required for build 1, and so for build 2: D-115 makes the signed English pack release a build 1 prerequisite, because the app loads its speech model only from the signed manifest, and the preflight FAILs both builds until the keys and a published manifest are in. The runbook is **[docs/ops/PACKS_HOSTING.md](../ops/PACKS_HOSTING.md)** (background: FT-16 in `docs/FOUNDER_TASKS.md` and `docs/ops/DOMAINS.md` section 6):
1. Cloudflare account with two-factor; add the `earlyletters.app` zone (Free plan), recreate its records from DOMAINS section 4, switch its nameservers at Porkbun, DNSSEC on. `earlyletters.com` stays at Porkbun.
2. R2 bucket `early-letters-packs`, public only through the custom domain `packs.earlyletters.app`. Every `eas.json` profile already sets `EXPO_PUBLIC_DOCS_BASE_URL` to `https://packs.earlyletters.app` (D-097): an `https://` origin with no path (`apps/mobile/src/lib/remote/base.logic.ts`), plain text and not a secret; v1.0 never falls back to Supabase. Until the bucket and domain exist, the fetch fails quietly and the app uses its bundled defaults.
3. `node scripts/packs/keygen.mjs`, then `node scripts/packs/keygen.mjs --backup`, in your own terminal: a primary and a cold backup with the ids `el-YYYY-MM` and `el-YYYY-MM-backup` (R2 AR-28). It writes nothing to disk and refuses to print to a pipe or CI. The secret halves go only in your password manager (the backup's also offline, apart from the primary). Both **public** lines go in `packages/api/src/keys.ts` (`TRUSTED_SIGNING_KEYS`, empty today, so the app fails closed and installs no pack); they must be merged before `eas build`, because the keys are compiled into the app.
4. `npx tsx scripts/packs/publish.ts release`, then `upload` (packs first, manifest last, nothing overwritten or deleted) and `verify` (checks the live host the way a phone does), then commit `keys.ts` and the published versions in one PR (runbook steps 6 to 9). The PR with `keys.ts` and the published versions must be merged before the build, because the preflight FAILs without them (D-115). Only the upload can go before or after the build: the app fetches it after its first frame.
*Without this, no words.* Speech runs on the phone, but the speech model (about 575 MB) is a downloaded pack, and it installs only from a **signed pack manifest**, which needs the host, a public key and a published manifest. Missing any of them: recordings are kept safely on the phone, but words are never written down (Review stays on "Writing down what you said", Book cards say words are waiting) and no language pack downloads. Typing, the Book, Read together and export work as before. The preflight FAILs a build without the key or the published manifest (D-115) and WARNs when the docs base is not set; a build without them tests typing, the Book, reading and layout, not the spoken path.
*Unblocks:* the speech model and language packs, and every signed remote document (config, kill switches, content).

**Step 5. Build 1: preflight, build, submit, testers.** About 30 minutes of yours; the EAS queue and Apple's processing add an hour or more (*unverified*).
- **From GitHub, once `develop` is the default branch (AF-05, founder):** Actions > testflight > Run workflow, branch `develop`, profile `testflight`, upload ticked. It runs typecheck, every test and `preflight:testflight` (read its log: WARN lines and the founder steps at the end), then builds on EAS and submits. Until AF-05 the button does not exist: GitHub offers Run workflow only for a workflow on the default branch, which is `main`, and `main` has no `testflight.yml` (`docs/release/AUTOMATION.md` section 0.1 item 3). So build 1 runs from your own computer (below).
- **Signing, the first time:** the workflow runs `--non-interactive`, so the iOS distribution certificate and profile for `.preview` must already be in EAS. Either let EAS create them from the API key of step 2.6 (*unverified* in non-interactive mode), or run `npx eas-cli@24.10.0 credentials --platform ios` once in `apps/mobile` on your own computer (10 minutes): profile `testflight`, then "Build Credentials: Manage everything needed to build your project", then "All: Set up all the required credentials to build your project", and never "Push Notifications" (eas-cli 24.10.0 `build/credentials/manager/IosActions.js`). The automation plan may add a one-off credentials job instead.
- **From your own computer** (the path for build 1 until AF-05; same result): at the repo root `git switch develop && git pull` (step 4's runbook leaves you on its own branch), then `npm ci`, `npm run preflight:testflight -w @scribe/mobile`, then in `apps/mobile`: `npx eas-cli@24.10.0 build --platform ios --profile testflight` and `npx eas-cli@24.10.0 submit --platform ios --profile testflight --latest` (the version `testflight.yml` pins as `EAS_CLI_VERSION`, so both paths build with one CLI).
- **If `eas build` asks to install expo-updates, answer no.** The profiles set `channel`, but expo-updates is not installed and over-the-air updates are not planned for the alpha (`EXPO_PUBLIC_` values are inlined at build time, `apps/mobile/src/lib/capabilities.ts`).
- **If `eas build` asks "Would you like to set up Push Notifications for your project?", answer No** (plain No: "No, don't ask again" edits `eas.json` on your computer). `eas.json` sets `cli.promptToConfigurePushNotifications: false`, so eas-cli 24.10.0 should not ask at all. The app uses no remote push and must have no push key (`docs/ops/RELEASE.md` section 4).
- **The other questions on the first build, and the answers:** the Expo login, if you used the dashboard in step 3; "Do you want to log in to your Apple account?" yes, then your Apple ID and the two-factor code (`build/credentials/context.js`); "Generate a new Apple Distribution Certificate?" and "Generate a new Apple Provisioning Profile?" yes (`build/credentials/utils/promptForCredentials.js`; files in eas-cli 24.10.0).
- **If `eas submit` asks "Generate a new App Store Connect API Key?", answer yes, then at "Select role for the generated API key:" choose APP_MANAGER, not "ADMIN (default)", which is listed first** (eas-cli 24.10.0 `build/credentials/ios/actions/AscApiKeyUtils.js`). App Manager is the role this repo gives that key (step 2.6, `docs/release/AUTOMATION.md` AF-10, ADR 0026). It asks unless the key of step 2.6 is already stored in EAS.
- **Before the first `eas submit`, create the "Family" internal group with automatic distribution off** (TestFlight > Internal Testing, see "Who may have which build"). If the app has no TestFlight group, the first submit creates "Team (Expo)", an internal group with access to every new build, and adds every Admin user to it (eas-cli 24.10.0 `build/credentials/ios/appstore/ensureTestFlightGroup.js`). With no `ascAppId` in the submit profile that runs whatever flag you pass (`build/submit/ios/AppProduce.js`). Such a group would later take build 2 by itself, which this page never allows. If "Team (Expo)" appears anyway, delete it in App Store Connect: eas-cli cannot turn that setting off on an existing group. Whether App Store Connect lets you create a group before the first build is *unverified* (the reviewer could not check it): try it, and if it is not possible, delete "Team (Expo)" right after the first submit.

The build number is the EAS remote counter; the version comes from `app.config.ts`. Then add the build to a TestFlight group (below).
*Unblocks:* testers on build 1.

### For alpha build 2 (servers on, staging)

**Step 6. Supabase staging project and its schema (FT-10).** About 1.5 hours.
1. `docs/ops/DEPLOY.md` founder step 1: the "Early Letters" organisation (two-factor), the project `scribe-staging` in a US region, and its session pooler URL in your password manager.
2. The GitHub Environment `staging`, with its rules before any secret (SR-11). FT-20's script sets it (`docs/FOUNDER_TASKS.md` FT-20 steps 1 to 3; `scripts/release/github-settings.ts`, merged in #236). From your own computer, signed in to `gh` as yourself, in a checkout at `develop`'s head: `npm ci`, then `npx tsx scripts/release/github-settings.ts --approver <login>` with the approver account's login. That is a dry run that prints every call; read it and settle the `release/ios-v1.0` question FT-20 raises, then run the same command with `--apply`, then with `--verify`, which must print "Settings match the spec" (FT-20 step 3 says what it may flag first). It gives `staging` the approver as its only reviewer and branch `develop` only, and sets the other environments, branch protection and the rulesets too (FT-20 lists them). The script needs the approver account (ADR 0026 decision 1); until you accept that, set `staging` by hand as DEPLOY.md founder step 2 says (branch `develop` only, you as required reviewer). Only then add the environment secrets: `SUPABASE_DB_URL_STAGING` (the session pooler URL) and, for the content-free smoke that ends each deploy, `SUPABASE_STAGING_URL`, `SUPABASE_STAGING_PUBLISHABLE_KEY` and `SUPABASE_STAGING_PROJECT_REF` (DEPLOY.md "The content-free smoke").
3. The schema reaches staging through CI only (D-041), and **this blocks build 2**. `.github/workflows/deploy-db.yml` deploys staging from `develop` only (RA-20-04, #205); a push to `main` deploys nothing to a database. A push to `develop` that changes `supabase/migrations/**` waits for the `staging` reviewer, then applies `develop`'s tip: dry run, push, then the smoke. The migrations already on `develop` need one catch-up run: Actions > Deploy database > Run workflow, branch `develop` (it appears once the workflow is on the default branch, AF-05; any other ref fails at once), or re-run the latest push run that changed migrations (DEPLOY.md "Functions after migrations (RA-20-04)"). Approve it, then open a PR that records the files its summary lists (DEPLOY.md "After a deploy"). The first smoke is red until item 4's settings are in; that is expected (DEPLOY.md). The preflight lists step 6 as a check to confirm. FT-10 describes applying by hand from `supabase/APPLY.md`; that predates D-041's CI rule, so use it only as your own decision, and record what was applied.
4. The per-project settings from `supabase/APPLY.md`: step 6 (the consent pepper, a new random value, kept in the password manager), step 7 (purge cron), step 8 (publish the beta policy versions `terms` and `sensitive-data`; until they exist every new account stops at "We couldn't finish setting up your account"), step 15. Spend cap on.
5. **Staging now holds real family letters.** Treat it like production for access and deletion while the alpha runs (`docs/release/ENVIRONMENTS.md`): only you have dashboard access, no load tests, no fixture resets, no restore drills against it.
*Unblocks:* everything in build 2 that talks to a server.

**Step 7. Supabase Auth on staging, with Resend SMTP for sign-in email (FT-12, FT-13).** About 2 hours. Follow `docs/ops/AUTH_SETUP.md` sections 1, 4, 5.1 and 6 on `scribe-staging`, with these alpha notes:
- Resend (AUTH_SETUP 4.1): click and open tracking **off**; a sending-only key `supabase-auth-smtp` for Auth SMTP (4.2); email rate limit about 100 an hour (4.3).
- Email provider (4.4): the **Email OTP length** must equal the app's `EXPO_PUBLIC_EMAIL_OTP_LENGTH` (6 when unset), or every typed code is refused. Set **Email OTP expiration to 900 seconds**: the templates in `supabase/templates/` tell people the link and code last 15 minutes (`config.toml.snippet`), as PRD V2 A-REQ-018 Rev asks.
- **Your call, open (FOUNDER_TASKS Q item 8, PRD V2 F02 Q2, WP-F02-14):** A-REQ-018 Rev asks for an **8-digit** code; the app and AUTH_SETUP default to 6. For 8, set the length to 8 here **and** `EXPO_PUBLIC_EMAIL_OTP_LENGTH=8` in the EAS `preview` environment (step 9) before build 2; the two must match. Either is fine for the family alpha; decide before anyone outside the family signs in.
- AUTH_SETUP 4.4 (3600 seconds) and 5.1 ("exactly these two" redirect URLs) predate PRD V2; for staging follow this page. Updating AUTH_SETUP is a request to S01, its owner.
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

Expo dashboard > the project > Environment variables > Add, environment **preview** (or, in `apps/mobile`, `npx eas-cli@24.10.0 env:create --environment preview --name EXPO_PUBLIC_SUPABASE_URL --value <url> --visibility sensitive`). Both values are public by design (row-level security is the authority), and every `EXPO_PUBLIC_` value is inlined into the app, so "Sensitive" only keeps them out of logs. To check them: `npx eas-cli@24.10.0 env:list --environment preview --include-sensitive` in `apps/mobile` (it needs the project id, so after step 3's PR; without `--include-sensitive` it shows the names only, and Sensitive values as `*****`), or export them in your shell and run `npm run preflight:alpha -w @scribe/mobile`: it checks their shape and fails on a secret key. Build 1 shares this environment and so carries the same two public values, but with the switch off it never constructs a Supabase client (`apps/mobile/test/capabilities.test.ts`, "boot with server features off").
**Never add `EXPO_PUBLIC_E2E` here, or in any EAS environment a store profile uses.** It turns on the e2e test seams, which belong only to the `e2e` simulator profile. `app.config.ts` refuses any EAS build of another profile that carries it, and the preflight fails if your shell has it set (B-9, `apps/mobile/e2e/TESTID_REQUESTS.md` section 4).
*Unblocks:* build 2 reaching staging. Without them the switch is on but the sign-in sheet says sign-in is not available in this build.

**Step 10. Website: the AASA file and `/auth/confirm` live.** About 15 minutes, then up to a day for Apple's CDN (*unverified*). In the Vercel project, Production environment: `APPLE_TEAM_ID` (step 2) and `IOS_BUNDLE_ID=com.earlyletters.scribe` (the production id; the site adds `.preview` itself and refuses a suffixed id). The website PR `chore/web-auth-wiring` is merged into `main` (done: #144, 23 Oct); confirm it has deployed. Check:
```bash
curl -sI https://earlyletters.com/.well-known/apple-app-site-association   # 200, application/json, no redirect
curl -s https://app-site-association.cdn-apple.com/a/v1/earlyletters.com  # what Apple has fetched
```
*Unblocks:* sign-in links and invite links opening the app from Mail and Messages; the calm fallback page when a link opens in a browser. Without it the links open the website, and the code from the same email still signs the person in.

**Step 11. Build 2: preflight, build, submit, the family group only.** About 20 minutes of yours, plus the queue. Once `develop` is the default branch (AF-05): Actions > testflight > Run workflow, branch `develop`, profile `preview`, upload ticked (it runs `preflight:alpha`). Until then, from your own computer, with the same answers as step 5 (no to expo-updates, No to Push Notifications, APP_MANAGER if `eas submit` asks for an API key role): `npm run preflight:alpha -w @scribe/mobile`, then `npx eas-cli@24.10.0 build --platform ios --profile preview` and `npx eas-cli@24.10.0 submit --platform ios --profile preview --latest` in `apps/mobile`.
Add the build to the **Family** internal group only (below).
*Unblocks:* the alpha with servers.

**Step 12. Staging function secrets: the purge worker and the Resend key (FT-11).** About 1 hour; do it before anyone tries Delete account in build 2. A second sending-only Resend key as the staging secret `RESEND_API_KEY` (not the SMTP key), the purge worker deployed and scheduled (`docs/ops/SECURITY.md` 1.1, `docs/ops/runbooks/purge-failing.md`). The status and reminder emails (D-080) will use the same function key when they ship; build 2 sends none (`EXPO_PUBLIC_STATUS_REPORT` is off).
*Unblocks:* account deletion in build 2; later, status emails.

### What each build needs

| | Needs | Optional |
|---|---|---|
| Build 1 | Steps 1, 2 (with 2.4 and 2.6 for GitHub Actions), 3, 4 (words from speech, D-115), 5, and iOS credentials in EAS | Plus products (step 2.5) |
| Build 2 | Everything build 1 needs, plus steps 6, 7, 8, 9 and 11 | Step 10 (links open the app; codes work without it), step 12 (before Delete account is tried), Plus products |

Your hands-on time [A]: about 5 hours for build 1 (2.5 without step 4, which D-115 requires) and about 7 more for build 2 (with steps 10 and 12), plus Apple's identity check and DNS waits. The plan to start by Mon 19 Oct and fit both builds before Thu 29 Oct predates the proposed dates at the top of this page.

## Who may have which build, and the internal-tester flow

D-100's gate: nobody outside the family signs in before the R-17 security gate passes (BL-347, BL-330, BL-331 with BL-332, `peek_invite` with BL-334, BL-322 and BL-349 merged and reviewed together; PRD V2 09 R-17, target T16, Fri 13 Nov). So:
- **Family:** build 2 (and build 1 if useful). Internal testers, in an internal group "Family".
- **Legal pages (D-100):** the gate also says the legal pages describing a server product are live before sign-in. `/privacy` and `/terms` are live on the website, but whether their text covers accounts and sync is S17's and counsel's (T05, T20 publish them as drafts). Whether the family-only build 2 waits for that is your call; nobody outside the family signs in before both the R-17 gate and those pages.
- **Invites:** links are `https://earlyletters.com/j#t=<token>`, the token in the fragment (B-NFR-002). The app writes that form only once `fix/invite-link-fragment` is on `develop`; the website serves the `/j` page (#144). Between two phones that both have build 2, the link opens the app.
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
`apps/mobile/test/config.test.ts` holds `testflight` equal to `preview` in everything but that line, so the flip cannot carry anything else, and the tests (`config.test.ts`, `capabilities.test.ts`) pass on either side of it (one applies the flip to a copy and checks it): the flip PR changes that one line and nothing else. It is a founder merge. After it, friends may get servers-on builds. `production` stays off until the store submission is re-planned (D-106).

Before any store submission: the App Store listing (`packages/content/src/store.en.ts`) must be brought to the shipped feature set; today it claims seven spoken languages and co-parent sharing, which a store build would not deliver: D-115 makes the speech English only, and `production` has server features off (`eas.json`, D-106), so a store build has no co-parent sharing. Owner S16. Not needed for TestFlight.

## If something goes wrong (the kill path)

The switch is the kill path (D-100): a build made with `EXPO_PUBLIC_SERVER_FEATURES=off` constructs no Supabase client, starts no sync and offers no sign-in (`apps/mobile/src/lib/capabilities.ts` and its tests). Staging holds real family letters during the alpha, so first decide which case this is:
- **Data may be exposed** (an access rule wrong, a key leaked, letters seen by the wrong person): pause the staging project first (Project Settings > General > Pause project; menu names *unverified*). That is the only step that stops reads at once: signing people out ends their refresh tokens, but an access token already issued stays valid until it expires (AUTH_SETUP 1.3 recommends 900 seconds; Supabase's default is one hour, *unverified* for this project).
- **Something is broken but nothing is exposed:** steps 1 to 3 in order, no pause needed.

In order of speed:
1. **Stop the server side now.** Supabase staging: Authentication > turn off "Allow new users to sign up"; sign the users out (Authentication > Users) if sessions must end; pause the project as the hard stop (menu names *unverified*). Letters already on phones stay on the phones (local first); sync waits.
   - **If a secret or service_role key was ever in the EAS "preview" environment or in a build:** rotate it in Supabase (Project Settings > API Keys) before anything else, delete it from EAS (`npx eas-cli@24.10.0 env:list --environment preview --include-sensitive` in `apps/mobile` to see what is there; without the flag it shows names only), and expire every build made while it was there (step 2). Both alpha profiles read that environment, so build 1 carries it too. Rotating the publishable key also cuts off every installed build 2; that is the fastest app-side stop if pausing is not possible.
2. **Stop the build.** App Store Connect > TestFlight > the build > Expire build: no new installs, and installed copies stop opening (*unverified*).
3. **Ship a servers-off build** to the family: build the `testflight` profile while it is still off, and add it to "Family". After the flip, revert the flip line first (one line) and build that.
4. **Tell the family and decide about staging data.** Say what happened and what was or was not exposed, in plain words. Letters synced to staging stay there until removed. If they must go, first have each person export their book (Settings > Export your book) so nothing depends on staging, then the founder removes the data or deletes the staging project. Follow `docs/ops/runbooks/suspected-data-leak.md` for the first hour and `docs/ops/runbooks/incident-notification.md` for who is told and when, and write down what happened in `docs/ops/` before the next build.
5. Remote kill switches do not help in the alpha: the app reads `sync` and, since #243, `invites`, but no signed remote config reaches a phone before founder step 4's signing keys are in a build. Backup and the status report are not in either build (build flags off), so there is nothing to pause.

## What testers get

Both builds, from `develop`: first run (the 18+ question, the promise, a child, the signature, the spoken language, asked before the speech download), Tonight (a prompt, Speak or Type, Not much today), speaking a letter with Review and Word for word, typing a letter with drafts, the Book, the letter page, Recently deleted, Read together, Settings (children, reminders, appearance, recordings, language, storage, export, helplines, licences, Help), and the membership rule (2 free letters, then Plus, D-082) with StoreKit 2 purchases if step 2.5 is done.

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

If a build goes out without step 4, add: "Recording works, but the words will not appear yet." That can happen only if the founder reverses D-115 first: the preflight FAILs both builds without the signed pack.

## What the preflight checks

`npm run preflight:testflight -w @scribe/mobile` (build 1) and `npm run preflight:alpha -w @scribe/mobile` (build 2); add `-- --skip-prebuild` to skip the native project (about a minute). It never builds, never goes online and needs no secret. FAIL stops (exit 1); WARN does not.
- **eas.json:** the profile is a store build with `EXPO_PUBLIC_APP_ENV=preview`, EAS-owned build numbers and a submit profile; server features `off` in `testflight` (a WARN if the R-17 flip is in), `on` in `preview`, never on in `production`; the two build flags written as `off`; `EXPO_PUBLIC_ENGLISH_ONLY=on` in both alpha profiles (D-111 item 4); no Supabase URL or key and nothing named like a secret in the file.
- **Config:** the `.preview` bundle id, URL scheme, microphone string, no background audio, no other permission, privacy manifest, export compliance, version, icons, and `extra` recording the switch and the build flags.
- **Both builds:** a FAIL if any `EXPO_PUBLIC_` variable exported in the shell holds a Supabase secret (`sb_secret_...`) or `service_role` key. Both profiles read the EAS "preview" environment, so export its values before either preflight to have them checked.
- **Submit:** a WARN until the submit profile names `ios.ascAppId` (step 2.4); only the GitHub workflow needs it.
- **Project id:** a WARN until step 3's PR adds `extra.eas.projectId`; no `eas build` can start before that.
- **Google and analytics:** a FAIL if a Google client id is in the profile or the shell (neither alpha build offers Google sign-in), and a FAIL unless the profile sets `EXPO_PUBLIC_ANALYTICS=off`.
- **Build 2 only:** the invite link check, which PASSes on `develop` since #165 (`/j#t=<token>`, the token in the fragment, B-NFR-002) and would FAIL only if the app wrote `/i/<token>` again. Step 6 is a CHECK: confirm staging has every migration on `develop` (step 6 item 3); if you export `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY` in the shell, their shape; the email code length to match in Supabase; the privacy manifest PASSes: it declares the five types this build keeps on our servers (Name, EmailAddress, SensitiveInfo, OtherUserContent, UserID; BL-349), the generated `PrivacyInfo.xcprivacy` equals the config, and App Store Connect's App Privacy answers must say the same.
- **Packs:** the docs base, the signing key and a published manifest (step 4); a FAIL in both builds without the key or the manifest (D-115).
- **No real family data** in the tree; the native project generates in a temporary copy, and its entitlements have data protection and no `aps-environment` (no remote push).
- **At the end:** the founder steps above that are missing, or that it cannot see, by number and name.
