# Path guard: keep agent PRs inside their lane (hole H16)

Problem: agents have blanket edit rights, including `.github/workflows`. Branch protection (PR required, two required checks) is the real guard, but nothing machine-checks that an agent PR stays in its lane. This adds that check. Nothing here is wired yet: no workflow was edited, and no PR is opened before Thu 5 Nov 2026 (freeze).

Files: `scripts/agents/pathguard.mjs` (+ `.test.mjs`), `agents/lanes.json`, `scripts/agents/guard-open-prs.mjs` (+ `.test.mjs`).

## What it checks

`checkPaths({ agent, files, lanes })` fails when an agent PR touches any of:

| Rule | Paths |
|---|---|
| workflows | `.github/**` |
| supabase | `supabase/**` |
| roster, lanes | `agents/roster.json`, `agents/lanes.json` |
| decisions, constitution | `docs/DECISIONS.md`, `CLAUDE.md` |
| legal | `docs/legal/**` |
| content | `packages/content/**` |
| faithful-edit | `packages/core/src/types.ts`, `packages/core/src/verify.ts` |
| lockfile | any `package-lock.json`, `npm-shrinkwrap.json`, `yarn.lock`, `pnpm-lock.yaml`, `bun.lock(b)`, `deno.lock`, `Podfile.lock`, `Gemfile.lock`, `Cargo.lock`, `poetry.lock`, `composer.lock`, `Pipfile.lock` |
| scripts | `scripts/**`, unless on `scripts_allow.<agent>` in `agents/lanes.json`; `scripts/agents/**` is never allowed |
| outside-lane | anything not matched by the `allow` list of a lane whose `agent` is the PR's agent |

The hard rules cannot be unlocked by a lane. An agent with no lane may change nothing. Lanes: `backlog-hygiene` (agent `product`) allows only `docs/BACKLOG.md` and `docs/FOUNDER_TASKS.md`, matching `docs/agents/lanes/backlog-hygiene.md` section 2 on `test/pilot-seeded-tasks`.

Tricks handled: a rename or copy counts as touching both the old and the new path; deletions count; `..` segments, absolute paths, drive letters and control characters are rejected (not resolved); case is folded (macOS and Windows file systems); backslashes, `./`, `//`, trailing dots and spaces, and fullwidth Unicode (NFKC) are normalised; symlink (mode 120000) and submodule (160000) entries are rejected on either side of a change; an empty diff, an unknown base, a missing lanes file or a bad handle all fail closed.

CLI exit codes: 0 ok, 1 violations (each printed as `[rule] path: reason`), 2 could not decide. The CLI uses `git diff --raw -z -M base...head` (merge-base form, so only the PR's own changes count).

## Wiring it (after 5 Nov; founder applies, not applied to `.github/`)

The agent identity comes from the `agent:*` label (the same source of truth as `agentOfPR` in `lib.mjs`). Run the guard from the base branch's copy of the scripts and lanes, never from the PR's own checkout, or an agent could edit the guard in the same PR (the guard also forbids `scripts/agents/**`, but defence in depth is cheap).

```yaml
# .github/workflows/pathguard.yml
name: pathguard
on:
  pull_request:
    types: [opened, synchronize, reopened, labeled, unlabeled]
permissions:
  contents: read
  pull-requests: read
jobs:
  pathguard:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          ref: ${{ github.event.pull_request.base.sha }}
          path: base
          fetch-depth: 1
      - uses: actions/checkout@v4
        with:
          ref: ${{ github.event.pull_request.head.sha }}
          path: pr
          fetch-depth: 0
      - uses: actions/setup-node@v4
        with:
          node-version: 22
      - name: Check lane
        env:
          LABELS: ${{ join(github.event.pull_request.labels.*.name, ' ') }}
          BASE_SHA: ${{ github.event.pull_request.base.sha }}
          HEAD_SHA: ${{ github.event.pull_request.head.sha }}
        run: |
          agent=""
          for l in $LABELS; do case "$l" in agent:*) agent="${l#agent:}";; esac; done
          if [ -z "$agent" ]; then echo "No agent:* label: not an agent PR, nothing to check."; exit 0; fi
          cd pr
          node ../base/scripts/agents/pathguard.mjs \
            --lanes ../base/agents/lanes.json \
            --agent "$agent" --base "$BASE_SHA" --head "$HEAD_SHA"
```

Then add the check name `pathguard` to the required checks in branch protection (founder, Settings). Notes: a PR from an agent that someone relabels is still guarded because the check also runs on `labeled`/`unlabeled`; removing the `agent:*` label makes it a non-agent PR, which stays under normal human review (branch protection), so the label is not the only guard. Two things to verify before requiring it: that `--cwd` is not needed (the step does `cd pr`), and that a PR with several `agent:*` labels picks the last one (consider failing instead).

Optional flood guard in an agent run's pre-step (needs `pull-requests: read`):

```yaml
      - name: Open agent PR cap
        env:
          GH_TOKEN: ${{ github.token }}
        run: node scripts/agents/guard-open-prs.mjs --max 15 --repo "$GITHUB_REPOSITORY"
```

It counts open PRs with an `agent:*` label through the REST API (100 per page, at most 20 pages), exits 1 at or above `--max`, and exits 2 (fails closed) on any HTTP error, bad response or hitting the page cap.

## What it does not catch

- Content inside an allowed file. A lane that allows `docs/BACKLOG.md` can still write bad text there; review and the lane charter judge that.
- A wrong agent label. Identity is the label; anyone with triage permission can set it. An unlabeled agent PR is not checked.
- Edits made outside a PR: direct pushes (blocked by branch protection, not by this), and workflow runs that modify files without committing.
- Generated or binary content that a lane legitimately allows.
- Renames git does not detect as renames: these appear as a delete plus an add, and both are checked, so they are still caught.
- Only the agents with a lane in `agents/lanes.json` can pass. Today that is `product` for the backlog-hygiene pilot; every other agent PR fails with `no-lane` once this is required. Add lanes before requiring the check for them, or the check blocks all other agent PRs.
- The guard is only as strong as `agents/lanes.json`, which is protected only by being on its own hard-forbidden list and by human review.
- Not exercised in a real workflow yet. The YAML above is UNVERIFIED.

## Rollback

Remove `pathguard` from required checks in branch protection (founder), then delete `.github/workflows/pathguard.yml`. The scripts are inert on their own; nothing else imports them. To loosen one lane, edit `agents/lanes.json`.
