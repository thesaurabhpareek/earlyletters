# Adoption rules: how an agent proposes a new dependency

RD-F, mobile, 20 Nov 2026. These rules apply to any npm package, Expo module, CocoaPod, Swift package, CLI tool or data set that enters `apps/mobile`, `packages/*` or CI. They are written from rules already in the repo (cited) plus recommendations (Rec). Evidence for each existing decision: `LIBRARY-DECISIONS.md`. What we already have: `ALREADY-HAVE.md`.

Standing rule [V: `docs/engineering/PRINCIPLES.md` item 3 under "Change", CODE-R17, CODE-R18]: standard over custom, platform features and well-maintained, permissively licensed libraries first, every API checked against the installed source, not memory. A library that does less than you need, or more than you need, is not a win.

## 1. Who may decide what

| Kind of change | Who decides | Why |
|---|---|---|
| Dev-only package (test, lint, build tool), permissive licence, no bundle or binary effect | Karma, T1, reversible | No effect on a parent or on a label |
| JS-only runtime package, permissive licence, no network, no permission | Karma, T1 | Reversible; size checked |
| Native module in every build (a pod, a framework, an Expo module) | Karma ruling, T2 (CR-65 treated it so: `docs/agents/cto/RULINGS.md:621-629` [V]) | App Store processing and the privacy manifest see every pod |
| Anything that adds a usage string, entitlement, background mode or privacy-manifest key | Founder merges; counsel confirms the label (Q54) | `docs/ops/LABEL_GUARD.md` [V] |
| Anything that touches a person's words, voice, picture or child's details, or sends data off the phone | Founder and counsel; X2 note; data-map row (LEGAL-REQ-027) | `06-security-engineering.md:105` [V] |
| Non-permissive licence (GPL, LGPL, MPL, CC-BY-SA, SSPL, "source available") | Founder, with counsel | SEC-R07 permits only MIT, Apache-2.0, BSD, ISC (`06-security-engineering.md:45` [V]) |
| Anything that costs money (paid service, paid tier, macOS minutes beyond plan) | Founder | No spend rule |

## 2. Before you open a PR: the decision record

Write it in the PR body (and, for T2 or above, as `docs/adr/` text the PR adds). Each line is required; "unknown" must say how it will be found.

1. **Need.** The card row id (`NS-nn-Rn`, `NX-nn-Rn`) or backlog id, and the one sentence a parent would notice.
2. **Already have?** The row of `ALREADY-HAVE.md` you checked, and why it does not do.
3. **Options (at least three).** Platform feature, own code (with an estimate of lines and tests), and each library. A library-only comparison is rejected.
4. **Evidence block**, produced by these commands and pasted as output:
   - `npm view <pkg> version license time.modified dist.unpackedSize dependencies peerDependencies scripts repository.url` (run it for the exact version you would pin).
   - For Expo packages: `flock /tmp/scribe-npm.lock npx expo install --check` output showing the SDK 57 pin; the registry `latest` can be SDK 58, never install `latest` by hand.
   - `npm view <pkg> maintainers --json` and the repository's last commit date and open-issue count (from the repo page; if the sandbox cannot reach it, say [U]).
   - Weekly downloads: `https://api.npmjs.org/downloads/point/last-week/<pkg>` (the sandbox could not reach it on 20 Nov: write [U] and use release cadence).
   - Transitive count: `npm ls <pkg> --all` after a throwaway install in the scratchpad, never in the repo.
