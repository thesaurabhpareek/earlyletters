# Task: a drive-by PR spends review runs and writes its title into a brief

You are fixing `pool.mjs` in this directory. Edit only that file (`trust.mjs` has the helpers; do not change it).

`d041Pool` picks the open PRs that may receive an independent review run. `reviewReason` builds the one-line reason that is pasted into the reviewing agent's brief. The repository is public, so anyone can open a PR with any title.

Two bugs:
1. Any outsider PR is in the pool, so a drive-by PR that touches workflows can spend a review run on every push. Only PRs from trusted authors (see `isTrusted` in `trust.mjs`; the PR author is `pr.user`, with `pr.author_association`) may be in the pool. Keep the existing exclusions (agent PRs, drafts, the release PR whose head ref equals `base`) and the oldest-first order.
2. `reviewReason` prints `undefined: <title>` for a non-agent PR, and the raw title reaches the brief. Required: when there is no agent handle, use the PR author's login (or `pr` if there is none). The title must be flattened to a single short line: no backticks, no line breaks, at most 100 characters of title.

Keep both exported names and signatures.
