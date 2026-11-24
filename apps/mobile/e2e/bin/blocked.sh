# Sourced by run-suite.sh, run-coparent.sh and run-p0-nightly.sh.
# blocked_reason <flow-name>  prints the ids the flow taps that not-in-app.txt
# still lists ("a, b, c ..."), or nothing when the flow can run. A flow with a
# reason is red by design (the app does not set the id yet), so the runners skip
# it and print the reason instead of failing. Needs node (lint-flows needs it too).
blocked_reason() {
  local dir; dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
  local ids
  ids="$(node "$dir/blocked-ids.mjs" "$dir/../flows/$1.yaml" 2>/dev/null | head -n 4 | paste -sd, - | sed 's/,/, /g')"
  [[ -z "$ids" ]] && return 0
  local n; n="$(node "$dir/blocked-ids.mjs" "$dir/../flows/$1.yaml" 2>/dev/null | wc -l | tr -d ' ')"
  if [[ "$n" -gt 4 ]]; then ids="$ids, and $((n - 4)) more"; fi
  printf '%s' "$ids"
}
