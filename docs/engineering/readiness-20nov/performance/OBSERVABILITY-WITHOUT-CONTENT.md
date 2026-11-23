# Observability without content (readiness run RD-E, file 4 of 4)

Status: proposed, 20 Nov 2026. Author: `ops`. Docs only. Related: `NFR-BUDGETS.md`, `MEASUREMENT-PLAN.md` (markers, section 4), `CODE-QUALITY-GATES.md` (gate G13). Tags: [V] verified, [E] estimate with basis, [U] unverified, Rec = my proposal. Nothing here changes code, workflow or config; no word a parent reads is written.

**The rule, from `CLAUDE.md`:** no entry text, transcript, audio or child name in analytics, logs or crash reports. This file extends it to everything the newer cards add (pictures, videos, moments, Find queries, typed day words, albums, dates of birth), and says how to prove it with a test, because a rule that only reviewers apply fails on a busy day.

## 1. What we may measure

Only these, and only as a closed set (no free-text field, no id of a person, book, letter or media item):

| Class | Allowed | Examples | Basis |
|---|---|---|---|
| Counts | Whole numbers or a bucket (`0`, `1 to 9`, `10 or more`), never tied to one child's name or date | Pending notifications planned, index batches run, items in the outbox, crash-free session counts from Apple | `packages/analytics/src/catalog.ts` header (enums, booleans, bounded integers only) [V]; OBS-R09 (L2 counts) |
| Durations | A number of milliseconds with a named event | `launch_interactive`, `save_commit`, `find_first_row`, `copy_decode`, `migration`, `index_rebuild` (`MEASUREMENT-PLAN.md` section 4) | NS-34-R6, `06-nfr.md` section 0 [V] |
| Versions | App version, build number, EAS fingerprint, local schema version (10, 11, 12), export schema (1.6.0, 1.7.0), `ENGINE_VERSION`, iOS major version, device model on a run sheet | The header of every evidence file (NS-34-R3) | NS-34-R3 [V card] |
| Error classes | A code from a closed union declared once per module, `{ ok: false, code }`; the code never carries a value | `pick_cancelled`, `space_low`, `decode_failed`, `derivative_failed`, `orphan_swept`, `fts_unavailable`, `rebuild_batch_failed`, `budget_full`, `schedule_failed`, `video_too_long`, `video_unreadable`, `media_not_available`, `owner_mismatch` | Eval C 4.2 rules 1 and 2 [V design]; NS-52-R7, R8, R9 [V card, unlocked] |
| Server events | The `EVENTS` list in `supabase/functions/_shared/log/log.ts`, closed enums, an HTTP status, a SQLSTATE, a random per-invocation `req_id` | `request.done`, `purge_due.batch`, `worker.done` | `log.ts` header [V] |
| Flags and state | Whether a switch is on; never the person's choice of album or day | `EXPO_PUBLIC_*` flag state in a build; remote kill-switch keys | `packages/api/src/remote-config.ts:67-78` (eval C 2.1) [V design] |

Analytics are off through 1.0 (D-124: "in-app analytics stays off", `docs/DECISIONS.md:647`) [V] and `EXPO_PUBLIC_STATUS_REPORT=off` in every profile (eval C 4.2 rule 4) [V design], so for the current build "measuring" means: on-device markers shared by hand, error codes that stay on the phone, Apple's own crash and size numbers, and server logs. If analytics ever opens, the catalogue test (`packages/analytics/test/catalog.test.ts`) and the validator that fails closed (OBS-R08) are the gate.

## 2. What we never measure or record

Never in any log, breadcrumb, crash report, analytics event, route param, URL, notification payload, evidence file or run sheet (PRIV-R10 in `docs/engineering/07-privacy-engineering.md:79`; eval C 4.2 rule 3; NS-52-R43, R44; NS-51-R28; NS-34-R5, R6) [V]:

