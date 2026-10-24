#!/usr/bin/env bash
# Why an app stopped on an iOS simulator, printed into the CI job log (artifacts are kept too, but the log is
# what every reader can open). Used by .github/workflows/kill-harness.yml and .github/workflows/ios-compile.yml.
#
#   .github/scripts/sim-crash-report.sh <udid> <path/to/App.app> <out-dir> [main.jsbundle.map]
#
# Prints, each in a group: the first 60 lines of the app's own log, the lines that name an error, the whole
# uncaught exception with its JavaScript stack, that stack read back to file and line through the Hermes source
# map (metro-symbolicate), and a summary of any crash report. Writes the same into <out-dir>.
#
# What it can hold: the app's own log lines and stack frames. The app logs no letter text (CLAUDE.md privacy
# rules), and on CI the only data in the app is the fictional Asha's fixtures. Always exits 0.
#
# Every line that comes from the app, its log or a crash report is printed through `safe`, which breaks `::` and
# `##[` so no line can be read as a workflow command (a forged annotation, a mask, an environment file write).
set +e
udid="$1"; app="$2"; out="$3"; map="${4:-}"
safe() { sed -e 's/::/: :/g' -e 's/##\[/# #[/g'; }
mkdir -p "$out"
exe="$(plutil -extract CFBundleExecutable raw "$app/Info.plist" 2>/dev/null)"
# No app name means no app: never fall back to every crash report or every log line on the runner.
case "$exe" in
  '' | *[!A-Za-z0-9._-]*) echo "no app executable name in ${app}/Info.plist: nothing to report"; exit 0 ;;
esac
xcrun simctl spawn "$udid" log show --last 30m --style compact \
  --predicate "process == \"${exe}\" OR eventMessage CONTAINS \"e2eKillDrill\"" > "$out/app-log.txt" 2>&1

echo "::group::${exe}: the first 60 lines of its own log"
awk -v tag="${exe}[" 'index($0, tag) && n < 60 { print; n++ }' "$out/app-log.txt" | safe
echo "::endgroup::"

echo "::group::${exe}: lines that name an error"
grep -E -i 'exception|fatal|error|abort|crash|terminat' "$out/app-log.txt" | tail -n 80 | safe
echo "::endgroup::"

awk '/Terminating app due to uncaught exception/ { p = 1 } p && n < 200 { print; n++ }' "$out/app-log.txt" > "$out/exception.txt"
if [ -s "$out/exception.txt" ]; then
  echo "::group::the uncaught exception, whole"
  safe < "$out/exception.txt"
  echo "::endgroup::"
else
  echo "no uncaught exception in the app's log"
fi

# Hermes frames read name@1:<bytecode offset>; the composed source map turns each into file:line:name.
grep -oE '[^ :]+@[0-9]+:[0-9]+' "$out/exception.txt" | head -60 > "$out/frames.txt"
if [ -s "$out/frames.txt" ] && [ -n "$map" ] && [ -f "$map" ]; then
  npx --yes metro-symbolicate@0.84.5 "$map" < "$out/frames.txt" > "$out/frames-symbolicated.txt" 2>&1
  echo "::group::the JavaScript stack, symbolicated (frame, then source:line:name)"
  paste "$out/frames.txt" "$out/frames-symbolicated.txt" | safe
  echo "::endgroup::"
elif [ -s "$out/frames.txt" ]; then
  echo "no source map at '${map}': the frames above stay as bytecode offsets"
fi

find "$HOME/Library/Logs/DiagnosticReports" -name "${exe}*" -exec cp {} "$out/" \; 2>/dev/null
for f in "$out"/*.ips; do
  [ -f "$f" ] || continue
  echo "::group::crash report $(basename "$f" | safe)"
  node -e '
    const t = require("fs").readFileSync(process.argv[1], "utf8");
    const r = JSON.parse(t.slice(t.indexOf("\n") + 1));
    console.log(JSON.stringify({ exception: r.exception, termination: r.termination, asi: r.asi }, null, 1));
    const th = (r.threads || [])[r.faultingThread] || {};
    for (const f of (th.frames || []).slice(0, 30)) console.log(" ", (r.usedImages[f.imageIndex] || {}).name, f.symbol || "", f.imageOffset);
    for (const f of (r.lastExceptionBacktrace || []).slice(0, 30)) console.log("  last exception:", (r.usedImages[f.imageIndex] || {}).name, f.symbol || "");
  ' "$f" 2>&1 | safe
  echo "::endgroup::"
done
exit 0
