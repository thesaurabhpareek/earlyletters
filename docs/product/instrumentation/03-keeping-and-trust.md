# Instrumentation 3: keeping and trust (PROPOSED)

Status: PROPOSED, 20 Nov 2026 (UTC). Author: `product` as PM3. Naming: the founder's event standard of 20 Nov (`/home/claude/event-standard-brief.md` baseline; the final `docs/analytics/instrumentation/00-event-standard.md` had no PR when this was written, so every name below is checked against the brief and must be re-matched to the final file). Docs only. Partner: `data-steward`, file `docs/analytics/instrumentation/data-steward.md` (PR #1037, branch `docs/instr-data-steward-20nov`, read this session; it is PROPOSED and unmerged). Its classification label for every instrument is L2; its E83 box (withdrawal deletes) takes the next free erratum number, so this file's lock proposal moves to E84. Charter: `/home/claude/instr-charter.md` (Karma, 20 Nov). Baseline: develop at `3e16f6a`, requirements rev 2 LOCKED, errata E1 to E82. Screen ids come from `docs/design/IA-FINAL-20nov.md` on branch `docs/design-ia-final-20nov` at `71eb6e1` (PR #1033), read this session.

Area: NS-08 (backup get-ready), NS-09 (let it go), NS-10 (new phone), NS-11 (Save a copy), NS-12 (earlier versions), NS-36 and NS-37 where they touch keeping (delete follows the letter, copies erased, export holds every part), deletion and erase, the held screens and AccountLayer, and consent and security notices (E76 to E78). Card text: `docs/product/prd/08-keeping-and-trust.md`, `11-foundations.md`, `18-errata-after-lock.md`.

Reading rules: UNVERIFIED marks anything I did not read this session. Every number marked PROPOSED is a proposal; no target is a measured baseline. Nothing here is built; nothing here changes a locked statement.

## 0. Position, in five lines

1. Analytics is OFF for the whole 1.0 line (D-095, D-124 item 3, FR-DAT-01). Everything below is designed DARK: compiled, tested, inert. Turning it on, the consent sheet wording, the label change and counsel are the founder's.
2. This is the most sensitive area. A deletion, an erase, a let-go, a restore, a declined agreement and a security notice are acts about a person's trust. The stricter rule here: **prefer a count to an event, and an error class to a trace.** Most trust moments get no event at all (tier T0 below).
3. Everything that must be known to keep the promises "yours always" and "private" is already known by other means: tester numbers sent by hand (FR-DAT-04 to FR-DAT-09, FR-DAT-13, FR-DAT-14), the support tally (FR-DAT-17), server purge receipts, and tests on a device. Instrumentation here adds speed and breadth, never a person-level view.
4. Founder rule of 20 Nov (binding): only completely free, open-source tools that fit Expo/React Native, Supabase and Vercel. No paid product or tier is specified here. Section 11 says what that leaves.
5. The thin layer we build and nobody sells: the closed allowlist, the consent gate, the content-free validators and the tests that prove it (charter). PM3 adds the keeping tier rules and the tests in section 9.

## 1. Tiers for trust-bearing signals

| Tier | Meaning | What may leave the phone or be stored | Used for |
|---|---|---|---|
| T0 | Never measured | Nothing. No event, no counter, no log field, no crash breadcrumb | Account deletion request, confirm, undo and the reason; Erase everything; Let it go taps and outcomes; Recently deleted restore and purge; declined agreement (per person); security notices sent (E76 to E78); which letters have versions; any wrong-account sighting |
| T1 | Count only, unlinked | A weekly summary of whole-number buckets, sent with a fresh random id per send (not the analytics id), no timestamp finer than the ISO week, no per-event row, under consent only | Keeping health: how many exports finished, how many failed by error class, how many stuck recordings are listed, how long a new phone took to show the Book (bucket) |
| T2 | Basic surface events | `screen_viewed`, `control_tapped`, `surface_shown` with ids from a closed list; random analytics id per consent period; no sequence is reconstructed in reports | Impressions and clicks on Save a copy, the slip, the held screens, Where your letters live (section 3) |
| T3 | Server aggregate | Counts the server already has for operations (purge receipts, sync pull durations), k-anonymised, no cell between 1 and 9 published (TRACKING_PLAN section 1.4) | Deletion clock health, sync health |

Rule R-K1: a new signal in this area starts at T0 and needs a written reason to move up. Rule R-K2: no T1 or T2 property is ever an id of a person, book, letter, media item, device or draft (charter; `OBSERVABILITY-WITHOUT-CONTENT.md` section 2). Rule R-K3: no T1 or T2 event fires from inside the deletion, erase, sign-out or consent-decline flows; those screens import no analytics module (test in section 9).

Why a fresh id per T1 send: with a stable random id, a series "export failed, export failed, then nothing" is a trace of one household. With one id per send the weekly total is a count and cannot be joined. Cost: no per-install retention for these counters, which we do not need. IP capture must be off on the receiver (UNVERIFIED how PostHog names the setting; `data-steward` and `analytics` to confirm).

## 2. The journey, in order

1. A parent keeps a letter and wants a second copy: Me, Keeping your book, Save a copy (NS-11), or the birthday-week slip on Home.
2. A parent decides a take is not worth keeping: Let it go (NS-09).
3. A parent deletes a letter, a book, everything on the phone, or the account (NS-36, NS-45): Recently deleted, Erase, Delete this book, Delete account.
4. A parent edits their words and wants an earlier wording (NS-12).
5. A parent changes phone: sign in, consent, Opening your book, the Book with words and no recordings (NS-10, NS-08 today).
6. A parent asks "where do my letters live": Where your letters live, the provenance line, Storage (NS-08).
7. Later, the founder decides on backup (NS-08 flip, R9, R21).
8. Quiet security moments: sign-out, Sign out other devices, returning consent, AccountLayer when another account holds the phone (E76 to E78, NS-45).

## 2a. Names, by the event standard

Rules applied (brief items 1 to 7): names are `<area>.<object>.<action>`, snake case, ASCII, past tense, at most 3 segments. Area here is `keeping` for new events; screen and control events use the fixed basics `screen.<screen_id>.viewed`, `ui.<control_id>.tapped`, `ui.<element_id>.impressed`, `perf.<metric>.measured`. Ids come from IA-FINAL (lowercased, dash to underscore: C-S04 is `c_s04`). A control id is `<screen_id>_<control>` (for example `c_s04_save`). Every requirement below lists events by name only; the one definition is in the registry rows of section 2b. Funnels are `f_<area>_<goal>` with ordered event names. An impression and its click share one element id: `ui.slip_save_a_copy.impressed` pairs with `ui.slip_save_a_copy.tapped`. The `keeping` area is on the brief's closed list; no new area is requested. UNVERIFIED: whether the final standard keeps `screen.<id>.viewed` without an area prefix, and whether it wants `schema_version` as a column or a property.

Denied names (the validator must reject them; this is the T0 list as names): `keeping.account.deleted`, `keeping.account.delete_started`, `keeping.account.delete_undone`, `keeping.letter.deleted`, `keeping.letter.restored`, `keeping.take.let_go`, `keeping.phone.erased`, `keeping.version.restored`, `keeping.version.removed`, `keeping.consent.declined`, `keeping.security.notice_sent`, `keeping.recording.missing`, and `screen.a_s11.viewed`, `screen.c_s19.viewed`, `screen.c_s20.viewed`, `screen.c_s22.viewed`, `screen.c_s17.viewed`, `screen.c_s23.viewed`, `screen.c_s03.viewed`, `screen.c_s11.viewed`, `screen.account_layer.viewed`, `screen.c_s14.viewed`, and any `ui.*.tapped` whose control id starts with `a_s11_`, `c_s17_`, `c_s19_`, `c_s20_`, `c_s22_`, `c_s23_`, `c_s03_`, `c_s11_`, `c_s14_`, `account_layer_`. Table 1 below says T0 for these; the view of C-S11 that an earlier draft allowed is now denied (a returning-consent view is the start of a decline path).

## 2b. Registry rows

Fields per the brief item 5. Classification: L2 for every row (data-steward section 3 and 2; `schema.ts` makes L3 and L4 unrepresentable). Owner: `analytics` maintains the registry; PM3 owns the requirement. Consent gate: `analytics_consent=granted` and `EXPO_PUBLIC_ANALYTICS=on` (off in every 1.0.x profile, FR-DAT-01). Status: `proposed` for all rows. `schema_version` 1 for all new rows.

| Event name | Trigger | Properties (type, allowed values) | Tier | Requirement |
|---|---|---|---|---|
| `screen.c_s04.viewed` | Save a copy opens | none | T2 | NS-11-R1 |
| `screen.c_s05.viewed` | Making the copy opens | none | T2 | NS-11-R9, R24 |
| `screen.c_s07.viewed` | Which book? opens | none | T2 | NS-11-R14 |
| `screen.c_s08.viewed` | Where your letters live opens | none | T2 | NS-08-R8 |
| `screen.c_s10.viewed` | Opening your book opens | none | T2 | NS-10-R0, R2 |
| `screen.c_s12.viewed` | not an event: C-S12 is a line, see `ui.book_line_recordings_stay.impressed` | | | NS-10-R13 |
| `screen.c_s13.viewed` | Earlier versions list opens | none | T2 | NS-12-R1 |
| `screen.c_s18.viewed` | Storage opens | none | T2 | NS-09-R6 |
| `screen.c_s01.viewed` | Me opens | none | T2 | NS-11-R1 |
| `screen.e_s14.viewed` | Sign-in outage opens | none | T2 | NS-41 |
| `ui.<control_id>.tapped` | A control of Table 1 with tier T2 is tapped | none (the id is the name) | T2 | per Table 1 |
| `ui.slip_save_a_copy.impressed` | The Home slip is drawn | none (no day, no age; week bucket is the event's own week) | T1 | NS-11-R2, R3 |
| `ui.book_line_recordings_stay.impressed` | The Book-level line is drawn | none | T2 | NS-10-R13 |
| `ui.where_letters_live_row.impressed` | The Me row is drawn | none | T2 | NS-08-R8 |
| `ui.held_screen.impressed` | A held screen is drawn | `reason`: enum `consent_outstanding`, `offline`, `no_book`, `wrong_account` (never `deleted_elsewhere`) | T1 | NS-10-R0, R8, R9 |
| `ui.storage_stuck_line.impressed` | Storage shows the stuck-recording line | none | T1 | NS-09-R6 |
| `keeping.export.finished` | A copy was made and checked | `size_bucket`: enum `lt_10mb`, `10_100mb`, `100_500mb`, `gt_500mb`; `duration_bucket`: enum `lt_30s`, `30s_2m`, `gt_2m` | T1 | NS-11-R9, R18 |
| `keeping.export.failed` | A copy stopped before a file was ready | `reason`: enum `cancelled`, `low_space`, `too_large`, `check_failed`, `destination_refused`, `unknown` | T1 | NS-11-R16, R20 |
| `keeping.export.shared` | The share sheet for a finished copy closed | `result`: enum `shared`, `dismissed` | T1 | NS-11-R6a |
| `keeping.summary.sent` | Once a week under consent, the sum of the above and the counts below, with a fresh random id per send | `export_finished`, `export_failed_total`, `export_shared`: each enum `0`, `1`, `2_plus`; `stuck_recordings`: enum `0`, `1`, `2_plus`; `book_ready_bucket`: enum `none`, `lt_10s`, `10_30s`, `gt_30s`; `held_consent_outstanding`, `held_offline`, `held_no_book`, `held_wrong_account`: each enum `0`, `1`, `2_plus` | T1 | NS-09-R6, NS-10-R0, R2, NS-11 |
| `perf.keeping_export.measured` | A copy ended | `bucket`: enum `lt_30s`, `30s_2m`, `gt_2m` (not raw ms) | T1 | NS-11-R18 |
| `perf.new_phone_book_ready.measured` | The Book showed letters after sign-in on a phone with no book | `bucket`: enum `lt_10s`, `10_30s`, `gt_30s` | T1 | NS-10-R0, R2 |

Two rows give the same facts as T1 events and as the weekly summary. That is on purpose: the per-event rows (`keeping.export.*`, `perf.*`) are used only until `keeping.summary.sent` exists; the implementation sends one or the other, never both (IN-K4). The default is the summary alone, so the per-event rows are `proposed` and may be dropped by the registry owner. The `keeping.export.failed.reason` list matches `catalog.ts` `export_failed.reason` plus `destination_refused` (NS-11-R16).

## 3. Table 1: screens, controls and impressions

Ids are proposals for the closed list; names follow section 2a. Screen ids are the IA-FINAL ids. Control ids use the shape `<screen_id>.<control>` in lowercase snake case, from a fixed list in code, never from text on screen. Tier is the highest tier any signal on that row may use. Where a row says T0, the screen has no `screen_viewed` either.

| Screen id (IA-FINAL) | Name a parent reads | Controls (closed list) | Impressions (element ids) | Tier | Notes and sources |
|---|---|---|---|---|---|
| C-S01 | Me, account card | `c_s01_open_account`, `c_s01_row_save_a_copy`, `c_s01_row_where_live`, `c_s01_row_recently_deleted`, `c_s01_row_storage` | none | T2 for the four rows, never for the account card | IA-FINAL 7.1 to 7.3; row labels may change (tree test T1) |
| C-S04 | Save a copy | `c_s04_save`, `c_s04_choose_book` (only with two books), `c_s04_cancel` | none (the view is `screen.c_s04.viewed`) | T2 | NS-11-R1, R6a; "What is inside" has no numbers (FR-DAT-13) |
| C-S05 | Making the copy | `c_s05_stop` | none | T1 outcome only | NS-11-R9, R24 |
| C-S06 | Home slip: Save a copy in the birthday week | `c_s06_open`, `c_s06_dismiss` | `slip_save_a_copy` | T2 | Home rank 3 (E36); no birthday date, no age, no timestamp tied to the birthday (see section 5, "birthday trap") |
| C-S07 | Which book? | `c_s07_pick_book` | none | T2 for the screen view only | NS-11-R14; the choice is never recorded (it identifies a child) |
| C-S08 | Where your letters live | `c_s08_open_save_a_copy`, `c_s08_open_icloud_help` (if present) | `where_letters_live_row` | T2 | NS-08-R8 |
| C-S09 | Provenance line on the letter page | none (a line, not a control) | none | T0 | Four states are per letter; a state per letter is a trace of a recording. Never emitted; section 5 uses a phone-local count that is not sent |
| C-S10 | Opening your book | `c_s10_try_again` | none (the view is `screen.c_s10.viewed`) | T1 for duration bucket; T2 for the view | NS-10-R0 to R2 |
| C-S11 | Returning consent | `c_s11_agree`, `c_s11_finish_setup`, `c_s11_try_another_way`, `c_s11_delete_account`, `c_s11_export` (all denied names) | none (the view is denied) | T0 for every control and for the view | Decline is T0: a per-person refusal of a legal agreement is a record about a person (NS-10-R4a, R4b); the server already holds acceptances (NS-10-R7) |
| C-S12 | Book-level line, recordings stay on the phone that made them | `c_s12_dismiss` | `book_line_recordings_stay` | T2 | NS-10-R13; shown once |
| C-S13, C-S14 | Earlier versions, one version | `c_s13_open_version`, `c_s14_restore`, `c_s14_remove`, `c_s13_show_all` | row on the letter page | T0 for `restore` and `remove`; T2 for the list view and `show_all` | NS-12 (flag `EXPO_PUBLIC_EARLIER_VERSIONS` proposed). A restore or remove on a version is an edit of a person's words; no event |
| A-S11 | Let it go confirm | `a_s11_keep_take`, `a_s11_let_go` | none | T0 | NS-09-R9. Not even a view. The confirmation defaults to keep |
| C-S17 | Recently deleted | `c_s17_restore`, `c_s17_delete_now` | none | T0 | NS-36-R1b, R1c |
| C-S18 | Storage (stuck-recording line, Remove now) | `c_s18_remove_now` | `storage_stuck_line` | T1 (count only, see section 5) | NS-09-R6; E28 |
| C-S19 | Erase everything on this phone | `c_s19_erase`, `c_s19_cancel` | none | T0 | Never an event; erase must work with no network and no module loaded |
| C-S20 | Delete account | `c_s20_delete`, `c_s20_undo`, `c_s20_export_first` | none | T0 | The existing catalogue event `account_deletion` is proposed for retirement (section 8) |
| C-S22 | Delete this book | `c_s22_delete_book` | none | T0 | The book is a child; never recorded |
| C-S02, C-S03 | Account, sign-out sheet | `c_s03_stay`, `c_s03_sign_out`, `c_s02_sign_out_other_devices` | none | T0 | E77: Sign out other devices sends no email and is not measured |
| AccountLayer | One screen, Sign out, over every route when another account holds the phone | `account_layer_sign_out` | none | T0 | NS-10-R3, R5; a count of "another account held this phone" is a trace of a household. Verified by test on a device only |
| C-S21 | Recording backup (flip only; row absent today) | `c_s21_turn_on`, `c_s21_stop` | `backup_consent_sheet` | not built; flip-time design in section 7 | NS-08 door lines; the server holds the PRIV-R21 consent row already |
| C-S23 | Privacy (sheet "Stop syncing letters?") | `c_s23_stop_syncing` | none | T0 | E46: the withdraw control; not measured (a withdrawal is the thing we must not trace) |
| E-S14 | Sign-in outage | `e_s14_try_again` | none (the view is `screen.e_s14.viewed`) | T2 | NS-41; error class only |
| Held screen (`Finish setup`, `Try another way`, `Try again`, `No book here yet`) | NS-10 held screens | `held_finish_setup`, `held_try_another_way`, `held_try_again`, `held_start_a_book` | `held_screen` with `reason` (closed list in section 2b) | T1 for reason counts, T2 for control taps except `held_try_another_way` | `deleted_elsewhere` is T0 (it says another phone deleted an account). `wrong_account` shows the method, never the email (NS-10-R12) |

Not listed because the IA has no screen for them: notices sent by email (E76 to E78). They are emails; nothing on a phone echoes them (E76 ruling 4), so there is nothing to measure on a screen.

Impression to click rates: only for C-S06 (slip to Save a copy), C-S04 (view to Save), C-S12 (shown to dismissed), C-S08 (view to Save a copy). A rate is reported as "x of n", never a percentage under n of 20 (FR-DAT-08), and never as a target for a person to meet (no streak, no count of gaps, FR-DAT-03).

## 4. Table 2: funnels

Funnels are counted as step totals by week, never as a per-person path, and never across T0 steps.

| Funnel id | Ordered event names | Drop-off question | Tier |
|---|---|---|---|
| `f_keeping_copy_from_slip` | `ui.slip_save_a_copy.impressed`, `ui.slip_save_a_copy.tapped`, `screen.c_s04.viewed`, `ui.c_s04_save.tapped`, `keeping.export.finished`, `keeping.export.shared` | Does the birthday slip lead to a copy, and where does a copy fail | T1 and T2; counted as step totals by week |
| `f_keeping_copy_from_me` | `ui.c_s01_row_save_a_copy.tapped`, `screen.c_s04.viewed`, `ui.c_s04_save.tapped`, `keeping.export.finished` | Is the row found in two taps (NS-11-R1) | T2, T1 |
| `f_keeping_new_phone_book` | `screen.c_s10.viewed`, `ui.held_screen.impressed`, `perf.new_phone_book_ready.measured` | Does the Book appear within 10 s (NS-10-R0, R2) | T1, T2 |
| `f_keeping_find_copy_path` | `ui.c_s01_row_where_live.tapped`, `screen.c_s08.viewed`, `ui.c_s08_open_save_a_copy.tapped`, `screen.c_s04.viewed` | Does the parent find the real second copy | T2 |
| no funnel id (denied) | none (T0) | not measured | Hand-sent only: "something I let go came back" (FR-DAT-17) |
| no funnel id (denied) | none (T0) | not measured | Purge receipts as T3 totals |
| no funnel id | `screen.c_s13.viewed`, `ui.c_s13_show_all.tapped` only | not measured | T2 |

The ids `f_keeping_let_go`, `f_keeping_delete` and `f_keeping_decline` are denied names. Funnels deliberately absent: a "deletion funnel", a "decline funnel", a "version restore funnel". They would all be an ordered per-person trace of a trust act.

## 5. The deeper questions, step by step

Each row: the question; the signal; what is not measured and why; success measure and proposed target (PROPOSED, baseline first); guardrail (zero-target harm measure); observability signal; report and reader; release gate. Targets here are written only where a baseline cannot be invented; "baseline first" means the first tester rounds set it.

### 5.1 Save a copy of the year (NS-11, C-S04, C-S05, C-S06, C-S07)

- Question: do families make a second copy, and does it work on their phone?
- Signals: T2 impressions and taps from Table 1; T1 weekly summary with the `keeping.summary.sent` properties `export_finished` and `export_failed_total`, and `keeping.export.finished` size and duration buckets. Error classes (closed, from NS-11 and `catalog.ts` `export_failed.reason`): `cancelled`, `low_space`, `too_large`, `check_failed`, `destination_refused`, `unknown`. `export_shared.result` (`shared`, `dismissed`) folds into the weekly totals.
- Not measured: letters, recordings, pictures or books in a copy (the card forbids counts on screen; a count of a person's book is a profile); which book was chosen; file name (NS-11-R11); when in the birthday week it happened; age. The existing `export_started.letters_bucket` is proposed for retirement: it ties a size of a book to a person at a moment.
- Birthday trap: an event timestamp inside the birthday week reveals a date of birth (catalogue header: "no event may fire at a time set by a child's birthday"). The slip impression is therefore T1 only (a weekly count of slips shown, no day), not T2. C-S06 moves to T1 in the table where this matters; the table says T2 for taps and the implementation sets the week bucket and drops the day. `data-steward` decides.
- Success: the share of finished copies among started copies, tracked as a rate by week, with its first 4 weeks setting a baseline. PROPOSED: no target until the baseline exists. A completed copy within 2 minutes on the SE 3 for the year-1 fixture is already a card gate (NS-11-R18) proven on a device, not by analytics.
- Guardrails (zero target): a copy missing something stored (`audio_missing` or `audio_mismatch` above 0 on a device with the recording present) is a report (FR-DAT-13, FR-DAT-14), hand-sent, severity 1. A temp ZIP left behind after a kill (NS-11-R23) is a test, not a metric.
- Observability: error class counts above; duration bucket (30 s, 2 min) tied to NS-11-R18 and the 2-minute budget in `NFR-BUDGETS.md` (UNVERIFIED line); no path, size in bytes, or file name in any log.
- Report: weekly keeping read-out in `docs/research/` (aggregate; reader: the founder, `product`). Release gate: analytics build flag off; consent sheet wording and label change by the founder and counsel.

### 5.2 Let it go always finishes (NS-09, A-S11, C-S18)

- Question: does a let-go ever leave a recording on the phone?
- Signals: none per act (T0). One T1 phone-local count: the number of drafts in `discarding` after the 3rd launch, bucketed (`0`, `1`, `2_plus`), added to the weekly summary. It reads the existing `discard.failures.<draft id>` settings key (NS-09-R15) only as a count, never the draft id.
- Not measured: how often parents let go, how long a take was, why. A rate of letting go is a profile of what a parent does not want kept.
- Success: stuck recordings after 3 launches is 0 across the weekly totals. A nonzero week is a defect, not a ratio.
- Guardrail (zero target): "something I let go came back" arriving by any channel (FR-DAT-09, FR-DAT-17). Severity 1.
- Observability: error class on the phone only (`delete_failed`, `file_missing`), written to the device fault log of four fields (kind, code from a fixed list, id, time) per `OBSERVABILITY-WITHOUT-CONTENT.md` section 3; the id there is the one existing field and stays on the phone (UNVERIFIED that no upload path reads it; `ops` and `data-steward` to confirm).
- Report: weekly keeping read-out. Release gate: a test that the sweep module imports no analytics code (section 9).

### 5.3 A new phone (NS-10, C-S10 to C-S12, held screens)

- Question: does a returning parent see their book within 10 seconds, and what do they meet when they do not?
- Signals: T2 views of C-S10, C-S11, C-S12; T1 weekly buckets: `book_ready_bucket` (`lt_10s`, `10_30s`, `gt_30s`) and `held_reason_counts` (closed list in Table 1, excluding `deleted_elsewhere`). Server side (T3): sync pull duration histogram for the first pull, already logged with closed enums in `supabase/functions/_shared/log` (UNVERIFIED which event).
- Not measured: how many letters or recordings arrived; the method of sign-in used on the wrong account (it names a person's choice); decline of Terms by person (T0); the reason an account has no book.
- Success: share of new-phone arrivals showing the Book in under 10 seconds, baseline first. Budget already on the card: 10 s for list and children, 30 s for one year of text on LTE (06-nfr lines 140 to 141, per NS-10 section 6). Proposed target: none until 20 or more arrivals exist (FR-DAT-08).
- Guardrails (zero target): child step shown to a returning account (NS-10-R0); another account's letter, recording or child name shown (NS-10-R3, R5); duplicate letters after restore plus sign-in (NS-10-R6). All three are detected by tests and device rows and by hand-sent reports. None is a metric. A product event "wrong account saw another's book" would itself be the breach.
- Observability: error classes for the pull (`offline`, `timeout`, `server_error`, `kill_switch`), counted at T1; no account id, no book id.
- Report: weekly keeping read-out, plus the founder's device rows (D13). Release gate: consent plus label; Drop D stack is the build that includes these screens (E43).

### 5.4 Where do my letters live (NS-08 today, C-S08, C-S09)

- Question: do parents understand which copies exist, and do any claim backup that is not on?
- Signals: C-S08 view and its two controls (T2). T1 phone-local bucket of "letters whose recording is not on this phone" is NOT sent; it would be a count of a household's loss. It is shown nowhere (FR-DAT-03) and used only in tests.
- Success: tester question "Is iCloud Backup on for this iPhone? (yes / no / don't know)" as x of n (NS-08 section 21). No analytics substitute; the app cannot read that setting and must not try.
- Guardrail (zero target): any line in app, store listing, site or Save a copy that implies a recording survives loss of the phone (NS-08-R7). Detected by the claims check per store candidate; not a metric.
- Observability: `EXPO_PUBLIC_BACKUP` off in every store profile (NS-08-R5) checked by the preflight; a CI line that prints the flag per profile is the signal.
- Report: release checklist. Release gate: R5 and R7 pass.

### 5.5 Deletion, erase, Recently deleted, Delete account (NS-36, NS-37, NS-45, C-S17, C-S19, C-S20, C-S22)

- Question the team needs answered: is every deletion complete on the published 31, 38 and 45 day clock, and does anything deleted ever come back or stay in a copy? Not: how many people delete.
- Signals: T3 server totals only: purge worker receipts by step status per week (`DELETION_AND_EXPORT_SPEC.md` execution table, receipts), counted as completed on time, completed late, failed; no account id in the report. On the phone: nothing sent. Phone-side proof is tests (NS-36-R1a to R1d, NS-37-R5).
- Not measured: requests, undos, reasons, timing of a request, whether an export was offered or taken first, restore from Recently deleted, purge of one letter, which pictures were erased. `analytics-forget` is a function that clears events at request time (DELETION_AND_EXPORT_SPEC line 89); the request must not itself create an analytics event (R-K3).
- Success: 100 percent of purges complete inside the clock. This is a published promise, not a target we chose; the reading is "x of n", with a late purge a severity 1 incident.
- Guardrails (zero target): a deleted letter, picture, first, seal or Find row reappearing, or missing from a copy (NS-36, FR-DAT-09). Delete follows the letter in one step (NS-36-R1a).
- Observability: purge receipt statuses and `analytics-forget` outcome counts as server totals; the Resend 30-day retention exception is already stated in the spec (line 89).
- Report: weekly deletion-clock line in the keeping read-out (reader: the founder, `ops`, `privacy`). Release gate: `data-steward` confirms the receipts query returns no per-account row to the reporting role.

### 5.6 Earlier versions (NS-12, C-S13, C-S14)

- Question: is the list found and used by the author?
- Signals: list view and `show_all` taps (T2). Restore, remove and open of one version are T0.
- Not measured: how many versions a letter has, how many letters have versions, restores per person. A count of edits to a person's own words is a profile of their editing; and it brushes the constitution (CLAUDE.md: no feature may "shape" words).
- Success: none proposed; a feature that is off by default (`EXPO_PUBLIC_EARLIER_VERSIONS`) is judged by tester question later.
- Guardrails: another author's version fetched or shown (NS-12-R8); `raw_transcript` changed (NS-12-R3). Tests; the database trigger already makes the raw transcript immutable.
- Release gate: not instrumented in the first dark build; Table 1 rows are reserved ids only.

### 5.7 Consent, sign-out and security notices (E76 to E78, NS-45, NS-08-R21, C-S03)

- Question: does a security notice behave as ruled, without us counting it?
- Signals: none. E76 sends only notices the sign-in service already sends, email only, no screen echoes them. E77: Sign out other devices sends no email; wrong codes send none; the phone pauses after 5 in 15 minutes and says so. E78: the new-device email is not built for 1.0 and is gated before the backup flip. A counter of alert emails would be a record of account-security events per household.
- One allowed aggregate, server side only, T3: the alert cap of E81 (20 per account per day, 5 an hour then folded) is a rate limit; the counter that enforces it lives with the sender, is operational and is not exported. `security-architect` and `ops` own it; PM3 asks that it reports only "cap hit: yes/no, count", never an account, if it ever reports at all (UNVERIFIED that any sender will exist at 1.0; E81 says none is built).
- Guardrails (zero target): a security email is sent for a repeated wrong code (E77); "We will sign that device out" shown before a lever and a stop page exist (E78); no marketing email to an app address (E75, `LEGAL-REQ-053`). Tests: one content test per template class, as E75 says; a unit test that the line is not reachable until the lever exists.
- Report: none. Release gate: NS-08-R21 and a `security-architect` read before the flip.

## 6. Performance and observability, in this area

Taken from `MEASUREMENT-PLAN.md` section 4 and `NFR-BUDGETS.md` (read; line numbers UNVERIFIED for the budgets file). Markers use closed names only, durations in milliseconds, no ids.

| Marker | Where | Budget (from the cards) | Signal |
|---|---|---|---|
| `export_duration` | Save a copy | year-1 fixture under 2 minutes in airplane mode on an SE 3 (NS-11-R18); progress within 500 ms (R24) | device run sheet; T1 duration bucket |
| `new_phone_book_ready` | C-S10 | list and children p95 10 s; one year of text p95 30 s on LTE (NS-10 section 6) | T1 bucket; device row S1-204 |
| `launch_sweep_discarding` | NS-09 | 50 drafts within 2 s off the UI thread; empty sweep under 5 ms (NS-09-R5, R13; PROPOSED) | device row, not sent |
| `second_phone_freshness` | NS-10-R14 | 30 s p95 in the foreground | device row |
| `copy_decode`, `index_rebuild` | NS-37 | list copy first decode p95 50 ms (NS-37-R7; PROPOSED) | device row |

Crash and error reporting: with analytics off, crash numbers come from Apple's App Store Connect and Xcode Organizer for users who opted in to share with developers (FR-DAT-16), which is free and needs no new tool. Error classes in this area are the closed lists above. Alerting: none at 1.0 (no remote sender, E79; no alert sender, E81); a weekly read of the T1 summary and the purge receipts is the alert.

## 7. The flip-time design for backup and escrow (NS-08, dark)

The backup flip is not 1.0. These signals are written now so the flip build does not invent them, and they are T0 or T1 only:

- Never evented: consent given or withdrawn (the server holds the PRIV-R21 row already); escrow unwrap, recovery key access (the log of unwraps is the security record, emailed to the owner by design, D-102); which recordings are on the server.
- T1 weekly, server side: `backup_upload_failed_by_class` (`offline`, `quota`, `server_error`, `kill_switch`) as a count; storage used against the 500 MB revisit line (NS-08 section 2) and the weekly egress and storage check (condition 6). That check is an operational number the founder already needs.
- NS-08-R12 (offline uploads drain within 1 hour of Wi-Fi) is a device row.
- Nothing from `backup_failed` in the catalogue ERROR_CODE list reaches the person-level stream (proposed in section 8).

## 8. What we propose to change in the current catalogue (no erratum needed; implementation phase)

These are proposals to `analytics` and `data-steward` against `packages/analytics/src/catalog.ts` at schema version 8, read this session. They touch no locked statement; the locked rows say nothing about the catalogue.

| Existing entry | Problem | Proposal |
|---|---|---|
| `account_deletion` (stages `started`, `export_offered`, `confirmed`, `undone`) | A per-id trace of a deletion decision, with an `undone` stage; `confirmed` is "the last event ever sent for this id" | Retire. Deletion becomes T0 on the phone and T3 on the server (section 5.5). If kept for any reason, only the weekly T1 total |
| `letter_deleted` (`deleted`, `restored`; destination) | A per-id trace of deleting and restoring letters; destination reveals a private letter | Retire (T0) |
| `export_started.letters_bucket` | Ties the size of a book to a person at a moment | Drop the property; keep `export_started` only inside the T1 weekly totals |
| `export_completed`, `export_failed`, `export_shared` | Fine as props; wrong as per-id events in sequence | Fold into the T1 weekly summary; keep the class lists |
| `ERROR_CODE.backup_failed` | Exists while backup is off | Keep in the closed list; never reachable until the flip; test that nothing emits it in a store profile |
| `ROUTE` includes `settings_delete_account`, `settings_export`, `settings_storage` | Route names are fine as screen ids, but a `screen_viewed` on delete-account breaks R-K3 | Remove `settings_delete_account` from the route list (T0); keep the others |

Proposed change box (for the founder, no new erratum unless the founder wants the rule locked): the locked pack has no sentence that says "deletion and security acts are never measured". Karma may wish to lock R-K1 to R-K3 as an erratum E84 (E83 is taken by the `data-steward` withdrawal box in PR #1037) so a later PM or analyst cannot add `account_deletion` back. Default: write it as a catalogue test (section 9) and not as an erratum; the test blocks the same thing and costs nothing to keep.

## 9. The test that proves no content, and no trace

Tests live with the catalogue and the keeping modules; all use only the fictional family Asha (CLAUDE.md; `no-real-family-data.test.ts`). Proposed titles:

1. `[IN-K1] keeping allowlist is closed`: every event name is in the registry (section 2b) and every property of every keeping event is a closed union or a bounded integer; a property named like an id, path, name, email, date, or free text fails.
2. `[IN-K2] denied names emit nothing`: with analytics forced on in a test and a recording sink, driving every T0 flow of Table 1 (let it go, erase, delete account, delete book, decline agreement, version restore, sign-out, Recently deleted) records zero calls.
3. `[IN-K3] no analytics import in destructive flows`: a source scan that the modules for sweep, erase, purge, delete-account, sign-out and returning-consent import no analytics module (pattern: `photos-device.test.ts` keeping picker packages out, per ADOPTION-RULES 3).
4. `[IN-K4] weekly summary is unlinked`: the T1 summary carries no analytics id, uses a new random id per send, has no field finer than the ISO week, and every count is one of the allowed buckets; it is never built when consent is absent.
5. `[IN-K5] fixtures through every path`: Asha text, child name, a recording path and a media id pushed through export, let-go, erase, versions and the held screens; none appears in any emitted payload or log line (canary shape of `supabase/functions/_shared/log/canary.test.ts`).
6. `[IN-K6] consent withdrawn stops the summary`: after withdrawal no summary is queued or written, and the queue file is cleared.
7. `[IN-K7] birthday trap`: no event in this area has a timestamp field finer than the week for the slip; no event fires at a time computed from a birth date or due date.
8. `[IN-K8] off in 1.0`: every 1.0.x profile has analytics off and no client is constructed (FR-DAT-01; existing check, extended to the keeping module).

## 10. Consent, label and counsel (founder)

Everything marked T1 or T2 needs: the analytics consent sheet and its wording, the App Store privacy label change (today "no usage or diagnostics data"), the Privacy Policy section, counsel's read, and the founder's decision (D-095, D-124 item 3 supersede D-003 for 1.0). The door lines (Shown, Records, Never, Decline) for that consent belong to the founder and `privacy` and are not drafted here (PRIV-R21). What PM3 asks for in that sheet: say that the weekly summary is counts that cannot be linked, and that deleting, erasing, letting go and signing out are never measured. That sentence is true only if section 9 passes.

## 11. Open source first, and the free-only rule

Founder rule, binding from 20 Nov: only completely free, open-source tools that fit our stack. No paid product or tier. Facts below are from the charter and from files read this session; licence, price and self-host claims about outside tools are UNVERIFIED (not fetched this session) and the data and ops partners own the stack decision.

| Need | Option checked | What it would hold for this area | Verdict for PM3 |
|---|---|---|---|
| Event and funnel store | PostHog (MIT core per the charter, UNVERIFIED; already in `packages/analytics/src/posthog.ts`, 282 lines) | T2 events and the T1 weekly summary only | Adopt for T2 and T1 if `analytics` and `ops` confirm a free self-hosted path. A hosted free tier is still a tier of a paid product and is out under the new rule unless the founder says otherwise. Open: self-hosting needs a host we do not have; `data-steward` (PR #1037, section 1) reports a Docker Compose deploy that is free to download, officially unsupported, with a stated minimum of 4 vCPU, 16 GB RAM and 30 GB storage (their read of the PostHog self-host page, 20 Nov; I did not re-read it). Supabase and Vercel do not run it (UNVERIFIED), so cost is not zero. Default: nothing is hosted until the founder decides; the keeping read-out uses tester numbers, purge receipts and SQL |
| Reporting on Postgres | Supabase Studio and plain SQL views (already in the stack); Metabase OSS or Apache Superset (OSS; need a host, UNVERIFIED) | T3 purge receipts and sync durations, k-anonymised | Adopt SQL views and Studio. Metabase and Superset wait for `data-architect` |
| Crashes | Apple App Store Connect and Xcode Organizer (free, opt-in users only; FR-DAT-16); Sentry or GlitchTip (OSS options; hosting cost UNVERIFIED) | Crash signatures, no content | Adopt Apple's for 1.0 line; the OSS tools wait for `ops` |
| Server traces and metrics | OpenTelemetry (OSS) with the existing `_shared/log` closed enums | Closed enums, durations | Not for PM3: `ops` |
| Drift | Simple SQL | counts | Adopt |
| What we build | The closed allowlist, consent gate, validators, the section 9 tests | n/a | Build; the thin layer nobody sells (charter) |

New dependencies: none proposed. Any later package needs the founder (package.json is founder-only) and the adoption rules in `docs/engineering/readiness-20nov/libraries/ADOPTION-RULES.md` (permissive licence, SDK 57, no hidden network, label step).

## 12. Proposed implementation backlog rows (IN-nn; real BL ids come from product)

Working ids only. Owner roles are agent roles. "Founder hands" means a founder account, decision, device or secret is needed.

| Id | Wave | Title | Owner role | Size | Depends on | Founder hands | Satisfies |
|---|---|---|---|---|---|---|---|
| IN-K1 | 1 | Keeping registry rows (section 2b), denied names and the closed id list for screens and controls (Table 1) as a typed list plus the closed-allowlist test `[IN-K1]` | analytics engineer | M | analytics partner schema convention | no | FR-DAT-01 (stays off), NS-11, NS-10 |
| IN-K2 | 1 | T0 emit-nothing test and the no-import source scan (`[IN-K2]`, `[IN-K3]`) | qa, mobile | S | IN-K1 | no | NS-09, NS-36, NS-45 |
| IN-K3 | 1 | Retire `account_deletion`, `letter_deleted`, `export_started.letters_bucket` and the delete-account route from the catalogue, and map the surviving `export_*` events to `keeping.export.*` as new events with the old ones deprecated with a date (brief item 6); bump the schema version and fingerprint | analytics engineer | S | IN-K1; `data-steward` agrees | no | R-K1 to R-K3 |
| IN-K4 | 2 | T1 weekly keeping summary: bucketed counters, fresh random id per send, ISO week only (`[IN-K4]`, `[IN-K6]`, `[IN-K7]`) | mobile, analytics engineer | M | IN-K1, IN-K3 | no | NS-11, NS-10, NS-09 |
| IN-K5 | 2 | Screen, tap and impression wiring for C-S04, C-S06, C-S08, C-S10, C-S12 under the flag, inert by default | mobile | M | IN-K1 | no | NS-11, NS-10, NS-08 |
| IN-K6 | 2 | Canary fixtures through export, let-go, erase, versions, held screens (`[IN-K5]`) | qa | M | IN-K2 | no | NS-36-R12 |
| IN-K7 | 3 | Weekly keeping read-out in `docs/research/`: format, SQL view for purge receipts and sync durations (no per-account row to the reporting role) | data-architect, product | M | `data-steward` and `data-architect` files | no | FR-DAT-08, FR-DAT-17, NS-36 |
| IN-K8 | 3 | Flip-time rows reserved for NS-08 (R9, R21): server totals for upload failure classes and storage against the 500 MB line | ops | S | NS-08 flip decision | founder decides the flip | NS-08 |
| IN-K9 | 4 | Consent sheet sentence and label change draft for T1 and T2 (door lines) | privacy, content | S | IN-K4 designed | yes: founder and counsel | PRIV-R21, FR-DAT-01 |
| IN-K10 | 4 | Founder decision: free-only hosting path for PostHog or no hosting (section 11) | founder with ops | n/a | `analytics` and `ops` files | yes | founder rule 20 Nov |

## 13. For the CPO: decisions and risks

Decisions (real ones only, each with a default):
1. Lock tiers T0 to T3 and R-K1 to R-K3 as an erratum E84, or enforce by catalogue tests only. Default: tests only (section 8).
2. Retire `account_deletion` and `letter_deleted` from the catalogue. Default: retire.
3. Send a weekly T1 summary with a fresh random id per send, accepting that per-install retention for these counters is lost. Default: yes, dark.
4. Treat a returning parent declining Terms (C-S11) as T0 even though a decline rate would help. Default: T0; the server already holds acceptances (NS-10-R7).
5. Hosting for any event store. Default: none until the founder decides; use tester numbers, purge receipts and SQL.
6. Whether C-S06 (the birthday slip) is T1 week-only, because a day inside a birthday week hints at a date of birth. Default: T1 week-only.

Risks:
- The partner file is not available to read; classification and retention choices here may be revised by `data-steward`. Not a conflict, a dependency.
- IA-FINAL is on an unmerged branch (#1033); screen ids may move. UNVERIFIED which of C-S09, C-S13, C-S14 have routes on develop (IA-FINAL open item OI-17).
- The line between "count" and "profile" is a judgement; a weekly count of 1 from a small tester base can be one family. Reports follow FR-DAT-08: pooled when under 5, "x of n" under 20.
- The existing catalogue has events already shipped in code (inert) that this file proposes to retire; changing them needs a schema version bump and its fingerprint (`SCHEMA_FINGERPRINTS`).
- Contradicts the locked pack: nothing found. Tension noted: FR-DAT-17 (tally by hand) and this file both leave "lost" and "came back" to hand-sent reports, which depends on testers writing in.
- Free-only rule: PostHog and any BI tool need a host; "free" is not "zero cost" until hosting is decided (UNVERIFIED).