1. A person's words: letter text, transcript, a typed day word, a Find query, a Firsts label, a prompt shown to a person, a "describe this picture" field, picture words or place, a From name.
2. Audio: bytes, a file name, a duration of one letter's recording tied to an id.
3. Pictures and videos: bytes, thumbnails, a file name, a path (`photos/<media_id>.jpg` holds an L3 id), a media id, a pixel size or byte size that could single out a file, a duration of one video, a count of media on a letter, a type, an album name, a photo-library asset id, the dates of the pictures behind a moment, EXIF or location. NS-52-R43 says no event may carry a media count, size, duration or type even if analytics opens.
4. Names and dates that identify a child: child name or nickname, date of birth, due date, a notification time set by a birthday (`catalog.ts` header: "No event may fire at a time set by a child's birthday").
5. Identity: email, token, row id, person, book or letter id (ids are L3), the recovery key.
6. Database text: SQL with literals, Postgres `message`, `details`, `hint` (OBS-R02).
7. Real family data in a test, fixture, screenshot or trace (D13); only the fictional family "Asha" (NS-34-R5, `no-real-family-data.test.ts`).

## 3. Where content can leak, surface by surface (what exists, what is missing)

| Surface | What reaches it | Today | Gap |
|---|---|---|---|
| Server logs (Edge Functions, ops scripts) | `log.ts` records only closed enums, counts, durations, `req_id`; exceptions reduced to `{code, sqlstate, status}`; `canary.test.ts` pushes the Asha fixtures through every path and fails on any direct `console.*` [V `log.ts` header] | Built and tested; `docs/engineering/10-logging-and-observability.md:29` and `ENFORCEMENT.md` still say "not yet" (drift) | Fix the two docs (`principal-architect`) |
| Device `console.*` | One sink, `warn: (line) => console.warn(line)` in `apps/mobile/src/lib/resilience/global-errors.ts:49` with an `eslint-disable` for a linter that does not run [V]. No other `console.` in `apps/mobile/src` (grep, 20 Nov) | A clean start | Nothing stops the next one: lint does not exist (`CODE-QUALITY-GATES.md` G2) |
| Device fault log | The last 20 records, four fields only: kind, code from a fixed list, id, time; "nothing from the error itself but its class code" (`global-errors.logic.ts:45-48`, `:93`) [V] | Good design | Installed in the production profile only: in `testflight`, `preview` and `development` "a fatal throw crashes natively" (`global-errors.ts` header) [V] |
| **Crash reports from Apple** (Organizer, TestFlight) | A fatal JS error becomes a native `RCTFatalException` whose text is the JS error's message (the CI launch check greps for exactly that string, `ios-compile.yml`, step "Launch and stay up for 20 s") [V]. So **an exception message can reach a crash report we cannot scrub** | No SDK (Sentry is not a dependency) [V] | **Open finding.** Three throws put a date into their message: `packages/core/src/age.ts:15` and `packages/core/src/child.ts:28, 33` (`Invalid ISO date: ${iso}`). The input can be a child's date of birth (L4). This is CODE-G2 in `ENFORCEMENT.md`, still open [V]. Rec: the first lint rule (section 5 R3) and a fix to a code-only error. Owner `mobile`/`principal-architect`; I did not change code. The other interpolated throws I found carry brand-asset ids or analytics event names, not content |
| Analytics | Off; catalogue allowlist; validator fails closed (OBS-R08, enforced on develop per `ENFORCEMENT.md`) [V] | Built | Add a test that the catalogue has no `media_*`, `moment_*`, `find_*` event with a free property (NS-52-R43) |
| Perf markers (new) | Event name and a number (`MEASUREMENT-PLAN.md` 4) | Not built | `[NS-34-R6] markers content-free` |
| Notifications | Bodies come from `packages/content` only; names off by default (D-025); a plan notice has no name, count or price; `data` holds route ids only (`06-nfr.md` 12; `tdd/new-scope/11-foundations.md` section 2) | Partly built | The canary of section 5 R4 |
| Router params and URLs | Find queries stay in component state (NS-02-R25) | Card rule | Scan: no `router.push` or `href` param built from a query or text |
| CI logs, evidence, PR bodies | Our harnesses print counts and `Asha kill drill <n>` text (`apps/mobile/e2e/kill/protocol.mjs`, `drillText`) [V] | Clean by design | `no-real-family-data` runs on each evidence file (NS-34-R5); screenshots and videos are never committed (`docs/qa/evidence/README.md`) |
| Backups and exports | Not telemetry; the photo and video copies are excluded from backup where the card says so (NS-37-R4) | n/a | n/a |

