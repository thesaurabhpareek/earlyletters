# Library decisions B: search, text, time, data, speech, testing, measurement (LD-16 to LD-33)

Part of RD-F (mobile, 20 Nov 2026). Index: `LIBRARY-DECISIONS.md`. Part A: `LIBRARY-DECISIONS-A-ui-media.md` (tags, owner codes and the SDK 58 note are explained there). Paper evaluation only: nothing installed.

## LD-16 Full text search: USE expo-sqlite FTS5 (`unicode61`); own scan fallback for CJK; AVOID stemmers
- **Package.** `expo-sqlite ~57.0.3` (in `apps/mobile/package.json` [V]; plugin listed at `apps/mobile/app.config.ts:298` [V]). MIT. No network. Already ships.
- **What exists [V].** The index is `fts5(body, extra, tokenize = 'unicode61 remove_diacritics 2')` (`apps/mobile/src/lib/find/lifecycle.ts:180`). FTS5 is probed once and the code falls back when it is absent (`lifecycle.ts:66-75`). A query with CJK characters skips FTS and uses the scan index, because CJK has no word breaks (`find/query.ts:17,57`; `find/scan-index.ts:5`). Devanagari and Arabic words are matched as written, with no folding of vowel signs (`query.ts:7-8,28`).
- **Replaces / saved.** A custom inverted index. [E] 2 to 3 weeks and every future bug in ranking, deletion and rebuild.
- **Options for the gaps [U on device].** `trigram` tokenizer would give substring and CJK matches but needs SQLite 3.34 or newer in the shipped library; the iOS SQLite version inside expo-sqlite was not read [U]. Porter stemming is English-only and would match "walk" to "walked" in a way that changes what a parent typed: AVOID (find must not reinterpret words; NS-02 rows R7 and R8 say as written). ICU tokenizer is not in the Expo build [U].
- **Decision.** USE. Spike (device check, `human`): `select sqlite_version()` and `create virtual table ... using fts5(x, tokenize='trigram')` on iOS 17.0 and 18. If trigram exists, a CJK-only trigram table is a T1 change; otherwise keep the scan. Owner: K.

## LD-17 Grapheme segmentation: OWN CODE (`packages/core/src/graphemes.ts`); AVOID the polyfill
- **Fact.** Hermes has no `Intl.Segmenter`: stated in the FormatJS React Native guide (found by search 20 Nov; page itself did not load in the sandbox [U]), in eval B (`B-mobile-client.md:20,481` [V]) and in our own comments (`packages/core/src/text.ts:75`, `packages/core/src/lang/types.ts:74` [V]). One screen already feature-tests it and falls back (`apps/mobile/src/components/book/book-cover.logic.ts:105` [V]).
- **Candidate.** `@formatjs/intl-segmenter 12.3.2`, MIT, released 2026-11-08, one dependency (`@formatjs/intl-localematcher`), 1.28 MB unpacked [V registry]. Must be loaded before use; cost on the launch path [U] and that conflicts with "no awaited work on launch" (A-NFR-001, A-NFR-002; mobile charter).
- **Plan.** Eval B BL-957 (a): a plain-TS splitter in `packages/core/src/graphemes.ts` with a property test that uses Node's `Intl.Segmenter` as the oracle, so no runtime dependency (`B-mobile-client.md:41,325` [V]).
- **Saved.** The polyfill saves writing the splitter ([E] 2 days) but ships tables for every locale; the oracle test gives the same safety for 0 bytes.
- Decision: OWN CODE; AVOID the polyfill. Way back: if the oracle test shows a gap we cannot close (new emoji sequences), load the polyfill lazily on the one length-check path. Owner: K.

## LD-18 Dates, time zones, typed days: USE Intl and our own `tz.ts`; AVOID date-fns and Temporal polyfills
- **What exists [V].** `apps/mobile/src/lib/reminders/tz.ts:1-30`: wall-clock arithmetic in a named IANA zone through `Intl.DateTimeFormat`, calendar dates plus minutes, DST handled at the edge, never "add 24 hours". `apps/mobile/src/lib/dates.ts:1-25`: one display format, device locale or en-GB. Age math and chapters: `@scribe/core` (`packages/core/src/age.ts`).
- **Candidates [V registry].** `date-fns 4.4.0` (MIT, 2026-05-29, 10.9 MB unpacked; time zones need a second package `@date-fns/tz`, not evaluated [U]); `temporal-polyfill 1.0.8` (MIT, 2026-11-04, 1.0 MB unpacked); `@js-temporal/polyfill 0.5.1` (ISC, last release 2025-03-31, over 12 months: fails `06-security-engineering.md:105`).
- **Why not.** Metro does not tree-shake, so a package's whole entry file ships (`APP_SIZE.md` section 3 last line [V]); our date work is small, tested and already in Intl. A polyfill's runtime tables load at startup.
- **Plan for NS-18 / NS-46 typed days.** Astronomical days are stored as one UTC instant and shown on the phone's local date; lunar days are a dated table; fixed or rule days are computed (`docs/product/prd/functions/days-library.md:15,154`, branch `docs/locked-pack-inputs-20nov` [V]). All of it is calendar-date arithmetic that `tz.ts` can host. Easter (computus) is about 30 lines of integer arithmetic [E]; write it with its own test against the dated table.
- Decision: USE Intl; OWN CODE for the few new functions. Revisit Temporal when Hermes ships it [U]. Owner: K.

