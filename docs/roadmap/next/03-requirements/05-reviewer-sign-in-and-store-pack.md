# Theme 5: Getting past App Review: reviewer sign-in and the store pack

Readiness: NOT READY for R1 and R2; 22 of 28 for the rest (audit 8 Nov: 18). Author's re-score, `qa` to confirm. Remains: the founder's pick below; counsel Q54 and Q47.

### Blocked on (exact question, recommended default)

| # | Question | Who answers | Recommended default | Rows it holds |
|---|---|---|---|---|
| B-1 | How does an Apple reviewer sign in to a passwordless app? **A:** a review mailbox the founder watches during review, accepted as a standing duty with a named window, and he sends the one code within 15 minutes. **B:** a fixed demo sign-in approved by Apple ahead of time (guideline 2.1(a) asks for prior approval). Note the release script already assumes a third thing: `scripts/release/with-review-contact.ts` requires `demoUsername` and `demoPassword` whenever server features are on, but the app has no passwords (D-054), so neither field can be filled truthfully. | Founder | **A**, because B needs Apple's prior approval and a server-side special case that security has not designed. If A: the script's two demo fields are replaced by a `reviewMailbox` statement and a `codeWindow` statement (R1). | R1, R2 |
| B-2 | Which data types does the privacy label list now that servers are on (the worksheet says "Data Not Collected")? | Counsel (Q54); the founder enters it | Fill every data type the build collects from the data classification and the privacy manifest, then counsel confirms; no answer says "Data Not Collected". | R6 final answers only |
| B-3 | Is an individual publisher with health-adjacent text acceptable under 5.1.1(ix)? | Counsel (Q47) | Keep Lifestyle category and the choice in D-134; ask before submission. | none (a submission risk, not a build row) |

Everything else in this file is finished.

| | |
|---|---|
| Working label | NX-05 (working id, see `_CONVENTIONS.md`) |
| Refines | F21 (store, web, legal pages), F19-REQ-024 (dormant flags), BL-340, BL-341, BL-342, D-121 risks, D-134, D-137 |
| Tag | EVIDENCE (gap map 1.1, 1.9, 1.11, 1.12, 3.1, 3.2). Apple rules were read on 8 Nov by `ops`; the guidelines page was truncated before 5.1.4(b), so 5.1.5 onward is UNVERIFIED |
| Size | M (gap map ranks 5, 6, 12, 13, 14) |
| Gate | Apple (2.1(a), 2.3.1(a), 2.5.19, 5.1.1(i), 5.1.1(ix)). Counsel (Q54 privacy answers, Q47 individual publisher). Founder (App Store Connect entries) |
| Order | 5 of 12 |

## What the reviewer will see and do

An Apple reviewer installs the app, opens it, and must reach a signed-in book without a mailbox we have not given them. The Notes for Review say what the app does, how to sign in, and name every switched-off feature. The support, privacy, terms, subscription-terms and delete-account pages open. The privacy answers in App Store Connect match what the build does.

## The check

