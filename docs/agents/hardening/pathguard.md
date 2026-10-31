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
| claude-config, agent-docs | `.claude/**`, `docs/agents/**` |
| manifest | any `package.json`, `.gitmodules` |
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

The agent identity comes from the `agent:*` label (the same source of truth as `agentOfPR` in `lib.mjs`), passed as `--labels`. Rules, in `agentFromLabels`:

- Exactly one `agent:*` label: that agent's lane applies.
- More than one: rejected, exit 1, with a message. Label order can be changed by anyone with triage permission, so picking "first" or "last" would let a broad lane be chosen. Order never matters (tested).
- None: out of scope, exit 0. Why: the guard cannot know whose lane applies, and an unlabeled PR is a human or fork PR that is already under branch protection and review. Treating it as an agent PR would block every human PR. The cost: an agent that strips its own label escapes this check (see below).

Run the guard from the base branch's copy of the scripts and lanes, never from the PR's own checkout, or an agent could edit the guard in the same PR (the guard also forbids `scripts/agents/**`, but defence in depth is cheap).

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
          LABELS: ${{ join(github.event.pull_request.labels.*.name, ',') }}
          BASE_SHA: ${{ github.event.pull_request.base.sha }}
          HEAD_SHA: ${{ github.event.pull_request.head.sha }}
        run: |
          cd pr
          node ../base/scripts/agents/pathguard.mjs \
            --lanes ../base/agents/lanes.json \
            --labels "$LABELS" --base "$BASE_SHA" --head "$HEAD_SHA"
```

Then add the check name `pathguard` to the required checks in branch protection (founder, Settings). The check also runs on `labeled`/`unlabeled`, so relabelling re-evaluates it.

Optional flood guard in an agent run's pre-step (needs `pull-requests: read`):

```yaml
      - name: Open agent PR cap
        env:
          GH_TOKEN: ${{ github.token }}
        run: node scripts/agents/guard-open-prs.mjs --max 15 --repo "$GITHUB_REPOSITORY"
```

It counts open PRs with an `agent:*` label through the REST API (100 per page, at most 20 pages), exits 1 at or above `--max`, and exits 2 (fails closed) on any HTTP error, bad response or hitting the page cap.

`--max` defaults to 15. Chosen because the OpenCode stop gate (W4, `docs/agents/hardening/opencode-lane.md` section 4) uses 15 as its backstop, while the dispatcher's roster `max_open_agent_prs` is 10 and stops new work earlier. Two numbers are deliberate: 10 is the soft limit for new assignments, 15 is the hard backstop when the dispatcher is bypassed. Whether to keep both is the founder's decision (W4 decision 8.3).

## Rollout note (first week)

Requiring `pathguard` blocks every agent PR whose agent has no lane in `agents/lanes.json`. Today only `product` (backlog-hygiene) has one, so in week one every other agent PR (ops, qa, mobile and so on, whichever the dispatcher still opens) fails with `[no-lane]`, and any agent PR with two `agent:*` labels fails with the multiple-label message. Expect red checks on those PRs, not on human PRs (no agent label means out of scope). Suggested path: run the workflow non-required for the first week, read the failures, add lanes for agents that should keep working, then make it required.

One-step rollback: in branch protection, remove `pathguard` from the required checks (a setting, effective immediately, no merge needed). Deleting the workflow file comes second.

## Open differences with W4 (`docs/agents/hardening/opencode-lane.md` at 19681459)

Compared by reading only; W4's branch is not edited.

1. Open-PR cap: same number (15) and same label rule (`agent:` prefix). Differences: W4's gate uses `gh pr list --limit 300` (a silent cap above 300, GraphQL under the hood), mine uses REST with pagination and fails closed at 2000. W4's gate stops quietly (`go=false`, exit 0, warning); mine exits 1 at or above the max and 2 on errors, so a workflow using mine must treat 1 as "stop, not a failure" if it wants W4's quiet behaviour. Unresolved: which behaviour the run path wants.
2. Path rules: W4 has an allow regex `^docs/` plus a deny regex (`.github/`, `supabase/`, `scripts/`, `agents/roster.json`, `.claude/`, `CLAUDE.md`, `package(-lock).json`, `.gitmodules`, `docs/agents/`). I added `.claude/**`, `docs/agents/**`, any `package.json` and `.gitmodules` to my hard rules to match. W4's pilot allow-list is all of `docs/` (minus `docs/agents/`), mine is per-lane files (`docs/BACKLOG.md`, `docs/FOUNDER_TASKS.md`). Mine is narrower; for the product pilot the two lanes disagree until W4 narrows its `PUBLISH_ALLOW` or the founder accepts both (both must pass).
3. Check point: W4 checks every commit in the agent's bundle before publishing (so a bad commit hidden by a later revert is caught), mine checks the net diff of the PR (`base...head`). Mine would miss a path touched and then reverted inside a PR. Not resolved; running both is the safe option.
4. Renames: W4 uses `--no-renames` (both paths show as delete and add); mine uses `-M` and checks old and new explicitly. Equivalent result.
5. Symlink and submodule: both reject. W4 also caps commits (10), files (40), bytes (5 MB) and rejects merge commits; mine has no size or count limits.
6. Normalisation (`..`, case folding, NFKC, trailing dots, control characters) exists only in mine; W4 relies on git's own path output and plain regexes, so a case variant such as `CLAUDE.MD` on a case-insensitive checkout is not matched by its deny regex.
7. Names and flags: W4 has inline shell, not a script, so there is no flag or exit-code contract to align yet. If its steps are moved to scripts, use `--agent`/`--labels`, `--base`, `--head`, `--max`, `--repo` and exit codes 0, 1, 2 as here.
8. Identity: W4 labels PRs in its publish job (`agent:${AGENT}`); the label the guard reads is therefore set by the same pipeline it guards. Mine assumes labels are trustworthy within the limits listed above.

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

## Round 4 and 5 changes (31 Oct 2026, UNVERIFIED in a workflow: none runs this script yet)

- Identity does not rest on labels. `--labels` now requires `--branch <head ref>` and `--author <login>` (add `--author-type Bot` for an App account); missing either exits 2, never 0. `--agent <handle>` also requires them unless `--offline` is passed (a local check with no PR). When branch or author are present with `--agent`, identity is still checked. Exit 1 when a branch prefix `agent/<handle>/` or a bot author has no `agent:*` label, or when the label and branch handle disagree. The workflow step in the section above must pass `--branch "$HEAD_REF" --author "$AUTHOR"`; the YAML there is not updated (frozen `.github/**`).
- Every commit in `base..head` is checked, not only the net diff, so a forbidden path added in one commit and removed in the next fails. Caps (flags, defaults from the lane proposal): `--max-commits 10`, `--max-files 40` (distinct paths over all commits), `--max-bytes 5242880` (sum of blob sizes of added or changed files). A merge commit in the range fails.
- Hard rules are matched at any depth and cover `.claude/**`, `.husky/**`, `AGENTS.md`, `opencode.json`, `opencode.jsonc`, `.opencode/**`, `.npmrc`, `.yarnrc*`, `.pnpmfile.cjs`, `bunfig.toml`, `.gitattributes`, and `.git` (also as a file). Case, trailing dots and spaces and backslashes are normalised before matching.
- Bot-authored PRs with no `agent:*` label (for example Dependabot) now exit 1. The workflow must decide whether to skip known bots before calling the script.