## 4. Measuring performance without breaking the rule

- A marker is an event name from a closed union plus one number (`MEASUREMENT-PLAN.md` 4). It is in memory, off in store builds, exported by the founder's hand to his own Mac, never uploaded.
- Frame hitches, memory and energy come from Instruments on a development-signed Release build, and crash and size numbers from Xcode Organizer and App Store Connect. None of these reads content: Instruments traces can hold strings in memory, so a trace is not committed (NS-34 evidence rules) and is taken on the Asha install only.
- The Asha seeded book (`MEASUREMENT-PLAN.md` 3) contains only generated, invented text and generated media, so a leak in a trace would still show only fiction. That is also the test that proves the leak path: a canary string seeded into the book is searched for in every output.

## 5. A log and crash-report lint (proposal)

Five rules. R1 to R3 are static, R4 and R5 are canary tests. All but R1's workflow change are vitest or node tests in the existing `unit` job. Each has a positive and a negative self-test so the rule itself cannot rot (the `rules.test.ts` pattern, FR-QAL-27 d).

| Id | Rule | How | Fails when | Owner | Cost |
|---|---|---|---|---|---|
| R1 | No `console.*` in `apps/mobile/src` or `packages/*/src` except the one allowed sink; stripped from release builds | Lint rule `no-console` once ESLint exists (CODE-R20, OBS-R05); until then a vitest scan over the source (the one existing call is allow-listed by file and line count) and a release-bundle scan in the `seam-guard` export for `console.` calls from app code [U: Metro or Babel may already strip them in release, to check] | A second call appears | `ops`, `mobile` | S |
| R2 | Device log is typed: `lib/diagnostics/log.ts` exports `log(event: DiagEvent, code?: DiagCode, n?: number)` and nothing else; `DiagEvent` and `DiagCode` are closed unions | Mirrors `supabase/functions/_shared/log/log.ts`; a TypeScript test (`// @ts-expect-error`) proves a string or object argument does not compile | A free string can be passed | `mobile` | S |
| R3 | No interpolation of a value into a thrown message or `Error` subclass: `throw new Error(\`...${x}...\`)` and string concatenation into `new Error(` fail, in `apps/mobile/src` and `packages/*/src` (CODE-R15, CODE-R16) | `no-restricted-syntax` once ESLint exists; a regex test before. Today [U, one reviewer could not reproduce; my command: `grep -rn "new Error(\`[^\`]*\${" apps/mobile/src packages/*/src --include=*.ts --include=*.tsx | grep -v '__tests__\|\.test\.'` gave 11 on 20 Nov]: 11 template-literal throws with `${`, 3 of them carry a date (`age.ts:15`, `child.ts:28, 33`) and the rest brand-asset ids or event names [V grep]. Baseline file lists the 8 allowed (static ids) and the 3 are fixed first | A new interpolated throw | `principal-architect`, built by `qa` | S |
| R4 | **Device canary (J-N18, OBS-R10 device half):** seed a canary string for each free-text input (a Find query, a typed day word, a child name, a Firsts label, picture words and place, a file name, a media duration, a date of birth) and drive each module's public API, including its failure paths; assert the strings never reach `console.*` (spy), any logger sink, router params, the `content` passed to `expo-notifications`, `Error.message` of any thrown error, the perf marker ring, or the fault log | One test module `apps/mobile/test/canary.test.ts` (eval C 4.2 rule 6; `tdd/new-scope/11-foundations.md` row R12); a second pass with the media modules when NS-52 locks | Any hit | `qa` | M |
| R5 | **Crash-path canary:** raise a fatal JS error whose message holds the canary, through the real handler (`startGlobalErrorHandlers`) and through the untreated path; assert the fault log holds only kind, code, id, time; and, in the kill-harness `launch` job, that the run's crash text (the `sim-crash-report.sh` output) never contains the Asha canary | Unit for the first half; for the second, the Release launch job already reads the log (`ios-compile.yml`) and `.github/scripts/sim-crash-report.sh` prints the uncaught exception: add a canary build flag in the `e2e` profile only that throws a canary-bearing error, and fail if the printed exception is not the code-only form | A canary text appears in a crash text | `qa`, `ops` | M |

