# End-to-end tests (Maestro, iOS simulator)

Owner: qa-e2e. Written 3 Oct 2026 against Maestro CLI 2.11.0 (released 29 Sep 2026), Expo SDK 57, EAS CLI 24.10.0. Plan of record: `docs/tdd/07-quality-test-strategy.md` section 3, updated here to today's product (decisions D-051 to D-070).

Labels: **V** verified on a vendor page or in installed source on 3 Oct 2026 (sources at the end). **A** assumption, to check on the first real run. Nothing here has been run yet: this machine is Linux, and the app has no testIDs (see section 1).

## 1. Status: what must happen before the first run

1. **testIDs and e2e seams in the app.** The shared primitives forward `testID` since #116 (`apps/mobile/test/testid-primitives.test.ts`), but the screens still set almost none: on 15 Oct, `node apps/mobile/e2e/bin/lint-flows.mjs --app` finds 125 of the 134 ids the flows use missing from `apps/mobile/src`. There is still no way to seed data, shift the clock, override remote config or force offline. The full request list is `TESTID_REQUESTS.md` (sections 1 to 3; owner of `apps/mobile/src/**` is mobile-polish this wave). Every flow fails at its first selector until then.
2. **An `e2e` EAS build profile** (simulator `.app`, release JavaScript, `EXPO_PUBLIC_E2E=1`): request B-1 in `TESTID_REQUESTS.md`.
3. **An e2e backend** for the flows tagged `needs-backend` (E2E-09, 12, 13): a separate Supabase project, section 5 of `TESTID_REQUESTS.md`. Flows without that tag run fully offline on the simulator.

`node apps/mobile/e2e/bin/lint-flows.mjs` runs anywhere and checks the YAML, the file references and that every id a flow uses is on the request list.

## 2. The flows

TDD 07 planned 15 flows on 3 Oct morning; the founder's decisions that day changed several (no RevenueCat or server entitlements, D-053; co-parent only, D-055; one welcome screen, D-043; outbox sync, D-023; seven languages with packs on demand, D-056 and D-065). The 15 below are the brief's list.

| # | File(s) | What it proves | Needs |
|---|---|---|---|
| E2E-01 | `E2E-01a-age-gate-no.yaml`, `E2E-01b-age-gate-yes.yaml` | 18+ gate first, nothing preselected, No stops for 24 h (clock moved forward 23 h and back 2 h), Yes stores a boolean only; container checks between the two | offline, clock seam |
| E2E-02 | `E2E-02-first-run-twins.yaml` | Twins in first run: one free book each, no Plus sheet, no notification prompt, switcher lists both | offline |
| E2E-03 | `E2E-03-speak-save-offline.yaml` | Speak, Review, keep the recording as a letter waiting for its words; Keep the book sheet and Not now; background stops and keeps the take; kill during recording is recovered | offline, no model |
| E2E-04 | `E2E-04-type-a-letter.yaml` | Type a letter with Devanagari; no first-note card; text back exactly; kill right after Save leaves it exactly once | offline |
| E2E-05 | `E2E-05-language-hindi-packs.yaml` | Add Hindi; its text pack downloads to installed and appears in Storage alone; offline and kill-switch states | network (part 1) |
| E2E-06 | `E2E-06-read-together-plus-gate.yaml` | 3 free Read together sessions, then the Plus gate; remote config raises it to 5 | offline, config seam |
| E2E-07 | `E2E-07-add-child-plus-gate.yaml` | Add a child after first run: Plus gate from the Book (2 taps) and from Settings; Not now creates nothing | offline |
| E2E-08 | `E2E-08-delete-and-undo.yaml` | Delete, Undo, delete again: gone from the book, also after relaunch | offline |
| E2E-09 | `E2E-09-account-deletion.yaml` | Account deletion: Export offered first, typed confirm, scheduled; cancel; server row scheduled then cancelled | backend |
| E2E-10 | `E2E-10-export.yaml` + `bin/inspect-export.sh` | Export offline with no Plus UI; ZIP contents and manifest hashes | offline |
| E2E-11 | `E2E-11-analytics-consent.yaml` | Usage and crash reports off by default, on, off, each surviving a relaunch; the consent sheet block is pending (not mounted in the app yet) | none |
| E2E-12 | `E2E-12-sign-in-email.yaml` | Email code sign-in, Terms with the 18+ line, sensitive-data consent; optional universal-link variant | backend |
| E2E-13 | `E2E-13a/b/c-*.yaml` + `bin/run-coparent.sh` | Co-parent invite round trip on two simulators: Mama invites, Papa joins through the 18+ gate and sign-in, Mama sees Papa | backend, 2 simulators |
| E2E-14 | `E2E-14-restore-purchases.yaml` | Apple's store view with the StoreKit file, a test purchase, Restore purchases | app run from Xcode |
| E2E-15 | `E2E-15-voiceover-smoke.yaml` | AX5 in light and dark: every P0 control reachable and enabled, screenshots for a human look; the VoiceOver walk is manual (DEVICE_TEST_PLAN S1-23) | offline |
| E2E-17 | `E2E-17a-export-listening-copy.yaml`, `E2E-17b-export-original-only.yaml` + `bin/inspect-export.sh --originals` | Added 15 Oct (PRD V2 07 section 2.6). With a listening copy on the phone, export carries only the originals, byte for byte (F15-REQ-001, F15-REQ-002); 17b switches the player to the original and exports again: the same originals with the same hashes. The inspector fails if a listening copy's bytes are in the ZIP, if an original's hash differs from its capture hash, or if the seed made no recordings | offline, seed `asha-recordings` |

