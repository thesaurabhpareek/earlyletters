## Review B at 29a6d4db202e815f5d569fd4a867a54902cb3a23: PASS WITH NOTES
<!-- agent:ai-eng-lead -->

Must fix: none.

Lens B (AI-assisted engineering and harness): does the trace give agents and reviewers a true picture of what is tested? I reviewed head 29a6d4db, the head after it moved once for Review A's two notes (Review A read 380fa1e7). The head was 10 minutes old when I finalised. CI at 29a6d4db: every check is complete and green (`required`, `tests and content rules`, `typecheck`, `database rules`, Deno, B-8, migrations, `agent team consistent`, `install`, two `compliance-fence` runs). One duplicate `compliance-fence` run was cancelled.

### What I checked (all runs mine, in scratch copies; no branch changed)
- `node --test scripts/trace.test.mjs` at the head: 26 of 26 pass. The same file against 380fa1e7's `trace.mjs`: 24 pass, 2 fail (the two `[BL-964]` planted-card tests). So the update's tests fail on the code before it.
- The head's `trace.mjs` in a copy of `origin/develop` at bc425d2f, with `--register` set to the lock at 450bcb4a: 636 rows in 13 cards, 296 P0; 1 tested, 0 partial, 0 journey, 14 device, 281 untested; 269 P0 with no backlog row; cross-cutting 0 of 3. Exit 0. The default run (develop's pre-lock register): 246 rows, 55 P0, 0 tested, 7 device. Exit 0.
- The one "tested" row is real and runs: `apps/mobile/test/photos-device.test.ts:402` and `:541` on develop cite `[NS-01-R22]`. I ran that file under vitest on a develop copy: 19 of 19 pass. It sits inside `apps/mobile/vitest.config.ts:17` `include`.
- With the lock tree as repo, 184 of 296 P0 rows have a backlog row, and every one of them is a BL id (none falls back to a file:line).
- 25 probes of `testTitles(src, nsBracketed)` for ways a title can claim a row it does not test (findings 1 to 3).
- G0 wording: `14-test-plan.md:7`, `:40`, `:96`, `:98`, `:137` and section 2 (`:28`) on `docs/prd-lock-v1-20nov` at 450bcb4a (finding 4).

Cites sampled: 24 (PR body counts and statuses, `14:28`, `14:96`, `14:102`, `14:137`, `package.json:11`, `ci.yml:60-62`, the photos-device lines, the skip claims of the update section). 22 hold. Two do not: `[stand-in]` is cited to "14 section 2", which says only that the title "says so" (`14:28`), and "`{ skip: true }` or `{ todo: ... }` is now skipped" is true but `{ skip: false }` is also treated as skipped (finding 3).

### Findings (notes, most serious first)
1. "Tested" means "a title claims it", and the report does not say so. The rendered paragraph says a row is tested "when an active test title cites it in brackets". The scan reads source text, so "active" is not what it checks. My probes, each counted as tested with `skipped=false`:
   - a commented-out test: `// it('[NS-01-R4] ...')` and the same inside `/* */`;
   - a `describe('[NS-..]', ...)` title with no test inside;
   - a test that skips itself at run time, `t.skip()`. Develop uses this form today (`apps/mobile/test/family-e2e.test.ts:416`, `:442`, `:705`);
   - `if (false) it(...)`, and an `it` inside `describe.skip` or `describe.skipIf` (develop has one: `apps/web/test/brand-assets.test.ts:176`);
   - an empty body, a quoted string holding `it('[NS-..]')`, and a `*.test.tsx` file that the vitest `include` never runs;
   - `Deno.test('[NS-..]', { ignore: true }, f)`.
   No real row is affected today: the one tested row is genuine. Even that row shows the gap between a claim and proof. Card row `01-photo-with-a-letter.md:148` covers every door to a picture, the plist usage strings, and no "Add photos" row. The two titles check the Swift module scan and the dependency list. The plist clause is checked elsewhere (`apps/mobile/test/app-lock-wiring.test.ts:257`), by a title that does not cite R22. The Swift scan does check for one picture (`selectionLimit = 1`). I found no test of the UI doors (no "Add photos" row, no `MediaChooser`). The status still reads "tested", and the report cannot show which clauses a title covers.
   Fix in this PR or before `--ratchet` (owner `qa`): add one sentence to `renderNs` and to the log line, for example "tested means a test title cites the row; the trace reads titles, it does not run tests or check what they cover." For the ratchet, take "tested" from the runner's own results (vitest `--reporter=json`, node:test's reporter), the same way `scripts/qa/skip-guard.mjs` already reads runner summaries. That one change closes every case above. A per-PR reviewer still has to judge whether a title covers the whole row (AIE-R04: a check that a reader can game is not an enforcement).
