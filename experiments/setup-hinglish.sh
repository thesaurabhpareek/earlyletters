#!/usr/bin/env bash
# OPTIONAL, after ./setup.sh. Converts two open Hindi-English Whisper
# fine-tunes (both Apache 2.0, both Whisper large-v3 size) to whisper.cpp
# format so `npm run experiment` can compare them with large-v3-turbo on your
# recordings 6 to 10. See docs/adr/0012-open-models-transcription-and-grammar.md.
#
#   Trelis/whisper-hinglish-preview          Hindi in Devanagari, English in Latin
#   Oriserve/Whisper-Hindi2Hinglish-Prime    everything in Roman letters
#
# Needs python3 and about 15 GB of free disk while converting (6 GB downloads).
# Status: written Oct 2 2026 against whisper.cpp's documented conversion
# script, NOT yet run end to end. If a step fails, send the error text.
set -euo pipefail
cd "$(dirname "$0")"

[ -d whisper.cpp/build ] || { echo "Run ./setup.sh first."; exit 1; }
command -v python3 >/dev/null || { echo "python3 is required."; exit 1; }

python3 -m venv .venv-hinglish
# shellcheck disable=SC1091
. .venv-hinglish/bin/activate
pip install --quiet --upgrade pip
pip install --quiet torch transformers huggingface_hub numpy

# whisper.cpp's converter needs OpenAI's original repo for the mel filters and tokenizer files.
[ -d openai-whisper ] || git clone --depth 1 https://github.com/openai/whisper openai-whisper

QUANTIZE=whisper.cpp/build/bin/whisper-quantize
[ -x "$QUANTIZE" ] || QUANTIZE=whisper.cpp/build/bin/quantize

convert() {
  local repo="$1" name="$2"
  local out="models/ggml-$name.bin"
  if [ -f "$out" ]; then echo "$out exists, skipping"; return; fi
  python3 -c "from huggingface_hub import snapshot_download as d; d('$repo', local_dir='hf/$name')"
  mkdir -p "hf/$name-ggml"
  python3 whisper.cpp/models/convert-h5-to-ggml.py "hf/$name" openai-whisper "hf/$name-ggml"
  "$QUANTIZE" "hf/$name-ggml/ggml-model.bin" "$out" q5_0
  echo "Wrote $out"
}

mkdir -p models hf
convert Trelis/whisper-hinglish-preview hinglish-trelis-q5_0
convert Oriserve/Whisper-Hindi2Hinglish-Prime hinglish-oriserve-q5_0

echo
echo "Done. Add \"hinglish-trelis-q5_0\" and \"hinglish-oriserve-q5_0\" to \"models\" in config.local.json,"
echo "and run once with \"language\": \"en\" and once with \"language\": \"auto\"."
echo "You can delete experiments/hf/ afterwards to free disk space."
