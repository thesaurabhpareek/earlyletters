#!/usr/bin/env bash
# Builds docs/release/journey/Early-Letters-iOS-Journey.pdf from steps, screens and critiques.
# The PDF is generated output (gitignored, like screens/): ship it with pack-journey.sh, never commit it.
# Run after the flows with JOURNEY_SHOTS=1 (the screenshots must exist locally).
# Needs: ImageMagick (convert), python3 with `markdown`, Chromium (CHROMIUM env or /opt/pw-browsers/chromium).
set -euo pipefail
J="$(cd "$(dirname "$0")/../../../.." && pwd)/docs/release/journey"
T="$(mktemp -d)"
for f in "$J"/screens/J*.png; do case "$f" in *-full.png) continue;; esac; b="$(basename "$f" .png)"; convert "$f" -resize 560x -quality 80 "$T/$b.jpg"; done
python3 "$(dirname "$0")/build-pdf.py" "$J" "$J/Early-Letters-iOS-Journey.pdf" "$T"
rm -f "$J/Early-Letters-iOS-Journey.pdf.html"; rm -rf "$T"
