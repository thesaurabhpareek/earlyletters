## Review B at 98f79298fdcd139ca530be4885e81f70ddb33be0: PASS WITH NOTES

Lens B (voice, claims, privacy and compliance of every word, named-book no-op). PR #716, head verified with gh api as 98f79298 (one commit on b8c1056b). This replaces my review at b8c1056b, whose only must-fix was the S1-191 step (e).

**Code unchanged.** `git diff b8c1056b..98f79298 --name-only` lists one file, docs/qa/DEVICE_TEST_PLAN.md. Every code and test file is byte-identical to b8c1056b, so my code findings there stand as reviewed: no new user-facing word (nothing in packages/content or copy.ts); named books unchanged on Tonight, Write, the Settings row, the Name editor and prompts; only the boolean `childNameBlank` leaves the name; (a) Write showing no line before the birth for a nameless book is acceptable, and (b) the row "Your child" against the spec's "Your child's book" is acceptable and a founder word-approval item. Re-run at this head merged with current develop (9e0f246b, which now holds #722; `git merge --no-commit`, no conflicts, aborted after): 7 related mobile files, 182 tests pass; packages/core 34 files, 1237 pass. `git merge-tree` against develop: clean. Added lines in this commit: no em or en dash, curly quote, ellipsis character or emoji.

**Catalog.** `apps/mobile/test/qa-release-catalog.test.ts`: 8 pass. `node scripts/qa/release-catalog.mjs --check`: OK (the CSV is not stale; it cites S1 ids only in covered_by). `scripts/agents/id-collisions.mjs --pr 716` exits 1 for other PRs' ids (D-139 on #591; BL-757 to BL-774 on #684 and #707) and lists no S1 id from any PR, so it says nothing about S1-191. My own scan of every origin branch (fetched just now) finds no other `### S1-191` heading in DEVICE_TEST_PLAN.md. The branch-only planning doc docs/qa-build12-cut-9nov still names S1-191 in prose (no PR).

**Does step (e) now run where the name prompts can be drawn? Yes, and it can fail.** The text now sets the birthday about two months ago (band 0-3, `bandFor` under 4 months, core prompts.ts:29) and says why. I simulated the real library with the flag off (what a regression looks like) and on, over 120 start dates (20 presses): a two-month-old, flag off: the name prompt is drawn on Write on 120 of 120 days (Write cycles its shown list) and on Tonight on 107 of 120; flag on: 0 of 120 on both. A seven-month-old: 0 of 120 either way (the old step could not fail, confirmed). Expecting book, flag off: Write 120 of 120, Tonight 110 of 120; flag on: 0. So (e) is a real check through its Write presses.

**Consistency of the Expected lines.** (a) "2 MONTHS" or "2 MONTHS AND 1 WEEK" and (g) "Asha, 2 months" match `ageLabel` (core age.ts:63-70). (e) wording is generic enough for #703: "no prompt about how the name was chosen or where it came from", with today's two texts given as examples and "#703 may reword them" (#703 retires `opening.before.name`, adds `name-story`, and both match `isNameThemed`). (h) now adds twenty presses on Tonight and "the before-birth set also holds name prompts". The Record line ("by key, never by a child's name") is unchanged and fine.

**Notes (none blocks).**
1. Step (a) still says VoiceOver is "not 'dot 7 months'": a leftover 7 in the one place the rest was changed to 2. One word.
2. "About two months ago" can read "2 months and 2 weeks", or "1 month and 3 weeks" if a day is miscounted, while (a) and (g) name only "2 MONTHS" or "2 MONTHS AND 1 WEEK". Say "the same date two months back", which gives exactly "2 MONTHS" and "Asha, 2 months".
3. (h) presses only on Tonight, which catches a regression on about 92 percent of days (110 of 120). Add twenty presses on Write for the expecting book, as (e) does, to make it certain.
4. (e) calls the two name prompts "of the first months": one is for a book before the birth, which a two-month-old never meets; harmless, since the tester looks for any name question.

**CI at this head.** `required`, typecheck, tests and content rules, database rules, compliance-fence, Deno, B-8 and the rest: success; iOS simulator build skipped; `store-profile Release launch (testflight env, no seam, 20 s)` was still in progress when I read it; mergeable_state blocked. A PASS holds only once every required check is green at this exact head.

**Not verified.** Device rendering and the device row itself (I checked the step against the code and a simulation, not a phone); full apps/mobile suite and tsc (CI typecheck green); the five other NX-36 founder design answers.

Reviewer: independent of the author (CR-44).
