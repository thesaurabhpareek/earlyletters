# Theme 6: Recording that behaves, from the first minute

| | |
|---|---|
| Working label | NX-06 (id: to be assigned) |
| Refines | F03 (first run), F04-REQ-048, F05, BL-563, BL-734, BL-736; opportunities 1 to 5 in `01-customer-needs.md` |
| Tag | EVIDENCE for the need: 41 of 104 negative or mixed reviews (39%) in the category are about bugs, crashes, sync or lost work (R2 section 0 item 1, via `01-customer-needs.md` rank 1). Four founder-flagged alpha problems (Listen and recording, date-of-birth picker, consent links, first download wait): details NOT VERIFIED beyond the list; alpha group is friendly and close to the founder. HYPOTHESIS for every effect on keeping |
| Size | M. Feasibility R1, R6, R11 and R12 are the reliability rows; items by PR are XS to S |
| Gate | None external. Founder runs the iPhone SE 3 rows |
| Order | 6 of 12 (it runs beside themes 1 to 5 in agent time; it is placed here because it needs no founder dashboard) |

## What the parent will see and do

They tap Speak and it records, every time. They hear it back at once. They see the word "saved" before anything else happens. If the phone is nearly full, a screen says so and offers Keep; the take is not lost. When speech files need to download, the app says how big they are, offers to wait for Wi-Fi, and lets them keep recording while the words catch up. The date-of-birth step takes a few easy taps with one hand. The Terms and Privacy links read plainly and return them to where they were.

## The check

| Label | Tag | Given, When, Then | Fails on old code because | Source |
|---|---|---|---|---|
| NX-06-R1 | EVIDENCE | Given a recording is killed during save, When the app reopens, Then the draft exists, 500 of 500 runs (0 lost). | Harness in progress; the full run belongs to the freeze commit. DL-01, DL-02 not run on an SE 3. | B2-11; gap map 1.5 |
| NX-06-R2 | EVIDENCE | Given a phone with under 1 MB free and a take being finished, When saving fails for space, Then a screen says the phone is full, offers Keep, and the draft row is still there. | Built nowhere (BL-563 acceptance 2; #618 says it does not claim it). | BL-734; readiness file section 2 |
| NX-06-R3 | EVIDENCE | Given a save that takes over 3 seconds (`FINISH_TIMEOUT_MS`), When the timeout fires, Then the parent lands on Review with the draft id, not home. | Two PRs (#615, #618) conflict on `listen.tsx`; neither merged. | Readiness file section 2 |
| NX-06-R4 | EVIDENCE | Given an alpha build, When letters 1 to 100 are kept, Then all 100 are free, letter 101 meets the Keep sheet with the alpha note, and the needs-Plus line shows at 99, 100 and 101 in 0 of 3 cases. | No test pins the run (BL-736). | Readiness file section 2 |
| NX-06-R5 | HYPOTHESIS | Given a speech file download over 40 MB budget path, When the sheet shows, Then it states the size, offers wait for Wi-Fi, and the parent can record 1 letter before the download ends. | Wait is shown as a line with a percent; no choice offered (#662 only fixed a 0% line). | Opportunity 4; D-121 risks |
| NX-06-R6 | HYPOTHESIS | Given a first-time parent on a phone, When they set a date of birth or a due date, Then the picker needs one hand and the saved date is the one shown, 10 of 10 manual tries. | Founder flagged the picker in the alpha. | Task brief 8 Nov; opportunity 2 |
| NX-06-R7 | EVIDENCE | Given terms and privacy links, When opened, Then the page reads plainly and Back returns to the same screen, 2 of 2 links. | Founder flagged consent links. | Opportunity 3 |
| NX-06-R8 | HYPOTHESIS | Given a parent who found the app cold, Then median time to the first saved letter is 90 seconds or less. Not yet measured on a stranger. | Target PS1 in `03-goals-and-principles.md` section 4.2; no measurement. | UR R1; `02-customers.md` U1 |
| NX-06-R9 | EVIDENCE | Given a local database upgrade on the year-5 fixture (1,200 letters), Then the migration succeeds 20 of 20 runs. | Issue #533: web journey J13 `local_db_migration_failed` under load. | Feasibility R6 |

**Shown / Records / Never / Decline:** the consent and age parts belong to theme 3. This theme records nothing about a person.

## Edge cases

Call or alarm during a take; headphones removed; microphone permission refused (the app explains and keeps the text path); background kill; airplane mode; AX5 text; Reduce Motion; second child profile; low battery.

## Offline behaviour

Recording, saving, hearing back, Review and export all work with no network. Words may wait for the speech files; the take is kept first (save before anything else).

## What we never do

Edit words beyond the allowed edit types; show a spinner that hides "saved"; discard a take on an error; count missed days.

## Copy needs (packages/content)

Keys to add: `listen.phoneFull.title`, `listen.phoneFull.body`, `listen.phoneFull.keep`, `speech.download.sizeLine`, `speech.download.waitForWifi`, `speech.download.recordNow`. Words by `content`, no fear or guilt language; the full-phone text states what is kept.

## Analytics events (opt-in, content-free, names only)

Existing: `capture_started`, `capture_discarded`, `letter_saved`, `error_shown`, `pack_download`. New: `phone_full_shown`, `download_choice` (property: wait or continue).

## Device rows

S1-39 (SE 3, under 1 MB), S1-13, DL-01, DL-02, B2-11. New: "date picker one-handed", "download choice on cellular".

## Dependencies

#595 merged. Pick one of #615 or #618. #617 (error handler). Words for BL-734 (content). Feasibility R1 evidence files.

## Founder-only decisions

| Decision | Recommended default |
|---|---|
| Which of #615 or #618 closes | Karma picks the one whose test fails on develop and merges first |
| Alpha ceiling wording (after 9 Nov) | Follow BL-604 |

## Not verified

The tester count and exact wording of the four alpha reports. Whether the 90-second target holds for a cold parent.
