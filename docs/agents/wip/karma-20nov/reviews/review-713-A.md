## Review A at 97835c3116558dc83d2424d456096016b9a0b642: PASS WITH NOTES

Lens A, correctness and tests. PR 713, delta re-review. Head 97835c31 (read with gh api, matches), one commit on top of f6f80713, which I reviewed earlier (PASS WITH NOTES, no must-fix). origin/develop is still 6cd2223b (the merge-base). Fresh detached worktree at 97835c31.

### Delta
`git diff f6f80713 97835c31`: one file, `docs/qa/DEVICE_TEST_PLAN.md`, one line (S1-150 Steps). No source, no test, no token change; the code reviewed earlier (helpline-card.tsx `variant="outline"`, the 10 tests) is byte-identical. No non-ASCII characters in the added line.

S1-150 (g) now reads: "Set Region back to United States (step (c) left it on Germany, which shows no lines). In the app, Settings > Appearance > Theme: Match this phone. In iOS Settings > Display & Brightness choose Light, ... Dark ... Increase Contrast ..." I checked it against the app:
- Region reset: step (c) sets Germany and nothing resets it, and the plan's own Expected (b) and (c) say Germany shows no lines and no button, so without the reset (g) would show no Call or Text to look at. The reset is correct and needed.
- Setting path: Settings home has an "Appearance" row (`settings/index.tsx:142`, `appearanceLabel`); that screen has a "Theme" section (`appearance.tsx:40-44`, `themeLabel`) with the option "Match this phone" (`strings.en.ts` `themes.system`). The path in the text is exactly what a tester sees. Review note 1 from my last pass is closed.

### Ran
- helpline-buttons-visible 10/10; with settings-help (17), struggling-regions (22), theme-leaks (4), qa-release-catalog (8), settings-home (16): 77/77 pass. qa-release-catalog (which reads this plan) passes with the new text.
- `git merge-tree --write-tree origin/develop 97835c31`: clean, exit 0.
- PR body (read at this head): line 11 now says "Call on each and Text where the line has a text number"; the full-suite bullet now says "run before the tenth test was added; not re-run at this head". Both match what I found. The label correction from the previous round is still in.

### CI at this head (when I looked)
Not finished: database rules, typecheck, tests and content rules, B-8 seam check were in_progress; Deno functions, install, applied migrations unchanged, native files changed: success; iOS simulator build: skipped; store-profile Release launch: queued; the `required` check had not appeared yet. A PASS holds only once required CI is green at this exact head. A docs-only commit cannot change the tests I ran, but it does retrigger the gates.

### Must-fix
None.

### Nits
- Body line 11 still ends "gives each line two equal, visible, quiet buttons"; lines without a text number have one. Same sentence as the one just corrected, so worth one more word before squash.

### Not verified
Rendering on a device; the full apps/mobile vitest and tsc at this head (neither can change in a one-line docs delta; the last full run was at e23b9994 and tsc at f6f80713); CI completion; that Germany has no lines in code (I relied on the plan's own Expected text and the struggling-regions tests passing).

Reviewer: independent of the author (CR-44).
