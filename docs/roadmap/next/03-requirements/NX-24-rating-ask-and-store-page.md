# Theme 24: The store page shows the real app, and we ask for a rating once, kindly

Readiness: 23 of 28. Author's score, `qa` to confirm. Remains: the rating ask needs a native module, so it waits for a native build (C14); the founder's App Store Connect steps are listed apart as founder steps; Apple's rule on custom review prompts is UNVERIFIED (R1). The listing items are tracked in PR #587 (unmerged, ids to be renumbered, rank 4); this file carries the requirement behind them.

| | |
|---|---|
| Working label | NX-24 (working id, see `_CONVENTIONS.md`); backlog rank 28 in `../08-ranked-backlog.md` |
| Refines | F21 (store, web, legal pages), F21-REQ-033 (the review request; F21-REQ-005 and -010 are category/age rating and export compliance, not this), F13-REQ-020 (named in `docs/prd/v2/reviews/DISPOSITION-A.md`; its row was not found in the feature files, UNVERIFIED), the ratings-prompt item and the listing items in PR #587 (BL-621 to BL-638 as filed there), D-139, D-060, D-061 |
| Tag | EVIDENCE that the screenshots, listing and nomination are listed work (PR #587 body, read 8 Nov). HYPOTHESIS for any effect of a rating ask on ratings or on keeping |
| Size | S for the ask and the checks; the screenshots are the existing BL-340 |
| Gate | Apple 2.3 (accurate metadata) and the review-prompt rules. Founder: all App Store Connect entries. Counsel: only the D-061 line ("always kept") |
| Order | 24 (provisional) |

## What the parent will see and do

The store page shows the real app: screenshots from the release build with the fictional family Asha, an honest "early version" line if the founder keeps it, and English only. Inside the app, once, after they have kept a letter, the system's own rating sheet may appear. They can close it. It never comes back in that moment, never blocks anything, and never mentions what they have or have not recorded.

## The check

"Old code" means this tree, searched 8 Nov 2026.

| Label | Tag | Given, When, Then | Fails on old code because | Source |
|---|---|---|---|---|
| NX-24-R1 | EVIDENCE | Given a parent who has just kept a letter (the Keep completed with no error), When the app returns to the book home, Then it requests Apple's review sheet at most once per app version and never earlier than 3 days after install (a time guard, not a count of letters; proposed number). It is never requested in the first session, after an error, a sync failure, a deletion step, a Plus offer in the last 24 hours, or while recording. The app shows no pre-question such as "do you like us?" (a custom review prompt; Apple's rule against it is UNVERIFIED here, read guideline 5.6.1 before building). | No code requests a review: `expo-store-review` is not a dependency and `requestReview` is absent (searched 8 Nov). | PR #587 ratings item: "once, after a parent keeps a letter; never tied to counts or gaps" |
| NX-24-R2 | EVIDENCE | Given any build, Then no feature, free letter, Plus benefit or message depends on a rating, and the app stores only the date of the last request on the phone (a device setting; Apple tells us nothing about the answer). | Nothing exists. | F14 never-list; COORDINATION section 10 |
| NX-24-R3 | EVIDENCE | Given the production profile, Then the ask is behind a build flag that is off until the native module is in a native build, and the content rules test passes on any new string (0 hits for streak, gap, guilt or reward wording). The ask uses Apple's sheet and has no string of ours. | Nothing exists. | CLAUDE.md content rules |
| NX-24-R4 | EVIDENCE | Given the listing screenshots, Then 100% are rendered from a release build with the Asha profile, no frame shows a real child name, and frames 1 to 3 match a simulator capture of the store build; re-run after #544, #508 and #520 merge. | Blocked on a first release build; frames predate three screen changes (PR #587 item on re-capture). | BL-340; NX-05-R7 |
| NX-24-R5 | EVIDENCE | Given the Accessibility Nutrition Labels, Then each label answered passes its own check on a device (VoiceOver, larger text, dark interface, contrast, reduced motion) and any label that does not pass is left unanswered. 1 recorded check per answered label. | No audit is recorded. | PR #587 accessibility item; `06-nfr.md` section 8 |
| NX-24-R6 | EVIDENCE | Given the listing text, Then it uses the name and subtitle recorded in D-139, says English only, names no co-parent sharing while the Family tab is hidden, names no competing platform (2.3.10) and implies nothing writes the family's words; the claims test passes. | The claims test exists (`packages/content/test/claims-capabilities.test.ts`) and is green on the on-device listing; it must be re-run against production capabilities with servers on. | NX-05-R4; D-139 |
| NX-24-R7 | EVIDENCE | Given the keyword field, Then the check against Apple Ads popularity is recorded in the listing doc (`docs/store/`) with the date, and the keywords are revised by day 30 from real search data. | No record. | PR #587 keyword items |

