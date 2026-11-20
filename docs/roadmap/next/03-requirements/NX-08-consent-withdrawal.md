# Theme 8: Turn off sync and sharing yourself, and it holds on the server

Readiness: 21 of 28. Author's score, `qa` to confirm. Remains: counsel's read of the withdrawal mode and of every word in the sheet (B-1, B-2); the migration needs the founder's apply through `deploy-db.yml` (D-117). Rows R1 to R14 are finished and can start once B-1 is answered with the default; R15 is held.

### Blocked on (exact question, recommended default)

| # | Question | Who answers | Recommended default | Rows it holds |
|---|---|---|---|---|
| B-1 | OQ-L1 (F17 Q4): after a withdrawal, must letters already synced be erased within 15 days, or is stop plus an offer to delete enough? | Counsel | Offer. Stop syncing is the only button at first; the delete button and `p_delete` wait for the answer. Needed before any friend outside the family signs in (D-128). | R15 (and whether R2 gains a second button) |
| B-2 | May the line "Letters already synced stay on our server, and in {child}'s book for {coParent}, until you delete them or your account" go out as written, and is `settings.privacy.sensitiveHelp` registered text? | Counsel (words); `content` shortens button labels to the 22-character rule | Use the F17 6.2 B step 3 wording. Treat `settings.privacy.sensitive*` as counsel-registered until counsel says it is not. | R2, R11 |

| | |
|---|---|
| Working label | NX-08 (working id, see `_CONVENTIONS.md`); backlog rank 8 in `../08-ranked-backlog.md` |
| Refines | LEGAL-REQ-006, LEGAL-REQ-008 (P0), F17-REQ-002, F17-REQ-016, F17-REQ-030, WP-F17-03, WP-F17-10, PRIV-R09, PRIV-R21, D-128, BL-485 option (a) |
| Tag | EVIDENCE: D-128 says the control and its function come before any friend outside the family. HYPOTHESIS: none |
| Size | S to M |
| Gate | Counsel for the words and the mode (B-1, B-2). Apple 5.1.1 (consent and its withdrawal; the sub-clause was not re-read this session, UNVERIFIED). Founder applies the migration. Before any friend outside the family signs in |
| Order | 8 (Tier 0) |

## What the parent will see and do

Asha's parent opens Settings, then Privacy. The row "Sync and family sharing" says On and has an arrow. They tap it. A short sheet offers their export first, says what stops (new letters stop syncing, nothing new reaches the other parent) and what stays (letters already synced stay on our servers until they delete them or the account). They tap Stop syncing. The row now says Off, kept on this phone. Their phone keeps working, every letter is still there, and they can export or delete at any time. If they change their mind, Settings, Account, Agree and sync turns it back on.

## The check

Today (tree at `7a355739`, searched 8 Nov): `apps/mobile/src/lib/auth/sensitive-row.ts` registers `read` and `subscribe` only, so `privacy.tsx` draws the row with no chevron and no `onPress`; `recordConsent` in `apps/mobile/src/lib/auth/consent.ts` sends `accept` or `decline` and never `withdraw`; no migration or TypeScript file contains `withdraw_sensitive_data` or `sensitive_withdrawal_mode`. What already works: a `withdraw` recorded by SQL makes the server raise SCCON on content writes and pauses the outbox (`apps/mobile/test/sync-e2e.test.ts`, the `[LEGAL-REQ-006, -009]` test). None of this was run on a phone (UNVERIFIED).

