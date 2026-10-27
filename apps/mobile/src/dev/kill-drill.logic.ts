/**
 * The kill drill's protocol and its safety rule (RA-19-04; DEVICE_TEST_PLAN DL-01 and DL-02; DATA-REQ-048,
 * F04-REQ-024). Pure, so Node tests check it; the host harness keeps the same names in
 * `apps/mobile/e2e/kill/protocol.mjs`, and `apps/mobile/test/qa-kill-harness.test.ts` fails if the two differ.
 *
 * E2E builds only: nothing reads this unless `src/dev/e2e-seams.ts` compiled the seam in.
 *
 * How a run talks to the host: the app writes small JSON markers into Library/Caches/kill-drill (the
 * launch sweep never looks there) and the host polls for them from outside the simulator:
 * - `boot-<run>.json` once this launch's sweep has finished. The app then waits for the host's
 *   `go-<run>.json`, so the host judges the previous run while the app is idle;
 * - `armed-<run>.json` when the run's draft exists and the timed part starts (DL-02: Save; DL-01: the
 *   microphone is live);
 * - `point-<run>.json` when a crash-point run reached its point and holds there for the kill;
 * - `done-<run>.json` when the save returned (DL-02 only);
 * - `decoded-<run>.json` when a `decode` launch has read every take the host named in its `go` marker (ADR 0027:
 *   ScribeAudio's probe and decode, and the run's length check, on the kept DL-01 takes; numbers only);
 * - `error-<run>.json` when the drill refused or could not run (no microphone, not a simulator, ...).
 * Markers carry run numbers, ids and hashes, never letter words other than the drill line below.
 */

export const DRILL_MODES = ['setup', 'verify', 'dl01', 'dl02', 'decode'] as const;
export type DrillMode = (typeof DRILL_MODES)[number];

/** DL-02 kinds: a typed letter; a spoken letter hashed at Finish; a spoken letter whose hash is made during Save. */
export const DRILL_KINDS = ['typed', 'spoken', 'spoken-unhashed'] as const;
export type DrillKind = (typeof DRILL_KINDS)[number];

/** Planted failures for the harness self-check. `none` is the real drill. `damage` changes one byte (DL-02, spoken). */
export const DRILL_PLANTS = ['none', 'loss', 'double', 'damage'] as const;
export type DrillPlant = (typeof DRILL_PLANTS)[number];

/**
 * DL-02 crash points: named moments inside a save where the drill stops and waits to be killed.
 * `after-file-write`: the take's file is written and closed, its draft row not yet finalized (spoken only);
 * `before-row`: the hash check is done, the letter row not yet written;
 * `inside-transaction`: the letter row is written and the draft removed, not yet committed;
 * `after-commit`: committed, before the Keychain copy of the letter count.
 */
export const CRASH_POINTS = ['after-file-write', 'before-row', 'inside-transaction', 'after-commit'] as const;
export type CrashPoint = (typeof CRASH_POINTS)[number];
/** What a kill at each point must leave: the draft before the commit, the letter after it. */
export const POINT_EXPECTS: Readonly<Record<CrashPoint, 'draft' | 'letter'>> = {
  'after-file-write': 'draft',
  'before-row': 'draft',
  'inside-transaction': 'draft',
  'after-commit': 'letter',
};
/** The statement `drafts.remove` runs inside `letters.saveFromDraft`'s transaction; the `inside-transaction` point holds right after it. */
export const DRAFT_REMOVE = /^\s*DELETE FROM drafts WHERE id = \?\s*$/;
/** How long a crash-point run holds at its point before it gives up and finishes (the host kills within ms). */
export const POINT_HOLD_MS = 20000;

/** Launch argument names (iOS puts `-name value` arguments in NSUserDefaults; react-native `Settings.get` reads them). */
export const DRILL_ARG = { mode: 'e2eKillDrill', run: 'e2eKillRun', kind: 'e2eKillKind', plant: 'e2eKillPlant', point: 'e2eKillPoint' } as const;

/** Folder under Library/Caches for markers and the host's audio fixture. */
export const MARKER_DIR = 'kill-drill';
/** The host copies a generated tone (never a voice) here before spoken DL-02 runs. */
export const FIXTURE_FILE = 'fixture.m4a';
/** Folder under Documents where expo-audio writes takes (`ExpoAudio/recording-<uuid>.m4a`); spoken drill files go there too. */
export const TAKE_DIR = 'ExpoAudio';
/** The planted loss holds the letter in neither table for this long; every DL-02 kill delay must be shorter. */
export const PLANT_LOSS_GAP_MS = 3000;
/** Device setting the setup launch writes on a fresh install; every later drill launch requires it. */
export const OWNED_SETTING = 'e2eKillDrill.owned';
/** Bundle id suffix of the only build the drill runs in: the development id (`app.config.ts` ID_SUFFIX). */
export const DRILL_BUNDLE_SUFFIX = '.dev';

