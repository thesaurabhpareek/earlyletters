# Store screenshots (App Store, version 1.0)

Eight frames, ordered as a story. Frames 1 to 6 are the set; 7 and 8 are optional. Captions live in `captions.json`
and are the same words as `storeListing.screenshots` in `packages/content/src/store.en.ts` (the content rules test
reads both). Demo family is the fictional Asha, signed "Mama". No real family details. All PNG, 8-bit RGB, no alpha.

## Sizes

From Apple's Screenshot specifications, read 1 Nov 2026
(https://developer.apple.com/help/app-store-connect/reference/app-information/screenshot-specifications):
"At least one screenshot for iPhone with Dynamic Island (medium display)" is required; 1 to 10 screenshots per size;
.jpeg, .jpg or .png; "Images can't include alpha channels or transparencies."

| Folder | Size | Display class | Use |
|---|---|---|---|
| `iphone-medium-1206x2622/` | 1206 x 2622 | iPhone with Dynamic Island (medium display) | Required |
| `ios-6.9in/` | 1320 x 2868 | iPhone with Dynamic Island (large display) | Optional |

No iPad set: `supportsTablet` is false in `apps/mobile/app.config.ts`. No Google Play set: the first store build is
iPhone only. The earlier 6.5 inch and Play folders (website re-renders) were removed with the builder that made them.

## The frames

| # | File | Real screen | Headline | Support line |
|---|---|---|---|---|
| 1 | 01-tonight.png | Tonight at 9:10 pm, dark: greeting, a question to begin with | Tell your child about today. | A minute is plenty. It becomes a letter. |
| 2 | 02-review.png | Read it back: "Took out a sound" with Put it back | Every change is marked. | We only fix small slips. Tap one to put it back. |
| 3 | 03-letter.png | A letter from Mama with Hear Mama | Your voice stays with each letter. | The original recording is kept unchanged. |
| 4 | 04-book.png | The Book after Add to Asha's book: this month and the month before | A book that grows by month. | Each letter goes into your child's month of age. |
| 5 | 05-letter-night.png | Read together, dark, no word highlight | Read together at bedtime. | One letter at a time, oldest first. |
| 6 | 06-privacy.png | Settings, Privacy, "What we never do" | Your book stays on your phone. | Private by default. Never sold, never used for ads. |
| 7 | 07-quiet-day.png | "A quiet day, kept." with Undo | Quiet days are fine. | Tap Not much today. That is enough. |
| 8 | 08-listening.png | Listening, no words on screen | Pause, laugh, start again. | Take your time. Say it however it comes. |

Frame 5's support line says what Read together does: it goes through the whole book, oldest first (it opens from the
Book with the child only, not a month).

## Method

The real app, not a mock-up: `apps/mobile` exported for web (`expo export --platform web` with
`EXPO_PUBLIC_WEB_PREVIEW=1`, the `apps/mobile/e2e-web` harness and its Asha seed), captured in Chromium at iPhone 17 Pro
size (402 pt wide, 3x), then composed with the caption above a plain phone outline we draw ourselves. Clock fixed at
Tue 3 Nov 2026, 9:10 pm Pacific so the greeting and lamp are the bedtime ones. The status band and home indicator are
repainted and the status bar (9:41, full battery) is drawn; nothing else is drawn by hand. Captured from `develop` at
`d6e83f9e`.

Tools, in `tools/`:
- `capture.mjs`: serves the web export and captures each screen into `../raw` (git-ignored).
- `compose.mjs`: composes `../iphone-medium-1206x2622` and `../ios-6.9in` from `../raw` and `captions.json`.
- `finish.py`: flattens to RGB with no alpha, checks sizes, writes `../contact-sheet.png` (git-ignored).
- `d126-store-build.patch`: hides the Family tab when `capabilities.coParent` is off (see "Know before upload").

Rebuild (Node 22, Python 3 with Pillow, Chromium at `PW_CHROMIUM` or `/opt/pw-browsers/chromium`):

```bash
git worktree add --detach ../wt-shots origin/develop && cd ../wt-shots && npm ci
git apply docs/store/screenshots/tools/d126-store-build.patch   # only until D-126 is on develop; skip it to show the Family tab
cd apps/mobile && EXPO_PUBLIC_APP_ENV=preview EXPO_PUBLIC_SERVER_FEATURES=off EXPO_PUBLIC_WEB_PREVIEW=1 CI=1 \
  npx expo export --platform web --clear --output-dir e2e-web/.web-dist-seed
cd ../../docs/store/screenshots/tools
node capture.mjs ../../../.. ../raw
node compose.mjs ../../../.. ../captions.json
python3 -I finish.py && rm -rf .tmp
```

## Know before upload

- **Family tab (D-126).** The frames hide the Family tab with the worktree-only patch above. They match the store build
  only if the D-126 change is in it. If the D-126 fallback is taken instead, rebuild without the patch so the tab shows.
- **Web, not device.** Native details may differ. Compare frames 1 to 3 with a simulator capture of the release build.
  Recapture after the TestFlight fixes (#540 to #546) are all in; #544 moves the Book's month numerals.
- **Review frame.** On web the fixes list opens expanded, so frame 2 shows the card after tapping a fix.
- **No audio.** The seed has no recordings, so no player is shown playing.
- **Frame 5 letter text** mentions "Nani" inside the demo letter. It is a parent's words, not a feature claim, but it
  is the only family word on any frame; recapture with another demo letter if the founder prefers.
