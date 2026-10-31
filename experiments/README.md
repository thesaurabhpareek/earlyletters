# Speech experiment kit (Mac)

**Goal:** before building app screens, find out how well open speech models hear *your* family: your child's name, nicknames, Hindi words, and your accents. The architecture review found standard Whisper scores about 30% word error on Hindi-English mixed speech, so this is the most important test we can run. About one hour of your time in total.

Your recordings and results never leave your Mac and are never committed to git.

## 1. Set up (once, about 20 minutes, mostly waiting)
Open Terminal in the repo folder and run:
```bash
npm install
./experiments/setup.sh
```
This builds whisper.cpp at v1.9.3 (the version the app bundles) and downloads four models and the voice detector (about 1.4 GB in total): base and small for quick comparisons, large-v3-turbo-q5_0 (what the app ships) and small-q5_1 (the app's model for phones under 4 GB).

## 2. Tell it your family words
Open `experiments/config.local.json` (created by setup) and edit:
- `childName`
- `dictionary`: every name and word you want spelled your way: your child's name and nicknames, Mumma, Papa, Nani, Dadi, your Hindi words. Leave `heardAs` empty for now.
- `phrases`: one line per recording, with exactly what you said in `expected`, including the "um"s if you said them. A phrase in another language says so with `"language": "hi"` (or es, zh, fr, ar, pt); the default is the top-level `language`.

## 3. Record (on your iPhone, Voice Memos)
Each of you, in your normal voice, the way you'd talk at bedtime:

| # | What to record | Why |
|---|---|---|
| 1 to 5 | Five short sentences with your child's name and nicknames, e.g. "Ashu walked to Mumma today." | Name accuracy |
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

## 7. The language gate (F05 section 7.1, before each language ships)

The gate answers one question per language: is the app's on-device transcription good enough to keep, on what the app actually ships? It runs your recordings through the app's own code (the same voice detector settings, 28-second chunks, name prompt and clean-up as the phone: `apps/mobile/src/lib/transcribe-run.ts`) with the shipped model, then checks the bars in `docs/prd/v2/features/F05-transcription.md` (on the `docs/prd-v2` branch, PR #124, until it merges) section 7.1: word error after cleaning (character error for Mandarin), names spelled your way, zero words invented on silence, script and punctuation rules, the sample size, the engine's safety checks, the pack sign-off, and the speed and memory numbers from the iPhone. It writes a report; **which languages ship is your decision** (FT-34). A pass is evidence, not a go.

### 7.0 Before you run a language other than English: the native-speaker sign-off
Do the native review first. Today every non-English language pack is a draft, so its report always shows `pack_signoff` open (F05-REQ-005), whatever the accuracy. The order:
1. A native speaker reviews the pack's filler, repeat and punctuation tables in `packs/text-rules/<lang>.json`.
2. Those tables are marked `native-reviewed` and the pack version is raised (a pull request).
3. Write `docs/qa/evidence/F05-pack-<lang>-<version>.md` with a `Reviewer role:` line (a role, never a name) and a `Date: YYYY-MM-DD` line.
4. Then run the gate for that language.

Editing the pack after a gate makes that gate stale (`--check` says so), so run the gate after the sign-off, not before. English is the bundled, already reviewed pack and needs none of this. A run before the sign-off still shows indicative accuracy; it just cannot pass.

### 7.1 What to record per language (F05 7.1 sample design)
- 10 adult native speakers, each with written consent naming this use. Arabic: 3 dialect groups of 4 speakers. Portuguese: 5 Brazilian and 5 European.
- Per speaker: 3 scripted letters of about 2 minutes about the fictional child Asha (the child's name, a nickname, two family names in each), 1 unscripted letter of about 1 minute, 1 whispered clip, 1 clip of normal speech over a white-noise machine. Bedtime conditions, on an iPhone.
- Per language: 5 clips with nobody talking (white-noise machine, fan, a quiet room).
- About 40 clips and 80 minutes per language. Keep them in a private place, never in git (`experiments/recordings/` is git-ignored).

A smaller set (just the two of you) still runs and shows indicative numbers; the report then says plainly that the sample is too small.

In `config.local.json`, give each phrase its `language`, `speaker` (any label; the report only ever shows S01, S02), `kind` (`scripted`, `unscripted`, `whisper`, `white_noise`, `noise`, and, reported but never gating, `code_switched` and `wrong_language`) and, for Arabic and Portuguese, `group` (`pt-BR`, `pt-PT`, or the dialect group). For Mandarin, `"scripts": { "zh": "Hans" }` or `"Hant"`.

### 7.2 Run it
```bash
npm run gate -w @scribe/experiments -- --language en                  # phones with 4 GB or more
npm run gate -w @scribe/experiments -- --language en --tier compact   # phones under 4 GB (small model)
npm run gate -w @scribe/experiments -- --language hi --replay         # re-clean the stored words after an engine or pack change, no re-decoding
```
- Speed and memory are measured on the iPhone, never on the Mac. After the device runs (DEVICE_TEST_PLAN S1-17: 30 two-minute letters on the SE 3), copy `experiments/device.example.json` to `experiments/device.local.json`, add one row per run, and pass `--device experiments/device.local.json`.
- Add `--evidence` when you want the numbers recorded: it writes `docs/qa/evidence/F05-gate-<lang>.md` (numbers, versions and codes only; no recording, words, names or speakers). Write your decision in its "Founder decision" lines; the tool never touches them.
- `--model <id>` evaluates a candidate from the app catalog; the report then says a pass cannot ship that language. For Hindi, the app's own Hindi model is not downloaded by `setup.sh`: build it once with `./experiments/setup-hindi-small.sh` (the ADR 0015 section 7 recipe: about 3 GB of downloads, python 3.9 to 3.12), then run `npm run gate -w @scribe/experiments -- --language hi --model speech-model.whisper-hindi-small-q5_1`. Without that file the gate stops with "Missing .../ggml-whisper-hindi-small-q5_1.bin". Its training data still needs counsel's view before it can ship (F05 Q12).

What you get:
- `experiments/reports/gate-<lang>-<tier>.json`: every check with its value, bar and status (git-ignored).
- `experiments/results/gate/<lang>-<tier>/clips.md`: each clip with what you said, what was heard and what was kept. **Private**: read it to see the mistakes; it is git-ignored and never leaves the Mac.
- Exit code 0 when every check passes, 2 when not, 1 when the run itself failed. On 2, npm also prints a "Lifecycle script `gate` failed" line: that is the gate's answer, not a crash.
- If a tool fails, the message names the tool and its exit status only, never your words or names. `--debug` prints the full message for you; do not paste that one anywhere.

### 7.3 Keeping gates current
`npm run gate -w @scribe/experiments -- --check` (any computer, no audio) compares every recorded gate with the code today. A gate is stale once the model file, the language pack, the prompt, the voice detector settings, the chunk planner, the clean-up or the engine version has changed (F05-REQ-006); run that language again before its pack or model is published.

### 7.4 What the gate checks, and what it cannot
- It runs whisper.cpp on the Mac with the phone's settings, not the phone itself: accuracy carries over; speed, memory and heat do not, so those come from the device rows.
- The model and voice detector files are checked byte for byte (SHA-256) against the app catalog, and whisper.cpp must be v1.9.3. A different file or version fails the report.
- Engine safety (F05-REQ-004) is checked live: edits that would change a daughter to a son in Hindi, a feminine "you" to a masculine one in Arabic, or a statement to a question must all be refused.
- A non-English language also needs a native speaker's sign-off of its pack tables (F05-REQ-005): `docs/qa/evidence/F05-pack-<lang>-<version>.md` with a `Reviewer role:` and a `Date:` line, and the pack's filler, repeat and punctuation tables marked native-reviewed.

## 8. ADTS decode parity and playback (ADR 0027 checks V3 and V4)
ADR 0027 records iOS takes as ADTS (`.aac`) in every iOS build cut from develop from the 27 Oct flip on, build 1 included: flipped on the simulator evidence, with V1's speech half, V3's Mac half (this kit) and V4 due before the build 2 freeze (Tue 3 Nov 13:00 UTC), and the line set back to M4A if one fails. V3 asks whether Core Audio decodes an ADTS take exactly as it decodes the same frames in M4A, and what it does with a take a kill cut off or damage broke. V4 asks how the player times and seeks it. This kit runs the Mac half of both. About 5 minutes, no recording needed.

It needs Xcode (for `xcrun swiftc` and Core Audio), `npm install` at the repo root (section 1), and ffmpeg:
```bash
brew install ffmpeg        # once: makes the M4A twin of identical frames
npm run adts-parity -w @scribe/experiments
```
With no arguments it generates its takes, never a voice: a tone with a known envelope (sweeps under chirps at irregular moments) that has signal to its very last sample. That matters because V3's damage sits 213 and 427 ms from the end, and a take that ends in silence cannot show what the decoder does there. It encodes them with Core Audio's own ADTS writer (`afconvert -f adts -d aac -b 64000`): a 30 s take for V3 and a 10.5 minute take for V4. To run it on a real take, pass it:
```bash
npm run adts-parity -w @scribe/experiments -- --take experiments/recordings/v1-device.aac \
  --long experiments/recordings/ten-minutes.aac --killed <data container>/Documents/ExpoAudio
```
- **V1's device take.** Record a finished take on the phone with a build that has `ios: 'adts'`. Export it from the app (Settings > Export: the archive carries each recording as recorded, an `.aac` labelled `audio/aac`), AirDrop the archive to this Mac, and put the `.aac` in `experiments/recordings/` (git-ignored; it stays on this Mac). A take of a voice should end with a few seconds of talking, not a pause, or the damage cases print "cannot tell".
- **Killed takes** must come from an `ios: 'adts'` build. Run the kill harness locally with `--keep-app` (apps/mobile/e2e/README.md section 9). Then `<data container>` is what `xcrun simctl get_app_container <udid> com.earlyletters.scribe.dev data` prints, and the takes are in its `Documents/ExpoAudio`. `--killed` takes a folder or one file and uses only the `.aac` files in it; the output says how many it used and ignored. Without killed takes, V4's killed take is a synthetic cut of the take, and the output says so.

**What it runs.** `adts-coreaudio.swift` mirrors the app's `ScribeAudio.probe` and `decodePcm16` line for line on macOS's AVFoundation: the same `AVAudioFile` opening, the same `file.length`, the same converter to 16 kHz, and short reads left as zeros. It also counts any read that returns nothing while more than one frame of Core Audio's own length is unread, which is what the ADR's proposed native check would catch. The run is planned by the app's own code (`openRecordingForRun`, then every 5-minute window `findSpeech` decodes), as `transcribe-whisper.ts` calls it, up to Whisper. Frames are counted by the app's `scanAdts`.

**V3, as the ADR words it.**
- **Twins.** The take and `ffmpeg -c:a copy` of it as M4A are lined up by cross-correlation. The report gives the start offset apart from the length, and whether Core Audio trims TN2258's 2112 samples of priming on ADTS. For both, no read may stop early, and the decoded length must be within one frame of the counted frames (with or without the priming).
- **Cut files.** The take is cut mid-frame, mid-header and right after a header, and every killed take you pass is added. For each:
  - Core Audio must open it, or the run must switch to the whole-frame copy;
  - every window must decode without `ERR_SCRIBE_AUDIO_DECODE` and with no early stop, so the native check would never trip on it;
  - the run must plan over the whole frames, and the decoded length must be the whole frames within one frame.

  The cuts assume our recorder's frames: 7-byte headers, 11 bytes and up.
- **Damaged files, two ways.** First, the sync byte of the frame 20 from the end is zeroed. Second, the `frame_length` 10 frames from the end is set to a possible but wrong value. For each, the report gives:
  - Core Audio's length before and after the damage, against the counted frames;
  - whether a window starting before the damage returns audio after it, exact zeros, or an error, and how often a read stopped early (the primary evidence);
  - that audio cross-correlated against the undamaged take. The comparison starts four frames past the damage (ADR 0027's 85 ms tolerance) and allows four frames of lag, because a decoder that drops the damaged frame shifts what follows. ADR 0027's V3 row says "within one frame", so any shift over one frame is named in the reading ("read past, shifted N frames"). A run of a frame or more of exact zeros where the undamaged take has signal reads as a silent stop, even when the rest correlates. The comparison is made only where the undamaged take has signal; elsewhere the report says "cannot tell", not a verdict;
  - whether the run is refused (`break_inside`) or planned over every counted frame.

  "Full length, zeros past the damage" means Core Audio stops silently, and the native early-stop check (S08) goes in before the flip.

**V4, the player half.**
- The duration AVFoundation reports, as expo-audio builds the asset (without `AVURLAssetPreferPreciseDurationAndTimingKey`) and with the key, against the counted frames.
- Where seeks land, with infinite tolerance (expo-audio's `seekTo`) and with none, on the long take and a killed one.
- How many of expo-audio's own seeks (no precise-timing key, infinite tolerance) land more than 0.75 s off. Each would freeze the shown position (`scrubbedTo`, `use-letter-player.ts:144-146`). Seeks made with the key or zero tolerance are shown, but not counted.

**Results.** `experiments/results/adts-parity/report.md` and `report.json` hold numbers only: no file names, no paths, no audio. They also record the Mac: macOS version and build, Xcode, swiftc, ffmpeg, and the architecture. Every cut, damaged, copied or decoded file is temporary and deleted when the run ends, on Ctrl-C too. If the Core Audio helper crashes or stalls (3 minutes) on a file, that is recorded as an answer for that file, and the run goes on. Exit codes:
- 0: every V3 condition checked here holds;
- 2: one does not (the report says which);
- 3: a damage case could not be decided, because the take is silent past the damage;
- 1: the run itself failed;
- 130: stopped with Ctrl-C (or SIGTERM), at any step: in the middle of a Core Audio call, while swiftc, ffmpeg, afconvert or a version check runs, or between the steps. A stop is never recorded as an answer about a file.

V4 is not a gate. A helper failure there is listed as "not measured", and the exit stays as V3 decided it.

Send report.md to the coordinator, or paste it into the PR or evidence file that asked for it.

**What a Mac cannot answer [U].** macOS Core Audio is not the phone's. Every number above is [U] for iOS until the in-app half runs. These parts run only in the app:
- `ScribeAudio.probe` against the recorder's clock (`durationMillis`) on finished M4A and ADTS takes;
- `enhance` (the listening copy's length against the original);
- the real transcription job through Whisper;
- the `scrubbedTo` freeze in the player itself.

**The in-app half, and the gap.** It fits the kill drill without touching a production code path. It is the drill's `decode` mode in `apps/mobile/src/dev/kill-drill.ts` (#291), with the mode and a `decoded` marker added to `kill-drill.logic.ts` and `e2e/kill/protocol.mjs` (the parity test keeps them one protocol). In that mode the app runs, on each kept DL-01 take the host names (by file name, in `Documents/ExpoAudio`; running it on this kit's twins, cuts and damaged files would need the host to place them there first, which is not built):
- `scanRecordingFile`, `ScribeAudio.probe`;
- `openRecordingForRun` with the real `wholeFramesCopy`, with the take's stored progress mark;
- `decodePcm16` over every `findSpeech` window;
- `ScribeAudio.enhance` into Caches, then a probe of that copy, which it deletes.

It writes numbers only. The harness runs the mode once after the DL-01 runs whenever a kept take is `.aac`, and reports it without changing the exit code, so `kill-harness.yml` needs no change. The first evidence is ADTS trial run 40089036324: 50 of 50 takes read, none refused. **The gap:** the real transcription job needs an installed speech pack, and the e2e simulator build has none (servers off; the packs are signed and hosted, D-115). So on the simulator the drill reaches the step where a run is refused or planned (`decoder_short`, `break_inside`), which is the step V2's "none is refused" assertion is about, but not Whisper itself. Whisper on killed ADTS takes needs the founder's device, or a seam that installs a pack on the simulator.

## Verified so far (on Linux)
Oct 2, 2026: `npm run experiment:edits` ran on the fictional samples, rules only and against a stub model server that returned a mix of valid edits, invented words and non-JSON. Every invented word was rejected and the non-JSON reply fell back to rules only.

Oct 1, 2026: The full pipeline ran end to end on whisper.cpp's sample speech: 0% word error with the `base` model. With voice detection on, 30 seconds of loud white noise produced nothing. With it off, Whisper wrote "(waves crashing)". The app always runs voice detection and strips such tags.

Oct 15, 2026 (Linux, the language gate): `npm run gate` ran end to end with whisper.cpp v1.9.3's real voice detector (the Silero v6.2.0 file, SHA-256 equal to the app catalog) on a public sample speech clip and two generated clips with nobody talking. The voice detector found the speech and found nothing in white noise or silence, so the recogniser was never run on them; the decoder was a stand-in (the model host is not reachable from that machine), so word error there proves the wiring, not the model. The founder's Mac run is the first real one.

Oct 24, 2026 (Linux, the ADTS kit of section 8): only the pure half ran. The take was the 30 s generated tone (signal to its last sample), written by ffmpeg's AAC encoder as ADTS at 64 kbit/s: 1,408 frames of 12 to 267 bytes.
- Each cut scanned as a kill cut (1,378, 1,388 and 1,398 whole frames).
- The zeroed sync byte scanned as a break with 19 frames after it. The wrong frame_length (269 for a true 180) scanned as a break with all 1,408 frames still counted.
- ffmpeg decoded the take and its `-c:a copy` M4A twin to the same 480,597 samples, lined up at lag 0 with score 1.0.
- With ffmpeg standing in for Core Audio on the damaged files, both read past, shifted by one frame (it drops the damaged frame), at scores 0.957 and 0.999. The undamaged take has signal over both compared spans (rms about 2,200), so the readings are decided, not the false "stops silently" the first version of the take gave.

Core Audio was not run: `adts-coreaudio.swift` and `adts-parity.ts` have not run on a Mac yet [U].
