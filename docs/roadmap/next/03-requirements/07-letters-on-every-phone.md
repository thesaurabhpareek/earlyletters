# Theme 7: My letters on a new phone, and nothing lost on the way

Readiness: 25 of 28 (audit 8 Nov: 17). Author's re-score, `qa` to confirm. Remains: `design-systems` draws the audio-elsewhere state (R7, C7; the placement below is the requirement, the drawing is theirs); the founder's two phones and two Apple Accounts (C14); R4 and R6 run only on the throwaway project from theme 1.

| | |
|---|---|
| Working label | NX-07 (working id, see `_CONVENTIONS.md`) |
| Refines | F16 (sync), F16-REQ-026, -027, -029a, -029b, -029c, F08 (recordings), AL-06 restore drill |
| Tag | EVIDENCE that code exists and has never run on two phones (gap map 1.5, 1.6; feasibility part 0 item 2, R12). HYPOTHESIS for demand beyond reviews: R2 reports 9 reviews describing vanished work |
| Size | M to L (feasibility item 27 is M; R12 and R6 are the reliability rows). Recording backup is separate and stays off |
| Gate | Founder (two phones, two Apple Accounts, the iPhone SE 3). Counsel Q42 for backup with escrow only if backup is turned on |
| Order | 7 of 12 |

## What the parent will see and do

They sign in on a second phone and their letters appear: the words, the dates, the edits and the child's book. Audio stays on the phone that recorded it in v1.0 unless recording backup is on, and the app says so in plain words. If two phones change the same letter, the newer words win and nothing typed is lost.

## The check

| Label | Tag | Given, When, Then | Fails on old code because | Source |
|---|---|---|---|---|
| NX-07-R1 | EVIDENCE | Given 3 unsynced letters on phone 1, When it is online for the first time, Then the server holds exactly 3 letters and phone 2 shows 3 after one pull. | Never run on a phone against a hosted project. | Gap map 1.5; B2-4, S1-22 |
| NX-07-R2 | EVIDENCE | Given the answer to a Keep is lost and the phone retries 3 times, Then the server holds exactly 1 letter. | Stated in the PRD; no hosted run. | F16-REQ-029c |
| NX-07-R3 | EVIDENCE | Given phone 1 sends a Keep based on version 926 after phone 2 applied words at version 964, Then the server refuses with the refusal code, 0 words are lost, phone 1 shows the newer words. | Same. | F16-REQ-029a |
| NX-07-R4 | EVIDENCE | Given an erase of a private letter and 5 pulls with a stale cursor, Then all 5 answers equal the pre-erase answer byte for byte. | Same. | F16-REQ-026 extension |
| NX-07-R5 | EVIDENCE | Given a query by the app role over 5 seconds, Then it is cancelled and logged; no background job holds a transaction over 1 second. | Only the escrow role has a 5 s limit today. | F16-REQ-027 |
| NX-07-R6 | HYPOTHESIS | Given the throwaway project, When the 1-hour load run of `06-nfr.md` section 16, gate G4 (1x the 1k peak targets, with the 20-family first-enable backup burst) runs, Then it passes. This row states no client count and no latency of its own; the numbers belong to that section. (A second gate also labelled G4, line 170, is crash signatures; this row is the load one.) | G4 has no evidence file. | Feasibility R12 |
| NX-07-R7 | EVIDENCE | Given a new phone and a sign-in, Then every letter's words, dates and edit list appear, and for a letter whose audio is held on another phone the letter row shows `sync.audioElsewhere.line` as its subtitle and the player area shows the same line where the play button would be; the play button is not drawn (0 play buttons for a letter with no local audio) and VoiceOver reads the line. | Audio stays local in v1.0 (brief B7) and no screen state exists for it. | PRD brief B7; opportunity 6 |
| NX-07-R8 | HYPOTHESIS | Given recording backup is later turned on, When the restore drill AL-06 (`BACKUP_RESTORE_DRILL.md`) runs on two phones, Then every recording plays after restore. Until it passes, backup stays off in every profile. | Backup is off; DL-03 "not run: needs two phones". | D-121; ADR 0024 |

**Shown:** `family` and `backup` copy where they exist; the "recording is on the other phone" line is new.
**Records:** sync produces no consent act. Any backup consent follows theme 3's pattern.
**Never:** send audio before backup consent; put words or names in logs (`sync_failed` carries a code only); rewrite words on merge.
**Decline and withdraw:** a parent who stays signed out keeps the phone-only book with record, read and export (PRIV-R09).

## Edge cases

Second account on the same phone; kill switch toggled mid-sync; phone full while pulling; clock change; two parents typing at once; a letter erased on one phone while another is offline (R4).

## Offline behaviour

Letters queue in the outbox in order and send on return. The queue survives a relaunch. Sign-out waits until it is empty (theme 2 R4).

## What we never do

Overwrite a person's words silently; delete on one phone because another is offline; merge edits by rewriting text.

## Copy needs (packages/content)

