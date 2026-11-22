#!/usr/bin/env bash
# Checks the ZIP that E2E-10 (or E2E-17a, E2E-17b) left in the app's
# Caches/exports on a simulator.
# macOS only (xcrun simctl, unzip, shasum, node for JSON).
#
#   bin/inspect-export.sh [--originals]
#
# Env: UDID (default "booted"), APP_ID (default com.earlyletters.scribe.dev),
#      OUT (default a temp dir; never inside the repo).
# Proves C-REQ-017, LEGAL-REQ-034, DATA-REQ-050 and TC-17: the archive opens,
# holds README.txt, the schema, letters, data files, the PDF book and a manifest
# whose SHA-256 for every file matches, and manifest.sha256 matches the manifest.
# Layout from apps/mobile/src/lib/export (build.logic.ts, pack.ts, verify.ts).
#
# --originals (E2E-17a, E2E-17b; F15-REQ-001, F15-REQ-002) also checks:
#   - at least MIN_AUDIO (default 1) letters carry audio, so the check cannot
#     pass on an export with no recordings;
#   - every audio/<id>.m4a (audio/mp4) or audio/<id>.aac (audio/aac, ADR 0027)
#     exists, its path and media type agree, its SHA-256 equals the hash recorded
#     at capture (data/entries.json `audio.recorded_sha256`) and `integrity` is ok;
#   - no path in the ZIP names the listening folder, and no file in the ZIP has
#     the bytes of any listening copy in the app's Application Support/listening;
#   - with REQUIRE_LISTENING=1, that folder holds at least one copy (the seed
#     made them), so "no copy in the ZIP" is a real result;
#   - writes the sorted "<sha256> <path>" audio list to $OUT/audio-hashes.txt;
#     with COMPARE_WITH=<an earlier audio-hashes.txt>, the two lists are equal.
set -euo pipefail

ORIGINALS=0
for arg in "$@"; do
  case "$arg" in
    --originals) ORIGINALS=1 ;;
    *) echo "unknown argument $arg" >&2; exit 2 ;;
  esac
done

UDID="${UDID:-booted}"
APP_ID="${APP_ID:-com.earlyletters.scribe.dev}"
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

if [[ $ORIGINALS -eq 1 ]]; then
  # The listening copies on the simulator (ScribeAudioModule.swift listeningDirectory).
  LISTEN_DIR="$DATA/Library/Application Support/listening"
  LISTEN_HASHES="$OUT/.listening-hashes.txt"
  : >"$LISTEN_HASHES"
  if [[ -d "$LISTEN_DIR" ]]; then
    find "$LISTEN_DIR" -type f -name '*.m4a' -print0 | while IFS= read -r -d '' f; do
      shasum -a 256 "$f" | cut -d' ' -f1 >>"$LISTEN_HASHES"
    done
  fi
  copies="$(wc -l <"$LISTEN_HASHES" | tr -d ' ')"
  echo "listening copies on the simulator: $copies"
  if [[ "${REQUIRE_LISTENING:-0}" == "1" && "$copies" -lt 1 ]]; then
    fail "no listening copy on the simulator: the seed did not make one, so this run proves nothing"
  fi

  MIN_AUDIO="${MIN_AUDIO:-1}" LISTEN_HASHES="$LISTEN_HASHES" COMPARE_WITH="${COMPARE_WITH:-}" node -e '
    const fs = require("fs"); const crypto = require("crypto"); const path = require("path");
    const sha = (p) => crypto.createHash("sha256").update(fs.readFileSync(p)).digest("hex");
    const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]);
    let bad = 0; const no = (m) => { console.error(m); bad++; };
    const entries = JSON.parse(fs.readFileSync("data/entries.json", "utf8")).entries || [];
    const withAudio = entries.filter((e) => e.audio);
    const min = Number(process.env.MIN_AUDIO);
    if (withAudio.length < min) no(`only ${withAudio.length} letters carry audio; expected at least ${min}`);
    const lines = [];
    for (const e of withAudio) {
      const a = e.audio;
      if (!/^audio\/[^/]+\.(m4a|aac)$/.test(a.path)) no(`audio path not under audio/ as .m4a or .aac: ${a.path}`);
      const label = a.path.endsWith(".aac") ? "audio/aac" : "audio/mp4";
      if (a.media_type !== label) no(`${a.path} is labelled ${a.media_type}; expected ${label}`);
      if (!fs.existsSync(a.path)) { no(`missing ${a.path}`); continue; }
      const h = sha(a.path);
      if (!a.recorded_sha256) no(`no recorded hash for ${a.path}: cannot prove the original is unaltered`);
      else if (h !== a.recorded_sha256) no(`original changed: ${a.path} hashes differently from its capture hash`);
      if (a.integrity !== "ok") no(`integrity is ${a.integrity} for ${a.path}`);
      lines.push(`${h} ${a.path}`);
    }
    const files = walk(".").map((p) => path.relative(".", p)).filter((p) => !p.startsWith(".listening-hashes") && p !== "audio-hashes.txt");
    for (const p of files) if (/listening/i.test(p)) no(`a listening path is in the ZIP: ${p}`);
    const copies = new Set(fs.readFileSync(process.env.LISTEN_HASHES, "utf8").split("\n").filter(Boolean));
    for (const p of files) if (copies.has(sha(p))) no(`a listening copy is in the ZIP as ${p}`);
    lines.sort();
    fs.writeFileSync("audio-hashes.txt", lines.join("\n") + "\n");
    if (process.env.COMPARE_WITH) {
      const before = fs.readFileSync(process.env.COMPARE_WITH, "utf8");
      if (before !== lines.join("\n") + "\n") no("audio differs from the earlier export (COMPARE_WITH)");
    }
    console.log(`originals checked: ${withAudio.length}; listening copies excluded: ${copies.size}`);
    process.exit(bad ? 1 : 0);
  ' || fail "originals check failed"
fi
echo "PASS: export at $OUT"
