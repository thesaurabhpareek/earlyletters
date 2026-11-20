# Theme 3: Before you begin: adults only, plain agreement, age signal, where we serve

Readiness: NOT READY for the region and age-signal parts; 22 of 28 for the rest (audit 8 Nov: 14). Author's re-score, `qa` to confirm. Remains: the three answers below, then the CCO line on the split parts of #635.

### Blocked on (exact question, recommended default)

| # | Question | Who answers | Recommended default | Rows it holds |
|---|---|---|---|---|
| B-1 | Where does the sign-up country check run, and may it read the request's IP address to resolve a country, discard the IP in the same request, and keep only daily counts by result (country code for refusals only, 2 years)? D-136 records the founder's disclosure and says counsel must confirm (Q57). `supabase/functions` has no such function and Supabase Auth is called directly from the phone, so a function in front of sign-up is new. | Counsel (Q57); `security-architect` for the design | A new Edge Function `signup-check` that the app calls before any Auth call, reads the country from the platform's request-country header (UNVERIFIED that the header exists on this host), compares with the D-131 list, and writes nothing but the daily count. Fail closed with the neutral message; a refusal never touches the on-device book. Not built until counsel answers. | R7 (and theme 11 R4) |
| B-2 | Does a duty to ask the phone's age range (Texas now; California from 1 Jan 2027) bind the first public release (Q46)? Is Apple's age-range API available on the minimum iOS the app supports? | Counsel (Q46); `mobile` reads the SDK | Ship the app's own 18+ question only (it exists, below). Build the signal request behind a switch that is off, with no store claim, so the answer costs a switch and not a release. | R6 |
| B-3 | Is the Privacy Policy row an accept or an acknowledge (#635 stores both as accept and leaves Q-D open)? | Counsel (Q48) | Keep both as accept, as #635 builds it, until counsel says otherwise. | R4 wording only |

Everything else in this file is finished and may start once the split of #635 (R0) is agreed.

| | |
|---|---|
| Working label | NX-03 (working id, see `_CONVENTIONS.md`) |
| Refines | F01 (entry), F02-REQ-026, -027, LEGAL-REQ-001, -002, BL-575, BL-577, BL-578, BL-580, BL-585, D-131, D-136, D-138 |
| Tag | EVIDENCE for the legal and store gates (`05-compliance-risk.md` gates G-A, G-B, G-F; gap map 1.3). HYPOTHESIS for the Apple age-range API shape: compliance file S3 says it needs the iOS 26 SDK family and does not reach iOS 18 or earlier accounts; the final API is NOT VERIFIED (feasibility item 28) |
| Size | M (feasibility item 28 is M). Pieces already in review: #635 (851 added lines over 27 files, over the 400-line rule, split first), #521, #634, #636, #637 |
| Gate | Counsel (Q46 age assurance, Q48 consent design, Q44 real families under draft texts, Q57 sanctions). Founder (CCO line on #635, merges anything in `docs/legal`). Apple: 5.1.1(i) |
| Order | 3 of 12 |

## What the parent will see and do

On a first open: a short "Before you begin" screen. It asks one neutral question, are you 18 or older, with nothing chosen for them (this is already true on develop). Below it, one unticked box for the agreement, with the Terms and Privacy links that open plain pages and come back to where they were. If they answer no, the app stops kindly and stores nothing about them. If they answer yes, the sign-in buttons appear with the agreement line directly above them.

On a phone that reports an age range from the system, the app asks for it once, and uses it with its own question.

## The check

| Label | Tag | Given, When, Then | Fails on old code because | Source |
|---|---|---|---|---|
| NX-03-R0 | EVIDENCE | Given PR #635 (851 added lines over 27 files, over the 400-line rule), Then it is split into three PRs, each under 400 added lines and 20 files (CODE-R02): (a) the entry decision and the stop path (`age-gate.ts`, `age-gate.logic.ts`, `age-gate-screen.tsx`, the e2e flows, the `ageGate` strings); (b) the agreement box and its links (`components/ui/agreement-row.tsx`, strings); (c) the local agreement record (`agreements.logic.ts`, `db/repos/agreements.ts`, the local schema v10 step in `db/migrations.ts`, `sha256.ts`, `store.ts`, their tests). `mobile` confirms the cut. | #635 is one PR of 27 files. | CODE-R02; gap map 1.3 |
| NX-03-R1a | EVIDENCE (guard) | Given a first open, Then the age question renders with 0 options preselected and the person cannot pass the gate without answering; at AX5 0 lines are clipped. | PASSES on develop for the question: `age-gate-screen.tsx` holds `adult` as `null` ("nothing preselected", K-07) and the Yes/No pair is a radio group. Keep as a regression guard; only the AX5 device row is new. | F01; `apps/mobile/test/age-gate-screen.test.ts` |
| NX-03-R1b | EVIDENCE | Given a first open and the answer Yes, Then an agreement box with the Terms and Privacy links is shown unticked, and Continue with Yes and the box unticked stores nothing and says why on screen (the reason, not a dimmed button; #635 design 2.1 keeps Continue reachable for VoiceOver). | The gate screen on develop has no agreement box and no agreement table (`apps/mobile/src/lib/agreements*` and `components/ui/agreement-row.tsx` are absent). | #635; F02-REQ-026 |
| NX-03-R1c | EVIDENCE | Given an install that passed the old gate before the agreement existed (every build 1 install), When the app opens after the update, Then it shows the agreement once without asking the age question again, and no record is made up from earlier use. | develop's `useAgeGate` returns only ask, stop or pass; there is no agree state. | #635 `decideEntry` |
| NX-03-R2 | EVIDENCE (guard) | Given the answer No, When the parent taps Continue, Then only `ageGate.stoppedAt` is stored (a time, no age), the stop screen stays 24 hours (`BLOCK_MS`), a clock moved back never shortens it, 0 account rows exist, and the screen shows the neutral message. | PASSES on develop (`age-gate.logic.ts`, tested in `apps/mobile/test/age-gate.test.ts`). Guard only; the wording is counsel's. | LEGAL-REQ-002; D-026 |
| NX-03-R3 | EVIDENCE | Given the sign-in sheet, Then the agree line with versioned Terms and Privacy links sits directly above the sign-in buttons, and every legal link in `apps/mobile/src` points at a route the website serves (0 others). | `brand.web.healthPrivacy` is still defined (`packages/brand/index.ts:53`) though no file in `apps/mobile/src` reads it (searched 8 Nov); no test covers every legal link (BL-564 acceptance); the agree line above the sign-in buttons was not found by search. | BL-575; D-138 item 3 |
| NX-03-R4 | EVIDENCE | Given an agreement, When it is stored, Then the server row carries build number, OS major version, text language and the hash of the words shown (4 of 4 fields non-empty). | The local row #635 builds holds document, version, action, surface, device time, app version and the hash, but no build number, OS major version or text language, and nothing is sent to the server; the server row is #634's migration (not applied). | BL-577; PRIV-R21 |
| NX-03-R5 | EVIDENCE | Given an erase request for an account, Then pseudonymised consent rows are found and removed in the same job (0 rows left for the Asha fixture). Given an attempt to update or delete an audit or consent row, Then the database refuses. | BL-578 (DATA-05) and BL-585 (DATA-06) state the gap on develop: consent rows are not findable by the deletion request and audit and consent tables accept rewrites. The latest migration is `20261028010000`; I did not read the migrations to confirm the gap is still open (UNVERIFIED). | BL-578, BL-585 |
| NX-03-R6 | EVIDENCE for the duty; HYPOTHESIS for the build | Given a phone that offers an age range, When the app requests it once at first run, Then the range is used together with the parent's own answer and the stricter of the two decides. Given a phone below the signal level, Then the app relies on its own question and records "no signal" without error. | HOLD (B-2). No age-signal code exists in `apps/mobile/src` or `packages/core/src` (searched 8 Nov). | `compliance-register.md` CR-004, CR-005; compliance file G-B |
| NX-03-R7 | EVIDENCE for the decision; build not found | Given a sign-up from a blocked country (D-131), When the check runs, Then sign-up is refused with a neutral message and the server stores no name and no IP address. | HOLD (B-1). No block exists in `supabase/functions`, migrations or app code (searched 8 Nov); the source of the country is D-136's request IP, resolved and discarded. | D-131, D-136, D-137; gap map 1.3 |
| NX-03-R8 | EVIDENCE | Given the live website, Then the privacy and terms pages at the app's permanent URLs state that the app exists and cover the app, and `/support`, `/delete-account`, `/subscription-terms` answer 200. | On 8 Nov the privacy page says "The Early Letters app is not out yet" and 3 pages are absent: `apps/web/src/app/(legal)` holds `privacy` and `terms` only, so `/support`, `/delete-account` and `/subscription-terms` are the 3 (same count as theme 5 R5). | Gap map 0 item 3, 1.11 |

**Shown:** the age question, the stop screen and the agreement line (existing `ageGate.*` in `packages/content/src/strings.en.ts`), the region refusal (new, `authCopy.region.*`), and the versioned links.
**Records:** each act through `record_policy_act` per PRIV-R21, plus the age answer as a yes or no, never a birth date.
**Never:** a birth date, an exact age, a country name or an IP address kept to prove a block, a name screen (D-137), a child's name before the age step.
**Decline and withdraw:** No on the age step ends the flow with nothing stored beyond the stop. "Not now" on the agreement keeps the on-device book working with record, read and export. Withdrawal is in Settings and export and deletion still work (PRIV-R09).

## Edge cases

- Under-13 actual knowledge runs the runbook `docs/ops/runbooks/underage-account.md` (not reviewed here; compliance file section 7 item 7).
- California AB 1043 from 1 Jan 2027 and Texas SB 2420 now: both rest on secondary sources in the register; counsel is asked to confirm from the statutes (compliance brief item 11).
- Phone says adult, parent says under 18: no account (stricter wins; recommended default, counsel Q46).
- Parent travels or uses a VPN: the country check never blocks an existing account; it applies at sign-up only (recommended default).
- Dynamic Type AX5 and VoiceOver on the age question (device row).

## Offline behaviour

The age question and the agreement work with no network; the sign-in that follows needs one. Acts recorded offline carry their phone time and upload after the Terms row (F02-REQ-014).

## What we never do

Preselect an answer. Guess an age from anything else. Gender the child; copy uses {child}. Nudge with fear, guilt or loss language.

## Copy needs (packages/content)

There is no `consentCopy` content namespace: `consentCopy` in `apps/mobile/src/components/consent/copy.ts` holds three Settings strings and is not this theme's. The age and agreement words live in the existing `ageGate` group of `packages/content/src/strings.en.ts` (`exists`: title, answers, stop; #635 adds about 15 lines for the agreement line and the tick reason, `new`). The region refusal is `new`: `authCopy.region.refusedTitle`, `authCopy.region.refusedBody` in `features/auth.en.ts`. Words by `content`; counsel for registered strings. Registered strings change only with counsel and a disclosures version bump in the same PR (`COUNSEL_LOCKED.md`).

## Analytics events (opt-in, content-free, names only)

Existing: `auth_sheet_shown`, `analytics_opted_in`. New, not in `packages/analytics/src/catalog.ts` (checked 8 Nov), so add each to the catalog and `TRACKING_PLAN.md` first: `age_step_result` (property: answered yes or no, no age), `age_signal_result` (property: available, unavailable; held with B-2). Nothing before an opt-in, and nothing at all in 1.0 (D-124). Note the No answer happens before any consent: it must never be sent.

## Device rows

S1-03 (age step, the 18+ gate); new rows: "agreement box unticked and links return", "age question at AX5 and VoiceOver", "phone with no age signal", "blocked-country sign-up refused".

## Dependencies

Theme 1 (hosted project for the migrations). #655 order for #634, #636, #637. Split #635 before review. Counsel answers.

## Founder-only decisions

| Decision | Recommended default |
|---|---|
| CCO line for "Before you begin" (#635) | Give it after the split |
| Whether Texas and California duties bind the first public release | Ask counsel (Q46); plan as if yes and build the request now (gap map section 4 rank 7) |
| Real families under draft texts (Q44) | Family only until counsel answers; do not cross with a deferral |
| Blocked-country list and the check source | Follow D-131 and D-136 as written; counsel Q57 |

## Engineering block (cross-cutting, added 8 Nov 2026 after the readiness audit, G-31 to G-37)

| Line | This theme |
|---|---|
| API contract (`packages/api`) | R1 to R4: none (device-only until the server record). R4 server row: the policy-act type in `packages/api/src/server/` gains the 4 fields only if `record_policy_act` does not already carry them (read #634 first); additive, contract test in `packages/api/test/server-contracts.test.ts`. R7: a new `signup-check` request and refusal code type, version 1, additive, with a contract test (held with B-1). |
| Budget (`06-nfr.md`) | Gate answer to Welcome interactive: p95 300 ms (F01 section 9, perf build marker). `signup-check`: Edge Function light, p95 600 ms with cold start. No change to cold start (no awaited network before the first frame). |
| Accessibility | Before you begin screen, stop screen and region refusal: AX5, 0 clipped lines (existing screen scrolls at AX sizes); VoiceOver order: question, answers, agreement box, links, Continue; the box is one control named by its sentence; tap targets 44 pt or more; Reduce Motion: no motion beyond fade. One device row each. |
| Switch, off behaviour, noticed by | Switch: the age-signal request (new, off by default, B-2) and the region check (a signed remote-config capability, off means no check and a recorded founder risk, B-1). Off behaviour for the region check: sign-up proceeds. Noticed by: the daily count by result (no IP, no name), read by the weekly ops check. |
| Data class and retention | Age answer: `ageGate.passed` boolean, L2, device only, removed with the app. Stop time: `ageGate.stoppedAt`, L2, device only, cleared 24 hours after it is reopened. Agreement row (local): L2, device only until sync of acts; the hash is of the sentence, not of the person. Server consent row: pseudonymised, readable only by the service role and the person's own export, kept per DATA-REQ and removed in the erase job (R5). Region counts: daily count by result with the country code on refusals only, 2 years (D-136); no IP, no name, no account link. |
| Schema and grants | Local: schema v10 step for the agreements table (in #635, part c). Server: #634, #636, #637 (existing drafts; each carries its own grants and an entry in `supabase/tests/grants.mjs` before it merges; db tests: the consent and audit files named in each PR). The daily-count table for B-1 is a new additive migration, grants in `grants.mjs`, held with B-1. |
| Analytics events | age_step_result and age_signal_result: add to catalog first. auth_sheet_shown and analytics_opted_in: in catalog. |

## Trace and tests

Id convention: `_CONVENTIONS.md`. A test title starts with the bracketed id. Paths marked "proposed" do not exist yet; the PR that adds the test names the real path.

| Id | Refines | Test (layer, file, title) | Device or ops row |
|---|---|---|---|
| NX-03-R0 | CODE-R02 | PR sizes, no test; checked by the reviewer with `git diff --stat` | none |
| NX-03-R1a | F01; PRD-REQ-019 | `apps/mobile/test/age-gate-screen.test.ts`; `[NX-03-R1a] nothing is preselected and the gate needs an answer` | S1-03; new: age question at AX5 and VoiceOver |
| NX-03-R1b | F02-REQ-026 | same file after part (b); `[NX-03-R1b] Yes with an unticked box stores nothing` | S1-03 |
| NX-03-R1c | F02-REQ-026 | `apps/mobile/test/agreements.test.ts` (part c); `[NX-03-R1c] a build 1 install sees the agreement once` | new: update from build 1 |
| NX-03-R2 | LEGAL-REQ-002; D-026 | `apps/mobile/test/age-gate.test.ts` (exists); add the bracket to the existing title | S1-03 |
| NX-03-R3 | BL-575; BL-564 | unit (proposed `apps/mobile/test/legal-links.test.ts`); `[NX-03-R3] every legal link points at a served route` | none |
| NX-03-R4 | BL-577; PRIV-R21 | db test (proposed `supabase/tests/consent-fields.test.mjs`); `[NX-03-R4] consent row has 4 of 4 fields` | none |
| NX-03-R5 | BL-578, BL-585 | db tests in the files #636 and #637 add; `[NX-03-R5] erase finds and removes consent rows; audit rows refuse update` | none |
| NX-03-R6 | CR-004, CR-005 | HELD (B-2); mobile unit for the stricter-wins rule; `[NX-03-R6] stricter of signal and answer decides` | new: phone with no age signal |
| NX-03-R7 | D-131, D-136 | HELD (B-1); function test (proposed `supabase/functions/signup-check/handler.test.ts`); `[NX-03-R7] blocked country refused, 0 bytes of the value stored` | new: blocked-country sign-up refused |
| NX-03-R8 | F21 | web check script (proposed `scripts/ops/web-pages.mjs`); `[NX-03-R8] privacy and terms say the app exists; 3 absent pages answer 200` | none |

Trace: NX-03-R0..R8 -> F01, F02-REQ-026, -027, LEGAL-REQ-001, -002, BL-575, BL-577, BL-578, BL-580, BL-585, D-131, D-136, D-138.

## Not verified

Apple's final age-range API and its iOS floor. Whether BL-575 merged under another title. The statutes' text (secondary sources only).
