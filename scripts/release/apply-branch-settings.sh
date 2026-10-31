#!/usr/bin/env bash
# Karma's rulings CR-6 (merge settings), CR-7 (protection), CR-11 (rulesets) and CR-9 (default branch),
# 30 Oct 2026, in docs/agents/cto/RULINGS.md, as one script the founder runs.
# Why the founder: the agent proxy refuses repository settings writes from Claude sessions
# ("Repository settings writes are not permitted through this proxy", HTTP 403), so these
# calls have to come from your own computer, signed in to gh as thesaurabhpareek.
#
#   bash scripts/release/apply-branch-settings.sh            # dry run: prints the live state and every call
#   bash scripts/release/apply-branch-settings.sh --apply    # snapshots, applies in order, verifies
#   bash scripts/release/apply-branch-settings.sh --verify   # read-only check; exits 1 on any drift
#   bash scripts/release/apply-branch-settings.sh --undo     # puts everything back from the snapshot
#
# Order and reasons: docs/agents/cto/RULINGS.md CR-6 to CR-15. It stops at the first failure.
# What it does NOT do: approvals or environment reviewers (they wait until PR authors are not your
# account, CR-20; a second personal account is withdrawn, CR-19), labels (CR-15), or deleting
# branches (CR-14: you run scripts/release/cleanup-branches.sh after this, because the proxy
# refuses tag pushes from sessions). Archive and delete release/ios-v1.0 before --apply: the commands
# are in docs/release/FOUNDER_QUEUE.md row 7, and --apply asks before going on while it exists.
set -euo pipefail
REPO=thesaurabhpareek/earlyletters
R=repos/$REPO
MODE=${1:-}
SNAP=${SNAP_DIR:-$HOME/.earlyletters-settings-snapshot}
COPILOT_RULESET=26012645
CHECKS_APP=15368   # GitHub Actions

say() { printf '%s\n' "$*"; }
need() { command -v "$1" >/dev/null || { say "Missing $1"; exit 1; }; }
need gh; need jq
[[ "$(gh api user --jq .login)" == "thesaurabhpareek" ]] || { say "Sign in to gh as thesaurabhpareek first."; exit 1; }

protection_body() { cat <<'JSON'
{
  "required_status_checks": { "strict": false, "checks": [
    { "context": "required", "app_id": 15368 },
    { "context": "applied migrations unchanged", "app_id": 15368 } ] },
  "enforce_admins": true,
  "required_pull_request_reviews": { "required_approving_review_count": 0, "dismiss_stale_reviews": false, "require_code_owner_reviews": false },
  "restrictions": null,
  "required_linear_history": false,
  "allow_force_pushes": false,
  "allow_deletions": false,
  "block_creations": false,
  "required_conversation_resolution": false,
  "lock_branch": false
}
JSON
}
copilot_body() { cat <<'JSON'
{ "name": "Copilot review for main", "target": "branch", "enforcement": "active", "bypass_actors": [],
  "conditions": { "ref_name": { "include": ["refs/heads/main"], "exclude": [] } },
  "rules": [ { "type": "deletion" }, { "type": "non_fast_forward" },
    { "type": "copilot_code_review", "parameters": { "review_draft_pull_requests": true, "review_on_push": false } } ] }
JSON
}
ruleset_bodies() { cat <<'JSON'
{"name":"release tags are immutable","target":"tag","enforcement":"active","bypass_actors":[],"conditions":{"ref_name":{"include":["refs/tags/ios-v*","refs/tags/db-v*"],"exclude":[]}},"rules":[{"type":"update"},{"type":"deletion"}]}
{"name":"release branches keep their history","target":"branch","enforcement":"active","bypass_actors":[],"conditions":{"ref_name":{"include":["refs/heads/release/*"],"exclude":[]}},"rules":[{"type":"deletion"},{"type":"non_fast_forward"}]}
{"name":"archive tags are kept","target":"tag","enforcement":"active","bypass_actors":[],"conditions":{"ref_name":{"include":["refs/tags/archive/**/*"],"exclude":[]}},"rules":[{"type":"update"},{"type":"deletion"}]}
JSON
}