## LD-19 Days we mark: holiday and festival data (NS-46 and card 21): OWN DATA SET; AVOID date-holidays and Hebcal libraries
- **Candidates and licences [V registry].** `date-holidays 3.39.2` is `(ISC AND CC-BY-SA-4.0)`: the data part is share-alike. `@hebcal/core 6.16.1` is `GPL-2.0-or-later`. Neither passes the permissive-only rule (`06-security-engineering.md:45`, SEC-R07 [V]) and CC-BY-SA terms on shipped data need counsel.
- **Sources the design read.** U.S. Naval Observatory seasons API, Hebcal web, timeanddate pages, Cornell's 5 U.S.C. 6103, bahai.org calendar (`days-library.md:45-54` [V]). Whether we may copy their date lists, and under what notice, is not read: [U], counsel.
- **Design rule.** Each row carries a named authority and years; ship only the years an authority published; the table lives in the app as content and refreshes each year (`days-library.md:187-196` [V]). Rules of the form "fourth Thursday" are code, not data.
- **Plan.** Own table in `packages/content` (owner `content`), schema validated by valibot (LD-21), computed rows tested against the authority's published dates in fixtures. Unicode CLDR has no festival data [E].
- **Needs.** Counsel: may we record facts (a date and an authority name) from these pages, and is a source line required. Founder: which countries and traditions ship (open question in `days-library.md`, section 11).
- Decision: OWN DATA SET; AVOID both libraries. Way back: none needed; adding a library later is a licence decision for the founder. Owner: K for code; C for sourcing.

## LD-20 Notification scheduling: USE expo-notifications; own planner
- `expo-notifications ~57.0.21` [V]. iOS keeps at most 64 pending local notifications; our planner stays under it, default 60 (`reminders/planner.ts:95` [V]). The scheduler reads `getAllScheduledNotificationsAsync` and schedules in one place (`reminders/scheduler.ts:146,153` [V]).
- Planner windows: evening class 21 days ahead, month and birthday notes 92 days, hours 07:00 to 21:30 (`planner.ts:90-100` [V]). Typed days (NS-18, BL-982) are not yet in `planner.ts`; kinds today are `evening`, `monthAge`, `birthday` (`days-library.md:81`, reading [V]).
- Budget rule for new classes: 60 minus the sum of already planned items; a library day never starves the evening class; planned at foreground and after any change [E: design rule, owner `notifications` steward].
- No library replaces this: `expo-calendar` needs calendar permission (AVOID, LD-31). Owner: K.

## LD-21 Schema validation: USE valibot; AVOID zod
- `valibot ^1.5.0` is already a dependency of `packages/api` (`packages/api/package.json` [V]); registry 1.5.0, MIT, 2026-09-09, 1.9 MB unpacked. It is 0.10 MB (1%) of the app's minified JS (`APP_SIZE.md` section 3 [V]).
- `zod 4.6.7`, MIT, 2026-10-12, 6.1 MB unpacked [V registry]: a second validator for no new capability.
- Cut 6 in `APP_SIZE.md` floats hand-written validators to save 0.1 MB; not worth it before a size miss.
- Decision: USE valibot everywhere (days table, media constants, export schema); AVOID zod. Owner: K.

## LD-22 PDF and print layout: USE expo-print; own HTML templates
- `expo-print ~57.0.2` is installed; the export builder uses it (`apps/mobile/src/lib/export/device.ts`, `build.logic.ts` [V by grep]). It renders HTML through the system print stack, so fonts and RTL come free.
- `react-native-pdf-lib 1.0.0` (Apache-2.0) last release 2020-02-09 [V]: stale, AVOID.
- Printed books are made by a print partner from an export, not on the phone (`docs/product/prd/functions/print-and-fulfilment.md`, not read [U]).
- Decision: USE; no new package. Owner: K.

