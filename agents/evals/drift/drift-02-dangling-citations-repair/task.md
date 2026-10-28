# Task: repair the dangling citations

The tree in the working directory is a slice of the Early Letters repository. Eight files cite `docs/release/ALPHA_PLAN.md`, which is not in the tree. It was never merged: the pull request that carried it (PR #152) was closed unmerged on 23 Oct 2026, and its branch is `docs/alpha-plan` at commit `1ae1ace6`. You do not have that branch and must not try to rebuild the plan from memory or guess its contents.

Make every citation resolve, so that a reader who follows one lands on something true.

Rules:
- `docs/DECISIONS.md` is the record of founder decisions. Never edit it, even to fix a citation inside it.
- Do not delete any citing file.
- Cite only files that exist in the tree. Do not invent file paths, section numbers or decision ids.
- Where the tree already holds the content now (go/no-go checks, pipeline and founder steps, TestFlight builds, environments, the release train), point there.
- Content rules for anything you write: no em dashes, en dashes, curly quotes, ellipsis characters or emoji. Plain, short sentences.

The tree is graded by code: it checks that every citation resolves and that nothing in what you wrote points at a file that does not exist.
