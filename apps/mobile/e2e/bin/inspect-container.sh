#!/usr/bin/env bash
# Looks inside the app's data container on a simulator after the 18+ gate flows
# (E2E-01a, E2E-01b). macOS only (xcrun simctl, sqlite3).
#
#   bin/inspect-container.sh gate-stopped   # after E2E-01a: a No and nothing else
#   bin/inspect-container.sh gate-passed    # after E2E-01b: a Yes boolean, no age, no date
#
# Env: UDID (default "booted"), APP_ID (default com.earlyletters.scribe.preview).
# Proves PRD-REQ-019 and D-026 on the device side: after No there is no child,
# letter, draft, recording or queued upload, and the only setting is the time of
# the No; after Yes the only gate value is a boolean.
set -euo pipefail

MODE="${1:-}"
UDID="${UDID:-booted}"
APP_ID="${APP_ID:-com.earlyletters.scribe.preview}"
fail() { echo "FAIL: $*" >&2; exit 1; }
[[ "$MODE" == "gate-stopped" || "$MODE" == "gate-passed" ]] || fail "usage: $0 gate-stopped|gate-passed"

DATA="$(xcrun simctl get_app_container "$UDID" "$APP_ID" data)" || fail "app $APP_ID not installed on $UDID"
# expo-sqlite keeps databases under Documents/SQLite (Assumption: default directory; found by name to be safe).
DB="$(find "$DATA" -name 'scribe.db' -type f 2>/dev/null | head -n 1)"
[[ -n "$DB" ]] || fail "scribe.db not found under $DATA"
echo "container: $DATA"
echo "database:  $DB"

count() { sqlite3 -readonly "$DB" "select count(*) from $1;" 2>/dev/null || echo "missing"; }
for t in children entries drafts orphan_audio sync_outbox; do
  n="$(count "$t")"
  if [[ "$MODE" == "gate-stopped" ]]; then
    [[ "$n" == "0" || "$n" == "missing" ]] || fail "table $t has $n rows after a No"
  fi
  echo "rows in $t: $n"
done

AUDIO="$(find "$DATA" \( -name '*.m4a' -o -name '*.caf' -o -name '*.wav' \) -type f 2>/dev/null | wc -l | tr -d ' ')"
echo "audio files: $AUDIO"
[[ "$AUDIO" == "0" ]] || fail "audio files exist in the container"

KEYS="$(sqlite3 -readonly "$DB" "select key from settings order by key;")"
echo "settings keys:"; echo "${KEYS:-(none)}" | sed 's/^/  /'

if [[ "$MODE" == "gate-stopped" ]]; then
  # D-026: after No, only the time of the No. Nothing else may be stored.
  OTHER="$(echo "$KEYS" | grep -v -x 'ageGate.stoppedAt' | grep -v '^$' || true)"
  [[ -z "$OTHER" ]] || fail "unexpected settings after a No: $OTHER"
  V="$(sqlite3 -readonly "$DB" "select value from settings where key='ageGate.stoppedAt';")"
  [[ "$V" =~ ^[0-9]{4}-[0-9]{2}-[0-9]{2}T ]] || fail "ageGate.stoppedAt is not an ISO time: $V"
  sqlite3 -readonly "$DB" "select key from settings where key='ageGate.passed';" | grep -q . && fail "ageGate.passed is set after a No"
else
  V="$(sqlite3 -readonly "$DB" "select value from settings where key='ageGate.passed';")"
  [[ "$V" == "1" ]] || fail "ageGate.passed is '$V', expected '1'"
  sqlite3 -readonly "$DB" "select key from settings where key='ageGate.stoppedAt';" | grep -q . && fail "ageGate.stoppedAt kept after Yes"
fi

# Nothing that looks like an age or a birth date anywhere in settings (the gate never stores one).
if sqlite3 -readonly "$DB" "select key||'='||value from settings;" | grep -i -E 'age[^G]|birth|dob|years' | grep -v '^ageGate\.' ; then
  fail "a settings row looks like an age or a birth date"
fi
echo "PASS: $MODE"
