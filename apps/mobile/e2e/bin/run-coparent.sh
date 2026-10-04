#!/usr/bin/env bash
# E2E-13: the co-parent invite round trip on two simulators (macOS only).
#
#   apps/mobile/e2e/bin/run-coparent.sh <UDID_A> <UDID_B> [--app path/to/App.app]
#
# A is Mama (makes the invite), B is Papa (a fresh install that joins).
# 1. E2E-13a on A: sign in, invite, share sheet "Copy" -> A's pasteboard.
# 2. Host: `xcrun simctl pbpaste A`, take the https://earlyletters.com/i/<token> URL.
# 3. E2E-13b on B with INVITE_URL: gate, "I was invited", paste, sign in, join.
# 4. E2E-13c on A: Papa is listed as a member, the pending invite is gone.
# Needs the e2e backend env (TESTID_REQUESTS.md section 5). The invite token is a
# bearer secret for a fictional test book; it is never printed in full.
set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
E2E="$(cd "$HERE/.." && pwd)"
A="${1:?usage: $0 <UDID_A> <UDID_B> [--app App.app]}"
B="${2:?usage: $0 <UDID_A> <UDID_B> [--app App.app]}"
shift 2
APP=""
if [[ "${1:-}" == "--app" ]]; then APP="$2"; fi
APP_ID="${APP_ID:-com.earlyletters.scribe.preview}"
OUT="${OUT:-$HOME/.maestro/scribe-e2e/coparent-$(date -u +%Y%m%dT%H%M%SZ)}"
RUN="${RUN_ID:-$(date -u +%H%M%S)}"
MAMA_EMAIL="${MAMA_EMAIL:-delivered+e2e13-mama-$RUN@resend.dev}"
PAPA_EMAIL="${PAPA_EMAIL:-delivered+e2e13-papa-$RUN@resend.dev}"
mkdir -p "$OUT"
[[ -n "${MAESTRO_E2E_SUPABASE_URL:-}" ]] || { echo "set the e2e backend env first" >&2; exit 2; }

if [[ -n "$APP" ]]; then
  xcrun simctl install "$A" "$APP"
  xcrun simctl install "$B" "$APP"
fi

xcrun simctl pbcopy "$A" </dev/null || true   # start from an empty pasteboard

maestro --udid "$A" test "$E2E/flows/E2E-13a-invite-create.yaml" \
  -e "APP_ID=$APP_ID" -e "MAMA_EMAIL=$MAMA_EMAIL" --test-output-dir "$OUT/13a"

SHARED="$(xcrun simctl pbpaste "$A")"
INVITE_URL="$(printf '%s' "$SHARED" | grep -Eo 'https://earlyletters\.com/i/[A-Za-z0-9_-]+' | head -n 1 || true)"
[[ -n "$INVITE_URL" ]] || { echo "FAIL: no invite link on simulator A's pasteboard" >&2; exit 1; }
echo "invite link copied (ends ${INVITE_URL: -4})"

maestro --udid "$B" test "$E2E/flows/E2E-13b-invite-accept.yaml" \
  -e "APP_ID=$APP_ID" -e "PAPA_EMAIL=$PAPA_EMAIL" -e "INVITE_URL=$INVITE_URL" --test-output-dir "$OUT/13b"

maestro --udid "$A" test "$E2E/flows/E2E-13c-invite-confirm.yaml" \
  -e "APP_ID=$APP_ID" --test-output-dir "$OUT/13c"

echo "PASS: E2E-13 (artifacts in $OUT)"