**Server side (already built):** keep `canary.test.ts` and extend `EVENTS` in the same change that logs a new event (`log.ts`, "Add a name here in the same change that logs it"). The media addendum (FR-OPS-37 and following) adds bucket totals only, never an object name.

**Evidence and CI output:** a node test in `unit` reads every file under `docs/qa/evidence/` and `docs/qa/run-sheets/` and fails on a Devanagari, Arabic or Chinese letter body or on a hash match in `no-real-family-data.test.ts` (it stores only hashes) [V approach; the test file exists in `packages/content/test`]. Screenshots and traces are never committed.

## 6. How a reviewer applies this

1. Any new `catch`, `log`, `track`, `mark`, `throw` or `console` in a diff: read the argument. A value from a person, a child, a file or a database row is a block.
2. Any new error code: is it in a closed union, and does its name carry no value? (`video_too_long` yes; `video_too_long_62s` no.)
3. Any new marker or analytics event: closed name, number only, row id in the PR (NS-34-R6 or the catalogue rule).
4. Any new native module that logs (`os_log`, `NSLog`, `print`): use `privacy: .private` or no value at all; a Swift `print` of a path is a block (`scribe-photo` and the future `scribe-library` (name per errata E38); NS-51-R28).
5. Any test or fixture with a name, a place or a date that looks real: stop and use Asha.
6. If a gate in section 5 does not exist yet, write `unenforced: OBS-G` in the review so the gap is counted.

## 7. Cite check, conflicts, limits

- Cites sampled: 30 checked by opening the line or running the command; 29 held, 1 fixed while writing (the number of date-bearing throws is 3, not 1). Held include: `log.ts` header, `global-errors.ts:49` and header, `global-errors.logic.ts:45-48, 93`, `age.ts:15`, `child.ts:28, 33`, `DECISIONS.md:647` (D-124), `07-privacy-engineering.md:79` (PRIV-R10), `10-logging-and-observability.md:29, 39`, `ENFORCEMENT.md` CODE-G2 and OBS rows, `catalog.ts` header, `ios-compile.yml` RCTFatalException grep, `docs/qa/evidence/README.md`, NS-34-R3, R5, R6, NS-52-R43, R44, NS-51-R28 and eval C 2.1, 4.1, 4.2.
- Conflict to product: NS-34-R6 and PRIV-R10 forbid content in markers, but NS-34 section 6 asks for runs "including Devanagari, Arabic and Chinese letters". The Asha fixture holds invented text in those scripts, so the run is allowed; the card should say "invented text". Sent to `product`.
- Not verified: whether the Metro or Babel preset already strips `console.*` from a release bundle; whether a Release RN fatal error puts the full JS message into an Apple crash report in every case (the CI grep shows the string `RCTFatalException` appears in the simulator log; the Organizer text I did not see); `os_signpost` use in `scribe-*` modules. I did not run any phone, Instruments or Organizer.
- Founder: none beyond applying the workflow patches in `CODE-QUALITY-GATES.md` section 3. Counsel: none; this file restates the privacy rules and adds tests.
