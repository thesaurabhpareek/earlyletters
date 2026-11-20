## Review A at 85f2ab4f7d0da910421e3f1fde75cd99b0583213: PASS WITH NOTES

Lens A (correctness, tests, regressions, data safety), PR 717. Delta review at the new head, one docs commit on 077e9b68. My full review (65700f9a) and the deltas at f4b46b9e and 077e9b68 stand for everything not named here. Head sha confirmed with gh api; develop tip is still d4b8f5f1 and the PR merges into it cleanly (merge-tree rc 0).

**The delta is only the plan lines.** `git diff 077e9b68 85f2ab4f` is one file, docs/qa/DEVICE_TEST_PLAN.md, +2/-2: the S1-165 Steps line and Expected (k). No source, no test, no other doc. The PR's diff against develop is still the same 7 files, +233/-21. Added lines: no dashes, curly quotes, ellipsis or emoji. Re-ran at this sha as a check: qa-release-catalog (reads the plan), write-footer-large-text, write-plus-line, review-write, review-critics, review-view.logic: 6 files, 122 pass, 0 fail.

**Text against the code**
- Expected (k): "pinned above the keyboard if it is below AX1, at the end of the page if it is AX1 or larger" is exactly `footerPlacement(isAccessibilitySize(scale))` (a11y.logic.ts: AX1 and up is accessibility, review-layout.logic.ts:14). It now agrees with Steps (k) (restore the starting size). This closes my note 2.
- Steps (a) "Write down the Larger Text size the phone is on": matches the Needs clause and gives (k) its target.
- Steps (g) "at each open Write and type four lines like those in (c); close Write before the next size": closes the earlier gap (the lines-above-the-pinned-buttons ask needs a letter to count). Close writes the words to a draft (session.close), nothing is lost; those drafts stay on Tonight, which is harmless.

**Must-fix:** none.

**Notes (not blocking)**
1. By step (h) Tonight may hold several typed drafts left by (f) and (g); (h) says "the draft comes back", so the tester should open the one just closed at AX5. Cosmetic; one clause if the author wants it.
2. CI: the previous head's run was abandoned by the runner. At this sha the check list showed only `install` in progress when I looked, so there is no green required CI yet at this head. A PASS holds only once required CI is green at this exact head.
3. Carried over, unchanged and not verified on a phone: where the page rests at open and when the keyboard opens for an empty page at AX3+ (rows (b), (h)); a transient stale `footerTop` if the text size changes while Write is open; iOS content insets assumed zero.

**Not verified:** anything on a phone; the full apps/mobile suite at this sha (not re-run: no source or test change since 077e9b68, where it showed the same 7 expo-config files failing, 61 tests, and 4282 passing); the web e2e flows.

Reviewer: independent of the author (CR-44).