export interface DrillArgs {
  mode: DrillMode;
  run: number;
  kind: DrillKind;
  plant: DrillPlant;
  point: CrashPoint | null;
}

export type MarkerKind = 'boot' | 'go' | 'armed' | 'point' | 'done' | 'decoded' | 'error';

/**
 * A `decode` launch's `go` marker (ADR 0027, checks V2 and V3, the in-app half): the takes to read, by file name
 * under Documents/ExpoAudio, each with its draft so the run gets the stored progress mark the app would pass.
 */
export interface DecodeRequest {
  run: number;
  files: Array<{ name: string; draftId: string | null }>;
}

/** Only a recording's own file name, no folder: what a decode request may name. */
export const DECODE_FILE_NAME = /^[\w.-]{1,128}\.(aac|m4a)$/;
/** At most this many takes in one decode launch, and the first this many also get a listening copy (`enhance`). */
export const DECODE_LIMIT = 600;
export const ENHANCE_LIMIT = 5;

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

function pick<T extends string>(all: readonly T[], raw: unknown, fallback: T | null): T | null | undefined {
  if (raw === undefined || raw === null || raw === '') return fallback;
  const v = String(raw);
  return (all as readonly string[]).includes(v) ? (v as T) : undefined;
}

/**
 * Reads the drill's launch arguments. Null (no drill) unless the mode is known and the run is a whole
 * number from 0 up; an unknown kind, plant or point also means no drill, so a typo never runs something else.
 */
export function parseDrillArgs(get: (key: string) => unknown): DrillArgs | null {
  const mode = pick(DRILL_MODES, get(DRILL_ARG.mode), null);
  if (!mode) return null;
  const rawRun = get(DRILL_ARG.run);
  const run = typeof rawRun === 'number' ? rawRun : Number.parseInt(String(rawRun ?? ''), 10);
  if (!Number.isInteger(run) || run < 0 || String(rawRun).trim() !== String(run)) return null;
  const kind = pick(DRILL_KINDS, get(DRILL_ARG.kind), 'typed');
  const plant = pick(DRILL_PLANTS, get(DRILL_ARG.plant), 'none');
  const point = pick(CRASH_POINTS, get(DRILL_ARG.point), null);
  if (!kind || !plant || point === undefined) return null;
  if (point && (mode !== 'dl02' || plant !== 'none' || (point === 'after-file-write' && kind === 'typed'))) return null;
  if (plant === 'damage' && (mode !== 'dl02' || kind === 'typed')) return null;
  return { mode, run, kind, plant, point };
}

/**
 * Defence in depth (reviewer S, #203): even when the seam is compiled in, the drill refuses to arm unless it
 * runs on a simulator, in the development bundle, on an install it made itself. Checked before it touches the
 * 18+ gate, adds a child or opens the microphone.
 */
export function decideDrillGuard(s: {
  mode: DrillMode;
  isDevice: boolean | null;
  bundleId: string | null;
  drillBundleId: string;
  hasChild: boolean;
  owned: boolean;
}): { ok: true } | { ok: false; code: string } {
  if (s.isDevice !== false) return { ok: false, code: 'refused_not_simulator' };
  if (s.bundleId !== s.drillBundleId) return { ok: false, code: 'refused_bundle_id' };
  if (s.mode === 'setup') return s.hasChild && !s.owned ? { ok: false, code: 'refused_not_drill_install' } : { ok: true };
  return s.owned ? { ok: true } : { ok: false, code: 'refused_not_drill_install' };
}

/** What `armed-<run>.json` holds. `sha256` is the app's hash of its fixture copy (the host compares with its own). */
export interface ArmedMarker {
  run: number;
  mode: 'dl01' | 'dl02';
  kind: DrillKind | null;
  plant: DrillPlant;
  point: CrashPoint | null;
  draftId: string;
  audioFile: string | null;
  text: string | null;
  sha256: string | null;
  /** DL-01: the recorder's elapsed time when the marker was written, so the host can tell the take's expected length. */
  recordedMs: number | null;
  at: string;
}
