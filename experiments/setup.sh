#!/usr/bin/env bash
# One-time setup on a Mac. Builds whisper.cpp and downloads the models the
# experiments compare. Safe to re-run. Takes about 10 to 20 minutes.
set -euo pipefail
cd "$(dirname "$0")"

if ! command -v brew >/dev/null; then
  echo "Homebrew is required. Install it from https://brew.sh then re-run this script."
  exit 1
fi

brew install cmake ffmpeg

if [ ! -d whisper.cpp ]; then
  git clone --depth 1 https://github.com/ggml-org/whisper.cpp whisper.cpp
fi

cmake -S whisper.cpp -B whisper.cpp/build -DCMAKE_BUILD_TYPE=Release
cmake --build whisper.cpp/build -j --config Release

mkdir -p models
# Three sizes: small and fast, balanced, large and accurate. Multilingual on
# purpose: English-only models may mangle Hindi words.
for m in base small large-v3-turbo-q5_0; do
  if [ ! -f "models/ggml-$m.bin" ]; then
    sh whisper.cpp/models/download-ggml-model.sh "$m" models
  fi
done
if [ ! -f models/ggml-silero-v6.2.0.bin ]; then
  sh whisper.cpp/models/download-vad-model.sh silero-v6.2.0 models
fi

mkdir -p recordings results
[ -f config.local.json ] || cp config.example.json config.local.json

echo
echo "Setup done."
echo "Next: put your recordings in experiments/recordings/ and edit experiments/config.local.json"
echo "Then run: npm run experiment"