5. **Hard gates (all must be yes):**
   - Licence is MIT, Apache-2.0, BSD or ISC, for the package and every transitive dependency it ships in the app (SEC-R07).
   - Last release within 12 months (`06-security-engineering.md:105`). Examples that fail today: `eslint-plugin-react-native-a11y 3.5.1` (2024-11-04), `react-native-draggable-flatlist 4.0.3` (2025-05-06), `@js-temporal/polyfill 0.5.1` (2025-03-31) [V registry].
   - Supports Expo SDK 57 and React Native 0.86.3 on the New Architecture (peer ranges and README read; a package that needs the old bridge is out).
   - No network access we do not control: grep its source for `fetch(`, `XMLHttpRequest`, `URLSession`, `NSURLSession`, `WebSocket`, and any telemetry or "analytics" word. A package that can load a remote URL must be wrapped so that only `file://` can reach it, with a scan test.
   - No permission request: grep its iOS source for `requestAuthorization`, `requestAccess`, `AVCaptureDevice`, `PHPhotoLibrary`, `CLLocationManager`, `CNContactStore`, `EKEventStore`. CR-65 is the precedent: the package's code was linked into every build even with usage strings removed.
   - No install scripts that fetch or run code: `npm view <pkg> scripts` shows no `preinstall`, `install` or `postinstall` that downloads a binary (Rec; SEC rule "pin what you run", `06-security-engineering.md:21`).
   - It is not on the `TRACKING_SDK` list (`scripts/release/label-effect.mjs:38`).
6. **Size.**
   - JS: run `npx tsx scripts/size/measure.ts` before and after in a throwaway worktree; paste both lines. Limits: bytecode bundle 12 MB, JS assets 3 MB, download under 40 MB (`docs/ops/APP_SIZE.md:5-9` [V]). Metro does not tree-shake, so a package's whole entry file counts (APP_SIZE section 3).
   - Native: say [U] until an EAS build exists, and add a `human` device-check task: App Thinning Size Report before and after (founder). A native dependency cannot be merged on a "small" guess.
   - RD-E sets the new budgets; read `docs/engineering/readiness-20nov/performance/` if it exists when you write.
7. **Privacy and label.** State: what data the package can see, whether anything leaves the phone, which privacy-manifest keys its pod declares (read `PrivacyInfo.xcprivacy` in the pod), and the Label effect line in the style of the cards ("none", or the change). Re-run the audit named in the header of `apps/mobile/src/lib/privacy-manifest.ts` (BL-349).
8. **Way back.** The one file or folder to delete, the adapter's name, and what the fallback does.

## 3. The PR itself

- One concern: the dependency and its adapter only (CODE-R01, CODE-R02: at most 400 lines and 20 files). The lockfile change is allowed only in a PR whose purpose is dependencies (SEC-R06, `06-security-engineering.md:43` [V]); lockfile lines are counted by the reviewer separately and the PR says so.
- Install with `flock /tmp/scribe-npm.lock npx expo install <pkg>` for Expo-managed packages, otherwise `flock /tmp/scribe-npm.lock npm install <pkg>@<exact> -w @scribe/mobile`, then pin to the version the evidence block names.
- An **adapter** file is the only importer of the package (for example `components/media/video-poster.tsx`). A scan test fails if any other file imports it (pattern: `apps/mobile/test/photos-device.test.ts` keeps picker packages out [V, cited at RULINGS.md:629]).
- **Licence step** [V: `scripts/licences/components.mjs:10-19`, `apps/mobile/test/licences.test.ts`]: add the package to `PACKAGES` (with theme) or `NOT_SHIPPED` (with reason) in `scripts/licences/components.mjs`; run `npm run licences:generate -w @scribe/mobile`; commit `apps/mobile/src/generated/licences.json`; run `npm run licences:verify -w @scribe/mobile`. A native library not from npm goes in `NON_NPM`.
- **Label step** [V: `docs/ops/LABEL_GUARD.md`]: run `node scripts/release/label-effect.mjs --base origin/develop --body-file pr-body.txt` and paste the exit code. A pass is not proof: the guard reads names, not behaviour, and misses an SDK added outside `apps/mobile/package.json` (LABEL_GUARD "residual risk"). If it fails, the PR body must name a D-id, that decision must already exist on `develop`, and `docs/legal/app-store-privacy-labels.md` must change in the same PR (founder merges).
- **Supply-chain step**: `npm audit --omit=dev` output pasted (`06-security-engineering.md:105`); `npm ci` still works from the lockfile; no `postinstall` added; no new registry or git dependency.
- **Tests**: a test that fails on `develop` and passes after (the scan test is one); the adapter's fallback is exercised; `npm test` and `cd apps/mobile && npx tsc --noEmit` pass (sandbox baseline: 8 mobile test files and 5 tsc errors fail before any change).
- **Size step**: before and after lines from section 2, item 6.
- Title: `BL-<nnn>: add <pkg> for <need>`. Labels: `agent:<handle>`, `from:agent`, plus `needs:founder` when section 1 says the founder decides. Body begins `Agent:`, `Mode:`, `Satisfies:` per `HARNESS-RUN.md`.

