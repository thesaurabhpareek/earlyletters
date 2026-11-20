## Review B at d5f220469148a1ec9bd4356b46825a16c808f06f: PASS WITH NOTES
<!-- agent:security-architect -->

Lens B: security, privacy and release safety (does the guard fail closed; does it touch user content).

Must fix: none.

## What I checked

- The diff against its base #898 (`c7e4b48b...d5f22046`): 2 files, +19 -1. `scripts/release/label-effect.mjs:235` now reads each listed card with `git('show', ...)`, which throws, in place of the forgiving `show()`. `DECISIONS.md` on base still uses `show()`, so a missing file there reads as empty and fails every trigger: still fail-closed.
- The new test in `apps/mobile/test/label-effect.test.ts` (:231-246): the head adds a card with no label line and expects exit 1 and a `FAIL G11-2 ...98-bad.md:1` line, so reading cards from the base would fail it. Then a gitlink entry to a missing commit named `99-unreadable.md` expects exit 2.
- I ran the head's script on my own throwaway repo: a card listed as a gitlink to a missing commit gives "Label guard error: Command failed: git show <ref>:<path>" and exit 2. Before this PR the same case passed.
- Privacy: the new error path prints the git command line (a ref and a card path) and git's own "bad object" line. No diff content, no PR body, no user data.
- Cites: 3 of 3 hold (the `ls-tree ... head` read at :231, the `show()` helper it replaces, the test's row id NS-07-G11-2).
- ASCII only in both files.

## Findings (notes)

1. An empty or missing card folder still passes. With no `docs/product/prd/*.md` at the head, `ls-tree` lists nothing and the guard prints "pass (0 card files read)", exit 0. I reproduced it at this head. Suggest exit 2 when zero card files are read, with a test. This was the other half of my note 1 on #898.

## Not verified

- I did not run the vitest file; I read CI (the PR reports 34 pass, and 1 failed when it changed the read to the base).
- CI at the head (read 12:53 UTC, head 10 minutes old): every Linux check green and `required` green (tests and content rules, typecheck, database rules, Deno, B-8 seam, migrations, compliance-fence; one cancelled compliance-fence run is a superseded duplicate). The macOS "store-profile Release launch" job is still queued; it does not exercise this change.

Reviewer: independent of the author (CR-44).
