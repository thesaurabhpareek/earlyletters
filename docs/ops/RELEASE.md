# Release train: from a merged wave to the App Store

Owner: qa-e2e (writer) for the coordinator, who runs the train, and the founder, who approves every irreversible step (COORDINATION section 1). Version 1.0, 13 Oct 2026.
Inputs: `docs/agents/COORDINATION.md` 6, `docs/DECISIONS.md` (D-004, D-041, D-045, D-053, D-060, D-064 to D-067), `docs/ROADMAP.md` 2.1, `docs/FOUNDER_TASKS.md`, TDD 07 sections 9 to 11, `supabase/APPLY.md`, `scripts/packs/publish.ts` and ADR 0016 section 7, `docs/ops/AUTH_SETUP.md`, `docs/ops/APP_STORE_CONNECT_SUBSCRIPTIONS.md`, `docs/ops/APP_SIZE.md`, `docs/legal/app-store-privacy-labels.md`, `docs/store/app-store.md`, `docs/qa/DEVICE_TEST_PLAN.md` 1.1.

Labels: **V** verified on a vendor page on the date given (sources at the end); **A** assumption, check when you get there; **F** fact found in this repo. Apple's and Expo's screens move; if a label below differs, follow the screen and fix this file.

## 0. The train on one page

```
wave branch auto/<date>-<topic>  --(coordinator: all checks green)-->  develop
develop  --(release PR, founder approves)-->  main  --(tag ios-vX.Y.Z)-->  EAS production build
EAS build  --(eas submit)-->  App Store Connect  -->  TestFlight internal (C0)  -->  external group, Beta App Review (C1)
release candidate  --(DEVICE_TEST_PLAN, section 6 checklist)-->  submit for App Review, manual release
approved  -->  release (v1.0.0: all at once; updates: phased over 7 days)
alongside, never inside the binary:  migrations (APPLY.md order, founder)  |  packs, config, content (scripts/packs, founder's key)
```

Dates for v1.0 (ROADMAP 2.1): C0 Wed 14 Oct, Beta App Review submitted Thu 15 Oct, C1 Mon 19 Oct, feature freeze Mon 26 Oct, C1 exit and counsel sign-off Thu 29 Oct, tag `ios-v1.0.0` Fri 30 Oct, submit Mon 2 Nov (Fri 6 Nov latest), release planned Mon 16 Nov with 9 to 20 Nov as the buffer.

Who does what:

| Step | Who | Never |
|---|---|---|
| Code, tests, docs on a wave branch | agents | agents never commit, push, build, submit, publish or apply (COORDINATION 6) |
| Merge to `develop`, open the release PR, tag, run builds and submissions | coordinator | no build from an untagged commit for TestFlight or the App Store |
| Approve the release PR, the submission, live migrations, pack and config publishing, legal text going public | founder | no secret in a chat, issue, repo or email (FOUNDER_TASKS) |

## 1. Branches, tags and CI gates

### 1.1 Branches (F: COORDINATION 6, CLAUDE.md)
- `main`: always releasable; changes only through a release PR from `develop` (or a hotfix PR, 1.4) that the founder approves.
- `develop`: integration. Each agent wave lands on `auto/<date>-<topic>` first; the coordinator runs every check and merges.
- Human branches: `feat/<area>-<what>`, `fix/<what>`, `chore/<what>`, `docs/<what>`, `exp/<what>`. One concern per pull request.
- `release/<x.y.z>` is **not** used for v1.0: feature freeze happens on `develop` (Mon 26 Oct) and fixes go there. Cut a `release/<x.y.z>` branch from `develop` only when work for the next version must merge before the current one ships (A: not before v1.1).

### 1.2 Tags (F: CLAUDE.md, COORDINATION 6)
- `ios-v<major>.<minor>.<patch>` on the merge commit on `main`, annotated: `git tag -a ios-v1.0.0 -m "Early Letters 1.0.0" && git push origin ios-v1.0.0` (coordinator).
- The tag's version equals `version` in `apps/mobile/app.config.ts` (F: `'1.0.0'` today). The build number is not in the tag (2.2).
- Release candidates for TestFlight before the final tag: `ios-v1.0.0-rc.<n>` (A: proposed here; it keeps "EAS builds come only from tagged commits" true for C0 and C1 builds as well).

### 1.3 CI gates (F: `.github/workflows/ci.yml`, `migration-guard.yml`; TDD 07 9.1)