## 4. Review lens

| Reviewer | Looks for |
|---|---|
| `principal-architect` | Was own code or the platform cheaper? Adapter boundary, single importer, way back works |
| `security-architect` | Network, permission and install-script greps; transitive tree; maintainers; pinned version; `npm audit` |
| `privacy` / `compliance-engineer` | Manifest keys, usage strings, label line, data-map row, X2 |
| `design-systems` | Does it change `components/ui` or motion specs? Reduce Motion, Dynamic Type, VoiceOver of the thing it draws |
| `qa` | The scan test, the fallback test, the device-check task |
| Karma | T1 or T2; reads the evidence block, signs the way back |

A reviewer fails a PR when any hard gate in section 2 item 5 is "no", when an evidence line is missing, or when the same need is already covered in `ALREADY-HAVE.md`.

## 5. Removing and replacing

- Removing is a PR too: delete the adapter and the dependency, regenerate licences, move a name to `NOT_SHIPPED` if its parent still pulls it.
- Replace, never stack: two libraries for one job is a fail (two validators, two date libraries, two list engines).
- Re-evaluate every adopted package at each Expo SDK bump and once a year: last release, advisories, size. A package that passes no gate then is on a removal list in the next sprint (Rec).

## 6. Banned without a founder decision (today)

Any analytics, crash or ads SDK; any package that requests camera, microphone, contacts, calendar, location or photo-library permission by itself; `expo-image-picker` (CR-65); GPL, LGPL, CC-BY-SA licensed code or data; any service that receives a picture, a recording, a letter, a child's name or a family detail; anything that rewrites, summarises or suggests words for a person (the constitution, `CLAUDE.md`).

## 7. Proposal template (copy into the PR body)

```
Need: <row id> - <one sentence>
Already have?: <ALREADY-HAVE row> - <why not>
Options: A platform / B own code (~N lines) / C <pkg> / D <pkg>
Chosen: <pkg>@<exact> (<licence>, released <date>, SDK 57: <how checked>)
Evidence: <paste of the commands in section 2 item 4>
Gates: licence <y/n> | 12 months <y/n> | New Arch <y/n> | network <none/where> | permissions <none/which> | install scripts <none>
Size: JS before/after <..> | native <U: device check task id>
Privacy: manifest keys <..> | usage strings <none> | Label effect: <none or change>
Adapter: <file> | Scan test: <test> | Way back: <steps>
Decider: <Karma T1 / Karma T2 / founder / counsel>
```

## 8. Cites sampled for this file

Checked and held: `PRINCIPLES.md` Change item 3, `06-security-engineering.md:21,43,45,105`, `RULINGS.md:621-629`, `LABEL_GUARD.md` (table and residual risk), `label-effect.mjs:10,38`, `APP_SIZE.md:5-9` and section 3, `scripts/licences/components.mjs` header, `apps/mobile/test/licences.test.ts`, `photos-device.test.ts` picker scan, `privacy-manifest.ts` header, registry dates for three stale packages. Recommendations marked Rec are mine and not yet ruled.
