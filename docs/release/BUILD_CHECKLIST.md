# Build checklist: alpha build 1 and build 2 (run on your own computer)

Status: 1 Nov 2026. Owner: ops (HV2-B01, design: `docs/agents/harness-v2/ARCHITECTURE.md` section 5). This is the short script for the sitting. The reasons, the account steps and every prompt answer live in `docs/release/TESTFLIGHT.md` (steps 2 to 5 and 11); when the two differ, TESTFLIGHT.md wins and this file gets fixed.

How to use it:
1. Copy `docs/release/build-log-TEMPLATE.md` to `docs/release/build-log-<YYYY-MM-DD>-build<N>.md` and fill it in as you go. Paste output, never a secret: no token, no key, no `.p8` text, no password, no Apple ID, no child's name.
2. Do the steps in order. Every step has a command, what you should see, and a STOP line.
3. At a STOP: stop, paste the exact output into the log, and hand the log to the coordinator. Do not work around it and do not spend a build to test a hunch.
4. One retry rule: a failed `eas build` or `eas submit` may be retried once, only after the log says why you think the second try differs. A second failure is a STOP.

Marks: **U** means unverified, not run or not read from a primary source by whoever wrote this. Nothing in this file has been run against Apple or Expo.

Where a command comes from: `doctor.ts` header (`scripts/release/doctor.ts`), `apps/mobile/package.json` scripts, `apps/mobile/eas.json` profiles, and TESTFLIGHT.md. The pinned CLI `eas-cli@24.10.0` is the version `testflight.yml` pins as `EAS_CLI_VERSION` (`.github/workflows/testflight.yml:66`), so your computer and GitHub build with one CLI.

Path: this file covers path A, your own computer, for both builds. A build from GitHub (`testflight.yml`) is path B and is not covered until a dispatch has been rehearsed (TESTFLIGHT.md step 5).

## Before you sit down

- Apple Developer membership Active (TESTFLIGHT.md step 1, done 29 Oct 2026 per that page).
- The App Store Connect record for `com.earlyletters.scribe.preview` exists (step 2) and the "Family" internal group exists with automatic distribution off, or you are ready to delete "Team (Expo)" after the first submit (step 5, last bullet; whether App Store Connect lets you create the group before the first build is U).
- Secrets for the doctor, set so they stay out of shell history (TESTFLIGHT.md step 5): `read -rs EXPO_TOKEN && export EXPO_TOKEN`, and the same for `ASC_API_KEY_ID` and `ASC_API_ISSUER_ID`; `export ASC_API_KEY_P8_PATH="$HOME/Downloads/AuthKey_<id>.p8"` (a path, not a secret). Never paste any of these into the log or a chat.
- About 30 minutes of your hands-on time for build 1 once the PRs of steps 3 and 4 are merged (TESTFLIGHT.md step 5), plus the EAS queue and Apple's processing (an hour or more, U).

## Step 1. Clean checkout of develop
Command: `git switch develop && git pull && npm ci` at the repo root, then `git status --porcelain`.
Expect: `git status --porcelain` prints nothing; `git log -1 --format=%H` is the commit you will build, write it in the log.
STOP: any line from `git status --porcelain`, or `npm ci` fails. The doctor reads your working tree, so a stale or dirty tree gives false results.

## Step 2. Release doctor, live
Command: `npx tsx scripts/release/doctor.ts --live` (read-only; every request is a GET or `eas whoami`).
Expect: exit code 0, so no FAIL line (WARN, UNVERIFIED and NOT NEEDED never fail it). Check with `echo $?` straight after. It never prints a key or token.
STOP: exit code 1, or any FAIL line. Paste the FAIL lines. Known on 1 Nov 2026 per the retro digest: one FAIL for the signing key in `packages/api/src/keys.ts` (U, read from the digest, not re-run); it clears when the keys PR of TESTFLIGHT.md step 4 is merged and your tree is pulled. It has never run against Apple or Expo, so a surprise there is a finding, not your mistake.

## Step 3. Preflight
Command: build 1: `npm run preflight:testflight -w @scribe/mobile`. Build 2: `npm run preflight:alpha -w @scribe/mobile` (scripts in `apps/mobile/package.json`; it never goes online and needs no secret).
Expect: exit code 0, no FAIL line. WARN lines are read and copied into the log (the ITMS-91053 line is a note for after the upload, B1-10).
STOP: any FAIL. The preflight can FAIL when the doctor exited 0, because the doctor checks the signing keys and not the published manifest.

## Step 4. Merged prerequisites are in your tree
Command: `grep -n "projectId" apps/mobile/app.config.ts`, then `grep -n "ascAppId" apps/mobile/eas.json`, then `grep -n "keyId" packages/api/src/keys.ts`, then `grep -n "PACK_MANIFEST" supabase/functions/config/published.ts`.
Expect: a `projectId` line under `extra.eas`; an `ascAppId` line under `submit.testflight.ios` (and `submit.preview.ios` for build 2); at least one `keyId` line that is not inside a comment; `PACK_MANIFEST` assigned a string, not `null`. Do not paste the values; write "present" for each.
STOP: any of the four missing. The keys are compiled into the app (TESTFLIGHT.md step 4, item 3), so a build without them has no spoken words.