| Gate | When | Must pass | Status today |
|---|---|---|---|
| G0 pull request | every PR to `develop` or `main` | `required` (install, `npm test` with content rules, `npm run test:db`, `npm run test:functions`, typecheck incl. `apps/mobile` `tsc`) and `applied migrations unchanged` | built (F) |
| G1 `main` | merge to `main` | G0 on the merge commit | built (F); branch protection is FT-20 |
| G2 internal TestFlight | any build to C0 | G1, `node apps/mobile/e2e/bin/lint-flows.mjs`, DEVICE_TEST_PLAN TF-04 smoke on the SE 3 | Maestro suite not runnable yet (seams and some testIDs missing, `apps/mobile/e2e/TESTID_REQUESTS.md`); until then G2 is the manual smoke |
| G3 external TestFlight | first C1 build, then every C1 build | G2, the C1 column of DEVICE_TEST_PLAN's ordered checklist, in particular S1-08b (hijack fix) and TF-10 (privacy manifest); staging deletion run (`docs/ops/README.md` step 7) | manual |
| G4 submission | `ios-v*` tag | G3, every PRD 6 line with evidence on SE 3 and a current iPhone, kill during save 500 times, S1-17 for every listed language, section 6 checklist, no open S0 or S1 | manual |
| G5 after release | phased release days 1 to 7 | crash-free sessions 99.8% and users 99.5% (App Store Connect metrics), no data-loss report; pause on any S0 | manual |

The macOS E2E job is a sketch (`apps/mobile/e2e/ci/ios-e2e.yml.example`), not enabled; the coordinator moves it to `.github/workflows/` when the seams exist.

### 1.4 Hotfix
1. `fix/<what>` from the release tag (`git switch -c fix/<what> ios-v1.0.0`).
2. Bump `version` in `app.config.ts` to the next patch (`1.0.1`); build numbers keep increasing on their own (2.2).
3. PR to `main` (G0), founder approves, tag `ios-v1.0.1`, build, TestFlight smoke (TF-04), submit; ask for an expedited review if it fixes a critical bug (7.3).
4. Merge `main` back into `develop` the same day.

## 2. Versions and build numbers

### 2.1 What each number is
| Number | Where | Who changes it |
|---|---|---|
| Marketing version (`CFBundleShortVersionString`) | `version` in `apps/mobile/app.config.ts` | the coordinator, in the release PR, for every App Store version (V: Expo "App version management": set it explicitly for each store release) |
| Build number (`CFBundleVersion`) | EAS servers | EAS, automatically (2.2) |
| Runtime version | not used: no `expo-updates` (section 8) | n/a |

### 2.2 Remote build numbers (F: `eas.json`)
`cli.appVersionSource` is `remote` and the `production` profile has `autoIncrement: true` (F). EAS stores the iOS build number and bumps it on every production build, which avoids the common rejection for a duplicate build number (V: Expo "App version management", remote version source recommended from EAS CLI 12). Never set `ios.buildNumber` in `app.config.ts`. To see or set it: `npx eas-cli build:version:get -p ios` and `build:version:set` (A: command names from the EAS CLI reference).

## 3. EAS: project, profiles, variables, image

### 3.1 `eas init` (once; founder, FT-17)
```bash
cd apps/mobile
npx eas-cli@latest login            # Expo account with two-factor (FT-02)
npx eas-cli@latest init             # creates or links the EAS project for slug "scribe"
```
`eas init` creates or links a project (V: EAS CLI reference, flags `--id`, `--force`, `--non-interactive`). Our config is dynamic (`app.config.ts`, F), so EAS cannot write the id into it by itself (A: Expo forum "EAS project ID with dynamic configuration"). The founder sends the printed `projectId` to the coordinator, who adds it in `app.config.ts` as `extra.eas.projectId` (and `owner`) in a PR (BL-339, TESTID_REQUESTS B-6). Re-run `npx eas-cli init --id <projectId>` on any new machine.

### 3.2 Profiles (F: `eas.json` today; requests from TESTID_REQUESTS B-1 to B-3)

| Profile | Bundle id | Distribution | Use | Status |
|---|---|---|---|---|
| `development` | `com.earlyletters.scribe.dev` | internal (ad hoc, registered devices) | dev client on the founder's phones; device spikes with Instruments (S1-17) | exists |
| `preview` | `com.earlyletters.scribe.preview` | internal | release JavaScript for timing and most device checks; no StoreKit products | exists |
| `production` | `com.earlyletters.scribe` | store (default) | TestFlight C0 and C1, App Store | exists, `autoIncrement: true` |
| `e2e` | `.preview` | simulator, `withoutCredentials` | Maestro suite (`EXPO_PUBLIC_E2E=1`) | requested (B-1) |
| `development-simulator` | `.dev` | simulator | Maestro authoring loop | requested (B-2) |

Requested change for every iOS profile (B-3): `"ios": { "image": "sdk-57" }`. Today `sdk-57` is `macos-tahoe-26.5-xcode-26.6`, while `latest` has moved on and Xcode 27 images exist (`macos-tahoe-26.6-xcode-27.0` is `sdk-58`) (V: Expo "Build server infrastructure", opened 13 Oct 2026). Pinning keeps the v1.0 build on the Xcode the app was tested with. Xcode 26 meets Apple's upload minimum (V: Apple "Upcoming requirements": since 28 Apr 2026, apps uploaded must be built with Xcode 26 or later and the iOS 26 SDK).

