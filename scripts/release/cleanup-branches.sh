#!/usr/bin/env bash
# CR-14 branch cleanup (docs/agents/cto/RULINGS.md). Archive-tag then delete the branches in a list, fail closed.
# Usage (from a clone of thesaurabhpareek/earlyletters):
#   bash scripts/release/cleanup-branches.sh scripts/release/branch-cleanup/pass1-2026-10-30.tsv           # dry run
#   bash scripts/release/cleanup-branches.sh scripts/release/branch-cleanup/pass1-2026-10-30.tsv --apply   # tags, verifies, deletes
# list.tsv columns: branch <TAB> sha-at-ruling <TAB> PR (e.g. #123 or -)
# A branch is skipped (and kept) when: it is main, develop or release/*; its live tip is not the
# ruled sha; it is the head or base of an open PR right now; or its archive tag cannot be verified.
set -euo pipefail
LIST=$1; APPLY=${2:-}
REPO=thesaurabhpareek/earlyletters
git remote get-url origin | grep -q "thesaurabhpareek/earlyletters" || { echo "origin is not $REPO"; exit 1; }
W=${WORK:-$(mktemp -d)}
LOG=$W/cleanup-$(date -u +%Y%m%dT%H%M%SZ).log
OPEN=$(mktemp)
for p in 1 2 3; do
  gh api "repos/$REPO/pulls?state=open&per_page=100&page=$p" --jq '.[]|.head.ref, .base.ref'
done | sort -u > "$OPEN"
git ls-remote --heads origin > $W/live-heads.txt
ok=(); skipped=0
while IFS=$'\t' read -r b sha pr; do
  [[ -z "$b" ]] && continue
  if [[ "$b" =~ ^(main|develop|release/) ]]; then echo "KEEP protected $b" | tee -a "$LOG"; skipped=$((skipped+1)); continue; fi
  live=$(awk -v r="refs/heads/$b" '$2==r{print $1}' $W/live-heads.txt)
  if [[ "$live" != "$sha" ]]; then echo "KEEP moved-or-gone $b live=${live:-none} ruled=$sha" | tee -a "$LOG"; skipped=$((skipped+1)); continue; fi
  if grep -qxF "$b" "$OPEN"; then echo "KEEP open-pr $b" | tee -a "$LOG"; skipped=$((skipped+1)); continue; fi
  ok+=("$b|$sha|$pr")
done < "$LIST"
echo "candidates: ${#ok[@]}  kept: $skipped" | tee -a "$LOG"
[[ "$APPLY" == "--apply" ]] || { printf '%s\n' "${ok[@]}" | sed 's/^/WOULD archive+delete /'; exit 0; }

# 0. CR-14 runs only after CR-11's "archive tags are kept" ruleset is active on refs/tags/archive/**/*
gh api "repos/$REPO/rulesets" --jq '.[]|select(.name=="archive tags are kept" and .enforcement=="active")|.id' | grep -q . \
  || { echo "Stopped: the 'archive tags are kept' ruleset is not active yet (run scripts/release/apply-branch-settings.sh --apply first)." | tee -a "$LOG"; exit 1; }

# 1. annotated archive tags, pushed in batches of 50 (tag pushes trigger no workflow: only db-v* is a tag trigger)
refs=()
git ls-remote --tags origin > $W/tags-before.txt
for e in "${ok[@]}"; do IFS='|' read -r b sha pr <<<"$e"
  # re-runnable: an archive tag already on the remote at the same commit is kept as it is
  have=$(awk -v r="refs/tags/archive/$b^{}" '$2==r{print $1}' $W/tags-before.txt)
  if [[ "$have" == "$sha" ]]; then continue; fi
  git tag -f -a "archive/$b" "$sha" -m "Archive of branch $b at $sha (PR $pr), CR-14 cleanup $(date -u +%F)"
  refs+=("refs/tags/archive/$b")
done
for ((i=0; i<${#refs[@]}; i+=50)); do git push origin "${refs[@]:i:50}"; done

# 2. verify every tag on the remote peels to the branch sha before any deletion
git ls-remote --tags origin > $W/live-tags.txt
del=()
for e in "${ok[@]}"; do IFS='|' read -r b sha pr <<<"$e"
  peeled=$(awk -v r="refs/tags/archive/$b^{}" '$2==r{print $1}' $W/live-tags.txt)
  if [[ "$peeled" == "$sha" ]]; then del+=("$b|$sha"); else echo "KEEP tag-unverified $b" | tee -a "$LOG"; fi
done

# 3. re-read open PRs (the tag pushes widened the window), then delete with a lease:
#    a branch that moved since the check is refused, not deleted
for p in 1 2 3; do gh api "repos/$REPO/pulls?state=open&per_page=100&page=$p" --jq '.[]|.head.ref, .base.ref'; done | sort -u > "$OPEN"
keep=(); for e in "${del[@]}"; do b=${e%%|*}; if grep -qxF "$b" "$OPEN"; then echo "KEEP open-pr-now $b" | tee -a "$LOG"; else keep+=("$e"); fi; done
del=("${keep[@]}")
for ((i=0; i<${#del[@]}; i+=50)); do
  leases=(); specs=()
  for e in "${del[@]:i:50}"; do IFS='|' read -r b sha <<<"$e"; leases+=("--force-with-lease=refs/heads/$b:$sha"); specs+=(":refs/heads/$b"); done
  git push "${leases[@]}" origin "${specs[@]}" 2>&1 | tee -a "$LOG" || true
done
git ls-remote --heads origin > $W/live-heads-after.txt
for e in "${del[@]}"; do b=${e%%|*}
  if awk -v r="refs/heads/$b" '$2==r{f=1} END{exit !f}' $W/live-heads-after.txt; then echo "STILL-PRESENT $b" | tee -a "$LOG"; else echo "DELETED $b (tag archive/$b)" >> "$LOG"; fi
done
echo "Done. Log: $LOG."
echo 'Restore one: git fetch origin tag archive/<branch> && git push origin "$(git rev-parse archive/<branch>^{commit})":refs/heads/<branch>'
