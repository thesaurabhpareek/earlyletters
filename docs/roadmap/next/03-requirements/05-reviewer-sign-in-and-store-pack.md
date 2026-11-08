# Theme 5: Getting past App Review: reviewer sign-in and the store pack

| | |
|---|---|
| Working label | NX-05 (id: to be assigned) |
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
| NX-05-R1 | EVIDENCE | Given the production profile with servers on, When `store-config.ts --assert-shippable` runs, Then it passes only if reviewer sign-in details are present, and the Notes for Review do not contain the on-device-only sentence. | Notes say "True for the on-device v1.0 only" and that there is no sign-in. | `store.en.ts` lines 100 to 104; gap map 1.1 |
| NX-05-R2 | HYPOTHESIS | Given the chosen reviewer path (see decisions), When a person who is not the founder follows only the Notes on a fresh phone, Then they reach a signed-in book in 3 attempts or fewer, with 0 messages to the founder. | No path is designed. Passwordless sign-in (D-054) means a mailbox the reviewer cannot open is a dead end. | Gap map 1.1 |
| NX-05-R3 | EVIDENCE | Given the Notes for Review, Then every dormant feature (backup, status report, analytics, any other off switch in the profile) is named, count in Notes equals count of off switches in the profile. | Notes describe the on-device app only. | F19-REQ-024; 2.5.19 |
| NX-05-R4 | EVIDENCE | Given the listing, Then it says English only and names no co-parent sharing while the Family tab is hidden; the claims test pinned by #498 passes against the production capabilities. | Listing once promised seven languages and co-parent sharing. | D-121 risks; #498 |
| NX-05-R5 | EVIDENCE | Given the four web addresses `/privacy`, `/terms`, `/support`, `/subscription-terms` plus `/delete-account`, Then 5 of 5 answer 200 with text that matches the app build. | 4 return 404 or site-only text on 8 Nov. | Gap map 1.11 |
| NX-05-R6 | EVIDENCE | Given the privacy answers worksheet (RA-17-01), Then no answer says "Data Not Collected"; each data type in the build has a row, and the privacy manifest and the policy agree (3 of 3). | `docs/legal/app-store-privacy-labels.md` says Data Not Collected. | Gap map 1.12; compliance G-D |
| NX-05-R7 | EVIDENCE | Given screenshots, Then 100% come from a release build with the Asha profile and none shows a real child name. | Blocked on a first release build. | BL-340 |
| NX-05-R8 | EVIDENCE | Given the 18+ questionnaire and availability, Then both are entered, availability is the US storefront only, and `ascAppId` is in `submit.production`. | S-34 open; S-12b FAIL. | Gap map 1.9, 1.12 |
| NX-05-R9 | HYPOTHESIS | Given a built IPA, Then the download size is measured and written down against the 40 MB budget. | Unmeasured until an IPA exists. | `docs/ops/APP_SIZE.md` |

**Shown:** store text in `packages/content/src/store.en.ts` (`reviewNotes`, listing), Support and Privacy URLs.
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

Keys to add: `store.reviewNotes.servers`, `store.reviewNotes.signIn`, `store.reviewNotes.dormantFeatures`, `store.reviewNotes.purchases`, `pages.support.*`, `pages.deleteAccount.*`, `pages.subscriptionTerms.*` (the last needs counsel text). Words by `content`.

## Analytics events (opt-in, content-free, names only)

None.

## Device rows

S1-08 with a review mailbox. New row: "fresh phone, Notes only, reach a signed-in book".

## Dependencies

Themes 1 to 4; theme 8 (products); counsel texts (#616, #652); gap map ranks 12, 13, 14.

## Founder-only decisions

| Decision | Recommended default |
|---|---|
| How the reviewer signs in | A dedicated review mailbox on the founder's domain that he opens for Apple, written into the Notes (gap map section 6 question 5). A scripted alternative needs a `security` design and is not proposed here |
| App Store Connect entries (age rating, privacy answers, trader answer, availability) | Founder, from worksheets prepared by agents |
| Individual publisher risk (5.1.1(ix)) | Keep the choice in D-134; ask counsel Q47 before submission |

## Not verified

Review turnaround, phased release, support URL rules, export compliance forms, whether an 18+ rating value is available, EU trader answer for an individual.
