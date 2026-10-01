# Speech experiment kit (Mac)

**Goal:** before building app screens, find out how well open speech models hear *your* family: Meera's name, nicknames, Hindi words, and your accents. The architecture review found standard Whisper scores about 30% word error on Hindi-English mixed speech, so this is the most important test we can run. About one hour of your time in total.

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
- `dictionary`: every name and word you want spelled your way: Meera, Meeru, Mumma, Papa, Nani, Dadi, your Hindi words. Leave `heardAs` empty for now.
- `phrases`: one line per recording, with exactly what you said in `expected`, including the "um"s if you said them.

## 3. Record (on your iPhone, Voice Memos)
Each of you, in your normal voice, the way you'd talk at bedtime:

| # | What to record | Why |
|---|---|---|
| 1 to 5 | Five short sentences with her name and nicknames, e.g. "Meeru walked to Mumma today." | Name accuracy |
| 6 to 10 | Five sentences mixing Hindi and English the way you really talk | Code-switching accuracy |
| 11 to 13 | Three 30 to 60 second "letters" to Meera about today, unscripted, then type what you said into the config | Real-life accuracy and the cleaning |
| 14 | 30 seconds in her room with the white-noise machine on and **nobody talking** | Checks it never invents words |

Name files `01.m4a`, `02.m4a` and so on. AirDrop them to your Mac and put them in `experiments/recordings/`.

## 4. Run
```bash
npm run experiment
```
Then open:
- `experiments/results/report.md`: accuracy per model, with PASS/FAIL against the bar (names at least 95% right; zero invented words in the silent clip).
- `experiments/results/review.md`: the "does this sound like me" sheet. Pick A or B for each recording before reading the key at the bottom.

## 5. Send me
Share `report.md` and your `review.md` choices (or paste the summary table). That decides: which model ships, whether we need a fine-tuned Hindi-English model, and whether any language model is needed at all for cleaning.

## Verified so far (Oct 1, 2026, on Linux)
The full pipeline ran end to end on whisper.cpp's sample speech: 0% word error with the `base` model. With voice detection on, 30 seconds of loud white noise produced nothing. With it off, Whisper wrote "(waves crashing)". The app always runs voice detection and strips such tags.
