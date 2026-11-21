# Learning loop: how the harness finds its own errors faster

Why: on 27 to 28 Oct a human (or a debate advocate) caught most of the errors in `agents/lessons/REGISTRY.md` late, in review. Review is the slowest and most expensive place to find a fixture that models a schema from memory or a check that cannot fail. The founder asked for the harness to identify these faster and improve itself.

## The loop (five steps, each small)
1. **Tag.** Every review finding and every correction in a report gets a class id from the registry, or proposes a new row. Reviewers write `class: L-0x` in the finding.
2. **Count.** A weekly pass (chief-of-staff digest) counts incidents per class from review files under `docs/agents/reviews/` once those are kept in the repo (today they sit in a scratch directory; keeping them is step zero).
3. **Promote.** A class with two incidents must gain a detector within one sprint: a gate in `scripts/agents/gates.mjs`, a CI test, an eval task under `agents/evals/`, or a rule in a reviewer charter. The registry status moves `open` to `eval` to `detected`.
4. **Prove.** A new detector ships with an eval task that fails without it (the runner's `--validate` already enforces fail-on-fixture, pass-on-reference). A detector with no failing case does not count (L-02).
5. **Retire.** A class with no incident in 30 days after `detected` is archived; one that recurs after `detected` means the detector is weak and is itself an incident.

## Faster identification: three pre-review checks to build first
- **C-1 Claim check** (L-01, L-03, L-08): a script reads a PR body, extracts file paths, test counts and table.column names, and verifies each against the diff and `supabase/migrations`. Fails the PR if a path is absent from the diff, a count disagrees with `node --test` output, or a column does not exist. Evals integrity-003/004 already model two of these.
- **C-2 Head-bound reviews** (L-04): the review file records `head: <sha>`; the dispatcher refuses to count a review whose sha differs from the PR head and lists the PR as "needs delta review".
- **C-3 Retired-terms scan** (L-05, L-06): `agents/lessons/retired-terms.json` lists dead rules (`approve-migration`, "no bypass" claims, superseded decisions); CI fails if a live charter or MEMORY.md cites one without the word "retired".

## Not built, stated plainly
Nothing in this PR runs in CI. C-1 to C-3 are specified here, not implemented; they are backlog RB-36 to RB-38. The registry rows are my reading of this session's evidence (V where a review file or command confirms, I otherwise). Review files must move into the repo before step 2 can count anything.