| Label | Tag | Given, When, Then | Fails on old code because | Source |
|---|---|---|---|---|
| NX-08-R1 | EVIDENCE | Given a signed-in Asha account with the row On, When the parent taps "Sync and family sharing" on Settings > Privacy, Then the withdrawal sheet opens in 1 tap and the row shows a chevron. Given the row Off, "Not signed in" or "Waiting for a connection", Then the row opens nothing (0 sheets) and, for Off, offers Agree and sync's route instead (R13). | No source registers `open` (`sensitive-row.ts` registers `read` and `subscribe`), so `trailing` is none and a tap does nothing (`privacy.tsx`, the sync row). | LEGAL-REQ-008; BL-485 |
| NX-08-R2 | EVIDENCE | Given the sheet is open, Then it shows in this order: Export your book (links to the existing Export screen), what stops, what stays, "Stop syncing", Cancel; 5 items, 0 clipped lines at AX5; Cancel and a swipe down change nothing and record 0 acts. There is no delete button until B-1 is answered (R15). | No sheet exists (`settings.privacy.sensitiveOff.*` is absent from `packages/content`, searched 8 Nov). | F17 6.2 B step 3; F17-REQ-030 |
| NX-08-R3 | EVIDENCE | Given Asha's parent taps Stop syncing online, When the new function `withdraw_sensitive_data` returns, Then exactly 1 new `policy_acceptances` row exists for document `sensitive-data`, action `withdraw`, method `settings_toggle`, surface `settings.privacy`, with the version the person last accepted, the PRIV-R21 fields filled (4 of 4 of build number, OS major, language, hash of the sheet words once #634 lands) and `context` of at most `{"mode":"stop"}`. 0 letter text, child name or count in the row. | The function does not exist. | LEGAL-REQ-006; PRIV-R21; D-128 |
| NX-08-R4 | EVIDENCE | Given a recorded withdrawal, When the same account pushes a new letter, Then the server raises SCCON, stores 0 rows of it and keeps its queue entry; a delete of a letter still applies; `sync_pull` and Export still answer. | Not provable from the app: no screen records the act. The SQL half passes today (`sync-e2e.test.ts`); this row adds the function path and the "pull and export still work" check (PRIV-R09). | LEGAL-REQ-006, -009 |
| NX-08-R5 | EVIDENCE | Given a recorded withdrawal and 3 letters waiting, When the next sync pass runs, Then it sends 0 content ops, the phase is `paused_consent`, the 3 letters stay `pending` on the phone, and the pass finishes within 1 sync cycle of the answer. 0 letters dropped or edited. | No screen produces a withdrawal on a phone. | LEGAL-REQ-006 second bullet |
| NX-08-R6 | EVIDENCE | Given airplane mode and a parent who taps Stop syncing, Then within 1 second the phone holds all uploads (a local hold named apart from `sync.pausedFor`), the sheet says the servers will be told when the phone is back online, and the act waits with its phone time. When the phone reconnects, Then the withdrawal is sent before any other op and the hold is cleared only after the server answers. A sync pass with an empty queue does not clear the hold. | No local hold exists. The only pause, `sync.pausedFor`, is cleared by a pass with an empty queue (`apps/mobile/src/lib/sync/engine.ts` near line 224, code reading, UNVERIFIED), so reusing it would let a later letter upload before the server heard. | A-REQ-033; F02-REQ-014 |
| NX-08-R7 | EVIDENCE | Given the answer to Stop syncing is lost (server applied it, phone saw a timeout), When the phone retries after 1, 5 and 30 seconds, Then the retries carry the same idempotency key, and the server holds exactly 1 withdraw row for the intent. | `recordConsent` calls `idempotencyKey()` fresh on every call (`consent.ts` near line 110), so a retry would write a second row. | `record_policy_act` idempotency (`20261005000000_family_cap_language_idempotency.sql`) |
| NX-08-R8 | EVIDENCE | Given Asha's parent has two phones and withdraws on phone A, When phone B comes to the foreground online, Then within 1 gate read (10 second timeout, as for launch) B's row reads "Off, kept on this phone", B's new letters wait and 0 are lost; B offline keeps its queue and meets SCCON on its first push after reconnecting. | No withdrawal can be made, so the two-phone case has never run. The gate recheck on foreground exists (`machine.logic.ts`, `GATE_LOADED` in `ready`). | machine.logic.ts; S1-22 |
| NX-08-R9 | EVIDENCE | Given a withdrawal already recorded, When a second phone (or a retry with a new key) calls the function again, Then it returns the existing act's id and adds 0 rows; the latest act decides by server time (`accepted_at`), never by the phone's `client_recorded_at`. | The function does not exist. | PRIV-R21; append-only record |
| NX-08-R10 | EVIDENCE | Given a withdrawal, Then no new invite can be sent or accepted by this account (SCCON), 0 existing co-parent reads are removed by the act itself, and the sheet's "what stays" line names the co-parent only when the book has one. | `accept_child_invite` and invite sends call `require_content_consent()` already (`20261015020000_v1_gate_coparent_invites_undo.sql`); what a withdrawn parent's already-synced letters do for the co-parent on pull is not tested (UNVERIFIED). | F11; D-050 |
| NX-08-R11 | EVIDENCE | Given each state, Then the row and its footer say only what is true: On, "Off, kept on this phone", "Waiting for a connection", "Not signed in"; while a withdrawal waits to reach the server the row says Off, kept on this phone and the sheet says the servers are not told yet. 0 states say "recorded" before the server answered. | The footer `settings.privacy.sensitiveHelp` was reworded in this tree to "This row shows whether syncing is on." (`packages/content/src/strings.en.ts`); once the row is pressable it undersells the control. The device plan row S1-27 (k) still quotes the older footer (UNVERIFIED which is current on a phone). | LEGAL-REQ-044 claims; D-128 Pairs with a counsel note |
| NX-08-R12 | EVIDENCE | Given Asha canaries (the name Asha, a letter sentence, an email, a token), When a withdrawal runs on any path (success, offline, retry, failure), Then 0 canaries appear in the policy row, logs, the analytics queue, crash breadcrumbs or the request URL; the only event is `settings_changed` with `key: sensitive_data` and only after an analytics opt-in. | No path exists to test. | LEGAL-REQ-014; PRIV-R10 |
| NX-08-R13 | EVIDENCE (guard) | Given a withdrawn account, When the parent taps Account > Agree and sync and agrees, Then 1 `accept` row is recorded, the row reads On, and the letters held on the phone upload with 0 lost. Export and delete worked throughout. | PASSES in part today: Account offers "Agree and sync" to a person who declined (`account.tsx`), and the resume is tested in `sync-e2e.test.ts`. Whether Account offers it after a `withdraw` (not only a decline) is UNVERIFIED. | PRIV-R09 |
| NX-08-R14 | EVIDENCE | Given VoiceOver and AX5 on an iPhone SE 3 and a 6.1-inch phone, Then the row reads "Sync and family sharing, On, button", focus moves to the sheet title, the escape gesture closes it, Stop syncing and Cancel are 44 pt or more and the same width, and Reduce Motion removes all motion but a fade. | Device row; no sheet to run it on. | V-06, V-10 in the device plan |
| NX-08-R15 | HELD (B-1) | Given counsel answers that deletion is offered (or required), When the parent picks the delete button, Then `withdraw_sensitive_data(p_delete := true)` records the same withdraw act with `mode: stop_delete`, tombstones the person's own synced letters with `deleted_reason = 'consent_withdrawn'`, removes 0 local rows, and a count of the tombstoned letters is shown only on the phone. Until then `p_delete := true` raises `feature_not_enabled`. | `withdraw_sensitive_data` is in no migration (BL-485 point 3; searched 8 Nov). Whether `deleted_reason` takes a new value without a check change is UNVERIFIED. | F17-REQ-016; TDD 05 X-08 |

