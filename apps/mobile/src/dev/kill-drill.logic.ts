/**
 * The kill drill's protocol (RA-19-04; DEVICE_TEST_PLAN DL-01 and DL-02; DATA-REQ-048, F04-REQ-024).
 * Pure, so Node tests check it; the host harness keeps the same names in
 * `apps/mobile/e2e/kill/protocol.mjs`, and `apps/mobile/test/qa-kill-harness.test.ts` fails if the two differ.
 *
 * E2E builds only: nothing reads this unless `src/dev/e2e-seams.ts` compiled the seam in.
 *
 * How a run talks to the host: the app writes small JSON markers into Library/Caches/kill-drill (the
 * launch sweep never looks there) and the host polls for them from outside the simulator:
 * - `boot-<run>.json` once this launch's sweep has finished (the host then checks the previous run);
 * - `armed-<run>.json` the moment the timed action starts (DL-02: Save; DL-01: the microphone is live);
 * - `done-<run>.json` when the save returned (DL-02 only; it tells a kill after the save from one inside it);
 * - `error-<run>.json` when the drill could not run (for example no microphone on this host).
 * Markers carry run numbers, ids and hashes, never letter words other than the drill line below.
 */

export const DRILL_MODES = ['setup', 'verify', 'dl01', 'dl02'] as const;
export type DrillMode = (typeof DRILL_MODES)[number];

/** DL-02 kinds: a typed letter; a spoken letter hashed at Finish; a spoken letter whose hash is made during Save. */
export const DRILL_KINDS = ['typed', 'spoken', 'spoken-unhashed'] as const;
export type DrillKind = (typeof DRILL_KINDS)[number];

/** Planted failures for the harness self-check. `none` is the real drill. */
export const DRILL_PLANTS = ['none', 'loss', 'double'] as const;
export type DrillPlant = (typeof DRILL_PLANTS)[number];

/** Launch argument names (iOS puts `-name value` arguments in NSUserDefaults; react-native `Settings.get` reads them). */
export const DRILL_ARG = { mode: 'e2eKillDrill', run: 'e2eKillRun', kind: 'e2eKillKind', plant: 'e2eKillPlant' } as const;

/** Folder under Library/Caches for markers and the host's audio fixture. */
export const MARKER_DIR = 'kill-drill';
/** The host copies a generated tone (never a voice) here before spoken DL-02 runs. */
export const FIXTURE_FILE = 'fixture.m4a';
/** Folder under Documents where expo-audio writes takes (`ExpoAudio/recording-<uuid>.m4a`); spoken drill files go there too. */
export const TAKE_DIR = 'ExpoAudio';
/** The planted loss holds the letter in neither table for this long; every DL-02 kill delay must be shorter. */
export const PLANT_LOSS_GAP_MS = 3000;

export interface DrillArgs {
  mode: DrillMode;
  run: number;
  kind: DrillKind;
  plant: DrillPlant;
}

export type MarkerKind = 'boot' | 'armed' | 'done' | 'error';

export function markerName(kind: MarkerKind, run: number): string {
  return `${kind}-${run}.json`;
}

/** The only words a drill letter holds: the fictional child and the run number. */
export function drillText(run: number): string {
  return `Asha kill drill ${run}`;
}

/** File name of a spoken DL-02 letter's recording, under Documents/ExpoAudio. */
export function drillAudioName(run: number): string {
  return `kill-drill-${run}.m4a`;
}

function pick<T extends string>(all: readonly T[], raw: unknown, fallback: T): T | null {
  if (raw === undefined || raw === null || raw === '') return fallback;
  const v = String(raw);
  return (all as readonly string[]).includes(v) ? (v as T) : null;
}

/**
 * Reads the drill's launch arguments. Null (no drill) unless the mode is known and the run is a whole
 * number from 0 up; an unknown kind or plant also means no drill, so a typo never runs something else.
 */
export function parseDrillArgs(get: (key: string) => unknown): DrillArgs | null {
  const mode = pick(DRILL_MODES, get(DRILL_ARG.mode), '' as DrillMode);
  if (!mode) return null;
  const rawRun = get(DRILL_ARG.run);
  const run = typeof rawRun === 'number' ? rawRun : Number.parseInt(String(rawRun ?? ''), 10);
  if (!Number.isInteger(run) || run < 0 || String(rawRun).trim() !== String(run)) return null;
  const kind = pick(DRILL_KINDS, get(DRILL_ARG.kind), 'typed');
  const plant = pick(DRILL_PLANTS, get(DRILL_ARG.plant), 'none');
  if (!kind || !plant) return null;
  return { mode, run, kind, plant };
}

/** What `armed-<run>.json` holds. `sha256` is the recording's hash for spoken DL-02 runs (the fixture's). */
export interface ArmedMarker {
  run: number;
  mode: 'dl01' | 'dl02';
  kind: DrillKind | null;
  plant: DrillPlant;
  draftId: string;
  audioFile: string | null;
  text: string | null;
  sha256: string | null;
  at: string;
}
