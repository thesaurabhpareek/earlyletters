# TestFlight build 2: readiness (8 Nov 2026)

Owner: ops. Written against `develop` at `29dcd7d8d46121abeb458737934a576d0350e108` (1 Nov 2026, 16:12 UTC); re-check the head before you run anything (step 0).
Marks: **V** = verified in this repository or by a command I ran; **U** = unverified (an assumption, or only EAS, Apple or GitHub settings can show it).
I ran no `eas` command, read no credential page and printed no token. I have a conflict of interest to name: ops wrote and owns `docs/release/` checklists, so this page grades its own area.

## 0. Which build is "build 2"

TESTFLIGHT.md calls the servers-on `preview` profile "build 2". That is not what this page prepares. Build 1 was the `testflight` profile (servers off, V: `apps/mobile/eas.json`), and the fixes since then are for that app. This page prepares the **second upload of the `testflight` profile**, same bundle `com.earlyletters.scribe.preview`, same ASC record `6829163677` (V: `submit.testflight.ios.ascAppId` in `eas.json`).
The servers-on `preview` build also passes its own preflight on this head (V, section 3), but it needs the staging Supabase, Auth and EAS `preview` environment values (TESTFLIGHT steps 6 to 12), which this repository cannot show are done (U). Do not use `--profile preview` tonight unless you have decided that.

## 1. Commands for the founder's Mac, in order

Use eas-cli 24.10.0 through `npx` (V: the version `testflight.yml` pins). Do not paste a token into a command line.

| # | Command (repo root unless stated) | Expect | STOP if |
|---|---|---|---|
| 0 | `git switch develop && git pull --ff-only && git status --short && git rev-parse HEAD` | clean tree, a sha at or after `29dcd7d8d4` | the tree is dirty, the pull is not a fast-forward, or you are not on `develop`. Write the sha down; it is what build 2 is. |
| 1 | `npm ci` | exit 0 | any error. |
| 2 | `npx tsx scripts/release/doctor.ts` | exit 0; "0 fail" | any `FAIL` line. A `WARN` about `production` and `expo-updates` is expected (V, section 3). |
| 3 | `npm run preflight:testflight -w @scribe/mobile -- --profile testflight` | exit 0; "0 fail" | any `FAIL`, or "founder step(s) missing" above 0. |
| 4 | `npm run typecheck && npm test` | exit 0 | any failure. I did not run these (section 3); `testflight.yml` runs both before it builds, so run them here too. |
| 5 | `cd apps/mobile && npx eas-cli@24.10.0 whoami` | your Expo account (owner is `earlyletters-team`, V: `app.config.ts`) | it says you are not logged in: `npx eas-cli@24.10.0 login`, then repeat. Stop if the account is not the one that made build 1. |
| 6 | `npx eas-cli@24.10.0 build:version:get --platform ios --profile testflight` | a number: the counter EAS holds | (U: that this command and flag exist in 24.10.0.) Stop if the number is below 8; it should be 8 or higher, and the next build is that number plus 1 (section 2). If the command fails, skip it and read the number on expo.dev after step 7 instead. |
| 7 | `npx eas-cli@24.10.0 build --platform ios --profile testflight` | no questions (credentials are already in EAS, U); ends with "Build finished" and a build page | it asks "install expo-updates": answer **No**. It asks about Push Notifications: **No**. It asks to **generate a new** Distribution Certificate or Provisioning Profile: stop and check expo.dev credentials for `.preview` before saying yes; build 1 should have stored them (U). Any compile error: stop and send the log. |
| 8 | `npx eas-cli@24.10.0 submit --platform ios --profile testflight --latest` | "Submitted"; no new App Store Connect record | it says it is creating an app, or asks for the bundle id or a different Apple ID: stop (the record exists; `ascAppId` is set, V). If it asks the role for an API key: **APP_MANAGER**, not ADMIN. |
| 9 | App Store Connect > TestFlight, wait for "Processing" to finish, then read Apple's email | the build appears as `1.0.0 (N)` with the N from section 2 | the email names ITMS-91053 or `ExpoFileSystem` (the privacy-manifest risk the preflight WARNs about, V). Do not add testers; send the email. |
| 10 | In the build, paste "What to test" from section 5, then add the build to your existing testers' group (Family) | the group lists the build | the group has automatic distribution on (TESTFLIGHT.md warns about "Team (Expo)"); turn it off or delete that group. |

