# Ambient sound on the film home page

Code: `apps/web/src/film/sound/` (`tracks.ts`, `ambient-engine.ts`, `ambient-map.ts`, `AmbientSound.tsx`). Files: `apps/web/public/audio/`.
Tests: `test/tracks.test.ts`, `test/ambient-map.test.ts`, `e2e/ambient-sound.e2e.ts`.

## What it is

The film plays one real, openly licensed recording (calm piano or ambient), hosted on our own origin, on a seamless loop.
Nothing is generated. An earlier version synthesised a sitar-like raga and an earlier one still a chord pad; the founder
heard the sitar ("too boring") and asked for open-source music instead. Those synthesisers were removed (below).

## Design

- **Files.** mp3 (96 kbps stereo) under `public/audio/`, served from the site's own origin like any asset. No CDN, no
  third-party request. mp3 plays in iPhone Safari and Chrome; do not add ogg (Safari is unreliable with it). m4a (AAC) is
  allowed too. Each file at most 6 MB, all together under 20 MB (tests).
- **Lazy.** Nothing is requested on page load. At the first gesture, `start()` makes and resumes the AudioContext
  synchronously (iOS needs that), then fetches the one chosen track, decodes it (`decodeAudioData`) and fades it in over about
  1.2 s. A test checks that no `/audio/` request happens before the gesture and that only one file is fetched.
- **Loop.** The decoded track is scheduled as overlapping passes: each pass starts `crossfadeSeconds` before the last ends,
  with an equal-power fade-in on the new pass and fade-out on the old one. The files already carry a fade in and out, so the
  seam is a gentle dip-and-return rather than a hard cut (4 s). Passes are scheduled 20 s ahead on the audio clock.
- **Chain.** passes, level (track `gainDb`, tone, scroll), low-pass (the only filter, glided with `setTargetAtTime`), a safety
  limiter (threshold -4 dB; it should never act), fade, output.
- **Scroll and tone** (`ambient-map.ts`, unchanged in spirit). Smoothed scroll speed lifts the level by at most 3.3 dB and
  opens the low-pass by at most 2.5 kHz; both ease back over a few seconds. Tone sets the level (night 0.8, dusk 0.9, paper 1)
  and the resting lid (night 5.5 kHz, dusk 7.5 kHz, paper 10 kHz). Nothing changes the music's tempo or notes.
- **Level.** Tracks were normalised before they were added to about -23 LUFS integrated, peak under -7 dBFS, so `gainDb` is 0.
  For a new file: `ffmpeg -i in.wav -af loudnorm=I=-23:TP=-8:LRA=7 -b:a 96k out.mp3`, check with
  `ffmpeg -i out.mp3 -af ebur128=peak=true -f null -`, and set `gainDb` to the remaining difference.

### Behaviour (unchanged)

- Default on (`AMBIENT_DEFAULT_ON`), but only from the first real gesture (pointerdown, touchend, keydown, click). Scrolling is
  not a gesture. Tab, Shift, Space, arrows, Page Up/Down, Home, End and anything inside the sign-up form never start it.
  Until then the button reads "Tap to start sound".
- One button, 44 px, `aria-pressed`. "Sound on" only while the context is running and the track has loaded; if the file
  fails to load the button goes back to "Tap to start sound" and the next tap retries.
- Reduced motion never auto-starts. A hidden tab fades out and suspends; coming back resumes. Leaving the page releases the
  context. `navigator.audioSession.type = 'playback'` is set so the iPhone silent switch does not mute it.
- The only stored value is still the on/off choice in `localStorage` (`el-ambient-sound`). **No new storage.**
- Only the film home page mounts it; `/privacy`, `/terms` and the sign-up pages never make a sound.

### Choosing a track: `?music=<id>`

`/?music=lifewave` plays that track. The id is read once from the address bar and kept in a variable in memory for the visit
(it survives moving between pages of the site, not a reload without the parameter). It is never written anywhere. A missing or
invalid value falls back to the default, the first entry in `TRACKS`. To compare on a phone, open four addresses:

| Address | Track |
|---|---|
| `/` or `/?music=vaporware` | Calm Piano 1 (default) |
| `/?music=lifewave` | Calm Ambient 3 |
| `/?music=contemplation` | Contemplation |
| `/?music=first-light` | First Light Particles |

### Credits