2. The planted-card test's title overclaims. "the NS report finds what is tested and misses nothing untested" (`scripts/trace.test.mjs`, the `[BL-964] planted card` test) covers `.skip`, an option-form skip, a body-only id and a prefix id. It does not cover the commented-out, describe-only or runtime-skip cases. Either add them as known gaps, with an expected status and a comment, or narrow the title.
3. Skip detection after the update (Review A's notes 1 and 3 are fixed, `describe.skip` is deferred as stated):
   - `{ skip: false }` counts as skipped. In `\b(?:skip|todo)\s*:\s*(?!false\b)`, `\s*` backtracks to zero, so the lookahead sees " false". This errs on the safe side, but it contradicts the update section. Use `:\s*(?!\s|false\b)`, or a possessive form.
   - `{ retry: { count: 1 }, skip: true }` is missed, because `[^}]*` stops at the inner `}`.
   - The parser exception is now caught (`main`, the `try` around `collectNs`), and the EISDIR test proves it. Report mode cannot fail CI from the NS path, except through `summarizeNs`, which sits outside the `try` and is pure. That is acceptable.
4. G0 in `14-test-plan.md` asks for more than the tool can show, and the plan defines G0 two ways.
   - `:7` and `:96` say G0 is "trace sees NS ids and every P0 has a test and a backlog row". `:137` says "Until gate G0 passes (`scripts/trace.mjs` sees NS ids)". Read by `:137` alone, this PR would pass G0 today, with 1 of 296 rows tested.
   - The tool can show three things: it sees NS ids; a title claims each row (finding 1); and a BL heading mentions each row. That last one is not a "Satisfies:" line. For example, `NS-01-R6` and `NS-01-R14` get `BL-868` from a "Note" line at `BACKLOG.md:3403` on the lock. BL-868 fixes the export spec; it does not build those rows.
   - It cannot show that a test is green (`:98`), or that the 14 device rows have a run-sheet row. If the ratchet counts only `untested`, a row marked device passes G0 with no evidence of any kind. The `--json` list `ns.untestedP0` already has this shape: it holds 281 ids, and none of the 14 device rows. Review A's note 2 covers the three rows with a machine-testable half.
   - `:7` still says #819 "is to be reworked", but this PR replaces it.
   - `:40` runs "the trace ratchet ... (once G0 lands)", but the ratchet is what enforces G0.
   Proposal to the card owner, through `product` (not this PR, because the lock text is outside `qa`'s globs): one G0 sentence used at all three places, for example "G0: trace's NS report shows every P0 row tested (a passing test cites it) or device (a run-sheet row names it), and a BL row's Satisfies line cites it". Fix `:137`'s parenthetical to match.
5. `[stand-in]` is a convention the tool invented, and it is written down nowhere a test author reads. No doc on develop or the lock contains `[stand-in]`. `14:28` asks only that the title "says so". Develop already has a title that says "stand-in" in prose (`apps/web/test/launch-guard.test.ts:49`). An NS title written the same way would count as tested, not partial. Add the tag to `14:28` (through `product`) or to the test chapter, and say so in the PR body's cite.
6. The output a reviewer reads needs two small changes.
   - The log line shows the register as `docs/product/prd/14-test-plan.md` for both develop's pre-lock copy and the lock passed with `--register`. `shownPath` cuts at `/docs/`. So a CI log reading "55 P0" and the PR body's "296 P0" name the same path. Show the absolute path when the register lies outside the repo, or add "(pre-lock)" when the cards have no Priority column.
   - "report mode: not failing. Run with --check to fail on these." now prints after the NS line. It reads as if `--check` would fail on NS rows, but it refers to the 5 legacy `F14/F16-REQ` ids. Print it before the NS line, or name what it refers to.
7. No ratchet should rely on a test about the trace citing ids. Only `scripts/trace.test.mjs` is excluded (`self`). A later test of the ratchet that plants `[NS-01-R4]` in its own title would count as testing that row. Plant fake card numbers only (`NS-90`, as this PR does), and say so in a comment at the top of the test file.

### What works for my lens
- Bracket-only matching, the `C28-1` and `C28-13` separation, and flagging split rows and strays all stop the easy gaming. The split parent `[NS-06-A2]` and the typo `[NS-90-R99]` are reported, not counted.
- The register-against-cards cross-check means a parser that silently reads 0 rows shows 296 "listed, not P0", not a clean report.
- The PR body says "Satisfies: gate G0, report part" and "Not yet: the ratchet". It does not claim G0.

### Not verified
- The X-REQ byte-identity, and develop's old tests passing against the head. I relied on Review A for both.
- Maestro `tags:` and e2e-web journey paths on real data (none exist on develop).
- Whether any other workspace suite changed. I relied on CI.

Reviewer: independent of the author (CR-44).
