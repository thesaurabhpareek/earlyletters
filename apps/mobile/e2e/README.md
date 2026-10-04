# End-to-end tests (Maestro, iOS simulator)

Owner: qa-e2e. Written 3 Oct 2026 against Maestro CLI 2.11.0 (released 29 Sep 2026), Expo SDK 57, EAS CLI 24.10.0. Plan of record: `docs/tdd/07-quality-test-strategy.md` section 3, updated here to today's product (decisions D-051 to D-070).

Labels: **V** verified on a vendor page or in installed source on 3 Oct 2026 (sources at the end). **A** assumption, to check on the first real run. Nothing here has been run yet: this machine is Linux, and the app has no testIDs (see section 1).

## 1. Status: what must happen before the first run

1. **testIDs and e2e seams in the app.** `apps/mobile/src` has no `testID` on any screen today, and no way to seed data, shift the clock, override remote config or force offline. The full request list is `TESTID_REQUESTS.md` (sections 1 to 3; owner of `apps/mobile/src/**` is mobile-polish this wave). Every flow fails at its first selector until then.
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
| E2E-11 | `E2E-11-analytics-consent.yaml` | Usage reports off by default, on, off, each surviving a relaunch; the consent sheet block is pending (not mounted in the app yet) | none |
| E2E-12 | `E2E-12-sign-in-email.yaml` | Email code sign-in, Terms with the 18+ line, sensitive-data consent; optional universal-link variant | backend |
| E2E-13 | `E2E-13a/b/c-*.yaml` + `bin/run-coparent.sh` | Co-parent invite round trip on two simulators: Mama invites, Papa joins through the 18+ gate and sign-in, Mama sees Papa | backend, 2 simulators |
| E2E-14 | `E2E-14-restore-purchases.yaml` | Apple's store view with the StoreKit file, a test purchase, Restore purchases | app run from Xcode |
| E2E-15 | `E2E-15-voiceover-smoke.yaml` | AX5 in light and dark: every P0 control reachable and enabled, screenshots for a human look; the VoiceOver walk is manual (DEVICE_TEST_PLAN S1-23) | offline |

Requirement and decision ids are in each flow's `tags`, so `maestro test --include-tags=PRD-REQ-019 ...` runs everything that proves one requirement, and a trace script can read them (TDD 07 2.1).

Folder layout: `flows/` (one file per flow), `subflows/` (launch, gate, first run, sign-in, settings, wait, go back, dev client), `scripts/` (Maestro JavaScript: backend guard, test user, sign-in code, deletion status), `bin/` (host scripts), `ci/` (a GitHub Actions sketch, not enabled), `config.yaml` (Maestro workspace).

## 3. Builds

### 3.1 The e2e build (what the suite gates on)
Release JavaScript on a simulator, with the e2e seams compiled in (request B-1):
```bash
cd apps/mobile
npx eas-cli@latest build --platform ios --profile e2e        # EAS builds the simulator .app
npx eas-cli@latest build:run --platform ios --profile e2e --latest --simulator "iPhone SE (3rd generation)"
```
`build:run` downloads the latest simulator build and installs it (V: eas-cli README). For the runner scripts, download the archive and pass the `.app` with `--app`. Bundle id: `com.earlyletters.scribe.preview` (`app.config.ts` suffix for the preview profile it extends); every flow reads it from `APP_ID`.

### 3.2 The quick authoring loop with an EAS development build
For writing or fixing one flow while the app code changes:
```bash
cd apps/mobile
npx eas-cli@latest build --platform ios --profile development-simulator   # request B-2; once per native change
npx eas-cli@latest build:run --platform ios --profile development-simulator --latest
npx expo start --dev-client                                               # Metro on :8081
# in a second terminal, from the repo root:
maestro test apps/mobile/e2e/flows/E2E-04-type-a-letter.yaml \
  -e APP_ID=com.earlyletters.scribe.dev -e E2E_DEV_CLIENT=1 -e METRO_URL=http://localhost:8081
```
With `E2E_DEV_CLIENT=1` the launch subflows open `exp+scribe://expo-development-client/?url=<Metro>` after every cold start (V: Expo "Development workflows": SDK 57 accepts only this legacy form; the scheme defaults to `exp+<slug>`). Differences from the e2e build, all by design: `__DEV__` is true and `devShortcutsAllowed` is true (`lib/build-env.ts`), so the Plus gate shows a dev Continue button and the sample transcriber may answer instead of "no words". Use this loop to author; gate only on the e2e build. `maestro test --continuous` (`-c`) re-runs the flow on every save (V: CLI reference).

## 4. Running on a Mac