`credits()` in `tracks.ts` builds a credit line for every track whose licence is in the CC "BY" family. The footer renders
those lines (label from `site.sound.credit`, with a link to the source page and the licence). It is generated from the list, so
attribution cannot be forgotten, and a test fails if a BY-family track would have no credit. Today all four tracks are CC0, so
the footer shows nothing. Adding a CC-BY track (or a CC-BY-SA one) needs only a list entry; see the share-alike question below.

## Licence register

Tracks, authors, licence and source pages were found and checked by the coordinator before they were handed over; I
(the engine author) copied them as given and did not re-check the pages. I tried to read the CC BY 4.0 and CC0 1.0 legal code
for this note and was blocked from fetching them, so **no statement here is quoted from a licence text**.

| id | Title | Author | Licence | Source | Length | Size | Loudness / peak (measured here with ffmpeg ebur128) |
|---|---|---|---|---|---|---|---|
| vaporware | Calm Piano 1 (Vaporware) | cynicmusic | CC0 1.0 | https://opengameart.org/content/calm-piano-1-vaporware | 165 s | 2.0 MB | -22.8 LUFS / -7.3 dBFS |
| lifewave | Calm Ambient 3 (Lifewave 2k) | cynicmusic | CC0 1.0 | https://opengameart.org/content/calm-ambient-3-lifewave-2k | 187 s | 2.2 MB | -23.8 LUFS / -8.1 dBFS |
| contemplation | Contemplation | Joth | CC0 1.0 | https://opengameart.org/content/contemplation-0 | 120 s | 1.4 MB | -23.3 LUFS / -7.2 dBFS |
| first-light | First Light Particles | Yoiyami | CC0 1.0 | https://opengameart.org/content/first-light-particles-%E2%80%93-cc0-atmospheric-pianoambient-track | 132 s | 1.6 MB | -23.4 LUFS / -9.3 dBFS |

Our files are mp3 re-encodes of the originals (normalised, with fades), made by the coordinator. CC0 is a dedication to the
public domain that asks nothing of the user; that is the general purpose of CC0, and counsel should confirm it for these four
pages before launch (including that each uploader had the right to dedicate the work, which no site can prove for us).
Keep a dated copy of each source page (screenshot or archive link) in the release file as evidence.

Rules for adding a track: read its licence page and the licence text; put the licence in the `Licence` type only after
reading it; fill every field in `tracks.ts`; if the licence is BY, the credit appears automatically; if it is BY-SA, ask
counsel whether our normalise, fade, crossfade and filter count as an adaptation that must itself be shared alike; never add
NC or ND licences (a commercial site) or any track whose uploader is not its author without a stated source.

## Privacy and legal pins

Audio is fetched from our own origin after the first gesture, like an image. No new data leaves the browser, the
Content-Security-Policy is unchanged (`default-src 'self'` covers `connect-src` fetches of `/audio/`), and no new storage is
used, so the Privacy page needs no change. The footer credit (when one exists) is a link to the source page, not a load.

## Removed

The synthesised sound is gone (it stays in git history, PR #496's first commit): `pluck.ts` (Karplus-Strong sitar and tanpura
model), `raga.ts` (the Bhoopali phrases and picker), the scheduler, drone, sympathetic strings and reverb in the engine, and
`test/pluck.test.ts` and `test/raga.test.ts`. They are not kept as a fallback: a fallback would ship about 60 KB of
code to every visitor for a case (a failed same-origin file) that the retry on the next tap already covers. The tone and
scroll parameters that only the synth used (reverb, shimmer, pluck strength, gap scale, register) were removed from
`ambient-map.ts`; the filter, level, tone and scroll mapping stay.

## Risks and what has not been checked

- **Nobody has listened** to these files through this player on a phone; level, the 4 s loop dip, and the low-pass lid are
  numbers, not judgement. Try all four addresses on the iPhone, with the ringer switch on silent too.
- **Memory.** A decoded track is held as 32-bit stereo audio: about 58 MB (vaporware), 66 MB (lifewave), 42 MB, 47 MB. Fine on
  recent phones; untested on old ones. Keep new tracks under about 3.5 minutes.
- **Download.** 1.4 to 2.2 MB on the first tap, on the visitor's data. On a slow link there is a short silence before the music
  fades in; the button already says "Sound on".
- **Loop.** Equal-power crossfade of two correlated copies of the same audio can bump by up to 3 dB at the seam for tonal
  material; not measured in a browser render.
- **Browsers.** Verified in headless Chromium only (mp3 decode, requests, button states). Safari was not run.
