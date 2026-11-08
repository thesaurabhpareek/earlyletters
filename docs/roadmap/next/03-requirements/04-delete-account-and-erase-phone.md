# Theme 4: Deleting my account, and erasing this phone

Readiness: 26 of 28 (audit 8 Nov: 18). Author's re-score, `qa` to confirm. Remains: the CCO line on #520 (founder, C14); the drill needs theme 1's hosted project; the proposed time budgets in R1 and R5 are targets, not data.

| | |
|---|---|
| Working label | NX-04 (working id, see `_CONVENTIONS.md`) |
| Refines | F02-REQ-004, -007, -022; F17 deletion rows; DATA-REQ-023, DATA-REQ-024; BL-330; BL-640 (#520) |
| Tag | EVIDENCE (`BUILD12-GAP-MAP-2026-11-08.md` 1.7, section 5; `05-compliance-risk.md` gate G-E) |
| Size | M (gap map rank 4). Feasibility item 25 (web deletion) is L and is not needed for this theme |
| Gate | Apple 5.1.1(v) (in-app deletion for any app with account creation). Founder (CCO line on #520). Counsel for the published deletion sentence |
| Order | 4 of 12. The `production` profile already writes account deletion `on`, so this must be proven before build 12 ships |

## What the parent will see and do

In Settings, Delete my account. The screen says plainly what goes, what stays on the phone, and offers one export first. They confirm. The app tells them the date their account will be gone. If they change their mind within the wait, they can stop it. Separately, Erase everything on this phone removes the local book after one clear confirm.

## The check

| Label | Tag | Given, When, Then | Fails on old code because | Source |
|---|---|---|---|---|
| NX-04-R1 | EVIDENCE | Given a sole-parent account with 5 letters synced, When deletion is confirmed and the purge worker runs on the throwaway project, Then at day 30 0 rows hold the profile id in any table for the Asha fixture, and the Storage listing for the account is empty; the purge run for that one account finishes in 60 seconds or less (proposed; `06-nfr.md` budgets the worker in batches under 1 s per transaction, not per account). | The purge worker (`supabase/functions/purge-worker`) has never run on a hosted project (setup S-54 not done); drills S1-35 and S2-13 never run. | Gap map 1.7; DATA-REQ-023 |
| NX-04-R2 | EVIDENCE | Given a Sign in with Apple account, When deletion is confirmed, Then the Apple refresh token is revoked and the function returns 204 with no token in the body. | `apple-token` exists with no hosted secrets. | F02-REQ-004 |
| NX-04-R3 | EVIDENCE | Given the web address `/delete-account`, Then it answers 200 and tells a person how to delete in the app and how to ask for help if they cannot sign in. | The page is absent: `apps/web/src/app/(legal)` holds `privacy` and `terms` only (searched 8 Nov), while `packages/brand/index.ts` lines 55 to 56 name `/delete-account`. | Gap map 1.11 |
| NX-04-R4 | EVIDENCE | Given an account deleted on another phone, When this phone next comes to the foreground and pulls (`sync_pull`; if that is not the signal that reveals the deletion, `mobile` names the real call in the PR), Then the app offers 1 export, then clears database, audio, Keychain and analytics id. | Not run across two phones. | F02-REQ-007 |
| NX-04-R5 | EVIDENCE | Given Erase everything on this phone (a row shown on a phone that is signed out, as #520 builds it; a signed-in person signs out first or deletes the account), When confirmed, Then the local database, audio files and Keychain items are 0 bytes, an export is offered first, no request is sent, and the progress state shows after 1 second; the erase finishes in 5 seconds or less on an iPhone SE 3 with the year-5 fixture (proposed target, not in `06-nfr.md`). | The row does not exist: `settings/privacy.tsx:36` and `settings/where-letters-live.tsx:27, 89` carry comments that it joins once #520 merges. | #520; DATA-REQ-024 |
| NX-04-R6 | EVIDENCE | Given a co-parent in the book, When the other parent deletes their own account, Then the co-parent keeps their own letters, the deleting parent's letters follow the deletion rule, and the screen says which before the confirm. | Two-account case never run (S1-22, S1-28). | F11; RR-5 |
| NX-04-R7 | HYPOTHESIS | Given the deletion screen at AX5 and VoiceOver, Then 0 clipped lines and the confirm button is reachable in 3 swipes or fewer. | No device row exists for the deletion screen at AX5. | New row |

**Shown:** `accountDeletionCopy.what`, `.exportFirst`, `.subscription`, `.confirm`, `.scheduled`, `.signedOut`, `.open`, `.errors` (exist in `packages/content/src/features/account-deletion.en.ts`). The published deletion sentence is pending counsel.
**Records:** a deletion request act with the PRIV-R21 fields, kept in the pseudonymised consent record that BL-578 makes findable.
**Never:** keep letter text, audio or a child's name after the purge; keep the Apple token; ask a reason as a condition; guilt or loss wording in the screen.
**Decline and withdraw:** Cancel at any point before the date; export always works first; the phone keeps its local book unless they chose Erase.

## Edge cases

- An active subscription: the screen says deletion does not cancel it and points to Apple's manage sheet (existing `.subscription` key).
- A legal hold or restore request: the worker follows `docs/legal/DELETION_AND_EXPORT_SPEC.md`.
- A feedback report linked to the account goes at the earlier of the purge or 90 days (readiness file section 6).
- Kill-switch off at the moment of deletion: the request queues on the phone and sends when allowed (RR-5).

## Offline behaviour

The request is written on the phone and shows "waiting to send"; it sends when online; the screen never claims the account is gone before the server says so.

## What we never do

Delete a person's local letters without a confirm. Hide the delete route behind support. Rewrite any words in an export.

## Copy needs (packages/content)

Keys to add in `accountDeletionCopy` (`features/account-deletion.en.ts`; existing groups checked 8 Nov: title, what, exportFirst, subscription, continueButton, confirm, scheduled, executing, signedOut, open, notConfigured, errors): `pending.offline` (new), `coParent.keepsOwn` (new). Erase-the-phone words are NOT added here: #520 already carries its own (`erase.rowLabel`, `title`, `heading`, `body`, `freeLetters` and the confirm, busy and failed strings) in `packages/content/src/strings.en.ts`, from `proposals/account-security/content.md` 4.11; this file names none of them, and any key #520 lacks is added by that PR. Words by `content`; counsel for the deletion sentence.

## Analytics events (opt-in, content-free, names only)

Existing: `account_deletion` (step property only). New: `phone_erase_result` (property: done or cancelled): not in `packages/analytics/src/catalog.ts` (checked 8 Nov), so add to the catalog and `TRACKING_PLAN.md` first. #520 also edits `apps/mobile/src/lib/analytics/index.ts` (11 lines); read that diff before adding the event (UNVERIFIED). Nothing is sent in 1.0 (D-124), and a phone that erased itself must not send an event after the erase.

## Device rows

S1-35, S2-13, AL-07.6a, DL-05 (erase). New: "AX5 and VoiceOver on deletion".

## Dependencies

Theme 1 (hosted project, purge worker and cron secrets), theme 2 (a signed-in account), #636. Web page needs the counsel text (theme 5 lists the page set).

## Founder-only decisions

| Decision | Recommended default |
|---|---|
| CCO line on #520 | Give it; PRD keeps it in v1.0 |
| Whether the deletion row ships if the drill has not passed | No; do not ship the row until S1-35 passes on the throwaway project (gap map section 5) |

## Engineering block (cross-cutting, added 8 Nov 2026 after the readiness audit, G-31 to G-37)

| Line | This theme |
|---|---|
| API contract (`packages/api`) | Deletion request: the RPC `request_account_deletion(p_source, p_had_active_subscription)` and the `deletion_requests` read already exist (`apps/mobile/src/lib/account-deletion/api.ts`). Its typed contract should sit in `packages/api/src/server/` with a contract test; if it does not yet, that PR adds it, additive, version 1. The Apple revoke function `apple-token` answers 204 (R2). Erase-the-phone: none (no request). |
| Budget (`06-nfr.md`) | Edge Function light p95 600 ms for `apple-token`. Purge worker: batches under 1 s each (watermark row). New targets in R1 and R5 (60 s per sole-parent account; 5 s phone erase) are proposed here, not in `06-nfr.md`; add them there in the same PR as the first test that measures them. |
| Accessibility | Deletion screen and the erase screen: AX5 with 0 clipped lines; VoiceOver reads what goes, what stays on the phone, the export offer, then the confirm; the confirm button reachable in 3 swipes or fewer; tap targets 44 pt or more; destructive rows are not colour-only (a word and an icon); Reduce Motion: fade only. Device row "AX5 and VoiceOver on deletion" (R7). |
| Switch, off behaviour, noticed by | Switch: account deletion `on` in the production profile; the server-features switch. Off or offline: the request waits on the phone with "waiting to send" and sends when allowed (R4 edge). Rollback: a deletion request can be cancelled before its date; after the purge it cannot, by design (the drill proves the date). Noticed by: `ops-health` stuck-deletion and purge-backlog views and `docs/ops/runbooks/stuck-deletion.md`, `purge-failing.md`. |
| Data class and retention | Deletion request row: L3 (profile id, time, source), kept as a pseudonymised consent record (BL-578) for the period in `DELETION_AND_EXPORT_SPEC.md`; everything else keyed to the profile is removed at day 30. Letter text, audio, child names are L4 and gone after the purge. Apple refresh token: L3, revoked and removed. A linked feedback report goes at the earlier of the purge or 90 days. Read by: service role only. |
| Schema and grants | No new table in this theme. The worker needs a hook for every new table that holds a profile id; the feedback table (BL-729, reserved only in PR #638, not on develop) must add its purge step with its own migration, grants in `supabase/tests/grants.mjs`, and a db test; this theme does not start that row until the id is on develop (audit G-38). |
| Analytics events | account_deletion: in catalog (step property only). phone_erase_result: add to catalog first. |

## Trace and tests

Id convention: `_CONVENTIONS.md`. A test title starts with the bracketed id. Paths marked "proposed" do not exist yet; the PR that adds the test names the real path.

| Id | Refines | Test (layer, file, title) | Device or ops row |
|---|---|---|---|
| NX-04-R1 | DATA-REQ-023 | ops drill on the throwaway project (proposed `scripts/ops/purge-drill.mjs`); `[NX-04-R1] sole-parent account leaves 0 rows at day 30` | S1-35, S2-13 |
| NX-04-R2 | F02-REQ-004 | function test `supabase/functions/apple-token/handler.test.ts` (exists; add the bracket); `[NX-04-R2] revoke returns 204 with no token in the body` | S1-35 |
| NX-04-R3 | F21; D-042 | web check (proposed `scripts/ops/web-pages.mjs`); `[NX-04-R3] /delete-account answers 200 with the in-app steps` | none |
| NX-04-R4 | F02-REQ-007 | mobile unit (proposed `apps/mobile/test/deleted-elsewhere.test.ts`); `[NX-04-R4] export offered once, then database, audio, Keychain and analytics id clear` | new: delete on phone A, open phone B |
| NX-04-R5 | DATA-REQ-024 | `apps/mobile/test/erase-all.test.ts` (added by #520); `[NX-04-R5] erase leaves 0 bytes and sends no request` | DL-05 |
| NX-04-R6 | F11 | two-account db test (proposed `supabase/tests/coparent-deletion.test.mjs`); `[NX-04-R6] co-parent keeps their own letters` | S1-22, S1-28 |
| NX-04-R7 | F17 | device row; Test: none, device | new: AX5 and VoiceOver on deletion |

Trace: NX-04-R1..R7 -> F02-REQ-004, -007, -022, F17 deletion rows, DATA-REQ-023, -024, BL-330, BL-640 (#520).

## Not verified

Whether the purge worker has a hook for each new table (feedback table, readiness file BL-729). Apple's phased handling of deletion for sole-parent accounts.
