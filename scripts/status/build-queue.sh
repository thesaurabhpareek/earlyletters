#!/bin/bash
# Computes the build queue from GitHub REST only and prints a Markdown body.
# Numbers, shas and states only: no PR titles, bodies or comments are copied,
# so the output is safe for agents to read (TODAY page rule, HV2-B07).
set -u
R=repos/thesaurabhpareek/earlyletters
now=$(date -u +%Y-%m-%dT%H:%MZ)
dev=$(gh api $R/branches/develop --jq .commit.sha)
ci() { # sha -> "green" | "running" | "failing: names" | "none"
  gh api "$R/commits/$1/check-runs?per_page=100" --jq '
    [.check_runs[]] as $r
    | if ($r|length)==0 then "none"
      elif any($r[]; .conclusion=="failure" or .conclusion=="timed_out" or .conclusion=="action_required") then
        "failing: " + ([$r[]|select(.conclusion=="failure" or .conclusion=="timed_out" or .conclusion=="action_required")|.name]|unique|join(", "))
      elif any($r[]; .status!="completed") then "running"
      else "green" end' 2>/dev/null || echo "unreadable"
}
echo "# Build queue (computed, do not edit by hand)"
echo
echo "Generated $now from GitHub REST by \`scripts/status/build-queue.sh\`. Valid for 15 minutes; if the time above is older, treat every row as stale and re-read the PR."
echo
echo "- develop head: \`$dev\`, CI: $(ci $dev)"
gh api "$R/actions/workflows/testflight.yml/runs?per_page=3" --jq '.workflow_runs[]|"- testflight.yml run #\(.run_number): \(.status) \(.conclusion // "") at `\(.head_sha)` (\(.created_at))"'
echo
echo "A PR is **ready** only when: open, not draft, mergeable_state clean, CI green, and a \`## Review A at <head>: PASS\` and \`## Review B at <head>: PASS\` (or PASS WITH NOTES) exist for the exact 40-character head. Merging still needs the founder's go naming the PR and head (CR-54 item 2) and, on fenced paths, the CCO line."
echo
echo "| PR | Head | Draft | Mergeable | CI | Counted A | Counted B | Ready |"
echo "|---|---|---|---|---|---|---|---|"
gh api "$R/pulls?state=open&base=develop&per_page=100" --jq '.[]|select(.draft==false)|"\(.number) \(.head.sha) \(.draft)"' | sort -n | while read n sha draft; do
  ms=$(gh api $R/pulls/$n --jq .mergeable_state 2>/dev/null)
  if [ "$ms" = unknown ]; then sleep 3; ms=$(gh api $R/pulls/$n --jq .mergeable_state 2>/dev/null); fi
  c=$(ci $sha)
  revs=$(gh api "$R/issues/$n/comments?per_page=100" --jq "[.[]|.body|split(\"\n\")[0]|select(startswith(\"## Review \"))|select(contains(\"$sha\"))]" 2>/dev/null)
  a=$(jq -r 'map(select(startswith("## Review A")))|last // "-"|sub(".*: ";"")' <<<"$revs")
  b=$(jq -r 'map(select(startswith("## Review B")))|last // "-"|sub(".*: ";"")' <<<"$revs")
  ready=no
  if [ "$draft" = false ] && [ "$ms" = clean ] && [ "$c" = green ] && [[ "$a" == PASS* ]] && [[ "$b" == PASS* ]]; then ready=yes; fi
  echo "| #$n | \`${sha:0:12}\` | $draft | $ms | $c | $a | $b | $ready |"
done
echo
last=$(gh api "$R/actions/workflows/testflight.yml/runs?per_page=10" --jq '[.workflow_runs[]|select(.conclusion=="success")][0]|"\(.head_sha) \(.created_at)"')
lsha=${last% *}; lat=${last#* }
echo "## Merged into develop since the last successful build (run at \`$lsha\`, $lat)"
gh api "$R/pulls?state=closed&base=develop&sort=updated&direction=desc&per_page=100" --jq ".[]|select(.merged_at!=null and .merged_at > \"$lat\")|.number" | sort -n | sed 's/^/#/' | tr '\n' ' '
echo
echo
echo "Held by ruling, not merged: #521 (LEGAL-REQ-002), #644 (registered text, counsel). Sources of the rulings: Project docs \`claude/Karma-tonight-status-2026-11-08.md\`, \`infra/cto-rulings-2026-11-08*.md\`."