Before step 7, one human check (U): that the EAS `preview` environment holds no `EXPO_PUBLIC_E2E` and no Google client ids (the preflight cannot read it): `npx eas-cli@24.10.0 env:list --environment preview` from `apps/mobile`, names only. Stop if either name is there.
What worked for build 1: this repository holds no record of build 1's session (V: grep of `docs/`, nothing). I know only from the request that you built it on your Mac with eas-cli 24.10.0, profile `testflight`. Steps 7 and 8 follow TESTFLIGHT.md step 5, not a transcript (U).

## 2. Version and build number

- Marketing version: `apps/mobile/version.json` is `{"version": "1.0.0"}` (V). `app.config.ts` reads only that file (V). Leave it. A second build on the same 1.0.0 train is normal in TestFlight.
- Build number: `eas.json` sets `cli.appVersionSource` to `remote` and `autoIncrement: true` on `testflight` (V). So the iOS build number is a counter held by EAS and `app.config.ts` never sets it (V: its comment says so). EAS adds 1 when the build starts.
- Next number: build 1 shipped as `1.0.0 (8)` (from the request; not in the repo). If nothing else has been built since, the next is **9** (U). Reasons it could be higher: EAS adds 1 for every build it starts, including failed or cancelled ones, and for the `preview` or `production` profile if either shares the counter (U: whether the counter is per profile; EAS keeps one per app and platform as far as I know). Only EAS can say: step 6, or the build page on expo.dev. A number Apple already holds for 1.0.0 would be refused at upload, so do not edit the counter by hand.
- Do not run `eas build:version:set`.

## 3. Preflight I ran

On a clean worktree of `origin/develop` at `29dcd7d8d46121abeb458737934a576d0350e108`, after one `npm ci` (986 packages, exit 0), on Linux. No network call to Expo or Apple, no token set.

