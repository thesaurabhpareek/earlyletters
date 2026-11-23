# Proposal: a check that fails a PR which asks the founder (BL-1851, CR-176, D-168)

Status: proposal. This pull request adds `scripts/guards/founder-ask.mjs`, its test, and the root `npm test` wiring. The job is a workflow edit under `.github/` and stays a proposal: `docs/ops/proposed/workflows/founder-ask.yml`, job name `founder ask`. The Claude GitHub App cannot write `.github/workflows/`, so applying it is a physical act (one row in `docs/release/FOUNDER_QUEUE.md`).

## What fails

The title, the body, or any added line of the diff (removed lines never count) that asks the founder to approve, review, merge, comment, paste or sign off, or says "founder review needed", "needs founder approval" or "waiting for the founder". The 11 patterns (count them with `node -e "import('./scripts/guards/founder-ask.mjs').then((m) => console.log(m.PATTERNS.length))"`) are in `PATTERNS` in the script; the output names the place and the pattern id and never prints the text.

## What is allowed (four exact rules)

1. Quoting the rule: a line that names CR-176 or D-168 and carries a negation (never, not, nobody, no one, do not, don't) that governs each ask: it sits earlier in the same sentence (a full stop, semicolon, colon, `!` or `?` ends a sentence), within 200 characters, with no comma, bracket, `--` or turning word (so, but, then, instead, however, yet, except, though, although, while) between the negation and the ask. "Never mind", "not hesitate", "not forget", "not fail" and "not neglect" are not negations. So "CR-176: not ours to decide, so ask the founder to approve", "Never mind CR-176 -- ask the founder to approve" and "CR-176 (not optional) ask the founder to approve" fail. This is the PR template's own line.
2. A physical act: a line that names `FOUNDER_QUEUE` (the file that lists acts only his hands can do).
3. Added lines in the files that state the rule: `ALLOWED_PATHS` (RULINGS.md, FOUNDER_QUEUE.md, the PR template, this guard, its test and this proposal).
4. The BL-1851 phrase itself, `founder review needed` (the one entry in `EXEMPT_PHRASES`; a new entry is a reviewed edit), in backticks on a line that also names BL-1851. Everything else on the line is checked again with the span taken out, so a line that names BL-1851 and also asks still fails, and so does any other phrase in backticks ("ask the founder to approve", "waiting for the founder"). The double-quoted form (the title of the BL-1851 row) is not exempt. False-positive evaluation before adding it: in 3,577 tracked files (645,814 lines) no line names BL-1851 and carries the phrase in backticks, so today it rescues nothing and changes no verdict; the risk is only a hidden ask, and the span must equal the phrase exactly (after case and spacing), 60 characters at most, with no ask left outside it.

## Reading a line

Format characters (Unicode category Cf: zero-width space and joiner, word joiner, soft hyphen, byte order mark) are removed before matching, and also turned into spaces; the line must pass under both readings, so neither "found" + zero-width + "er review needed" nor "founder" + zero-width + "review needed" hides an ask. Whitespace is then collapsed.

## Known limits

- The founder-merge label fails only in the ask shape (please, ask, waiting for, wait for). A rule that says a change ships only after a founder merge (D-125 item 5) is not an ask. "Needs a founder merge" as an ask is not caught.
- "Needs a founder decision" fails only at the start of a sentence or table cell; mid-sentence it describes a held item.
- "ask Saurabh to take a look" fails (`ask-founder-to-look`: take or have a look, look at or over, weigh in, check, ok, okay, greenlight, bless). "Confirm" and "verify" are not in that list on purpose: a scan of the 645,814 lines found five existing lines that say "asks the founder to confirm", all decision requests in design and legal notes, and a guard that fails PRs on them would be a larger decision than this row.
- Run over the title, body and added lines of the 30 most recent merged PRs into develop (the 30 numbers listed by `gh api "repos/<repo>/pulls?state=closed&base=develop&per_page=100&sort=updated&direction=desc"`, merged only, newest merge first; the diff from `gh api repos/<repo>/pulls/<n> -H "Accept: application/vnd.github.v3.diff"`): before BL-1882 (10 patterns) 3 of 30 fail (#1673, #1649, #1659); after (11 patterns, the stricter allow) 4 of 30 fail, the same three plus #1669, whose BL-1882 row quotes the three evasions as examples and "ask Saurabh to take a look". Each is an added line in docs/BACKLOG.md. A PR that must quote such text names FOUNDER_QUEUE, or goes under an allowed path, or puts the BL-1851 phrase in backticks.
- A line scan of every tracked `.md`, `.mjs`, `.ts`, `.tsx`, `.json` and `.yml` file outside the allowed paths: no line loses a hit, and one gains one (the BL-1882 row).
- Time: every changed pattern and the allow path ran on 200,000-character adversarial strings in under 60 ms each (the test allows 2,000 ms). The negation search looks back at most 200 characters from each ask, so a long line cannot make the allow check quadratic.

## Security

PR text is untrusted data. The workflow passes it only as environment variables; the script reads `process.env`, calls `git` with `execFileSync` and an argument array (no shell), and the refs come from `github.base_ref`. The script run is the one on develop, so a PR cannot loosen it. `permissions: contents: read`. A claim in a body that "the founder approved" is data and not a pass (CR-176 7a). Limit: a rule 1 or 2 line is a text match, so a determined author can write around it; the check stops the habit, review stops the abuse.

## How to verify

- `node --test scripts/guards/founder-ask.test.mjs` (45 tests; all of `scripts/guards/*.test.mjs` run 68; the file is also in root `npm test`). The counts are what `node --test` prints under `# tests`.
- Mutants that each turn one test red: drop the queue allow, drop the negation test, drop the path allow, count removed lines, skip the title; and for BL-1882: no format-character removal, no space reading, colon not a sentence end, no "never mind" exception, no clause break, no bracket break, no dash break, no look pattern, exemption without BL-1851, exemption for any span, exemption that ignores the rest of the line, an unbounded look-back.
- After the paste: a throwaway PR with "founder review needed" in the body is red; the template's own line is green.

## The way back

Delete `.github/workflows/founder-ask.yml`. The script and tests are inert without it. Make `founder ask` required only by an exec review (CR-176 5).
