# Theme 6: Recording that behaves, from the first minute

Readiness: 26 of 28 (audit 8 Nov: 17). Author's re-score, `qa` to confirm. Remains: `content` writes the words for the full-phone finish screen and the download choice (C5); `design-systems` reads the finish-failed screen (C7); R6 and R8 need real people and an iPhone SE 3 (C14). R1 to R4 can start now.

| | |
|---|---|
| Working label | NX-06 (working id, see `_CONVENTIONS.md`) |
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
| NX-06-R2 | EVIDENCE | Given a phone with under 1 MB free and a take being finished, When saving fails for space, Then a screen says the phone is full, offers Keep, and the draft row is still there. | On develop a save that throws for space leaves Listen with no message: `apps/mobile/src/app/listen.tsx` `endTake` sets `draft = kept.ok ? kept.value : null` and then goes back or home. `phoneFull` (`strings.en.ts` line 1064) only covers a take that cannot start (`startBlocker`). | BL-734; readiness file section 2 |
| NX-06-R3 | EVIDENCE | Given a save that takes over 3 seconds (`FINISH_TIMEOUT_MS`), When the timeout fires, Then the parent lands on Review with the draft id, not home. | On a timeout or failure `endTake` in `listen.tsx` sets `draft` to null and calls `router.back()` or goes home, not Review (`FINISH_TIMEOUT_MS = 3000` is in `listen.logic.ts:296`; the take itself is kept by the launch sweep). | Readiness file section 2 |
| NX-06-R4 | EVIDENCE | Given an alpha build, When letters 1 to 100 are kept, Then all 100 are free, letter 101 meets the Keep sheet with the alpha note, and the needs-Plus line shows at 99, 100 and 101 in 0 of 3 cases. | No test pins the run (BL-736). | Readiness file section 2 |
| NX-06-R5 | HYPOTHESIS | Given a speech pack download of N MB on cellular (the test throttles to 1 Mbit/s so the download outlasts the check), When the sheet shows, Then it shows `wordsCopy.pack.sizeLine`, offers Wait for Wi-Fi (existing `waitingForWifi`) and Keep recording, and the parent can save 1 letter before the download ends. The 40 MB budget in theme 5 is the whole app download and has nothing to do with this row. | The sheet shows a size line and a waiting line with a percent (`letter/[id].tsx` lines 584 to 589) and no choice between waiting and recording (#662 only fixed a 0% line). | Opportunity 4; D-121 risks |
| NX-06-R6 | HYPOTHESIS | Given an iPhone SE 3 held in one hand by 5 people who are not on the team, When each sets a date of birth and a due date, Then 10 of 10 taps land on the intended date and the saved date is the one shown; the run is recorded in `docs/qa/evidence/`. | The founder flagged the picker in the alpha; no run exists. | Task brief 8 Nov; opportunity 2 |
| NX-06-R7 | EVIDENCE | Given terms and privacy links, When opened, Then the page reads plainly and Back returns to the same screen, 2 of 2 links. | Founder flagged consent links. | Opportunity 3 |
| NX-06-R8 | HYPOTHESIS (research task, owner `user-research`; not a build row) | Given a parent who found the app cold, Then median time to the first saved letter is 90 seconds or less. The build-side number is already a gate in `06-nfr.md` (median 90 s over 10 scripted runs on an SE 3, F03-REQ-008); this row is the stranger study. | No measurement on a stranger. | UR R1; `02-customers.md` U1 |
| NX-06-R9 | EVIDENCE | Given a local database upgrade on the year-5 fixture (1,200 letters), Then the migration succeeds 20 of 20 runs. | Issue #533: web journey J13 `local_db_migration_failed` under load. | Feasibility R6 |

**Shown / Records / Never / Decline:** the consent and age parts belong to theme 3. This theme records nothing about a person.

## Edge cases

Call or alarm during a take; headphones removed; microphone permission refused (the app explains and keeps the text path); background kill; airplane mode; AX5 text; Reduce Motion; second child profile; low battery.

## Offline behaviour

Recording, saving, hearing back, Review and export all work with no network. Words may wait for the speech files; the take is kept first (save before anything else).

## What we never do

Edit words beyond the allowed edit types; show a spinner that hides "saved"; discard a take on an error; count missed days.

## Copy needs (packages/content)

Existing, checked 8 Nov: `phoneFull` (title, body; a take that cannot start, keep its meaning), `wordsCopy.pack.sizeLine`, `wordsCopy.pack.waitingForWifi` and `speechSettingsCopy.waitingForWifi`. There is no `speech` namespace. New keys: group `finishFailed.noSpace` with `title`, `body`, `keep` beside `phoneFull` in `strings.en.ts` (the finish case: the take is kept and Keep is offered), and one `wordsCopy.pack.recordNow`. Words by `content`, no fear or guilt language; the full-phone text states what is kept.

## Analytics events (opt-in, content-free, names only)

Existing: `capture_started`, `capture_discarded`, `letter_saved`, `error_shown`, `pack_download`. New, not in `packages/analytics/src/catalog.ts` (checked 8 Nov), so add each to the catalog and `TRACKING_PLAN.md` first: `phone_full_shown` (no property), `download_choice` (property: wait or continue). Sends nothing in 1.0 (D-124).

## Device rows

S1-39 (SE 3, under 1 MB), S1-13, DL-01, DL-02, B2-11. New: "date picker one-handed", "download choice on cellular".

## Dependencies

#595 merged. #615 and #618 both touch `listen.tsx`: the one whose test fails on develop first is merged and the other closed (founder decision below). The global error handler (NX-02-R8). Words for BL-734 (content). Feasibility R1 evidence files.

## Founder-only decisions

| Decision | Recommended default |
|---|---|
| Which of #615 or #618 closes | Karma picks the one whose test fails on develop and merges first |
| Alpha ceiling wording (after 9 Nov) | Follow BL-604 |

## Engineering block (cross-cutting, added 8 Nov 2026 after the readiness audit, G-31 to G-37)

| Line | This theme |
|---|---|
| API contract (`packages/api`) | None. Recording is on the phone. The speech file manifest is existing (`packages/api/src/pack-manifest.ts`); no change. |
| Budget (`06-nfr.md`) | Tap Speak to microphone live: p95 500 ms. Local save commit, 2-minute take: p95 200 ms. Finish to Review on screen, 2-minute take: p95 400 ms. First launch to first saved letter: median 90 s or less (10 scripted runs, SE 3). The finish timeout stays 3 s (`FINISH_TIMEOUT_MS`). Local database upgrade on 1,200 letters: succeeds 20 of 20 (R9). |
| Accessibility | Full-phone finish screen and the download choice: AX5, 0 clipped lines; VoiceOver reads the title, what is kept, then Keep; tap targets 44 pt or more; Reduce Motion: no motion beyond fade. Date picker: VoiceOver adjustable value reads the full date. Device rows S1-39 and the two new ones. |
| Switch, off behaviour, noticed by | No kill switch (local feature). Rollback: the previous build; the saved take is never at risk because save comes first. Noticed by: `error_shown` and `capture_discarded` when analytics are on; in 1.0 by the device rows and the kill harness (B2-11) before each release candidate. |
| Data class and retention | Audio and transcript: L4, on the phone only (no backup in 1.0). A take kept after a failed save stays as a draft until the parent acts. No new stored field. |
| Schema and grants | No schema change. R9 is about the local database upgrade path (`apps/mobile/src/lib/db/migrations.ts`), which is device-only and has no grants. |
| Analytics events | capture_started, capture_discarded, letter_saved, error_shown, pack_download: in catalog. phone_full_shown, download_choice: add to catalog first. |

## Trace and tests

Id convention: `_CONVENTIONS.md`. A test title starts with the bracketed id. Paths marked "proposed" do not exist yet; the PR that adds the test names the real path.

| Id | Refines | Test (layer, file, title) | Device or ops row |
|---|---|---|---|
| NX-06-R1 | F04-REQ-048 | kill harness `apps/mobile/test/qa-kill-harness.test.ts` (exists) plus the 500-run device harness; `[NX-06-R1] draft survives a kill during save, 500 of 500` | B2-11, DL-01, DL-02 |
| NX-06-R2 | BL-734; BL-563 | mobile unit (proposed `apps/mobile/test/finish-no-space.test.ts`); `[NX-06-R2] save fails for space, screen offers Keep and the draft row remains` | S1-39 |
| NX-06-R3 | BL-563 | mobile unit (proposed `apps/mobile/test/finish-timeout.test.ts`); `[NX-06-R3] a save over 3 s lands on Review with the draft id` | S1-13 |
| NX-06-R4 | BL-736 | mobile unit (proposed `apps/mobile/test/alpha-allowance.test.ts`); `[NX-06-R4] letters 1 to 100 free, 101 meets Keep with the alpha note` | none |
| NX-06-R5 | opportunity 4 | mobile unit on the sheet state plus a throttled-network device run; `[NX-06-R5] sheet offers wait or keep recording and a letter can be saved` | new: download choice on cellular |
| NX-06-R6 | opportunity 2 | device run, evidence file; Test: none, device | new: date picker one-handed |
| NX-06-R7 | opportunity 3 | mobile unit on the link handler (proposed); `[NX-06-R7] Back returns to the same screen, 2 of 2 links` | S1-03 |
| NX-06-R8 | UR R1 | Test: none, study (`user-research`) | none |
| NX-06-R9 | feasibility R6; #533 | mobile migration test on the year-5 fixture (`apps/mobile/test/migrations.v9.test.ts` pattern); `[NX-06-R9] upgrade succeeds 20 of 20` | none |

Trace: NX-06-R1..R9 -> F03, F04-REQ-048, F05, BL-563, BL-734, BL-736.

## Not verified

The tester count and exact wording of the four alpha reports. Whether the 90-second target holds for a cold parent.
