#!/usr/bin/env bash
# Checks the ZIP that E2E-10 left in the app's Caches/exports on a simulator.
# macOS only (xcrun simctl, unzip, shasum, node for JSON).
#
#   bin/inspect-export.sh
#
# Env: UDID (default "booted"), APP_ID (default com.earlyletters.scribe.preview),
#      OUT (default a temp dir; never inside the repo).
# Proves C-REQ-017, LEGAL-REQ-034, DATA-REQ-050 and TC-17: the archive opens,
# holds README.txt, the schema, letters, data files, the PDF book and a manifest
# whose SHA-256 for every file matches, and manifest.sha256 matches the manifest.
# Layout from apps/mobile/src/lib/export (build.logic.ts, pack.ts, verify.ts).
set -euo pipefail

UDID="${UDID:-booted}"
APP_ID="${APP_ID:-com.earlyletters.scribe.preview}"
OUT="${OUT:-$(mktemp -d -t scribe-export)}"
fail() { echo "FAIL: $*" >&2; exit 1; }

DATA="$(xcrun simctl get_app_container "$UDID" "$APP_ID" data)" || fail "app not installed"
ZIP="$(find "$DATA/Library/Caches" -path '*exports*' -name '*.zip' -type f 2>/dev/null | sort | tail -n 1)"
[[ -n "$ZIP" ]] || fail "no export ZIP under $DATA/Library/Caches/exports"
echo "zip: $ZIP ($(du -h "$ZIP" | cut -f1))"

unzip -q -o "$ZIP" -d "$OUT" || fail "unzip could not open the archive"
cd "$OUT"
for f in README.txt manifest.json manifest.sha256 index.html schema/export-v1.schema.json; do
  [[ -f "$f" ]] || fail "missing $f"
done
ls data/*.json >/dev/null 2>&1 || fail "no data/*.json"
ls book/*.pdf >/dev/null 2>&1 || fail "no PDF book under book/"

# manifest.sha256 is "<sha256>  manifest.json"
want="$(cut -d' ' -f1 manifest.sha256)"
got="$(shasum -a 256 manifest.json | cut -d' ' -f1)"
[[ "$want" == "$got" ]] || fail "manifest.json hash does not match manifest.sha256"

# Every file listed in the manifest exists with its hash (manifest.files[].path, .sha256).
node -e '
  const fs = require("fs"); const crypto = require("crypto");
  const m = JSON.parse(fs.readFileSync("manifest.json", "utf8"));
  const files = m.files || [];
  if (!files.length) { console.error("manifest lists no files"); process.exit(1); }
  let bad = 0;
  for (const f of files) {
    if (!fs.existsSync(f.path)) { console.error("missing " + f.path); bad++; continue; }
    const h = crypto.createHash("sha256").update(fs.readFileSync(f.path)).digest("hex");
    if (f.sha256 && h !== f.sha256) { console.error("hash mismatch " + f.path); bad++; }
  }
  console.log("manifest files checked: " + files.length);
  process.exit(bad ? 1 : 0);
' || fail "manifest check failed"

# README uses CRLF so Notepad on Windows shows lines (build.logic.ts).
grep -q $'\r' README.txt || fail "README.txt has no CRLF line ends"
echo "PASS: export at $OUT"
