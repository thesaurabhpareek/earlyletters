# Engineering readiness audit of the next-set requirements (file 12)

Status: DRAFT, 8 Nov 2026 (UTC). Docs only. Written by `qa` for the founder's ask of 8 Nov: "validate thoroughness of details and PRD for engineering execution." It changes no decision, edits no requirement, assigns no id and merges nothing. Gaps are reported here for the authors of `03-requirements/` and `08-ranked-backlog.md`; this file does not fix them.

Head audited: `docs/next-roadmap-8nov` at `79dd928b` (Claude, 8 Nov 22:18 UTC, "ranked backlog 08 for founder confirmation"). Code audited: the same tree, which is `develop` at `caba0215` plus these docs.

## 0. Limits (read these first)

What I read in full: all 13 files in `03-requirements/` (index and 12 themes), `08-ranked-backlog.md`, `docs/prd/v2/11-requirement-rules-and-retro-changes.md`, `docs/agents/COORDINATION.md` section 10, and `docs/backlog/READINESS-2026-11-08.md` (branch `docs/prd-v2-readiness-8nov`, PR #638, sections 1 to 4).

What I read in part: `04-feasibility.md` (the R-table and the item headings only), `docs/prd/v2/06-nfr.md` (grep for the numbers each theme cites), `docs/prd/v2/features/F02-account.md` (REQ-024 only), `docs/qa/DEVICE_TEST_PLAN.md` (row ids only), `packages/content/src` (namespace names and the keys the themes call new), `packages/analytics/src/catalog.ts` (event names only), `supabase/functions` and `supabase/tests` (file counts only), `packages/brand/index.ts`, `apps/web/src/app` (folder names only).

What I did not read: `docs/engineering/PRINCIPLES.md` and chapters 01 to 10 beyond their titles (I used the rules as COORDINATION section 10 and file 11 restate them), `docs/prd/v2/07-quality-bar.md`, `_AUTHORING.md`, the other 20 feature specs, `docs/release/BUILD12-GAP-MAP-2026-11-08.md` (on `docs/build12-gap-map-8nov`; I took its claims second-hand through the themes), `05-compliance-risk.md`, `06-roi.md`, `07-debate.md`, any PR body or diff (#602, #615, #618, #632, #633, #634 to #637, #657 and the rest are UNVERIFIED by me), `supabase/migrations` contents, and the app screens line by line. I ran no tests and no scripts. Every "exists" or "does not exist" below is a file or string search on this tree, so a claim of absence means "not found by name", not proof.

Scores are my judgement against the rubric in section 1, not measurements. A different reader could move any single cell by 1.

## 1. Definition of Ready (built from the repo's own rules)

Sources: file 11 section 1 (RR-1 to RR-13 and the six-question clarity check), COORDINATION section 10 (the door lines Shown, Records, Never, Decline and withdraw; who writes what; evidence rule), the CLAUDE.md rules (content rules, privacy rules, grants and migration rules, one concern per PR, `[ID]` test titles).

An item is ready to hand to an engineer, human or agent, when all 14 hold. Score 0 = absent or wrong, 1 = present but an engineer would have to ask, 2 = complete or truly not applicable.

| # | Criterion | Ready means |
|---|---|---|
| C1 | Customer's side, then the check with numbers | A person-level sentence, then Given/When/Then with a number or something you can see (RR-1). Words like "plain" or "calm" carry a number or are gone. |
| C2 | Fails on old code | Each check names why it fails today, and that reason is true on the tree. One behaviour per id (RR-2). |
| C3 | Edge cases and offline | The RR-5 cases are listed or ruled out: second device, second account, retry after a lost answer, kill switch on and off, erase or delete. Offline behaviour is stated. |
| C4 | Error and empty states | What the person sees when it fails, is empty, is refused or times out. |
| C5 | Copy keys | Keys named under the real `packages/content` namespace, new versus existing correct, content rules respected, registered strings flagged for counsel. |
| C6 | Analytics | Each event is named, content-free, and marked allowlisted or "add to catalog first". |
| C7 | Accessibility | Dynamic Type to AX5, VoiceOver order, Reduce Motion, tap target, named per screen. |
| C8 | Security and privacy | Data classification of what is stored, who may read it (RLS role), retention, deletion path, logs without content, the door lines where a person agrees to something. |
| C9 | Data and migrations | Additive migration named, grants line in `supabase/tests/grants.mjs`, the `test:db` file, or "no schema change". |
| C10 | API contract | The `packages/api` type, route or remote-config field that changes, with version. |
| C11 | Performance and size | A budget with a number that matches `06-nfr.md`, or "no change". |
| C12 | Observability without content | What is logged or counted, by code only, and how a failure is noticed. |
| C13 | Test plan | Layer (unit, db, e2e, device row), the test file or the `[ID]` title, and the device row id. |
| C14 | Rollout, rollback, owner, gate | Switch or flag, how to turn it off, owner lane from `agents/roster.json`, the external gate. |

## 2. Scorecard: the 12 themes (0 to 2 per criterion, max 28)

| Theme | C1 | C2 | C3 | C4 | C5 | C6 | C7 | C8 | C9 | C10 | C11 | C12 | C13 | C14 | Total | Verdict |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 01 Hosted backend | 2 | 1 | 2 | 1 | 2 | 2 | 2 | 1 | 1 | 0 | 1 | 1 | 1 | 1 | 18 | Ready after named fixes |
| 02 Sign-in and session | 2 | 1 | 2 | 1 | 1 | 1 | 0 | 2 | 1 | 1 | 1 | 1 | 1 | 1 | 16 | Ready after named fixes |
| 03 Age, consent, region | 2 | 1 | 2 | 1 | 0 | 1 | 1 | 2 | 1 | 0 | 0 | 1 | 1 | 1 | 14 | Not ready |
| 04 Delete account, erase phone | 2 | 2 | 2 | 1 | 1 | 1 | 1 | 2 | 1 | 1 | 0 | 1 | 2 | 1 | 18 | Ready after named fixes |
| 05 Reviewer sign-in, store pack | 1 | 1 | 1 | 1 | 1 | 2 | 2 | 1 | 2 | 1 | 1 | 2 | 1 | 1 | 18 | Not ready (one decision and one contradiction) |
| 06 Recording that behaves | 2 | 1 | 2 | 1 | 0 | 1 | 1 | 1 | 1 | 2 | 1 | 1 | 2 | 1 | 17 | Ready after named fixes (R1 to R4 can start) |
| 07 Letters on every phone | 2 | 1 | 2 | 1 | 1 | 2 | 1 | 1 | 1 | 1 | 1 | 1 | 1 | 1 | 17 | Ready after named fixes |
| 08 Plus and billing trust | 1 | 1 | 1 | 1 | 1 | 2 | 0 | 1 | 2 | 1 | 1 | 1 | 1 | 1 | 15 | Ready after named fixes (BL-736 part is ready now) |
| 09 Co-parent, shared voice | 1 | 1 | 1 | 1 | 1 | 1 | 0 | 1 | 1 | 0 | 1 | 1 | 1 | 1 | 12 | 9a ready after fixes; 9b not ready |
| 10 Reminders | 1 | 0 | 2 | 1 | 1 | 2 | 0 | 2 | 2 | 2 | 1 | 1 | 1 | 1 | 17 | Ready after named fixes |
| 11 Relative adds a hello | 1 | 1 | 2 | 1 | 1 | 1 | 1 | 1 | 0 | 0 | 0 | 0 | 1 | 1 | 11 | Not ready (by design, after release) |
| 12 Names and languages | 1 | 1 | 1 | 1 | 1 | 2 | 0 | 1 | 2 | 1 | 0 | 1 | 1 | 1 | 14 | Languages not ready; names part ready after fixes |

Reading the pattern: every theme is strong on C1 (the person's side and a Given/When/Then with a number) and on the door lines of COORDINATION section 10 where a person agrees to something (themes 2, 3, 4, 8, 9, 11). Every theme is weak on the same five things: C7 accessibility beyond one AX5 row, C10 the `packages/api` contract, C11 budgets that match `06-nfr.md`, C12 how a failure is noticed, and C13 test layer and file. These five are cross-cutting gaps G-30 to G-34 below, so each is fixed once.

## 3. Scorecard: the 29 rows of `08-ranked-backlog.md`

The table in 08 already carries owner, tests, reviews, gate, "fails on old code", device row and analytics columns. I scored each row on six of those, 0 to 2 each, max 12: R = a requirement exists and is verifiable; F = a named test that fails on old code; T = tests and device row named; G = owner and gate clear; I = the PR or BL id exists on the remote (reserved ids from PR #638 and "id: to be assigned" score 0 or 1); A = analytics events allowlisted or correctly flagged.

| Rank | Item | R | F | T | G | I | A | /12 | Call |
|---|---|---|---|---|---|---|---|---|---|
| 1 | Record the route (F1, F2) | 2 | 2 | 2 | 2 | 1 | 2 | 11 | Go (founder) |
| 2 | Counsel gates and packet | 1 | 2 | 2 | 1 | 2 | 2 | 10 | Go after F3 |
| 3 | Key, session, https PRs | 2 | 1 | 1 | 2 | 2 | 1 | 9 | Go; PR bodies unread |
| 4 | Numbering clean-up | 2 | 2 | 1 | 2 | 2 | 2 | 11 | Go |
| 5 | Hosted backend, rehearsal | 1 | 1 | 1 | 2 | 1 | 2 | 8 | Fix G-01 to G-05 first |
| 6 | Sign-in on production | 2 | 1 | 1 | 2 | 0 | 1 | 7 | Fix G-06 to G-09 first |
| 7 | Adults only, agreement | 1 | 1 | 1 | 1 | 1 | 0 | 5 | Not ready |
| 8 | Delete account, erase phone | 2 | 2 | 2 | 2 | 1 | 1 | 10 | Go after G-14 |
| 9 | Backup, kill, rollback, restore | 1 | 1 | 1 | 1 | 0 | 2 | 6 | Not ready (no requirement rows for rollback) |
| 10 | Reviewer sign-in, store pack | 1 | 1 | 1 | 1 | 0 | 2 | 6 | Not ready (G-16, G-17) |
| 11 | Founder-hands setup | 0 | 2 | 2 | 2 | 0 | 2 | 8 | A checklist, not a requirement; fine if ops writes it |
| 12 | Recording and Listen | 2 | 2 | 2 | 2 | 1 | 1 | 10 | Go after G-19, G-20 |
| 13 | Two-phone proof | 1 | 1 | 1 | 1 | 0 | 2 | 6 | Fix G-22 |
| 14 | Plus and billing trust | 2 | 2 | 1 | 1 | 1 | 2 | 9 | BL-736 go; rest after F10 and counsel |
| 15 | Free analytics | 0 | 0 | 0 | 1 | 0 | 1 | 2 | Not ready (no requirement, no plan file) |
| 16 | Support route | 0 | 0 | 0 | 2 | 0 | 0 | 2 | Not ready |
| 17 | Internal alerts | 0 | 0 | 0 | 2 | 0 | 0 | 2 | Not ready |
| 18 | Reminders that fit | 2 | 0 | 1 | 1 | 2 | 2 | 8 | Fix G-26 |
| 19 | Build 1 audit follow-ups (37) | 1 | 0 | 1 | 1 | 2 | 1 | 6 | Per row; one test line each |
| 20 | The 1 Dec block in #599 | 1 | 0 | 1 | 1 | 2 | 1 | 6 | 96 rows lack Satisfies (readiness file) |
| 21 | In-app Feedback (5 tasks) | 2 | 2 | 2 | 1 | 1 | 2 | 10 | Go after BL-729 label |
| 22 | Names that learn; prompts v3 | 1 | 1 | 1 | 2 | 0 | 2 | 7 | Fix G-28 (08 says Ready: Yes) |
| 23 | Co-parent text proof (9a) | 1 | 1 | 1 | 1 | 0 | 2 | 6 | After F8 and counsel |
| 24 | Rating ask, store page | 0 | 0 | 0 | 1 | 1 | 2 | 4 | Not ready |
| 25 | Settings regroup (#614, #521) | 0 | 1 | 1 | 1 | 2 | 2 | 7 | Scope unread by its own author |
| 26 | Notes control (D-133) | 1 | 0 | 0 | 2 | 0 | 2 | 5 | Not ready |
| 27 | Catch-up: backdate, import | 0 | 0 | 0 | 1 | 0 | 2 | 3 | Not ready |
| 28 | Family release (9b, 11) | 1 | 1 | 1 | 1 | 0 | 1 | 5 | Not ready by design |
| 29 | Parked group | n/a | n/a | n/a | n/a | n/a | n/a | n/a | Parked |

Rows with no requirement text at all (15, 16, 17, 24, 27) cannot be started by an engineer without asking questions; 08 says so in its Missing cell. Rows 15 to 17 are founder-asked items (analytics, support, alerts), so they are the first to need a requirement written, not an estimate.

## 4. Verification of claims against the code (the sampled lines)

At least three requirements per theme were checked at line level. Result per claim: HOLDS, WRONG, STALE or UNVERIFIED.

| Theme | Claim in the file | Check on this tree | Result |
|---|---|---|---|
| 01 | R3: "each of the 10 Edge Function folders (except `_shared`) ... Then 9 of 9 answer" | `ls supabase/functions` shows `_shared` plus 8 folders: analytics-forget, apple-token, config, content, escrow, invite-redeem, purge-worker, subscription-status. A "health call" was not found by search in the handlers | WRONG (three different numbers, none is 8); health call UNVERIFIED |
| 01 | R1: "the 32 access-test files" | CLAUDE.md says 32; `supabase/tests` holds 38 `*.test.mjs` files plus the harness and helpers | STALE (use no number) |
| 01 | R7: R-17 checklist "6 of 6" | F02-REQ-024 lists 6 BL ids but also requires migrations applied, F11-REQ-025 green, and `/terms`, `/privacy`, `/health-privacy` live. `apps/web/src/app/(legal)` has only `privacy` and `terms`; BL-564 (#589) removed the health page | WRONG, conflicts with a decision on record (G-03) |
| 01 | R5: restore minutes "written in the runbook" | `06-nfr.md` line 201: RPO 24 h, RTO 4 h, PITR off at launch (open question Q7). The theme recommends Pro with point-in-time recovery | Missing number, and the default changes an NFR (G-05) |
| 02 | R2: code length "equals the length the app accepts (6 today)" | `apps/mobile/src/lib/auth/email.ts:29`: `EMAIL_CODE_LENGTH` is 6 by default and accepts 6 to 10 from the build environment; `supabase/config.toml` has `otp_length = 6`, `otp_expiry = 900` | Ambiguous: "accepts" |
| 02 | Copy "keys to add": `authCopy.account.signOutOthersDone` | `packages/content/src/features/auth.en.ts:210` already has `signOutOthersDone: 'Other devices are signed out.'` | WRONG (exists) |
| 02 | R5: "the app does not read the epoch" | `forceReauthEpoch` appears only in `packages/api/src/remote-config.ts` and its standards test | HOLDS |
| 02 | New event `forced_sign_out` | Not in `packages/analytics/src/catalog.ts` | HOLDS (correctly new) |
| 03 | R6: "No age-signal code exists in `apps/mobile/src`" | No match for age range, age signal or declared age in `apps/mobile/src` or `packages/core/src` | HOLDS |
| 03 | R7: no country block exists | No match for blocked country or sanction in `supabase/functions` or `apps/mobile/src` | HOLDS |
| 03 | R1: the age question "renders with 0 options preselected"; fails because "#635 is open" | An age gate already exists: `apps/mobile/src/lib/age-gate.ts`, `age-gate.logic.ts`, `strings.en.ts:1396 ageGate`, device row S1-03 "the 18+ gate". The theme never says what today's gate does differently | Missing delta (G-10) |
| 03 | Copy keys `consentCopy.*` and `authCopy.consent.*` in `packages/content` | `consentCopy` is not a content namespace; `apps/mobile/src/components/consent/copy.ts` holds consent text in the app. The content features exports are accountDeletionCopy, authCopy, backupCopy, billingCopy, contentBlocksCopy, exportCopy, familyCopy, languageCopy, packsCopy, playerCopy, reminderCopy, speechSettingsCopy, speechConsentCopy, wordsCopy | WRONG namespace |
| 03 | R8 "3 pages return 404" versus 05 R5 "4 return 404 or site-only text" | `apps/web/src/app/(legal)` has `privacy` and `terms`; no `support`, `delete-account` or `subscription-terms` folder, so 3 are absent | Two files disagree (3 versus 4) |
| 04 | R5: Erase everything on this phone is not built | `privacy.tsx:139` and `where-letters-live.tsx:89` carry comments saying the row joins "once #520 is merged" | HOLDS |
| 04 | R3: `packages/brand/index.ts` line 56 names `/delete-account` | `deleteAccount` is in the `web` block at lines 55 to 56 | HOLDS |
| 04 | `accountDeletionCopy` has `.what .exportFirst .subscription .confirm .scheduled .signedOut .open .errors` | File exists and has `what`; I did not list every key | PARTLY UNVERIFIED |
| 05 | R1: Notes say "True for the on-device v1.0 only" | `packages/content/src/store.en.ts` lines 100 to 108: the comment and `reviewNotes` say exactly that and "there is no account to create" | HOLDS |
| 05 | Keys `store.reviewNotes.servers`, `.signIn`, `.dormantFeatures`, `.purchases` | `reviewNotes` is one string inside `storeListing`, not an object. The new keys need a change of shape and of the code that reads it | WRONG as written |
| 05 | R8: `ascAppId` in `submit.production` | `scripts/release/setup-state.mjs:268 to 278` checks `submit.production.ios.ascAppId` | HOLDS (check exists) |
| 05 | R9: 40 MB budget in `docs/ops/APP_SIZE.md` | `06-nfr.md` line 264 sets "under 40 MB, every release build" and APP_SIZE.md exists | HOLDS |
| 06 | Keys to add: `listen.phoneFull.title`, `.body` | `strings.en.ts:1064` already has `phoneFull: { title: "This phone is full", body: "Free some space to record, or type this one." }`, used by `mic-state.logic.ts:41` for a recording that cannot start. The finishing case (take kept, Keep offered) is a different state under the same name | Name collision (G-19) |
| 06 | R5: "Wait is shown as a line with a percent; no choice offered"; new key `speech.download.sizeLine` | `features/words.en.ts:20` already has `sizeLine` ("The download is about {size} MB and starts when you are on Wi-Fi.") and `waitingForWifi`, under `wordsCopy.pack`. There is no `speech` namespace | WRONG (exists, other namespace) |
| 06 | R5 "Given a speech file download over 40 MB budget path" | The 40 MB budget is the whole app download (`06-nfr.md` 11.1), not the speech file | Conflates two budgets (G-20) |
| 06 | R3: FINISH_TIMEOUT_MS is 3 seconds | `listen.logic.ts:296`: `FINISH_TIMEOUT_MS = 3000` | HOLDS |
| 06 | R9: year-5 fixture of 1,200 letters | `06-nfr.md` lines 73, 142, 254 use 1,200 letters | HOLDS |
| 07 | R6: "20 simulated clients"; "numbers belong to that file" | `06-nfr.md` section 16 sets G4 as 1 hour at 1x the 1k peak targets with a 20-family backup burst. "20 clients" is not a G4 load | Contradiction inside the row |
| 07 | "15 s pull for shared books (ADR 0025)" | `docs/adr/0025-sync-protocol-v1.md` exists; `04-feasibility.md` item 27 and `06-nfr.md` line 137 say 15 s | HOLDS (ADR text not opened) |
| 08 | Price: file states none; repo source | `packages/content/src/pricing.ts`: monthly $4.99 with a 1-month trial, yearly $49.99 with a 2-month trial (D-082). 08 F10 says "$4.99 and $49.99, first 2 free" | HOLDS; "first 2 free" is letters (D-083), not trial months, ambiguous in F10 |
| 08 | R7 alpha run 0 to 250 | Matches the readiness file (BL-736 and `tonight-plus.logic.ts`) | HOLDS (not run by me) |
| 09 | R4: "`book_access` is in no migration" | No match in `supabase/migrations`; `child_members`, `child_invites`, `peek_invite` do exist | HOLDS |
| 09 | Refines "F31 (shared voice)" | There is no `features/F31` file; F31 lives as a table row in `F30-later.md` | Spec depth missing |
| 10 | R4 "Prime flow built" | `components/asks/reminder-prime-ask.tsx` exists | HOLDS |
| 10 | R5 "Rule test exists" | The content rules test exists (CLAUDE.md). So R5 passes on old code | Violates "fails on old code" (G-26) |
| 11 | Refines F37, F32, FAM-05 | `F30-later.md` rows only; no standalone spec | Spec depth missing |
| 12 | R6: "`TRUSTED_SIGNING_KEYS` empty at the 27 Oct check; re-check" | `packages/api/src/keys.ts:20` lists two keys: `el-2026-11` and `el-2026-11-backup` | STALE (re-checked: not empty) |
| 12 | R3: "whether [the dictionary] shapes speech output is NOT VERIFIED" | 08 rank 22 says Ready: Yes for the same item | Contradiction (G-28) |
| 12 | Keys `languageCopy.hold.note (exists in spirit; check)` | `languageCopy` exists; "exists in spirit" is not a check | Untestable wording |

## 5. Gaps, with a fix an author can paste

Severity: **BS** blocks start (an engineer must ask a question first), **BM** blocks merge (the PR cannot be reviewed against it), **NH** nice to have. Owner lane uses `agents/roster.json` handles; `product` writes requirements (COORDINATION section 10).

### 5.1 Wrong facts and contradictions

| Id | Where | Problem (quote) | Fix text | Sev | Owner |
|---|---|---|---|---|---|
| G-01 | 01 R3 | "each of the 10 Edge Function folders (except `_shared`) gets its health call, Then 9 of 9 answer without a key error." The tree has 8 function folders. No health route found. | "Given legacy keys are off on the throwaway project, When the script calls each function folder under `supabase/functions` other than `_shared` (the script lists them, today 8), Then 8 of 8 answer their documented no-op call without a key error. Functions with no safe no-op call get one in the same PR (named in the PR)." | BM | `ops`, `product` |
| G-02 | 01 R1 | "the 32 access-test files run only in embedded Postgres." Count is 38 `*.test.mjs` files. | Replace with "every file `npm run test:db` runs" and drop the number. | NH | `product` |
| G-03 | 01 R7 and 03 R8 versus F02-REQ-024 | R-17 gate in F02-REQ-024 needs "`/terms`, `/privacy`, `/health-privacy` are live", "F11-REQ-025 is green" and migrations applied. The `/health-privacy` page was removed by BL-564 (#589). R7 says "6 of 6 items" and omits the other three. | "Given the F02-REQ-024 checklist, When it runs, Then every item passes: the 6 code items, migrations applied to the hosted project, F11-REQ-025 green, and `/terms` and `/privacy` live (the `/health-privacy` item is retired by BL-564; F02-REQ-024 is marked Rev BL-564 in the same PR)." Product edits F02-REQ-024; counsel confirms no health page is owed (BL-564 left-over 4). | BS | `product`, `legal` |
| G-04 | 01 R2 | "the script signs in, creates 1 letter ... as a synthetic Asha account" with the real mail path limited to two uses. The sign-in method for a script is not named. | "The smoke script signs in with the Auth admin API using a test-only key held in the CI secret store (never in the app or EAS), for the Asha account only; it uses the email path once, to prove the template renders. The method is named in `docs/ops/` and reviewed by `security`." UNVERIFIED that such a key flow is allowed by SEC rules; `security-architect` rules. | BS | `ops`, `security-architect` |
| G-05 | 01 R5 and 08 rank 9 | R5: "the minutes taken are written in the runbook" with no target. `06-nfr.md` line 201 says RPO 24 h, RTO 4 h, PITR off at launch (Q7 open). The theme's default is "Pro with point-in-time recovery". | "Given the dump from the throwaway project, When it restores into a second project, Then row counts match 100% and the restore finishes in 4 hours or less (06-nfr RTO). If the founder turns on PITR (F4), the 06-nfr row changes to RPO 5 minutes in the same PR, marked Rev D-###." | BM | `ops`, `product` |
| G-06 | 02 R2 | "unless N equals the length the app accepts (6 today)". The app accepts 6 to 10 from a build variable (`email.ts:29`). | "...unless N equals `EMAIL_CODE_LENGTH` as resolved for that build profile; the production profile pins it to 6, and a test fails if it does not." | BM | `mobile`, `security` |
| G-07 | 02 copy | "Keys to add: `authCopy.account.signOutOthersDone`" already exists (`auth.en.ts:210`). | Delete it from the list. Keep `signedOutForSafety` and say it is shown once per epoch bump. | NH | `content` |
| G-08 | 02 R10 | "The target minutes are not set; support owns them." Untestable as written (RR-1, RR-13). | "Owner: `support`. Target set by Mon 16 Nov. Until then the row is a question (RR-13), not a requirement." (Roster handle `support`: UNVERIFIED, 08 uses it.) | BS | `product` |
| G-09 | 02 R1 | "Weekly auth success, cancels excluded, is 97% or more (alert below 93%)" needs analytics, but analytics are off in 1.0 (D-124) and `auth_succeeded` is opt-in. Where is it counted? | "Counted from Supabase Auth logs (success divided by attempts, cancels excluded) read by the weekly ops check, not from app analytics." | BM | `ops` |
| G-10 | 03 R1 | The theme replaces an age gate that already exists (`lib/age-gate.ts`, `strings.en.ts` `ageGate`, S1-03) and never names the delta. "Fails on old code because #635 is open" is not a reason an engineer can test. | "Today's gate (`age-gate.ts`) [preselects or not: product reads and states which]. The new screen differs by: [list]. The test `[id] age question has 0 preselected options` fails on develop because [today's behaviour]." Product must read the old gate first. | BS | `product`, `mobile` |
| G-11 | 03 copy | `consentCopy.*` and `authCopy.consent.*` named as `packages/content` keys; `consentCopy` lives in `apps/mobile/src/components/consent/copy.ts`. | "Move age and agreement text into `packages/content/src/features/consent.en.ts` as `consentCopy` (a new content feature file, added to `index.ts` and the content rules test), and delete the app-side copy file in the same PR." Or name the real file. | BM | `content`, `mobile` |
| G-12 | 03 R7 | "a sign-up from a blocked country ... the server stores no name and no IP address." The check source is not named: how does the server know the country without an IP? | "Country comes from [the App Store storefront country in the receipt, or the platform's request header], read in [function name], compared with the list in D-131, and discarded in the same request. Test: the function's logs and tables hold 0 bytes of the value." Choose the source with counsel (Q57) and `security-architect`. UNVERIFIED which source is allowed. | BS | `security-architect`, `privacy` |
| G-13 | 03 and 08 rank 7 | The split of #635 is the first step, but no requirement says what the parts are. | "Split #635 into: (a) age step and stop screen, (b) agreement box and links, (c) consent record fields, each under 400 lines and 20 files (CODE-R02)." Product proposes; `mobile` confirms. | BS | `product`, `mobile` |
| G-14 | 04 R1 and R5 | "at day 30 0 rows hold the profile id" and "0 bytes" with no time budget for the purge run or the erase. | "The purge worker run for one sole-parent account with 5 letters finishes in 60 seconds or less; Erase everything on this phone finishes in 5 seconds or less on an iPhone SE 3 with the year-5 fixture, with the progress state shown after 1 second." (Numbers proposed; UNVERIFIED against `06-nfr.md`.) | BM | `sync`, `mobile` |
| G-15 | 04 copy | `accountDeletionCopy.erasePhone.*` keys "to add"; the Settings code already reserves an ERASE_ROW for #520 which carries its own copy. | "Read #520's diff. List which `erasePhone` keys the PR adds; this file then names only the keys #520 lacks." | NH | `content` |
| G-16 | 05 R2 and decision | R2: "reach a signed-in book in 3 attempts or fewer, with 0 messages to the founder." The default path: "a dedicated review mailbox on the founder's domain that he opens for Apple". Those two cannot both hold: Apple's reviewer needs the code, so the founder is in the loop. | "Reviewer path: [A] a mailbox the founder watches during review, accepted as a standing duty with a named window; or [B] a fixed demo sign-in approved by Apple ahead of time (2.1(a) asks for prior approval); the R2 check becomes 'Then a person who is not the founder reaches a signed-in book using only the Notes and one code the founder sends within 15 minutes.'" Founder picks A or B. | BS | founder, `product` |
| G-17 | 05 copy | `store.reviewNotes.servers` and siblings: `reviewNotes` is one string. | "Change `storeListing.reviewNotes` from a string to an object with four fields, update `scripts/release/store-config.ts` and its `--assert-shippable` test to read all four in the same PR." | BM | `content`, `ops` |
| G-18 | 05 R5 versus 03 R8 | "4 return 404 or site-only text" versus "3 pages return 404". | "Absent: `/support`, `/delete-account`, `/subscription-terms` (3). Present with out-of-date text: `/privacy` (1). `/terms`: [state which]." | NH | `product` |
| G-19 | 06 copy | New keys `listen.phoneFull.title/body/keep` collide with the existing `phoneFull` (mic cannot start). | "New group `listen.finishFailed.noSpace` with `title`, `body`, `keep`. `phoneFull` keeps its meaning." Content writes the words under the no-fear rule: say what is kept. | BM | `content` |
| G-20 | 06 R5 | "over 40 MB budget path" garbled; `sizeLine` and `waitingForWifi` already exist; "no choice offered" is correct but the new keys duplicate. | "Given a speech pack download of N MB on cellular, When the sheet shows, Then it shows `wordsCopy.pack.sizeLine`, offers Wait for Wi-Fi (existing) and Keep recording, and the parent can save 1 letter before the download ends. New key only: `wordsCopy.pack.recordNow`." Keep the app 40 MB budget in NX-05 only. | BM | `content`, `mobile` |
| G-21 | 06 R6 and R8 | "the picker needs one hand ... 10 of 10 manual tries" and "median 90 seconds or less" are HYPOTHESIS with no named person or device. | "Run on an iPhone SE 3, one-handed, by 5 people who are not on the team; 10 of 10 taps land on the intended date. Recorded in `docs/qa/evidence/`." Optional: split R8 into its own research task (`user-research`). | NH | `qa`, `user-research` |
| G-22 | 07 R6 | "20 simulated clients ... numbers belong to that file" while G4 is "1x the 1k peak targets" with a 20-family burst. | "R6 passes when the G4 run of `06-nfr.md` section 16 passes. This row states no client count." | BM | `product` |
| G-23 | 07 R7 | "a plain line that the recording is on the other phone" has no key and no state spec; `sync.audioElsewhere.line` is in the copy list but the screen (list row, Review, player) is not named. | "Shown in the letter row (subtitle) and in the player area where the play button would be; the play button is not drawn; VoiceOver reads the line. Design-systems draws it; test: 0 play buttons for a letter with no local audio." | BS | `design-systems`, `mobile` |
| G-24 | 08 R2 and R8 | R8: "relatives record for free in no case contradicts the Terms; claim registry has 1 row per promise." Untestable as written. | "Given the claim registry, When the claims test runs, Then every promise sentence in Terms, listing and in-app copy matches one registry row (0 unmatched), and the registry row for 'relatives record for free' cites the feature flag state." | BM | `content`, `product` |
| G-25 | 08 | R5 "8 of 8 answer yes" is a study, not a build check; no owner. The F10 default says "first 2 free", which reads as trial months. | Move R5 to a research task owned by `user-research`. In F10 write "first 2 letters free (D-083); trial 1 month monthly, 2 months yearly (D-082)." | NH | `product` |
| G-26 | 10 R3 and R5 | R3: numbers "are in BL-535 and BL-549", not here. R5 "Rule test exists" so it passes on old code. 08 rank 18 admits R5 passes. | R3: copy the BL-535 and BL-549 numbers into the row (back-off after 3 ignored, interval rule). R5: remove from this theme, or mark it a regression guard, not a requirement. The real failing test is R2 (no repeats across seasons). | BM | `product`, `qa` |
| G-27 | 09 R5 | "(assumed under 1 per hour at 1,000 families)" and "rate limit" with no number or source; 9b has no schema (`book_access` absent), no API contract. | Keep 9b out of the hand-out until an ADR exists (AD-2). For 9a add: "Given a third redeem attempt, the Edge Function returns the refusal code `[name]` defined in `packages/api`." | BS (9b) / NH (9a) | `principal-architect`, `product` |
| G-28 | 12 R3 and 08 rank 22 | R3 says "whether it shapes speech output is NOT VERIFIED"; 08 marks rank 22 "Ready: Yes" and cites the theme. | Product reads `packages/core` dictionary use and writes R3 as: "Given term X in the dictionary, When the engine proposes an edit whose result is X, Then the verifier treats it as a dictionary edit (existing EditType); test `[id]`." Until read, 08 rank 22 says "Ready: after R3 is read". | BS | `product`, `speech` |
| G-29 | 12 R6 | "`TRUSTED_SIGNING_KEYS` empty at the 27 Oct check; re-check." It has 2 keys. | "Keys present: `el-2026-11`, `el-2026-11-backup` (`packages/api/src/keys.ts`). Row becomes: a pack served from the manifest verifies on a phone (S-08, S-11); the signing key's custody is `security`'s." | NH | `product` |

### 5.2 Cross-cutting gaps (apply to every theme; fix once)

| Id | Gap | Detail | Fix text | Sev | Owner |
|---|---|---|---|---|---|
| G-30 | No test ids | Every row is "NX-0n-Rm (id: to be assigned)". CLAUDE.md and COORDINATION say titles that prove a requirement start `[ID]`. With no id, an engineer cannot name the test, and `scripts/trace.mjs` cannot link it. | Product assigns real F##-REQ ids (or BL ids from `next-id.mjs`) for the rows of the 8 themes that rank 1 to 14 hand out, before the first PR. Each check row gets a "Test:" cell: layer, file path, title. | BS | `product` |
| G-31 | No API contract line | No theme says what changes in `packages/api` (remote-config epoch exists; `forced_sign_out`, age acts, country refusal, deletion request, relative token, refusal codes). PRINCIPLES chapter 02 expects typed, versioned contracts. | Add a line per theme: "API: [type or route], version [n], additive, contract test in `packages/api/test/`." | BM | `product`, `principal-architect` |
| G-32 | No performance or size line | Only theme 5 (40 MB) and theme 1 (60 s) carry numbers. Sign-in, deletion, restore, picker and pull latencies are in `06-nfr.md`; the themes do not cite them. | Add a line per theme: "Budget: [06-nfr row and number], or 'no change'." | BM | `product` |
| G-33 | Accessibility only at AX5 on two rows | C7 scores 0 in six themes. COORDINATION requires Dynamic Type to AX5 for the Shown line. | Add per screen: "AX5: 0 clipped lines; VoiceOver reads [order]; tap targets 44 pt or more; Reduce Motion: no motion beyond fade." One device row each. | BM | `design-systems`, `content` |
| G-34 | Failure noticing and rollback | Only theme 1 mentions kill switches and only R6 tests one. No theme says how a bad rollout is detected (content-free) or reversed. | Add per theme: "Switch: [capability name]; off behaviour: [what the phone does]; noticed by: [log line code or Supabase metric]." | BM | `ops`, `product` |
| G-35 | New analytics events | `forced_sign_out`, `age_step_result`, `age_signal_result`, `phone_erase_result`, `phone_full_shown`, `download_choice`, `shared_voice_played`, `relative_hello_reviewed` are not in `catalog.ts` (checked). Analytics are off for the 1.0 line (D-124) and 08 F11 wants them on. | One sentence per event: "Add to `catalog.ts` and `docs/analytics/TRACKING_PLAN.md` in the same PR; property values are an enum; the allowlist test fails on any other key." | BM | `analytics`, `privacy` |
| G-36 | Data classification and retention | The "Records" lines are strong; no theme classifies what a new field is (PRINCIPLES Data chapter) or its retention. Examples: the age answer, the stop record in 03 R2, the reminder choice, the relative's first name in 11. | Add per stored thing: "Class: [per chapter 04]; read by: [role]; kept: [days]; removed with: [deletion step]." | BM | `data-steward`, `privacy` |
| G-37 | Migrations and grants | Themes 3, 4, 7, 9, 11 depend on #634, #636, #637 (drafts). No theme says which new tables or functions a theme itself needs, so "no schema change" is unstated. | Per theme: "Schema: none" or "New migration [name], additive, grants line in `supabase/tests/grants.mjs`, db test [file]." | BM | `data-architect` |
| G-38 | Reserved ids are only reservations | BL-729 to BL-738 exist only inside PR #638 (08 section 7 says so). Rows 12, 14, 21, 25 rely on them. | Do not start a row until its id is on `develop`; chief-of-staff checks `next-id.mjs` at hand-out. | BM | `product`, chief-of-staff |
| G-39 | Dependencies on drafts hidden in prose | Examples: 02 depends on #657, #632, #633, #617, #620, #658; 03 on #635 (851 lines); 01 on #655. A row's "Fails on old code because #632 is a draft" turns false the moment the draft merges. | Replace "because #NNN is a draft" with the behaviour: "the Keychain accessibility class is [X] today". | BM | `product` |
| G-40 | Four themes rely on a founder click with no date | F1, F2, F4, F7, F9 block ranks 1, 5 to 10 (08 section 1). 08 section 3 starts 8 rows "the day you confirm" but gives no date for the founder-hands setup. | Add to rank 11 a dated checklist from `ops` (Fri 13 Nov for the internal group, per the index). | NH | `ops` |

## 6. Hidden dependencies, in one place

1. Theme 2 R1 (real Apple sign-in on 3 phones) needs theme 1 R2 (hosted project) and the Apple key, Resend SMTP and DMARC (rank 11). 08 puts rank 6 before the founder-hands rank 11.
2. Theme 3 needs theme 1's consent chain (#634, #636, #637) and the split of #635 (G-13) before any screen work.
3. Theme 4 R1 needs the purge worker deployed (theme 1) and the BL-729 feedback table hook, which is unverified (theme 4 "Not verified").
4. Theme 5 R2 needs the reviewer path (G-16), which in turn needs theme 2's email sender to be live.
5. Theme 6 R2 needs words from `content` before the screen (G-19); R3 needs a pick between #615 and #618.
6. Theme 7 R7 needs a design for the "audio elsewhere" state (G-23).
7. Theme 8 R3 needs App Store Connect products (founder) and a production-profile build.
8. Theme 10 R1 to R4 need an iPhone SE 3 and a person; no agent can close them.
9. Theme 12 R2 needs the FB-02 harness and native reviewers; none exist.
10. Every theme needs ids (G-30) and the five cross-cutting lines (G-31 to G-37).

## 7. Untestable or fuzzy statements (quoted)

- 01 R6: "makes 0 sync uploads from that moment" - needs a definition of "from that moment" (the refresh time plus a tolerance in seconds).
- 03 R1: "'Continue' is disabled until both are answered" - the agreement box is a different act from the age answer (RR-2: one behaviour per id). Split.
- 04 R4: "When this phone next refreshes" - which refresh (config, sync pull, foreground)? Name it.
- 05 R3: "count in Notes equals count of off switches in the profile" - define where the count is read (EAS profile or `capabilities.ts`) so a script can do it.
- 06 R5: "the parent can record 1 letter before the download ends" - the download can end in seconds on Wi-Fi. State the cellular case with a throttle.
- 08 R8 (G-24), 10 R3 (G-26), 12 R5 "marked, not dropped" (what is "marked": a visual style key?), 9 R3 "shows 'coming soon'" (key).
- Tags: nine rows are HYPOTHESIS with "Given" clauses that need people (06 R6, R8; 08 R5; 11 R5). Treat them as research tasks (owner `user-research`), not build rows.

## 8. Verdict per theme

| Theme | Verdict | What must happen first |
|---|---|---|
| 01 Hosted backend | Ready after named fixes | G-01, G-03, G-04, G-05, and founder F1, F2, F4 |
| 02 Sign-in and session | Ready after named fixes | G-06, G-08, G-09; security PRs can start now |
| 03 Age, consent, region | Not ready | G-10 to G-13; counsel on Q46 and Q57 |
| 04 Delete account, erase phone | Ready after named fixes | G-14, G-15; needs theme 1 for the drill |
| 05 Reviewer sign-in, store pack | Not ready | G-16 (founder decision), G-17, G-18 |
| 06 Recording that behaves | Ready after named fixes | G-19, G-20; R2 to R4 can start the day #615 or #618 is picked |
| 07 Letters on every phone | Ready after named fixes | G-22, G-23; founder's two phones |
| 08 Plus and billing trust | Ready after named fixes | G-24, G-25; BL-736 can start now |
| 09 Co-parent, shared voice | 9a ready after fixes; 9b not ready | G-27; ADR AD-2 before 9b |
| 10 Reminders | Ready after named fixes | G-26 |
| 11 Relative adds a hello | Not ready (by design, after release) | ADR AD-1, security threat model, counsel memo |
| 12 Names and languages | Languages not ready; names part ready after fixes | G-28, G-29; FB-02 harness |

## 9. Prioritised fix list and effort

Effort is the writing and reading time for the authors, not engineering time. Estimates, not measurements.

1. **G-30** assign ids and add a Test cell to each check row, themes 1, 2, 4, 6, 8, 10 first. `product`, about 3 hours.
2. **G-03** reconcile F02-REQ-024 with BL-564 (`/health-privacy`). `product` with `legal`, 1 hour plus a counsel question.
3. **G-16** founder picks the reviewer path (A or B). 15 minutes of his time; `product` rewrites R2, 30 minutes.
4. **G-10, G-12, G-13** theme 3: read the existing age gate, pick the country source, define the #635 split. `product` and `security-architect`, about 4 hours; blocks rank 7.
5. **G-01, G-05, G-04** theme 1 numbers and the smoke sign-in method. `product` and `ops`, about 2 hours.
6. **G-19, G-20, G-11, G-17** copy namespace corrections. `content`, about 2 hours.
7. **G-28, G-26, G-22, G-24** contradictions and untestable rows in themes 7, 8, 10, 12. `product`, about 2 hours.
8. **G-31 to G-37** the seven cross-cutting lines, written once as a template in `03-requirements/00-index.md` and filled per theme as each is handed out. `product` with `principal-architect`, `data-steward`, about 6 hours in total.
9. **G-06, G-07, G-08, G-09, G-14, G-15, G-18, G-21, G-23, G-25, G-27, G-29, G-38 to G-40** the rest, 30 minutes each at most.

Rows with no requirement (08 ranks 15, 16, 17, 24, 27) need a requirement written before any estimate means anything: about 2 hours each for 15 to 17.

Total author effort to bring themes 1, 2, 4, 6, 8, 10 to "ready to hand out": about 14 to 18 hours of writing across `product`, `content`, `ops`; themes 3 and 5 add the founder decision and a counsel answer. UNVERIFIED: counsel turnaround.

## 10. Not verified (this file)

PR bodies and diffs for every PR cited; whether the 8 functions have a health route; the Auth admin sign-in method; the state of `age-gate.ts` (preselection); `accountDeletionCopy` key list in full; ADR 0025 text; the gap map's own claims; PRINCIPLES chapters beyond their titles; the roster handle `support`. The banned-character scan covers this file only.
