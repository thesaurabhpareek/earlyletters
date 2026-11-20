# Proposal: one-click founder approval (`founder:approve`)

Status: PROPOSAL, 10 Nov 2026, owner `ops`. Nothing under `.github/` is changed by this pull request: agents cannot edit workflows. The founder reviews the YAML in section 5 and commits it as `.github/workflows/founder-approve.yml` on `develop`. Untested until then; section 6 is the dry-run plan.

## 1. What the founder gets

Today, merging a ready pull request means checking by hand that two review comments name the current head, CI is green, nothing is on hold, and (for fenced paths) that the approval lines are posted. The goal: the founder adds the label `founder:approve` to a PR from their own account, and the workflow does those checks and the squash merge, or says in a comment why it stopped.

Anything pushed after the label voids it, because the merge is pinned to the exact commit that was current when the label was added.

## 2. The blocker, stated plainly

The compliance fence counts approval lines only from the repository owner's login (`compliance/FENCE.json`, `trustedLogins: [owner]` in `.github/workflows/compliance-fence.yml`). A comment posted by this workflow with the default `GITHUB_TOKEN` is authored by `github-actions[bot]`. It will not count. So the workflow cannot, with the default token, post the `## CCO approval at <sha>: APPROVED (CCO-n|CR-n)` line, and I am not proposing to change the fence to accept it.

Two further facts that shape the design:

1. **A merge made with `GITHUB_TOKEN` does not start other workflows.** GitHub suppresses workflow runs for events caused by that token. `deploy-db.yml` and other `push: develop` workflows would silently not run after a bot merge. The merge therefore needs an identity that is allowed to trigger workflows: a GitHub App installation token (recommended) or a founder token.
2. **Every Claude session posts as the founder's account (CR-20).** A label added by `github.event.sender.login == owner` proves the label came from the founder's login, not from the founder's hands. An interactive agent session with the founder's `gh` login could add the label. This is the same limit `compliance/README.md` states for the fence ("proves the procedure ran, not who ran it"). Mitigation here is a rule, not code: agent charters never add `founder:approve` (section 7, item 1). The real fix is the separate automation identity in CR-20.

## 3. Options for the CCO approval line

| | A. Merge only (recommended now) | B. Founder-created fine-scoped token posts the line | C. A new bot login counted by the fence |
|---|---|---|---|
| CCO line | Founder or CCO posts it by hand, as today | Workflow posts it as the founder | Fence changes to trust a bot |
| Fence changed | No | No | Yes, so rejected |
| New secret | App key for the merge (optional, see 4.3) | A token that speaks as the founder | Same |
| What a leak or a bad workflow edit allows | Merging PRs that already pass every check | Forging the CCO line and, with the same token, the Karma line: the fence then proves nothing | Same |
| Effort | Lowest | Medium, plus 90-day rotation | High |

**Recommendation: A.** The fence exists so an unattended automation cannot approve a compliance change. Option B puts a token that can speak as the owner into an Actions secret; any later edit to a workflow on `develop` (not all of which are fenced) could use it to satisfy both fence lines for any PR, which removes the fence's one real protection. Option A keeps every compliance approval a deliberate human or Karma comment. It also loses little: the fenced PRs are rare (`compliance/**` and `docs/legal/**` are excluded from one-click anyway), and a PR that needs only the CCO line (the age gate, consent SQL) needs one comment, then the label.

In option A the workflow never reads which tier a PR is in. It requires the `compliance-fence` check to be green on the head; that check already encodes the tier, the assigned-agent label and the approvals. If the CCO line is missing, the fence is red and the workflow stops and says so.

If the founder later wants B for the CCO line only, section 8 gives the step. Preconditions: a fine-grained token limited to this repository with only "Pull requests: write" (comments), 30-day expiry, stored as an environment secret on an environment with the founder as required reviewer, and `.github/workflows/**` added to CODEOWNERS or the fence so no other workflow edit can reach it. I do not recommend doing this before the CR-20 automation identity exists.

## 4. Security design

### 4.1 Trigger and who may pull it
- `pull_request_target`, type `labeled` only. The workflow file comes from the default branch (`develop`), so a PR cannot edit its own approval workflow.
- Job `if` requires `github.event.label.name == 'founder:approve'`, `github.event.sender.login == github.repository_owner`, `sender.type == 'User'`, the PR head repository equal to this repository (fork PRs excluded), and base branch `develop`. The script repeats the owner and fork checks from the API, so a mistake in the expression is not the only guard.
- Release PRs into `main` are out of scope: they stay founder-merged by hand.

