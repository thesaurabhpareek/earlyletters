#!/usr/bin/env bash
# The nightly run of the five P0 flows (PRD V2 08 section 3.3 S19; R5 EQ-10):
# E2E-01 (01a then 01b, which runs on 01a's install), E2E-03, E2E-12, E2E-13
# (two simulators) and E2E-17 (17a then 17b). Every flow in the set carries the
# tag `p0-nightly`; bin/lint-flows.mjs fails if one of the five loses it.
# macOS only. Callable from CI: the workflow line is a request to S20.
#
#   apps/mobile/e2e/bin/run-p0-nightly.sh --udid-a <UDID> [--udid-b <UDID>] [--app <path/to/App.app>] [--junit]
#
# Without --udid-b, or without the e2e backend env (MAESTRO_E2E_SUPABASE_URL,
# TESTID_REQUESTS.md section 5), E2E-12 and E2E-13 are reported as skipped and
# the exit code says so: 0 all ran and passed, 1 a flow failed, 3 nothing failed
# but a P0 flow was skipped (a nightly with a skip is not a green nightly).
# Artifacts go to $OUT (default ~/.maestro/scribe-e2e/p0-<UTC time>), never the repo.
set -uo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
A=""
B=""
APP=""
JUNIT=()
while [[ $# -gt 0 ]]; do
  case "$1" in
    --udid-a) A="$2"; shift 2 ;;
    --udid-b) B="$2"; shift 2 ;;
    --app) APP="$2"; shift 2 ;;
    --junit) JUNIT=(--junit); shift ;;
    *) echo "unknown argument $1" >&2; exit 2 ;;
  esac
done
[[ -n "$A" ]] || { echo "usage: $0 --udid-a <UDID> [--udid-b <UDID>] [--app App.app] [--junit]" >&2; exit 2; }
export OUT="${OUT:-$HOME/.maestro/scribe-e2e/p0-$(date -u +%Y%m%dT%H%M%SZ)}"
mkdir -p "$OUT"

SKIPPED=0
FAILED=0

APP_ARGS=()
if [[ -n "$APP" ]]; then APP_ARGS=(--app "$APP"); fi

# One simulator: E2E-01a, 01b, 03, 17a, 17b and (with the backend) 12.
OUT="$OUT/single" "$HERE/run-suite.sh" --udid "$A" --tag p0-nightly ${APP_ARGS[@]+"${APP_ARGS[@]}"} ${JUNIT[@]+"${JUNIT[@]}"} | tee "$OUT/single.log"
status=${PIPESTATUS[0]}
[[ $status -eq 0 ]] || FAILED=1
grep -q '^  SKIP ' "$OUT/single.log" && SKIPPED=1

# Two simulators: E2E-13a, 13b, 13c.
if [[ -n "$B" && -n "${MAESTRO_E2E_SUPABASE_URL:-}" ]]; then
  OUT="$OUT/coparent" "$HERE/run-coparent.sh" "$A" "$B" ${APP_ARGS[@]+"${APP_ARGS[@]}"} || FAILED=1
else
  echo "SKIP E2E-13 (needs --udid-b and the e2e backend)"
  SKIPPED=1
fi

if [[ $FAILED -eq 1 ]]; then echo "P0 nightly: FAIL (artifacts in $OUT)"; exit 1; fi
if [[ $SKIPPED -eq 1 ]]; then echo "P0 nightly: no failure, but a P0 flow was skipped (artifacts in $OUT)"; exit 3; fi
echo "P0 nightly: PASS (artifacts in $OUT)"