verify() {
  local bad=0 v
  v=$(gh api $R --jq '[.default_branch,.allow_rebase_merge,.delete_branch_on_merge,.allow_auto_merge,.allow_update_branch,.squash_merge_commit_title]|@tsv')
  [[ "$v" == $'develop\tfalse\ttrue\tfalse\ttrue\tPR_TITLE' ]] && say "OK   repo: default develop, squash and merge commits, no rebase, delete on merge" || { say "DRIFT repo: $v"; bad=1; }
  for b in develop main; do
    if gh api $R/branches/$b/protection >/dev/null 2>&1; then
      v=$(gh api $R/branches/$b/protection --jq '[([.required_status_checks.checks[]|.context]|sort|join(",")), .enforce_admins.enabled, .required_pull_request_reviews.required_approving_review_count, .allow_force_pushes.enabled, .allow_deletions.enabled]|@tsv')
    else v=none; fi
    [[ "$v" == $'applied migrations unchanged,required\ttrue\t0\tfalse\tfalse' ]] && say "OK   protection $b" || { say "DRIFT protection $b: $v"; bad=1; }
  done
  v=$(gh api $R/rulesets/$COPILOT_RULESET --jq '.conditions.ref_name.include|join(",")')
  [[ "$v" == "refs/heads/main" ]] && say "OK   Copilot ruleset on main only" || { say "DRIFT Copilot ruleset include: $v"; bad=1; }
  for n in "release tags are immutable" "release branches keep their history" "archive tags are kept"; do
    gh api $R/rulesets | jq -r --arg n "$n" '.[]|select(.name==$n and .enforcement=="active")|.id' | grep -q . && say "OK   ruleset: $n" || { say "DRIFT missing ruleset: $n"; bad=1; }
  done
  return $bad
}

