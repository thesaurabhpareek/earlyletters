# OpenCode lane hardening: proposal and pilot runbook

Author: W4 (ops), 31 Oct 2026. Status: **PROPOSAL, not applied.** Nothing in this note edits `.github/workflows/`. PR #398 is changing `agents.yml` in flight and the repo is frozen until the 5 Nov go/no-go, so the workflow change is delivered here as text, to apply by hand afterwards.

Base: `origin/develop` at `ca02e820` (31 Oct 2026). Line numbers for `agents.yml` below mean that commit. Re-check them against #398 before applying: its hunks may touch the same `run` job.

Delivered with this note: `scripts/agents/opencode/package.json` and `scripts/agents/opencode/package-lock.json` (the pinned install, section 3). `scripts/agents/**` is owned by the founder (`.github/CODEOWNERS:31`), so the companion script changes in section 2.4 are listed as text, not made here.

## 0. The six gaps at a glance

| # | Gap on develop | Fix proposed | Section |
|---|---|---|---|
| 1 | `id-token: write` on the whole `run` job (`agents.yml:99`), but only `claude-code-action` needs OIDC | One job per engine. The OpenCode jobs have no `id-token` | 2.3 |
| 2 | The agent and the write token share one job (`GH_TOKEN` is the App token, `agents.yml:166`, and the model runs bash with it) | Read-only `agent-opencode` job, then `publish-opencode`, which validates a git bundle as data and pushes only `agent/<handle>/*` | 2.3 |
| 3 | `npm install -g opencode-ai@...` with the App token in env, no lockfile, lifecycle scripts on (`agents.yml:180`) | Lockfile with integrity hashes, `npm ci --ignore-scripts`, no secrets in the install step | 3 |
| 4 | Open-PR and no-output limits exist only in the dispatcher | `Stop gate` step first in the agent job | 4 |
| 5 | No kill criteria, no spend watchdog, "cost not reported" | Key limit, concurrency 1, daily cap, weekly review hours, break counter, fuller receipt | 5 |
| 6 | No pilot plan | Docs-only pilot, founder steps in order, one-step rollback | 6 |

## 1. What was checked, and what was not

Checked by reading the repo at `ca02e820`:

- `agents.yml` has one `run` job for both engines with `contents: write`, `pull-requests: write`, `issues: write` and `id-token: write` (lines 93 to 99). The OpenCode step gets `GH_TOKEN` from `actions/create-github-app-token` (line 166), then runs `gh auth setup-git` and `npm install -g opencode-ai@${OPENCODE_VERSION}` (lines 179 and 180) in the same shell as the model.
- `scripts/agents/run-opencode.mjs` spawns `opencode` from `PATH`, writes `$RUNNER_TEMP/opencode.json` with `bash: "*": allow` plus a deny list, and enforces a per-run dollar cap and step cap. It writes its summary only when the child process closes, so a crash before that leaves no file.
- `scripts/agents/dispatch.mjs`: `max_open_agent_prs` (roster value 10) only stops new `task` and `standing` assignments (lines 235 to 272). `daily_runs: 0` makes an agent idle in every mode (line 257), and `check.mjs` accepts 0 (line 31). Spend is summed from receipts and shown on the board (lines 356 to 403); it is reported, never a stop. A receipt with cost `unknown` is counted separately (line 364).
- `scripts/agents/receipt.mjs` prints "cost not reported" and writes `cost:unknown` whenever the execution file has no numeric `total_cost_usd` (lines 54 to 66).
- `.github/actions/setup` runs `npm ci` at the repo root. The root workspaces are `apps/*`, `packages/*`, `experiments`, so `scripts/agents/opencode/` is not a workspace and does not touch the root lockfile.
- `docs/release/HARNESS_SETUP.md` already lists the App permissions (no Workflows, no Administration) and the switch-on order. The default branch is `main` and `agents.yml` is on `develop` only (`docs/agents/HARNESS.md`, "What actually runs", 28 Oct), so nothing scheduled has ever run.

Checked against the live npm registry on 31 Oct 2026:

- `opencode-ai@1.18.34` exists, published 2026-09-30, MIT, bin `bin/opencode.exe`, has a `postinstall` script, and lists 12 platform packages as `optionalDependencies`.
- The registry `latest` tag read **1.19.5** (published 2026-10-28). So 1.18.34, the version in `agents/roster.json` (`engines.opencode.version`), is **not** the latest. Whether 1.19.5 is better, safer or compatible with `run-opencode.mjs` is UNVERIFIED. This note pins 1.18.34 only because the roster does.
- `npm install --package-lock-only --ignore-scripts` produced the lockfile (13 `resolved` entries and 13 `integrity` hashes). `npm ci --ignore-scripts` then installed 5 packages.
- After `--ignore-scripts`, `node_modules/.bin/opencode` points to `opencode-ai/bin/opencode.exe`, which is a **stub shell script that prints "postinstall script was not run" and exits 1** (read, not run). The real binary is in the locked platform package, `node_modules/opencode-linux-x64/bin/opencode`. So the old command would not work with `--ignore-scripts`; section 3 calls the platform binary directly. The `postinstall.mjs` source was read: it copies the platform binary over the stub, runs `--version`, and, if no matching package is present, runs an unlocked `npm install` of the platform package at the version in `optionalDependencies`. The lockfile route avoids that fallback.
- OpenRouter documents `GET https://openrouter.ai/api/v1/key` with `limit`, `limit_remaining`, `limit_reset`, `usage`, `usage_daily`, `usage_weekly` (week starts Monday) and `usage_monthly` (https://openrouter.ai/docs/api-reference/limits, fetched 31 Oct). The page does not say whether a limit can be set at key creation, or what values `limit_reset` takes.

**UNVERIFIED.** Nothing here was run or confirmed. Each item is a check in the dry run (section 7).

1. That the platform binary runs (`--version`) on a GitHub `ubuntu-24.04` runner. The sandbox that produced this note refused to execute the downloaded vendor binary, so it was only inspected.
2. That `opencode --version` prints the version string. The install step uses `grep -F` on the pin, which tolerates extra text but not a different format.
3. That `actions/create-github-app-token` at the pinned SHA (v3.3.0) accepts `permission-contents`, `permission-pull-requests` and `permission-issues`. I recall them from earlier majors; read the action's README at that SHA.
4. OpenCode release currency: whether 1.18.34 is supported or free of known advisories. Not checked. `npm audit` does not cover a downloaded binary.
5. That the runner's `/proc/cpuinfo` shows `avx2`, so the normal build is chosen (both builds are in the lockfile).
6. That `run-opencode.mjs` event parsing (`step_finish`, `part.cost`) still matches what 1.18.34 emits. No OpenCode run has ever happened (`docs/agents/HARNESS.md`). This is the main reason for the break rule in 5.3.
7. That `gh pr list --label "agent:<handle>"` finds PRs the publish job labels (it should; the labels come from `bootstrap.mjs`).
8. OpenRouter key limits: that a limit can be set when the key is created, and the `limit_reset` values. The founder confirms in the dashboard.
9. That branch protection on `develop` and `main` really stops the App pushing there. The publish job only pushes `agent/<handle>/*`, but the App token itself could push elsewhere if protection is off (`HARNESS_SETUP.md` section 4 item 2 describes it; whether it is applied is not checked here).

## 2. Gaps 1 and 2: one job per engine, and the agent never holds a write token

### 2.1 Design

| Job | Runs | Token and secrets | Can do |
|---|---|---|---|
| `plan` (one extra step) | Dispatcher, then splits the assignment list by engine | `github.token`, as now | Same as today |
| `run-claude` | Claude Code arm only | Same as the old `run` job, including `id-token: write` (needed by `claude-code-action`) | Same as today. It still shares one token with its agent. Out of scope here because the roster default is OpenCode, but the same split should follow before any Claude agent is put on a schedule |
| `agent-opencode` | The OpenCode agent | `contents`, `issues`, `pull-requests`, `checks`, `actions`: read. No `id-token`, no App token. Holds `OPENROUTER_API_KEY` | Edit files and commit locally. It cannot push: checkout uses `persist-credentials: false` and no credential helper is set. Its only output is one artifact: `agent.bundle`, `manifest.json`, an outbox of two text files, `agent-exec.json` |
| `publish-opencode` | After the agent, even if the agent failed | `issues: write` on `github.token` (receipts), then a short-lived App token minted after validation | Validates the bundle as data, pushes `agent/<handle>/<slug>` (never forced), opens the PR, posts the journal entry and the receipt. It never runs the agent and never executes anything from the artifact |

The guard (the `Validate` step) fails the publish, and pushes nothing, when any commit in the bundle:

- touches `.github/`, `supabase/`, `scripts/` or `agents/roster.json` (the brief), or `.claude/`, `CLAUDE.md`, `package.json`, `package-lock.json`, `.gitmodules` or `docs/agents/` (added by W4 because they steer or can rewrite the harness; the founder may relax them);
- touches any path outside the pilot allow-list `^docs/`;
- adds a symlink or submodule, is a merge commit, or exceeds 10 commits, 40 files or 5 MB;
- is not a bundle holding exactly one ref that verifies against `develop`, or has a branch slug outside `^[a-z0-9][a-z0-9._-]{0,60}$`. The branch is always `agent/<handle>/<slug>`, with `<handle>` taken from the trusted plan matrix, never from the artifact.

Every commit is checked, not only the final tree, so a bad commit cannot be hidden by a later revert. I ran the `Validate` and `Bundle the result` steps, extracted from the YAML below, against a scratch repository outside this repo: a docs change passed; changes under `scripts/`, `.github/workflows/`, `agents/roster.json` and `supabase/migrations/` were blocked as protected paths; a change under `src/` was blocked by the allow-list. Not tested: symlinks, submodules, oversize bundles, a real push, the `gh` calls, and the artifact upload and download.

A gated-off run, or a run with no commits, creates no branch and no PR.

Residual risk, stated plainly. The agent job still holds the OpenRouter key and has open network access (the OpenCode config allows `webfetch` and any `bash`), and GitHub-hosted runners do not offer an egress allow-list. A misled model could send the key somewhere. The mitigations are the key's own spend limit and its rotation (section 5), not this split. The split removes the write token, the App credentials and OIDC from the agent's reach.

### 2.2 Edit 1: the `plan` job (two hunks)

```diff
@@ plan job, outputs @@
     outputs:
       assignments: ${{ steps.dispatch.outputs.assignments }}
       count: ${{ steps.dispatch.outputs.count }}
+      assignments_claude: ${{ steps.split.outputs.claude }}
+      count_claude: ${{ steps.split.outputs.claude_count }}
+      assignments_opencode: ${{ steps.split.outputs.opencode }}
+      count_opencode: ${{ steps.split.outputs.opencode_count }}
     steps:
@@ plan job, after the Dispatch step (it ends with `run: node scripts/agents/dispatch.mjs`) @@
         run: node scripts/agents/dispatch.mjs
 
+      # One job per engine, so each gets only the permissions its engine needs.
+      - name: Split assignments by engine
+        id: split
+        env:
+          ASSIGNMENTS: ${{ steps.dispatch.outputs.assignments }}
+        run: |
+          set -euo pipefail
+          for e in claude-code opencode; do
+            key="${e%%-*}"
+            list="$(jq -c --arg e "$e" '[.[] | select(.engine == $e)]' <<<"${ASSIGNMENTS:-[]}")"
+            echo "${key}=${list}" >> "$GITHUB_OUTPUT"
+            echo "${key}_count=$(jq 'length' <<<"$list")" >> "$GITHUB_OUTPUT"
+          done
+
```

### 2.3 Edit 2: replace the whole `run` job

Delete from the line `  run:` (line 79) to the end of the file and paste the three jobs below in its place. No other workflow in `.github/` depends on the job id `run` (searched for `needs.run`, `workflow_run` and `agents.yml`); branch protection check names are not checked. The result parses as YAML with `python3 yaml.safe_load` and has the jobs `plan`, `run-claude`, `agent-opencode`, `publish-opencode`. It has not run on GitHub and was not linted with `actionlint` (not installed here). The action pins are ones already on develop: checkout, setup-node and create-github-app-token from `agents.yml`; upload-artifact and download-artifact from `ios-compile.yml` and `kill-harness.yml`.

The Claude arm is the old job with the OpenCode steps and `engine` conditions removed. The pilot allow-list, the deny list and the size limits are the `env` block of `publish-opencode`.

```yaml
  # Claude Code arm. Unchanged in behaviour; only the OpenCode steps are gone.
  # It keeps `id-token: write` because anthropics/claude-code-action exchanges
  # an OIDC token for its GitHub token. The OpenCode arm no longer shares this job.
  run-claude:
    name: claude-code ${{ matrix.agent }}
    needs: plan
    if: needs.plan.outputs.count_claude != '0' && needs.plan.outputs.count_claude != ''
    runs-on: ubuntu-24.04
    timeout-minutes: ${{ matrix.timeout }}
    strategy:
      fail-fast: false
      max-parallel: 6
      matrix:
        include: ${{ fromJSON(needs.plan.outputs.assignments_claude) }}
    concurrency:
      group: agent-${{ matrix.agent }}
      cancel-in-progress: false
    permissions:
      contents: write
      pull-requests: write
      issues: write
      checks: read
      actions: read
      id-token: write
    steps:
      - uses: actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1 # v7.0.1
        with:
          ref: develop
          fetch-depth: 0
          persist-credentials: false

      - name: Install dependencies
        uses: ./.github/actions/setup

      # Values from the plan travel through env, never straight into the
      # shell, so a PR title can never become a command.
      - name: Write the run brief
        env:
          GH_TOKEN: ${{ github.token }}
          RUN_URL: ${{ github.server_url }}/${{ github.repository }}/actions/runs/${{ github.run_id }}
          AGENT: ${{ matrix.agent }}
          MODE: ${{ matrix.mode }}
          TASK: ${{ matrix.task }}
          PR: ${{ matrix.pr }}
          REASON: ${{ matrix.reason }}
          JOURNAL: ${{ matrix.journal }}
          AGENTS_APP_CLIENT_ID: ${{ vars.AGENTS_APP_CLIENT_ID }}
          AGENTS_BOT_LOGINS: ${{ vars.AGENTS_BOT_LOGINS }}
        run: >
          node scripts/agents/brief.mjs --agent "$AGENT" --mode "$MODE" --task "$TASK" --pr "$PR"
          --reason "$REASON" --journal "$JOURNAL" --run-url "$RUN_URL" --run-id "$GITHUB_RUN_ID"
          --out .agent-run/brief.md

      - name: Agent (Claude Code)
        id: claude
        uses: anthropics/claude-code-action@6d5ae526d25ce88daa2200be073e1a373167f064 # v1.0.265
        with:
          anthropic_api_key: ${{ secrets.ANTHROPIC_API_KEY }}
          allowed_bots: github-actions,claude
          base_branch: develop
          prompt: |
            You are the Early Letters agent "${{ matrix.agent }}". Read .agent-run/brief.md now and follow it exactly.
            It holds your identity, memory, founder instructions, your one assignment for this run, and how to finish.
          # Token controls: a hard dollar cap per run, a turn cap, cache-friendly
          # system prompt, and an optional effort level per agent (roster).
          claude_args: |
            --model ${{ matrix.model }}
            --max-turns ${{ matrix.max_turns }}
            --max-budget-usd ${{ matrix.budget }}
            --exclude-dynamic-system-prompt-sections
            ${{ matrix.effort != '' && format('--effort {0}', matrix.effort) || '' }}
            --allowedTools "Read,Write,Edit,MultiEdit,Glob,Grep,Bash,WebSearch,WebFetch,TodoWrite,Task"
            --disallowedTools "Bash(git push --force:*),Bash(git push -f:*),Bash(git push origin develop:*),Bash(git push origin main:*),Bash(git push origin HEAD:develop:*),Bash(git push origin HEAD:main:*),Bash(gh pr merge:*),Bash(gh pr review --approve:*),Bash(gh repo delete:*),Bash(gh secret:*),Bash(gh variable:*)"

      # Whatever stopped the run (cap, timeout, error, provider limit), push
      # anything left unsaved to a branch and note it in the journal.
      - name: Save unfinished work
        if: always()
        env:
          GH_TOKEN: ${{ steps.claude.outputs.github_token }}
          AGENT: ${{ matrix.agent }}
          JOURNAL: ${{ matrix.journal }}
          REASON: ${{ steps.claude.outcome }}
        run: node scripts/agents/salvage.mjs --agent "$AGENT" --journal "$JOURNAL" --run-id "$GITHUB_RUN_ID" --reason "$REASON"

      - name: Run receipt
        if: always()
        env:
          GH_TOKEN: ${{ github.token }}
          RUN_URL: ${{ github.server_url }}/${{ github.repository }}/actions/runs/${{ github.run_id }}
          AGENT: ${{ matrix.agent }}
          MODE: ${{ matrix.mode }}
          TASK: ${{ matrix.task }}
          PR: ${{ matrix.pr }}
          JOURNAL: ${{ matrix.journal }}
          OUTCOME: ${{ steps.claude.outcome }}
          EXECUTION_FILE: ${{ steps.claude.outputs.execution_file }}
        run: >
          node scripts/agents/receipt.mjs --agent "$AGENT" --journal "$JOURNAL" --mode "$MODE"
          --task "$TASK" --pr "$PR" --outcome "$OUTCOME" --execution-file "$EXECUTION_FILE"
          --run-url "$RUN_URL" --run-id "$GITHUB_RUN_ID"

  # OpenCode arm, part 1 of 2: the agent. Read-only. It holds the OpenRouter
  # key and a read-only GitHub token; it holds no write token, no id-token and
  # no App credentials. Its only output is an artifact: a git bundle, a manifest,
  # an outbox of text files and the execution summary.
  agent-opencode:
    name: opencode ${{ matrix.agent }}
    needs: plan
    if: needs.plan.outputs.count_opencode != '0' && needs.plan.outputs.count_opencode != ''
    runs-on: ubuntu-24.04
    timeout-minutes: ${{ matrix.timeout }}
    strategy:
      fail-fast: false
      max-parallel: 1
      matrix:
        include: ${{ fromJSON(needs.plan.outputs.assignments_opencode) }}
    concurrency:
      group: agent-${{ matrix.agent }}
      cancel-in-progress: false
    permissions:
      contents: read
      issues: read
      pull-requests: read
      checks: read
      actions: read
    steps:
      - uses: actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1 # v7.0.1
        with:
          ref: develop
          fetch-depth: 0
          persist-credentials: false

      # Stop before spending anything: team PR flood, or two task runs in a row
      # that produced no PR. A founder-forced run (workflow_dispatch with a task) skips this gate.
      - name: Stop gate
        id: gate
        env:
          GH_TOKEN: ${{ github.token }}
          REPO: ${{ github.repository }}
          AGENT: ${{ matrix.agent }}
          JOURNAL: ${{ matrix.journal }}
          MODE: ${{ matrix.mode }}
          FORCED: ${{ github.event_name == 'workflow_dispatch' && inputs.task != '' }}
          MAX_OPEN: "15"
          OPENROUTER_API_KEY: ${{ secrets.OPENROUTER_API_KEY }}
          DAILY_USD: "3"
          MIN_REMAINING_USD: "1"
          # Pilot: the publish job can only carry new work and fixes to your own PR.
          # Reviews, handoffs, digests and steward reviews need comments, which it does not post yet.
          ALLOW_MODES: "task,maintain"
        run: |
          set -euo pipefail
          go() { echo "go=$1" >> "$GITHUB_OUTPUT"; }
          if [ "$FORCED" = "true" ]; then echo "Founder-forced run: gate skipped."; go true; exit 0; fi
          case ",${ALLOW_MODES}," in *",${MODE},"*) ;; *)
            echo "::notice::Stop gate: mode $MODE is not enabled for the OpenCode lane. Nothing was started."
            go false; exit 0;;
          esac
          open="$(gh pr list --repo "$REPO" --state open --limit 300 --json labels \
            --jq '[.[] | select(any(.labels[]; .name | startswith("agent:")))] | length')"
          if [ "$open" -ge "$MAX_OPEN" ]; then
            echo "::warning::Stop gate: $open open agent PRs (limit $MAX_OPEN). Nothing was started."
            echo "Stop gate: $open open agent PRs, limit $MAX_OPEN." >> "$GITHUB_STEP_SUMMARY"
            go false; exit 0
          fi
          # Spend watchdog: read the key's own meter. If it cannot be read, do not run.
          key="$(curl -fsS --max-time 20 -H "Authorization: Bearer $OPENROUTER_API_KEY" https://openrouter.ai/api/v1/key | jq -c '.data' 2>/dev/null || true)"
          if [ -z "$key" ] || [ "$key" = "null" ]; then
            echo "::warning::Stop gate: could not read the OpenRouter key usage. Nothing was started."
            go false; exit 0
          fi
          if jq -e --argjson d "$DAILY_USD" --argjson m "$MIN_REMAINING_USD" \
            '(.usage_daily // 0) >= $d or (.limit_remaining != null and .limit_remaining < $m)' <<<"$key" >/dev/null; then
            echo "::warning::Stop gate: key spend today or remaining credit is outside the limits ($DAILY_USD per day, $MIN_REMAINING_USD minimum left). Nothing was started."
            echo "Stop gate: spend watchdog tripped." >> "$GITHUB_STEP_SUMMARY"
            go false; exit 0
          fi
          # The two newest task receipts for this agent. Receipts are posted after
          # the run, so the run behind the older one started up to a timeout earlier.
          stamps="$(gh api --paginate "repos/$REPO/issues/$JOURNAL/comments?per_page=100" \
            --jq ".[] | select(.body | startswith(\"<!-- receipt run:\")) | select(.body | contains(\"agent:$AGENT \")) | select(.body | contains(\"Run receipt: task\")) | .created_at" \
            | sort -r | head -2)"
          if [ "$(printf '%s\n' "$stamps" | grep -c .)" -ge 2 ]; then
            older="$(printf '%s\n' "$stamps" | tail -1)"
            since="$(date -u -d "$older - 60 minutes" +%Y-%m-%dT%H:%M:%SZ)"
            made="$(gh pr list --repo "$REPO" --state all --label "agent:$AGENT" --limit 100 --json createdAt \
              --jq "[.[] | select(.createdAt >= \"$since\")] | length")"
            if [ "$made" -eq 0 ]; then
              echo "::warning::Stop gate: the last two task runs of $AGENT produced no PR. Nothing was started."
              echo "Stop gate: two task runs of $AGENT with no PR since $since." >> "$GITHUB_STEP_SUMMARY"
              go false; exit 0
            fi
          fi
          go true

      - name: Install dependencies
        if: steps.gate.outputs.go == 'true'
        uses: ./.github/actions/setup

      - name: Write the run brief
        if: steps.gate.outputs.go == 'true'
        env:
          GH_TOKEN: ${{ github.token }}
          RUN_URL: ${{ github.server_url }}/${{ github.repository }}/actions/runs/${{ github.run_id }}
          AGENT: ${{ matrix.agent }}
          MODE: ${{ matrix.mode }}
          TASK: ${{ matrix.task }}
          PR: ${{ matrix.pr }}
          REASON: ${{ matrix.reason }}
          JOURNAL: ${{ matrix.journal }}
          AGENTS_APP_CLIENT_ID: ${{ vars.AGENTS_APP_CLIENT_ID }}
          AGENTS_BOT_LOGINS: ${{ vars.AGENTS_BOT_LOGINS }}
        run: >
          node scripts/agents/brief.mjs --agent "$AGENT" --mode "$MODE" --task "$TASK" --pr "$PR"
          --reason "$REASON" --journal "$JOURNAL" --run-url "$RUN_URL" --run-id "$GITHUB_RUN_ID"
          --out .agent-run/brief.md

      # Pinned and checksummed install (docs/agents/hardening/opencode-lane.md,
      # section 3). No secrets and no token are in this step's environment.
      - name: Install OpenCode (locked, no install scripts)
        if: steps.gate.outputs.go == 'true'
        env:
          ENGINE_VERSION: ${{ matrix.engine_version }}
        run: |
          set -euo pipefail
          pin="$(node -p "require('./scripts/agents/opencode/package.json').dependencies['opencode-ai']")"
          if [ "$ENGINE_VERSION" != "$pin" ]; then
            echo "::error::agents/roster.json engines.opencode.version ($ENGINE_VERSION) differs from scripts/agents/opencode/package.json ($pin)"
            exit 1
          fi
          dest="$RUNNER_TEMP/opencode"
          mkdir -p "$dest/bin"
          cp scripts/agents/opencode/package.json scripts/agents/opencode/package-lock.json "$dest/"
          npm ci --prefix "$dest" --ignore-scripts --no-audit --no-fund
          pkg=opencode-linux-x64
          grep -qw avx2 /proc/cpuinfo || pkg=opencode-linux-x64-baseline
          bin="$dest/node_modules/$pkg/bin/opencode"
          test -x "$bin"
          ln -s "$bin" "$dest/bin/opencode"
          echo "$dest/bin" >> "$GITHUB_PATH"
          sha256sum "$bin"
          "$bin" --version | grep -F "$pin"

      - name: Agent (OpenCode)
        id: opencode
        if: steps.gate.outputs.go == 'true'
        env:
          GH_TOKEN: ${{ github.token }}
          OPENROUTER_API_KEY: ${{ secrets.OPENROUTER_API_KEY }}
          AGENT: ${{ matrix.agent }}
          MODEL: ${{ matrix.model }}
          BUDGET: ${{ matrix.budget }}
          MAX_TURNS: ${{ matrix.max_turns }}
          EFFORT: ${{ matrix.effort }}
        run: |
          git config user.name "Early Letters agent ${AGENT}"
          git config user.email "${AGENT}@agents.invalid"
          mkdir -p .agent-run/outbox
          node scripts/agents/run-opencode.mjs --agent "$AGENT" --model "$MODEL" --budget "$BUDGET" \
            --max-turns "$MAX_TURNS" --variant "$EFFORT" --out "$RUNNER_TEMP/agent-exec.json"

      # Cost must never be "not reported": a crash before the runner wrote its
      # summary still leaves a file, and the OpenRouter key's own usage is added.
      - name: Cost record
        if: always() && steps.gate.outputs.go == 'true'
        env:
          OPENROUTER_API_KEY: ${{ secrets.OPENROUTER_API_KEY }}
          OUTCOME: ${{ steps.opencode.outcome }}
          VERSION: ${{ matrix.engine_version }}
        run: |
          set -uo pipefail
          f="$RUNNER_TEMP/agent-exec.json"
          [ -s "$f" ] || echo '[{"type":"result","engine":"opencode","subtype":"error_runner_no_summary","total_cost_usd":null,"num_turns":0}]' > "$f"
          key="$(curl -fsS --max-time 20 -H "Authorization: Bearer $OPENROUTER_API_KEY" https://openrouter.ai/api/v1/key \
            | jq -c '.data | {limit, limit_remaining, usage_daily, usage_weekly}' 2>/dev/null || echo null)"
          jq --argjson key "$key" --arg v "$VERSION" --arg o "$OUTCOME" \
            '.[0] += {engine_version: $v, step_outcome: $o, openrouter_key: $key}' "$f" > "$f.new" && mv "$f.new" "$f"

      # Bundle what the agent left. Local commits only: this job has no way to push.
      - name: Bundle the result
        if: always() && steps.gate.outputs.go == 'true'
        env:
          AGENT: ${{ matrix.agent }}
          OUTCOME: ${{ steps.opencode.outcome }}
        run: |
          set -uo pipefail
          g() { git -c core.hooksPath=/dev/null "$@"; }
          out="$RUNNER_TEMP/out"; mkdir -p "$out/outbox"
          branch="$(g rev-parse --abbrev-ref HEAD)"
          if [ -n "$(g status --porcelain -- . ':(exclude).agent-run')" ]; then
            case "$branch" in develop|HEAD) g checkout -q -B "wip-${GITHUB_RUN_ID}"; branch="wip-${GITHUB_RUN_ID}";; esac
            g add -A -- . ':(exclude).agent-run'
            g commit -q -m "WIP: ${AGENT} run ${GITHUB_RUN_ID} stopped (${OUTCOME})" -m "Agent: ${AGENT}"
          fi
          case "$branch" in "agent/${AGENT}/"*) slug="${branch#agent/${AGENT}/}";; *) slug="wip-${GITHUB_RUN_ID}";; esac
          g branch -f agent-out HEAD
          commits="$(g rev-list --count origin/develop..agent-out)"
          if [ "$commits" -gt 0 ]; then g bundle create "$out/agent.bundle" origin/develop..agent-out; fi
          for f in journal.md pr.md; do
            [ -f ".agent-run/outbox/$f" ] && head -c 60000 ".agent-run/outbox/$f" > "$out/outbox/$f"
          done
          cp "$RUNNER_TEMP/agent-exec.json" "$out/agent-exec.json"
          jq -n --arg slug "$slug" --arg outcome "$OUTCOME" --argjson commits "$commits" \
            '{slug: $slug, outcome: $outcome, commits: $commits}' > "$out/manifest.json"
          exit 0

      - name: Upload result
        if: always() && steps.gate.outputs.go == 'true'
        uses: actions/upload-artifact@cf430e030ddbb5b0abf93d22962f4752f3646cd9 # v7.0.2
        with:
          name: agent-out-${{ github.run_id }}-${{ matrix.agent }}
          path: ${{ runner.temp }}/out
          retention-days: 7
          if-no-files-found: warn

  # OpenCode arm, part 2 of 2: publish. It never runs the agent and never
  # executes anything from the artifact. It checks out develop, validates the
  # bundle as data, and only then mints the App token, pushes to
  # agent/<handle>/* and opens the PR.
  publish-opencode:
    name: publish ${{ matrix.agent }}
    needs: [plan, agent-opencode]
    if: always() && needs.plan.result == 'success' && needs.plan.outputs.count_opencode != '0' && needs.plan.outputs.count_opencode != ''
    runs-on: ubuntu-24.04
    timeout-minutes: 15
    strategy:
      fail-fast: false
      max-parallel: 1
      matrix:
        include: ${{ fromJSON(needs.plan.outputs.assignments_opencode) }}
    concurrency:
      group: publish-${{ matrix.agent }}
      cancel-in-progress: false
    permissions:
      contents: read
      issues: write
      pull-requests: read
      actions: read
    env:
      # Pilot allow-list (docs only). Widen deliberately, one lane at a time.
      PUBLISH_ALLOW: '^docs/'
      # Never publishable, whatever the allow-list says.
      PUBLISH_DENY: '^(\.github/|supabase/|scripts/|agents/roster\.json$|\.claude/|CLAUDE\.md$|package(-lock)?\.json$|\.gitmodules$|docs/agents/)'
      MAX_COMMITS: "10"
      MAX_FILES: "40"
      MAX_BUNDLE_BYTES: "5000000"
    steps:
      - uses: actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1 # v7.0.1
        with:
          ref: develop
          fetch-depth: 0
          persist-credentials: false

      - uses: actions/setup-node@820762786026740c76f36085b0efc47a31fe5020 # v7.0.0
        with:
          node-version: 22

      - name: Fetch the agent result
        id: fetch
        continue-on-error: true
        uses: actions/download-artifact@37930b1c2abaa49bbe596cd826c3c89aef350131 # v7.0.0
        with:
          name: agent-out-${{ github.run_id }}-${{ matrix.agent }}
          path: ${{ runner.temp }}/in

      # Validation treats the bundle as data. The branch name comes from the
      # trusted matrix plus a slug that must match a strict pattern.
      - name: Validate
        id: check
        if: steps.fetch.outcome == 'success'
        env:
          AGENT: ${{ matrix.agent }}
        run: |
          set -euo pipefail
          in="$RUNNER_TEMP/in"
          fail() { echo "::error::publish guard: $1"; echo "ok=false" >> "$GITHUB_OUTPUT"; echo "reason=$1" >> "$GITHUB_OUTPUT"; exit 1; }
          slug="$(jq -r '.slug // ""' "$in/manifest.json")"
          echo "outcome=$(jq -r '.outcome // "unknown"' "$in/manifest.json")" >> "$GITHUB_OUTPUT"
          commits="$(jq -r '.commits // 0' "$in/manifest.json")"
          if [ "$commits" = "0" ]; then echo "No commits to publish."; echo "ok=none" >> "$GITHUB_OUTPUT"; exit 0; fi
          [[ "$slug" =~ ^[a-z0-9][a-z0-9._-]{0,60}$ ]] || fail "branch slug not allowed"
          branch="agent/${AGENT}/${slug}"
          git check-ref-format "refs/heads/$branch" || fail "branch name invalid"
          [ -f "$in/agent.bundle" ] || fail "manifest lists commits but there is no bundle"
          [ "$(stat -c %s "$in/agent.bundle")" -le "$MAX_BUNDLE_BYTES" ] || fail "bundle larger than $MAX_BUNDLE_BYTES bytes"
          git bundle verify "$in/agent.bundle" >/dev/null 2>&1 || fail "bundle does not verify against develop"
          [ "$(git bundle list-heads "$in/agent.bundle" | wc -l)" -eq 1 ] || fail "bundle must hold exactly one ref"
          git fetch -q "$in/agent.bundle" "refs/heads/agent-out:refs/agent-in/head"
          base="$(git merge-base origin/develop refs/agent-in/head)"
          [ "$(git rev-list --count "$base..refs/agent-in/head")" -le "$MAX_COMMITS" ] || fail "more than $MAX_COMMITS commits"
          [ -z "$(git rev-list --merges "$base..refs/agent-in/head")" ] || fail "merge commits are not allowed"
          # Every path touched by every commit, both sides of any rename.
          git log --no-renames --name-only --format= "$base..refs/agent-in/head" | sort -u | sed '/^$/d' > "$RUNNER_TEMP/paths.txt"
          [ "$(wc -l < "$RUNNER_TEMP/paths.txt")" -le "$MAX_FILES" ] || fail "more than $MAX_FILES files"
          if grep -E "$PUBLISH_DENY" "$RUNNER_TEMP/paths.txt"; then fail "touches a protected path (.github/, supabase/, scripts/, agents/roster.json, ...)"; fi
          if grep -vE "$PUBLISH_ALLOW" "$RUNNER_TEMP/paths.txt"; then fail "touches a path outside the allow-list $PUBLISH_ALLOW"; fi
          # No symlinks (120000) or submodules (160000) in the final tree.
          if git diff --raw --no-renames "$base" refs/agent-in/head | awk '$2=="120000"||$2=="160000"{f=1} END{exit !f}'; then fail "symlink or submodule"; fi
          { echo "ok=true"; echo "branch=$branch"; } >> "$GITHUB_OUTPUT"

      - name: Agent identity (GitHub App token)
        id: app
        if: always() && steps.check.outputs.ok != ''
        uses: actions/create-github-app-token@64ab729a6294000f5aa4a4bc0b73d1f32bc45510 # v3.3.0
        with:
          client-id: ${{ vars.AGENTS_APP_CLIENT_ID }}
          private-key: ${{ secrets.AGENTS_APP_PRIVATE_KEY }}
          permission-contents: write
          permission-pull-requests: write
          permission-issues: write

      - name: Push and open the PR
        id: push
        if: steps.check.outputs.ok == 'true'
        env:
          GH_TOKEN: ${{ steps.app.outputs.token }}
          REPO: ${{ github.repository }}
          AGENT: ${{ matrix.agent }}
          BRANCH: ${{ steps.check.outputs.branch }}
          RUN_URL: ${{ github.server_url }}/${{ github.repository }}/actions/runs/${{ github.run_id }}
        run: |
          set -euo pipefail
          in="$RUNNER_TEMP/in"
          gh auth setup-git
          # Plain push, never forced, and only to the validated agent/<handle>/ ref.
          git push origin "refs/agent-in/head:refs/heads/${BRANCH}"
          outcome="$(jq -r '.outcome // "unknown"' "$in/manifest.json")"
          if [ "$outcome" != "success" ]; then echo "Run ended with $outcome: branch pushed, no PR opened."; exit 0; fi
          existing="$(gh pr list --repo "$REPO" --head "$BRANCH" --state open --json number --jq '.[0].number // empty')"
          if [ -n "$existing" ]; then echo "PR #$existing already open for $BRANCH."; exit 0; fi
          title="$(head -1 "$in/outbox/pr.md" 2>/dev/null | tr -d '\r' | cut -c1-120)"
          [ -n "$title" ] || title="${AGENT}: ${BRANCH#agent/${AGENT}/}"
          # Defuse @mentions so an agent cannot notify anyone; add the run link.
          { tail -n +2 "$in/outbox/pr.md" 2>/dev/null || true; printf '\n\nRun: %s\n' "$RUN_URL"; } \
            | sed -E 's/(^|[^`A-Za-z0-9])@([A-Za-z0-9_-]+)/\1`@\2`/g' > "$RUNNER_TEMP/pr-body.md"
          gh pr create --repo "$REPO" --base develop --head "$BRANCH" --title "$title" --body-file "$RUNNER_TEMP/pr-body.md" \
            --label "agent:${AGENT},from:agent"

      - name: Journal entry
        if: always() && steps.app.outcome == 'success'
        env:
          GH_TOKEN: ${{ steps.app.outputs.token }}
          REPO: ${{ github.repository }}
          AGENT: ${{ matrix.agent }}
          JOURNAL: ${{ matrix.journal }}
          GUARD: ${{ steps.check.outputs.ok }}
          REASON: ${{ steps.check.outputs.reason }}
        run: |
          set -euo pipefail
          in="$RUNNER_TEMP/in"
          { printf '<!-- journal run:%s agent:%s -->\n' "$GITHUB_RUN_ID" "$AGENT"
            [ "$GUARD" = "false" ] && printf '**Publish blocked by the guard:** %s. Nothing was pushed.\n\n' "$REASON"
            cat "$in/outbox/journal.md" 2>/dev/null || printf 'The agent wrote no journal entry.\n'
          } | sed -E 's/(^|[^`A-Za-z0-9])@([A-Za-z0-9_-]+)/\1`@\2`/g' > "$RUNNER_TEMP/journal.md"
          gh api -X POST "repos/$REPO/issues/$JOURNAL/comments" -F body=@"$RUNNER_TEMP/journal.md" >/dev/null

      - name: Run receipt
        if: always() && steps.fetch.outcome == 'success'
        env:
          GH_TOKEN: ${{ github.token }}
          RUN_URL: ${{ github.server_url }}/${{ github.repository }}/actions/runs/${{ github.run_id }}
          AGENT: ${{ matrix.agent }}
          MODE: ${{ matrix.mode }}
          TASK: ${{ matrix.task }}
          PR: ${{ matrix.pr }}
          JOURNAL: ${{ matrix.journal }}
          OUTCOME: ${{ steps.check.outputs.ok == 'false' && 'blocked_by_guard' || steps.check.outputs.outcome }}
        run: >
          node scripts/agents/receipt.mjs --agent "$AGENT" --journal "$JOURNAL" --mode "$MODE"
          --task "$TASK" --pr "$PR" --outcome "$OUTCOME"
          --execution-file "$RUNNER_TEMP/in/agent-exec.json" --run-url "$RUN_URL" --run-id "$GITHUB_RUN_ID"
