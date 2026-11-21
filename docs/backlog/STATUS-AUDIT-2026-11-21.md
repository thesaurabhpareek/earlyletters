# Backlog status audit, 21 Nov 2026

Owner: product. Supersedes the older status audits of 9 and 10 Nov (open PRs #734 and #743), which this one covers and extends. Base: `origin/develop` at `a47b2f6a`.

## Method

1. Three read-only auditors compared all 188 rows with `Status: ready` in `docs/BACKLOG.md` against `origin/develop`, the open PRs (read by REST) and `docs/agents/CLAIMS.md`. Each wrote a table (id, verdict, evidence, open PR or claim, next action) with one of six verdicts: DONE, PARTIAL, OPEN, BLOCKED, SUPERSEDED, UNSURE.
2. Product opened the cited evidence for all 37 DONE verdicts (file present and holding the cited symbol or test title, or the merged PR read by REST) and read the row's Done-when line against it wherever the row has one. All 8 SUPERSEDED verdicts were checked against the decision, plan or code comment they cite. For BLOCKED, every Depends on and founder-task id was read; for PARTIAL, file-level checks on about 8 rows and the cited PRs read by REST. A verdict that could not be reproduced stayed as it was.
3. Only the `Status:` phrase of a verified row changed, in place, so the diff cannot conflict with PRs that append sections to the backlog. Nothing else in a row, and no OPEN or UNSURE row, was touched.

Status words used, from the file's own vocabulary: `done (evidence)`, `superseded (by D-### or BL-###)`, `blocked (BL ids or the reason)`, `needs-founder (FT-##)` where a founder task id exists (instead of `blocked`, for BL-360, BL-365 and BL-368), and `partly done (what remains)` as the product agent was asked to write it.

## Counts

| Auditor verdict | Rows | Changed here | Left unchanged |
|---|---|---|---|
| DONE | 37 | 37 (34 done, 3 partly done after the re-read) | 0 |
| PARTIAL | 46 | 46 | 0 |
| BLOCKED | 15 | 15 | 0 |
| SUPERSEDED | 8 | 5 (4 superseded, BL-453 partly done) | 3 (BL-369, BL-406, BL-845 not reproduced) |
| UNSURE | 11 | 0 | 11 |
| OPEN | 71 | 0 | 71 |
| Total | 188 | 103 | 85 |

Final lines by new status: done 34, superseded 4, blocked or needs-founder 15, partly done 50 (46 audited PARTIAL plus BL-394, BL-509, BL-510 from DONE and BL-453 from SUPERSEDED). 85 rows stay `ready`.

## Verdicts overturned or not applied

| Row | Auditor | Result | Why |
|---|---|---|---|
| BL-509 | DONE | partly done | Done-when says the text is on `main`. `origin/main` still has the old line in `apps/web/src/content/site.ts`. |
| BL-510 | DONE | partly done | Done-when says `/open` serves on `main` and the AASA lists it. `origin/main` has neither. |
| BL-394 | DONE | partly done | Done-when asks for 3:1 and 4.5:1 checks on every captured route in J18. `apps/mobile/e2e-web/j18-dark-mode.flow.ts` only checks the screen is dark. |
| BL-453 | SUPERSEDED | partly done | Points 1 to 3 lost their surface when BL-870 closed the photo bucket, but points 4 and 6 are still real work. |
| BL-369 | SUPERSEDED | unchanged | D-071 chose final-a, but the row is the founder's optional parent test. Founder decides whether to retire it. |
| BL-406 | SUPERSEDED | unchanged | The code no longer matches the row (Write says "Add to {child}'s book"), but no D or BL id records the choice. Needs a design or product decision id first. |
| BL-845 | SUPERSEDED | unchanged | Plan 17 says "fold or close" but `photos-device.test.ts` is the Swift module scan, not the NX-39-R9 scanner with the adapter allowlist. |

## Table of changes

All rows were `ready`.

| Id | New status | Evidence or what remains |
|---|---|---|
| BL-002 | done | `scripts/trace.mjs`, `docs/TRACE.md`, run by `npm test` in report mode; making `--check` block merges is a founder question, 07 Q8 |
| BL-334 | done | `supabase/migrations/20261015010000_v1_gate_peek_invite_consent_pepper.sql`, `consent_pepper_ready()`, `supabase/tests/access_matrix.test.mjs` |
| BL-324 | done | `apps/mobile/modules/scribe-audio/ios/ScribeAudioModule.swift`, `apps/mobile/modules/scribe-store/ios/PlusStoreSheet.swift`, `apps/mobile/test/native-guards.test.ts`; device check FT-22 is separate |
| BL-325 | done | `apps/mobile/src/lib/remote/__tests__/documents.test.ts`, `apps/mobile/src/lib/auth/reauth.logic.ts` |
| BL-342 | done | PR #121, `apps/mobile/src/lib/billing/plan-reminders.logic.ts`, `apps/mobile/test/billing-plan-reminders.test.ts` |
| BL-440 | done | `packages/content/src/store.en.ts`, `apps/mobile/test/release-config.test.ts` case BL-440 |
| BL-344 | done | `apps/mobile/src/app/settings/plus.tsx` redeemOfferCode, `apps/mobile/modules/scribe-store/ios/ScribeStoreModule.swift` |
| BL-355 | done | `apps/mobile/src/components/ui/fonts.ts`, `apps/mobile/src/app/onboarding.tsx` |
| BL-356 | done | `apps/mobile/src/lib/copy.ts` deprecated, every string lives in `@scribe/content` |
| BL-357 | done | `apps/mobile/src/lib/billing/plan-store.ts`, `apps/mobile/test/billing-status-report.test.ts`; hosted apply and flag-on are separate |
| BL-358 | done | `supabase/migrations/20261016001000_subscription_status.sql`, `supabase/functions/subscription-status/handler.ts` |
| BL-370 | done | PR #801, `apps/mobile/src/app/_layout.tsx` ErrorBoundary, `apps/mobile/test/resilience.test.ts` |
| BL-371 | done | `apps/mobile/src/app/letter/[id].tsx`, `apps/mobile/src/app/settings/recently-deleted.tsx`, `purgeExpired` in `apps/mobile/src/lib/store.ts`; Undo is a toast on the Book per S36, not a button on the page |
| BL-375 | done | `apps/mobile/src/components/speech/speech-consent-card.tsx`, `apps/mobile/src/components/settings/speech-row.tsx`, `apps/mobile/src/lib/packs/__tests__/engine.test.ts` |
| BL-380 | done | `apps/mobile/src/lib/resilience/keep-awake.ts`, `apps/mobile/test/keep-awake.test.ts`; the device row stays in BL-279 |
| BL-382 | done | `apps/mobile/src/lib/capture/probe.ts`, `apps/mobile/test/sweep.playable.test.ts` |
| BL-383 | done | `apps/mobile/src/app/+not-found.tsx`, `LINK_ROUTE_ALLOWLIST` in `apps/mobile/src/lib/family/entry.logic.ts` |
| BL-386 | done | `apps/mobile/src/app/settings/children/[id].tsx` editors call `updateChild` |
| BL-433 | done | `apps/mobile/src/app/review.tsx` countLine uses noChangesAfterUndo; the wording differs from the scope sentence |
| BL-446 | done | PR #803, `apps/mobile/test/export-open-request.test.ts` |
| BL-465 | done | PR #161 merged 31 Oct 2026 and PR #163 merged 1 Nov 2026 |
| BL-496 | done | PR #400, tests tagged BL-496 in `apps/mobile/test/account-deletion-gate-hook.test.ts` |
| BL-503 | done | PR #804, `apps/mobile/test/auth-machine.test.ts` case BL-503 |
| BL-515 | done | `apps/web/src/app/auth/callback/page.tsx`, `apps/web/e2e/auth-confirm.e2e.ts` |
| BL-563 | done | PR #595 with follow-ups #618 and #611, `apps/mobile/test/listen.test.ts`; device row S1-39 not yet run |
| BL-564 | done | PR #589, `apps/mobile/test/privacy-documents.test.ts` |
| BL-594 | done | PR #602, `supabase/functions/_shared/keys/keys.test.ts`; the live staging check with legacy keys off is still to do |
| BL-857 | done | PR #763, `docs/research/studies/MEMORY-LIBRARY-STUDY-PLAN-10nov.md`, status DRAFT; the path differs from the scope |
| BL-870 | done | PR #1115, `supabase/migrations/20261110000000_photo_bucket_closed.sql`, `supabase/tests/photo_bucket_closed.test.mjs`; hosted apply is a founder step |
| BL-927 | done | PR #867, `docs/design/specs/NS-33-ACCESSIBILITY-FLOOR-20nov.md` |
| BL-949 | done | PR #872, `docs/legal/COUNSEL_PACKET.md` 1.7.0 section 7 |
| BL-962 | done | PR #868, `apps/mobile/test/no-system-indexing.test.ts` |
| BL-967 | done | PR #904, `apps/mobile/src/lib/reminders/session.ts`, `apps/mobile/test/reminders-session.test.ts` |
| BL-975 | done | PRs #897, #898, #906 and #1095, `scripts/release/label-effect.mjs`; the founder applies the workflow, D-124 |
| BL-391 | superseded | by D-100; BL-391 was rescoped in `apps/mobile/src/lib/family/entry.logic.ts`, the tabs are now Home, Book and You |
| BL-429 | superseded | by D-082 |
| BL-846 | superseded | by BL-931 and ADR 0028; plan 17 says so, PR #835 builds the local schema |
| BL-869 | superseded | by BL-966; PR #1088 merged, `apps/mobile/src/lib/reminders/budget.ts` |
| BL-360 | needs-founder | FT-12, FT-13 |
| BL-365 | needs-founder | FT-41 |
| BL-366 | blocked | founder and counsel: professional clearance search and the mark drawing filing; only the D-121 knockout search is done |
| BL-368 | needs-founder | FT-14 |
| BL-413 | blocked | BL-148 |
| BL-434 | blocked | BL-408 |
| BL-469 | blocked | BL-444 |
| BL-512 | blocked | founder and counsel decide: a separate /subscription-terms page or fold into /terms, D-125 item 5 |
| BL-776 | blocked | the CDesO places the row on the onboarding screen first, CPO-10 option a, no D- id will be made |
| BL-849 | blocked | Memory Library is parked until after the first photo release, plan 17 |
| BL-859 | blocked | Memory Library is parked until after the first photo release, plan 17 |
| BL-860 | blocked | Memory Library is parked until after the first photo release, plan 17 |
| BL-861 | blocked | Memory Library is parked until after the first photo release, plan 17 |
| BL-881 | blocked | BL-859, BL-860 |
| BL-930 | blocked | founder or product merges the NS-34 rows into `docs/prd/v2/06-nfr.md` |
| BL-110 | partly done | requirement ids are cited in `supabase/tests`; `supabase/tests/run.mjs` still has no named sections and no JUnit output |
| BL-117 | partly done | source-scan guards exist; no secret, SDK or dependency scan in CI, PR #806 is the first slice |
| BL-341 | partly done | review notes in `packages/content/src/release/app-review.en.ts`; the demo account and the notes entry in App Store Connect are founder steps |
| BL-354 | partly done | light, dark and tinted icons and splash wired in `apps/mobile/app.config.ts`; the Icon Composer file needs a Mac |
| BL-362 | partly done | Apple token revoke at deletion built; a step-up within 10 minutes before deletion not found, Google unlink is moot until v1.1 |
| BL-363 | partly done | email logos, OG image and security headers built; a `/fonts/*` route with CORS and cache headers is missing |
| BL-364 | partly done | terms, privacy, support, legal docs, auth callback, AASA and `/open` built; `/health-privacy`, `/subprocessors`, `/subscription-terms`, `/delete-account`, `/cancel` and the Android line are missing |
| BL-376 | partly done | waiting card and Write the words built; a no-speech letter offers no Record again by design in `words-card.logic.ts`, decide whether it is wanted |
| BL-377 | partly done | PR #522 draft persistence; the `user_edited` marker and the VoiceOver hold are missing, they wait on BL-148 |
| BL-378 | partly done | PR #801 autosave flush; the first-run `finish()` guard and `test/onboarding-finish.test.ts` are missing |
| BL-379 | partly done | PR #801 Let it go and words state; Tonight showing more than one waiting draft is missing |
| BL-381 | partly done | mic problem cards and the free-space preflight built; the permission card on the shared Sheet is missing |
| BL-388 | partly done | waiting drafts exported; recently deleted letters wait for the CPO ruling, ZIP64 and the orphan recordings folder are missing |
| BL-392 | partly done | size gate and entitlement guards exist; CI wiring of the size gate and an Info.plist allowlist are unconfirmed |
| BL-396 | partly done | ModalHeader, BackButton and Sheet Close built; the root large-title variant is not built, decide whether it is wanted |
| BL-397 | partly done | choice-group selected state and the `controlBorder` token built; the ListRow chevron audit and the Plan status card are not verified |
| BL-398 | partly done | StateScreen and InlineState built; the caution variant with role alert is not in `state-screen.tsx`, decide whether it is wanted |
| BL-400 | partly done | 44 pt floor in button and choice-group, `apps/mobile/test/a11y-ax5.test.ts`; the bounding-box assertion in the journey run is missing |
| BL-401 | partly done | letterDateline and readingScale in use; dateline at Large print, scrubber fill and AX5 on Read together are not verified |
| BL-402 | partly done | QuotePair, registry lockup and atmosphere tokens built; the single Atmosphere wrapper is missing |
| BL-403 | partly done | Settings via the You tab and the child switcher on Book built; the Tonight settled card with Add another is missing |
| BL-404 | partly done | Settings regrouped, Legal page and Help copy built; the Accessibility statement row is missing, LEGAL-REQ-052 |
| BL-408 | partly done | server perf test and nightly job built; the on-device 2,000-letter test `apps/mobile/test/perf.sql.test.ts` and Maestro timing are missing |
| BL-417 | partly done | tabular clock and fixed Pause and Finish built; the red disc does not pause and the Take your time line is missing |
| BL-425 | partly done | Continue helpers built; Export and Sign my letters have no helper |
| BL-426 | partly done | the I answered by mistake way back is built; the come back tomorrow sentence and the compliance-register line are missing |
| BL-427 | partly done | NFC and code-point cut built; the duplicate-name warning and a grapheme-safe cut are missing |
| BL-428 | partly done | reminders switch and notifications-off card built; point 1 is not met as worded, the long-absence planner test is missing |
| BL-430 | partly done | restoreFailed copy built; no distinct failed product-load state with retry |
| BL-431 | partly done | letter date change built in `apps/mobile/src/components/book/date-sheet.tsx`; the calm warning for a date before birth is missing |
| BL-454 | partly done | point 4 done in `apps/mobile/test/plus-gate.test.ts`; the point 3 double-tap row in V-06 is missing, points 1 and 2 wait for counsel and the spec owner |
| BL-466 | partly done | point 1 done in `.gitignore`; points 2 and 3 are missing |
| BL-479 | partly done | announce on early end and the live region built; signOutEarly wording, the held flag and the AUTH_BUTTONS test are missing |
| BL-489 | partly done | point 1 partly built; the Trouble signing in and Account notes are unchecked, point 2 waits on the analytics owner |
| BL-507 | partly done | point 1 done; points 2 and 3 wait for the founder to confirm the rule, point 4 the preflight still prints PASS hidden for a servers-on build |
| BL-509 | partly done | merged to develop in PR #807; the done-when needs the text on `main`, which comes with the next release snapshot |
| BL-510 | partly done | merged to develop in PR #808; the done-when needs `/open` and the AASA path on `main`, which come with the next release snapshot |
| BL-394 | partly done | `apps/mobile/test/theme-leaks.test.ts` and the token contrast tests exist; J18 checks only that the screen is dark, with no per-route 3:1 and 4.5:1 checks, and misses Settings and Plan |
| BL-453 | partly done | points 1 to 3 have no live surface since BL-870 closed the photo bucket; point 4 test change and point 6 legal citation remain |
| BL-565 | partly done | PRs #616 and #652 serve the 0.9.0 texts; the live URL check, the content_sha256 match and the build list line remain |
| BL-922 | partly done | PR #1126 is part 1; part 2 is open PR #1167 |
| BL-929 | partly done | PR #1155 perf markers; the SE 3 run sheet under `docs/qa` is not written |
| BL-952 | partly done | PRs #881 to #885, #894 and #895 are slices 1 to 7 of 8; slice 8, the account seam, is unblocked by PR #879, the flag stays off |
| BL-958 | partly done | PR #896 store flags guard; R45 free space waits on PR #836 |
| BL-961 | partly done | PRs #869, #871 and #879 merged; per-surface X4-R1 tests and the sign-out device row remain |
| BL-964 | partly done | PRs #878 and #1060 report the NS P0 rows; the NS ratchet and its CI step are missing |
| BL-965 | partly done | PR #870 words packet is PROPOSED; the photosCopy, sign-out sheet, Save a copy and NS-16 keys are not yet in `packages/content` |
| BL-966 | partly done | PRs #1088, #1089 and #1174 merged; 966c waits on open PRs #1172 and #1075 |
| BL-978 | partly done | NS-10 R0 to R8 titles covered; the sign-in kill switch, retry after a lost sync_books answer and the Book-level backup-off line remain, PR #1173 is open |
| BL-987 | partly done | PR #876 answers S1 to S3; the D1, D2 and M1 to M3 lines remain |

## Side effects on the dispatcher

- `node scripts/agents/dispatch.mjs` reads the first word of the status. `partly` is neither ready nor done, so the 50 partly done rows are skipped and their dependents stay blocked. The remainder of each is named in its status line, but nothing picks it up until product splits it into a new `ready` row. That is the next product task for the rows with agent work left (for example BL-110, BL-117, BL-363, BL-364, BL-402, BL-408, BL-427, BL-430, BL-466). BL-408 matters most: BL-434 waits on it.
- The existing phrase "done in part" would have counted as `done` for dependents, which is why it was not used.
- Eligible agent tasks by the dispatcher's own rules: 165 before, 80 after. Newly eligible: BL-359 and BL-928 (their blockers BL-358 and BL-927 are now done).
- Stale claim rows: `find-lane` (PR 895) and `account-lane` (PR 879) point at merged PRs. Their owner removes them.

## Rows still UNSURE, and the check each needs

| Id | Check |
|---|---|
| BL-251 | Analytics owner says what the row meant (likely an analytics consent version); PRs 1086 and 1201 may replace it. Rewrite or retire. |
| BL-252 | Analytics owner: does any test drive the real PostHog client? Retire or rewrite after PR 1086 merges. |
| BL-395 | Design owner runs journey J06 and ticks each Done-when point (fix-mark hit areas, first-time note, Keep exact words confirm, Literata edit field). |
| BL-419 | Run journeys J01 to J03, compare the ten visual findings, split into points. |
| BL-420 | Add the layout-shift measurement to the web run, then judge the four moves. |
| BL-421 | Compare against Book journey J09-03, then close or narrow (the placeholder text is gone). |
| BL-422 | Content owner reads `privateNote` and `privacyNote` in `strings.en.ts` and picks one explanation. |
| BL-423 | Check where the first-run finale button routes and whether it reaches a ready recorder in one tap. |
| BL-891 | Product or Karma: retire as superseded by the NS first-run cards, or edit NX-40. |
| BL-894 | Same question as BL-891 for the NS-39 to NS-45 cards. |
| BL-873 | Content or Karma: typed-day lines go with BL-965 and BL-982, the rest is parked Memory Library. |

## OPEN rows the auditors recommend building next

Small and unblocked first (each S or XS):

- BL-119 (together prompts never show without the flag, speech), BL-441 (plan.ts fix and flip the `it.fails`, payments; engine file, coordinator merges), BL-457, BL-459, BL-461, BL-463, BL-473, BL-456, BL-449, BL-450, BL-506, BL-508 (mobile, sync, qa), BL-516 (XS, reword two lines), BL-518 and BL-519 (asks), BL-957 (grapheme helper, needed by photo word fields), BL-974, BL-985 (needs a content key first).
- Docs and legal drafts: BL-851, BL-868, BL-935, BL-867, BL-850 (after PR 873), BL-841 (rewrite against the current packet numbering).
- Unblock others: BL-148 (M, unlocks BL-413 and BL-377), BL-444 (M, unlocks BL-469).

Wait for an open PR first: BL-412 after PR 835; BL-414 after PR 1086; BL-452 and BL-476 after PRs 1170 and 1134; BL-455 and BL-492 after PRs 1087 and 1124; BL-775 after PRs 1169, 1175 and 1124; BL-864 and BL-878 are the open PRs 1203 and 1204 themselves (review and merge); BL-960 is open PR 873.

## Not verified

- Most OPEN and UNSURE verdicts were not re-read: they change nothing here.
- The "what remains" part of about 40 PARTIAL rows, and the file evidence behind them, is the auditors' and was not re-read.
- No test suite was run against the code behind any DONE verdict; "done" means the code and test exist on `origin/develop` and the merged PR was read, not that a device or hosted check happened. Device rows (FT-22, S1-39, BL-279) and hosted applies (BL-870, BL-594 staging) are separate and said so in the status lines.
- The BL-002 evidence is the script, the report and the `npm test` hook. `--check` currently exits 1 and is not run by CI.
