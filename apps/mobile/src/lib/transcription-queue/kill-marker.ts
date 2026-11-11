/**
 * Which ends of the app count as a memory failure of the large model (BL-572, APP-12; tiers.ts, TDD 03 5.2).
 * Pure: no React Native, tested in Node.
 *
 * iOS ends an app for memory (jetsam) with no error to catch, and gives the app no way to read, at the next launch,
 * why the last run ended: the per-launch reason is not public. (MetricKit's app exit counts arrive about once a day,
 * aggregated, with no link to a run.) So the queue writes a marker while the large model runs and reads it at the
 * next launch. The signal is where the app was when it ended:
 * - `foreground`: the app was active, on screen, with the model running. Swiping an app away needs the app switcher,
 *   and the app switcher makes the app inactive first, which rewrites the marker to `away`. An end while active is
 *   a memory kill (or a crash, which we cannot tell apart here; both mean the model is not safe on this phone).
 * - `away`: the app was inactive or in the background (the queue stops its job on background, and an end there is
 *   a swipe-away, an app update, or the system reclaiming a suspended app). It never counts.
 * A marker left by a build before BL-572 holds '1' and does not say where the app was, so it does not count either.
 *
 * A model that will not load (`model_load_failed`) still counts, as before (index.ts).
 */

export const RUNNING_MARKER = 'speech.jobRunning';

export type RunningMarker = 'foreground' | 'away';

/** The marker to write while the large model runs: `foreground` only while the app is active. */
export function runningMarker(appActive: boolean): RunningMarker {
  return appActive ? 'foreground' : 'away';
}

/** A marker found at launch counts as one memory failure only when the app ended while active with the model running. */
export function countsAsMemoryKill(found: string | null): boolean {
  return found === 'foreground';
}
