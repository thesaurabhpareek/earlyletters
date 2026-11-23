# Proposed `asks.*` rows for DATA_CLASSIFICATION section 4.5 (BL-1566)

> PROPOSED. Not applied. `docs/legal/**` is the founder's to merge (D-125), so this file changes nothing under it. The founder applies it: paste the rows below into the `settings` table of section 4.5 of `docs/legal/DATA_CLASSIFICATION.md`, directly after the `reminders.*` rows.

Written on 23 Nov 2026 against `origin/develop` at `58a05e45f`. Raised by the data-steward review on #1419 (note 1): section 4.5 has no `asks.*` row at all. The grep of `docs/legal/DATA_CLASSIFICATION.md` was repeated on the day and still finds none.

## What was re-read
- `apps/mobile/src/lib/asks/index.ts`, the table in the file header (lines 8 to 19) and the key map `K` (lines 36 to 43).
- `apps/mobile/src/lib/asks/day-store.ts`, the key map `DAY_KEYS` (line 8). Three of the nine keys live here, not in `index.ts`.
- Section 4.5 `settings` table (line 778 on).
- `apps/mobile/src/lib/reminders/session.ts:7`, `lib/erase-everything.ts:8 to 10`.

The code defines nine `asks.*` keys. Five are the ones the row named. `asks.firstLetterAt` (BL-518) is the sixth. `asks.lastAskDay`, `asks.asksToday` and `asks.osAsksToday` (BL-1784) are three more that the backlog row did not list, so they are included here.

## The group, as one paragraph for the table intro
`asks.*` keys are device settings that remember which setup asks (the reminder card, Keep the book, the analytics and notification asks) have been shown, so none is shown twice by mistake. Every value is a flag, a count, a day or a time. None holds a name, text, a book id or an account id, and none is keyed to a person.

## Rows

Common to every row, so each row says it once here and the table stays short: store is the local `settings` table in `scribe.db`; sync is none (the settings writer in `lib/sync/outbox.ts:129 to 133` is the sync engine's own state, and no `asks.*` key is written through it); export is no for the normal export (it reads only the named settings in `lib/export/device.ts`, not these keys), but the launch recovery export packs `scribe.db` and its `-wal`, `-shm` and `-journal` files as they sit on the phone (`lib/resilience/recovery-export.logic.ts:1-4, 27-33`), so all nine keys travel in that ZIP, which stays with the person; retention is until Erase everything, which empties every row of every table, settings included (`lib/erase-everything.ts:8 to 10`); what sign-out does is nothing, they are kept per phone (`lib/reminders/session.ts:7`); log rule is no value in any log, crash report, analytics event or URL (DATA-REQ-004). They are in the iPhone backup, as the rest of `scribe.db` is.

| Key | Level | Note |
|---|---|---|
| `asks.reminderPrimes` | L2 | Count of times the reminder prime was shown, from any source, capped at `MAX_REMINDER_PRIMES` (2) (`lib/asks/index.ts:11, 37`; `lib/asks/next-ask.logic.ts:65`) |
| `asks.reminderPrimeYes` | L2 | `on` once the person said Yes to the reminder prime; they are never primed again (BL-1430) (`lib/asks/index.ts:12, 38, 90`) |
| `asks.keepBookOffered` | L2 | `on` once the Keep the book sheet was offered after a letter (`lib/asks/index.ts:13, 39, 123`) |
| `asks.keepBookReoffered` | L2 | `on` once the one re-offer of Keep the book was made, after the third letter (BL-519) (`lib/asks/index.ts:14, 40, 122`) |
| `asks.firstLetterSession` | L2 | Session key, an epoch in milliseconds, of the session in which the first letter was saved. A process-start time, not a letter's date (`lib/asks/index.ts:15, 41, 99`) |
| `asks.firstLetterAt` | L2 | Time, epoch milliseconds, of the first letter, so the second prime can wait the first month (BL-518). Checked on its own: it is when a first letter was saved, with no book, letter or person attached, the same shape as `captured_at` (L2) and `lastLaunchAt` (L2). It is a time and not a date of the moment, so it is not L3 `occurred_on`. Exec-team counsel must confirm that a first-letter time alone is L2 and not L3 (`lib/asks/index.ts:16, 42, 100`) |
| `asks.lastAskDay` | L2 | The local day, `YYYY-MM-DD`, the two counts below belong to. A different day reads both as 0, so it resets at local midnight. It is the day of an ask, never a child's date (`lib/asks/day-store.ts:8, 16, 27`) |
| `asks.asksToday` | L2 | Count of setup asks shown on that day, capped at `MAX_ASKS_PER_DAY` (2, BL-1784) (`lib/asks/day-store.ts:8, 16, 28`; `lib/asks/next-ask.logic.ts:26`) |
| `asks.osAsksToday` | L2 | Count of OS-alert or consent asks shown on that day, capped at `MAX_OS_ASKS_PER_DAY` (1, BL-1784) (`lib/asks/day-store.ts:8, 16, 29`; `lib/asks/next-ask.logic.ts:28`) |

## Points for the founder
1. Sign-out keeps all nine on purpose (`lib/reminders/session.ts:7`), so a second account on the same phone inherits "already asked". That is the shipped behaviour and it is not a leak (no id, no text), but it is a choice. If the founder wants a new account asked afresh, that is a card for `product`, not a classification change. Exec-team counsel must confirm that keeping these per phone needs no extra wording in the privacy policy.
2. "Never synced" and "never exported" (the second holds for the normal export only; the recovery ZIP carries the database as it sits) are read from the code on the day. A test that fails when any `asks.*` key reaches the sync writer or the export would make the row a proof. The data-steward review on #1419 did not ask for one. It is not filed here.
3. The header table in `lib/asks/index.ts` lists the keys by hand. A tenth key would be unlisted again. A check that every `asks.` string in `apps/mobile/src/lib` has a row here, or in section 4.5 once applied, would stop the gap coming back. Not filed here; a backlog row is the founder's or `product`'s call.

## Not done here
- No edit to `docs/legal/**`, `docs/BACKLOG.md` or any code.
- Line numbers are from `58a05e45f` and will move; the key names will not.
