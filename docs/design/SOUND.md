# Sound

Used at night, often within arm's reach of a sleeping baby. UI sound is a small, optional layer of paper and soft felt bells, **off by default**.

Amends DESIGN_LANGUAGE §10 ("No UI sounds") to: *No UI sounds by default; an opt-in "Paper sounds" setting plays the six sounds below.* MOTION principle 5 and §5(h) stand: milestones stay silent.

## 1. Benchmark

| Reference (opened 2026-10-01) | What it does | Take |
|---|---|---|
| [Apple HIG, Playing audio](https://developer.apple.com/design/human-interface-guidelines/playing-audio) | In silent mode people "want to silence nonessential sounds, such as keyboard clicks, sound effects"; the device "plays only the audio that people explicitly initiate". Pick the category that fits; "don't make people stop listening to music from another app if you don't need to." | **Adopt as law.** UI sounds are nonessential: Ambient category. Letters are explicitly initiated: Playback. |
| [AVAudioSession `ambient`](https://developer.apple.com/documentation/avfaudio/avaudiosession/category-swift.struct/ambient) | "Audio from other apps mixes with your audio. Screen locking and the Silent switch silence your audio." For apps that also work "with the sound turned off". | **Adopt** for every UI sound. |
| [Apple HIG, Playing haptics](https://developer.apple.com/design/human-interface-guidelines/playing-haptics) | Haptics "complement other feedback"; match intensity and sharpness; "avoid overusing"; "make haptics optional". | **Adopt.** Each sound is the audible half of an existing haptic; a sound never exists without one, except page turn. |
| iOS keyboard clicks (same HIG page) | The canonical nonessential sound: tiny, frequent, silenced by the switch. | **Avoid** per-keystroke or per-step sounds. |
| [Headspace, Scott Sorenson interview](https://blog.native-instruments.com/headspaces-scott-sorenson-on-designing-sounds-for-the-soul/) | Music "that isn't so interesting that it pulls your attention to it". | **Adopt** the restraint: sounds sit under attention, never on top of it. |
| [Duolingo micro-interactions](https://medium.com/@Bundu/little-touches-big-impact-the-micro-interactions-on-duolingo-d8377876f682) | A "satisfying chime or applause" for correct answers, "playful boings for mistakes"; sound as reward loop. | **Contrast.** No reward sounds, no applause, nothing playful about an error, nothing that would count. |

## 2. Decision: off by default

**Off**, opt-in, per device. Reasons:

1. **The baby.** A 450 ms chime at the wrong moment can wake a light sleeper; a parent who just got a baby down will not forgive it. Haptics already confirm every action silently.
2. **The silent switch is not enough.** Many parents leave the ringer on at night for the other parent's call; we cannot infer "baby asleep" from it.
3. **Android has no silent switch** and expo-audio plays on the media stream (verify), so the risk is higher there.
4. **The voice is the product.** By default, the only thing the app ever says is a family member's voice.

The setting lives in Settings, not onboarding. Copy (content rules apply): **"Paper sounds"** / "Soft sounds when you save a letter or turn a page. Quiet when your phone is on silent." Android: setting hidden until the ringer-mode guard (§5) ships.

## 3. Hard rules (apply with the setting on)

1. **Never during capture.** No sound while the recorder is armed or recording. `record_start` finishes before the microphone opens; `record_stop` plays after it closes.
2. **Never over a letter.** No sound while any letter audio is playing, buffering or seeking, in Read together, Review's mini-player or "Play this part".
3. **Respect silent mode.** iOS: Ambient category, so the hardware switch mutes us. Android: play only when ringer mode is Normal.
4. **Never interrupt or duck other audio.** Mix with others; never `doNotMix` or `duckOthers` for UI sounds.
5. **One sound per gesture.** Save and "filed into Month N" are one sound, not two.
6. **Never sound-only meaning.** Every sound accompanies a visible change (H2, HIG).

## 4. Palette

Six sounds, one voice: a felt mallet on a small bell in D major pentatonic, between E4 and A5, low-passed at 5 kHz and high-passed at 120 Hz, with seeded paper noise. Rising intervals for "done" and "arrived", a falling fourth for "stop", a repeated low note for "not yet". Peaks -18 to -26 dBFS, RMS measured on the shipped files. Spec is peak plus RMS, not LUFS: most clips are shorter than the 400 ms EBU R128 momentary window.

| Name | What you hear | ms | Peak / RMS dBFS | Haptic (MOTION §6) | Never plays |
|---|---|---|---|---|---|
| `record_start` | Nib on paper, one soft D5 | 120 | -22 / -33 | `impactAsync(Light)` / `Context_Click`, same frame | Once recording mode is set; on resume from Pause (haptic only) |
| `record_stop` | Same voice, a fourth lower (A4) | 140 | -23 / -35 | `impactAsync(Light)` / `Context_Click` | Before the recorder has stopped; on Pause; on Discard (Discard keeps its Warning haptic, no sound) |
| `sealed` | A sheet folding, then D5 to A5 | 450 | -18 / -30 | `notificationAsync(Success)` / `Confirm`, on the commit, before animation (MOTION principle 3) | When Review's mini-player is playing (rule 2); on autosave or sync; on edits to an existing letter |
| `page_turn` | Paper only, two soft swells, no pitch | 220 | -26 / -39 | none (MOTION: none in Read together) | While a letter is playing; on auto-advance; mid-letter Next (stop audio, then play) |
| `invite_accepted` | D5, F#5, A5 at walking pace: a letter arriving | 700 | -18 / -30 | `notificationAsync(Success)` / `Confirm` (new row) | On the inviter's device (that is a push, system sound); more than once per invite |
| `gentle_error` | Two muted taps on one low E4 | 300 | -24 / -36 | `notificationAsync(Error)` / `Reject` (new row) | For validation hints, offline states or retries; for the mic-denied card (not an error, a choice) |

**Not in the palette, on purpose.** *Added to the book* is the second half of `sealed`. *First letter and milestones* stay silent (MOTION §5h); the first letter's `sealed` is the moment. Pause, Reading Size, Put it back, tabs and scrolling get haptics only.

`gentle_error` plays only for failures the person can fix now (a photo that failed to attach), never for background failures.

## 5. Implementation (expo-audio, Expo SDK 57)

**Format.** Mono, 44.1 kHz, 16-bit PCM WAV, 10 to 62 KB each. Not m4a: AAC priming adds leading silence that makes a 120 ms tick late. Not caf: no Android playback.

**One audio session, three modes.** iOS has one session per app, so the app owns it through one module, `src/lib/audio-mode.ts`:

| Mode | When | `setAudioModeAsync` |
|---|---|---|
| `idle` | Default | `{ playsInSilentMode: false, interruptionMode: 'mixWithOthers', allowsRecording: false, shouldPlayInBackground: false }`: Ambient |
| `recording` | Listening | Owned by the recording spec |
| `playback` | Read together, mini-player | `{ playsInSilentMode: true, ... }`: user-initiated, plays on silent |

Leaving `recording` or `playback` must restore `idle`, or UI sounds would ignore the silent switch. `playSound` refuses unless the mode is `idle`.

**Single wrapper**, `src/lib/sound.ts`:

```ts
import { createAudioPlayer, AudioPlayer } from 'expo-audio';
import { getAudioMode } from './audio-mode';
import { settings } from './store';

const files = {
  record_start: require('../../assets/sounds/record_start.wav'),
  record_stop: require('../../assets/sounds/record_stop.wav'),
  sealed: require('../../assets/sounds/sealed.wav'),
  page_turn: require('../../assets/sounds/page_turn.wav'),
  invite_accepted: require('../../assets/sounds/invite_accepted.wav'),
  gentle_error: require('../../assets/sounds/gentle_error.wav'),
} as const;
export type SoundName = keyof typeof files;

let players: Partial<Record<SoundName, AudioPlayer>> = {};

export function preloadSounds() {          // call when setting turns on, and at launch if on
  for (const k of Object.keys(files) as SoundName[]) players[k] ??= createAudioPlayer(files[k]);
}
export function releaseSounds() {          // call when setting turns off
  Object.values(players).forEach((p) => p?.remove());
  players = {};
}
export function playSound(name: SoundName) {
  if (!settings.paperSounds) return;       // off by default
  if (getAudioMode() !== 'idle') return;   // rules 1 and 2
  if (!ringerAllowsSound()) return;        // Android ringer guard; iOS: always true (Ambient mutes)
  const p = players[name];
  if (!p) return;
  p.seekTo(0);
  p.play();                                // fire and forget; never awaited by UI
}
```

- **Pairing.** Call sites call `haptic(x)` and `playSound(y)` in the same tick, never one from inside the other, so haptics still work with sounds off.
- **Record start sequence.** Tap, then `haptic('recordStart')` and `playSound('record_start')`, wait 140 ms, then switch to `recording` and start the recorder. Switching mid-sound can clip it or bleed it into the take. If the audio spike shows bleed or the 140 ms is felt, drop `record_start` and `record_stop` first.
- **Android ringer guard.** expo-audio does not expose ringer mode. Ship a small Expo module reading `AudioManager.getRingerMode()`, or keep the setting hidden on Android. Also verify the stream and usage expo-audio sets (sonification is preferable to media).
- **Preload.** Six players, about 170 KB, only while the setting is on.
- **Regenerate**: `python3 apps/mobile/assets/sounds/synth.py` (numpy). Output is byte-identical across runs (seeded noise).

## 6. Test checklist

- Silent switch on: no UI sound; Read together still plays.
- Music from another app playing: UI sound mixes, music never pauses or ducks.
- Record a letter with sounds on: no tick audible in the saved audio, start or end.
- Tap Next mid-letter in Read together: letter stops, then page turn; never both.
- 50% volume, 1 m from a cot: `sealed` barely audible.
