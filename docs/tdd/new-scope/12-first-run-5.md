# First run: engineering design for NS-38 to NS-45 (part 5 of 5: security and privacy, PR breakdown, sequencing, questions, Conflicts, AMENDMENTS)

Status: Proposed, 20 Nov 2026 (RD-I1). Author: `sync`. Target: `docs/tdd/new-scope/12-first-run-5.md`. Frame and tags: `12-first-run.md`. [V] verified, [E] estimate with basis, [U] unverified.

## 1. Security and privacy notes (pointers; the acceptance rows are `security-architect`'s)

Read: `SECURITY-PRIVACY-ACCEPTANCE.md` (#914) sections 0 to 3.1 and its part 2 for the method (STRIDE per row, a mutant per P0 row), `SECURE-CODING-CHECKLIST.md` (#915), `ABUSE-AND-FAILURE-CASES.md` (#915) AB-01 to AB-07 (shared phone), AB-20 to AB-23 (lost phone). Its part 2 covers NS-46 to NS-52 only; it has no first-run rows (grep of the two files for NS-38 to NS-45 finds only the NS-10-R3 mention at `SECURITY-PRIVACY-ACCEPTANCE.md:58` and the NS-39 line in `risk-security.md:78`) [V]. So the rows below are proposals for `security-architect` to number.

| Boundary (`security.md` s1) | First-run crossing | Control (existing id or PROPOSED) | Where |
|---|---|---|---|
| B1 JS to Swift | `modules/age-range` | NSC-01 hash pin in `modules/REVIEWED.sha256`; NSC-02 entitlement allowlist; FR-SEC-14 own PR; PROPOSED NSC-13: the module returns one of three strings and a source scan fails on any return of a range, bound, date or error text | FP-10a, FP-10b |
| B2 sandbox to iOS services | Keychain items, Apple sheet, system age answer | `AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY` scan (NS-41-R19); the signal is memory only (NS-40-R6) | FP-7, FP-10b |
| B3 phone to server | `record_policy_act`, sign-in, deletion RPCs, update answer | NSC-10 per RPC (`require_user()` first; deletion never gated on consent, PRIV-R09); `ENDPOINTS` rows exist for these; idempotency key per answer (`consent.ts:88`); PROPOSED NSC-14: `buildConsentAct` is the only caller of `record_policy_act` (scan) | FP-2, FP-4 |
| B5 account to account | second account on one phone | NSC-03; `[X4-R1]`; AB-01 to AB-07 | BL-961 |
| B8 repository to production build | entitlement, flags, `otp_length` pair | NSC-02 preflight; G6 flag check; a test that `config.toml` and every `eas.json` profile agree (NS-41-R10) | FP-8, FP-10b |
| B10 phone to logs | email, code, name, token, region | NSC-06; J-N18 canary on each sign-in path; closed `AuthErrorKind`; the hook logs counts only (`compliance_gates.sql` fail-open branch logs no error text) | all |
| Edge, region hook | sign-up gate on `auth.users` | red-team review of `supabase/**` (D-041); fail open and count; `lock_timeout 200ms`; PROPOSED abuse row AB-FR2 below | `data-architect` |

PROPOSED abuse rows for `ABUSE-AND-FAILURE-CASES.md` (ids by `security-architect`):
- AB-FR1 An attacker triggers five wrong codes, kills the app and repeats: the pause survives a kill (FS-17) and the server's per-IP limit (`token_verifications`) holds; mutant: pause in memory only.
- AB-FR2 From a refused location, a new address answers `region_refused` at Send and a known one is sent a code: a thin existence signal (RK-1). Accepted for 1.0 with the per-address 60 s and per-IP limits; revisit with Turnstile (O-7).
- AB-FR3 A validly signed hostile config sets `killSwitches.signIn` true for everyone: first-run shows E-S14.outage and no signed-in session is touched; recovery is the next signed config (FR-SEC-16). Mutant: the pause ends a session.
- AB-FR4 An old build keeps writing consent rows without the new fields after `app.consent_fields_required` goes on: refused with 23502, no data lost (`SCCON`-style pause keeps the write), and the update line tells the person (FS-33 first). Mutant: flag on before the reader exists.
- AB-FR5 A forwarded email link (H1) and a link opened before the age answer: built (NS-41-R3, NS-39-R14); keep the tests.

Privacy (`privacy.md` and `docs/legal/DATA_CLASSIFICATION.md` classes as in `12-first-run.md` table 0.1):
- The age signal, IP and country are never stored; counts only (NS-40-R6, R12; FR-PRV-25, 26). Region refusal on the phone stores nothing (R9).
- App Store label per PR (BL-975 guard): FP-10b "none, memory only; one entitlement"; FP-9 drops Name from Apple (smaller label); FP-4 none new (the same record); FP-13 none new; FP-15 none (a version string, L2, on the phone). Contact Info (email), Identifiers (user id), the child's name and dates once synced, letters' words once synced, purchase status on the phone only: NS-38-R4's list.
- `privacy.md` section 2 says no card adds a consent except NS-08 and NS-25 (`privacy.md:104`): wrong for first run, amended below. The first-run records (two local rows, the server `terms` and `sensitive-data` rows) are existing PRIV-R21 acts; the builder (FS-21) makes them complete.
- Notice at collection (E-S02, FR-PRV `privacy.md:193`; F01 A-REQ-035): see CF-6.
- Retention: sign-up IP not kept (D-136); daily counts 2 years; unconfirmed `auth.users` rows from a mistyped address have no purge (O-12 default: purge after 7 days, owner `data-architect`, not built; counsel Q51).
- Deletion path per field: `data-and-sync.md` section 2.5 and card NS-45 section 11. Pictures and recordings stay on the phone after account deletion until Erase everything (D1, NS-45-R12).

## 2. PR breakdown (each at most 400 changed lines and 20 files; CODE-R02)

Owner is the one agent that writes it. Lens A and lens B are the two counted reviews. Size per `13-engineering-plan.md:9-13` (S one change; M two to four or one local migration; L five or more, a native module, a new entitlement or a counsel gate) [E]. Wave per `13:106-112` and `PACK-DELTA-1`; card 19 sets none. Changed-line figures are [E] from the file lists (a new test file about 80 to 140 lines, a pure module 60 to 120, a screen edit 30 to 80). Titles `[owner] NS-nn: ...`; each PR body carries `Satisfies:` rows and `Label effect:`.

| PR | What (rows) | Owner | Lens A / lens B | Order | Depends on | Size | Lines, files [E] | Wave | Only the founder or counsel unblocks |
|---|---|---|---|---|---|---|---|---|---|
| FP-1 | NS-38: listing test, review notes, D-161 text (R2, R5) | content | principal-architect / compliance-engineer | 1 | none | S | 140, 5 | 1 | words (founder); ASC fields R1, R7, R9 are founder steps |
| FP-5 | `killSwitches.signIn` in `packages/api`, parse and drift tests (CL-111) | sync | principal-architect / security-architect | 1 | none | S | 120, 5 | 1 | none |
| FP-17 | `docs/ops/AUTH_SETTINGS.md` register and the AUTH_SETUP fix (FS-26) | ops | principal-architect / security-architect | 1 | none | S | 150, 3 | 1 | reading hosted values is the founder's |
| FP-2 | NS-42: consent builder, hash manifest, contract test (R7, R2, R3, FS-21, FS-22) | mobile | principal-architect / compliance-engineer | 2 | `20261108000000` exists (#634 server half) | M | 380, 10 | 1 | applying the migration and the later flag are the founder's; counsel Q-D |
| FP-3 | NS-42: versioned links, version pin, no invite promise (R9, R13, R14) | mobile | principal-architect / compliance-engineer | 3 | FP-1 words, FP-2 | M | 220, 8 | 1 | counsel reads; founder merges legal-adjacent text and publishes the versions |
| FP-15 | NS-45: the update-line reader and Me line (R13, FS-33) | sync | principal-architect / design-systems | 3 | FP-5 optional; `SystemLine` optional | M | 330, 10 | 2 | words; the App Store id (founder) |
| FP-12 | NS-39: lock offer removed, no-prompt and offline tests, stub kit (R9, R1, R2, R12, R14) | mobile | principal-architect / design-systems | 3 | none (reads `lib/first-run/*`, edits `onboarding.tsx` only) | M | 330, 12 | 2 | none |
| FP-7 | NS-41: one address form, reasons, persisted pause, 900 s note (R8, R9, R11, R24) | mobile | principal-architect / security-architect | 4 | FP-12 stub kit | M | 330, 11 | 2 | words (content, BL-965) |
| FP-9 | NS-41, NS-45: Apple email-only scope, foreground revocation (O-8, R4) | mobile | principal-architect / security-architect | 4 | none | M | 250, 6 | 2 | none (default O-8) |
| FP-6 | NS-40, NS-41: `region_refused`, signIn pause, Apple on outage (R9, R14, R25, R12) | mobile | principal-architect / security-architect | 5 | FP-5; BL-922a, BL-922b, BL-978a (`lib/first-run/*`) | M | 330, 10 | 2 | words `system.region.*`; staging rows need File 28 applied by the founder |
| FP-13 | NS-43: `addChildren` in one transaction (R9, R6, R10) | mobile | principal-architect / data-steward | 5 | FP-12; BL-961 part 3 (`store.ts`) | M | 280, 6 | 2 | O-14 default stands |
| FP-14 | NS-44: first-run no-Plus test, allowance titles, free-space line (R1 to R12, FS-31) | mobile | principal-architect / design-systems | 5 | FP-12 | M | 260, 7 | 2 | words `system.storage.*` |
| FP-16a | NS-45: deletion step 1 words, typed-word reason, D1 line (R5, R1) | mobile | principal-architect / compliance-engineer | 5 | BL-965 words; BL-961 sheet | M | 250, 7 | 2 | counsel reads; founder approves words |
| FP-16b | FR-SEC-06 `ownerCheck()` for Erase everything; NS-45 titles | mobile | principal-architect / security-architect | 6 | none | S | 200, 5 | 2 | OQ-F4 for Delete account |
| FP-18 | NS-45: purge-worker titles for R8, R17 (`supabase/functions/purge-worker/test`) | sync | principal-architect / security-architect | 6 | none | S | 120, 3 | 2 | the worker deployed is the founder's |
| FP-4 | NS-42: local agreement rows reach the account (R12, FS-23) | mobile | principal-architect / compliance-engineer | 6 | FP-2; method enum check by `data-architect` | M | 300, 7 | 2 | counsel Q-D |
| FP-8 | NS-41: eight-digit code in one release (R10, FS-18) | mobile | principal-architect / security-architect | 7 | FP-1, FP-7 | M | 300, 14 | 2 | `otp_length` and `token_verifications` in the dashboard (founder), same day |
| FP-10a | NS-40: `modules/age-range` Swift module and scan (FS-12) | mobile | principal-architect / security-architect | 8 | Mac with Xcode 26.2; the spike | L | 380, 8 | 3 | App ID capability and the Texas risk acceptance (founder) |
| FP-10b | NS-40: signal at launch, entitlement, preflight allowlist, label (R5, R6) | mobile | principal-architect / security-architect | 9 | FP-10a | L | 260, 9 | 3 | entitlement approval path (founder); counsel Q46 |

Totals: 19 PRs (5 S, 12 M, 2 L; FP-11 is unused, its File 28 re-stamp became DA-1), about 4,900 changed lines [E: sum of the column]. Not mine and not counted: `DA-1` the File 28 re-stamp and apply path (`data-architect`; a migration task), `DA-2` purge of unconfirmed `auth.users` rows (O-12), BL-961 parts 2 and 3, BL-922a/b, BL-978a/b, the `SystemLine` component (`design-systems`), the words (`content`, BL-965). The 27 P1 rows ride in the PR that builds their behaviour: R8, R12, R15, R17, R21, R24, R25 of NS-41 in FP-7, FP-6, FP-9, FP-8; NS-39-R7, R8, R9, R13 in FP-12 (R7 is the NS-34 sheet); NS-40-R4, R11, R14 in FP-6/FP-10b; NS-42-R8, R12, R14 in FP-2, FP-4, FP-3; NS-43-R5, R9, R12 in FP-13 (R12 stays `todo`, AX-1); NS-44-R5, R11, R13 in FP-14; NS-45-R4, R14, R17 in FP-9, FP-15, FP-18; NS-38-R6 on the NS-34 sheet.

## 3. Sequencing against the account work already merged or open

State [V: `git log origin/develop`, open PR list, 20 Nov]: BL-961 part 1 `bookVisibleTo` merged (#869, `c1306b18`); part 2 held screen (#871, `4879ff5c`) and part 3 store lists (#879, `e27d104e`) open. BL-577 server half merged (#634, `78f71453`); the app half is FP-2. BL-962 merged (`4234fe1c`, #868). BL-975 label guard merged (#897, #898, #906). BL-922a/b and BL-978a/b: no PR open, none merged. BL-553, BL-579, BL-580, BL-561: deferred or open, not started.

1. Free to start now: FP-1, FP-5, FP-17, FP-12, FP-9, FP-16b, FP-18 (no overlap with `lib/first-run/*`, `consent.ts` or `store.ts`).
2. `lib/first-run/*` queue (`08-keeping.md:248`): BL-922a, then BL-922b, then BL-978a, then FP-6 (it edits the outage views and `OUTAGE_ERRORS`, `gate.logic.ts:164`). FP-7 does not touch `lib/first-run/*`.
3. `consent.ts`: `heldAnswers` (`consent.ts:88`) already closes NS-10-R7, so BL-978a should drop its R7 hunk (`08-keeping.md:123`); FP-2 then lands before any other `consent.ts` change. If BL-978a lands first, FP-2 rebases on it, never the reverse (CODE-R02 keeps both small).
4. `lib/store.ts`: #879 changes the book lists; FP-13 adds `addChildren` and queues behind it.
5. `app/_layout.tsx` is boot wiring: BL-961 names it; this group does not touch it (`security-architect` has 2 runs a day, `08-keeping.md` 3.7).
6. NS-41-R6 is BL-961 part 3's test; this design adds no gate code for the second account.
7. The server flag order (FS-21): FP-2 in a store build, then the founder applies `20261108000000`, then FP-15 live, then the oldest build in the field carries FP-2 (the only lever is `minSupportedVersion`), then the founder sets `app.consent_fields_required`. FP-4 follows FP-2 and needs no flag.
8. Code length (FP-8) after FP-7 and FP-1 so the notes, templates and screen change together; the dashboard flip is the founder's the same day.
9. NS-40 last: FP-10a waits for the Xcode 26.2 spike; FP-6's region screen can ship dark before File 28 is on (the code path is unreachable until the hook refuses someone), which keeps BL-553's app half off the founder's critical path.
10. The `SystemLine` component (`DESIGN-DELTA.md:57`) is not a blocker: FP-14 and FP-15 use a plain text line until it lands.

## 4. The three riskiest parts
1. RK-3 The consent flag order (FS-21). The database setting `app.consent_fields_required` refuses every sheet act without a hash and locale (`20261108000000:75-78`). Flipped before the oldest build carries the builder, it blocks consent for those people, and today nothing tells a build to update (`minSupportedVersion` has no consumer). It is a founder step with no code guard. Way back: set the database setting back to off (a database setting, not a migration); a row refused is not written, so nothing is corrupted.
2. RK-4 NS-40's native module and the region hook. The Declared Age Range names are unverified on this machine, Xcode 26.2 on EAS with Expo SDK 57 is unverified, a new entitlement can fail signing, and the hook is a sign-up gate on `auth.users` whose migration is out of order (RK-2) and not enabled by config. Way back: the module is one file behind one entitlement (revert in one release); the hook fails open and the founder can disable it in the dashboard.
3. RK-5 Auth settings the repo cannot see. Hosted `otp_length`, expiry, rate limits and the Turnstile row are all [U]; moving the code to 8 digits with a build and a dashboard that are not flipped together breaks sign-in for a new person. Hotspots are shared: `lib/first-run/*`, `store.ts`, `consent.ts`, with BL-922 and BL-978 not yet open. Way back: keep the field accepting 6 to 10 (`email.ts:29`); revert the dashboard value; the previous build still types 6.

## 5. Conflicts for product (never build against a card)
- **CF-1** NS-40-R2, R6, R7 (nothing derived from the age signal is stored; the Terms record has no `age_signal`) against function FR-PRV-25 (`privacy.md:163`: the enum is recorded in the Terms record's context) and BL-577's last criterion. The card wins. This design sends no `age_signal`. Product: drop the enum from FR-PRV-25 and BL-577, or amend the card.
- **CF-2** NS-40-R8 and the compliance input (a No at the sheet's age step ends the session locally and sends nothing) against BL-580 and Terms 2.1 / Privacy 8 (the account is closed on a No). The card wins; BL-580 stays deferred. Product with counsel.
- **CF-3** NS-44 O-13 (allowance per phone, no account id) against function FR-LCY-13 (`lifecycle-and-platforms.md:150`: the allowance counts once across both phones of one account). The card wins; a per-account count needs a server field the card forbids.
- **CF-4** NS-45 "Built today" and `PACK-DELTA-1` (no email on request or cancel) against `purge-worker/account.ts:247, 251`: built. Product corrects the card; R17 is a test and a deployment check (FS-35).
- **CF-5** NS-45-R13 and R14 (the update line only; a newer non-required version shows nothing) against `GAP-LOG.md:227` (update required also hides the feature that needs it, row "Needs the latest version of the app") and E-S16 with K-E05 ("update available" as the same line, softer words; `lifecycle-and-platforms.md:229`). Build the card; ruling needed.
- **CF-6 (gap, not a contradiction)** The notice at collection above the agreement line on the Welcome (`functions/privacy.md:193`, F01 A-REQ-035, K-16: two plain sentences, Privacy link to "What we collect") has no row in NS-42 (R14 covers links only). Product adds a P0 row or rules it out.

## 6. Founder and counsel questions, each with a default (none is decided here)

| Id | Question | Owner | Default | Source |
|---|---|---|---|---|
| OQ-F1 | Does the listing say sign-in is needed | CMO role, content | yes, one plain sentence | card O-1 |
| OQ-F2 | Keep Start on this phone in an outage for a store build | Karma | yes, as built | O-22 |
| OQ-F3 | Declared Age Range: ship the module in a 1.0.x before 1 Jan 2027 and record the Texas risk acceptance now | Karma, founder | yes, both | O-2, FR-CMP-15 |
| OQ-F4 | Phone owner check before Delete account (not only Erase) | product | no; typed word, date, two emails | O-17, FR-SEC-06 |
| OQ-F5 | A phone-wide, time-only code pause (no address stored) | security-architect | yes | FS-17 |
| OQ-F6 | Code length 8 and `token_verifications` 15; flip order | founder, security-architect | build then dashboard, same day | O-6 |
| OQ-F7 | Apple revoked notification listener | product | not built; foreground check only | O-18 |
| OQ-F8 | Password-grant probe on staging | security-architect | this week | O-21 |
| OQ-F9 | Is a sensitive-data withdrawal control in Me, Privacy in the store build | mobile reads, product | read before FP-2 merges | FR-CMP-16 |
| OQ-F10 | App Store id for the update button | founder | hide the button until set | FS-33 |
| O-3 | A confirm step after No | founder, counsel | not built | BL-561 |
| O-4 | File 28 on before sign-up outside the family | founder, Karma | yes | BL-553 |
| O-5 | Second account: hide and lock | Karma, founder | ADR 0031 as proposed | BL-961 |
| O-7 | Turnstile on email send | founder | before the public TestFlight link (CL-070); subprocessor page first | CL-070 |
| O-8 | Apple name scope | privacy, mobile | email only (FP-9) | NX-31-R9 |
| O-9, O-11 | Three agreement moments; versioned links | Karma, content, founder | keep all three; links to the versioned page | card |
| O-12 | Purge never-confirmed users after 7 days | data-architect | yes (DA-2) | G11 |
| O-13 | Allowance per phone or per account | CBO role | per phone (CF-3) | card |
| O-14 | One shared date for first-run siblings, atomic commit | CPO role, mobile | shared date, atomic (FS-28) | card |
| O-15 | Account deleted elsewhere: keep the phone's letters | Karma, privacy | keep, say it once | card |
| O-16 | Update states | Karma | line in Me only | card, CF-5 |
| O-20 | Register the sending domain with Apple's relay | founder | before public sign-in | AUTH_SETUP 2.5 |
| Counsel | Q-D (agree or acknowledge Privacy), Q20, Q41, Q44 (consent records), Q46 (age assurance), Q57 (sanctions, VPN), Q56 (codes), Q51 (retention), Q24 (export compliance), Q54 (label and IP), the 5.1.1(v) number (FR-CMP-18) | counsel | counsel reads before any store build outside the family | card sections 17 |
| Founder steps | read the 14 hosted auth values; apply `20261108000000`, `20261109000000`, File 28; enable the hook; load geo data; enable the App ID capability; set Turnstile; register the relay; ASC fields (NS-38) | founder | in the order of `12-first-run-2.md` section 6 | no agent does these |

## 7. Cites sampled (40 or more) and not read
I re-read 45 cite groups (about 110 lines) on develop `16e61549` or the named branch. 39 held exactly; 2 held within one line (`_layout.tsx:213` against the card's `:214-217`; `auth.en.ts:296-297` against `:297`); 4 moved or stale: `consent.ts:113` is `:124`; `consent.ts:117` (our `08-keeping.md:123`, `privacy.md:100`, `README.md` findings row) is stale because `heldAnswers` is at `:88`; `session-provider.tsx:255-267` is `:270-281`; `email.tsx:66` is `:69`. Groups: `_layout.tsx` 213, 243, 194; `gate.logic.ts` 39, 42, 48, 110, 123-125, 164, 194; `onboarding.tsx` 94-95, 288, 575, 579; `store.ts:338`; `consent.ts` 88, 124, 140; `email-link.logic.ts:36`; `pending.ts:72`; `apple.ts` 51, 60, 81-91; `email.ts` 28-29, 35-37; `config.toml` 41-47, 54-56, 70-74; `brand/index.ts` 83-85, 50-51; `app-review.en.ts` 4, 32, 40; `capabilities.ts` 1-12, 181, 266; `welcome-sign-in.tsx` 57-58; `remote-config.ts` 36, 67-79, 99, 105, 107, 133; `letter-ledger.logic.ts` 36, 38; `account-deletion.en.ts` 15-16; `export.en.ts` 122; `app.config.ts` 44, 260; `purge-worker/account.ts` 247, 251; `agreements.logic.ts` 19, 21; `age-gate.logic.ts` 15, 20-33; `20261108000000` 29-33, 75-78; `strings.en.ts` 1482, 1503-1504; `kill-switches.ts` 1-8, 10-35; `reauth.logic.ts:19`; `eas.json` 19, 47, 61, 65-66; `envelope.ts` 48, 199; `semver.ts:28`; `settings/privacy.tsx:41`; `migrations.ts` 394-424; `child.ts` 16, 96; `keep-step.ts` 22-50; `outage-screen.tsx` 30-39; `20261031000000` 236-290 on `origin/feat/db-compliance-gates`.
Not read or not run: nothing on a phone, simulator, Swift toolchain, hosted project or staging; Apple's Declared Age Range page (the fetch returned the title only); the e2e design files themselves (read through #921 to #923); eval A to C; `docs/ops/RELEASE.md`; the hosted Supabase values; whether `20261031000000` fires for Apple's `signInWithIdToken` sign-ups; whether `purge-worker` is deployed; whether `20261108000000` and `20261109000000` are applied to production.

## 8. AMENDMENTS (for Karma to apply; I edit no existing file)
1. `docs/tdd/new-scope/README.md`, table "Files": add rows `12-first-run.md` (frame, NS-38, NS-39, NS-40), `12-first-run-2.md` (NS-41, NS-42, auth settings), `12-first-run-3.md` (NS-43 to NS-45, flags, update reader), `12-first-run-4.md` (96 P0 tests), `12-first-run-5.md` (PRs, risks, questions); lens A / B for each: principal-architect / security-architect (compliance-engineer for part 2).
2. `docs/tdd/new-scope/README.md`, table "Code findings from the designs", row "A consent retry writes a second acceptance row": Where `consent.ts:117` becomes `consent.ts:88 (heldAnswers)`; Fix owner "built; NS-10-R7 needs only its title".
3. `docs/tdd/new-scope/architecture.md`, section 1.2 table: add a row "NS-38 to NS-45 | `lib/first-run/*`, `lib/auth/*`, `lib/update/` (new), `app/onboarding.tsx` | none | `kill-switches.ts`, `remote-config.ts` | none (File 28 by `data-architect`) | `modules/age-range` | 12".
4. `architecture.md` section 2.3 table: add AC-17 "`killSwitches.signIn`, additive, default false, hide only | `kill-switches.ts:10-35`, `remote-config.ts:67-79` | NS-41-R25 | FP-5 | older phones drop the key | CL-111". In AC-15's row add "reader half: FP-15 (`lib/update/`); server `SCVER` unchanged".
5. `architecture.md` section 3, AP-1: add `killSwitches.signIn` to the pause names; section 4 table: add AS-13 "FP-2, then `20261108000000` applied, then FP-15, then the oldest build carries FP-2, only then `app.consent_fields_required`".
6. `docs/tdd/new-scope/privacy.md` line 100 (consent retry): replace "mints a new idempotency key per call (`consent.ts:117`)" with "holds one key per answer (`consent.ts:88`, `consent-key.logic.ts`); built". Line 104: replace "No card adds a new consent except NS-08 at its flip ... and NS-25" with "... except NS-08, NS-25 and the first-run records of NS-42, which are existing PRIV-R21 acts completed by `buildConsentAct` (`12-first-run-2.md` FS-21)". Section 3 (label): add the per-PR label lines of `12-first-run-5.md` section 1.
7. `docs/tdd/new-scope/08-keeping.md` section 3.2 bullet "R7 (BL-978a)": mark built ("`consent.ts:88`"); section 3.6 PR 4 (BL-978a): remove R7; lines 246-250 merge-order list: add "NS-41 PR FP-6 after BL-922a, BL-922b, BL-978a; FP-2 before any other `consent.ts` change".
8. `docs/tdd/new-scope/security.md`: new section 3.12 "NS-40 to NS-45" with section 1 of this file; add PROPOSED NSC-13 (age module returns three strings only) and NSC-14 (`buildConsentAct` only caller) to section 2; add FP-10a, FP-10b, FP-6, FP-2 to the section 7 PR list.
9. `docs/tdd/new-scope/data-and-sync.md` section 2.2 (settings keys): add `update.serverRequiredFor` (L2, settings) and `scribe.auth.codePausedUntil` (L2, Keychain); section 2.3 (server register): add File 28 `20261031000000` ("pending; re-stamp by `data-architect`"); section 6 (F4): add `20261108000000` and `20261109000000` to the list of files that must be applied before store builds.
10. `docs/tdd/new-scope/11-foundations.md` NS-34 rows 1 and 15: add the under-1 GB Speak line (FS-31) and the cold-start row NS-39-R7.
11. `docs/ops/AUTH_SETUP.md` section 1 item 2: "Allow manual linking: on" becomes off (matches `config.toml:47` and the card); section 4.4: code length per O-6; add a link to `docs/ops/AUTH_SETTINGS.md` (FP-17).
12. `docs/engineering/readiness-20nov/quality/` catalogue: add `TEST-CASE-CATALOGUE-E-first-run.md` from `12-first-run-4.md` sections 14 and 15.
13. `docs/agents/BOARD.md` (Karma): claim rows FP-1 to FP-18 by owner; `DA-1`, `DA-2` to `data-architect`.