| Command | Exit | Result (V) |
|---|---|---|
| `npx tsx scripts/release/doctor.ts` (static; `EXPO_TOKEN` unset) | 0 | 5 pass, 1 warn, 2 unverified, 1 not needed, **0 fail**. Pass: Expo project id and owner present, `ascAppId` in both submit profiles, 2 signing keys in `keys.ts`. Warn: `production` sets a `channel` but `expo-updates` is not installed (affects only the production profile, not tonight; PR #574 made it a warn). Unverified: the Expo login and the App Store Connect key, which need `EXPO_TOKEN` and `ASC_*` on your Mac. |
| `npm run preflight:testflight -w @scribe/mobile -- --profile testflight` | 0 | 58 pass, 2 warn, 3 unverified, **0 fail**, 0 founder steps missing, 4 to check by hand. Warns: the ITMS-91053 email after upload, and the precompiled `ExpoFileSystem.framework` with no privacy manifest. Unverified: the EAS `preview` environment (E2E and Google names), and whether the signed pack manifest is actually served at `packs.earlyletters.app`. |
| `npm run preflight:alpha -w @scribe/mobile` (the servers-on profile, for the record) | 0 | 59 pass, 2 warn, 6 unverified, 0 fail, 11 to check by hand. |

Not run: `npm run typecheck`, `npm test`, `npm run test:db`, any EAS or Apple command, and a build. Exit 0 means the configuration is consistent; it does not show that the build compiles or signs (the script says so itself). The earlier page (TESTFLIGHT.md, 30 Oct) recorded 2 FAIL for the pack keys and manifest; both are gone on this head (V).
The packs: the repo holds a signed manifest and the keys (V), but the preflight cannot see whether the host serves it. Do the manifest check in TESTFLIGHT.md step 4, or run `npx tsx scripts/packs/publish.ts verify` (U). Without it, recordings get no words.

## 4. Dispatch `testflight.yml` instead of the Mac?

Facts (V unless marked):
- The workflow has had 14 runs, all `pull_request`, all skipped. It has never been dispatched, so everything in it is untested, and its own header says so.
- A dispatch needs the GitHub Environment `testflight` with the secret `EXPO_TOKEN`, and its approval. I could not read the environment (the GitHub API path is blocked for me), so whether it exists, has a reviewer, admits `develop` and holds the secret is U. The workflow header warns that naming a missing environment creates it with no protection.
- The job runs `--non-interactive`. That needs iOS credentials already stored in EAS and, for submit, an App Store Connect API key stored in EAS (U for both). Build 1 was signed on your Mac interactively; whether that left the key in EAS is unknown (U).
- The workflow runs `npm ci`, typecheck, the full tests, the preflight and the seam guard before it builds, so it adds checks the Mac path leaves to you. It has a 75 minute timeout.
- Failure mode is mild: the run fails at a step and builds nothing. It cannot spend an EAS build before the "Build on EAS" step. But a failed attempt can burn time tonight, and a build that does start consumes a build number.

Recommendation: **use the Mac tonight.** It is the path that already worked for build 1, and every untested piece of the workflow (the environment, the token, non-interactive signing and submit) is a place to lose the evening. Dispatch the workflow later as a separate, daytime trial with `submit` unticked (`gh workflow run testflight.yml --ref develop -f profile=testflight -f submit=false`), so it can fail without touching TestFlight.

## 5. What changed since build 1

Build 1 upload: 1 Nov 2026, 08:59 UTC (from the request). I listed commits on `origin/develop` after that time that touch `apps/mobile`, `packages/core` or `packages/content` (`git log --since=2026-11-01T08:59:00Z -- those paths`; V). `develop` has had no commit after #574 (V: nothing after 16:12 UTC on 1 Nov when I fetched). Anything merged tonight is not in this list: re-run the command at step 0. #538 (08:53 UTC) is just before the cutoff and is not counted.

| PR | Merged (UTC) | Tester can see it? | One line |
|---|---|---|---|
| #513 | 1 Nov 16:01 | yes | Change the date of a letter, or show only a month for a memory you cannot place to a day. |
| #542 | 1 Nov 16:00 | yes | The "writing down your words" bar now moves as the words are written; before, it looked empty for minutes. |
| #550 | 1 Nov 15:59 | yes | Settings, Licenses lists only what the app really uses, in groups. |
| #552 | 1 Nov 15:02 | yes | No letter limit in this test. |
| #545 | 1 Nov 10:09 | yes | Writing a letter: the cursor stays in view, and "Keep private" is no longer hidden behind the keyboard the first time you open it. |
| #546 | 1 Nov 09:52 | yes | Settings has a back button on its first screen. |
| #541 | 1 Nov 09:52 | yes | The first-time speech download shows real progress, retries a few times, and says so if it cannot continue, instead of sitting at 0%. |
| #567 | 1 Nov 15:42 | no | App Store listing text and screenshots; no change in the app. |
| #530 | 1 Nov 09:34 | no | Website and brand-doc fixes ported from `main`; no change in the app. |
| #574 | 1 Nov 16:12 | no | Release preflight rule; no change in the app. |

Dates for #513, #542, #550, #552 are the commit times in -08:00 converted to UTC (V). Whether each PR's behavior works on a phone is U: I read the commit messages and file lists, and ran none of their tests. The seven visible lines are from those messages, not from using the app.

Paste into TestFlight "What to test" for this build, above the standing text in `testflightCopy.whatToTest.build1` (`packages/content/src/release/testflight.en.ts`), which keeps the no-account, feedback and privacy sentences:

```
New since the first build:
- You can change the date of a letter, or show only the month when you do not know the day.
- While your words are being written down, the progress bar now moves.
- Writing a letter: the cursor stays in view, and "Keep private" is no longer hidden behind the keyboard.
- Settings has a back button on its first screen.
- The first-time speech download shows how far along it is, and tells you if it gets stuck.
- Settings, Licenses now lists only what the app uses.
- There is no limit on letters in this test.
```

Checked by eye against CLAUDE.md content rules: no AI-writes claim, no streak or count of gaps, no gendered child, no dashes or ellipsis (U: I did not run `packages/content/test/rules.test.ts` on this paste, since the block is in a docs file, not in content).
Note that `plusLine` in the standing text already says "every letter you keep is free", so the last bullet repeats it; drop the bullet if you want it shorter.

## 6. Known issues testers should hear about

- No account, no sync, no sharing: servers are off in this profile (V: `eas.json`, preflight). Sign in with Apple is in the binary but has no screen (V: preflight note).
- Plus cannot be bought here; the test is free (V: preflight note and #552).
- Words come from a one-time speech download on Wi-Fi; until it finishes, recordings are kept and the words follow (V: `speechLine`). Writing words down can take minutes on an older phone (U: the commit for #542 says it "looked empty for minutes"; no timing was measured by me).
- Apple's processing email may flag a privacy-manifest reason for expo-sqlite or `ExpoFileSystem` (V: preflight WARN). That is for the founder, not for testers, unless Apple holds the build (U).
- Nothing in this list has been run on a real phone by an agent (V: docs/qa/ALPHA_GO_NO_GO.md says no build existed when written; U whether the founder has tested build 1 since).
- TestFlight builds expire after 90 days (U: Apple's rule, not read from a source here); tell testers to update when a new build appears.
- 103 PRs were open when this was written (from the request, U); none of them is in build 2 unless merged first.
