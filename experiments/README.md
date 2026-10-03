# Speech experiment kit (Mac)

**Goal:** before building app screens, find out how well open speech models hear *your* family: your child's name, nicknames, Hindi words, and your accents. The architecture review found standard Whisper scores about 30% word error on Hindi-English mixed speech, so this is the most important test we can run. About one hour of your time in total.

Your recordings and results never leave your Mac and are never committed to git.

## 1. Set up (once, about 20 minutes, mostly waiting)
Open Terminal in the repo folder and run:
```bash
npm install
./experiments/setup.sh
```
This builds whisper.cpp and downloads three model sizes (about 1.5 GB in total).

## 2. Tell it your family words
Open `experiments/config.local.json` (created by setup) and edit:
- `childName`
- `dictionary`: every name and word you want spelled your way: your child's name and nicknames, Mumma, Papa, Nani, Dadi, your Hindi words. Leave `heardAs` empty for now.
- `phrases`: one line per recording, with exactly what you said in `expected`, including the "um"s if you said them.

## 3. Record (on your iPhone, Voice Memos)
Each of you, in your normal voice, the way you'd talk at bedtime:

| # | What to record | Why |
|---|---|---|
| 1 to 5 | Five short sentences with her name and nicknames, e.g. "Ashu walked to Mumma today." | Name accuracy |
| 6 to 10 | Five sentences mixing Hindi and English the way you really talk | Code-switching accuracy |
| 11 to 13 | Three 30 to 60 second "letters" to your child about today, unscripted, then type what you said into the config | Real-life accuracy and the cleaning |
| 14 | 30 seconds in her room with the white-noise machine on and **nobody talking** | Checks it never invents words |

Name files `01.m4a`, `02.m4a` and so on. AirDrop them to your Mac and put them in `experiments/recordings/`.

### Optional: two Hindi-English models
Standard Whisper struggles with Hindi-English mixed speech. Two open fine-tunes may do much better, and they write it differently: one puts Hindi in Devanagari, the other writes everything in Roman letters. To test them on recordings 6 to 10 (about 6 GB of downloads, needs python3):
```bash
./experiments/setup-hinglish.sh
```
Then add `"hinglish-trelis-q5_0"` and `"hinglish-oriserve-q5_0"` to `models` in `config.local.json`, and run once with `"language": "en"` and once with `"language": "auto"`. This script has not been run end to end yet; if it fails, send me the error. Why these two: `docs/adr/0012-open-models-transcription-and-grammar.md`.

## 4. Run
```bash
npm run experiment
```
Then open:
- `experiments/results/report.md`: accuracy per model, with PASS/FAIL against the bar (names at least 95% right; zero invented words in the silent clip).
- `experiments/results/review.md`: the "does this sound like me" sheet. Pick A or B for each recording before reading the key at the bottom.

## 5. Send me
Share `report.md` and your `review.md` choices (or paste the summary table). That decides: which model ships, whether we need a fine-tuned Hindi-English model, and whether any language model is needed at all for cleaning.

## 6. Optional: does a language model help the cleaning? (experiment 3)
The app cleans with rules only: dictionary spellings, fillers, accidental repeats, and now sentence capitals and a final period. A small language model could also fix false starts ("she was, she was so happy") and agreement ("she have" to "she has"). This step tests whether that is worth it, on the same transcripts.

```bash
npm run experiment:edits                                              # rules only, on fictional samples
npm run experiment:edits -- --transcripts experiments/results/transcripts.json   # your recordings (written by step 4)
npm run experiment:edits -- --transcripts experiments/results/transcripts.json \
  --model-url http://localhost:8080/v1 --model qwen3.5-2b               # rules vs rules + model
```
`--model-url` takes any OpenAI-compatible server. To keep everything on your Mac, run a local one, for example llama.cpp's `llama-server -m Qwen3.5-2B-Q4_K_M.gguf --port 8080` or Ollama (`--model-url http://localhost:11434/v1`). A hosted key, if you use one, goes in `EDIT_MODEL_API_KEY`; then your transcripts leave the Mac, so use the fictional samples or ask first.

The model is just a function the comparison is handed (`ModelCall` in `@scribe/core`), so no key or endpoint lives in the repo. Two more options make runs repeatable:
```bash
# keep the model's raw replies (they contain your transcript text; results/ is never committed)
npm run experiment:edits -- --transcripts experiments/results/transcripts.json \
  --model-url http://localhost:8080/v1 --model qwen3.5-2b --save-replies experiments/results/replies.json
# re-score those replies later (for example after an engine change) with no model running
npm run experiment:edits -- --transcripts experiments/results/transcripts.json --replay experiments/results/replies.json
```

Open `experiments/results/edits.md`. For each variant it shows:
- **Words changed:** share of your words removed or replaced (capitals and punctuation do not count). Lower is more faithful.
- **Repeats offered:** doubles the engine will not remove by itself because they are often meant ("so so proud", "my my", "in in the morning"). The engine returns them in `suggestions` for the review screen to offer as tap-to-remove (app wiring is separate work). Restarts such as "like a like a little hiccup" and "today you you held" are removed automatically; "I told you you were brave" and "what it was was magic" are always kept.
- **Verifier rejections:** edits the model proposed that the engine refused (added words, synonym swaps, too many changes). The model never gets a say over this.
- **Malformed model items / failures:** replies that were not valid edit JSON. Many of these means the model is a poor fit.
- **Word error after cleaning:** against what you said, when the transcript has it. The model earns its place only if this drops and you prefer its output.

Note: the engine discards every model edit in an entry if the model touches more than 15% of its words (minimum 3). On short entries a real false start plus one grammar fix can hit that limit; if the report shows many `change_ceiling_exceeded`, tell me, since that limit is meant to be tuned on exactly this data.

## Verified so far (Oct 1, 2026, on Linux)
Oct 2, 2026: `npm run experiment:edits` ran on the fictional samples, rules only and against a stub model server that returned a mix of valid edits, invented words and non-JSON. Every invented word was rejected and the non-JSON reply fell back to rules only.

The full pipeline ran end to end on whisper.cpp's sample speech: 0% word error with the `base` model. With voice detection on, 30 seconds of loud white noise produced nothing. With it off, Whisper wrote "(waves crashing)". The app always runs voice detection and strips such tags.