### 4.2 No PR code, no injection
- No `actions/checkout`. No PR file is executed, sourced or installed. Only the API is read.
- Nothing from the PR (title, body, branch name, file names, comment text) is interpolated into a script. The only expression values placed in `env:` are numbers, the repository name, the owner login and the event's head sha. Comment text is built only from fixed strings plus a sha that has been checked against `^[0-9a-f]{40}$`.
- Review comments are parsed with `jq` regexes from JSON, never evaluated.
- `workflow` permissions start at `{}`; the job gets `contents: write`, `pull-requests: write` and `checks: read`, nothing else (no `actions`, `id-token`, `packages`, `issues`).

### 4.3 Tokens
- Default: `github.token` with the permissions above. Its merges do not trigger `push` workflows (section 2, fact 1).
- Recommended: a dedicated GitHub App ("early-letters-merge", not the agents App), installed on this repository only, permissions Contents: write and Pull requests: write, with `vars.FOUNDER_APPROVE_APP_ID` and `secrets.FOUNDER_APPROVE_APP_KEY`. The workflow mints a short-lived token limited to those two permissions. The App is a bot login, so it can merge but its comments never count for the fence. Branch protection still applies (`enforce_admins: true`, required checks), so the App cannot merge a red PR.
- No secret is printed. The step output is the token, masked by the action. No `set -x`.

### 4.4 Pinning and stale state
- The merge call sends `sha=<head>`; GitHub rejects it (409) if the branch moved, so a push between the checks and the merge cannot slip through.
- The event's head sha (at label time) must equal the head read now. If they differ, a push happened after the click: the label is void.
- Checks and review comments are evaluated against that same sha.

### 4.5 Fails closed
Any API error, missing field or unexpected shape stops with a comment and merges nothing. The label is removed on every outcome, so a second click is a fresh decision.

### 4.6 Remaining risks
- Anyone with write access can add other labels but cannot trigger this one (sender check). Anyone who can run as the founder's login can (section 2, fact 2).
- The three required check names are hardcoded; if branch protection changes, the workflow must change (the dry run in section 6 compares them to `apply-branch-settings.sh`).
- A `labeled` event also re-runs the fence, so the workflow waits (up to 4 minutes) for checks that are still running instead of reading a half-finished state.

## 5. The workflow

Pin the third-party action to a full commit SHA before committing (the repository pins actions this way); `ops` could not resolve it from this session. Replace `<PIN-SHA>`.

