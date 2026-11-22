#!/usr/bin/env bash
# One-time setup on a Mac. Builds whisper.cpp and downloads the models the
# experiments and the language gate use. Safe to re-run. Takes about 10 to
# 20 minutes.
#
# whisper.cpp is pinned to the version whisper.rn 0.7.4 bundles in the app
# (WHISPER_CPP_BUILD in apps/mobile/src/lib/models/catalog.ts), so the gate
# measures the decoder the phone runs. The gate checks the tag and every
# model file's SHA-256 against the app catalog before it trusts a result.
set -euo pipefail
cd "$(dirname "$0")"

WHISPER_CPP_TAG=v1.9.3

if ! command -v brew >/dev/null; then
  echo "Homebrew is required. Install it from https://brew.sh then re-run this script."
  exit 1
fi

brew install cmake ffmpeg

if [ ! -d whisper.cpp ]; then
  git clone --depth 1 --branch "$WHISPER_CPP_TAG" https://github.com/ggml-org/whisper.cpp whisper.cpp
elif [ "$(git -C whisper.cpp describe --tags --exact-match 2>/dev/null || true)" != "$WHISPER_CPP_TAG" ]; then
  echo "Moving whisper.cpp to $WHISPER_CPP_TAG (the version the app bundles)."
  git -C whisper.cpp fetch --depth 1 origin tag "$WHISPER_CPP_TAG"
  git -C whisper.cpp checkout -q "$WHISPER_CPP_TAG"
  rm -rf whisper.cpp/build
fi

cmake -S whisper.cpp -B whisper.cpp/build -DCMAKE_BUILD_TYPE=Release
# whisper-cli transcribes; whisper-vad-speech-segments runs the same Silero voice detector the app runs;
# whisper-quantize is for setup-hinglish.sh.
cmake --build whisper.cpp/build -j --config Release --target whisper-cli whisper-vad-speech-segments whisper-quantize

mkdir -p models
# base and small: quick comparisons. large-v3-turbo-q5_0: what the app ships for
# en, es, fr, pt, ar, zh (and hi until its own model is hosted). small-q5_1: the
# app's compact tier (phones under 4 GB).
for m in base small large-v3-turbo-q5_0 small-q5_1; do
  if [ ! -f "models/ggml-$m.bin" ]; then
    sh whisper.cpp/models/download-ggml-model.sh "$m" models
  fi
done
if [ ! -f models/ggml-silero-v6.2.0.bin ]; then
  sh whisper.cpp/models/download-vad-model.sh silero-v6.2.0 models
fi

mkdir -p recordings results reports
[ -f config.local.json ] || cp config.example.json config.local.json

echo
echo "Setup done."
echo "Next: put your recordings in experiments/recordings/ and edit experiments/config.local.json"
echo "Then run: npm run experiment          (compare models)"
echo "     or:  npm run gate -w @scribe/experiments -- --language en   (the language gate, README section 7)"