## Step 5. Count the builds used this month
Command: open the Expo dashboard (expo.dev, your account, the `scribe` project, Builds) and count iOS builds started this calendar month. Write the count in the log line "Builds used this month" before step 6.
Expect: the Free plan allows 15 iOS builds a month (`docs/agents/harness-v2/ARCHITECTURE.md` section 4, citing expo.dev/pricing; U, not re-read here). The plan for the month is 6 builds with 9 headroom, so the count is small.
STOP: fewer than 3 builds remain (15 minus the count is under 3), or the log line is empty. A retry loop is the way this budget gets spent.

## Step 6. Build
Command: in `apps/mobile`: build 1 `npx eas-cli@24.10.0 build --platform ios --profile testflight`; build 2 `npx eas-cli@24.10.0 build --platform ios --profile preview`. Profiles are in `apps/mobile/eas.json`.
Expect: prompts, with these answers (TESTFLIGHT.md step 5): install expo-updates, no; Push Notifications, No (plain No; `eas.json` sets `promptToConfigurePushNotifications: false`, so it should not ask); log in to Apple, yes; generate a new Distribution Certificate and a new Provisioning Profile, yes. It ends with a build URL and a finished build. Note the build URL and the build number in the log (no account identifiers beyond the URL).
STOP: any other prompt you cannot explain from TESTFLIGHT.md, a build that fails, or a build that stops waiting. Apply the one-retry rule: a first failure may be retried once after you write why in the log; a second failure is a STOP. Do not change `eas.json`, `app.config.ts` or any workflow to get past it (TESTFLIGHT.md step 5 gives the credential route: `npx eas-cli@24.10.0 credentials --platform ios`).

## Step 7. Submit
Command: in `apps/mobile`: `npx eas-cli@24.10.0 submit --platform ios --profile testflight --latest` (build 2: `--profile preview`).
Expect: if asked to generate an App Store Connect API Key, yes, and at "Select role for the generated API key:" choose APP_MANAGER, not ADMIN, which is listed first. If it asks to reuse a key, yes only when the Key ID shown is the App Manager key. It ends by saying the build was submitted.
STOP: a credential prompt the log does not explain; a message that it is creating an App Store Connect record (stop at the Apple sign-in and check App Store Connect > Apps first, TESTFLIGHT.md step 5); or a failed submit (one retry rule applies).

## Step 8. Apple processing, TestFlight and the phone
Command: wait for Apple's processing email; in App Store Connect > TestFlight confirm the build is listed; add it to the "Family" group only; install it on the drill phone from the TestFlight app.
Expect: the build shows in TestFlight with its number matching the log; the processing email has no privacy-manifest warning (ITMS-91053, go/no-go B1-10; save nothing from the email into the repo). The app opens.
STOP: the build does not appear, or Apple's email names a problem, or "Team (Expo)" was created and has taken the build (delete that group in App Store Connect and tell the coordinator). Never invite anyone outside the family on build 2 (TESTFLIGHT.md "Who may have which build").

## Step 9. B1 rows and evidence
Command: follow the B1 rows in `docs/qa/ALPHA_GO_NO_GO.md` (B1-1 to B1-9 and B1-11 must pass before testers outside the family); record each session with `docs/qa/evidence/TEMPLATE.md`, saved under `docs/qa/evidence/`.
Expect: a committed evidence file per session. Use the fictional family "Asha" and labels in it; never a real child's name, letter text, email, code or link.
STOP: no evidence file. No evidence, no "on TestFlight" claim in any status page.

## Step 10. Build 2 only: freeze and extras
Command: none; read `docs/release/TESTFLIGHT.md` steps 6 to 9 and 11. Build 2 needs everything build 1 needed plus the staging project, Auth, Sign in with Apple and the EAS `preview` environment variables (names listed by `npx eas-cli@24.10.0 env:list --environment preview` in `apps/mobile`, names only, never `--include-sensitive` during this sitting).
Expect: the freeze is Tue 3 Nov 2026 5:00 AM PT (D-089, TESTFLIGHT.md header); after it no workflow, `eas.json` or `app.config.ts` change except S0 or S1 fixes (`ARCHITECTURE.md` section 5, item 10). Whether the 3 Nov date still stands after build 1 moves is the coordinator's call, U.
STOP: any of steps 6 to 9 of TESTFLIGHT.md not done, or a config change proposed inside the freeze.

## After the sitting
Fill the last block of the build log, commit it on a branch `docs/build-log-<date>` and open a PR; do not push to `develop`. Anything marked U in the log that you could now answer, answer it.

## Checked by a script
`node scripts/release/checklist-check.mjs` checks this file and the template: every step has Command, Expect and STOP lines, the steps are numbered 1 to 10 in order, the one-retry rule and the builds-used line are present, and the log template asks for the builds-used line before the build step. It checks shape only; it does not run any command.