```yaml
# One-click founder approval (docs/ops/proposals/founder-approve-workflow.md).
# The founder adds the label `founder:approve` to a PR. This workflow checks the merge conditions against the
# exact head commit and squash-merges pinned to it, or comments why it stopped.
# Never checks out or runs PR code. Reads everything through the API. Nothing from the PR is interpolated into a
# script. It does NOT post any compliance approval line: those stay manual (the fence counts only the owner's
# login, and this workflow acts as a bot).
name: Founder approve

on:
  pull_request_target:
    types: [labeled]

permissions: {}

concurrency:
  group: founder-approve-${{ github.event.pull_request.number }}
  cancel-in-progress: false

jobs:
  merge:
    name: merge on founder approval
    if: >-
      github.event.label.name == 'founder:approve' &&
      github.event.sender.login == github.repository_owner &&
      github.event.sender.type == 'User' &&
      github.event.pull_request.head.repo.full_name == github.repository &&
      github.event.pull_request.base.ref == 'develop'
    runs-on: ubuntu-24.04
    timeout-minutes: 10
    permissions:
      contents: write
      pull-requests: write
      checks: read
    steps:
      # Optional: a bot token so the merge starts push-triggered workflows on develop. Without
      # FOUNDER_APPROVE_APP_ID the job falls back to github.token and says so in the merge comment.
      - name: Mint merge token
        id: app
        if: vars.FOUNDER_APPROVE_APP_ID != ''
        uses: actions/create-github-app-token@<PIN-SHA> # v2
        with:
          app-id: ${{ vars.FOUNDER_APPROVE_APP_ID }}
          private-key: ${{ secrets.FOUNDER_APPROVE_APP_KEY }}
          permission-contents: write
          permission-pull-requests: write

      - name: Check and merge
        shell: bash
        env:
          GH_TOKEN: ${{ steps.app.outputs.token || github.token }}
          APP_TOKEN: ${{ steps.app.outputs.token != '' && 'yes' || 'no' }}
          REPO: ${{ github.repository }}
          OWNER: ${{ github.repository_owner }}
          SENDER: ${{ github.event.sender.login }}
          PR: ${{ github.event.pull_request.number }}
          EVENT_HEAD: ${{ github.event.pull_request.head.sha }}
        run: |
          set -euo pipefail
          LABEL='founder%3Aapprove'
          cleanup() { gh api -X DELETE "repos/$REPO/issues/$PR/labels/$LABEL" >/dev/null 2>&1 || true; }
          trap cleanup EXIT
          say() { gh pr comment "$PR" --repo "$REPO" --body "$1" >/dev/null || true; }
          stop() { say "Founder approve stopped, nothing was merged: $1 Add the label again when this is fixed."; echo "::notice title=founder-approve::$1"; exit 0; }
          fail() { say "Founder approve stopped on an error, nothing was merged: $1"; echo "::error title=founder-approve::$1"; exit 1; }

          # Re-check the gate from the API (the job `if` is not the only guard).
          [[ "$PR" =~ ^[0-9]+$ ]] || { echo "::error::bad PR number"; exit 1; }
          [[ "${SENDER,,}" == "${OWNER,,}" ]] || fail "the label was not added by the repository owner."
          [[ "$EVENT_HEAD" =~ ^[0-9a-f]{40}$ ]] || fail "the event carried no valid head commit."
          pr_json="$(gh api "repos/$REPO/pulls/$PR")" || fail "could not read the pull request."
          head="$(jq -r .head.sha <<<"$pr_json")"
          [[ "$head" =~ ^[0-9a-f]{40}$ ]] || fail "could not read the head commit."
          [ "$(jq -r .head.repo.full_name <<<"$pr_json")" = "$REPO" ] || stop "pull requests from forks are never merged here."
          [ "$(jq -r .base.ref <<<"$pr_json")" = "develop" ] || stop "only pull requests into develop are merged here."
          [ "$(jq -r .state <<<"$pr_json")" = "open" ] || stop "the pull request is not open."
          [ "$(jq -r .draft <<<"$pr_json")" = "false" ] || stop "the pull request is a draft."
          [ "$head" = "$EVENT_HEAD" ] || stop "a commit was pushed after the label, so the approval is void (head is now ${head:0:12})."
          jq -e '[.labels[].name] | index("hold") | not' <<<"$pr_json" >/dev/null || stop "the label hold is on this pull request."

          # Paths that stay founder-merged by hand.
          files="$(gh api --paginate "repos/$REPO/pulls/$PR/files" --jq '.[] | .filename, (.previous_filename // empty)')" \
            || fail "could not list the changed files."
          [ -n "$files" ] || stop "the pull request changes no files."
          if grep -Eq '^(docs/legal/|compliance/|\.github/)' <<<"$files"; then
            stop "it touches docs/legal/, compliance/ or .github/, which are merged by hand."
          fi

          # Review A and Review B: the newest trusted verdict per lens at this exact head must be exactly PASS.
          gh api --paginate "repos/$REPO/issues/$PR/comments" \
            --jq '.[] | {id, created_at, body, assoc: .author_association}' | jq -s '.' > "$RUNNER_TEMP/comments.json" \
            || fail "could not read comments."
          for lens in A B; do
            verdict="$(jq -r --arg lens "$lens" --arg head "$head" '
              [ .[]
                | select(.assoc == "OWNER" or .assoc == "MEMBER" or .assoc == "COLLABORATOR")
                | . as $c
                | (.body | split("\n")[0] | rtrimstr("\r")
                   | capture("^## Review (?<lens>[AB]) at (?<sha>[0-9a-f]{40}): (?<word>\\S.*?)[ \\t]*$")?) as $m
                | select($m != null and $m.lens == $lens and $m.sha == $head)
                | {id: $c.id, created_at: $c.created_at, word: $m.word} ]
              | sort_by(.created_at, .id) | (last // {word: "none"}) | .word' "$RUNNER_TEMP/comments.json")"
            [ "$verdict" = "PASS" ] || stop "Review $lens has no PASS at ${head:0:12} (newest verdict there: $verdict)."
          done

          # Checks on this head. Wait for runs that are still going (the label itself re-runs the fence).
          need=("required" "applied migrations unchanged" "compliance-fence")
          for attempt in $(seq 1 16); do
            gh api --paginate "repos/$REPO/commits/$head/check-runs?per_page=100" --jq '.check_runs[] | {id, name, status, conclusion}' \
              | jq -s '.' > "$RUNNER_TEMP/checks.json" || fail "could not read check runs."
            pending=0
            for n in "${need[@]}"; do
              st="$(jq -r --arg n "$n" '[.[] | select(.name == $n)] | sort_by(.id) | (last // {status: "missing"}) | if .status == "completed" then .conclusion else .status end' "$RUNNER_TEMP/checks.json")"
              case "$st" in
                success) ;;
                missing|queued|in_progress|pending|waiting|requested) pending=1 ;;
                *) stop "the check \"$n\" is $st on ${head:0:12}." ;;
              esac
            done
            [ "$pending" = 0 ] && break
            [ "$attempt" = 16 ] && stop "the checks did not all finish within 4 minutes."
            sleep 15
          done

          # Last look at the head, then merge pinned to it. GitHub answers 409 if the branch moved.
          now="$(gh api "repos/$REPO/pulls/$PR" --jq .head.sha)" || fail "could not re-read the head."
          [ "$now" = "$head" ] || stop "a commit was pushed while checking, so the approval is void."
          if out="$(gh api -X PUT "repos/$REPO/pulls/$PR/merge" -f merge_method=squash -f sha="$head" 2>&1)"; then
            note=""
            [ "$APP_TOKEN" = "yes" ] || note=" Merged with the Actions token, so push-triggered workflows on develop did not start; run them by hand if needed."
            say "Founder approve: squash-merged at ${head:0:12} after Review A and Review B PASS, green checks and no hold.$note"
          else
            echo "$out" | head -c 300
            stop "GitHub refused the merge (the branch moved, is behind, or a rule blocked it)."
          fi
```

