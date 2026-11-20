## Review A at 126e57018277a37210e8fb48bc819cbea1c96fc0: PASS WITH NOTES

Lens A (is every claim in the diff true; does the backlog still parse and dispatch). This replaces my reviews at e6c6423f and 22797a68. Head confirmed 126e5701: three docs-only commits on fc7c0afb, which is the current origin/develop tip (re-fetched). Diff vs develop: `docs/BACKLOG.md` lines 3008 and 3009, and `docs/qa/DEVICE_TEST_PLAN.md` (S1-166 heading, Needs, (c)). Since 22797a68 the only change is two lines of BACKLOG.md (3008, 3009); DEVICE_TEST_PLAN.md and all code are unchanged. The rest of BACKLOG.md is identical to develop (diffed with 3008-3009 removed).

**Ran at this head.**
- `node scripts/agents/check.mjs`: 397 tasks, "agent team is consistent", exit 0. `node --test scripts/agents/*.test.mjs scripts/trace.test.mjs`: 170 pass, 0 fail. `node scripts/qa/release-catalog.mjs --check`: exit 0.
- `parseBacklog`, develop vs head, full records diffed (397 each): only BL-816 `status` and `statusText` differ. BL-816 reads status done, owners ['mobile engineer'], mode agent, dependsOn [], blockers []. Status text is 1692 chars; it contains none of "Mode:", "Owner:", "Milestone:", "Size:", "Depends on:", so the lazy regex at `lib.mjs:88` still ends it at the real "Mode:". `eligibility()` over all 397 tasks: one change, BL-816 ok to "status done" (126 to 125 eligible). No other task's parse or eligibility moved.
- Added lines: 5; bytes >= 0x80: 0; no dash, curly quote, ellipsis, double hyphen. `git merge-tree --write-tree origin/develop 126e5701`: clean, exit 0.

**What the last commit changed, checked.**
- Status no longer says "so the builds out today have the loss". It now says the 8 Nov runs were found, that whether either reached testers or a build was cut by hand was not checked, and that "which installed builds have the loss ... is not established". That is what I can confirm: `testflight.yml` runs are 42511542750 (success, d26335da, 8 Nov 18:45Z) and 42465181563 (success, 13980751, 8 Nov 08:58Z), nothing newer except a skipped PR run (re-queried now); d26335da's `review-persist.logic.ts` is the pure debounce (re-armed on every change); I could not see from the runs whether either submitted.
- "moving this row to done in code neither rules on it nor clears it": consistent with the row; no severity ruling exists anywhere (no BL-816 hit in DECISIONS.md or the rulings files), and "founder" appears only as "the founder's call". Severity wording is untouched except "breaks today" to "broke before #750" (earlier char-level diff, unchanged since).
- Satisfies is now past tense and dated. "Before #750 (read on 9 Nov 2026; #750 made RT-REV-02 and RT-REV-07 `partial` and pointed them at its test and S1-166) ... were both `gap` at ...:94 and :99, and the catalog listed no evidence at all for RT-REV-07": at fc7c0afb^ both rows were `gap` and neither cited `review-writer-autosave` or S1-166; at fc7c0afb they are `partial` and cite both (rows.mjs:94, :99; CSV lines 65, 70). True. My earlier must-fix is resolved.

**Rest of the status text, carried over from my 22797a68 pass (unchanged text, code unchanged).** #750 merged as fc7c0afb (`merged_at` 2026-11-10T06:00:39Z); bound 300 ms (`review-persist.logic.ts:29`), one `handle`; 24 cases in `review-writer-autosave.test.ts`, and with only the logic file reverted to c1f7cec5 9 fail and 15 pass (the replay test also fails), so 24/9/15 is exact; ~0.5 ms median is Node only (#750 body: 0.46/0.48/0.52 ms) and 300 was chosen for margin under 500 (same body); Review B of #750 accepted one timer and `partial` and said writes match a two-timer writer's unless a write throws, then words wait for the next change or flush (my 4000-schedule differential agrees: 0 of 2000 no-throw runs differ, 45 of 2000 throw runs); PRD wording (`F04-capture.md:319`, `06-nfr.md:59`) and BL-377 (`Status: ready`) are still open; S1-166 (a) to (e) exist on develop, (d) is the typing-feel row, and nothing in the repo records a run; `review-writer-autosave.test.ts:127` and `review-persist.replay.test.ts:205` (100 seeds) assert `raw_transcript` unchanged.

**Must-fix.** None.

**Notes (should fix, not blocking).**
1. `docs/BACKLOG.md:3008`: "it is in no TestFlight build yet" is still stated flat and undated, then the next clause says hand-cut builds were not checked. Those two do not sit together, and the first goes false the day tonight's build is cut. Suggest "no `testflight.yml` run on GitHub as of 10 Nov 2026 contains it".
2. First person in a backlog row ("runs I found", "I did not check"); the rest of the row is impersonal.
3. "merged 10 Nov 2026" is the UTC date; the commit is 9 Nov 22:00 in the author's zone and the row dates same-evening events 9 Nov. Say "UTC" or use 9 Nov.
4. S1-166 Needs "a build cut from develop at or after fc7c0afb" is narrower than "a build that contains fc7c0afb"; the "(line 127)" in (c) will rot on the next edit to the test.

**Device test plan.** S1-166 (a) to (e) is the step; unrun, and the row says so.

**CI at 126e5701 when I looked** (check-runs): agent team consistent, applied migrations unchanged, compliance-fence, install, no e2e seam: success. typecheck, tests and content rules, database rules, edge functions: in progress. No `required` row yet; PR `mergeable_state` is "blocked" (pending checks, mergeable true). A PASS holds only once required CI is green at this exact head; the previous head's CI was all green, and this commit touches one docs file.

**Not verified.** Anything on a phone; whether the 8 Nov runs submitted to TestFlight or any build was cut elsewhere; full `npm test` and `npm run test:db` (docs-only diff; I ran the agent scripts and the catalog check, and at e6c6423f the two content tests that read BACKLOG.md, 148 pass, unaffected since the later edits change no id or status token).

Reviewer: independent of the author (CR-44).