## LD-23 QR codes: none needed on device today; if needed, own call to a small pure-JS generator
- A whole-word search for `qr` and `qrcode` in `apps/mobile/src`, `packages/*/src` and `apps/mobile/package.json` found nothing [V]: no QR generator exists. The video QR on a printed page is "not built" (Q-PM-10, `27-photo-moments-and-media.md:60` [V]).
- Candidates [V registry]: `qrcode-generator 2.0.4` (MIT, 2025-08-07, pure JS), `react-native-qrcode-svg 6.3.54` (MIT, 2026-11-04, draws with `react-native-svg`, which we have), `qrcode 1.5.4` (MIT, 2024-08-05, older than 12 months). Dependencies of each [U].
- Decision: no adoption now. If a card asks, ADOPT `react-native-qrcode-svg` only after reading its dependency tree; QR payloads must be links we host, never content (X2). Owner: K.

## LD-24 Localisation, plurals, RTL: USE built-ins; AVOID i18n frameworks for now
- The UI is English only in v1 (`apps/mobile/src/lib/dates.ts:5-6` "The UI is English only (K-24)" [V]); every parent string lives in `copy.ts` and moves to `packages/content` (mobile charter). Speech languages are separate (LD-25).
- Candidates [V registry]: `i18next 27.2.2` (MIT), `@formatjs/intl 6.2.0` (MIT), `@formatjs/intl-pluralrules 7.1.0` (MIT), `@formatjs/intl-numberformat 10.1.0` (MIT), `expo-localization` (SDK 57 pin 57.0.2).
- Plurals: `Intl.PluralRules` exists on Hermes iOS [U: confirm on device with `new Intl.PluralRules('en').select(2)`]; English needs only one/other; a 10-line helper in `lib/copy.ts` is enough until a second UI language is a card.
- RTL: React Native's `I18nManager` is built in. The repo has no use of it (grep, 0 files) [V]; do not build RTL layout before a translated UI is planned; use logical props (`start` and `end`) in new styles.
- Decision: AVOID frameworks now; revisit when the first non-English UI card exists (`languages-and-localisation.md`, not read [U]). Way back: add `@formatjs/intl` behind `copy.ts`. Owner: K.

## LD-25 Speech and language packs: USE whisper.rn; AVOID sherpa-onnx and Apple Speech
- `whisper.rn ~0.7.4`, MIT, registry mod 2026-11-09 [V]. Models are never in the app; they download as packs, with Whisper large-v3-turbo q5_0 as the shared multilingual model (`apps/mobile/src/lib/models/catalog.ts:2-26` [V]); size rule in `APP_SIZE.md:3` [V].
- `sherpa-onnx 2.0.2`, Apache-2.0, 2026-11-19 [V registry]: a second engine, new native code, no gap that whisper.rn leaves open is documented. AVOID until a language needs it.
- Apple `SFSpeechRecognizer`: sends audio to Apple unless the language supports on-device; adds a speech usage string and a label line (G11-3). A child's voice must not leave the phone without the X2 note. AVOID. Owner of any change: F and C.
- Decision: USE; no new engine. Owner: K.

## LD-26 Testing the database: USE PGlite and the existing `test:db`; AVOID pg-mem
- `@electric-sql/pglite ^0.5.8` is a root devDependency (`package.json` [V]); registry 0.5.17, Apache-2.0, 2026-11-19. It runs real Postgres (row-level security, triggers, the `raw_transcript` trigger).
- `pg-mem 3.0.14` (MIT, 2026-02-26) emulates Postgres and does not run our migrations' triggers or policies faithfully [E: general knowledge]. AVOID.
- Decision: USE as is. Owner: K (database steward).

## LD-27 Unit, component and accessibility tests: USE vitest; ADOPT jest-expo and RNTL for L2 after a spike
- **Today [V].** `apps/mobile` tests run on `vitest ^3.2.7` (279 files in `apps/mobile/test`, `package.json` script `test: vitest run`). Logic is in `*.logic.ts` and tested in Node; accessibility logic has `lib/a11y.logic.test.ts`. No component renderer is installed.
- **Plan on paper.** L2 component tests with `@testing-library/react-native` under `jest-expo`, to prove AX5 rendering, labels, 44 pt targets and sheet focus (`docs/tdd/07-quality-test-strategy.md:30,426,650` BL-Q08 [V]). Registry [V]: `jest-expo 57.0.6` (SDK pin; latest 58.0.15), MIT, peers `@react-native/jest-preset ^0.86.3`; `@testing-library/react-native 14.1.0`, MIT, 2026-10-08, peers `jest >=29`, `react >=19`, `react-native >=0.78`, `test-renderer ^1.0.0`.
- **Wrinkle.** RNTL's peer is Jest, so L2 adds a second runner next to vitest, and `npm test` must run both (CI 8-minute rule, `07:16`). Spike first: does RNTL 14 run under vitest with the Expo preset? If not, scope Jest to `apps/mobile/test-ui/` only.
- **Axe-like linting.** `eslint-plugin-react-native-a11y 3.5.1` last release 2024-11-04 (over 12 months) fails the dependency rule at `06-security-engineering.md:105`: AVOID. Use scan tests in vitest that read `accessibilityLabel`, `accessibilityRole`, `hitSlop` and 44 pt from source, as the existing a11y tests do.
- Decision: ADOPT (dev only; no bundle, no privacy effect) after the spike. Owner: K (QA steward reviews).