Requested submit profile (A: values come from the founder after FT-08):
```json
"submit": {
  "production": {
    "ios": { "ascAppId": "<Apple ID number of the app, App Store Connect > App Information>", "appleTeamId": "<Team ID>", "groups": ["C0 family"] }
  }
}
```
`ascAppId` and `appleTeamId` are documented `submit.production.ios` keys, and `groups` adds the build to TestFlight internal groups (V: Expo "Configure with eas.json"). Neither id is a secret, but they are written only after the founder confirms them.

### 3.3 Build variables
Public values only (`EXPO_PUBLIC_*`), per environment, set by the founder in EAS (FT-17), never in the repo: `npx eas-cli env:set --name <NAME> --value <value> --environment production --visibility plaintext` (V: Expo "Environment variables"), and the profile names its environment (`"environment": "production"`). The list is AUTH_SETUP section 8 plus `EXPO_PUBLIC_EMAIL_OTP_LENGTH=8` (G-05), `EXPO_PUBLIC_POSTHOG_KEY` and `EXPO_PUBLIC_POSTHOG_HOST` once FT-24 is done (or left out entirely if analytics is cut, ROADMAP 6). The Supabase **secret** key never goes into EAS.

### 3.4 The build commands (coordinator, from a tag)
```bash
git switch --detach ios-v1.0.0-rc.1
cd apps/mobile
npx eas-cli@latest build --platform ios --profile production      # store build, build number bumped by EAS
npx eas-cli@latest submit --platform ios --latest                   # uploads to App Store Connect (TestFlight)
```
`eas submit` uploads the build; it shows in TestFlight after processing (V: Expo "Submit to the Apple App Store", "usually 10-15 minutes"). Record the build id, build number and commit in the release notes (section 12).

## 4. Signing with an individual developer account

- **Account:** the founder's individual Apple Developer Program membership (D-004, D-064). Only the Account Holder accepts agreements, sets up Paid Apps, tax and bank (APP_STORE_CONNECT_SUBSCRIPTIONS step 1); the seller name on the App Store is the founder's legal name (D-004).
- **Let EAS manage the credentials.** On the first `eas build`, sign in with the Apple Account when asked; EAS creates and stores the distribution certificate and one provisioning profile per bundle id (V: Expo "App credentials": the three iOS credentials are the distribution certificate, provisioning profiles and push notification keys; profiles expire after 12 months, which does not affect apps already on the store; a new one is made on the next `eas build`). Inspect with `npx eas-cli credentials -p ios`.
- **Capabilities:** EAS enables the entitlements in the config on the App ID during the build (Sign in with Apple, Associated Domains; DEVICE_TEST_PLAN S1-06 turns that Assumption into V). Check the App ID in Certificates, Identifiers & Profiles after the first build (AUTH_SETUP 2.1).
- **No push key.** The app schedules only local notifications (reminders and plan reminders); no remote push entitlement is configured (F: no `expo-notifications` plugin entry in `app.config.ts`; A: confirm no `aps-environment` in the built entitlements, TF-10 step (a)).
- **Internal builds** (`development`, `preview`) are ad hoc: each iPhone is registered first (`npx eas-cli device:create`), then a new build includes it (DEVICE_TEST_PLAN P-02).
- **App Store Connect API key for `eas submit`:** made through `eas credentials` (App Store Connect: Manage your API Key) so later submissions are non-interactive (V: Expo "Submit to the Apple App Store"); creating team keys is an Account Holder or Admin action (A). It never leaves EAS and the founder's password manager.
- **The Sign in with Apple `.p8` key** used by `apple-token` and the purge worker is a different key with a different job (AUTH_SETUP 2.4 and 2.7, SECURITY.md 5). It is not a signing credential.
- **If the account later moves to an organisation** (D-004 triggers), Apple's app transfer applies; signing assets are re-created in the new team (DECISIONS D-004 point 5).

## 5. TestFlight

### 5.1 Facts that shape the plan (V: Apple App Store Connect Help and Expo "TestFlight", opened 13 Oct 2026)
| | Internal (C0) | External (C1) |
|---|---|---|
| Who | up to 100 App Store Connect users on the team | up to 10,000 people by email or public link |
| Review | none; available after processing | Beta App Review for the first build of each version; later builds may not need a full review |
| Required test information | none | beta app description, feedback email (and contact information) |
| Build life | 90 days from upload | 90 days |
| Other | an internal group must exist before an external one; up to six builds to TestFlight App Review in 24 hours | testers need the TestFlight app |
Purchases in TestFlight run in the sandbox; subscriptions renew every day, up to six times in a week (V: "Subscription renewal rate in TestFlight").