## 6. Tests and dry-run plan

I could not run the workflow from this session. Run these in order, on `develop` after commit, with throwaway PRs from a branch in this repository. Use a throwaway repository first if the founder prefers: copy the file, create the labels, and skip step 5.

1. **Lint.** `actionlint` on the file (pin and run via `npx`), and `shellcheck` on the `run:` block. Compare the three check names with the `required` contexts in `scripts/release/apply-branch-settings.sh` and the fence job name.
2. **Dry-run mode first.** Before the first live use, temporarily replace the `gh api -X PUT .../merge` line with `echo "would merge $head"` in the committed file (one commit, reverted after). Every case below then runs with no risk.
3. **Negative cases (each must stop with the stated reason, merge nothing, and remove the label):**
   - label added by a collaborator who is not the owner (job does not run);
   - PR from a fork (job does not run); PR whose base is `main`;
   - draft PR; PR with `hold`;
   - only Review A at head; Review B at an older sha; Review A `PASS` then a newer `BLOCKED` at head; `PASS WITH NOTES`; a PASS from a non-collaborator account;
   - a push after the label: add the label, push within seconds (or re-run the job after pushing): must stop with "approval is void";
   - PR touching `docs/legal/x.md`, `compliance/x`, `.github/x`;
   - `required` red; `compliance-fence` red because a CCO line is missing (confirm the comment says so via the check name);
   - a PR whose title is `$(echo pwned)` `"; rm -rf /` and body with backticks: the run must behave identically (no expression in a script).
4. **Positive case.** A docs-only PR with two PASS comments at head and green checks: label, one run, squash commit on `develop`, label removed, one comment.
5. **Downstream trigger.** After a positive merge, confirm `deploy-db.yml`-style push workflows started. If not, the App token is not minted (check `vars.FOUNDER_APPROVE_APP_ID`).
6. **Fence interplay.** A PR touching an age-gate file with a manual CCO line at head: the label merges. Edit the PR (new head): the old CCO line and the label are void; the workflow stops.
7. **Revert drill.** Restore the merge line; delete the workflow to disable (no other state).

## 7. Rules to add with it (docs only, for the founder to accept)

1. `docs/DEVELOPMENT.md` and every agent charter: agents never add the label `founder:approve` (it is the one label that merges).
2. `.github/README.md`: add the workflow, its three required check names, and the "do not edit without the founder" note. Consider adding `.github/workflows/founder-approve.yml` to `compliance/FENCE.json` `protected` so it needs the CCO and Karma lines to change.
3. `docs/FOUNDER_TASKS.md`: create the App and the two settings in 4.3 (optional but recommended), and record the choice of option A as a ruling.

## 8. If the founder later chooses option B (not recommended now)

Add before "Check and merge", and only for PRs the fence says need a CCO line. Needs a ruling reference in the repository variable `FOUNDER_APPROVE_CCO_REF` (for example `CCO-12`, validated against `^(CCO|CR)-[0-9]+$`), a secret `FOUNDER_COMMENT_TOKEN` (fine-grained, this repository only, Pull requests: write, 30-day expiry, on an environment that requires the founder's approval), and base-commit `compliance/fence/fence.mjs` fetched exactly as `compliance-fence.yml` does, to ask `classify()` whether `cco_review` or `protected` is non-empty. For `protected` PRs it must stop: the Karma line and the assigned-agent label are never automated. Post with `GH_TOKEN="$FOUNDER_COMMENT_TOKEN" gh pr comment "$PR" --body "## CCO approval at $head: APPROVED ($REF)"`, where `$REF` came from the validated variable and `$head` from the API check above. The fence does not re-run on a comment, so the step must also trigger it (remove then re-add a label with the same token), and then wait as the polling loop already does. This is untested, and it is the part that changes the trust model.
