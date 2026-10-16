# Coverage baseline

Owner: quality engineering. Measured 16 Oct 2026 on `develop` at c7e08d1 (#128) merged into `qa/coverage-baseline`. Node 22, vitest 3.2.7, `@vitest/coverage-v8` 3.2.7. Fictional family "Asha" only, here and in every test this baseline added.

**F** fact (measured), **R** recommendation, **K** risk.

## How to run

```bash
npm run test:coverage                       # every workspace, thresholds enforced, merged table
npm run test:coverage -- core mobile        # a subset
npm run test:coverage -- --files 25         # plus the 25 least covered files
npm run test:coverage -w @scribe/core       # one workspace's own run
node scripts/coverage/report.mjs --files 25 # re-print the table from the last run's reports
```

- Each workspace has a `vitest.coverage.config.ts` built on `scripts/coverage/preset.ts`: v8 provider, `all: true` (a file no test imports counts at 0%), AST-aware remapping (branch and function counts are real for untested files), reports in `<workspace>/coverage/` (gitignored).
- Excluded from every denominator: tests, `__tests__`, `test/`, `.d.ts`, goldens, `e2e/` and `e2e-web/` harnesses, vitest configs, and the command-line scripts (`scripts/` in analytics and brand, `run.ts` and `edit-compare.ts` in experiments). Mobile also excludes `.tsx` screens and components, `src/app` (routes), `src/dev`, the Expo and native adapters (`expo-adapter.ts`, `*.native.ts`, `*.android.ts`, `*.web.ts`, `open-native.ts`) and the account-deletion React hook. The mobile number is therefore the Node-testable surface of the app, not the whole app.
- Coverage runs differ from `npm test` in three deliberate ways (see Flakes): a 30 s per-test timeout, the verifier and language fuzz at 2000 cases instead of 10000 (same seed, so the same first 2000 cases), and the plan-reminders "synthetic year" property test left out. `npm test` is unchanged.
- The proposed CI job is in `docs/ops/proposed/coverage-ci.md` (`.github/` is not edited here).

## Per workspace (F)

Before = develop c7e08d1 without this pull request's tests. After = with them. Thresholds = the after number, cut (not rounded) to two decimals: a workspace that drops below any of its four fails `npm run test:coverage`.

| Workspace | Statements | Branches | Functions | Lines | Thresholds (S / B / F / L) |
|---|---|---|---|---|---|
| @scribe/core | 93.26% -> **94.22%** | 87.06% -> **88.87%** | 96.68% -> **96.90%** | 97.00% -> **97.28%** | 94.21 / 88.87 / 96.90 / 97.27 |
| @scribe/mobile | 54.07% -> **54.46%** | 54.13% -> **55.01%** | 48.26% -> **48.44%** | 54.92% -> **55.18%** | 54.45 / 55.00 / 48.43 / 55.17 |
| @scribe/content | 100% -> 100% | 100% -> 100% | 100% -> 100% | 100% -> 100% | 100 / 100 / 100 / 100 |
| @scribe/api | 93.30% -> **94.69%** | 87.14% -> **91.70%** | 92.98% -> **94.74%** | 95.04% -> **95.74%** | 94.69 / 91.70 / 94.73 / 95.74 |
| @scribe/analytics | 94.10% | 81.75% | 93.55% | 96.23% | 94.10 / 81.75 / 93.54 / 96.23 |
| @scribe/design-tokens | 90.74% | 88.89% | 100% | 89.80% | 90.74 / 88.88 / 100 / 89.79 |
| @scribe/emails | 95.92% | 81.44% | 97.48% | 98.08% | 95.91 / 81.43 / 97.47 / 98.08 |
| @scribe/brand | 90.20% | 67.86% | 81.82% | 90.91% | 90.19 / 67.85 / 81.81 / 90.90 |
| @scribe/experiments | 100% | 88.89% | 100% | 100% | 100 / 88.88 / 100 / 100 |
| **All, merged** | 70.28% -> **70.76%** | 67.45% -> **68.53%** | 65.78% -> **65.97%** | 71.63% -> **71.86%** | n/a |

Size of each denominator after (covered / total statements): core 2265 / 2404, mobile 3677 / 6752, content 62 / 62, api 339 / 358, analytics 1149 / 1221, design-tokens 49 / 54, emails 376 / 392, brand 46 / 51, experiments 97 / 97.

**F** `@scribe/content` is 100% because its source is data (string tables); the rules test reads every string. That number says nothing about whether every rule covers every string: see "Content rules" below.

**F** Where the new tests moved the needle (files whose numbers changed):

| File | Before -> after |
|---|---|
| packages/core/src/age.ts | branches 55.6 -> 100, statements 91.9 -> 100 |
| packages/core/src/prompts.ts | branches 66.0 -> 98.0, functions 84.6 -> 92.3, statements 74.2 -> 98.4 |
| packages/core/src/followups.ts | branches 82.4 -> 100 |
| packages/core/src/verify.ts | branches 94.1 -> 96.2, statements 96.5 -> 97.6 |
| packages/core/src/plan.ts | branches 97.8 -> 100 |
| apps/mobile/src/lib/store.ts | branches 54.1 -> 62.2, statements 64.7 -> 68.2 |
| apps/mobile/src/lib/export/build.logic.ts | branches 83.2 -> 93.9, statements 96.2 -> 99.5 |
| apps/mobile/src/lib/sync/outbox.ts | branches 84.0 -> 91.2, statements 89.6 -> 94.4 |
| apps/mobile/src/lib/capture/sweep.logic.ts | branches 92.1 -> 100 |
| apps/mobile/src/lib/auth/links.logic.ts, url.logic.ts | branches 92.3 -> 100, 91.7 -> 95.8 |
| apps/mobile/src/lib/db/repos/children.ts | branches 93.8 -> 100 |
| packages/api/src/pack-manifest.ts | branches 75.0 -> 100, functions 88.9 -> 100 |
| packages/api/src/semver.ts | branches 68.8 -> 93.8 |
| packages/api/src/integrity.ts | branches 93.3 -> 100, statements 90.4 -> 96.2 |

Already at 100% before and pinned further by edge cases: `safety.ts`, `child.ts`, `letter-ledger.logic.ts`, `db/repos/ledger.ts`, `speech-consent.logic.ts`, `db/migrations.ts`, `quiet-day.logic.ts`.

**K** The mobile number barely moves because its gap is not the pure logic (mostly 90 to 100% already) but the device glue: 70 modules at 0% that import Expo or native modules and have never been loaded in Node. The table below is that list.

## The 25 least covered source files that matter

All 25 are in `apps/mobile/src/lib` (plus one in `components`), all at 0% lines, functions and branches; ordered by uncovered lines. Nothing outside mobile is below 81% lines. "What is untested" is the logic in the file, not the native call it wraps; "Risk" is what breaks unseen if that logic is wrong.

| # | File | Lines | What is untested | Risk |
|---|---|---|---|---|
| 1 | lib/transcription-queue/index.ts | 0 / 225 | The runtime around the tested `machine.ts`: one job at a time, where finished words go (draft vs waiting letter), retry and resume after a kill, starting itself from `requestWords`, the speech-consent gates (only wiring is source-scanned) | **K** high: a waiting letter never gets its words, or words land on the wrong letter; raw-set-once relies on the store guard alone |
| 2 | lib/export/device.ts | 0 / 98 | Snapshot from the store, temp ZIP in cache, verify-then-share, deletion of the temp file on close, stop and failure, `cleanupExports()` | **K** high: an unencrypted export left behind in the cache (DATA-REQ-056), or "ready" said before verification |
| 3 | lib/transcribe-whisper.ts | 0 / 90 | Windowing, VAD skip on silence, the no-speech path ('' and Whisper never runs), per-window stitching | **K** medium-high: an empty or truncated raw transcript becomes the immutable raw |
| 4 | lib/reminders/scheduler.ts | 0 / 88 | Re-plan on every trigger, replacing only our notifications, no-op when the plan is unchanged, permission changes | **K** medium: duplicate or stale reminders; C-REQ-002 "at most 2 a week" is tested only in the pure planner |
| 5 | lib/audio-enhance/index.ts | 0 / 84 | Listening-copy path, original never written, fallback when voice isolation is unavailable | **K** medium: the founder's "original never altered" rule rests on code with no test |
| 6 | lib/a11y.ts | 0 / 78 | `announce`, focus on mount, AX size categories driving row stacking | **K** medium: AX5 layout regressions (TDD 07 section 5) |
| 7 | lib/models/speech-packs.ts | 0 / 71 | Which speech packs a phone asks for, the language resolver registration, dev-build fallbacks | **K** medium: the wrong model size for the tier, or a download started without consent (consent is checked upstream only) |
| 8 | lib/player/use-letter-player.ts | 0 / 71 | Mapping expo-audio events into the tested `player.logic.ts` reducer, session idle on stop | **K** low-medium: a voice that starts by surprise on return to the app |
| 9 | lib/billing/plan-reminders.ts | 0 / 70 | Turning the tested planner's list into notifications, re-plan on plan changes (new in #121) | **K** medium: LEGAL-REQ-047 notice timing depends on this wiring |
| 10 | lib/capture/recorder.ts | 0 / 65 | Draft row before microphone, idempotent finalize on finish, background, interruption and dismiss, hash on stop | **K** high: the "take is never lost" guarantee (LEGAL-REQ-011, DATA-REQ-048) has no unit test of its ordering |
| 11 | lib/analytics/index.ts | 0 / 62 | SDK not loaded before consent, no-op provider without a key, the new `EXPO_PUBLIC_ANALYTICS` switch (#118) | **K** high: LEGAL-REQ-003, nothing before consent; the package is tested, the app glue is not |
| 12 | lib/billing/plan-store.ts | 0 / 59 | Cached snapshot on launch and offline, refresh from StoreKit, staleness never turning Plus off | **K** medium: C-NFR-004 fail-open for payers |
| 13 | lib/remote/index.ts | 0 / 59 | Last good copy offline, never awaited at launch, version rollback refusal wiring (G-18, #114, is tested in documents.ts) | **K** medium: A-REQ-002 (launch never waits on the network) |
| 14 | lib/analytics/observers.ts | 0 / 55 | Which module events become which catalogue events | **K** low-medium: a wrong or extra property reaches PostHog after consent |
| 15 | lib/models/whisper-runtime.ts | 0 / 55 | Lazy context creation, release after 45 s, on background and on memory warning | **K** medium: a 1 GB model left resident, jetsam kills mid-take |
| 16 | lib/billing/actions.ts | 0 / 54 | Re-reading StoreKit after purchase, restore, manage and refund sheets | **K** low-medium: Plus shown off after a purchase until relaunch |
| 17 | lib/capture/sweep.ts | 0 / 46 | Applying the tested plan: hashing and finalizing killed takes, rebases, re-attach, the purge running after the sweep and never during a take | **K** high: the plan is proven, its application (the step that touches files) is not |
| 18 | lib/motion.ts | 0 / 43 | Reduce Motion subscription, 200 ms fades replacing movement | **K** low: accessibility regression only |
| 19 | lib/auth/passkey.ts | 0 / 38 | Passkey registration and sign-in ceremony | **K** low in v1.0 (sign-in is off, `capabilities.signIn`) |
| 20 | lib/reminders/prefs.ts | 0 / 36 | Reading and defaulting the reminder settings keys | **K** medium: a damaged value could turn reminders on (default is off) |
| 21 | lib/resilience/recovery-export.ts | 0 / 36 | Phone side of "Export what is readable" after a launch failure | **K** medium: the last-resort path out of a broken database |
| 22 | lib/packs/index.ts | 0 / 35 | Public pack API over the tested engine | **K** low: engine and contract are tested |
| 23 | components/ui/fonts.ts | 0 / 34 | Font family map | **K** low |
| 24 | lib/auth/consent.ts | 0 / 34 | Which consent sheets show after sign-in, `age_attested: true` derived from the gate | **K** low in v1.0 (sign-in off); high once sync ships (LEGAL-REQ-001, -006) |
| 25 | lib/auth/apple.ts | 0 / 31 | Nonce hashing, name kept in the Keychain until Terms, revocation check | **K** low in v1.0 (sign-in off) |

Next 10, for the record: `billing/gates.ts` (31, the Keep gate wrapper; its pieces are tested), `auth/auth-store.ts` (30), `language/packs.ts` (28), `content-blocks/hooks.ts` (27), `auth/google.ts` (27), `language/rules.ts` (25), `age-gate.ts` (23, PRD-REQ-019 glue; the rules are tested), `analytics/ask.ts` (23), `language/spoken-language.ts` (21), `family/invites.ts` (20).

**R** The way to cover rows 1, 2, 10, 11 and 17 without a phone is the pattern `store.shelf.test.ts` already uses: mock the one native module (`expo-file-system`, `expo-audio`, `posthog-react-native`) with a fake that records calls, and drive the real module. Rows 2, 10 and 17 first: they are the durability and privacy promises.

## Tests added (503, all in new files)

| Area | Files | Tests | What they pin |
|---|---|---|---|
| packages/core | `plan.edges`, `age.edges`, `verify.refusals`, `prompts.selection`, `safety.tiers` | 158 | Plus end instant to the millisecond, sandbox and tester rules, the free-letter boundary and cap, lapsed wording, rule order in `decide`; month ends, leap days, year ends, two years of daily invariants, labels; 33 of the 34 `RejectReason`s reached on purpose, including the two no test asserted before (`out_of_bounds`, `overlaps_other_edit`), the change ceiling, one agreement per sentence. The 34th, `inserted_content_word` (`verify.ts:466`), and the belt-and-braces negation, mood and quote checks (`verify.ts:452, 456, 457`) cannot be reached with today's edit types: each type's own check refuses first. They are defence in depth and stay uncovered on purpose; band edges, kind order, fallbacks, the recent-key window at its exact edge; one case per safety pattern, tier 0 near-misses, follow-up limits |
| apps/mobile, store | `store.purge-guards`, `store.child-sync`, `migrations.v5`, `billing-ledger.max-rule` | 37 | Purge clock guard at the exact millisecond, unreadable launch stamp, the 30-day cutoff, a stuck file not blocking others, queued uploads erased with the letter; child edits never touching letters or server columns and what they queue (parent vs contributor, coalescing); migration 5 with no book, 40 marks, run twice, a failure half way, a mark the server holds; the ledger max rule with junk sources, a restored database, the in-process floor and the recent-id window |
| apps/mobile, capture and export | `sweep.playable`, `export-build` | 85 | Every killed-take file state against every probe answer, live-session protection, claims and strays, file name rules; safe folder names, chapters and years, paper size, missing recordings, the printable set, quiet days, integrity ok/mismatch/unchecked, own vs family rows |
| apps/mobile, guards | `read-together.guards`, `speech-consent.rules`, `deep-link.allowlist` | 168 | What Read together may read (and the screen still goes through the guard); every combination of the download consent migration, free space at the byte boundary and the Review card; the link allowlist: hosts, paths, token shapes, the custom scheme never carrying a secret, the www alias |
| packages/content | `four-oct-strings` | 14 | Every string the 4 Oct PRs (#92, #93, #94, #96, #98) added resolves under a root `rules.test.ts` scans; `pricing.ts` (#96), which `rules.test.ts` does not scan, gets the character, fear, AI, gendering and price rules |
| packages/api | `manifest-verification` | 41 | A signed manifest from key to resolved packs, every envelope refusal, every entry field rule, the empty trust list failing closed, resolution and semver edges |

## Bugs found

| # | File:line | Failing test | Reproduction | Severity |
|---|---|---|---|---|
| B-1 | `packages/core/src/plan.ts:203` | `packages/core/test/plan.edges.test.ts` "[R-3] own Plus on an account-level surface (no book, no role) is allowed, not offered" (`it.fails`) | `decide({ feature: 'theme_extra', viewer: { roleInBook: null, own: <active plan> }, book: null, ... })` returns `{ kind: 'offer', trigger: 'themes' }`. Own Plus is honoured only when `roleInBook === 'parent'`, but `DecideInput` documents `roleInBook: null` and `book: null` for account-level surfaces, so a person whose Plus is on is offered Plus there (against R-3 and "Plus is held per account"). The existing property test excludes `null` from its definition of "on", which is why it passes. | Latent: no app code calls `decide()` with a null role yet (v1.0 has no themes or backup). Fix in plan.ts (owner: plan engine): treat own Plus as `allow` when `roleInBook` is `null`. |

No other test exposed a production defect. Three things that looked like bugs and are not (each pinned by a test so a change is noticed):

- `www.` invite links are refused by `classifyIncomingUrl` (`links.logic.ts:57`) but accepted by `parseInviteUrl`. Consistent: `app.config.ts:202` associates the apex domain only, so iOS never hands the app a `www.` link; only pasted text can, and that path accepts it.
- `TRUSTED_SIGNING_KEYS` is empty (`packages/api/src/keys.ts`): by design until the founder runs keygen; every downloaded document fails closed with `unknown_key`.
- An "active" plan whose period has ended is offered Plus with `lapsed: false` (sell wording) rather than the lapsed wording: StoreKit reports an ended period as `expired`, so this shape never reaches the engine.

## Content rules

**F** Every string the 4 Oct pull requests added to `packages/content` sits under `en`, `features` or an app `copy.ts`, all of which `rules.test.ts` scans, so all voice rules (characters, fear and loss, AI claims, gendering, print, beta, 90-day pledge, glossary) already apply to them; `four-oct-strings.test.ts` pins each added key so a move out of a scanned root is noticed.

**K** One gap: `packages/content/src/pricing.ts` (#96: `PLUS_PRICE`, `PLUS_TRIAL`, `plusPriceLine`) is exported but not in any set `rules.test.ts` builds. Its strings pass every rule today; `four-oct-strings.test.ts` now checks them. **R** Add `leaves({ PLUS_PRICE, PLUS_TRIAL, plusPriceLine }, 'pricing')` to `ALL` in `rules.test.ts` (that file's owner) and the separate check can go.

## Tests that assert too little

Found by scanning every `it`/`test` block in the 140 tracked test files (1662 blocks) for bodies with no assertion, only mock-call checks, or only `toBeDefined` / `toBeTruthy` / `not.toThrow`. Nothing was deleted. No `expect(true)` tautology exists in the repo. One scan hit was a false positive (the synthetic-year test uses the three-argument `it(title, options, fn)` form and does assert).

| Test | What it checks today | Proposed real assertion |
|---|---|---|
| `apps/mobile/test/capabilities.test.ts:184` "starts no sync: no listeners, no upload queue, no client" | four mocks were never called | Also assert the observable result: `localSqlDb()` has zero `sync_outbox` rows after a save, and `startSync()` returns the same no-op stop each call |
| `apps/mobile/test/resilience.test.ts:168` "does nothing more if retry itself throws" | `go` never called | Also assert `timers.setTimeout` was never called (no retry loop was scheduled) and the call returned without throwing |
| `apps/mobile/test/store.facade.test.ts:102` "[MOB-05] subscribeTo entries is not called for a setting" | call counts only | Assert the tables passed to the listener: `expect(onEntries).toHaveBeenCalledWith(['entries'])` after the save |
| `apps/mobile/test/store.repos.test.ts:106` "table-scoped listeners fire only for their tables" | call counts and one `toHaveBeenCalledWith` | Already close; add that `bus.emit('settings', 'entries')` delivers `['settings', 'entries']` filtered to `['entries']` (or not), pinning the filter semantics |
| `apps/mobile/test/store.repos.test.ts:122` "unsubscribing during a notification is safe" | `second` never called | Also assert the first listener still fires on the second emit (unsubscribing one does not drop the others) |
| `apps/mobile/test/config.test.ts:188` "has a submit profile" | `submit.testflight` is defined | Assert its shape: `toMatchObject({ ios: { ascAppId: expect.any(String) } })` or whatever fields the release process needs |
| `apps/mobile/test/shelf-strings.test.ts:42` "screens use only strings that exist" | each key is truthy | Assert `typeof === 'string'` and non-empty after trim, so an object or a whitespace string cannot pass |
| `packages/brand/test/registry.test.ts:46` "npm fonts resolve from @scribe/brand" | `require.resolve` does not throw | Assert the resolved package's `version` equals the registry's pinned version |
| `packages/content/test/emails.test.ts:201` "every auth email carries a safety line" | `email.safety` truthy | Assert it is a non-empty string that passes the voice rules and names what to do ("you can ignore this email") |
| `packages/emails/test/emails.test.ts:298` "ports every email develop had" | each template id defined | Assert each renders to non-empty HTML and text with the subject from `@scribe/content` |

## Flakes

Evidence: `npm test` run twice in full on `develop` ed16ca3 (both green, about 39 s each), the coverage suite four times while `develop` moved (ed16ca3, 4183844, c7e08d1), and once each before and after on c7e08d1 on an idle machine. One run before a container restart was on a machine shared with other agents.

| Test | Seen | Cause | Fix |
|---|---|---|---|
| `packages/core/test/verify.fuzz.test.ts` (known) and `lang.fuzz.test.ts` | Under coverage, after run on c7e08d1: every test passed but the run failed with two `[vitest-worker]: Timeout calling "onTaskUpdate"` errors | Each 10000-case property is one synchronous call: about 40 s (English) and up to 67 s (all languages) instrumented, so the worker cannot answer the main process in time while the main process is busy with coverage | **Applied** (file I own): `packages/core/vitest.coverage.config.ts` sets `SCRIBE_FUZZ_RUNS=2000` for coverage runs (same seed, first 2000 cases, under 9 s each; an explicit value still wins). `npm test` keeps 10000, nightly 100000. **R** for the fuzz owner: split each property into `it` blocks of 2000 cases (`for (const chunk of range(RUNS / 2000)) it(...)`) so no single call blocks for long, in every mode |
| `packages/content/test/no-real-family-data.test.ts` (known) | Not reproduced: 3.3 to 3.4 s in every plain run, passed under coverage (explicit 60 s timeout) | Reads every tracked file; time grows with the repo (journey PDFs, agent harness) | **R** for its owner: list text files with `git ls-files --eol` and skip `-text` entries instead of reading each file to look for `\0`; keep the 60 s timeout |
| `apps/mobile/test/decode-uri-component-shim.test.ts` (new, #115) | Under coverage: timed out at the 5 s default | Requires `metro.config.js` (all of `expo/metro-config`) inside the test body | **Applied** for coverage runs: 30 s per-test timeout in every coverage config (`INSTRUMENTED` in `scripts/coverage/preset.ts`). **R** for its owner: load `metro.config.js` in a `beforeAll` with its own timeout |
| `apps/mobile/test/billing-plan-reminders.test.ts` "a synthetic year" (new, #121) | Under coverage: timed out (about 170 s against its own 120 s). Plain: 69 s, passing, but at 58% of its budget on an idle machine | 74 days x 3 hours x 4 zones x 4 subjects through the planner in one test | **Applied** for coverage runs only: left out with `testNamePattern` in `apps/mobile/vitest.coverage.config.ts` (a per-test timeout cannot be raised by config). **R** for its owner, before it flakes in CI `unit` on a 2-core runner: a stride knob like `SCRIBE_FUZZ_RUNS` (`day += 15` in PR CI, `day += 1` nightly) |
| `apps/mobile/test/sync-e2e.test.ts` (`beforeAll` 120 s) and `apps/mobile/test/config.test.ts:70` (first `getConfig` call) | Once, under coverage, on the shared machine before the restart (with vitest's own RPC timeout warning); not on the idle machine | Load: the PGlite `beforeAll` applies every migration; the first `getConfig` pays the cold `@expo/config` load | **R** sync-e2e: build the schema once and reuse a PGlite data dir dump; config.test: warm `getConfig` in a `beforeAll` with an explicit timeout. Do not run `coverage` and `db` on the same CI runner |

## Changelog

| Date | Change |
|---|---|
| 2026-10-16 | First baseline: tooling, thresholds, 503 tests, this report. |