## LD-28 Journeys on a phone: USE Maestro; AVOID Detox
- Maestro flows exist: `apps/mobile/e2e/flows` has 20 files, plus `config.yaml`, `subflows`, `ci` [V]. The design picked Maestro with Detox as fallback (`01-mobile-client.md:603-604`; `07-quality-test-strategy.md:242-247` [V]).
- Maestro is a CLI, not an npm package, so it adds nothing to the bundle. Its licence (Apache-2.0) and CLI version are [U]; record them in the CI tool list.
- Spend: macOS runners cost 10 times as much, so nightly only (`07:16` [V]); Maestro Cloud or a Mac mini is the founder's (OQ-2, `07:684` [V]).
- The Playwright web preview (`apps/mobile/e2e-web`, devDependency `@playwright/test ^1.63.0`) covers web-only logic; it is not a phone test.
- Decision: USE. Owner: K for flows; F for spend.

## LD-29 Mutation testing: ADOPT Stryker for pure packages only
- `@stryker-mutator/core 10.1.1` and `@stryker-mutator/vitest-runner 10.1.1`, Apache-2.0, 2026-10-23 [V registry]. Dev only. Targets: `packages/core` (verifier, edits, age math) and `packages/api`, where a surviving mutant means a missing test on the constitution's code (`verifyEdits`).
- Not for `apps/mobile` (slow, native imports). Run nightly, not per PR; budget [U] until a first run reports minutes.
- Saved: an own mutation harness; [E] weeks. Risk: CI time. Way back: delete the config.
- Decision: ADOPT after RD-E sets the CI budget. Owner: K.

## LD-30 Performance measurement: USE size script, Hermes profiler, Instruments; ADOPT Reassure after L2; AVOID Flashlight and why-did-you-render
- Size: `scripts/size/measure.ts` (JS bundle attribution, thinning report) [V]. Budgets: 12 MB bytecode, 3 MB assets, 40 MB download (`APP_SIZE.md:5-9` [V]). RD-E owns the new budgets; `docs/engineering/readiness-20nov/performance/` did not exist on `origin/develop` on 20 Nov [V].
- Startup and render timings: Hermes sampling profiler and Xcode Instruments on an iPhone SE 3 are `human` device checks (cold start p50 1.2 s, p90 2.0 s).
- `reassure 1.6.1` (MIT, 2026-10-21): render-count and duration regression tests; needs the Jest harness of LD-27, so after it.
- Flashlight (BAM) is an Android profiler and is not an npm package of ours [E: general knowledge, not read]; no iOS. AVOID.
- `@welldone-software/why-did-you-render 10.0.1` (MIT, last release 2025-01-20, over 12 months): AVOID as a dependency; use React DevTools Profiler locally.
- Decision as stated. Owner: K; budgets RD-E.

## LD-31 Analytics, crash, calendar, camera, contacts SDKs: AVOID
- `@sentry/react-native 8.36.0` (MIT) and any analytics or crash SDK are matched by the label guard's `TRACKING_SDK` list (`label-effect.mjs:38` [V]); the rule is no content in crash reports (CLAUDE.md privacy rules). Crash reporting, if ever wanted, is a founder and counsel decision with a label line.
- `expo-calendar`, `expo-camera`, `expo-contacts`, `expo-media-library`: each needs a new usage string (G11-3 `label-effect.mjs:140` [V]); no card needs them.
- Decision: AVOID. Owner: F/C for any change.

## LD-32 Key-value storage and network state: USE what is installed
- Settings and flags live in SQLite (`expo-sqlite`), secrets in `expo-secure-store ~57.0.4`, connectivity in `expo-network ~57.0.2` [V package.json]. `react-native-mmkv 4.3.2` and `@react-native-community/netinfo 12.0.1` would duplicate them [V registry]: AVOID.

## LD-33 Export, compression, hashing, signatures: USE what is installed
- `fflate ^0.8.3` for the export zip, `expo-crypto ~57.0.3` and `@noble/hashes ^2.4.0`, `@noble/ed25519 ^3.2.0` (in `packages/api`) for hashes and signed manifests [V package.json files]. Do not add a second zip or crypto package.
- Decision: USE. Owner: K.
