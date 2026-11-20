# How to review a new-scope design PR (Karma, 20 Nov 2026)

You review one or more docs PRs that each add one file under `docs/tdd/new-scope/` (or, for #856, two rulings in `docs/agents/cto/RULINGS.md`). Working copy `/home/user/earlyletters`; `gh api` for REST reads; do not post on GitHub, do not change any branch. Karma posts your files after you hand them back.

Read first: `CLAUDE.md`; `docs/engineering/PRINCIPLES.md` and your own chapters; the folder README (`docs/tdd/new-scope/README.md` on branch `docs/tdd-new-scope-architecture`, PR #857); CR-66 and CR-67 on branch `docs/cto-rulings-cr66-cr67` (PR #856). Sources of truth: the locked cards on branch `docs/prd-lock-v1-20nov` at `450bcb4a` (`git show origin/docs/prd-lock-v1-20nov:docs/product/prd/<file>`); code and decisions on `develop`; the product thread's evaluation inputs on `docs/eng-eval-20nov` (`docs/engineering/eval-20nov/A|B|C*.md`).

What a design review checks (in this order):
1. Facts. Sample at least 20 cites per file (card row ids, file:line on develop or a named PR head) and say how many hold. A false fact that would send a builder the wrong way is a must-fix.
2. Founder and counsel boundaries. The design must not decide a founder or counsel question, set a date, approve a word a parent reads, weaken the constitution, the review gate or a privacy rule, or send a child's voice or picture off the phone without the X2 note. Any of those is a must-fix.
3. The cards win (CR-66). A design that builds against a card without a Conflict line is a must-fix. A Conflict line that is itself wrong is a note.
4. CR-67. Where the file contradicts a CR-67 line, say so as a note (CR-67 wins until the file's next touch), unless the file's fact is right and CR-67's is wrong, which is a must-fix on #856.
5. Your lens: the domain named in your task (code shape and contracts; data and lifecycle; identity and security; privacy and compliance; accessibility and design system).
6. Buildability: for wave 1 and 2 cards, could an agent build each PR in the breakdown from this file and the card alone (files, data, tests per P0 row, owner, two lenses, order)? Gaps are notes, unless a P0 row has no test design, which is a must-fix.
7. Format: ASCII only, at most 400 lines, the TDD 01 tags, no copied card text.

Verdict file per PR: `/tmp/claude-0/-home-user-earlyletters/9c7d4e54-75ea-5024-8f40-e18f5142ba43/scratchpad/reviews/review-<PR>-<A|B>.md`. Line 1 exactly `## Review <A|B> at <40-char head sha>: <PASS|PASS WITH NOTES|CHANGES|FAIL>` (read the head live: `gh api repos/thesaurabhpareek/earlyletters/pulls/<n> --jq .head.sha`). Line 2 `<!-- agent:<your handle> -->`. A PASS WITH NOTES must carry the line `Must fix: none.`; anything that must change goes under `Must fix:` and makes the verdict CHANGES. Then: what you checked (with file:line and how many cites held), findings most serious first, Not verified, and the last line `Reviewer: independent of the author (CR-44).` ASCII only, plain short sentences. Wait until the head is 10 minutes old and CI has finished before you finalise, and say CI's state.

Your reply to Karma: one line per PR (verdict and each must-fix), nothing else.
