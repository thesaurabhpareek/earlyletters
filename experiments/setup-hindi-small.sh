#!/usr/bin/env bash
# OPTIONAL, after ./setup.sh. Builds the app's Hindi model file,
# speech-model.whisper-hindi-small-q5_1 (vasista22/whisper-hindi-small,
# Apache-2.0, quantized to q5_1), with the recipe recorded in
# docs/adr/0015-per-language-speech-models.md section 7, so the gate can
# evaluate it on your own Hindi recordings:
#
#   npm run gate -w @scribe/experiments -- --language hi --model speech-model.whisper-hindi-small-q5_1
#
# The gate checks the file's SHA-256 against the app catalog: a different
# file fails the report. The app does not download this model yet (it is
# not hosted), so the report calls it a candidate.
#
# Needs python 3.9 to 3.12 (torch 2.5.1; brew install python@3.12 if your
# python3 is newer) and about 3 GB of free disk while converting.
# Status: the recipe ran on 3 Oct 2026 (ADR 0015, Linux); this script wraps
# it and has not yet run on a Mac. If a step fails, send the error text
# (it holds no recordings or names).
set -euo pipefail
cd "$(dirname "$0")"

REVISION=fb4a24afc20c42906deed31c3689e4be31da41fe   # vasista22/whisper-hindi-small, pinned in the app catalog
OPENAI_WHISPER=86098128                               # mel filters and tokenizer files (ADR 0015)
OUT=models/ggml-whisper-hindi-small-q5_1.bin

[ -x whisper.cpp/build/bin/whisper-quantize ] || { echo "Run ./setup.sh first."; exit 1; }
[ "$(git -C whisper.cpp describe --tags --exact-match 2>/dev/null || true)" = v1.9.3 ] || { echo "whisper.cpp must be v1.9.3: run ./setup.sh again."; exit 1; }
if [ -f "$OUT" ]; then echo "$OUT exists."; shasum -a 256 "$OUT"; exit 0; fi

PY=$(command -v python3.12 || command -v python3.11 || command -v python3.10 || command -v python3 || true)
[ -n "$PY" ] || { echo "python3 is required (3.9 to 3.12)."; exit 1; }
"$PY" -m venv .venv-hindi
# shellcheck disable=SC1091
. .venv-hindi/bin/activate
pip install --quiet --upgrade pip
pip install --quiet torch==2.5.1 transformers==4.46.3 numpy || {
  echo "Could not install torch 2.5.1. It needs python 3.9 to 3.12: brew install python@3.12, then re-run."
  exit 1
}

# whisper.cpp's converter reads OpenAI's mel filters from this repo, at the commit ADR 0015 used.
[ -d openai-whisper ] || git clone -q https://github.com/openai/whisper openai-whisper
[ "$(git -C openai-whisper rev-parse --is-shallow-repository)" = false ] || git -C openai-whisper fetch -q --unshallow
git -C openai-whisper checkout -q "$OPENAI_WHISPER"

mkdir -p hf/hindi-small hf/hindi-small-ggml
for f in config.json pytorch_model.bin vocab.json merges.txt added_tokens.json normalizer.json special_tokens_map.json \
  tokenizer_config.json preprocessor_config.json generation_config.json; do
  [ -f "hf/hindi-small/$f" ] || curl -fL --retry 3 -o "hf/hindi-small/$f" "https://huggingface.co/vasista22/whisper-hindi-small/resolve/$REVISION/$f"
done

python3 whisper.cpp/models/convert-h5-to-ggml.py hf/hindi-small openai-whisper hf/hindi-small-ggml
whisper.cpp/build/bin/whisper-quantize hf/hindi-small-ggml/ggml-model.bin "$OUT" q5_1
shasum -a 256 "$OUT"

echo
echo "Wrote $OUT. The gate checks this hash against the app catalog before it trusts a result."
echo "Next: npm run gate -w @scribe/experiments -- --language hi --model speech-model.whisper-hindi-small-q5_1"
echo "You can delete experiments/hf/ and experiments/.venv-hindi/ afterwards to free space."