## Door lines

**Shown:** the sheet by `packages/content` key (below), the row's existing value words, and the versioned Privacy Policy link from the Privacy screen (`brand.web.privacy`). The "what stays" line is counsel-registered text once approved (B-2).
**Records:** one `withdraw` act on `sensitive-data` through the function, following PRIV-R21: document, version (the one last accepted), action, method `settings_toggle`, surface `settings.privacy`, server and phone times, app version and build number, OS major version, platform, text language, the hash of the sheet words shown, and context from the server allowlist (`mode` only). The server fills the version and the mode; the phone cannot name them. Retention follows PRIV-R21: the account's life, then pseudonymised for 3 years, and findable from a deletion request (BL-578).
**Never:** a letter, a count of letters, a child's name, a reason as a condition (PRIV-R02, PRIV-R10, PRIV-R21 never-list); an IP address or user agent in the row; a guilt or loss line on the sheet; a second confirm after Stop syncing; withdrawal that blocks export or deletion (PRIV-R09).
**Decline and withdraw:** Cancel records nothing and leaves sync on. Stop syncing is the withdrawal. Agree and sync later records a fresh `accept`. Export, Recently deleted and Delete account work before, during and after.

## Edge cases

- Withdraw while a letter is uploading: the in-flight op finishes or is rolled back by the server as today; the rest wait (SCCON).
- Withdraw with no letters synced yet: same act, same row.
- Withdraw while a deletion request for the account is open: allowed; the act is kept and findable (BL-578); the open request is not changed.
- A newer version of the sensitive-data text has been published: the act is recorded against the version the person last accepted (R3), so it never fails with "unknown version".
- Rate ceiling (60 acts an hour, 200 a day, `SCRAT`): the sheet says to try again later and keeps the hold on the phone.
- Server answers 5xx or a timeout of 10 seconds: treated as offline (R6), never as "not withdrawn".

