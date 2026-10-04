#!/usr/bin/env bash
# Runs the single-simulator Maestro suite in order, with the host-side checks
# between flows (container and export inspection, text size for E2E-15).
# macOS only. See ../README.md section 4.
#
#   apps/mobile/e2e/bin/run-suite.sh [--udid <UDID>] [--app <path/to/App.app>] [--only E2E-05] [--junit]
#
# Env:
#   APP_ID   bundle id of the e2e build (default com.earlyletters.scribe.preview)
#   OUT      artifact folder (default ~/.maestro/scribe-e2e/<UTC time>; never inside the repo)
#   MAESTRO_E2E_SUPABASE_URL, MAESTRO_E2E_PROJECT_REF, MAESTRO_E2E_SERVICE_KEY
#            e2e backend (TESTID_REQUESTS.md section 5). Without them, flows
#            tagged needs-backend are skipped and reported as skipped.
#   E2E_SKIP_NETWORK=1  skip flows tagged needs-network (E2E-05 part 1).
set -uo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
E2E="$(cd "$HERE/.." && pwd)"
APP_ID="${APP_ID:-com.earlyletters.scribe.preview}"
UDID="booted"
APP=""
ONLY=""
JUNIT=0
while [[ $# -gt 0 ]]; do
  case "$1" in
    --udid) UDID="$2"; shift 2 ;;
    --app) APP="$2"; shift 2 ;;
    --only) ONLY="$2"; shift 2 ;;
    --junit) JUNIT=1; shift ;;
    *) echo "unknown argument $1" >&2; exit 2 ;;
  esac
done
OUT="${OUT:-$HOME/.maestro/scribe-e2e/$(date -u +%Y%m%dT%H%M%SZ)}"
mkdir -p "$OUT"
export UDID APP_ID

command -v maestro >/dev/null || { echo "maestro CLI not found (README section 2)" >&2; exit 2; }
if [[ -n "$APP" ]]; then
  xcrun simctl install "$UDID" "$APP" || { echo "install failed" >&2; exit 2; }
fi

# Order matters: 01a and 01b share one install; host checks run between flows.
FLOWS=(
  E2E-01a-age-gate-no
  E2E-01b-age-gate-yes
  E2E-02-first-run-twins
  E2E-03-speak-save-offline
  E2E-04-type-a-letter
  E2E-05-language-hindi-packs
  E2E-06-read-together-plus-gate
  E2E-07-add-child-plus-gate
  E2E-08-delete-and-undo
  E2E-09-account-deletion
  E2E-10-export
  E2E-11-analytics-consent
  E2E-12-sign-in-email
  E2E-15-voiceover-smoke
)

declare -a RESULTS=()
FAILED=0

has_tag() { grep -q -E "^  - $2\$" "$E2E/flows/$1.yaml"; }

run_flow() {
  local name="$1"
  local args=()
  # Maestro wants a real device id; "booted" is a simctl alias only.
  if [[ "$UDID" != "booted" ]]; then args+=(--udid "$UDID"); fi
  args+=(test "$E2E/flows/$name.yaml" -e "APP_ID=$APP_ID" --test-output-dir "$OUT/$name")
  if [[ $JUNIT -eq 1 ]]; then args+=(--format JUNIT --output "$OUT/$name.junit.xml"); fi
  echo "=== $name"
  if maestro "${args[@]}"; then return 0; else return 1; fi
}

host_check() {
  local label="$1"; shift
  echo "--- host check: $label"
  if "$@" >"$OUT/$label.log" 2>&1; then cat "$OUT/$label.log"; return 0; fi
  cat "$OUT/$label.log"; return 1
}

for name in "${FLOWS[@]}"; do
  if [[ -n "$ONLY" && "$name" != "$ONLY"* ]]; then continue; fi
  if has_tag "$name" needs-backend && [[ -z "${MAESTRO_E2E_SUPABASE_URL:-}" ]]; then
    RESULTS+=("SKIP $name (needs the e2e backend)"); continue
  fi
  if has_tag "$name" needs-network && [[ "${E2E_SKIP_NETWORK:-0}" == "1" ]]; then
    RESULTS+=("SKIP $name (needs network)"); continue
  fi
  if [[ "$name" == E2E-15* ]]; then "$HERE/a11y-sizes.sh" ax5 >/dev/null; fi

  ok=1
  run_flow "$name" || ok=0
  case "$name" in
    E2E-01a*) host_check "$name-container" "$HERE/inspect-container.sh" gate-stopped || ok=0 ;;
    E2E-01b*) host_check "$name-container" "$HERE/inspect-container.sh" gate-passed || ok=0 ;;
    E2E-10*) host_check "$name-zip" env OUT="$OUT/$name-zip" "$HERE/inspect-export.sh" || ok=0 ;;
  esac
  if [[ "$name" == E2E-15* ]]; then "$HERE/a11y-sizes.sh" default >/dev/null; fi

  if [[ $ok -eq 1 ]]; then RESULTS+=("PASS $name"); else RESULTS+=("FAIL $name"); FAILED=1; fi
done

echo
echo "Results (artifacts in $OUT):"
# macOS /bin/bash is 3.2: an empty array under set -u needs the +"" guard.
printf '  %s\n' ${RESULTS[@]+"${RESULTS[@]}"}
exit $FAILED