### The P0 nightly set

PRD V2 (`08-delivery.md` section 3.3, S19; R5 EQ-10) runs five P0 flows every night: **E2E-01** (01a then 01b, which runs on 01a's install), **E2E-03**, **E2E-12**, **E2E-13** (two simulators) and **E2E-17** (17a then 17b). Each of those files carries the tag `p0-nightly`, and `bin/lint-flows.mjs` fails if one of the five loses it. Run them with:
```bash
apps/mobile/e2e/bin/run-p0-nightly.sh --udid-a <se3-udid> --udid-b <second-udid> --app /path/to/EarlyLetters.app --junit
```
Exit 0 means all ran and passed, 1 a flow failed, 3 nothing failed but a P0 flow was skipped (no second simulator or no e2e backend): a nightly with a skip is not green. Where it runs (GitHub macOS minutes, a Mac mini or Maestro Cloud) is the founder's call (07 Q6); the workflow line is a request to S20.

`npm test` runs the flow lint on every machine through `apps/mobile/test/qa-e2e-flows.test.ts`, so a broken flow file fails CI on Linux before anyone needs a Mac.

Requirement and decision ids are in each flow's `tags`, so `maestro test --include-tags=PRD-REQ-019 ...` runs everything that proves one requirement, and a trace script can read them (TDD 07 2.1).

Folder layout: `flows/` (one file per flow), `subflows/` (launch, gate, first run, sign-in, settings, wait, go back, dev client), `scripts/` (Maestro JavaScript: backend guard, test user, sign-in code, deletion status), `bin/` (host scripts), `kill/` (the DL-01 and DL-02 kill harness, section 9; not Maestro), `ci/` (GitHub Actions sketches, not enabled), `config.yaml` (Maestro workspace).

## 3. Builds

### 3.1 The e2e build (what the suite gates on)
Release JavaScript on a simulator, with the e2e seams compiled in (request B-1):
```bash
cd apps/mobile
npx eas-cli@latest build --platform ios --profile e2e        # EAS builds the simulator .app
npx eas-cli@latest build:run --platform ios --profile e2e --latest --simulator "iPhone SE (3rd generation)"
```
`build:run` downloads the latest simulator build and installs it (V: eas-cli README). For the runner scripts, download the archive and pass the `.app` with `--app`. Bundle id: `com.earlyletters.scribe.dev`. The e2e seams (`src/dev/e2e-seams.ts`) are compiled only into a build with `EXPO_PUBLIC_E2E=1` whose app env is neither `preview` nor `production`, so the e2e profile uses the development app env (request B-1) and its `.dev` suffix (`app.config.ts`), never a store profile's; every flow reads the id from `APP_ID`.

### 3.2 The quick authoring loop with a local development build
For writing or fixing one flow while the app code changes. Request B-2 (an EAS `development-simulator` profile) is withdrawn: B-9 on #145 refuses `EXPO_PUBLIC_E2E` in an EAS build of any profile but `e2e`, and still allows a local development build with it. Set the flag on the command, never in a shell profile: the TestFlight preflight fails when the shell carries it.
```bash
cd apps/mobile
EXPO_PUBLIC_E2E=1 EXPO_PUBLIC_APP_ENV=development npx expo run:ios                 # once per native change; starts Metro on :8081 (A)
EXPO_PUBLIC_E2E=1 EXPO_PUBLIC_APP_ENV=development npx expo start --dev-client      # later sessions: Metro inlines the flags, so it needs them too
# in a second terminal, from the repo root:
maestro test apps/mobile/e2e/flows/E2E-04-type-a-letter.yaml \
  -e APP_ID=com.earlyletters.scribe.dev -e E2E_DEV_CLIENT=1 -e METRO_URL=http://localhost:8081
```
With `E2E_DEV_CLIENT=1` the launch subflows open `exp+scribe://expo-development-client/?url=<Metro>` after every cold start (V: Expo "Development workflows": SDK 57 accepts only this legacy form; the scheme defaults to `exp+<slug>`). Differences from the e2e build, all by design: `__DEV__` is true and `devShortcutsAllowed` is true (`lib/build-env.ts`), so the Plus gate shows a dev Continue button and the sample transcriber may answer instead of "no words". Use this loop to author; gate only on the e2e build. `maestro test --continuous` (`-c`) re-runs the flow on every save (V: CLI reference).

## 4. Running on a Mac

### 4.1 One-time setup
- Xcode 26.x with an iOS 26 simulator runtime (EAS's `sdk-57` image is Xcode 26.6, V). `xcode-select --install`.
- Java 17 or newer (Maestro requirement, V). Maestro CLI pinned: `export MAESTRO_VERSION=2.11.0; curl -Ls "https://get.maestro.mobile.dev" | bash` (V: the install script honours `MAESTRO_VERSION`).
- Node 22 and `npm install` at the repo root; the kill harness (section 9) needs Node 22.18 or later.
- Simulators: `xcrun simctl create se3 "iPhone SE (3rd generation)"` and `xcrun simctl create i16 "iPhone 16"`; boot with `xcrun simctl boot <udid>`. Maestro drives simulators only: Maestro 2.11.0 rejects physical iPhones ("Physical iOS devices are not yet supported", V), so everything on a real phone is `docs/qa/DEVICE_TEST_PLAN.md`.
- `export MAESTRO_CLI_NO_ANALYTICS=true` (V: Maestro environment variables).

### 4.2 Backend variables (flows tagged needs-backend)
```bash
export MAESTRO_E2E_SUPABASE_URL=https://<e2e-ref>.supabase.co
export MAESTRO_E2E_PROJECT_REF=<e2e-ref>
export MAESTRO_E2E_SERVICE_KEY=<the e2e project's secret key>      # never staging or production
export MAESTRO_PROD_PROJECT_REF=<production ref>                    # scripts refuse it
export MAESTRO_STAGING_PROJECT_REF=<staging ref>                    # refused too: staging holds the family's letters (D-106)
```
Maestro passes shell variables that start with `MAESTRO_` into flows and scripts (V). `scripts/lib-guard.js` refuses any URL that is not the e2e project or `http://127.0.0.1`, any URL containing the production or staging ref, an e2e ref equal to either, a hosted URL when either ref is unset (it fails closed), and any email that is not a test address. `apps/mobile/test/qa-e2e-guard.test.ts` runs the guard in Node on every `npm test`.

Sign-in codes (`scripts/fetch-otp.js`):
- `OTP_SOURCE=admin` (default): GoTrue's admin `generate_link` returns the 6-digit `email_otp` without sending mail (V-code: `@supabase/auth-js` 2.117.2). Proves the app's code path; mail delivery is a device check.
- `OTP_SOURCE=mailpit`: a local Supabase stack (`npx supabase start`, Docker on the Mac) catches mail in Mailpit on port 54324 (V: Supabase local development uses Mailpit), and the script reads the real email, template included. It needs a build that may reach `http://127.0.0.1:54321` (request B-7; never in preview or production).
- Test addresses: `delivered+<label>@resend.dev` (V: Resend test addresses accept `+label`; they count against the sending quota).

### 4.3 Commands
```bash
# One flow
maestro test apps/mobile/e2e/flows/E2E-02-first-run-twins.yaml -e APP_ID=com.earlyletters.scribe.dev
# The single-simulator suite, in order, with host checks between flows
apps/mobile/e2e/bin/run-suite.sh --udid <se3-udid> --app /path/to/EarlyLetters.app --junit
apps/mobile/e2e/bin/run-suite.sh --only E2E-05
# The co-parent round trip on two simulators
apps/mobile/e2e/bin/run-coparent.sh <udid-a> <udid-b> --app /path/to/EarlyLetters.app
# All flows proving one requirement
maestro test apps/mobile/e2e --include-tags=PRD-REQ-019 -e APP_ID=com.earlyletters.scribe.dev
```
Artifacts (screenshots, logs, JUnit) go to `~/.maestro/scribe-e2e/<time>` or `$OUT`, never into the repo (COORDINATION section 8). Screenshots may show only the fictional family (Asha, Avi, Mama, Papa).

### 4.4 E2E-14 (StoreKit file)
StoreKit Testing is active only for an app run from Xcode with the configuration chosen in the scheme (V: Apple, "Setting up StoreKit Testing in Xcode"). Prebuild once (`cd apps/mobile && npx expo prebuild --platform ios`; SDK 57 prebuild clears and regenerates `ios/`, V), open the workspace, add `apps/mobile/storekit/EarlyLetters.storekit` to Scheme > Run > Options > StoreKit Configuration, add the launch argument `-e2eSeed asha`, run, then `maestro test apps/mobile/e2e/flows/E2E-14-restore-purchases.yaml -e APP_ID=<the bundle id Xcode built>`. The flow never relaunches the app (A: that keeps the Xcode StoreKit session attached).

## 5. Conventions

- Select by `id` only; never by a word from `packages/content`. Text selectors appear only for iOS system UI (the microphone alert, the share sheet's Copy, Apple's store view) and fixture data (child names, letter text).
- Fixtures: the fictional family only (CLAUDE.md privacy rules). Children Asha and Avi; adults Mama and Papa.
- One flow, one concern, tagged `e2e` plus its E2E id plus every requirement and decision it proves. `needs-backend`, `needs-network`, `e2e-coparent`, `storekit-xcode` select runners.
- No sleeps: assertions wait up to 7 s on their own (V); `extendedWaitUntil` for longer; `subflows/wait.yaml` only where time itself is the point (recording length, backgrounding).
- Flake policy (TDD 07 3.2): a nightly flow may retry once and a pass on retry files a flake issue; release-candidate runs never retry.
- iOS has no `back` command in Maestro (V: Android and Web only) and no airplane mode on simulators (V); use `subflows/go-back.yaml` (edge swipe) and the `e2eOffline` seam.

## 6. Optional: network witness

To prove "no request to PostHog or Sentry before consent" (PRD-REQ-016, LEGAL-REQ-003) and the canary scan (LEGAL-REQ-014), run the flows online through a recording proxy: mitmproxy as the Mac's system proxy, its CA added to the simulator with `xcrun simctl keychain <udid> add-root-cert ~/.mitmproxy/mitmproxy-ca-cert.pem`, and a host log checked after each flow. **A**: the simulator follows the Mac's proxy settings; not scripted yet (BL-Q25 in TDD 07). Until then, network assertions are device checks with the iOS App Privacy Report (DEVICE_TEST_PLAN S1-24).

## 7. CI

`ci/ios-e2e.yml.example` is a GitHub Actions sketch for a `macos-26` runner (arm64, no Docker: V), triggered by hand, with the nightly schedule commented out. It is not enabled; the coordinator moves it to `.github/workflows/` once section 1 is done. EAS Workflows' built-in `maestro` job is the alternative that needs no runner of ours (V: Expo docs).

`ci/kill-harness.yml.example` is the sketch for the kill harness (section 9): one job builds the e2e simulator app on the runner (no EAS build spent), then DL-02 and DL-01 run as two jobs. S20 turns it into `.github/workflows/kill-harness.yml` (RA-20-10a in `docs/release/AUTOMATION.md`).

## 8. What these flows do not cover (and where it is)

Real microphone audio and transcription speed, Sign in with Apple and Google sheets, mail clients and universal links from Mail and Messages, StoreKit sandbox and Family Sharing, notifications at their times, VoiceOver itself, export opening on Mac and Windows, app size, haptics, fonts and AUSoundIsolation: all in `docs/qa/DEVICE_TEST_PLAN.md`. Access rules, deletion purge and sync parity: `supabase/tests`. Pure logic: `npm test`.

## 9. The kill harness (DL-01, DL-02; B2-11, never waived)

`kill/run-kill-harness.mjs` (RA-19-04) kills the app during save (DL-02) and while recording (DL-01) on an iOS simulator, and checks after every kill that no letter or recording was lost, doubled or damaged (07 "Kill during save" and "Kill while recording", 06-nfr row 187, DATA-REQ-048, F04-REQ-024, F08-REQ-019; `docs/qa/DEVICE_TEST_PLAN.md` DL-01 and DL-02). It is not a Maestro flow: Maestro cannot time a kill to the millisecond.

**How a run works.**
1. The harness launches the app with launch arguments (`-e2eKillDrill dl02 -e2eKillRun 17 ...`).
2. The e2e build's seam (`apps/mobile/src/dev/kill-drill.ts`, loaded by `src/dev/e2e-seams.ts`) checks that it runs on a simulator, in the development bundle, on an install it made itself; otherwise it writes `refused_...` and does nothing. It then waits for the app's own launch sweep and writes a `boot` marker.
3. The harness judges the previous run from the host while the app waits, then writes `go`. The seam makes the run's draft (DL-02: a typed letter, a spoken one hashed at Finish, or a spoken one Save must hash; DL-01: a live take through `beginTake`, as Listen does), writes `armed`, and starts the save or the recording through the same store and recorder calls Review and Listen use.
4. The harness sends SIGKILL to the app's process (simulator apps are host processes): a random 0 to 400 ms after `armed` (DL-02) or 10 to 120 s into the take (DL-01, 07's window); or, for DL-02 crash-point runs, the moment the seam writes `point` and holds at one of four named moments: `after-file-write` (the take's file closed, its draft not finalized), `before-row` (the hash check done, no letter row yet), `inside-transaction` (letter row written, draft removed, nothing committed) and `after-commit` (committed, before the Keychain count). A kill before the commit must leave the draft; after it, the letter.
5. The next launch runs the sweep. The harness reads the app's SQLite file read-only and hashes the files from the host (`kill/snapshot.mjs`), and `kill/oracle.mjs` judges the killed run, then audits the whole database: `PRAGMA integrity_check` is ok, no row points at a missing file, every stored hash matches its file, and every earlier run judged kept is judged again, so damage a later launch does is caught. The app never judges itself. Spoken DL-02 recordings are compared with the host's own hash of the fixture it placed.

**ADTS takes (ADR 0027, checks V1 and V2).** A DL-01 take is judged by its container, from its file name. An M4A plays when `afinfo` opens it, and its length is `afinfo`'s estimated duration. An ADTS take (`.aac`, once `RECORDING_CONTAINERS` flips iOS) must also open in `afinfo`, but its length is its whole frames (frames x 1024 / the sample rate in the frame header, 48000 for our takes), counted on the host with the app's own `scanAdts` (`src/lib/capture/adts.ts`, imported as it is by `kill/adts-evidence.mjs`): `afinfo` opens a cut-off ADTS stream and estimates a duration from its bytes whatever its frames are. For each kept ADTS take the report records the whole frames, the bytes after them and the `scanAdts` tail (`cut` or `none` after a kill; a `break` is printed as a FINDING to report before any flip), and prints check V1's evidence: the first 16 bytes as `xxd -l 16` shows them, `afinfo`'s output with its File line replaced, the first header's fields (`FF F1` or `FF F9`, AAC-LC, frequency index 3, channel configuration 1, no `ftyp` at offset 4; Core Audio writes `FF F9`, the MPEG-2 ID bit, and V1 accepts both) and the frame size distribution (minimum, mean, maximum; none over 7 + 768 bytes). This stored-path check is new and applies to every DL-01 take, whatever its container: the row's stored path must be the path of the take on disk. Both paths are normalized first (`file://` and `file://localhost` removed, percent-encoding decoded, `//`, `./` and `../` resolved). The same folder and file under Documents behind another container path is a note. A row that names another folder or file is a fail, since the host would be judging a file the app does not use. Frames from a silent input are silence's; V1's speech half needs a device run.

Markers live in `Library/Caches/kill-drill`, which the sweep never reads. Letters say only "Asha kill drill <run>", and spoken DL-02 letters use a generated tone (`afconvert` of a sine wave), never a voice.

**It cannot pass vacuously.** Before the real runs, on its own fresh install, the harness runs planted failures through the same seam: `loss` (the draft goes, the letter comes 3 s later), `double` (the letter is written and the draft kept) and, for DL-02, `damage` (one byte of the recording changed after a real save); for DL-01, the take's file removed, or two extra letters pointing at it. Each must come back as lost, doubled or fail; if one does not, the harness stops with exit 4 and runs nothing else. If the app does not start again after a planted kill, that is exit 1, and the plant counts as caught only if the database, read once the failed launch is gone, holds it as planted (for `damage`, with its recording changed). The real runs then start on a second fresh install. `apps/mobile/test/qa-kill-harness.test.ts` runs the loop, the oracle and the snapshot reader on Linux in `npm test`, against a fake app built on the app's own migrator and repositories that runs the app's own `runLaunchSweep` over a stand-in file system, so the fake has the app's listing rule: an app whose save is not one transaction fails (exit 1), an app that ignores the plants is blind (exit 4), a drill that never arms is incomplete (exit 3), an app that does not start after a kill fails (exit 1), and damage a later launch does is caught.

**Exit codes.** 0 every run kept its letter or take exactly once, the database checked clean after every relaunch and the self-check caught every plant; 1 a run lost, doubled or damaged one, the app did not start again after a kill (the report names the run, the seed and the kill time, and says whether the database survived: read once the failed launch is gone, with its integrity check and what it holds for that run, or why it was not read), or, for DL-01, fewer than 49 in 50 takes play to within 5 s (07); 2 usage or a refused setup; 3 incomplete (a timeout, no microphone, fewer runs judged than planned, an error in the harness, with its stage named); 4 the self-check missed a plant. Only 0 is green. Every exit after the arguments are accepted writes the report: `--out` (default `~/.scribe-kill/<mode>-<UTC time>`, never the repo) gets `report.json` and `report.md` (run numbers, outcomes and reasons; no ids, no words), also appended to the GitHub step summary.

**What a clean result proves.** With zero failures in n runs, the 95% upper bound on the loss rate per kill is about 3/n (rule of three; exactly 1 - 0.05^(1/n)). 500 clean random kills rule out a rate above 0.6% on the Simulator, and 50 clean kills above 5.8%; nothing proves "zero". Random DL-02 kills mostly land after the commit (a save takes a few milliseconds), which is why the crash-point runs exist: 50 clean runs at each point rule out above 5.8% at that point. The report prints these bounds for each stratum. Simulator and SE 3 results are different populations and are not pooled.

**What it needs.**
1. An e2e simulator build: release JavaScript, `EXPO_PUBLIC_E2E=1` and `EXPO_PUBLIC_APP_ENV=development` (the seam is compiled into no build whose app env is `preview` or `production`, so no TestFlight or App Store build carries it), and S20's wiring line in `app/_layout.tsx` (RA-20-18): `useE2eSeams();` as the first line of `Root()`, with `import { useE2eSeams } from '@/dev/e2e-seams';`. Without it the app never arms and every run times out (exit 3). Its bundle id is `com.earlyletters.scribe.dev`; the harness reads it from the `.app` and refuses any other. `ci/kill-harness.yml.example` builds it on the runner with `xcodebuild -configuration Release -sdk iphonesimulator`.
2. macOS with Xcode 26 and Node 22.18 or later (it imports the app's TypeScript frame scanner as it is; an older Node exits 2 and says so). A booted simulator: `xcrun simctl create kill-se3 "iPhone SE (3rd generation)"`.
3. For DL-01, a microphone input the simulator can record from, and one that hears nothing: the simulator records from the Mac's input for up to two minutes a run. **On a Mac, never in a family room:** install a silent virtual input (for example BlackHole), select it in System Settings > Sound > Input, then pass `--mic-silent`. Without the flag DL-01 refuses to start; the report records the name of the input it used. By default the harness uninstalls the app at the end, which deletes every drill recording. On a hosted runner the flag is safe, and the runner's simulator does record: `kill-harness.yml` selects BlackHole 2ch, and runs 40076982108, 40082148320, 40085126690 (M4A) and 40081955446 (ADTS, 50 takes) recorded from it. If a runner ever cannot, the drill writes `record_failed` and the harness exits 3, and DL-01 runs on the founder's Mac (AF-14).

```bash
# DL-02, the gate size: 500 random kills and 50 at each crash point (about 1 h [E])
node apps/mobile/e2e/kill/run-kill-harness.mjs --mode dl02 --udid <udid> --app /path/to/App.app --runs 500 --point-runs 50
# DL-01 (about 10 h [E] for 500): four shards of 125 on four simulators or runners, then merge
node apps/mobile/e2e/kill/run-kill-harness.mjs --mode dl01 --udid <udid-1> --app App.app --runs 125 --mic-silent --out /tmp/k1
#   ... the same for k2, k3, k4 ...
node apps/mobile/e2e/kill/run-kill-harness.mjs --merge /tmp/k1/report.json /tmp/k2/report.json /tmp/k3/report.json /tmp/k4/report.json
```
Other options: `--kind typed|spoken|spoken-unhashed|mixed` (DL-02, default mixed), `--point-runs N` (default runs/10), `--delay-ms A-B`, `--seed N`, `--self-check N` (planted runs of each kind, default 2), `--bundle-id` (must match the `.app`), `--keep-app`, `--json`. A bad number exits 2. A report's seed replays its delays only with the same `--self-check` value, because the plants draw from the same random stream first. `--merge` refuses a shard given twice and shards with other settings or another build.

**Evidence.** Each gate run gets a file under `docs/qa/evidence/` (`<date>-<build>-sim-kill.md`) with the two report summaries, the commit and the simulator; B2-11 in `docs/qa/ALPHA_GO_NO_GO.md` links it. A pass means kept and checked as above on the Simulator; the 50-run SE 3 set by hand (`docs/qa/run-sheets/AL-03-kill-during-save.md`) is the device half of the gate.

## Sources (opened 3 Oct 2026)

- Maestro docs (docs.maestro.dev): launchApp (`clearState`, `clearKeychain`, `stopApp`, `permissions`, `arguments`; iOS arguments arrive through UserDefaults), Permissions (default grants all; `unset` makes the system prompt appear), Nested flows, Conditions, Parameters and constants (`MAESTRO_` shell variables, defaults with `||`), JavaScript (GraalJS sandbox, `http`, `json`, `output`), Workspace configuration (`flows`, `includeTags`, `excludeTags`, `executionOrder`), Commands (`openLink`, `pressKey`, `stopApp`, `swipe`, `back`, `setAirplaneMode`, `setDarkMode`, `takeScreenshot`, `extendedWaitUntil`, `hideKeyboard`, `inputText`), CLI reference (`--udid`, `--format JUNIT`, `--include-tags`, `--test-output-dir`), install script (`MAESTRO_VERSION`).
- Maestro CLI 2.11.0 changelog (29 Sep 2026): https://techdevnotes.com/releases/maestro-cli/2.11.0
- Expo: "Run E2E tests on EAS Workflows with Maestro"; "Build for iOS Simulators"; "Development workflows"; SDK 57 changelog; "ios-scene-lifecycle" fyi; build server infrastructure (`sdk-57` image = Xcode 26.6).
- eas-cli 24.10.0 README (`build:list`, `build:run`, `submit`, `update:rollback`).
- Apple: "Setting up StoreKit Testing in Xcode"; Supabase SMTP guide (default SMTP sends only to the project team); Resend "Send test emails"; GitHub "GitHub-hosted runners" reference (`macos-26`, no nested virtualization).
- Installed source: `react-native@0.86.3` `Libraries/Settings` (reads `NSUserDefaults`); `@supabase/auth-js` 2.117.2 (`generateLink`, `/admin/generate_link`).
