# Ambient sound on the film home page

Licence and provenance note. Code: `apps/web/src/film/sound/`.

## Where the sound comes from

The sound is generated live, in the visitor's browser, by our own code using the Web Audio API.

- No audio files. No samples. No recordings. Nothing is downloaded or streamed.
- No AI music and no AI model of any kind, at build time or run time.
- No third-party music, loops, sound libraries or packages. No new dependency was added.
- The notes are plain oscillators (sine and triangle waves) at fixed pitches written in `ambient-map.ts`, shaped by a
  high-pass, a low-pass filter and a soft reverb whose impulse is made from seeded noise in `ambient-engine.ts`.

## What it is

A slow pad on four open chords (D sus2, C sus2, F major 7, G major 7; no hard thirds, no melody, no rhythm), played
about an octave above the first version (lowest note about 262 Hz) so phone and laptop speakers can play it.

- Two voice banks. A chord change does not slide any pitch: the next chord's bank is made silent, then the two banks
  crossfade over 10 s with equal-power curves, and the old bank is discarded. The scene tone (night, dusk, paper) never
  changes pitch; it changes the filter lid (900, 1020, 1200 Hz), the quiet "air" voice and the reverb.
- Slow life: the filter cutoff drifts by 150 Hz every 33 s; each chord has a second voice set with another detune that
  drifts across the stereo field (pan -0.4 to +0.4, every 50 s); every voice swells slowly and never in step; and
  about every 20 to 40 s one very quiet chord tone rings (3 s in, 6 s out, always a note of the chord playing).
- Detune is a few tenths of a hertz at every pitch, so the chorus beats under 1 Hz and never as a fast wobble.
- Scroll: smoothed scroll speed (not direction) lifts the reverb, the air voice (0.10 to 0.25), the cutoff (up to
  +1500 Hz) and the master gain (0.075 to at most 0.11, about +3.3 dB). It rises in about half a second and settles
  back over a few seconds. The master gain never goes above 0.11.
- Each chord has a small level trim, measured, so no part of the film is quieter than another by more than about 1 dB.

Why it is ours: every pitch, detune, envelope and number is written in `ambient-map.ts` and `ambient-engine.ts`. The
chords are four common shapes; nothing is taken from a recording, a library or a model.

Because there is no third-party or machine-composed recording, there is no one else's copyright to licence, and no
AI-music provenance question to answer. The chord notes are a handful of common intervals (suspended and added-ninth
shapes); a set of pitches is not a protectable composition. The code is ours, UNLICENSED like the rest of `apps/web`.

If a recording or a library is ever added later, it needs its own licence note here first.

## How it behaves

- Default: `AMBIENT_DEFAULT_ON` in `ambient-map.ts` (true). Flip it to false to make the sound start off for everyone.
- Browsers refuse sound before a user gesture, and scrolling is not a gesture. "On by default" therefore means: on in
  state, fading in at the first pointerdown, touchend, keydown or click. Until then the button reads "Tap to start
  sound" and is not pressed; it reads "Sound on" only while the AudioContext is really running.
- Reduced motion: never starts on its own, whatever was stored. The visitor presses the button.
- The choice is remembered in `localStorage` (`el-ambient-sound`, the single value "on" or "off"), inside try/catch. It
  stays on the visitor's device and is never sent anywhere. The site's rule until now was "no browser storage"
  (`test/legal.test.ts`, comment in `privacy-copy.ts`); the Privacy page itself says only "We do not use cookies",
  which stays true. `legal.test.ts` now allows this one file and nothing else. Whether the Privacy page should mention
  the remembered sound choice is a founder and legal decision. To drop the storage, make `readChoice`/`writeChoice`
  no-ops and remove the allowance.
- A hidden tab pauses it (fade out, then `suspend`); leaving the page closes the context; muting fades out, stops the
  oscillators and closes the context.
- Only the film home page (`Film.tsx`) mounts it. `/privacy`, `/terms` and the sign-up pages never do.
- Level: master gain 0.075 at rest, at most 0.11 while scrolling fast, plus a fade-in over a few seconds. Nothing
  starts or stops with a jump; every scroll-driven change is a `setTargetAtTime` glide and every chord change is a
  crossfade.
- Keys that only move around the page (Tab, Shift, Space, arrows, Page Up and Down, Home, End) never start the sound.
  Neither does anything inside the sign-up form.

## Honest risks

- Unexpected sound. A parent may open the page at night next to a sleeping baby. Sound begins at their first tap or key
  press, never on its own, and it is quiet, but it is still sound they did not ask for in words. The founder can set
  `AMBIENT_DEFAULT_ON = false` to make it opt-in.