### 5.2 C0: internal testing (from Wed 14 Oct)
1. App Store Connect > Users and Access: add each founding-family adult as a user with the least role that allows TestFlight (A: "Customer Support" or "Developer"; check what the screen offers). An internal tester must be an App Store Connect user (V). If that is too much access for someone, put them in the C1 external group instead.
2. TestFlight > Internal Testing > group `C0 family`; turn on automatic distribution (A: optional).
3. Each build: `eas submit` (3.4), wait for processing, run TF-04 (15-minute smoke) on the SE 3 before telling the family.
4. Tester note (first build, by email outside TestFlight): what to try, that letters stay on their phone and in their own iPhone backup, "please don't send screenshots of letters through TestFlight feedback; use Settings, Help instead", and that this build can make mistakes (D-060 in-app note). TDD 07 OQ-4 is still open: TestFlight screenshot feedback can carry letter text.

### 5.3 C1: external testing through Beta App Review (submit Thu 15 Oct, start Mon 19 Oct)
1. Before submitting: the legal pages are live at the URLs the app links to (FT-31), the AASA file serves `/i` with the fragment pattern (AUTH_SETUP 5.2), the security fixes G-01 to G-04 are in the build and S1-08b passed, TF-10 shows a complete privacy manifest.
2. TestFlight > External Testing > new group `C1 families` (an internal group must already exist, V).
3. Test Information: beta app description (a family memory journal you fill by talking; no health service; matches D-004 positioning), feedback email `hello@earlyletters.com`, contact details, privacy policy URL (A: asked for external testing), and the review sign-in: the demo account from 6.4 (it is the same account App Review will use later).
4. Add the build to the group and submit for review. At most six builds per 24 hours (V). The first build of the version gets a full review (V); plan for about a day (A; App Review generally reviews 90% of submissions within 48 hours, V: "App Review" page).
5. When approved, invite the 15 to 25 families by email (FT-26, FT-32), never a public link before submission (D-045).
6. Never call the build "beta" in App Store text; TestFlight's own description is fine (D-060).

### 5.4 Cohort exits
As DEVICE_TEST_PLAN TF-09: C0 to C1 needs no open S0, crash-free sessions 99.5% or more, S1-13 passed, TF-04 green; C1 to submission needs no open S0 or S1, crash-free sessions 99.8% or more, no fidelity complaint traced to a machine edit, one co-parent pair through the invite unaided, S1-17 accepted for every listed language, size under 40 MB, section 6 complete.

## 6. Submission checklist (FT-43, FT-45)

Tick every line in the release PR's description with the evidence file it rests on. Anything unticked stops submission.

### 6.1 Privacy: labels, manifest, policy
- [ ] App Privacy answers entered from `docs/legal/app-store-privacy-labels.md` 1.2 with the Q-005 answer applied in 1.2, 1.4 and 3.3 together (legal owner and counsel, FT-33).
- [ ] The section 5 consistency checklist in that file is complete for this exact build (no new SDK, no audio upload, no photos, no crash SDK, `child-input` flag off).
- [ ] TF-10 passed on this build: `PrivacyInfo.xcprivacy` in the app matches labels 3.3 (built from `apps/mobile/src/lib/privacy-manifest.ts`, G-23), every listed SDK carries its own, no ITMS-91053 email after upload. Apple rejects uploads that use required-reason APIs without declared reasons (labels doc 3.1, V there).
- [ ] Privacy Policy URL in App Store Connect is `https://earlyletters.com/privacy` and serves the version the app links to; the Consumer Health Data Privacy Policy link is in the description (G-21).

### 6.2 Age rating: override to 18+
- [ ] App Information > Age Ratings > Set Up Age Ratings: answer the questionnaire truthfully (no mature content), then in **Age Categories and Override** choose **Override to Higher Age Rating** and select **18+**, Save (V: Apple "Set an app age rating"; ratings are 4+, 9+, 13+, 16+, 18+). Required here because our Terms require adults: "If your app has a EULA with minimum age requirements exceeding Apple's calculated rating, you must override" (V, same page). The override applies in every region; content descriptions still reflect the questionnaire (V).
- [ ] Not in the Kids Category; category **Lifestyle**, never Health or Medical (D-004 point 4, PRD 6.7).

### 6.3 Listing, territory, screenshots
- [ ] Listing text from `docs/store/app-store.md`: no "beta" (D-060, rules test), only the languages that passed FT-34, no printed-book claim (K-32), no other platform named (2.3.10).
- [ ] Availability: United States only (LEGAL-REQ-058), for the app and both subscriptions.
- [ ] Screenshots from a release build with the fictional family only (FT-38, BL-340): 1 to 10 iPhone screenshots; supply the 6.9-inch size (1260 x 2736, 1290 x 2796 or 1320 x 2868 portrait) or the 6.5-inch size (1284 x 2778); iPad screenshots are not required because the app does not run natively on iPad (`supportsTablet: false`, F) (V: Apple "Screenshot specifications").
- [ ] Each subscription has its review screenshot and is attached to this version (the first subscription ships with an app version, APP_STORE_CONNECT_SUBSCRIPTIONS step 8).

