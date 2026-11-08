# Theme 10: Reminders that fit my day and my child's age

Readiness: 26 of 28 (audit 8 Nov: 17). Author's re-score, `qa` to confirm. Remains: R1 to R4 need an iPhone SE 3 and a person (C14); the founder decides BL-534 timing, which decides whether R3 (back-off) is 1.0 or 1.0.1. Found on re-reading the code: back-off is not built (see R3), so this theme is "proof plus back-off", not "proof only".

| | |
|---|---|
| Working label | NX-10 (working id, see `_CONVENTIONS.md`) |
| Refines | F13 (prompts, reminders), BL-530 to BL-550, opportunity 19 |
| Tag | EVIDENCE: 27 reviews praise prompts, 4 repeat or misfit, 5 too many messages (R2 T4 to T6); 92 of 200 Qeepsake reviews mention prompts or reminders, 20 of 43 negative ones (UR section 3). No published evidence on the best time for new parents (`NOTIFICATION_EVIDENCE_2026-11-01.md`). HYPOTHESIS for how well ours work |
| Size | S to M. Local reminders are built (#624, #483); push is not in scope |
| Gate | Compliance rating: go for local. Apple 4.5.4. Founder: decide BL-534 (1.0 or 1.0.1) |
| Order | 10 of 12 |

## What the parent will see and do

They pick when they would like a nudge. It fits {child}'s age, does not repeat, and stops asking when they are busy. It never counts anything. The lock screen shows no name and no words.

## The check

| Label | Tag | Given, When, Then | Fails on old code because | Source |
|---|---|---|---|---|
| NX-10-R1 | EVIDENCE | Given a chosen time, When a reminder fires, Then it fires within 1 minute of that time on 5 of 5 device runs, and the notification body contains 0 characters of a child's name or letter text. | Device run not recorded. | PRIV-R10; F13 |
| NX-10-R2 | EVIDENCE | Given 30 reminders in a row for one child across a season change, Then 0 repeat the same prompt text (the prompt library is 111 prompts; the evening title variants rotate through 8 by design and may repeat after 8, C-REQ-006, so this row judges prompt text only). | Selection is tested only inside the current window; no test spans seasons (feasibility item 6). | Feasibility item 6 |
| NX-10-R3 | EVIDENCE | Given 4 reminders in a row that were neither opened nor followed by a save within 2 hours, Then the cadence drops to weekly; given 4 more, Then only month-age notes remain and one in-app card appears ("Would fewer nudges suit you better?" family of keys, no numbers shown); given any save, Then the chosen cadence returns. It never sends more than the chosen frequency. (F13-U18, C-REQ-008.) | NOT BUILT: `apps/mobile/src/lib/reminders/planner.ts` says "Not here (P1, later): back-off after unopened nudges (C-REQ-008)". The numbers were never in BL-535 or BL-549 (those are prompts and doc fixes). | F13-U18; C-REQ-008 |
| NX-10-R4 | EVIDENCE | Given notifications refused at the system level, Then the app asks once and never again by itself; Settings shows the state. | Prime flow built; re-ask limit not pinned. | `reminder_prime_*` events |
| NX-10-R5 | EVIDENCE | Given the new reminder strings (`reminderCopy.backoff.settingsLine`, `reminderCopy.monthNote.offer`), When the content rules test runs with those two keys required, Then both exist and each has 0 hits for streak, count of gaps, points or guilt wording. | The two keys do not exist (they are `new` below), so a test that requires them fails today. The generic rules scan alone passes on old code and is not this row. | CLAUDE.md content rules |
| NX-10-R6 | HYPOTHESIS | Given a month of {child}'s age is reached, Then a note may offer to write about the month; a month with nothing recorded is never counted or flagged. | Proposed (acceptable-reminder idea A in UR). | `01-customer-needs.md` section 3 |

**Shown:** `reminderCopy.*`. **Records:** the parent's reminder choice as a setting, not a consent act. **Never:** push tokens, an hour inferred from behaviour, a name on the lock screen. **Decline and withdraw:** Off in Settings; nothing else changes.

## Edge cases

Time zone change; Do Not Disturb; two children; preterm adjusted dates (needs perinatal review before any test); a due-date mode; quiet hours.

## Offline behaviour

Local reminders need no network.

## What we never do

Count missed days, send a second reminder to make up for the first, infer occasions from names or language.

## Copy needs (packages/content)

Keys to add in `reminderCopy` (`features/reminders.en.ts`; the group exists), both `new`: `backoff.settingsLine`, `monthNote.offer`. Words by `content`. The in-app card key family is `reminders.backoff.*` in F13-U18; name the real group in the PR.

## Analytics events (opt-in, content-free, names only)

Existing and in catalog (checked 8 Nov): `reminder_prime_shown`, `reminder_prime_result`, `os_permission_result`, `reminder_schedule_set`, `reminder_sent`, `reminder_suppressed`, `notification_opened`.

## Device rows

New: "reminder at chosen time on SE 3", "notifications refused then Settings".

## Dependencies

None on servers. Words by `content`; numbers from F13-U18 (4 and 4, 2 hours). BL-535 and BL-549 hold no back-off numbers.

## Founder-only decisions

| Decision | Recommended default |
|---|---|
| BL-534 timing (D-130) | Ship what is built in 1.0; move extras to 1.0.1 |

## Engineering block (cross-cutting, added 8 Nov 2026 after the readiness audit, G-31 to G-37)

| Line | This theme |
|---|---|
| API contract (`packages/api`) | None. Reminders are local notifications; no server call. |
| Budget (`06-nfr.md`) | No server budget. A reminder fires within 1 minute of the chosen time (R1, proposed target). Scheduling work must not delay the first frame (cold start p50 1.2 s, p90 2.0 s is unchanged). |
| Accessibility | Reminder card, Settings reminder rows, the back-off card: AX5 with 0 clipped lines; VoiceOver reads the chosen time and cadence; the time picker is adjustable by VoiceOver; tap targets 44 pt or more; Reduce Motion: fade only. The notification text has no name on the lock screen (R1). New device rows. |
| Switch, off behaviour, noticed by | Switch: Off in Settings, and the system permission. Off: no notification is scheduled. Rollback: a build that omits the back-off; the chosen cadence then simply continues. Noticed by: `reminder_suppressed` and `notification_opened` when analytics are on (not in 1.0); in 1.0 by the SE 3 device rows. |
| Data class and retention | The chosen time and cadence: a device setting, L2, removed with the app. No push token, no server copy. Names in notifications default off (D-025). Unopened-count state for back-off: a device counter, L2, reset on a save; never leaves the phone. |
| Schema and grants | No server schema. Local settings only; if the back-off counter needs a local column, it is a local migration step in `apps/mobile/src/lib/db/migrations.ts` with a test (no grants). |
| Analytics events | reminder_prime_shown, reminder_prime_result, os_permission_result, reminder_schedule_set, reminder_sent, reminder_suppressed, notification_opened: all in catalog. No new events. |

## Trace and tests

Id convention: `_CONVENTIONS.md`. A test title starts with the bracketed id. Paths marked "proposed" do not exist yet; the PR that adds the test names the real path.

| Id | Refines | Test (layer, file, title) | Device or ops row |
|---|---|---|---|
| NX-10-R1 | PRIV-R10; F13 | device run, 5 of 5; Test: none, device | new: reminder at chosen time on SE 3 |
| NX-10-R2 | feasibility item 6 | core/mobile unit (proposed `packages/core/test/prompt-selection-seasons.test.ts`); `[NX-10-R2] 30 reminders across a season change repeat no prompt text` | none |
| NX-10-R3 | F13-U18; C-REQ-008 | mobile unit on the planner (proposed `apps/mobile/test/reminders-backoff.test.ts`); `[NX-10-R3] 4 unopened drop to weekly, 4 more to month notes, a save restores` | none |
| NX-10-R4 | F13; reminder_prime_* | mobile unit (proposed); `[NX-10-R4] refused notifications are asked once and never again` | new: notifications refused then Settings |
| NX-10-R5 | CLAUDE.md content rules | `packages/content/test/rules.test.ts` (exists; add the required-keys list); `[NX-10-R5] back-off and month-note keys exist and have 0 rule hits` | none |
| NX-10-R6 | UR acceptable-reminder idea A | HYPOTHESIS; mobile unit when built; `[NX-10-R6] a month with nothing recorded is never counted or flagged` | none |

Trace: NX-10-R1..R6 -> F13, F13-U18, C-REQ-008, BL-530 to BL-550, opportunity 19.

## Not verified

Best time of day. Any effect on keeping the app.