| Label | Tag | Given, When, Then | Fails on old code because | Source |
|---|---|---|---|---|
| NX-05-R1 | EVIDENCE | Given the production profile with servers on, When `withReviewContact` (`scripts/release/with-review-contact.ts`) runs, Then it fails unless the reviewer path chosen in B-1 is present in the Notes and the contact JSON, and the Notes contain neither the on-device-only sentence nor the words "no sign-in" or "no account" (a guard for the words exists, below). | PARTLY PASSES today: `withReviewContact` already throws when servers are on and the notes match `NO_SIGN_IN` (BL-341), and requires `demoUsername` and `demoPassword`. What fails: the stored `storeListing.reviewNotes` still says "there is no account to create" (`store.en.ts` around line 108), and the two demo fields cannot be filled for a passwordless app (B-1). | `scripts/release/with-review-contact.ts` lines 18 to 55; `store.en.ts` lines 100 to 108 |
| NX-05-R2 | HYPOTHESIS (held with B-1) | Given path A, When a person who is not the founder follows only the Notes on a fresh phone and the founder sends one code within 15 minutes, Then they reach a signed-in book in 3 attempts or fewer. (Path B would read: with the pre-approved sign-in, 3 attempts or fewer and 0 messages.) | No path is designed. Passwordless sign-in (D-054) means a mailbox the reviewer cannot open is a dead end. | Gap map 1.1 |
| NX-05-R3 | EVIDENCE | Given the Notes for Review, Then every dormant feature is named, and the count named in the Notes equals the count of `false` values `store-config.ts` reads for the production profile from `apps/mobile/src/lib/capabilities.ts` (the `BuildFlag`s backup, statusReport, accountDeletion, plus analytics and any other off switch that file resolves); a script compares the two and fails on a difference. | Notes describe the on-device app only. | F19-REQ-024; 2.5.19 |
| NX-05-R4 | EVIDENCE | Given the listing, Then it says English only and names no co-parent sharing while the Family tab is hidden; the claims test pinned by #498 passes against the production capabilities. | Listing once promised seven languages and co-parent sharing. | D-121 risks; #498 |
| NX-05-R5 | EVIDENCE | Given the five web addresses `/privacy`, `/terms`, `/support`, `/subscription-terms` and `/delete-account`, Then 5 of 5 answer 200 with text that matches the app build. | On 8 Nov: absent are `/support`, `/delete-account`, `/subscription-terms` (3; `apps/web/src/app/(legal)` holds `privacy` and `terms` only); present with out-of-date text is `/privacy` (1, "not out yet"); whether `/terms` names the app is UNVERIFIED. The count is 3 absent plus 1 out of date, the same as theme 3 R8. | Gap map 1.11 |
| NX-05-R6 | EVIDENCE | Given the privacy answers worksheet (RA-17-01), Then no answer says "Data Not Collected"; each data type in the build has a row, and the privacy manifest and the policy agree (3 of 3). | `docs/legal/app-store-privacy-labels.md` says Data Not Collected. | Gap map 1.12; compliance G-D |
| NX-05-R7 | EVIDENCE | Given screenshots, Then 100% come from a release build with the Asha profile and none shows a real child name. | Blocked on a first release build. | BL-340 |
| NX-05-R8 | EVIDENCE | Given the 18+ questionnaire and availability, Then both are entered, availability is the US storefront only, and `ascAppId` is in `submit.production`. | S-34 open; S-12b FAIL. | Gap map 1.9, 1.12 |
| NX-05-R9 | HYPOTHESIS | Given a built IPA, Then the download size is measured and written down against the 40 MB budget. | Unmeasured until an IPA exists. | `docs/ops/APP_SIZE.md` |

**Shown:** store text in `packages/content/src/store.en.ts` (`storeListing`, including `reviewNotes`), Support and Privacy URLs.
**Records:** none from a person; the review account's own sign-in is a normal sign-in act (theme 2).
**Never:** a shared password in the repo or the Notes; a real family in the review account (the demo book is Asha); real mail credentials committed anywhere.
**Decline and withdraw:** not applicable to the reviewer; for parents, the privacy answers are kept accurate and changed without an app update when the build changes.

## Edge cases

- The reviewer's account is deletable like any other (5.1.1(v)); the deletion path must work for it.
- Reviewer in-app purchase: products visible and working (2.1(b)); sandbox needs a production-profile build.
- Individual publisher with health-adjacent text: 5.1.1(ix) is the likeliest rejection (gap map 3.3). Mitigation on record: Lifestyle category.
- Support URL is the home page today; 2.1(a) wants a working support page.

## Offline behaviour

The reviewer path must say what to do with no network (the app opens to the on-device book). No dependence on a network for the first screen.

## What we never do

Ask Apple to approve a hidden demo mode without prior approval (2.1(a)). Name a competing platform in store text (2.3.10). Imply anything writes the family's words.

## Copy needs (packages/content)

`storeListing.reviewNotes` today is one string (`store.en.ts` line 104), read as a string by `scripts/release/with-review-contact.ts` lines 21 and 47. Change it in one PR to an object with four fields (`servers`, `signIn`, `dormantFeatures`, `purchases`; `new`), join them where the script reads `REVIEW_NOTES`, and update `apps/mobile/test/release-config.test.ts` to read all four. The page keys `pages.support.*`, `pages.deleteAccount.*`, `pages.subscriptionTerms.*` are `new`; the last needs counsel text; check the real namespace for web pages in `packages/content/src` before naming (UNVERIFIED here). Words by `content`.

## Analytics events (opt-in, content-free, names only)