Keys, all `new` (searched 8 Nov: `packages/content/src` has a `sync` group only inside `features/auth.en.ts` line 186, for sign-in; name the real group in the PR): `audioElsewhere.line`, `waiting.line`, `restoreDone.line`. Words by `content`: say where the recording is, in plain words, no loss language.

## Analytics events (opt-in, content-free, names only)

Existing and in catalog (checked 8 Nov): `sync_failed`, `restore_result`. No new names. Nothing is sent in 1.0 (D-124).

## Device rows

B2-4, S1-22, S1-28 (two phones, two Apple Accounts), DL-03, AL-06. New: "new phone shows words with audio elsewhere".

## Dependencies

Themes 1 and 2. #634, #636, #637. Feasibility R4 and R6 first (any new migration waits for the local-database flake root cause).

## Founder-only decisions

| Decision | Recommended default |
|---|---|
| Whether recording backup is in build 12 | No; D-121 puts it third in the order |
| Who runs the two-phone session and when | Founder, after theme 2 passes on one phone |

## Engineering block (cross-cutting, added 8 Nov 2026 after the readiness audit, G-31 to G-37)

| Line | This theme |
|---|---|
| API contract (`packages/api`) | Sync push and pull contracts exist in `packages/api/src/server/sync.ts`. R3 relies on the refusal code for a stale version; R4 on the pull cursor answer. No new type; if the audio-elsewhere state needs a field on the pull row (a flag that audio exists on another device), it is additive, version bump noted in the PR, with a case in `packages/api/test/server-contracts.test.ts`. |
| Budget (`06-nfr.md`) | Sync pull: 300 ms a page p95, up to 500 rows. New phone: book list and children visible after sign-in p95 10 s on LTE. Shared-book freshness: 15 s pull, p95 30 s (ADR 0025). Restore of first launch: 99% within 10 s with no tap (C-NFR-003). Load: section 16, gate G4 (R6). |
| Accessibility | Audio-elsewhere line in the letter row and player area: AX5 with 0 clipped lines (the line wraps; the row grows); VoiceOver reads the line instead of a play control; no control is announced that does nothing; Reduce Motion: no motion. New device row. |
| Switch, off behaviour, noticed by | Switch: signed `sync` kill switch (`packages/api/src/kill-switches.ts`; proven in NX-01-R6). Off: the phone keeps its own book, the outbox waits. Noticed by: `sync_failed` (code only) when analytics are on, and the `ops-health` rejected-writes and oldest-transaction views; the load run in R6 before submission. Rollback: switch off, then a forward fix. |
| Data class and retention | Letter words and edits: L4, synced under RLS to the book's parents only; working material (raw transcript, machine edits) is author-only (06-nfr Working material row). Audio: L4, stays on the phone in 1.0. Outbox on the phone: L4, removed with the app. Server rows removed in the deletion job (theme 4). |
| Schema and grants | No new table in this theme. Sync migrations are on develop (`20261016000000_sync_v1_server.sql`). Any pull-row field for R7 is a new additive migration with its grant in `supabase/tests/grants.mjs` and a case in the sync db tests; any new migration waits for the local-database flake root cause (feasibility R4, R6). |
| Analytics events | sync_failed, restore_result: in catalog. No new events. |

## Trace and tests

Id convention: `_CONVENTIONS.md`. A test title starts with the bracketed id. Paths marked "proposed" do not exist yet; the PR that adds the test names the real path.

| Id | Refines | Test (layer, file, title) | Device or ops row |
|---|---|---|---|
| NX-07-R1 | F16-REQ-029 | two-client script on the throwaway project (proposed `scripts/ops/two-client.mjs`); `[NX-07-R1] 3 unsynced letters become 3 on the server and on phone 2` | B2-4, S1-22 |
| NX-07-R2 | F16-REQ-029c | db/sync test (add the bracket to the existing retry test in `supabase/tests`); `[NX-07-R2] a lost answer retried 3 times leaves 1 letter` | B2-4 |
| NX-07-R3 | F16-REQ-029a | db/sync test; `[NX-07-R3] stale version is refused and no words are lost` | S1-28 |
| NX-07-R4 | F16-REQ-026 | db test; `[NX-07-R4] five stale-cursor pulls equal the pre-erase answer byte for byte` | none |
| NX-07-R5 | F16-REQ-027 | db test; `[NX-07-R5] app role query over 5 s is cancelled; no job holds a transaction over 1 s` | none |
| NX-07-R6 | feasibility R12 | k6 scenario on the throwaway project; `[NX-07-R6] G4 load run passes` | none |
| NX-07-R7 | brief B7 | mobile unit on the row state (proposed `apps/mobile/test/audio-elsewhere.test.ts`); `[NX-07-R7] no play button for a letter with no local audio` | new: new phone shows words with audio elsewhere |
| NX-07-R8 | D-121; ADR 0024 | restore drill `BACKUP_RESTORE_DRILL.md`; Test: none, drill, backup stays off | AL-06, DL-03 |

Trace: NX-07-R1..R8 -> F16, F16-REQ-026, -027, -029a, -029b, -029c, F08, AL-06.

## Not verified

The phone half of backup beyond its switch. Real sync latency (every number is a target in `06-nfr.md`, none measured).
