# Theme 4: Deleting my account, and erasing this phone

| | |
|---|---|
| Working label | NX-04 (id: to be assigned) |
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
| NX-04-R1 | EVIDENCE | Given a sole-parent account with 5 letters synced, When deletion is confirmed and the purge worker runs on the throwaway project, Then at day 30 0 rows hold the profile id in any table for the Asha fixture, and the Storage listing for the account is empty. | Purge worker has no hosted deployment (S-54 FAIL); drills S1-35 and S2-13 never run. | Gap map 1.7; DATA-REQ-023 |
| NX-04-R2 | EVIDENCE | Given a Sign in with Apple account, When deletion is confirmed, Then the Apple refresh token is revoked and the function returns 204 with no token in the body. | `apple-token` exists with no hosted secrets. | F02-REQ-004 |
| NX-04-R3 | EVIDENCE | Given the web address `/delete-account`, Then it answers 200 and tells a person how to delete in the app and how to ask for help if they cannot sign in. | Returns 404 on 8 Nov; `packages/brand/index.ts` line 56 names it. | Gap map 1.11 |
| NX-04-R4 | EVIDENCE | Given an account deleted on another phone, When this phone next refreshes, Then the app offers 1 export, then clears database, audio, Keychain and analytics id. | Not run across two phones. | F02-REQ-007 |
| NX-04-R5 | EVIDENCE | Given Erase everything on this phone, When confirmed, Then the local database, audio files and Keychain items are 0 bytes, an export is offered first, and the server account is untouched. | #520 is open, held for the CCO line. | #520; DATA-REQ-024 |
| NX-04-R6 | EVIDENCE | Given a co-parent in the book, When the other parent deletes their own account, Then the co-parent keeps their own letters, the deleting parent's letters follow the deletion rule, and the screen says which before the confirm. | Two-account case never run (S1-22, S1-28). | F11; RR-5 |
| NX-04-R7 | HYPOTHESIS | Given the deletion screen at AX5 and VoiceOver, Then 0 clipped lines and the confirm button is reachable in 3 swipes or fewer. | No row exists. | New row |

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

Keys to add: `accountDeletionCopy.pending.offline`, `accountDeletionCopy.coParent.keepsOwn`, `accountDeletionCopy.erasePhone.confirm`, `accountDeletionCopy.erasePhone.done`. Words by `content`; counsel for the deletion sentence.

## Analytics events (opt-in, content-free, names only)

Existing: `account_deletion` (step property only). New: `phone_erase_result` (property: done or cancelled).

## Device rows

S1-35, S2-13, AL-07.6a, DL-05 (erase). New: "AX5 and VoiceOver on deletion".

## Dependencies

Theme 1 (hosted project, purge worker and cron secrets), theme 2 (a signed-in account), #636. Web page needs the counsel text (theme 5 lists the page set).

## Founder-only decisions

| Decision | Recommended default |
|---|---|
| CCO line on #520 | Give it; PRD keeps it in v1.0 |
| Whether the deletion row ships if the drill has not passed | No; do not ship the row until S1-35 passes on the throwaway project (gap map section 5) |

## Not verified

Whether the purge worker has a hook for each new table (feedback table, readiness file BL-729). Apple's phased handling of deletion for sole-parent accounts.