None.

## Device rows

S1-08 with a review mailbox. New row: "fresh phone, Notes only, reach a signed-in book".

## Dependencies

Themes 1 to 4; theme 8 (products); counsel texts (#616, #652); gap map ranks 12, 13, 14.

## Founder-only decisions

| Decision | Recommended default |
|---|---|
| How the reviewer signs in | Moved to "Blocked on" B-1 above. Recommended: A |
| App Store Connect entries (age rating, privacy answers, trader answer, availability) | Founder, from worksheets prepared by agents |
| Individual publisher risk (5.1.1(ix)) | Keep the choice in D-134; ask counsel Q47 before submission |

## Engineering block (cross-cutting, added 8 Nov 2026 after the readiness audit, G-31 to G-37)

| Line | This theme |
|---|---|
| API contract (`packages/api`) | None. The review account is a normal account; no special server path (that would be path B and needs a `security` design). |
| Budget (`06-nfr.md`) | App download under 40 MB, every release build (`06-nfr.md` size row; `docs/ops/APP_SIZE.md`). This is the whole-app budget; it is not the speech-file download (theme 6 R5). Measure when an IPA exists (R9). |
| Accessibility | Web pages: WCAG 2.2 AA (`06-nfr.md` accessibility section: deletion page, legal pages). Support and delete-account pages: 200% zoom with no clipped text; headings in order; links named. No app screen changes in this theme. |
| Switch, off behaviour, noticed by | Switch: none for the pages. For the review path: the founder's mailbox duty (A). Noticed by: `scripts/release/setup-state.mjs` and `store-config.ts --assert-shippable` in the release checks. Rollback: a corrected Notes text is re-sent in App Store Connect without a build. |
| Data class and retention | The review account holds only the fictional Asha demo book (no real family). Review contact JSON: L3, held as a secret (`ASC_REVIEW_CONTACT_JSON`), never printed or committed. The review mailbox: L3, founder-held; codes are single-use. |
| Schema and grants | No schema change. Worksheet RA-17-01 and `docs/legal/app-store-privacy-labels.md` change (legal lane owns them; this theme does not edit `docs/legal`). |
| Analytics events | None. |

## Trace and tests

Id convention: `_CONVENTIONS.md`. A test title starts with the bracketed id. Paths marked "proposed" do not exist yet; the PR that adds the test names the real path.

| Id | Refines | Test (layer, file, title) | Device or ops row |
|---|---|---|---|
| NX-05-R1 | BL-341; F21 | `apps/mobile/test/release-config.test.ts` (exists; extend); `[NX-05-R1] review notes carry the chosen sign-in path and not the on-device sentence` | none |
| NX-05-R2 | F21; 2.1(a) | HELD (B-1); device row with a person who is not the founder; Test: none, device | new: fresh phone, Notes only, reach a signed-in book |
| NX-05-R3 | F19-REQ-024 | script test (proposed `scripts/release/dormant-count.test.mjs`); `[NX-05-R3] Notes count equals production off switches` | none |
| NX-05-R4 | D-121; #498 | claims test pinned by #498 (exists); add the bracket; `[NX-05-R4] listing claims English only and no co-parent sharing` | none |
| NX-05-R5 | F21 | web check (proposed `scripts/ops/web-pages.mjs`); `[NX-05-R5] five legal and support addresses answer 200` | none |
| NX-05-R6 | LEGAL-REQ; RA-17-01 | doc check (proposed `scripts/release/privacy-label.test.mjs`); `[NX-05-R6] no Data Not Collected; each data type has a row` | none |
| NX-05-R7 | BL-340 | manual, evidence in `docs/qa/evidence/`; Test: none | S1-03 onward |
| NX-05-R8 | S-34; S-12b | `scripts/release/setup-state.mjs` checks (exist); `[NX-05-R8] ascAppId present; age rating entered` | none |
| NX-05-R9 | APP_SIZE | measurement of an IPA, written into `docs/ops/APP_SIZE.md`; Test: none, measurement | none |

Trace: NX-05-R1..R9 -> F21, F19-REQ-024, BL-340, BL-341, BL-342, D-121, D-134, D-137.

## Not verified

Review turnaround, phased release, support URL rules, export compliance forms, whether an 18+ rating value is available, EU trader answer for an individual.