```

### 2.4 Companion changes this workflow needs (founder-owned files, not made here)

The agent can no longer push, open PRs or post comments, so its finish instructions must change. Without these edits the pilot agent will try `git push` and `gh pr create`, fail, and the publish job will have only a bundle and no text.

1. `scripts/agents/brief.mjs` (the "how to finish" list near line 288). For OpenCode runs replace the push, PR and journal steps with: commit on a branch named `agent/<handle>/<short-slug>` (lowercase letters, digits, dots, dashes); never run `git push`, `gh pr create`, `gh pr edit` or `gh api -X POST`; write the PR text to `.agent-run/outbox/pr.md` (first line the title, the rest the body) and the journal entry to `.agent-run/outbox/journal.md` (without the `<!-- journal run:` marker, the publish job adds it). For `maintain` mode the agent checks out the existing PR branch and commits; the publish job fast-forwards the same branch and opens no second PR. The outbox directory is created by the agent step. Labels are added by the publish job.
2. `scripts/agents/receipt.mjs`. Fields and rules are in section 5.5.
3. `agents/roster.json` for the pilot (section 6, step 1).
4. Optional, `scripts/agents/run-opencode.mjs`: write the summary file on SIGTERM and on error as well. The workflow's `Cost record` step already writes a stub (`error_runner_no_summary`) so the receipt is never empty, so this is a nicety.

Not covered by this design, on purpose: review, handoff, digest and steward-review runs, which post comments and review verdicts as the App. The gate allows only `task` and `maintain` for the OpenCode lane (`ALLOW_MODES`). Widening needs an outbox format for comments and its own validation, and is a later task.

## 3. Gap 3: a pinned, checksummed, script-free install

Files: `scripts/agents/opencode/package.json` (one dependency, `"opencode-ai": "1.18.34"`, exact, no range) and `scripts/agents/opencode/package-lock.json` (lockfile version 3, 13 package entries besides the root, every one with a `resolved` URL and a `sha512` integrity hash). The pin matches `engines.opencode.version` in `agents/roster.json`; the install step fails if the two ever differ.

Install command, as used in the `Install OpenCode` step above and safe to run by hand in a scratch directory:

```bash
dest="$(mktemp -d)"
cp scripts/agents/opencode/package.json scripts/agents/opencode/package-lock.json "$dest/"
npm ci --prefix "$dest" --ignore-scripts --no-audit --no-fund
"$dest/node_modules/opencode-linux-x64/bin/opencode" --version    # Linux x64 with AVX2; macOS and Linux arm64 have their own package names in the lockfile
```

What is verified and what is not (details in section 1):

- Verified: `npm ci --ignore-scripts` succeeds from this lockfile and installs 5 packages without running any install script. `--ignore-scripts` leaves the wrapper binary as a stub that exits 1 (read, not run), so the workflow runs the platform binary directly by path and puts a symlink to it on `PATH`.
- Not verified: that the platform binary runs on the GitHub runner. First thing to check in the dry run.
- The step has no token or secret in its environment. The vendor binary is executed twice before the agent: `sha256sum` (no execution) and `--version`. Both come after the lockfile check, and neither sees a secret.
- Dependencies of the dependencies: the lockfile has no transitive packages beyond the 12 platform packages, which are optional and chosen by OS and CPU.

Honest limit: the integrity hash proves that the bytes are the ones recorded on 31 Oct. It says nothing about whether those bytes are safe. The binary is closed to inspection here, so the mitigation is the job split in section 2 (the binary runs in the job that holds no write token).

### 3.1 Upgrade procedure

Who: **the founder reviews and merges**, because `scripts/agents/**` is founder-owned (`.github/CODEOWNERS:31`). `ops` may prepare the PR; the `security` agent may review the diff. An agent never merges.

1. Pick the target version on purpose. The registry `latest` read 1.19.5 on 31 Oct; check release notes before choosing. The npm package has no `repository` field (checked), so find the upstream release notes by hand. UNVERIFIED where they are.
2. In a scratch directory outside the repo, copy `package.json`, change the one version, and run `npm install --package-lock-only --ignore-scripts`. Copy both files back. Diff the lockfile: only `opencode-ai` and the 12 platform packages should change, each with a new `integrity`. Anything else is a reason to stop.
3. Set `engines.opencode.version` in `agents/roster.json` to the same version (the install step fails on a mismatch).
4. Test, in this order: (a) `npm ci --ignore-scripts` from the new lockfile and run `--version` on the platform binary; (b) `node --test scripts/agents/` for the runner's tests (`run-opencode` event parsing is a pure function, `tally`); (c) one manual `workflow_dispatch` run of the pilot agent (section 6) and compare the receipt: steps greater than 0, a numeric cost, a PR opened, guard passed; (d) read the cost against the previous version's receipts.
5. If step 4 shows a different event format, fix `tally` in `run-opencode.mjs` before merging. Never merge an upgrade that has not produced one real receipt.
6. Rollback of an upgrade: revert the PR (both files and the roster line) in one commit.

## 4. Gap 4: a stop gate inside the run path

Already in the YAML above as the first step of `agent-opencode` (it runs before setup, the brief and the model, so a stopped run costs a few seconds of runner time and no model spend). It exits with `go=false` and every later step is skipped, so no artifact exists, the publish job does nothing and no receipt is posted.

| Stop | Rule | Note |
|---|---|---|
| Mode | Only `task` and `maintain` | The publish job cannot carry comments |
| PR flood | Open PRs carrying any `agent:*` label is at least **15** | The dispatcher's own cap is `max_open_agent_prs: 10`, which stops new work earlier. The gate is the backstop in case the dispatcher is bypassed or its input is wrong. Pick one number on purpose (decision 8.3) |
| No output | The agent's two newest task receipts exist and no PR labelled `agent:<handle>` was created since 60 minutes before the older receipt | Receipts are posted after the run, so the run behind the older receipt began up to a timeout before it. The check can wrongly allow a run (a PR from an older run in the window) and cannot wrongly block a first or second run |
| Spend | The key's `usage_daily` is at least $3, or `limit_remaining` under $1, or the key cannot be read | Fails closed. Needs the key in the gate step's env only to read its meter |

How a stop ends: the stop on "no output" repeats every tick until a PR exists or a founder-forced run happens, which is on purpose. A run started by `workflow_dispatch` with a `task` skips the whole gate (it is the founder's override, as in `dispatch.mjs`). A receipt-based rule works only after `receipt.mjs` posts receipts with the text `Run receipt: task` (it does today).

## 5. Gap 5: kill criteria, spend watchdog, visible cost

### 5.1 Spend layers (cheapest stop first)

| Layer | Value (proposed) | Enforced by |
|---|---|---|
| OpenRouter key limit | **$10**, weekly reset if the dashboard offers it, otherwise a fixed $10 to top up by hand | OpenRouter, founder sets it (UNVERIFIED: set-at-creation and reset values) |
| Concurrency | **1**: `max-parallel: 1` on both OpenCode jobs, the per-agent concurrency group, and `limits.max_parallel: 1` in the roster (read by the dispatcher, line 187) | Workflow and roster |
| Daily cap | `limits.max_runs_per_day_total: 2` and `daily_runs` 0 for every agent except the pilot (see 6) | Dispatcher |
| Per run | `max_budget_usd: 1`, `max_turns: 60`, `timeout_minutes: 30` for the pilot agent (the defaults are $2, 80 and 50) | `run-opencode.mjs` (dollar and step caps) and the job timeout |
| Daily meter | $3 per day from the key's own `usage_daily` | `Stop gate` |
| Floor | Under $1 left on the key | `Stop gate` |

Worst case per day at these values: 2 runs times $1 is $2, and the gate stops a third. The watchdog reads OpenRouter's meter, not the model's self-report, so it still works when `total_cost_usd` is missing. All values are proposals for the founder (decision 8.2).

### 5.2 Weekly review-hours limit (stop if more than 2 hours a week)

Code cannot measure the founder's time. Rule: the pilot has a pinned issue, `Pilot ledger: OpenCode lane`, with one comment a week from the founder: minutes spent reading agent PRs, journals and receipts, and the number of PRs merged, edited and closed unmerged. If a week's total passes **120 minutes**, set `AGENTS_PAUSED=true` the same day and decide in writing whether to continue. A proxy the dispatcher already shows: if more than 4 agent PRs are open and waiting at any time, the lane is producing faster than it is read.

### 5.3 Kill criteria (any one stops the lane)

| # | Criterion | Action |
|---|---|---|
| K1 | OpenCode "breaks" twice within 14 days (definition below) | Delete `AGENTS_ENABLED` (full stop), write a root-cause note, do not restart without a new decision |
| K2 | Review time over 2 hours in a calendar week | `AGENTS_PAUSED=true` |
| K3 | A `blocked_by_guard` receipt for a protected path (`.github/`, `supabase/`, `scripts/`, `agents/roster.json`) | `AGENTS_PAUSED=true` and look at the run log: the model tried something it should not, or the brief is wrong |
| K4 | The key's `usage_daily` over $3, or a receipt with `cost_basis: cap-assumed` twice in a week | `AGENTS_PAUSED=true`; the meter and the runner disagree |
| K5 | A merged agent PR that had to be reverted | `AGENTS_PAUSED=true` until the cause is found |

A "break" is any of: the install step fails or `--version` does not match the pin; the exec summary ends `error_during_execution`, `error_runner_no_summary` or `error_cost_not_reported` with no outside cause; exit 0 with zero steps (the event format changed). Not a break: a provider outage, an HTTP 402 or 429 from OpenRouter, a step or dollar cap hit, or a gate stop. The receipt must say which, so the count can be done by reading receipts. Mark each break in the pilot ledger with its run link.

### 5.4 Receipt fields: "cost not reported" must end

Today (`receipt.mjs`) a missing number prints "cost not reported" and writes `cost:unknown`; the board then counts the run as "no cost reported" (`dispatch.mjs:364, 403`). Three things cause it, all fixed in the workflow: the crash-before-summary case (the `Cost record` step writes a stub), the skipped-step case (no receipt is posted for a gated-off run) and a blind model (the runner already stops a paid model after 5 steps with cost 0, `error_cost_not_reported`).

### 5.5 Required `receipt.mjs` change (founder-owned)

For `engine: opencode` the receipt must never print "cost not reported". Rules:

1. `cost_usd` is the runner's `total_cost_usd` when it is a number, with `cost_basis: engine`.
2. If it is null, charge the per-run cap (`max_budget_usd`) and set `cost_basis: cap-assumed`, so unknown cost is counted high, never as zero. The marker stays numeric: `<!-- receipt run:ID agent:X cost:1.0000 -->`.
3. The body adds, in this order: model; `engine_version`; outcome (including `blocked_by_guard`); steps; minutes; `cost_usd` and `cost_basis`; tokens in, out and cache read; the key meter (`limit_remaining`, `usage_daily`, `usage_weekly` from the `Cost record` step, already in `openrouter_key` in the summary file); commits and files published; PR number or "none"; link to the run.
4. The summary file shape the workflow produces: `[{type, engine, model, subtype, total_cost_usd, num_turns, duration_ms, tokens:{input,output,cacheRead}, engine_version, step_outcome, openrouter_key:{limit,limit_remaining,usage_daily,usage_weekly}}]`. Missing parts print as "n/a", not as zero.

Tests to add next to `scripts/agents/lib.test.mjs`: a null cost gives `cap-assumed` and a numeric marker; a stub summary gives `error_runner_no_summary`; the marker regex at `dispatch.mjs:364` and `ledger.mjs:27` still matches.

## 6. Gap 6: pilot runbook

### 6.0 Scope of the pilot

First lane: **docs-only backlog hygiene.** Proposed agent: `product` (it owns `docs/BACKLOG.md`: ordering, splitting, status corrections, per its charter). The publish allow-list is `^docs/`, so nothing outside `docs/` can be published whatever the model does. Everything else in the roster is switched off by `daily_runs: 0`. Duration: two weeks, then a go or stop decision using the kill criteria. The founder may pick another docs agent (decision 8.1).

### 6.1 Order of steps

Steps marked **FOUNDER** are only the founder's: they involve secrets, accounts or repository settings, which `ops` and every other agent must not touch.

1. After the 5 Nov go/no-go, in one PR from the founder or a founder-run session: apply Edit 1 and Edit 2 (section 2) to `.github/workflows/agents.yml` on top of whatever #398 left; add the two files in `scripts/agents/opencode/`; apply section 2.4 items 1 and 2; edit `agents/roster.json`: `limits.max_runs_per_day_total: 2`, `limits.max_parallel: 1`, `daily_runs: 0` on every agent except `product`; on `product`: `daily_runs: 1`, `wip_limit: 1`, `max_budget_usd: 1`, `max_turns: 60`, `timeout_minutes: 30`. `node scripts/agents/check.mjs` and the agents tests must pass.
2. Release it to `main` (the default branch), because a scheduled workflow registers only from the default branch (`docs/agents/HARNESS.md`). This is the founder's release step.
3. **FOUNDER.** OpenRouter: create a key dedicated to this lane with a spend limit (proposed $10, weekly reset if offered). Add it as the Actions secret `OPENROUTER_API_KEY`. Do not reuse a personal key.
4. **FOUNDER.** Create the agents GitHub App exactly as `docs/release/HARNESS_SETUP.md` section 3 says: Contents, Pull requests, Issues read and write; Checks and Actions read; **no Workflows, no Administration**; installed on this repository only. Store `AGENTS_APP_CLIENT_ID` (variable), `AGENTS_APP_PRIVATE_KEY` (secret) and `AGENTS_BOT_LOGINS` (variable).
5. **FOUNDER.** Confirm branch protection on `develop` and `main` (HARNESS_SETUP section 4): the App must not be able to push there. This is the real enforcement of "only `agent/*`".
6. **FOUNDER.** Create the issue `Pilot ledger: OpenCode lane` (section 5.2) and pin it.
7. **FOUNDER.** Dry run before the switch (section 7).
8. **FOUNDER.** Switch on, last: set the repository variable `AGENTS_ENABLED` to `true` (the only thing that makes `agents.yml` run; `HARNESS_SETUP.md` section 4 item 4). Then run once by hand: Actions, Agents, Run workflow, `agent` = `product`, `task` = one small docs backlog id. A run with a task skips the gate.
9. Read the first receipt and the PR against section 6.2. Only then leave the schedule on.

### 6.2 Checks after the first manual run

- The `agent-opencode` job's permissions list in the run log shows no `id-token` and no write scopes.
- The PR is on a branch `agent/product/...`, labelled `agent:product` and `from:agent`, touching only `docs/`.
- The receipt has a numeric cost and a `cost_basis`, steps greater than 0, and the key meter.
- `usage_daily` on the OpenRouter dashboard roughly matches the receipt.
- The `OPENROUTER_API_KEY` secret does not appear in the `publish-opencode` job's environment (look at the job's "Set up job" log for secrets listed).

### 6.3 Rollback, one step

**Delete the repository variable `AGENTS_ENABLED`** (Settings, Secrets and variables, Actions, Variables). The `plan` job's `if` stops every scheduled tick and every manual run before any runner starts (`agents.yml:42`, `HARNESS_SETUP.md` section 4 item 4 and section 7). It is the whole off switch; nothing else needs to change.

Follow-ups, none urgent: cancel any run still in progress in Actions (a run that has started finishes unless cancelled); close open `agent:*` PRs; delete `agent/*` branches; rotate or delete the OpenRouter key if its safety is in doubt. To go back to the old workflow file, revert the PR from step 1. `AGENTS_PAUSED=true` is a softer stop: it assigns nothing but keeps the board current.

## 7. Dry run before the switch (founder-run or founder-approved)

1. Lint the new `agents.yml` with `actionlint` (not run here, not installed).
2. Run the install step's commands on a throwaway Linux x64 machine and confirm `--version` (UNVERIFIED items 1 and 2).
3. Prefer a throwaway private copy of the repo with a throwaway App and a key limited to $1. Negative tests there: an agent commit touching `scripts/x.mjs` must end `blocked_by_guard` with nothing pushed; a commit touching `docs/x.md` must produce a PR; a stop gate test with 15 open `agent:*` PRs must start nothing.
4. Check item 3 of the unverified list (App token permission inputs) in the action's README at the pinned SHA.
5. Check that `develop` and `main` reject a push from the App.

## 8. Decisions for the founder

1. Which docs agent is the pilot (proposed: `product`), and whether `docs/agents/` stays on the deny list (proposed: yes).
2. The numbers: key limit ($10), per-run cap ($1), daily runs (2), daily meter ($3), weekly review limit (120 minutes).
3. One open-PR number: the dispatcher says 10, the gate says 15. Proposed: leave both, 10 is the working limit and 15 the backstop.
4. Pin 1.18.34 as the roster says, or move to a newer version first (the registry `latest` was 1.19.5; fitness UNVERIFIED).
5. Whether the publish job may later also post reviews and comments (a separate design).
6. Whether the Claude arm gets the same split before any Claude agent is scheduled.
