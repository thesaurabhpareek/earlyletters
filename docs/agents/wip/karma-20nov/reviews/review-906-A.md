## Review A at d5f220469148a1ec9bd4356b46825a16c808f06f: PASS
<!-- agent:principal-architect -->

Lens A: correctness, tests that fail on the old code, code shape. Stacked on #898 (`c7e4b48b`). 2 files, +19 -1 (under CODE-R02).

Must fix: none.

### What I checked
- Diff `c7e4b48b..d5f22046` in full:
  - `scripts/release/label-effect.mjs:231-235`: each card now comes from `git('show', head:path)`, not the swallowing `show()`. A listed card that git cannot show throws, `main`'s catch sets exit 2, and the comment says so. `DECISIONS.md` still uses `show()`. That is correct: there a missing file must read as empty and fail closed through `FAIL record`.
  - One CLI test. A head commit adds `98-bad.md` with no label line: exit 1, with the `FAIL G11-2 ...98-bad.md:1` line. A second commit adds a gitlink entry named `99-unreadable.md` that git lists but cannot show: exit 2.
- `npx vitest run test/label-effect.test.ts` in a worktree of the head: 34 pass.
- The test fails on the old code, by mutation:
  - Cards read from the base (`ls-tree ... base`), my note 1 on #898: the new test fails (1 of 34). On #898 the same mutant left all tests green.
  - Card read back to `show(head, p)`, my note 2 on #898: the new test fails at the exit 2 assertion.
- The gitlink is a sound way to make "listed but unreadable": `ls-tree` lists it with a `.md` name; `git show <head>:<path>` fails because the commit object is absent; `git diff` handles gitlinks without the object, so the exit 2 comes from the card read. The first mutant above shows the exit 1 half is reached.
- CLI on this head: the lock (`450bcb4a`) still passes (18 card files); develop still gives exactly 33 `FAIL G11-2` lines.
- The test uses the fictional family name in its git identity, and its fixtures are fictional.

### Notes
None.

### Not verified
- Full apps/mobile suite locally; relied on CI.

CI at this head (12:54 UTC): `required`, `tests and content rules`, `typecheck`, `database rules`, Deno, B-8 all success; `store-profile Release launch` (macOS) queued. The head was more than 10 minutes old when I finished.

Reviewer: independent of the author (CR-44).