case "$MODE" in
  ""|--dry-run)
    say "Live state now:"
    gh api $R --jq '{default_branch,allow_squash_merge,allow_merge_commit,allow_rebase_merge,delete_branch_on_merge,allow_auto_merge,allow_update_branch,squash_merge_commit_title}'
    for b in develop main; do if gh api $R/branches/$b/protection >/dev/null 2>&1; then say "protection $b: on"; else say "protection $b: none"; fi; done
    gh api $R/rulesets --jq '.[]|"ruleset \(.id) \(.name) \(.enforcement)"'
    say ""
    say "Would run, in order:"
    say "1. CR-6  PATCH $R  rebase off, delete branches on merge, auto-merge off, update-branch on, squash title = PR title"
    say "2. CR-7  PUT $R/branches/develop/protection and main: PR required, checks 'required' and 'applied migrations unchanged' (app $CHECKS_APP), 0 approvals, admins enforced, no force push or deletion"
    say "3. CR-11  POST $R/rulesets x3: release tags immutable, release branches keep history, archive tags kept"
    say "4. CR-9  PUT $R/rulesets/$COPILOT_RULESET to target main only, then PATCH default_branch=develop, then disable agents.yml"
    say "Then --verify. Way back: --undo."
    ;;
  --apply)
    say "Before this runs: open Vercel, project earlyletters, Settings, Git, and check that the Production Branch is main"
    say "(CR-2 of 30 Oct makes that a condition of switching the default branch)."
    read -r -p "Is the Vercel Production Branch main? Type yes to go on: " ok
    [[ "$ok" == "yes" ]] || { say "Stopped. Nothing changed."; exit 1; }
    read -r -p "Is the repository variable AGENTS_ENABLED unset or not 'true' (Settings, Secrets and variables, Actions, Variables)? Type yes: " ok2
    [[ "$ok2" == "yes" ]] || { say "Stopped. Nothing changed. Leave AGENTS_ENABLED off (CR-5) and run again."; exit 1; }
    # CR-11's "release branches keep their history" ruleset makes every release/* branch undeletable once it exists.
    rel=$(gh api "$R/git/matching-refs/heads/release" --jq '.[].ref|select(startswith("refs/heads/release/"))' 2>/dev/null || true)
    if [[ -n "$rel" ]]; then
      say "These release branches exist and can't be deleted after this run:"; say "$rel"
      say "You chose on 30 Oct to archive and delete release/ios-v1.0 first (docs/release/FOUNDER_QUEUE.md row 7 has the commands)."
      read -r -p "Keep them for good and go on? Type keep to go on, anything else stops: " ok3
      [[ "$ok3" == "keep" ]] || { say "Stopped. Nothing changed."; exit 1; }
    fi
    mkdir -p "$SNAP"
    if [[ -f "$SNAP/repo.json" ]]; then
      # Keep the first snapshot: it holds the state before any run, so --undo stays a true way back after a partial run.
      say "Keeping the snapshot from an earlier run in $SNAP (taken $(date -r "$SNAP/repo.json" 2>/dev/null || echo earlier))."
    else
      gh api $R > "$SNAP/repo.json"; gh api $R/rulesets > "$SNAP/rulesets.json"; gh api $R/rulesets/$COPILOT_RULESET > "$SNAP/copilot.json"
      say "Snapshot in $SNAP"
    fi
    say "CR-6"; gh api -X PATCH $R -F allow_squash_merge=true -F allow_merge_commit=true -F allow_rebase_merge=false \
      -F delete_branch_on_merge=true -F allow_auto_merge=false -F allow_update_branch=true \
      -f squash_merge_commit_title=PR_TITLE -f squash_merge_commit_message=COMMIT_MESSAGES --jq .full_name
    say "CR-7"; for b in develop main; do protection_body | gh api -X PUT $R/branches/$b/protection --input - --jq .url; done
    say "CR-11"; while read -r body; do
      name=$(jq -r .name <<<"$body")
      if gh api $R/rulesets | jq -r --arg n "$name" '.[]|select(.name==$n)|.id' | grep -q .; then say "  exists: $name"; else gh api -X POST $R/rulesets --input - <<<"$body" --jq '"  created \(.id) \(.name)"'; fi
    done < <(ruleset_bodies)
    say "CR-9"; copilot_body | gh api -X PUT $R/rulesets/$COPILOT_RULESET --input - --jq '"  Copilot ruleset now on \(.conditions.ref_name.include|join(","))"'
    gh api -X PATCH $R -f default_branch=develop --jq '"  default branch \(.default_branch)"'
    # agents.yml only registers once develop is the default branch, so wait for GitHub to index it (up to 2 minutes).
    wid=""
    for i in $(seq 1 24); do
      wid=$(gh api $R/actions/workflows --jq '.workflows[]|select(.path==".github/workflows/agents.yml")|.id' 2>/dev/null || true)
      [[ -n "$wid" ]] && break; sleep 5
    done
    if [[ -n "$wid" ]]; then gh api -X PUT $R/actions/workflows/$wid/disable && say "  agents.yml disabled"
    else say "  agents.yml not registered yet: open Actions, Agents, and choose Disable workflow. Its jobs also skip while AGENTS_ENABLED is not true."; fi
    say ""; verify && say "All applied and verified." || { say "Drift after apply: run --undo, then tell Karma."; exit 1; }
    say "Vercel: its Production Branch is a Vercel setting, so --undo cannot fix a production deploy from the wrong branch."
    say "If one ever happens: Vercel, project earlyletters, Instant Rollback, then set the Production Branch back to main (CR-9)."
    ;;
  --verify) verify ;;
  --undo)
    [[ -f "$SNAP/repo.json" ]] || { say "No snapshot in $SNAP"; exit 1; }
    gh api -X PATCH $R -f default_branch="$(jq -r .default_branch "$SNAP/repo.json")" \
      -F allow_rebase_merge="$(jq -r .allow_rebase_merge "$SNAP/repo.json")" -F delete_branch_on_merge="$(jq -r .delete_branch_on_merge "$SNAP/repo.json")" \
      -F allow_update_branch="$(jq -r .allow_update_branch "$SNAP/repo.json")" \
      -f squash_merge_commit_title="$(jq -r .squash_merge_commit_title "$SNAP/repo.json")" --jq '"repo restored: default \(.default_branch)"'
    jq '{name,target,enforcement,bypass_actors,conditions,rules}' "$SNAP/copilot.json" | gh api -X PUT $R/rulesets/$COPILOT_RULESET --input - --jq '"Copilot ruleset restored"'
    for b in develop main; do gh api -X DELETE $R/branches/$b/protection >/dev/null 2>&1 && say "protection removed: $b" || true; done
    say "The three new rulesets stay (they block nothing today). Delete any with: gh api -X DELETE $R/rulesets/<id>"
    say "agents.yml stays disabled (CR-5). Snapshot kept in $SNAP; delete it once you are happy, so a later --apply takes a fresh one."
    ;;
  *) say "Usage: $0 [--dry-run|--apply|--verify|--undo]"; exit 2 ;;
esac
