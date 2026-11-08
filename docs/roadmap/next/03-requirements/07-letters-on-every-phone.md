# Theme 7: My letters on a new phone, and nothing lost on the way

| | |
|---|---|
| Working label | NX-07 (id: to be assigned) |
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
| NX-07-R6 | HYPOTHESIS | Given 20 simulated clients on the throwaway project, When the load run of `06-nfr.md` section 16 (G4) runs, Then the numbers written there are met. The numbers belong to that file; this theme does not restate them. | G4 has no evidence file. | Feasibility R12 |
| NX-07-R7 | EVIDENCE | Given a new phone and a sign-in, Then every letter's words, dates and edit list appear, and a letter with audio held elsewhere shows a plain line that the recording is on the other phone, 0 broken play buttons. | Audio stays local in v1.0 (brief B7); the screen state is not specified. | PRD brief B7; opportunity 6 |
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

Keys to add: `sync.audioElsewhere.line`, `sync.waiting.line`, `sync.restoreDone.line`. Words by `content`.

## Analytics events (opt-in, content-free, names only)

Existing: `sync_failed`, `restore_result`. No new names.

## Device rows

B2-4, S1-22, S1-28 (two phones, two Apple Accounts), DL-03, AL-06. New: "new phone shows words with audio elsewhere".

## Dependencies

Themes 1 and 2. #634, #636, #637. Feasibility R4 and R6 first (any new migration waits for the local-database flake root cause).

## Founder-only decisions

| Decision | Recommended default |
|---|---|
| Whether recording backup is in build 12 | No; D-121 puts it third in the order |
| Who runs the two-phone session and when | Founder, after theme 2 passes on one phone |

## Not verified

The phone half of backup beyond its switch. Real sync latency (every number is a target in `06-nfr.md`, none measured).
