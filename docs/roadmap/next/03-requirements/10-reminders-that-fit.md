# Theme 10: Reminders that fit my day and my child's age

| | |
|---|---|
| Working label | NX-10 (id: to be assigned) |
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
| NX-10-R2 | EVIDENCE | Given 30 reminders in a row for one child, Then 0 repeat the same prompt text. | Selection test only for the current window; check across seasons is missing. | Feasibility item 6 |
| NX-10-R3 | HYPOTHESIS | Given 3 reminders ignored, Then the app backs off (the next one is later than the previous) and never sends more than the parent's chosen frequency. | Back-off wording and numbers are in BL-535 and BL-549. | `docs/BACKLOG.md` |
| NX-10-R4 | EVIDENCE | Given notifications refused at the system level, Then the app asks once and never again by itself; Settings shows the state. | Prime flow built; re-ask limit not pinned. | `reminder_prime_*` events |
| NX-10-R5 | EVIDENCE | Given any reminder text, Then it has no streak, count of gaps, points or guilt wording (content rules test passes, 0 hits). | Rule test exists. | CLAUDE.md |
| NX-10-R6 | HYPOTHESIS | Given a month of {child}'s age is reached, Then a note may offer to write about the month; a month with nothing recorded is never counted or flagged. | Proposed (acceptable-reminder idea A in UR). | `01-customer-needs.md` section 3 |

**Shown:** `reminderCopy.*`. **Records:** the parent's reminder choice as a setting, not a consent act. **Never:** push tokens, an hour inferred from behaviour, a name on the lock screen. **Decline and withdraw:** Off in Settings; nothing else changes.

## Edge cases

Time zone change; Do Not Disturb; two children; preterm adjusted dates (needs perinatal review before any test); a due-date mode; quiet hours.

## Offline behaviour

Local reminders need no network.

## What we never do

Count missed days, send a second reminder to make up for the first, infer occasions from names or language.

## Copy needs (packages/content)

Keys to add: `reminderCopy.backoff.settingsLine`, `reminderCopy.monthNote.offer`. Words by `content`.

## Analytics events (opt-in, content-free, names only)

Existing: `reminder_prime_shown`, `reminder_prime_result`, `os_permission_result`, `reminder_schedule_set`, `reminder_sent`, `reminder_suppressed`, `notification_opened`.

## Device rows

New: "reminder at chosen time on SE 3", "notifications refused then Settings".

## Dependencies

None on servers. Words and numbers from BL-535, BL-549.

## Founder-only decisions

| Decision | Recommended default |
|---|---|
| BL-534 timing (D-130) | Ship what is built in 1.0; move extras to 1.0.1 |

## Not verified

Best time of day. Any effect on keeping the app.