**Shown:** Apple's rating sheet (no words of ours); the listing text.
**Records:** the date of the last request, on the phone only (L2). Nothing about the answer.
**Never:** gate anything on a rating; ask in exchange for a benefit; ask after an error or a deletion step; use a pre-question; count letters or days as a trigger; send the rating anywhere.
**Decline and withdraw:** closing the sheet is final for that version; nothing changes in the app.

## Edge cases

Second account on a phone (the date is per phone); kill switch (the ask does not read server flags; the build flag is the control); apple limits the sheet to a few shows a year and may not show it at all (the requirement is that we ask at most once per version, not that a sheet appears); retry after a lost answer (no retry); erase or delete (the device setting goes with the app).

## Offline behaviour

The ask needs no network on our side. Apple decides whether to show it.

## What we never do

Nudge with a guilt line, a thank-you that depends on a rating, or "rate us to unlock".

## Copy needs

None for the ask (Apple's sheet). The listing words are in `packages/content/src/store.en.ts`; any change follows the content rules and the claims test.

## Analytics events

New, not in `packages/analytics/src/catalog.ts` (checked 8 Nov), so add first: `review_prompt_requested` (no properties). Nothing is sent in 1.0 (D-124).

## Device rows

New: "keep a letter on day 4: the sheet may show once; day 5: no second request"; "no request after a failed save".

## Dependencies

A native build that carries `expo-store-review` (batch with other native changes). Theme 5 (production profile), BL-340, the renumbering of #587 (rank 4).

## Founder steps (not requirements; the harness cannot do them)

From PR #587 as filed: rename in App Store Connect per D-139; confirm or amend the "early version" note (D-060); record the review demo from the submission build; submit the featuring nomination by Fri 13 Nov (Apple asks for at least 3 weeks' lead); turn off multiseat; counsel on the D-061 "always kept" line. These stay on `docs/release/FOUNDER_QUEUE.md`.

## Engineering block (G-31 to G-37)

| Line | This theme |
|---|---|
| API contract (`packages/api`) | None. |
| Budget (`06-nfr.md`) | App under 40 MB: `expo-store-review` is a small native module; measure the IPA after adding it (NX-05-R9). No work before the first frame. |
| Accessibility | Apple's sheet follows Apple's accessibility. Our part: the request happens on a calm screen, not mid-gesture; focus returns to the book home after the sheet closes (VoiceOver announces the screen again). |
| Switch, off behaviour, noticed by | Build flag, off by default in `eas.json` until the module ships. Off: nothing is requested. Rollback: ship a build with the flag off. Noticed by: App Store Connect ratings (Apple's numbers); `review_prompt_requested` when analytics are on. |
| Data class and retention | Last-request date: L2 device setting, removed with the app. No server field. |
| Schema and grants | None. The device setting key is added to the settings list in `apps/mobile/src/lib/store`. |
| Analytics events | review_prompt_requested: add to catalog first. |

## Trace and tests

Id convention: `_CONVENTIONS.md`.

| Id | Refines | Test (layer, file, title) | Device or ops row |
|---|---|---|---|
| NX-24-R1 | PR #587 ratings item | mobile unit on the trigger rules (proposed `apps/mobile/src/lib/review-prompt.logic.ts` and `apps/mobile/test/review-prompt.test.ts`); `[NX-24-R1] at most once a version, 3 days after install, never after an error` | new: day 4 and day 5 rows |
| NX-24-R2 | F14 never-list | same file; `[NX-24-R2] nothing depends on a rating; only the date is stored` | none |
| NX-24-R3 | content rules | `apps/mobile/test/release-config.test.ts` (exists); `[NX-24-R3] review-prompt flag is off in production until the module ships` | none |
| NX-24-R4 | BL-340 | frame comparison script (proposed under `docs/store/screenshots/tools`); `[NX-24-R4] frames come from a release build with Asha` | none |
| NX-24-R5 | `06-nfr.md` section 8 | recorded device checks in `docs/qa/evidence/`; Test: none, device | new: one row per label |
| NX-24-R6 | F21; D-139 | `packages/content/test/claims-capabilities.test.ts` (exists); `[NX-24-R6] listing claims match production capabilities` | none |
| NX-24-R7 | PR #587 | Test: none, a dated record in the listing doc | none |

Trace: NX-24-R1..R7 -> F21, F21-REQ-033, F13-REQ-020, D-139, D-060, D-061.

## Founder-only decisions

| Decision | Recommended default |
|---|---|
| Ask for a rating in 1.0.x at all | Yes, once, after a Keep, as PR #587 describes; after the first week of real use, not before |
| Keep the "early version" note in the public release (D-060) | Keep it for 1.0; revisit after the first month |

## Not verified

Apple's review-prompt rules and the yearly limit of the system sheet. The contents of PR #587 beyond its description and one-line items. Whether `docs/store/screenshots/tools` has a comparison script. Whether the nomination date is still open.