## Offline behaviour

R6. The hold is on the phone first; the server is told when the phone can. The phone never says "recorded" before the answer (R11). The phone time is sent as `client_recorded_at`; the server's time decides order (R9).

## What we never do

Weaken or skip the consent gate to make withdrawal quicker. Delete a letter on the phone because consent was withdrawn. Ask why. Make Stop syncing the small button. Treat a failed call as a successful withdrawal. Gender the child; copy uses {child}. Imply a machine writes the family's words.

## Copy needs (packages/content)

| Key | Status | Counsel |
|---|---|---|
| `settings.privacy.sensitiveLabel`, `sensitiveOn`, `sensitiveOff`, `sensitiveSignedOut` | exists | Registered text: assume yes (B-2) |
| `settings.privacy.sensitiveHelp` | exists, reworded in this tree; changes again with R11 | Yes: names the health category |
| `authCopy.account.sync.unknown` ("Waiting for a connection") | exists | no |
| `sensitiveConsent.agreeButton` (turn it back on) | exists | registered (HN-4) |
| `settings.privacy.sensitiveOff.title`, `.exportFirst`, `.stops`, `.stays`, `.stopButton`, `.cancel` | new | `.stops`, `.stays` yes; the rest content's call |
| `settings.privacy.sensitiveOff.pending` (servers not told yet), `.done`, `.failed`, `.tryLater` | new | `.pending` yes |
| `settings.privacy.sensitiveOff.deleteButton` | new, held with R15; the F17 label is 41 characters against the 22-character button rule (`packages/content/test/rules.test.ts`), so `content` shortens it | yes |

Words by `content`. A registered string changes only with counsel and a disclosures version bump in the same PR (`docs/reviews/2026-10-31/COUNSEL_LOCKED.md`).

## Analytics events (opt-in, content-free, names only)

`settings_changed` with `key: sensitive_data`: in catalog (`packages/analytics/src/catalog.ts`, `key` already lists `sensitive_data`, checked 8 Nov). No new event. Nothing is sent before an opt-in and nothing in 1.0 (D-124). The value (on or off) is never a property, as the catalog states. Withdrawing sensitive-data does not change the analytics choice, which is its own consent.

## Device rows

New: "withdraw on a phone, then read the row, Account and Export" (proposed S1-27 (l)); "two phones: withdraw on A, B reads Off and keeps its queue" (beside S1-22 and S1-28); "airplane mode withdrawal and reconnect"; "AX5 and VoiceOver on the sheet" (R14). S1-27 (k) is updated by `qa` once the row is pressable.