### 4.1 One-time setup
- Xcode 26.x with an iOS 26 simulator runtime (EAS's `sdk-57` image is Xcode 26.6, V). `xcode-select --install`.
- Java 17 or newer (Maestro requirement, V). Maestro CLI pinned: `export MAESTRO_VERSION=2.11.0; curl -Ls "https://get.maestro.mobile.dev" | bash` (V: the install script honours `MAESTRO_VERSION`).
- Node 22 and `npm install` at the repo root.
- Simulators: `xcrun simctl create se3 "iPhone SE (3rd generation)"` and `xcrun simctl create i16 "iPhone 16"`; boot with `xcrun simctl boot <udid>`. Maestro drives simulators only: Maestro 2.11.0 rejects physical iPhones ("Physical iOS devices are not yet supported", V), so everything on a real phone is `docs/qa/DEVICE_TEST_PLAN.md`.
- `export MAESTRO_CLI_NO_ANALYTICS=true` (V: Maestro environment variables).

### 4.2 Backend variables (flows tagged needs-backend)
```bash
export MAESTRO_E2E_SUPABASE_URL=https://<e2e-ref>.supabase.co
export MAESTRO_E2E_PROJECT_REF=<e2e-ref>
export MAESTRO_E2E_SERVICE_KEY=<the e2e project's secret key>      # never staging or production
export MAESTRO_PROD_PROJECT_REF=<production ref>                    # scripts refuse it
```
Maestro passes shell variables that start with `MAESTRO_` into flows and scripts (V). `scripts/lib-guard.js` refuses any URL that is not the e2e project or `http://127.0.0.1`, any URL containing the production ref, and any email that is not a test address.

Sign-in codes (`scripts/fetch-otp.js`):
- `OTP_SOURCE=admin` (default): GoTrue's admin `generate_link` returns the 6-digit `email_otp` without sending mail (V-code: `@supabase/auth-js` 2.117.2). Proves the app's code path; mail delivery is a device check.
- `OTP_SOURCE=mailpit`: a local Supabase stack (`npx supabase start`, Docker on the Mac) catches mail in Mailpit on port 54324 (V: Supabase local development uses Mailpit), and the script reads the real email, template included. It needs a build that may reach `http://127.0.0.1:54321` (request B-7; never in preview or production).
- Test addresses: `delivered+<label>@resend.dev` (V: Resend test addresses accept `+label`; they count against the sending quota).

### 4.3 Commands
```bash
# One flow
maestro test apps/mobile/e2e/flows/E2E-02-first-run-twins.yaml -e APP_ID=com.earlyletters.scribe.preview
# The single-simulator suite, in order, with host checks between flows
apps/mobile/e2e/bin/run-suite.sh --udid <se3-udid> --app /path/to/EarlyLetters.app --junit
apps/mobile/e2e/bin/run-suite.sh --only E2E-05
# The co-parent round trip on two simulators
apps/mobile/e2e/bin/run-coparent.sh <udid-a> <udid-b> --app /path/to/EarlyLetters.app
# All flows proving one requirement
maestro test apps/mobile/e2e --include-tags=PRD-REQ-019 -e APP_ID=com.earlyletters.scribe.preview
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

## 8. What these flows do not cover (and where it is)

Real microphone audio and transcription speed, Sign in with Apple and Google sheets, mail clients and universal links from Mail and Messages, StoreKit sandbox and Family Sharing, notifications at their times, VoiceOver itself, export opening on Mac and Windows, app size, haptics, fonts and AUSoundIsolation: all in `docs/qa/DEVICE_TEST_PLAN.md`. Access rules, deletion purge and sync parity: `supabase/tests`. Pure logic: `npm test`.

## Sources (opened 3 Oct 2026)

- Maestro docs (docs.maestro.dev): launchApp (`clearState`, `clearKeychain`, `stopApp`, `permissions`, `arguments`; iOS arguments arrive through UserDefaults), Permissions (default grants all; `unset` makes the system prompt appear), Nested flows, Conditions, Parameters and constants (`MAESTRO_` shell variables, defaults with `||`), JavaScript (GraalJS sandbox, `http`, `json`, `output`), Workspace configuration (`flows`, `includeTags`, `excludeTags`, `executionOrder`), Commands (`openLink`, `pressKey`, `stopApp`, `swipe`, `back`, `setAirplaneMode`, `setDarkMode`, `takeScreenshot`, `extendedWaitUntil`, `hideKeyboard`, `inputText`), CLI reference (`--udid`, `--format JUNIT`, `--include-tags`, `--test-output-dir`), install script (`MAESTRO_VERSION`).
- Maestro CLI 2.11.0 changelog (29 Sep 2026): https://techdevnotes.com/releases/maestro-cli/2.11.0
- Expo: "Run E2E tests on EAS Workflows with Maestro"; "Build for iOS Simulators"; "Development workflows"; SDK 57 changelog; "ios-scene-lifecycle" fyi; build server infrastructure (`sdk-57` image = Xcode 26.6).
- eas-cli 24.10.0 README (`build:list`, `build:run`, `submit`, `update:rollback`).
- Apple: "Setting up StoreKit Testing in Xcode"; Supabase SMTP guide (default SMTP sends only to the project team); Resend "Send test emails"; GitHub "GitHub-hosted runners" reference (`macos-26`, no nested virtualization).
- Installed source: `react-native@0.86.3` `Libraries/Settings` (reads `NSUserDefaults`); `@supabase/auth-js` 2.117.2 (`generateLink`, `/admin/generate_link`).