### 6.4 App Review information and the demo account
- [ ] **Contact information** (name, email, phone in international format) and **Notes** (at most 4,000 bytes) (V: Apple "Platform version information").
- [ ] **Sign-in required**: a demo account that does not expire (V, same page). Ours, on **production** (FT-23 says production gets no fixture data except this account):
  - Created by the coordinator with the founder: an email address on our domain reserved for review (for example `appreview@earlyletters.com`, A: alias to be made in FT-13); sign in once with the app's email code, answer the gate, accept Terms and sensitive data, then load the fictional family "Asha" only (child Asha, signs as Mama, a handful of typed and spoken letters with fictional words, no real name, photo, voice or date of anyone; CLAUDE.md privacy rules). Never copy a family's data.
  - Because sign-in is by email code, App Review cannot receive the code: either (a) the account uses Sign in with Apple through Apple's own review account (A: not possible to share), or (b) the notes explain "Sign in is optional: everything can be reviewed signed out. To see sync, use Continue with email with <address>; the code arrives at that address" and the founder watches that inbox during review and answers within an hour (A: the usual practice; App Review asks for "login credentials", V, Guidelines "Before You Submit"). Recommended: (b), and make the notes say clearly that recording, the book, export, deletion and Plus are reachable without an account.
  - Keep the account. Do not delete it after review; it is reused for every version.
- [ ] **Notes** (draft; BL-341, legal and content owners finalize): a family memory journal parents fill by talking or typing; letters stay on the phone unless the parent signs in to sync with a co-parent; answer Yes to the 18+ question; how to reach Plus (Settings, Children, Add a child; or Read together more than 3 times; from APP_STORE_CONNECT_SUBSCRIPTIONS step 8); speech models and language packs download as data after a language is chosen, checked against a signed manifest, and contain no code (guideline 2.5.2: apps may not "download, install, or execute code which introduces or changes features or functionality", V); account deletion is in Settings, Delete account (5.1.1(v)); a due date is optional and nothing is a health service (D-004 5.1.1(ix) positioning). Describe every feature specifically; generic notes are rejected under 2.3.1(a) (V).

