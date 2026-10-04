#!/usr/bin/env bash
# Sets the simulator's Dynamic Type size for E2E-15 (and back afterwards).
#
#   bin/a11y-sizes.sh ax5       # accessibility-extra-extra-extra-large (AX5)
#   bin/a11y-sizes.sh default   # large (the iOS default)
#
# Env: UDID (default "booted"). Uses `xcrun simctl ui <device> content_size
# <size>` (Assumption: available in Xcode 26; run `xcrun simctl ui` to list the
# sizes your Xcode accepts). The app must be relaunched to pick the size up,
# which E2E-15 does with launch-fresh.
set -euo pipefail
UDID="${UDID:-booted}"
case "${1:-}" in
  ax5) SIZE="accessibility-extra-extra-extra-large" ;;
  default) SIZE="large" ;;
  *) echo "usage: $0 ax5|default" >&2; exit 2 ;;
esac
xcrun simctl ui "$UDID" content_size "$SIZE"
echo "content size: $SIZE"
