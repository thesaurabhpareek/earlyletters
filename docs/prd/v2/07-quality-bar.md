# 07. Quality bar: done, tests, launch checklist, beta and release

Status: Draft V2, 3 Oct 2026. Replaces `docs/prd/PRD.md` 1.3 section 6 (launch checklist) and section 2.3 (launch gates), and folds in the Definition of Done from `docs/BACKLOG.md` and the test strategy in `docs/tdd/07-quality-test-strategy.md`. Budgets live in `06-nfr.md`; this file says how each one is proved and when it blocks.

Twenty agent engineers build from this. If a work package cannot show the evidence below, it is not done, whatever the code looks like.

## 1. Definition of done for a work package

A work package (WP-F##-##) is one pull request a reviewer can check in under 30 minutes (`_AUTHORING.md` section 5). It is done only when every line below holds. The PR template (`.github/pull_request_template.md`) repeats the checklist.

### 1.1 Tests

1. `npm test`, `npm run typecheck` and `npm run test:db` pass locally and in CI (`.github/workflows/ci.yml`). From `apps/mobile`, `npx tsc --noEmit` passes. Node 22 (CLAUDE.md).
2. The tests named in the WP's "Done when" column exist and pass. Each test that proves a requirement starts its title with the ID in brackets, for example `it('[F04-REQ-001] draft row exists before record()')` (BACKLOG DoD 1; TDD 07 section 2.1).
3. Logic that a pure function can decide lives in `packages/*` or a `*.logic.ts` file and is tested with vitest; the screen only calls it (TDD 07 section 1.1).
4. A bug fix lands with a test that failed before the fix, titled with the bug id and the requirement id (TDD 07 section 9.2).
5. No test is deleted, skipped or weakened without an ID-cited reason in the PR body. A known defect is marked `test.fails` with its backlog id, never removed (TDD 09 section 8.3).
6. A WP that touches a budgeted path (06-nfr.md) states the budget and how it was checked: unit timing, bundle size, or "needs device check" with a named human follow-up task (BACKLOG DoD 8).

### 1.2 Lint and static checks

1. Docs: `node docs/prd/v2/tools/lint.mjs <file>` is clean for every changed file under `docs/prd/v2/`.
2. App: `npm run lint -w @scribe/mobile` (`expo lint`) is clean. The accessibility and copy rules in section 2.3 become required as each lands [R].
3. No `console.*` in Edge Functions or app code paths that run in release builds (TDD 06 section 5.3).
4. Data map: any new or changed table, column, bucket, device store, SDK or vendor has its row in the data map in the same PR, with class, level (L1 to L4), owner and retention (BACKLOG DoD 5; DATA-REQ-001). The PR body states `Data classes touched:`.
5. Migrations: a new file inside the WP's assigned timestamp range; never an edit to a file listed in `.github/migrations-applied.txt` (migration guard workflow; D-041). Agents never apply a migration to a remote project.

### 1.3 Content rules and the constitution

1. Every user-facing string is in `packages/content` or a `copy.ts` in the feature folder (brief coordination rules). `npm test -w @scribe/content` passes. If a rule fails, the copy changes, not the test (CLAUDE.md).
2. No em dashes, en dashes, curly quotes, ellipsis characters or emoji in product copy; no fear, guilt or loss language; never imply AI writes anything; never gender the child (`{child}`); no streaks, points, badges or gap counts (CLAUDE.md content rules).
3. Every machine edit goes through `verifyEdits`; `raw_transcript` stays immutable; if cleaning behaviour changed, `ENGINE_VERSION` moves with a dated comment (CLAUDE.md; F06-REQ-018).
4. Typed text gets no machine edit (B5; F06-REQ-037).
5. A claim about privacy, security, durability or the free promise is registered in the claims registry (LEGAL-REQ-044).
6. No content, child name, language name, token or person id in any log, event, crash report, push payload or URL (LEGAL-REQ-014). Fixtures use the fictional family Asha only.
7. The public name comes only from `packages/brand` (CLAUDE.md).

### 1.4 Accessibility

New or changed screens: Dynamic Type to AX5 with no truncation (letter text never capped, D-027); VoiceOver labels and roles; focus to sheet titles; 44 pt targets (56 pt primary); Reduce Motion honoured; contrast from tokens only. Proved by a component test at default and AX5, and for P0 flows by the VoiceOver script on SE 3 before beta (section 2.11) (A-NFR-005 to A-NFR-007; LEGAL-REQ-051).

### 1.5 Review

1. One concern per PR (CLAUDE.md). The PR body lists `Satisfies:` requirement IDs and the WP id.
2. One reviewer from CODEOWNERS. Today every area routes to the founder (`.github/CODEOWNERS`); an independent review agent runs first on every PR (09 R-04).
3. Any PR touching `supabase/**` or auth also needs a second independent agent review and the founder's `approve-migration` label (D-041; F16 section 9).
4. Changes to `packages/core/src/verify.ts`, `meaning.ts`, `types.ts`, `pipeline.ts` or `plan.ts` need the founder's explicit approval in the PR (CODEOWNERS comments).
5. Changes to the analytics catalogue need the analytics owner and privacy counsel when counsel is available (TDD 07 section 8).
6. The WP stays inside the files its row owns. Anything outside goes in the PR body as a request (brief coordination rules).

### 1.6 Reporting

The author's final report lists: files changed; test results with counts; what needs a real device; what the founder must do; what is unfinished (brief coordination rules).

## 2. Test strategy

### 2.1 Layers

| Layer | Tool | Runs | What it owns | Gate |
|---|---|---|---|---|
| L0 static | tsc, `expo lint`, docs lint, data-map diff, SDK denylist, manifest lint, secret scan, IPA size | Every PR | Types, banned imports, banned SDKs, ATS, permissions, keys in bundle, 40 MB | G0 |
| L1 unit | vitest | Every PR | `packages/core` (engine, verifier, plan, prompts, planner, notice windows, backdating, capture reducer), `packages/content`, `packages/analytics`, `packages/design-tokens`, `apps/mobile/test` logic | G0 |
| L1b engine regression and property | vitest, fast-check | Every PR (fixed seed); nightly (random seed, printed) | R-01 suite, verifier property tests, Hermes parity | G0 (nightly red blocks G2) |
| L2 component | jest-expo and Testing Library (new, BL-Q08) [R] | PRs touching `apps/mobile` | AX5 rendering, labels, targets, focus order, placement rules | G0 once the harness lands |
| L3 database | PGlite harness (`npm run test:db`) | Every PR; always on `main` | RLS matrix, triggers, RPCs, parity and leak suite, purge with clock control, classification, plan-shape performance | G0 |
| L4 service | Deno tests with fakes | PRs touching `supabase/functions` | `invite-redeem`, `apple-token`, `push-send` | G0 |
| L5 end to end | Maestro on iOS simulators, mitmproxy for network assertions | Nightly and release candidate | The flows in section 2.6 | G2 |
| L6 device | Scripted runs on iPhone SE 3 and a current iPhone | Release candidate | Budgets, kill runs, transcription speed and memory, sandbox, VoiceOver | G3, G4 |
| L7 corpus | `experiments/` gate tooling (WP-F05-02) | On any change to model, pack, prompt rendering, VAD, chunk planner or `ENGINE_VERSION` | Per-language transcription gates | Manifest publish |
| L8 load | k6 in staging | Before public launch; before 10k and 25k families | 06-nfr.md section 16 | G4 (2x 1k) |

Today's suites, as CLAUDE.md lists them: engine 237, mobile 31, content rules 16, analytics 39, tokens 4, experiments 11; `npm run test:db` runs 8 files (access matrix, security and family, governance, classification, entitlements, purge, performance, RLS). Counts change as WPs land; CLAUDE.md is updated by the coordinator, not here.

### 2.2 Unit

Every WP adds unit tests for its pure logic first. The ones that guard promises:
- Plan rules: `decide()` table tests over first run, joined only, lapsed, Plus, offline, birthday cases; a compile-time check that no free-forever feature is gated (`packages/core/src/plan.ts`; F12-REQ-001; LEGAL-REQ-050).
- Reminder planner property test across 24 time zones and both DST changes: zero slots in 21:30 to 07:00 (C-NFR-001 Rev).
- Notice windows as data: every window in C-REQ-025 and C-REQ-026 over a synthetic year with clock control (PRD-REQ-003 Rev).
- Prompt selector: no key repeats within 365 days per author and child over a 2-year simulation (F13-REQ-004).
- Capture reducer: draft row before `record()`; one take at a time; cap at 30 minutes (F04-REQ-001, F04-REQ-006, F04-REQ-010).

### 2.3 Engine regression, including R-01

The faithful-edit engine is the one claim nobody else makes (05 rank 2), and R-01 showed it accepts meaning changes outside English (09 R-01).

| Suite | Content | Pass bar | Where | Source |
|---|---|---|---|---|
| R-01 regression (`packages/core/test/regression/`, new) | At least one refused case per defect D1 to D14 in every launch language whose script it applies to (Latin: D3, D4, D6, D7, D10, D12, D13, D14; Devanagari: D1, D2, D4, D8, D9, D13; Arabic: D2, D3, D4, D5, D8; Chinese: D4, D5, D7), plus one accepted legitimate edit per language as a control; each non-English case signed off by a native reviewer | **Zero accepted meaning changes per language**, in Node CI and inside the iOS dev build under Hermes. Any failure blocks that language's pack from the manifest and fails the build | Every PR (Node); every release candidate (Hermes) | F06-REQ-019; 09 R-01 |
| English adversarial cases | "daughter" to "son" and the existing 13 adversarial verifier cases | Rejected | Every PR | `packages/core/test/verify.test.ts`; 09 R-01 |
| Property test | Random edits across Latin, Devanagari, Arabic and Han text with invisible characters, combining marks and every quote style | Zero accepted meaning changes; fixed seed per PR, random seed nightly (printed); 10,000 cases | Every PR and nightly | F06-REQ-021; F07 section 9 |
| Determinism | Same raw, level, dictionary, locks, pack version and engine version give byte-identical edits on Node and Hermes | Byte equality | Every release candidate | F06 section 9 |
| Replay | Every stored version replays byte for byte; an engine update never changes a saved letter | Byte equality | Every PR | F06-REQ-022, F06-REQ-025 |
| Dictionary defects | Common words matching a name stay as said; names match whole words in every script; one family name never becomes another | Defect tests green | Every PR | F07-REQ-009 to F07-REQ-011; F06-REQ-008, F06-REQ-014 |
| Scorer parity | `experiments/score.ts` uses the core tokenizer; Chinese scored by CER | Word counts match the core tokenizer on R5 E8 inputs | Every PR touching `experiments/` | F06-REQ-020 |

No non-English language may pass its corpus gate (2.8) before its script's R-01 cases are green (F05-REQ-004). The verifier and its non-English fix are on the never-cut list (05 section 5).

### 2.4 Database access tests

- **Access matrix.** Roles {author, other parent, left parent, removed parent, dormant contributor, stranger, service} by objects {every public table, view, RPC and bucket} by verbs. Expected outcome per cell. A new table, role or RPC with no row fails the run (TDD 07 section 7.1; `supabase/tests/access_matrix.test.mjs` exists).
- **Parity and leak suite.** For each fixture user, `sync_pull` returns exactly what RLS and `book_entries` allow; zero differences; cross-child leak both directions (F16-REQ-008; PRD-REQ-014).
- **Working material.** No other member receives `raw_transcript`, `machine_edits`, `stt_meta`, the author layer or edit history through API or pull (PRD-REQ-004 Rev).
- **Dormant contributor path.** The server refuses `contributor` invites while `contributors_enabled` is false; contributor rules keep their tests green so F32 can switch them on (F11-REQ-003; B-REQ-009 Rev).
- **No Plus on the server.** `create_child` paths never read `has_plus`; store tables and functions are dropped (F12-REQ-002; F14-REQ-012).
- **Migration upgrade test.** Apply `main`'s migrations, load fixtures, apply the new file, re-run every suite (TDD 07 section 7.1) [R].
- **Clock-controlled retention.** Just-inside and just-past pairs for every retention row (LEGAL-REQ-033).
- **Performance plan shape.** `perf.test.mjs` budgets plus realistic rows and write paths with triggers on (BL-289).

### 2.5 Content and copy tests

`packages/content/test/rules.test.ts` runs on every PR. The additions TDD 07 section 6 lists (reminder rhythm words, child-directed copy, print, beta placement, 90-day pledge, claims registry, gendering outside prompts, brand literal, no hardcoded JSX text, push payloads without content, no "free" for trial-ineligible users) are each a test titled with its ID before the strings they guard ship (BL-Q05). A human voice review stays on every PR that changes `packages/content` (TDD 07 section 6).

### 2.6 End to end

Maestro flows on the SE 3 and current-iPhone simulators, nightly and per release candidate, with mitmproxy recording every request. TDD 07 section 3.3 defines 15 flows; V2 keeps them with these changes:

| Flow | Change for V2 |
|---|---|
| E2E-03 Speak, review, save | Add the zero-request assertion for capture and the "Please have a read" card once |
| E2E-05 Read together gate | Session starts at sequenced playback of a chapter (DR-06); other parent's recordings skipped |
| E2E-07 Add a child | The server accepts the book from a modified client (DR-04) |
| E2E-11 Consent on and off | Unchanged |
| E2E-12 Offline capture, then sync | Uses the outbox and `sync_pull` (D-023 default) |
| E2E-13 Co-parent invite | Parent role only; at most two parents; no grandparent step (B1) |
| E2E-14 Trial and cancel | StoreKit sandbox on device; device-computed notices (DR-02 A); no server webhooks (B2) |
| New E2E-16 Language pack | Pick Portuguese in first run: only the Portuguese pack is requested; delete it in Settings; letters unchanged (F05-REQ-019, F05-REQ-024) |
| New E2E-17 Export with listening copies | Export on and off copies; originals byte-identical (F15-REQ-001, F15-REQ-002) |

Every flow runs with the Asha fixtures, and the proxy log of every run is scanned by the log canary (LEGAL-REQ-014).

### 2.7 Device tests on iPhone SE 3

Owned devices: one iPhone SE (3rd gen) and one current iPhone (TDD 07 section 4). Each release candidate runs, on SE 3 on iOS 17 and the latest iOS:

| Run | What | Pass | Source |
|---|---|---|---|
| Budget run | Every row in 06-nfr.md sections 2, 4, 10 marked Gate; 200 samples | Every budget met | 06-nfr.md; BL-044 |
| Kill during save | Scripted `kill -9` at random offsets (0 to 400 ms after Save) | **500 of 500** on Simulator and **50 of 50** on SE 3: zero loss, zero rows pointing at missing files, `PRAGMA integrity_check` ok, every audio hash matches | F04 section 9; DATA-REQ-048; BL-135 |
| Kill while recording | 50 kills at 10 s to 120 s into a take | 50 of 50 rows kept; 49 or more of 50 playable to within 5 s | F04-REQ-024 |
| Typed kills | 100 kills while typing | At most 500 ms of typing lost each time | F04-REQ-011 |
| Review kills | 100 kills in Review | 100 of 100 recover exactly | F06-REQ-036 |
| Transcription | 30 runs of a 2-minute letter per passed language | p90 30 s or less; 2% battery or less; zero jetsam | F05-REQ-040 |
| Listening copy | 30 runs of a 2-minute clip | 10 s or less once measured; original hash unchanged | F08 section 9; F08-REQ-002 |
| Export | Year-1 fixture, airplane mode | Originals under 2 minutes; with copies measured against 4 minutes | C-NFR-007; F15 Q1 |
| Settings sweep | Dark mode, Reduce Motion, Bold Text, Increase Contrast, AX5, Low Power Mode, under 1 GB free, time zone and DST change, 12 and 24-hour time | No defect on a P0 screen | TDD 07 section 4 |
| Arabic keyboard | Type a letter right to left | Text and caret right to left; stored exactly | F04-REQ-013 |

Evidence for every device run is saved in `docs/qa/evidence/` (new folder): date, build, device, iOS, tester, pass or fail, Asha fixtures only (TDD 07 section 2.1).

### 2.8 Per-language corpus gates

A language is transcribed on a device tier only after it passes its own gate on the shipped model, pack and engine version (DR-01 A; F05-REQ-001 to F05-REQ-006). Until then it shows as Record and type.

| Language | Primary metric after cleaning | Bar | Script and punctuation bar |
|---|---|---|---|
| English | WER | 10% or less | n/a |
| Spanish | WER | 10% or less | Opening ¿ or ¡ present where the sentence ends in ? or !, 90% or more |
| French | WER | 10% or less | No-break spaces kept before : ; ? ! |
| Portuguese | WER on the speaker's own variety | 10% or less for both Brazilian and European speakers | No spelling converted between varieties |
| Mandarin | CER | 10% or less | Simplified characters 99% or more after the `script` edit; full-width punctuation |
| Hindi | WER | 15% or less | Devanagari 95% or more of Hindi words; English words in Latin 95% or more |
| Arabic | WER per dialect group | 20% or less per group | Arabic punctuation kept; no harakat added or removed |

For every language also: names exact after cleaning 95% or more; zero phantom words on the noise clips; 2-minute letter p90 30 s or less on the tier device; zero jetsam in 30 runs (F05 section 7.1).

Sample per language: 10 consenting adult native speakers (Arabic at least 3 dialect groups of 4; Portuguese 5 Brazilian and 5 European), 3 scripted Asha letters of about 2 minutes plus 1 unscripted letter each, recorded in bedtime conditions, plus 5 noise clips; about 40 clips and 80 minutes. Per-speaker bootstrap 95% interval; a language passes when the point estimate meets every bar, and if the interval's upper end crosses a bar the founder sees the interval before it ships (F05 section 7.1, F05-REQ-003).

Preconditions for a non-English pass: the R-01 cases for its script are green (F05-REQ-004); a native-speaker sign-off file `docs/qa/evidence/F05-pack-<lang>-<version>.md` exists (F05-REQ-005); F07's dictionary defect tests pass for its script. A gate goes stale, and the manifest build fails, on any change to model file, pack, prompt rendering, VAD settings, chunk planner or `ENGINE_VERSION` (F05-REQ-006). A founder-signed exception is the only way to publish a language that misses a bar (F05-REQ-002). Corpus audio lives in a private bucket, never in git (F05 section 7.1).

### 2.9 Purchase sandbox

On device, by the founder and the payments owner, every release candidate that touches F14 and once before G4 (WP-F14-12; BL-222). S-1 trial start and acknowledgment; S-2 conversion; S-3 renewal; S-4 kill after pay; S-5 grace; S-6 Ask to Buy; S-7 Family Sharing on a second Apple Account; S-8 restore on a second device in under 10 s; S-9 refund sheet; S-10 manage in one tap; plus a network capture showing zero purchase data to our hosts (F14-REQ-014). Production transactions only count in production builds (F14-REQ-004).

### 2.10 Restore drills

| Drill | When | Pass | Source |
|---|---|---|---|
| Server restore: restore to a scratch project, ledger replay, restore epoch, two synthetic devices reconcile | Before the first non-founder family, then quarterly | Zero own rows deleted on either device; others' rows kept 30 days as waiting; RPO 24 h or less; RTO 4 h or less; `npm run test:db` passes on the restored copy | BL-247; WP-F16-08; F16-REQ-012; DATA-REQ-030, DATA-REQ-031 |
| Device durability: iCloud device backup restored to a second phone; export ZIP re-read; sign-in on a new phone re-downloads text | Every release candidate | Letters and recordings back from the device backup; ZIP passes self-verification; one year of text on the new phone within p95 30 s | BL-284; D-033; WP-F15-10 |
| Kill switches | Every release candidate, in staging | Each switch takes effect within 5 minutes; local recording, reading and export keep working | LEGAL-REQ-040; F16-REQ-018 |

Until the server restore drill passes, production is not restored to an earlier point while non-founder families exist; fix forward instead (TDD 06 section 6.3).

### 2.11 VoiceOver script

Run on SE 3 by a person, at AX5 with VoiceOver on, before G3 and G4, under 20 minutes per script (TDD 09 section 8.3). V1 covers: 18+ gate, welcome, first run, Tonight, Speak, Pause, Finish, Review, open one change row, put it back, Undo, Add to book, Book, open a letter, play, Read together start and pause, Settings > Plan, Export, Delete account up to the final confirm.

Pass when: every control is reachable by swipe in visual order; states are announced (Listening, Paused, checked); errors and saves are announced; focus lands on sheet titles; nothing announces while a voice is playing (F10-REQ-017); no Undo window closes while VoiceOver is reading. V2 Voice Control, V3 Switch Control, V4 large text with Bold Text, V5 contrast and grayscale, V6 motion and Low Power Mode, V7 Full Keyboard Access run before G4 (TDD 09 section 8.3). Recruit 2 or 3 beta testers who use VoiceOver or large text daily; their findings outrank our script (TDD 07 section 5).

### 2.12 Load

k6 scenarios S1 to S13 from TDD 06 section 8.2, with S5, S6, S10 and S13's entitlement part removed (no audio upload, no webhooks, B2 and B7) and a `sync_pull` storm added. Launch gate: 2x the 1k targets plus a 4-hour soak (06-nfr.md section 16; BL-282; WP-F16-12).

## 3. Launch acceptance checklist, by feature

Each line is pass or fail. **[auto]** is an automated test that runs in CI, nightly or the release workflow; **[manual]** is a scripted check by a person with evidence saved in `docs/qa/evidence/`. Every line must pass on an iPhone SE (3rd gen) and a current iPhone before App Store submission (G4, section 5). IDs are the requirements the line proves; the test title carries the first one.

Where a feature spec is not yet written (F18 to F21, and F17 section 7 at the time of writing), lines cite PRD 1.3 and LEGAL-REQ IDs and are re-pointed to F##-REQ IDs when the spec lands. The checklist is regenerated from test titles by `scripts/trace.mjs` (BL-002) once it exists; until then this list is the source.

### F01 Entry, 18+ gate and welcome
- [ ] [auto] Airplane-mode cold start renders the first route and hides the splash; no awaited network, model or sync (A-REQ-002).
- [ ] [auto] Fresh install opened by icon, invite link or auth link: the first interactive screen is the 18+ gate with nothing selected and Continue disabled (PRD-REQ-019 Rev, LEGAL-REQ-002).
- [ ] [auto] Yes stores only `ageGate.passed = '1'`; no age, date, range or timestamp of the Yes on the device or server (F01-REQ-001).
- [ ] [auto] No leaves exactly one `ageGate.stoppedAt` row, no Keychain token, no file, zero network requests; a relaunch at 23 h 59 min shows the stop screen (F01-REQ-002).
- [ ] [auto] A Declared Age Range result is never stored, logged or sent (store, logger, Sentry and analytics spies see zero calls) (F01-REQ-003).
- [ ] [auto] An invite link survives the gate only after Yes; No deletes the token (F01-REQ-004).
- [ ] [auto] Welcome shows Start a book, I was invited and Sign in, each 44 pt or taller, all reachable at AX5 without horizontal scroll (F01-REQ-005).
- [ ] [auto] No OS permission prompt appears from install through Welcome (F01-REQ-007).
- [ ] [manual] VoiceOver: every element labelled, focus starts on the title, the stop screen is announced; AX5 has no truncation (F01-REQ-008).

### F02 Account and sign-in
- [ ] [auto] A first letter is saved with no sign-in asked (A-REQ-012).
- [ ] [auto] Keep the book opens within 500 ms of the first save's animation with Apple, Google, Email and Later; Later keeps record, review, save, book, Read together tries and export working (A-REQ-013 Rev, A-REQ-014).
- [ ] [auto] Re-ownership: every local row carries the new user id before any sync request; a forced failure changes zero rows (A-REQ-015).
- [ ] [auto] Email sends one message with a link and a 6-digit code; either signs in once; resend disabled 60 s; at most 5 per address per hour; 5 wrong codes in 15 minutes pause the device (A-REQ-018 Rev, A-REQ-025, A-REQ-027).
- [ ] [auto] A scanner that runs scripts and clicks buttons on `/auth/confirm` sends no request to Supabase; the page's button carries no token (A-REQ-023, F02-REQ-011).
- [ ] [manual] Auth links and `/j` links open the app from Mail, Gmail, Outlook and Messages (A-REQ-022).
- [ ] [manual] A Hide My Email address receives the sign-in email; SPF, DKIM and DMARC pass from `hello@earlyletters.com` (F02-REQ-006, A-REQ-026).
- [ ] [auto] Account creation writes exactly one `terms` row with `age_attested = true` before any other row syncs, then the sensitive-data consent; declining keeps all content local; the server raises `SCCON` for content before consent (A-REQ-034, PRD-REQ-002, F02-REQ-010).
- [ ] [auto] Sign out or Apple revocation never discards an unsynced letter: with 3 unsynced letters the session stays until the queue is empty (F02-REQ-001, A-REQ-033).
- [ ] [auto] Tokens are never in AsyncStorage, settings, logs, route params or Sentry (F02-REQ-003).
- [ ] [auto] Known and unknown email addresses get identical screens and timing class (F02-REQ-005).
- [ ] [auto] At most one of Keep the book, reminder prime or analytics consent per session, in that order across sessions (PRD-REQ-001 Rev).

### F03 First run
- [ ] [auto] Only a name and a birthday or due date are required; nothing asks for surname, gender, photo or contacts (B-REQ-001).
- [ ] [auto] Children, signatures, languages and dictionary terms commit in one transaction at the final tap; a kill before it leaves no child row (F03-REQ-002, B-REQ-006 Rev).
- [ ] [auto] Three children in first run make three books, no Plus sheet, one `create_first_run_children` call accepted (PRD-REQ-015).
- [ ] [auto] A language that has not passed its gate shows Record and type; the label changes from the signed manifest on next launch without a release; offline uses the last good copy (F03-REQ-003, F03-REQ-004).
- [ ] [auto] Choosing Portuguese requests only the Portuguese pack; the model download never blocks first run (F03-REQ-005, F03-REQ-006).
- [ ] [auto] No OS prompt and no paywall during first run (F03-REQ-007).
- [ ] [manual] Median gate to first saved letter is 90 s or less over 10 scripted runs on SE 3 (F03-REQ-008).
- [ ] [auto] An RTL name and RTL typed text follow their own direction; dates use the device locale (B-NFR-007).
- [ ] [auto] Airplane mode from gate to first saved typed letter (B-NFR-009).

### F04 Capture
- [ ] [auto] A `drafts` row with state `recording` and the file path exists before `record()` is called (F04-REQ-001).
- [ ] [auto] Capture works offline: voice-only, typed and Not much today all save with 0 requests in the proxy log (A-REQ-030).
- [ ] [auto] Backgrounding while recording stops and keeps the take within 1 s; `UIBackgroundModes` has no `audio` (LEGAL-REQ-011).
- [ ] [auto] Any OS interruption finalizes the take once and opens Review; never auto-resumes (F04-REQ-003).
- [ ] [auto] Launch recovery never deletes audio; only a confirmed Let it go deletes a file (F04-REQ-004, F04-REQ-009).
- [ ] [manual] Kill during save: 500 of 500 on Simulator and 50 of 50 on SE 3, zero loss (DATA-REQ-048).
- [ ] [manual] Kill while recording: 50 of 50 rows kept, 49 or more of 50 playable to within 5 s (F04-REQ-024).
- [ ] [manual] Typed kills: 100 iterations, at most 500 ms of typing lost (F04-REQ-011).
- [ ] [auto] Typed text is stored exactly as typed (em dash, curly quotes, ellipsis, emoji, Devanagari and Arabic survive byte for byte); `edit_level = verbatim` (F04-REQ-012, B5).
- [ ] [auto] The recorder enables no voice processing, gain or noise suppression (F04-REQ-026, B6).
- [ ] [auto] Storage under 50 MB creates no draft; a drop under 20 MB mid-take stops and keeps the take within 30 s (F04-REQ-008).
- [ ] [auto] Microphone asked only at first Speak, after the primer; the purpose string matches v1.0 facts (LEGAL-REQ-007 Rev).
- [ ] [auto] No Keep the book, reminder or analytics sheet appears in Listen, Write or Review (PRD-REQ-001).
- [ ] [auto] With `child-input` off, no `together` prompt and no "Write one together" entry (PRD-REQ-005).
- [ ] [manual] Tap Speak to microphone live p95 500 ms over 200 taps on SE 3 (F04-REQ-023).
- [ ] [manual] VoiceOver order on Listen, announcements on start, pause and resume, Magic Tap toggles Pause (F04-REQ-019).

### F05 Transcription and language packs
- [ ] [auto] A language is transcribed only after its gate passes for this phone's tier; otherwise Review offers Type the words (F05-REQ-001).
- [ ] [manual] Every language in the release has a gate report meeting section 2.8 with a native-speaker sign-off file; no non-English report predates its R-01 fix (F05-REQ-002 to F05-REQ-005).
- [ ] [auto] CI marks gates stale on any model, pack, prompt, VAD, chunk planner or `ENGINE_VERSION` change and the manifest build fails until new reports exist (F05-REQ-006).
- [ ] [auto] Language is never `auto`; `translate` is false; diarization off (config lint) (F05-REQ-008, F05-REQ-009).
- [ ] [auto] Capture and save never wait for transcription; waiting letters get words exactly once; typed text is never replaced (F05-REQ-010 to F05-REQ-012).
- [ ] [auto] A background at chunk 3 of 5 resumes at chunk 4 and the result equals an uninterrupted run (F05-REQ-013).
- [ ] [auto] The IPA holds no model, no file over 5 MB matching `*.bin`, no pack but `en` (F05-REQ-016).
- [ ] [auto] Tampered, unsigned or rolled-back manifests and assets are rejected; the last good copy stays (F05-REQ-018, F05-REQ-020).
- [ ] [auto] Download resumes at 5 kill offsets with no part fetched twice; no bytes on cellular with mobile data off; size shown before Download (F05-REQ-021, F05-REQ-022).
- [ ] [auto] Deleting a pack or model frees space and leaves every letter, recording and transcript unchanged; models are backup-excluded (F05-REQ-024, F05-REQ-025).
- [ ] [manual] Per passed language on SE 3: p90 30 s or less, 2% battery or less, zero jetsam in 30 runs (F05-REQ-040).
- [ ] [auto] Audio never leaves the phone (F05-REQ-038).

### F06 Faithful edit and review
- [ ] [auto] R-01 regression suite: zero accepted meaning changes per launch language in Node CI (F06-REQ-019).
- [ ] [manual] Same suite inside the iOS dev build under Hermes on the release candidate: zero accepted meaning changes; byte-identical edits to Node (F06-REQ-019).
- [ ] [auto] Every machine edit passes `verifyEdits`; a `raw_transcript` update fails at the database (CLAUDE.md, DATA-REQ-040 Rev).
- [ ] [auto] Property test with scripts and invisible characters: zero accepted meaning changes, 10,000 cases (F06-REQ-021).
- [ ] [auto] An engine update never changes a saved letter; every version replays byte for byte (F06-REQ-022, F06-REQ-025).
- [ ] [auto] Typed letters get no machine edits (F06-REQ-037).
- [ ] [auto] Others see final text only (F06-REQ-033, PRD-REQ-004 Rev).
- [ ] [auto] The "Please have a read" card shows once, after the first spoken transcript, never for typed letters (F06-REQ-034, K-14).
- [ ] [manual] 100 of 100 kills in Review recover exactly (F06-REQ-036).
- [ ] [manual] 300-word clean p95 300 ms on SE 3; 4,000 words: raw within 300 ms, marks within 1 s (F06-REQ-041).
- [ ] [auto] No control offers to make words nicer (content test) (F06-REQ-039).

### F07 Names and words dictionary
- [ ] [auto] A taught heard-as becomes an `stt_fix` that passes `verifyEdits` and is reversible; no other path writes a spelling into text (F07-REQ-004).
- [ ] [auto] Add to your words commits the term and re-cleaned edits in one transaction; a rejected fix still saves the term (F07-REQ-005, F07-REQ-006).
- [ ] [auto] No form in another script is ever generated (F07-REQ-008).
- [ ] [auto] Defect tests per script: whole-word matches, case-only fixes never change ordinary words, no fix targets another term (F07-REQ-009 to F07-REQ-011).
- [ ] [auto] No non-English dictionary fix ships before the R-01 fix (F07-REQ-014).
- [ ] [auto] Deleted terms leave saved letters byte-identical (F07-REQ-018).

### F08 Recordings
- [ ] [auto] The original's SHA-256 is unchanged after a listening copy, 10 plays, export and an app update; no code path opens an original for writing (F08-REQ-002).
- [ ] [auto] The listening copy is a second file made after save from the original only; off while `listening_copy_enabled` is false (F08-REQ-003, F08-REQ-006).
- [ ] [auto] Single-letter playback works in every plan and account state with no entitlement check (F08-REQ-008).
- [ ] [auto] Another author's letter whose file is not on this phone shows `book.recordingElsewhere` and no play control (F08-REQ-012).
- [ ] [auto] No audio in any request across the full E2E run (F08-REQ-018).
- [ ] [manual] Local playback start p95 300 ms on SE 3 (F08 section 9).
- [ ] [auto] Settings > Recordings shows the v1.0 durability copy and no backup toggle; the sentence is in the claims registry (F08-REQ-014).
- [ ] [auto] The keep-safe card points to export and device backup, once per chapter, never as a push (C-REQ-018 Rev).

### F09 The book
- [ ] [auto] Chapters by month of age, ordered by the moment, ties by capture time (F09-REQ-001, F09-REQ-002).
- [ ] [auto] Empty months show invite rows with no digit counting letters (F09-REQ-005, C-REQ-015).
- [ ] [auto] Mixed scripts render byte for byte, Arabic right to left, Devanagari in Tiro, no missing-glyph boxes (F09-REQ-008).
- [ ] [auto] Private by default; a private letter reaches no other member's device (B-REQ-011).
- [ ] [auto] A co-parent's letter shows no Delete, Edit or Change the date; `delete_entry()` fails (DATA-REQ-015).
- [ ] [auto] Restore goes through `restore_entry()` only (F09-REQ-013).
- [ ] [auto] No due-date card, line or countdown (B-REQ-015).
- [ ] [auto] The book, letter view, date change, delete and restore import nothing from the plan engine (F09-REQ-014).
- [ ] [auto] Milestones render as inline cards once per reader; no modal, push or confetti (C-REQ-010, F09-REQ-017).

### F10 Read together
- [ ] [auto] With `read_together_free_sessions = 3`, the 4th Start opens the Plus sheet; changing the value changes the limit without a release; single-letter playback is never counted (PRD-REQ-020 Rev).
- [ ] [auto] A session counts once, at first playback, only in try mode; chapters with no recording on this phone never count (F10-REQ-001, F10-REQ-002, F10-REQ-004).
- [ ] [auto] Nothing plays before Start; interruptions never auto-resume; no background audio mode (F10-REQ-005, F10-REQ-011, F10-REQ-013).
- [ ] [auto] No Plus sheet during a session (F10-REQ-014).
- [ ] [auto] No string says every letter plays in its author's voice while DR-07 A holds (F10-REQ-018).
- [ ] [manual] VoiceOver announces nothing while a voice is playing (F10-REQ-017).

### F11 Co-parent sharing
- [ ] [auto] A retried invite create makes one row; no token or code in clear in the database (F11-REQ-002, B-NFR-002).
- [ ] [auto] The server refuses `contributor` invites while `contributors_enabled` is false; at most two parents per book (F11-REQ-003, F11-REQ-004).
- [ ] [auto] Joining needs the 18+ gate, sign-in, Terms with age and sensitive-data consent, in that order (F11-REQ-006).
- [ ] [auto] 1,001 failed codes in an hour return `SCRAT` for everyone and alert within 15 minutes; links keep working (F11-REQ-007).
- [ ] [auto] The other parent's pull matches the visibility matrix row for row; no working material (F11-REQ-009, PRD-REQ-004).
- [ ] [auto] With two parents, delete means leave and remove own letters; the other parent keeps the book (B-REQ-016, DATA-REQ-012).
- [ ] [auto] Muting Reminders still delivers co-parent letter pushes; push payloads carry no content (C-REQ-007 Rev, LEGAL-REQ-054).
- [ ] [auto] A letter in any language shows as written; nothing translates or transliterates (F11-REQ-016).
- [ ] [auto] Outside the other parent's Apple Family, Plus is not assumed (F11-REQ-017).
- [ ] [manual] Invite to join on a second phone through the `/j` link and through the code (E2E-13 on devices).

### F12 Multiple children
- [ ] [auto] Cross-child leak: no sibling row, member or photo for any pull or query (PRD-REQ-011, F16-REQ-008).
- [ ] [auto] "To {child}" visible while recording; changing it in Review saves to the chosen child only (PRD-REQ-012, B-REQ-004).
- [ ] [manual] Switch child p95 300 ms offline on SE 3 (PRD-REQ-012).
- [ ] [auto] Free with one started book reaches the Plus sheet at the third tap; a joined book never counts; the server accepts a book from a modified client (PRD-REQ-015 Rev, DR-04).
- [ ] [auto] `create_child` never reads `has_plus` (F12-REQ-002).
- [ ] [auto] Hiding a book removes every child-anchored notification on every member device within one sync; Show again restores them (B-REQ-014, F12-REQ-005).
- [ ] [auto] A lapsed user can write in every book (C-REQ-028).
- [ ] [auto] Every per-child setting is 2 taps or fewer from Settings (PRD-REQ-013).

### F13 Prompts, reminders and notifications
- [ ] [auto] No OS notification prompt before the first letter; the priming card shows on a later session, never with Keep the book; at most 2 primes ever (C-REQ-001 Rev).
- [ ] [auto] Default schedule delivers 2 reminders plus at most 1 month note per included child in a quiet week; zero slots in 21:30 to 07:00 across 24 zones and both DST changes (C-REQ-002, C-NFR-001 Rev).
- [ ] [auto] A save at 19:00 suppresses the 20:30 slot (C-REQ-004).
- [ ] [auto] Content test fails on "daily", "every day", "in a row", "missed", "since your last", "streak" or a day count (C-REQ-005).
- [ ] [auto] Names in notifications off by default: no child name in any scheduled request on a fresh install (C-REQ-009 Rev).
- [ ] [auto] No prompt repeats within 365 days per author and child (F13-REQ-004).
- [ ] [auto] Every reminder is local; zero network requests carry schedules or fire events (F13-REQ-009).
- [ ] [auto] Payload `data` holds only route ids (F13-REQ-012, LEGAL-REQ-054).
- [ ] [auto] From 21 days before a due date until a birth date is set, nothing routes to or names that child (F13-REQ-013, B-REQ-015).
- [ ] [manual] 198 or more of 200 slots fire within 15 minutes over 14 days on a test build (C-NFR-001 Rev).

### F14 Plus
- [ ] [auto] The sheet opens only from Add a child, Read together Start or Settings > Plan; zero sheets and zero product fetches on the 8 forbidden surfaces (C-REQ-023 Rev, F14-REQ-019).
- [ ] [auto] Eligible users see price, "Free until" with the date, "renews automatically" and the cancel line; ineligible users see no "free"; AX5 on SE 3 has no truncation (C-REQ-022 Rev).
- [ ] [manual] Counsel signs off the disclosure layout inside Apple's view (LEGAL-REQ-046 Rev).
- [ ] [auto] Trial and renewal notices computed on the device fall inside the windows in C-REQ-025 and C-REQ-026 over a synthetic year; turning auto-renew off clears pending notices (C-REQ-025 Rev, C-REQ-026 Rev, PRD-REQ-003 Rev). Blocked by DR-02 until counsel answers.
- [ ] [auto] Exactly 1 `completed` and at least 1 `started` `auto-renewal-terms` act per purchase; no transaction id stored (LEGAL-REQ-049 Rev).
- [ ] [auto] StoreKit stubbed to throw with a lapsed fixture: write, read, play and export succeed with zero Plus UI (LEGAL-REQ-050, C-NFR-004 Rev).
- [ ] [auto] Zero purchase data in any request, header, log, event or crash report (F14-REQ-014).
- [ ] [auto] Family-shared Plus: Plus allowed, zero notices planned, no refund row (F14-REQ-006).
- [ ] [auto] Remote config can raise but never lower Read together tries below 3 (F14-REQ-018).
- [ ] [manual] Sandbox checklist S-1 to S-10 passes on device, including restore on a second device in under 10 s and Plus within 2 s in 48 of 50 purchases (section 2.9; C-REQ-020 Rev, C-NFR-002 Rev).
- [ ] [auto] Store tables and functions are dropped; server code enforces no Plus (F14-REQ-012, B2).

### F15 Export and the PDF book
- [ ] [auto] A lapsed user offline exports a ZIP with every own entry (raw transcript, edits, final text, timestamps), audio, PDF and `account.json`; co-parent letters have no raw transcript; zero Plus UI (LEGAL-REQ-034, C-REQ-017, DATA-REQ-050 Rev).
- [ ] [auto] Every file is listed with SHA-256 and bytes and re-read before ready; a flipped byte is reported (DATA-REQ-051).
- [ ] [auto] Originals byte-identical to capture; listening copies included by default and switchable (F15-REQ-001, F15-REQ-002).
- [ ] [auto] PDF text equals each in-book letter's `final_text`; no blank pages; no empty-month chapters; private letters absent (F15-REQ-004, F15-REQ-005).
- [ ] [manual] PDF fixture with Hindi, Arabic, Mandarin and English: every script in its font, Arabic right to left, no missing glyphs; prints at 100% on US Letter (F15-REQ-006, F15-REQ-008).
- [ ] [manual] 230 MB year, originals only, airplane mode on SE 3: under 2 minutes (C-NFR-007, DATA-REQ-052).
- [ ] [manual] 470 MB year with listening copies: time recorded against the 4-minute target (F15 Q1; gate only if the founder accepts it).
- [ ] [auto] Export is the primary action before any delete-book or delete-account confirm (DATA-REQ-053).
- [ ] [auto] The plaintext notice shows above the share sheet; no export file remains after it closes (DATA-REQ-056).
- [ ] [auto] Background pauses and resumes; a kill offers Start again once and leaves no partial ZIP (F15-REQ-011).
- [ ] [manual] The offline `index.html` lists every letter and plays every recording in Safari and Chrome with no network (F15-REQ-013).
- [ ] [auto] The 90-day pledge reads the same in Help and Legal, Terms and Privacy Policy (PRD-REQ-009).

### F16 Sync, devices and restore
- [ ] [auto] Parity and leak suite: zero differences for every fixture user (F16-REQ-008, B-NFR-003 Rev).
- [ ] [auto] Permanent errors move ops to `rejected_writes` and the queue continues; an op retried 5 times has one effect (DATA-REQ-043, DATA-REQ-044).
- [ ] [auto] Two devices editing one letter offline: neither version lost; the author sees the note (F16-REQ-010).
- [ ] [auto] Words, `machine_edits` and `edit_level` travel as one group; a partial change is rejected `SCPAIR` (F16-REQ-011).
- [ ] [auto] Take-out, tombstone and removal reach every member device within one pull (F16-REQ-009, LEGAL-REQ-032).
- [ ] [auto] Zero audio, listening copy or photo bytes in any sync request (F16-REQ-014).
- [ ] [auto] "Not sent yet" appears within 10 s for queued ops offline (F16-REQ-016).
- [ ] [auto] `sync_enabled` off takes effect within 5 minutes; the outbox is kept (F16-REQ-018).
- [ ] [auto] N-1 contract fixtures pass; older builds get `SCVER` (F16-REQ-019).
- [ ] [auto] 61 pushes in a minute return `SCRAT` with `retry_after` (F16-REQ-021).
- [ ] [auto] No service key in the built bundle (F16-REQ-022).
- [ ] [auto] Log canary over the E2E run finds zero Asha strings, letter text or ids (F16-REQ-020, LEGAL-REQ-014).
- [ ] [manual] Restore drill with two synthetic devices: zero own rows deleted locally (F16-REQ-012, DATA-REQ-030, DATA-REQ-031).
- [ ] [manual] Co-parent sees a new letter within p95 5 s online; new phone shows the book list within p95 10 s and one year of text within p95 30 s on LTE (06-nfr.md section 4).

### F17 Settings, privacy controls, consents and deletion
- [ ] [auto] Every Settings row, including each consent, Export and Delete, is 2 taps or fewer from Settings (C-REQ-016, LEGAL-REQ-008).
- [ ] [auto] Every consent is visible and withdrawable; withdrawing analytics stops sending within the session (LEGAL-REQ-008, PRD-REQ-018).
- [ ] [auto] Account deletion: export offered first, the Apple billing line with the Manage link before confirm when subscribed, 30-day undo, Apple token revoked (C-REQ-019, LEGAL-REQ-029, A-NFR-011).
- [ ] [auto] After the undo window, a cross-system verification script finds no rows or objects except pseudonymised acceptances and the suppression hash (LEGAL-REQ-029, LEGAL-REQ-031).
- [ ] [auto] Purge deletes tombstones older than 30 days; deletion SLAs held with clock control (LEGAL-REQ-031, LEGAL-REQ-033, DATA-REQ-036).
- [ ] [auto] Deleting the account of the parent who created a book leaves the co-parent's letters intact (DATA-REQ-012, K-22).
- [ ] [manual] `https://earlyletters.com/delete-account` explains in-app deletion and accepts a request by email, handled by the runbook within LEGAL-REQ-031 times (LEGAL-REQ-030, D-042).
- [ ] [auto] Settings > Help and Legal > About shows the "early version, can make mistakes" note; no beta string on Tonight, Listen, Review, Book, sign-in or Plus screens (K-13, B8).
- [ ] [auto] Re-pointed to F17-REQ IDs when F17 section 7 lands; F17's P0 leak surfaces (search, widgets, notification previews, app switcher) each get a line then (F17 header).

### F18 Analytics and the learning loop
- [ ] [auto] Fresh install through first letter, Keep the book and reminder prime: zero requests to PostHog or Sentry hosts and no event queued on disk (PRD-REQ-016, LEGAL-REQ-003).
- [ ] [auto] The consent sheet is the third ask, never in the same session as another, nothing preselected (PRD-REQ-001).
- [ ] [auto] Every event validates against its typed schema; unknown properties and strings over 40 characters are dropped; the Asha canary never appears (PRD-REQ-016, LEGAL-REQ-017).
- [ ] [auto] Every feature works the same with analytics on or off (LEGAL-REQ-003; 03 section 4.3).
- [ ] [auto] Server aggregates report accounts, books and letters with no device analytics and no purchase data (PRD-REQ-017 Rev, B10).

### F19 Server-driven content, remote config, kill switches, pack delivery
- [ ] [auto] A content block goes live only after SHA-256 matches the signed manifest, its schema passes and its version is higher than live; the app runs on the last good copy offline (F13-REQ-002, B14).
- [ ] [auto] Remote config and manifests are served from the CDN with ETag and long cache; never on the launch critical path (B15, F13 section 9).
- [ ] [auto] No block type can change data collection or the paywall (schema test) (B14).
- [ ] [manual] Each v1.0 kill switch flipped in staging takes effect within 5 minutes; local recording, reading and export keep working (LEGAL-REQ-040).

### F20 Help, support and safety resources
- [ ] [auto] The static "If you are struggling" row is reachable from Settings > Help in 2 taps or fewer; no classifier code path is reachable in the build (B7, D-034).
- [ ] [auto] A support request carries app version, build, plan state, route enum and error codes, never letter content (C-REQ-016, LEGAL-REQ-014).
- [ ] [auto] No safety tier in any request, event or server table (LEGAL-REQ-015).

### F21 App Store listing, website and legal pages
- [ ] [auto] `packages/content` rules pass: no dashes, curly quotes, ellipsis characters or emoji; no "kids" or child-directed phrases; claims registry rule passes (LEGAL-REQ-044, LEGAL-REQ-045).
- [ ] [auto] Privacy labels and `PrivacyInfo.xcprivacy` match the data map for this build; evidence saved (LEGAL-REQ-042, LEGAL-REQ-043).
- [ ] [auto] CI denylist finds no ad, attribution or tracking SDK (LEGAL-REQ-016).
- [ ] [auto] No string names another mobile platform or store (App Review 2.3.10, R4 section 0 item 8).
- [ ] [auto] No product, store or website string promises printed books (K-32).
- [ ] [auto] The store listing and promotional text contain no "beta" (B8).
- [ ] [manual] App Store Connect territories equal {United States}; age rating answered; not in the Kids category (LEGAL-REQ-058).
- [ ] [manual] Terms, Privacy Policy, Consumer Health Data Privacy Policy and Subscription terms are published at versioned URLs on `https://earlyletters.com/terms`, `/privacy`, `/health-privacy`, and linked in the app and listing; `/subprocessors` is live (B11).
- [ ] [manual] `packages/brand` holds the real domain and support email; no `example.com` in the build; the publisher's legal name appears only in legal documents and App Store Connect (PRD-REQ-023).
- [ ] [manual] Review notes name every feature, explain that Plus adds extra children and Read together beyond 3 sessions, include a demo path, and describe a family memory journal that does not require health information (App Review 2.3.1, R4 section 0 item 8; DR-08).
- [ ] [auto] Website, legal pages and `/j` pass axe with zero critical violations (LEGAL-REQ-051).

### Cross-cutting non-functional gates
- [ ] [auto] Every row marked Gate in `06-nfr.md` passes in the release-candidate performance run, with the evidence file named per row.
- [ ] [auto] App Store download size for iPhone SE 3 is under 40 MB on the release build (B13, F05-REQ-016).
- [ ] [auto] Crash-free sessions 99.8% or more and crash-free users 99.5% or more over the last beta build in App Store Connect (06-nfr.md section 6).
- [ ] [auto] Load test at 2x the 1k targets and a 4-hour soak pass in staging (BL-282).
- [ ] [auto] `npm test`, `npm run test:db` and `npm run typecheck` pass on the release commit.

## 4. Beta on TestFlight

The beta runs on TestFlight; the store listing never says "beta"; the app keeps a small "early version, can make mistakes" note in About (B8). Cohorts follow D-045 (recommended, founder OK needed by 4 Dec): C0 internal, then C1 friendly families for 3 weeks, then App Store submission. The C2 public link is optional and runs after submission (D-045). Everyone in every cohort is 18 or older and passes the in-app 18+ gate like any user (TDD 07 section 11).

### 4.1 Cohorts

| Cohort | Who | Size | Dates (ROADMAP) | Entry gate | What we learn |
|---|---|---|---|---|---|
| C0 internal | Founder, engineers, the founding family; internal testers need no Beta App Review | Up to 10 | From week 6 (9 Nov) | G2 | Crashes, durability, daily-use friction |
| C1 friendly families | Chosen for coverage: at least 2 co-parent pairs; speakers of each language that passed its gate (at least 2 Hindi speakers if Hindi passed); 1 twins or multiples family; 1 expecting parent; 2 VoiceOver or large-text users; 1 separated co-parent pair if any volunteer | 15 to 25 families | Build to Beta App Review by Fri 11 Dec; runs 14 Dec to 8 Jan | G3 | First run, the co-parent loop, transcription fidelity on real accents, accessibility, Plus in sandbox |
| C2 public link (optional) | TestFlight public link with a tester cap, US only | 100 to 300 | After submission (D-045) | G3 plus C1 exit; external penetration test first (BL-313) | Sync at scale, notices, retention signal |

V2 removes the C1 grandparent and web-page coverage TDD 07 listed (B1: contributors and the web page are v1.1). Purchases in TestFlight run in the sandbox and cost testers nothing, so C1 tests the Plus flow but not real conversion [A] (TDD 07 section 11.1; verify in WP-F14-12).

### 4.2 Feedback and privacy in the beta

- Testers are asked in the welcome note not to screenshot letters; TestFlight screenshot feedback can carry letter text to App Store Connect (TDD 07 section 11.2). Whether it can be turned off per group is open (Q3).
- In-app Report a problem (F20) sends app version, build, plan state, route enum and error codes, never content.
- Crash data comes from TestFlight and App Store Connect for everyone, and Sentry only for consenting testers.
- Surveys at day 7 and day 21 ask for no letter content.
- Issues never contain letter text, child names or screenshots of letters (TDD 07 section 11.3).

### 4.3 Severity and response

| Severity | Definition | Acknowledge | Resolve or mitigate |
|---|---|---|---|
| S0 | A letter or recording lost or silently changed; the machine added meaning; L3 or L4 data seen by the wrong person or a vendor; anything created for a minor; consent bypassed | 2 hours while awake | Kill switch or build pulled within 24 hours; fix in the next build; written review |
| S1 | A P0 flow blocked (cannot save, sign in, invite, export, delete); crash loop; a wrong charge or notice | 1 business day | Next build, target 3 business days |
| S2 | A flow degraded with a workaround; an accessibility failure on a P0 screen | 2 business days | Within 2 weeks; accessibility failures on P0 screens block G4 |
| S3 | Cosmetic, copy, P1 polish | 5 business days | Backlog |

Source: TDD 07 section 11.3; ROADMAP week 11 (daily 20-minute triage during C1).

### 4.4 Exit criteria

**C0 to C1** (by Fri 11 Dec):
1. 14 days of C0 use with zero open S0.
2. Crash-free sessions 99.5% or more on C0 builds.
3. Kill during save passed on SE 3 (500 Simulator plus 50 device, zero loss).
4. Restore drill passed (before the first non-founder family; section 2.10).
5. Every P0 LEGAL-REQ and DATA-REQ line for the shipped scope green (G3).
6. Security migration pack and access matrix green in staging (09 R-09).

**C1 to App Store submission** (C1 exit review, week 14, 4 to 8 Jan):
1. At least 21 days of C1 use (14 Dec to 4 Jan) [A: the holiday weeks count; the founder may extend].
2. Zero open S0 and S1.
3. Crash-free sessions 99.8% or more and crash-free users 99.5% or more on the C1 build (App Store Connect).
4. Zero letters or recordings lost or silently changed across the cohort (03 section 4.3).
5. No transcription fidelity complaint traced to an engine edit; each fidelity report is classified as model error (fixable in Review) or engine edit (S0).
6. Author correction rate per language shown to the founder for every passed language; no language more than 50% over its gate baseline (03 section 4.3) [A: small samples; read as a signal].
7. At least 2 co-parent pairs completed invite and join without help.
8. At least 1 VoiceOver or large-text tester completed first letter, Review and export without help.
9. No paywall shown outside its allowed triggers (C-REQ-023).
10. Every line in section 3 passes on SE 3 and a current iPhone, with evidence.

C2, if run after submission, exits on the founder's decision with zero open S0 and crash-free sessions 99.8% or more.

## 5. Release gate

### 5.1 Gate ladder

| Gate | When | Must pass | Who signs |
|---|---|---|---|
| G0 PR | Every pull request | Section 1 done; CI: typecheck, unit, content rules, database, docs lint where changed, IPA size where `apps/mobile` or `packages` changed | CI plus a CODEOWNERS reviewer; founder `approve-migration` for `supabase/**` and auth |
| G1 main | Merge to `main` | G0 on the merge commit; `main` is always releasable (CLAUDE.md) | CI |
| G2 internal TestFlight (C0) | Any binary to internal testers | G1, plus a green nightly in the last 24 h (Maestro flows, random-seed property tests, log canary); manual smoke on SE 3 | QA lead |
| G3 external TestFlight (C1) | First external build and every external build | G2, plus: every P0 LEGAL-REQ and DATA-REQ test for shipped scope green; the R-01 suite green in Node and Hermes; each shipped language's gate report and sign-off present; kill during save on SE 3; restore drill; deletion verification in staging; privacy labels and manifest generated and diffed; VoiceOver script V1 and V4 on SE 3; kill switch drill; IPA under 40 MB | QA lead and founder |
| G4 App Store submission | Release candidate tag `ios-v<major>.<minor>.<patch>` | G3, plus: C1 exit (4.4); every line in section 3 passes on SE 3 and a current iPhone with evidence; every Gate row in 06-nfr.md; load test at 2x 1k and the 4-hour soak; purchase sandbox S-1 to S-10; V2, V3, V5, V6, V7 scripts; counsel sign-off (5.2 item 3); no open S0, S1 or P0-screen S2 | Founder |
| G5 post-release | Phased release, days 1 to 7 | Crash-free sessions 99.8% and users 99.5% in App Store Connect; zero data-loss reports; any S0 pauses the phased release | Founder (on call) |
| OTA (only if `expo-updates` is used) | A JavaScript-only update | G3 for the changed scope plus Maestro on the exact update bundle; an OTA never changes consent, the 18+ gate, the paywall or data collection without a binary; updates apply on the next cold start, never mid-recording | QA lead |

Source: TDD 07 section 9.1, re-pointed to V2 scope; TDD 06 FM-R18.

### 5.2 The launch gate

Every item below passes before submission on Mon 11 Jan 2027 (ROADMAP M13). Items 1 to 6 carry over from PRD 1.3 section 2.3; items 7 to 10 are new for V2.

1. Every line in section 3 passes (PRD 1.3 2.3 item 1).
2. Every P0 LEGAL-REQ and DATA-REQ for v1.0 scope passes; v1.1 LEGAL-REQs bind the day their feature ships (PRD 1.3 2.3 items 2 and 6).
3. Counsel has reviewed the Terms, Privacy Policy, Consumer Health Data Privacy Policy, Subscription terms, in-app disclosures and the claims registry (PRD 1.3 2.3 item 3), including the auto-renewal notice answer (DR-02) if any trial or renewal is sold (05 section 5 never-cut list).
4. `packages/brand` holds `earlyletters.com` and `hello@earlyletters.com`; universal links on `https://earlyletters.com` work; the publisher is the founder as an individual and the legal name never appears in code (PRD 1.3 2.3 item 4; B11, B12).
5. The "early version, can make mistakes" note is in About; the store listing has no beta wording (PRD 1.3 2.3 item 5 revised by B8).
6. `npm test`, `npm run test:db` and `npm run typecheck` pass on the tagged commit.
7. App Store download size for iPhone SE 3 is under 40 MB on the submitted build (B13).
8. Every language offered for transcription has passed its gate on the SE 3 tier with a native-speaker sign-off, and the R-01 suite is green for its script; every other language shows as Record and type (DR-01 A; F05-REQ-001 to F05-REQ-006).
9. Zero audio bytes and zero purchase data in any request across the full E2E suite (B7, B2).
10. C1 exit criteria met (section 4.4).

### 5.3 What never gets waived

A founder-signed exception may move a budget marked [A] or a non-gate row. It may not waive: zero lost or silently changed letters; zero accepted meaning changes in the R-01 suite; the immutable raw transcript; kill during save 500 of 500 and 50 of 50; export complete and free offline; in-app account deletion; the 18+ gate; nothing sent before consent; server-side access checks and the leak suite; accurate claims (05 section 5 never-cut list; 03 section 4.3).

## 6. Gates changed from PRD 1.3 and why

| 1.3 gate or checklist line | V2 | Why |
|---|---|---|
| App download 80 MB or less (not a gate) | Under 40 MB, gate, every release build | B13 |
| 1-year export under 2 minutes (230 MB) | Kept for originals; 470 MB with listening copies has a 4-minute target, gate only if the founder accepts F15 Q1 | B6 doubles audio; F15 Q1 |
| Transcription 30 s and 2% battery (Unverified, no gate) | Gate per passed language on SE 3, or a founder-recorded change | F05-REQ-040; R-02 |
| "Every machine edit passes `verifyEdits`" | Plus the R-01 regression suite, zero accepted meaning changes per language, Node and Hermes | 09 R-01; F06-REQ-019 |
| Hindi plus Devanagari transcribes (6.2) | Each of seven languages gated by its own corpus; only passed languages are transcribed | B4; DR-01 A |
| Kill during save 500 iterations | 500 Simulator plus 50 SE 3; plus kill while recording, typed kills and Review kills | F04, F06 |
| Grandparent joins as Family; contributor approval paths; web page lines (6.2) | Removed from v1.0; dormant contributor rules keep server tests green | B1 |
| Shared voice playback line (6.2, if D-032) | Removed; zero audio bytes in any request is a gate | B7; DR-07 A |
| Server notice scheduler, purchase consent via webhook, forged notification, refund webhook, entitlement service fail-open (6.5) | Device-computed notices (blocked by DR-02), device-written consent acts, StoreKit-stubbed fail-open, zero purchase data to our servers; webhook lines removed | B2; DR-02 A |
| Server rejects `create_child` without Plus (6.8) | Server accepts every book; Plus is enforced on the device only | B2; DR-04 A |
| A co-parent gets Plus when the other parent holds it (K-28, 6.8) | Only through Apple Family Sharing inside one Apple Family | B2; DR-03 A |
| AI gateway returns 403 without consent (6.7) | Not in v1.0; returns with F35 | Server transcription is v1.1 |
| Keep the book sheet with Apple, Email and Later (6.1) | Apple, Google, Email and Later | B3 |
| Store listing beta line (K-37) | No beta wording in the listing | B8 |
| 5xx under 0.1% per class per day | Under 0.1% over 28 days after 1,000 events | TDD 06 CR-7 |
| Crash-free from consenting users plus TestFlight | App Store Connect as the gate source | TDD 06 P-7 |
| Load test at 2x the 1k targets (2.2 members per family, uploads, webhooks) | Same gate on F16's recomputed targets (1.5 accounts, no uploads or webhooks) plus a 4-hour soak | F16 section 9; TDD 06 section 8.3 |
| Beta: TDD 07 C2 public link before the store | C1 only before submission; C2 optional after | D-045 (recommended) |
| none | New gates: local playback p95 300 ms; zero jetsam in 30 transcription runs; RTL and mixed-script rendering; restore drill before the first non-founder family | F08, F05, F09, F16 |

## 7. Open questions

| Q | Who answers, by when | What changes |
|---|---|---|
| Q1 D-045: confirm C1-only before submission, C2 after | Founder, 4 Dec | Section 4.1 |
| Q2 DR-02: is a device-computed notice and in-app card enough under the California ARL, or does Apple own the notices? | Counsel then founder, 6 Nov | F14 checklist line on notices; cut order 2 if unanswered |
| Q3 Can TestFlight screenshot feedback be turned off for a group, and if not, how do we handle letter text in it? | Counsel, founder, before C1 | Section 4.2 |
| Q4 Does an external TestFlight cohort count as public launch for LEGAL-REQ purposes? | Counsel, before C1 | Which LEGAL-REQs G3 must pass (TDD 07 OQ-3) |
| Q5 Who runs the SE 3 device scripts for each release candidate? | Founder, before week 6 | G3 and G4 capacity |
| Q6 Where Maestro runs nightly: GitHub macOS minutes, a self-hosted Mac mini or Maestro Cloud | Founder (cost), week 3 | Section 2.6 |
| Q7 Will the app use `expo-updates` OTA? | Mobile lead | OTA gate in 5.1 |
| Q8 Should `scripts/trace.mjs` block merges from day one or report only? | Founder, QA lead | Section 3 regeneration |
| Q9 F15 Q1: 4 minutes with listening copies as a gate | Founder, week 6 | Section 3 F15 lines; 06-nfr.md section 2.5 |

| A | Assumption | How we validate |
|---|---|---|
| A1 | 21 days of C1 over the holidays yields enough use to judge exit criteria | Count active C1 testers per week; the founder extends C1 if fewer than 10 families write in the last week |
| A2 | StoreKit sandbox in TestFlight covers trial and renewal flows with accelerated time | WP-F14-12 on device |
| A3 | Maestro can drive the iOS share sheet, StoreKit sheets and system permission prompts well enough for the flows in 2.6 | BL-275 harness spike; any step it cannot drive becomes a manual line |

## 8. Sources

- Decisions: `docs/agents/BRIEF-2026-10-03.md` items 2, 3, 6, 9, 10, 15 to 17 and coordination rules; `_AUTHORING.md` sections 3, 5, 8; `docs/DECISIONS.md` D-027, D-034, D-041, D-042, D-045; `09-decisions-and-risks.md` DR-01 to DR-08, R-01, R-03, R-04, R-09.
- Requirements: `docs/prd/PRD.md` 1.3 sections 2.3, 6, 7; appendices A, B, C; `docs/legal/ENGINEERING_REQUIREMENTS.md` (LEGAL-REQ as cited per line); `docs/legal/DELETION_AND_EXPORT_SPEC.md` (DATA-REQ as cited per line).
- Feature specs: `features/F01-entry.md` to `features/F16-sync.md` sections 7, 9, 12; `features/F17-settings-privacy.md` header (in progress on 3 Oct).
- Technical: `docs/tdd/07-quality-test-strategy.md` sections 1, 2.1, 3.3, 4, 5, 6, 7, 9, 11; `docs/tdd/06-performance-reliability.md` sections 2, 6, 7, 8; `docs/tdd/09-accessibility-design-system.md` section 8.3; `docs/ROADMAP.md` (weeks 6 to 15, M12, M13); `docs/BACKLOG.md` Definition of Done, BL-002, BL-135, BL-222, BL-247, BL-275, BL-282, BL-283, BL-284, BL-289, BL-313.
- Repo: `CLAUDE.md` commands and test counts; `.github/workflows/ci.yml`; `.github/pull_request_template.md`; `.github/CODEOWNERS`; `supabase/tests/` file list; `packages/core/test/` file list.