## Dependencies

#634 (the PRIV-R21 fields on the server row; R3's "4 of 4" waits on it), #636 and #637 (the consent rows stay findable and append-only), theme 1 (a hosted project for the two-phone run), theme 3 (the agreement row is a separate act). `data-architect` writes the function; `mobile` the sheet and the hold; `security-architect` reads both.

## Engineering block

| Line | This theme |
|---|---|
| API contract (`packages/api`) | New RPC `withdraw_sensitive_data(p_delete boolean default false, p_app_version text, p_platform text, p_locale text, p_client_recorded_at timestamptz, p_rendered_sha256 bytea)` returning the act id; carries the `Idempotency-Key` header. Request and error types in `packages/api/src/server/`, version 1, additive, contract test in `packages/api/test/server-contracts.test.ts`. Error codes: `SCRAT`, `28000`, `SCANO` (anonymous), `feature_not_enabled` (R15). Fields beyond these follow #634. |
| Budget (`06-nfr.md`) | Function p95 300 ms (proposed; row not checked, UNVERIFIED). Tap to hold in place: 1 second offline or online (proposed). Gate recheck: as launch, 10 second timeout. |
| Accessibility | R14. |
| Switch, off behaviour, noticed by | Row exists only where `capabilities.sync` is on (the `preview` profile today; `production` has sync off, UNVERIFIED for build 12). Registering `open` is the switch: rollback is removing that one registration, which returns the row to read-only; the server function stays and is harmless unused. Noticed by: the device rows and the db test in CI. |
| Data class and retention | Act row: L2 content-free, plus `profile_id` L3, pseudonymised at deletion and kept 3 years (PRIV-R21). Local hold and its idempotency key: L2, device only, removed when the server answers or on Erase. No new analytics data. |
| Schema and grants | One additive migration (name and timestamp chosen by `data-architect` after #634 to #637 settle; later than `20261028010000`). `security definer`, `set search_path = public, pg_catalog`, starts with `require_user()`, refuses anonymous sessions, uses `idempotency_claim` and the same 60 and 200 ceilings as `record_policy_act`, `revoke ... from public, anon`, `grant execute ... to authenticated`, in its own migration. `grants.mjs` lists tables and service-role functions only; the authenticated function is added where `access_matrix.test.mjs` lists RPCs (the `withdraw_family_letter` row is the model) and `explicit_grants.test.mjs` is re-run (UNVERIFIED which of these holds the authenticated list). Applied by the founder through `deploy-db.yml` after two independent reviews and green CI (D-117). |
| Analytics events | `settings_changed` only: in catalog. |

## Trace and tests

Id convention: `_CONVENTIONS.md`. Paths marked "proposed" do not exist yet; the PR that adds the test names the real path.

| Id | Refines | Test (layer, file, title) | Device or ops row |
|---|---|---|---|
| NX-08-R1 | LEGAL-REQ-008 | mobile unit (proposed `apps/mobile/test/privacy-withdraw.test.ts`); `[NX-08-R1] a signed-in On row opens the sheet in 1 tap, other states open nothing` | S1-27 (l) |
| NX-08-R2 | F17-REQ-030 | same file; `[NX-08-R2] the sheet lists export, stops, stays, Stop syncing, Cancel in that order and Cancel records nothing` | S1-27 (l) |
| NX-08-R3 | LEGAL-REQ-006; PRIV-R21 | db test (proposed `supabase/tests/withdraw_sensitive_data.test.mjs`); `[NX-08-R3] one withdraw row with the accepted version, settings_toggle and a content-free context` | none |
| NX-08-R4 | LEGAL-REQ-006, -009 | same db file; `[NX-08-R4] after withdrawal a content write raises SCCON, a delete applies, pull and export answer` | none |
| NX-08-R5 | LEGAL-REQ-006 | `apps/mobile/test/sync-e2e.test.ts`; `[NX-08-R5] after withdrawal the next pass sends 0 content ops and keeps 3 letters pending` | two-phone row |
| NX-08-R6 | A-REQ-033; F02-REQ-014 | `apps/mobile/test/privacy-withdraw.test.ts` plus the sync-e2e harness; `[NX-08-R6] offline Stop syncing holds uploads at once and an empty pass does not clear the hold` | airplane-mode row |
| NX-08-R7 | idempotency | same file; `[NX-08-R7] three retries after a lost answer reuse one key and leave 1 row` | none |
| NX-08-R8 | machine.logic.ts | `apps/mobile/test/sync-e2e.test.ts` (two phones on the embedded database); `[NX-08-R8] phone B reads Off after phone A withdraws and loses 0 letters` | two-phone row |
| NX-08-R9 | PRIV-R21 | db test file above; `[NX-08-R9] a second withdraw adds 0 rows and server time decides order` | none |
| NX-08-R10 | F11; D-050 | db test file above; `[NX-08-R10] a withdrawn account cannot send or accept an invite and a co-parent keeps synced letters` | two-phone row |
| NX-08-R11 | LEGAL-REQ-044 | `apps/mobile/test/privacy-page.test.ts` (exists; add the bracket to a new case); `[NX-08-R11] each state and a waiting withdrawal read only what is true` | S1-27 (k), (l) |
| NX-08-R12 | LEGAL-REQ-014; PRIV-R10 | canary test beside `packages/analytics/test/analytics.test.ts`; `[NX-08-R12] Asha canaries appear in 0 places on every withdrawal path` | none |
| NX-08-R13 | PRIV-R09 | `apps/mobile/test/sync-e2e.test.ts`; `[NX-08-R13] Agree and sync after a withdrawal records accept and the held letters upload` | S1-27 (g) |
| NX-08-R14 | V-06, V-10 | none (device) | AX5 and VoiceOver row |
| NX-08-R15 | F17-REQ-016 | HELD (B-1); db test file above; `[NX-08-R15] p_delete tombstones own letters with consent_withdrawn and refuses until enabled` | none |

Trace: NX-08-R1..R15 -> LEGAL-REQ-006, LEGAL-REQ-008, F17-REQ-002, F17-REQ-016, F17-REQ-030, WP-F17-03, WP-F17-10, PRIV-R09, PRIV-R21, D-128.

## Rollout, rollback, owner lane

- Order of PRs, each under 400 added lines: (1) the migration and its db tests with the grants, `data-architect`, founder applies; (2) the local hold, the retry key and the function call in `lib/auth/consent.ts`, `mobile` and `sync`; (3) the sheet, the row's `open` and the copy, `mobile` and `content`, after counsel's read of B-2; (4) device rows, `qa`.
- Rollback: unregister `open` (one line); the function and rows stay, as the record is append-only.
- Reviewers: `privacy` (Records and Never lines, canaries), `security-architect` (the function and the hold), `qa` (device rows). Counsel for the words; the founder merges anything in `docs/legal`.
- Gate: counsel answers B-1 and B-2 before the copy PR merges; the whole theme lands before any friend outside the family signs in (D-128).

## Founder-only decisions

| Decision | Recommended default |
|---|---|
| OQ-L1 (B-1): offer or enforce deletion after withdrawal | Offer; ship Stop syncing alone first |
| Whether the delete button is on the sheet at the first friends build | No, until counsel answers |
| Apply the migration | Yes, after two reviews and green CI (D-117) |

## Not verified

Nothing here was run on a phone. Not read to the end: the engine's pause-clearing path (R6), `sync_pull` for a withdrawn account and the pending-invite case (R10), whether Account offers Agree and sync after a `withdraw` (R13), whether `entries.deleted_reason` accepts a new value (R15), the PRIV-R21 fields #634 adds, which test file lists authenticated RPC grants, `06-nfr.md` rows for the budgets, the Apple 5.1.1 sub-clause, and whether `production` has sync on for build 12.
