#!/usr/bin/env bash
# Packs the journey record into one zip: README.md, INDEX.md, steps/*.json, critiques/, screens/*.png and the PDF.
# The screens and the PDF are generated output (gitignored); this zip is how they travel: a CI workflow artifact
# (docs/ops/proposed/journey-artifact-ci.md) or a file handed to a reviewer. Run after the flows and the builders:
#   npm run e2e:web:journey -w @scribe/mobile     flows, steps and screenshots (JOURNEY_SHOTS=1)
#   npm run e2e:web:index -w @scribe/mobile       INDEX.md from steps/
#   apps/mobile/e2e-web/support/build-pdf.sh      the PDF (optional: packed when present)
#   npm run e2e:web:pack -w @scribe/mobile [-- out.zip]
# Default output: apps/mobile/e2e-web/.results/journey-<short sha>.zip (the .results folder is gitignored).
# Needs: zip. Prints the zip path and what went in. Exits 1 when there are no steps at all.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../../../.." && pwd)"
J="$ROOT/docs/release/journey"
SHA="$(git -C "$ROOT" rev-parse --short HEAD 2>/dev/null || echo local)"
OUT="${1:-$ROOT/apps/mobile/e2e-web/.results/journey-$SHA.zip}"
case "$OUT" in /*) ;; *) OUT="$PWD/$OUT" ;; esac

[ -d "$J/steps" ] || { echo "pack-journey: no steps in $J; run the flows first" >&2; exit 1; }
steps="$(find "$J/steps" -name '*.json' | wc -l | tr -d ' ')"
shots=0; [ -d "$J/screens" ] && shots="$(find "$J/screens" -name '*.png' | wc -l | tr -d ' ')"
pdf=no; [ -f "$J/Early-Letters-iOS-Journey.pdf" ] && pdf=yes
[ "$steps" -gt 0 ] || { echo "pack-journey: steps/ is empty; run the flows first" >&2; exit 1; }
[ "$shots" -gt 0 ] || echo "pack-journey: no screenshots (run the flows with JOURNEY_SHOTS=1 to include them)" >&2

mkdir -p "$(dirname "$OUT")"
rm -f "$OUT"
# Zip from the parent so the archive unpacks as journey/...; dotfiles and editor leftovers stay out.
( cd "$J/.." && zip -q -r -X "$OUT" journey -x 'journey/.*' 'journey/*/.*' '*.html' )
echo "pack-journey: $OUT ($steps steps, $shots screenshots, pdf=$pdf, $(du -h "$OUT" | cut -f1))"
