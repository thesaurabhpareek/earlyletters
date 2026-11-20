## Review A at 424ec5a7124d86dd8c8f2f015381a9dec22bd472: PASS WITH NOTES

Lens A (is every claim in the diff true; does the backlog still parse and dispatch). This replaces my CHANGES at 61433a5d. Head confirmed 424ec5a7: two commits on base 5433323c, which is still the current origin/develop tip (re-fetched). Diff vs develop is `docs/BACKLOG.md:3009` only; the rest of the file is identical to develop. The delta since 61433a5d is one clause of that line: from "Severity: the founder accepted S1" on, the line is byte-identical to what I reviewed.

**My must-fix, ruled: resolved.** "Builds before it ... still have the old debounce writer" is replaced by: "The build before it, EAS build 11 (run 42511542750 on d26335da, 8 Nov 2026), has the old debounce writer; build 10 (run 42465181563 on 13980751, 8 Nov 2026) predates #522 and has no Review writer at all. The EAS build counter ran 10, 11, 12 across those three runs with no gap, so I found no sign of a build cut by hand, but I did not check App Store Connect." Each part checked from GitHub, not from the brief:
- Job logs, "Incrementing buildNumber": run 42465181563 (head 13980751, workflow_dispatch, success) "from 9 to 10"; run 42511542750 (d26335da) "from 10 to 11"; run 42791080592 (5433323c) "from 11 to 12". All three show `PROFILE: testflight`. Created 8 Nov 12:58 AM PST, 8 Nov 10:45 AM PST, 10 Nov 1:29 AM PST. So 10, 11, 12 with no gap, and "8 Nov 2026" is right for both earlier runs.
- Build 11 = d26335da: `review-persist.logic.ts` there re-arms a timer on every change (`handle = timers.setTimeout(flush, delayMs)` after clearing it) and `drafts.ts`/`migrations.ts` carry `review_text`. A pure debounce. True.
- Build 10 = 13980751: `git merge-base --is-ancestor 34f848b7 13980751` is false (it predates #522). At 13980751 there is no `review-persist.logic.ts`, no `reviewWriter`, `setDraftReview` or `review_*` column anywhere in `apps/mobile/src`, `apps/mobile/test` or `supabase`; in `review.tsx` the typed words (`userText`) are component state only and the only draft write is `setDraftChild`. "No Review writer at all" is exact.
- "no sign of a build cut by hand": a hand-cut `testflight` build would take a counter value and leave a gap; there is none between 9 and 12. The clause says "no sign", names its limit (App Store Connect not checked), and builds before 10 also predate #522, so they do not change the writer question. Sound as hedged.
- Still true from my last pass: run 42791080592 facts (dispatch on develop 5433323c, `SUBMIT: true`, 1:29 AM to 1:48 AM PST, build number 12, 1.0.0, "successfully uploaded" for ASC app 6829163677, Apple processing not seen), 5433323c contains fc7c0afb, the cancelled run on 09dc475c at 12:11 AM PST. The text still does not claim Apple processed it, that testers have it, or who started it.

**PR body.** Matches the row: build 11 old debounce, build 10 predates #522 with no Review writer ("corrected after Review A"), the counter ran 10, 11, 12 with no gap and App Store Connect was not checked, "1.0.0 (12) or later", and the same "Not verified" list. No remaining claim that all earlier builds have the old writer, and no stale phrase left in the repo ("in no TestFlight build", "builds out today", "Builds before it": no hits that mention BL-816).

**Ran at this head.**
- `node scripts/agents/check.mjs`: 445 tasks, consistent, exit 0. Agent and trace tests: 170 pass, 0 fail. `node scripts/qa/release-catalog.mjs --check`: exit 0.
- `parseBacklog`, develop vs head, every key of every record (445 each): one difference, BL-816 `statusText` (2496 to 2898 chars). BL-816 reads status done, owners ['mobile engineer'], mode agent, dependsOn [], blockers []; the text has none of "Mode:", "Owner:", "Milestone:", "Size:", "Depends on:". `eligibility()` over all 445: no differences (147 eligible both).
- Added lines: 1; bytes >= 0x80: 0; no `...` or `--`. `git merge-tree --write-tree origin/develop 424ec5a7`: clean, exit 0.

**Must-fix.** None.

**Notes (optional).**
1. S1-166 "Needs" (DEVICE_TEST_PLAN.md) could name "1.0.0 (12) or later" now that the build exists; not taken, and the row's wording already points at it.
2. Carried: first person in a backlog row ("I did not see", "I found no sign"); "It has not run on a phone" is an absence I cannot check.
3. The PR title says "alpha 12"; the row says "EAS build number 12", which is the right term (open PR #707's "Build 12" is a different, planned product cut).

**CI at 424ec5a7 when I looked:** agent team consistent, applied migrations unchanged, compliance-fence (2), install: success. typecheck, tests and content rules, database rules, edge functions, no e2e seam: in progress. No `required` row yet; `mergeable_state` blocked (pending checks, mergeable true). A PASS holds only once required CI is green at this exact head.

**Not verified.** Apple's processing of build 12; whether it is in any tester group or any tester has it; who started and who approved run 42791080592 (GitHub shows only the owner account); App Store Connect's build list; anything on a phone.

Reviewer: independent of the author (CR-44).
