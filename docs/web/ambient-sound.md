# Ambient sound on the film home page

Licence and provenance note. Code: `apps/web/src/film/sound/`.

## Where the sound comes from

The sound is generated live, in the visitor's browser, by our own code using the Web Audio API.

- No audio files. No samples. No recordings. Nothing is downloaded or streamed.
- No AI music and no AI model of any kind, at build time or run time.
- No third-party music, loops, sound libraries or packages. No new dependency was added.
- The notes are plain oscillators (sine and triangle waves) at fixed pitches written in `ambient-map.ts`, shaped by a
  low-pass filter and a soft reverb whose impulse is made from seeded noise in `ambient-engine.ts`.

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
- Level: master gain 0.08 at rest, at most 0.11 while scrolling fast, plus a fade-in over a few seconds. Nothing
  starts or stops with a jump; every change is a `setTargetAtTime` glide.

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