### 6.5 Export compliance (encryption)
- [ ] `ITSAppUsesNonExemptEncryption` is `false` in the build's Info.plist (request B-4: `ios.infoPlist.ITSAppUsesNonExemptEncryption = false` in `app.config.ts`). Set it to NO only if the app, including its libraries, uses no encryption or only exempt encryption; without the key App Store Connect asks the export compliance questions on every upload (V: Apple `ITSAppUsesNonExemptEncryption`). Encryption built into the operating system, such as HTTPS through `URLSession`, is typically exempt; proprietary encryption is not (V: Apple "Complying with Encryption Export Regulations").
- [ ] Founder confirms the facts before the key is set (F, checked 13 Oct): the app uses HTTPS (system networking), the Keychain and iOS Data Protection, SHA-256 hashing (CryptoKit in `scribe-audio`, `expo-crypto`) and Ed25519 signature **verification** of packs and config (`@noble/ed25519` in `packages/api`). No app-level encryption of user content ships in v1.0 (the AES-GCM wrapping of Apple tokens runs in an Edge Function on the server, not in the app). Authentication, hashing and signature checks are generally exempt (A: confirm against Apple's "Determine and upload app encryption documentation" page and with counsel if unsure). If any of this changes (for example encrypted backup, ADR 0006), revisit.
- [ ] Apple notes that apps using exempt encryption may still owe a year-end self-classification report to the US government (V: same Apple page, links the BIS guidance). Founder asks counsel whether it applies (A: US-only distribution may change the answer); add to FT-47's counsel batch.

### 6.6 Content rights
- [ ] App Information > Content Rights: answer whether the app "contain[s], show[s], or access[es] third-party content" (V: Apple "App information"). Our answer (A, founder confirms): the app shows the user's own content; bundled fonts (Literata, Mukta, Tiro Devanagari Hindi, OFL) and the open speech models (licences in ADR 0015, listed in Settings, Licences) are used under their licences. If the screen asks yes or no, answer **No** unless counsel reads "third-party content" to include the model weights, in which case **Yes** with the licences as the basis.

### 6.7 Release option
- [ ] Version Release: **Manually release this version** (status becomes Pending Developer Release after approval, V: Apple "Platform version information"). For 1.0 phased release does not exist (section 7).

### 6.8 The binary
- [ ] Built from the `ios-v1.0.0` tag with the `production` profile and the pinned image (3.2); build number recorded.
- [ ] App size: largest variant download under 40 MB from App Store Connect's numbers or the App Thinning Size Report (`npx tsx scripts/size/measure.ts --thinning-report ...`, `docs/ops/APP_SIZE.md`; DEVICE_TEST_PLAN TF-01).
- [ ] The production bundle has no e2e seam strings (`grep -c e2eSeed main.jsbundle` is 0, TESTID_REQUESTS B-8) and no `example.com`.
- [ ] Production Supabase has every migration through the newest the build needs (section 10), the beta or 1.0.0 policy versions, the pepper set, functions deployed (`purge-worker`, `analytics-forget`, `config`, `content`, `apple-token`).
- [ ] The public signing key in `packages/api/src/keys.ts` is the founder's real key (BL-335), and the config, manifest and content published with it are live (section 9).

## 7. Release and phased release

### 7.1 Version 1.0.0
Phased release is available only for version updates, not for the first release (V: Apple "Release a version update in phases"). So 1.0.0 goes to everyone at once, by hand, on the planned day (Mon 16 Nov), after the launch-week switches (FT-49). Watch App Store Connect crashes and the support inbox for the first 48 hours (G5).

### 7.2 Updates (1.0.1 and later): phased by default
- Choose **Phased Release for Automatic Updates** on the version page before submitting (V: "Platform version information"). Apple releases to 1%, 2%, 5%, 10%, 20%, 50% and 100% of people with automatic updates on, over 7 days; anyone can still download it by hand at any time (V: "Release a version update in phases").
- Pause on any S0 or a crash-free rate under the G5 numbers. Pauses can total 30 days, any number of times (V). Release to all users early only when G5 holds for 3 days (A: our rule).
- Phased release does not limit who gets server-side changes (config, packs, migrations); stage those separately (sections 9 and 10).

### 7.3 Expedited review
For a critical bug fix, request an expedited review (V: Apple "App Review": "fixing a critical bug in your app"). Use it for S0 only.

## 8. Over-the-air (OTA) policy

- **v1.0 ships with no OTA JavaScript updates.** `expo-updates` is not a dependency (F: `apps/mobile/package.json`), and no `runtimeVersion` or `channel` is configured. Every code change is a new binary through this train. Reasons: TDD 07 9.1 requires the same gates for an OTA as for an external build; App Review guideline 2.5.2 forbids downloading code that changes features (V); and the founder's quality bar favours one reviewed binary per change.
- **What does change without a release** (decision 16, D-066, ADR 0016): signed, versioned data only: remote config and kill switches, pack manifests and language packs, prompts, tips and story cards. Never anything that changes data collection, the paywall, the 18+ gate or consent (ADR 0016 5.3). These go through section 9.
- **If OTA is adopted later** (a decision entry first): add `expo-updates` with a `runtimeVersion` policy so an update only reaches binaries with matching native code (V: Expo "Runtime versions"); publish per channel (`production`) with a rollout percentage, starting at 10% (V: Expo "Rollouts": `eas update --rollout-percentage`, revert with `eas update:revert-update-rollout`); run G3 on the exact update bundle; never change consent, gate, paywall or data collection by OTA; sign updates (Expo code signing) (A: not configured).

## 9. Packs, remote config and content publishing

Signed and published only by the coordinator, with the founder's OK and the founder's key (COORDINATION 6, ADR 0016 7). The secret key lives only in the founder's password manager.

1. Once: `npx tsx scripts/packs/keygen.ts`; the public key line goes into `packages/api/src/keys.ts` (BL-335) **before** the first TestFlight build, or no phone trusts anything published (FT-16).
2. Each publish, on the founder's machine:
   ```bash
   export EL_SIGNING_KEY=...  EL_SIGNING_KEY_ID=...        # from the password manager, this shell only
   npx tsx scripts/packs/publish.ts packs   --base-url https://packs.<Q-001 host> --min-app 1.0.0
   npx tsx scripts/packs/publish.ts config  [--kill <switch>] [--unkill <switch>]
   npx tsx scripts/packs/publish.ts content
   ```
   The script validates every text pack, writes `dist/packs/`, signs the manifest, config and content, checks each signature the way a phone does, bumps each document's version by one and rewrites `supabase/functions/{config,content}/published.ts`. It uploads and deploys nothing; it prints the commands (F: `scripts/packs/publish.ts`).
3. Run the printed upload commands (`wrangler r2 object put` up to 300 MB, `rclone copyto` above, F) and deploy: `npx supabase functions deploy config --no-verify-jwt --use-api` and the same for `content`.
4. Commit the changed `published.ts` and `scripts/packs/remote-config.json` in a PR the same day: git history is the audit log of what was served (C-NFR-009).
5. Staging first, then production, with one phone checking each (DEVICE_TEST_PLAN S1-16 for packs; a kill switch reaches an open app within about 5 minutes, ADR 0016 6).
6. Kill switches available today (F: `remote-config.json`): `sync`, `invites`, `photos`, `packDownloads`, `serverContent`. `readTogetherFreeSessions` may only be raised (D-009). `forceReauthEpoch` signs everyone out once (G-06; use only for a security incident).

## 10. Database migrations: apply order

The founder applies live migrations by hand, staging first, in `supabase/APPLY.md` order; each applied file is added to `.github/migrations-applied.txt` in a PR, and an applied file is never edited (F: COORDINATION 6, migration guard). D-041's "migrations only from CI on a tag" is not built, so APPLY.md is the procedure.

| Order | File | APPLY.md | Needed by |
|---|---|---|---|
| 1, 2 | `20260930000000_scribe_core`, `20261001000000_scribe_hardening` | applied | n/a |
| 3, 4 | `20261002010000_entries_select_policy`, `20261002020000_data_governance` | steps 1 to 5; **step 6 pepper before anything deletes** | every build |
| 5 to 7 | `20261003000000_security_and_family`, `20261003010000_children_and_entitlements`, `20261003020000_purge_batching` | steps 8 to 13 (policy versions first) | every build |
| 8 to 11 | `20261004000000_plus_on_device_only`, `20261004100000_sync_engine`, `20261004200000_ops_deletion_worker`, `20261004300000_insights_aggregates` | steps 14 to 16 | every build |
| 12 | `20261005000000_family_cap_language_idempotency` | steps 17 to 19 | **must be live before a fix-wave build talks to the project**: the build sends sync field group `language`, which older servers refuse (mobile-fix, BOARD 21:41) |
| 13 | `20261005100000_db_fix_privacy_limits` | steps 20 to 22 (pepper check first) | the fix-wave build (`peek_invite` for ask-before-joining, G-02) |
| 14 | `20261005200000_insights_differencing` | **no APPLY.md section yet** (platform-fix's text is with the coordinator) | insights only; not blocking a build |

Rules for a release:
- Migrations go out **before** the build that needs them, never after; every file so far is additive for older builds (APPLY.md "App compatibility" notes).
- Staging gets the same files a day before production; DEVICE_TEST_PLAN runs against staging.
- A migration that a live build cannot survive needs a new binary first and a written two-step plan; none exists today.
- Production for C0 was due Tue 13 Oct (FT-23); production uses a new pepper and its own secrets.

## 11. Rollback, by layer

| Layer | How to undo | Time | Notes |
|---|---|---|---|
| App Store binary | There is no rollback to an older binary. Pause the phased release (updates only, 7.2), fix forward with a higher version and request an expedited review (7.3). For a release that must stop being downloaded, remove the app from sale in App Store Connect Pricing and Availability (A: menu name) | hours to days | Keep each release small for this reason |
| TestFlight build | Expire the build in TestFlight; testers keep what they installed until it expires (A) | minutes | |
| Behaviour that has a kill switch | `publish.ts config --kill <switch>`, deploy `config` | about 5 minutes to open apps (ADR 0016 6) | Sync off never deletes anything on phones |
| Remote config, content, pack manifest | Phones refuse a lower version (F: G-18 also refuses a different body at the same version), so "rollback" means re-signing the previous content at version + 1 and deploying | minutes | Old pack files stay on R2 at immutable paths, so a manifest can point back at them |
| Database | Fix forward. Each APPLY.md section has a tested rollback for its own file where one is safe; restore from backup only per `docs/ops/runbooks/restore-drill.md`, then `sync_begin_epoch` so phones re-upload | hours | Never edit an applied file |
| Edge Functions | `npx supabase functions deploy <name>` from the previous tag's commit | minutes | |
| Website, AASA, legal pages | Website thread redeploys the previous version on Vercel (A: instant rollback); a broken AASA stops universal links for up to about a day while Apple's CDN refreshes (AUTH_SETUP 5.2) | minutes, plus CDN | Coordinate on the board first (COORDINATION 6) |

## 12. Per-release checklist (copy into the release PR)

```markdown
Release ios-vX.Y.Z (build N), commit <sha>
- [ ] develop green (G0) and merged; release PR approved by the founder; tag pushed
- [ ] Migrations needed by this build are live on staging and production (RELEASE 10); migrations-applied.txt updated
- [ ] Packs, config, content published and committed if changed (RELEASE 9)
- [ ] EAS production build from the tag, image sdk-57; build number recorded
- [ ] Size: largest download under 40 MB (APP_SIZE)
- [ ] TF-04 smoke on SE 3; TF-10 privacy manifest; TF-03 update over the previous build
- [ ] DEVICE_TEST_PLAN items for this milestone: evidence file <path>
- [ ] Submission checklist RELEASE 6.1 to 6.8 (first version and any version that changes data collection, age rating, screenshots or subscriptions)
- [ ] Release option: manual (1.0) or phased (updates)
- [ ] After release: G5 watch for 7 days; DECISIONS go/no-go note (coordinator)
```

## Facts and assumptions

| Statement | Status |
|---|---|
| Age rating values 4+, 9+, 13+, 16+, 18+; Override to Higher Age Rating; a EULA with a higher minimum age requires the override | V, Apple "Set an app age rating", opened 13 Oct 2026 |
| Phased release: 7 days, 1/2/5/10/20/50/100%, pauses up to 30 days, updates only, manual downloads always possible | V, Apple "Release a version update in phases", 13 Oct 2026 |
| `ITSAppUsesNonExemptEncryption` NO skips the questionnaire; OS-provided HTTPS is typically exempt; self-classification report may apply | V, Apple developer documentation, 13 Oct 2026 |
| Screenshot sizes and counts; iPad screenshots only if the app runs on iPad | V, Apple "Screenshot specifications", 13 Oct 2026 |
| App Review information fields, demo account must not expire, notes 4,000 bytes; Manual / Automatic / Automatic no earlier than | V, Apple "Platform version information", 13 Oct 2026 |
| TestFlight limits (100 internal, 10,000 external, 90 days, Beta App Review for the first build, internal group first, six builds per 24 h) | V, Apple App Store Connect Help and Expo "TestFlight", 13 Oct 2026 |
| TestFlight subscriptions renew daily up to 6 times; Sandbox Apple Account renewal rates 3/5/30/60 minutes | V, Apple, 13 Oct 2026 |
| App Review reviews 90% of submissions within 48 hours; expedited review for critical bug fixes | V, Apple "App Review" page, 13 Oct 2026 |
| Guideline 2.5.2 and 2.3.1(a) wording | V, App Review Guidelines, 13 Oct 2026 |
| Uploads need Xcode 26 and the iOS 26 SDK since 28 Apr 2026 | V, Apple "Upcoming requirements", 13 Oct 2026 |
| EAS image aliases `sdk-57` = `macos-tahoe-26.5-xcode-26.6`; Xcode 27 images exist | V, Expo "Build server infrastructure", 13 Oct 2026 |
| `appVersionSource: remote` with `autoIncrement` | V, Expo "App version management" |
| `eas init` flags; `eas env:set ... --visibility plaintext`; submit keys `ascAppId`, `appleTeamId`, `groups` | V, Expo EAS CLI reference, "Environment variables", "Configure with eas.json" |
| EAS-managed iOS credentials; provisioning profiles expire after 12 months without affecting live apps | V, Expo "App credentials" |
| EAS Update rollouts and runtime versions | V, Expo docs (only relevant if OTA is adopted) |
| Dynamic config needs `extra.eas.projectId` added by hand | A (Expo forum) |
| Internal testers' minimum App Store Connect role | A |
| App Review cannot receive an email code; notes plus a watched inbox is acceptable | A |
| Content Rights answer for open model weights and OFL fonts | A, founder and counsel |
| Remove from sale menu path; Vercel instant rollback; TestFlight expiry effect on installed builds | A |
| `release` and `-rc.<n>` tag naming | proposal (coordinator decides) |

## Sources (opened 13 Oct 2026)

- Apple, Set an app age rating: https://developer.apple.com/help/app-store-connect/manage-app-information/set-an-app-age-rating
- Apple, Release a version update in phases: https://developer.apple.com/help/app-store-connect/update-your-app/release-a-version-update-in-phases
- Apple, ITSAppUsesNonExemptEncryption: https://developer.apple.com/documentation/bundleresources/information-property-list/itsappusesnonexemptencryption
- Apple, Complying with Encryption Export Regulations: https://developer.apple.com/documentation/security/complying-with-encryption-export-regulations
- Apple, Overview of export compliance: https://developer.apple.com/help/app-store-connect/manage-app-information/overview-of-export-compliance
- Apple, Screenshot specifications: https://developer.apple.com/help/app-store-connect/reference/app-information/screenshot-specifications
- Apple, Platform version information: https://developer.apple.com/help/app-store-connect/reference/app-information/platform-version-information
- Apple, App information (content rights, age rating, category): https://developer.apple.com/help/app-store-connect/reference/app-information/app-information
- Apple, TestFlight overview: https://developer.apple.com/help/app-store-connect/test-a-beta-version/testflight-overview
- Apple, Invite external testers: https://developer.apple.com/help/app-store-connect/test-a-beta-version/invite-external-testers
- Apple, Subscription renewal rate in TestFlight: https://developer.apple.com/help/app-store-connect/test-a-beta-version/subscription-renewal-rate-in-testflight
- Apple, Test in-app purchases: https://developer.apple.com/help/app-store-connect/test-in-app-purchases-main/test-in-app-purchases
- Apple, App Review: https://developer.apple.com/distribute/app-review/
- Apple, App Review Guidelines: https://developer.apple.com/app-store/review/guidelines/
- Apple, Upcoming requirements: https://developer.apple.com/news/upcoming-requirements/
- Expo, eas.json reference: https://docs.expo.dev/eas/json/
- Expo, Build server infrastructure: https://docs.expo.dev/build-reference/infrastructure/
- Expo, App version management: https://docs.expo.dev/build-reference/app-versions/
- Expo, Submit to the Apple App Store: https://docs.expo.dev/submit/ios/ and TestFlight: https://docs.expo.dev/submit/testflight/
- Expo, Environment variables: https://docs.expo.dev/eas/environment-variables/
- Expo, App credentials: https://docs.expo.dev/app-signing/app-credentials/
- Expo, EAS CLI reference (`eas init`, `eas update:rollback`): https://docs.expo.dev/eas/cli/
- Expo, Runtime versions and Rollouts: https://docs.expo.dev/eas-update/runtime-versions/ , https://docs.expo.dev/eas-update/rollouts/
- Expo forum, EAS project ID with dynamic configuration: https://forums.expo.dev/t/eas-project-id-with-dynamic-configuration/66158