- Autoplay rules differ. Chrome, Safari and Firefox each decide what counts as a gesture; iOS Safari wants a tap that
  ends (touchend or click), not a scroll swipe. On a browser that holds the sound back the button keeps saying "Tap to
  start sound" and nothing is claimed that is not true.
- WCAG 2.2 1.4.2 (Audio Control): sound that plays automatically for more than three seconds needs a way to stop it.
  The button is on the page from the first paint, is keyboard reachable and is a labelled `aria-pressed` toggle. It
  is reachable before the sound begins, because the sound begins only after a gesture.
- Not verified by ear. The sound was checked by script (context state, parameter values over a scripted scroll), not
  listened to. A person must judge whether it is calm, pleasant and quiet enough on phone speakers, laptop speakers
  and headphones before launch.

## Measurements

Two ways, both on a local production build in headless Chromium with no audio device, and neither is a listening test.

1. Live capture: a ScriptProcessor tap on the real page, a scripted visit of about 4.5 minutes (gesture, rest, firm
   scroll, a hold on each of the four chords, a slow walk down the film, mute, unmute). The tap runs on the main
   thread and sometimes drops a block, which shows as a step at a 4096-sample block edge; those are excluded and
   are not in the engine (the offline render below has none).
2. Offline render: the same engine run in an OfflineAudioContext for 70 s with a scripted scroll, and again with no
   scroll as a control. Exact, so the scroll lift is measured against the identical render without the scroll.

| | Before (#445) | After |
|---|---|---|
| Peak, live capture | -19.3 dBFS | -21.4 dBFS |
| RMS, live capture | -33.5 | -34.3 |
| Integrated loudness (K-weighted, mono) | -34.4 LUFS | -34.8 LUFS |
| Share of power below 60 Hz | 0.0 % | 0.0 % |
| Share of power below 200 Hz | 38 % (31 % offline) | 0 % |
| Share of power 200 to 2000 Hz | 62 % | 100 % |
| Spectral centroid at rest | 226 Hz | 715 Hz |
| Level lift from a firm scroll, against an identical no-scroll render | +0.4 to +2.7 dB, only at full energy | +1.8, +3.4, +1.8 dB over the 4 s of a full-energy scroll; +1.6, +2.9, +2.2 dB in the live paired capture |
| Same lift judged without a control (what the first review did) | -2.2 dB (lower) | -0.4 to 0.0 dB, because the slow swell moves the level by about 3 dB by itself |
| Settling after the scroll | back within 0.2 dB in 3 s | back within 0.1 dB in 3 s |
| Fast amplitude wobble (3 to 15 Hz) across a chord or tone change | 7.5 to 9.6 % (index) | 2.9 to 4.5 % (2.0 to 3.2 % offline) |
| Same index at rest | 5 % | 5 % |
| Level difference between the four parts of the film | 4.7 dB | 0.6 dB |
| Timbre self-similarity over a walk down the film, lag 10 s and 40 s | 0.28 and 0.07 | 0.66 and 0.28 |
| Click check at start, mute, unmute (largest step off block edges, live) | 0.003, 0.002, 0.003 | 0.008, 0.005, 0.008 |
| Largest step in the exact offline render | 0.004 | 0.007 (none above 0.012) |
| Audio load, offline render speed | 13 x realtime | 8 x realtime |

How to read it:

- "Before" matches the reviewer's capture of the live site (peak -20.4, RMS -31.6, -33.5 LUFS, about half the power
  at or below 200 Hz) closely enough to trust the method.
- The first review found a fast scroll "lower, not higher". That was the chord and tone moving during the scroll plus
  the pad's own swell, not the scroll mapping. With a matched no-scroll control the old design lifted by up to 2.7 dB
  and the new one by 3.4 dB at most.
- The timbre self-similarity measure is lower for the old version because the old tone changes transposed the whole
  chord and slid its pitch, which is exactly the beating the review wanted gone. In a still stretch the new pad is as
  steady as the old one (0.9 or more at 40 s in live capture): the "slow life" is deliberately subtle. Whether it is
  enough variety is for a listener to say.
- Level breathing from the slow swells is still about 3 to 4 dB peak to peak over 20 s; the scroll lift is a faster
  and separate movement.
- The sparse chord tone is about 8 dB under the pad's RMS, not the -30 dBFS in the brief: at -30 dBFS it lifted the
  whole pad by about 3 dB while it rang, which is not very quiet.
- The new engine costs about 1.7 times the audio processing of the old one. That is still small, but it has not been
  tried on an older phone.

## What nobody has heard

This was built and measured by a program that cannot hear. Nothing above says it sounds good. A person needs to listen
on a phone speaker, a laptop and headphones, at night and in a quiet room, to judge whether it is calm, whether the
scroll response is pleasant and not distracting, whether the chord changes are smooth, and whether the sparse tone
belongs.
