// The kill drill protocol, host side. Mirrors apps/mobile/src/dev/kill-drill.logic.ts (the app side);
// apps/mobile/test/qa-kill-harness.test.ts fails if the two differ.

export const DRILL_MODES = ['setup', 'verify', 'dl01', 'dl02'];
export const DRILL_KINDS = ['typed', 'spoken', 'spoken-unhashed'];
export const DRILL_PLANTS = ['none', 'loss', 'double', 'damage'];
export const CRASH_POINTS = ['after-file-write', 'before-row', 'inside-transaction', 'after-commit'];
export const POINT_EXPECTS = {
  'after-file-write': 'draft',
  'before-row': 'draft',
  'inside-transaction': 'draft',
  'after-commit': 'letter',
};
export const DRILL_ARG = { mode: 'e2eKillDrill', run: 'e2eKillRun', kind: 'e2eKillKind', plant: 'e2eKillPlant', point: 'e2eKillPoint' };
export const MARKER_DIR = 'kill-drill';
export const FIXTURE_FILE = 'fixture.m4a';
export const TAKE_DIR = 'ExpoAudio';
export const PLANT_LOSS_GAP_MS = 3000;
export const POINT_HOLD_MS = 20000;
export const DRILL_BUNDLE_SUFFIX = '.dev';

/** @param {'boot'|'go'|'armed'|'point'|'done'|'error'} kind @param {number} run */
export function markerName(kind, run) {
  return `${kind}-${run}.json`;
}

/** @param {number} run */
export function drillText(run) {
  return `Asha kill drill ${run}`;
}

/** @param {number} run */
export function drillAudioName(run) {
  return `kill-drill-${run}.m4a`;
}

/**
 * The launch arguments for one run, as `xcrun simctl launch` passes them (`-name value`).
 * @param {{ mode: string, run: number, kind?: string, plant?: string, point?: string|null }} a
 * @returns {string[]}
 */
export function launchArgs(a) {
  const out = [`-${DRILL_ARG.mode}`, a.mode, `-${DRILL_ARG.run}`, String(a.run)];
  if (a.kind) out.push(`-${DRILL_ARG.kind}`, a.kind);
  out.push(`-${DRILL_ARG.plant}`, a.plant ?? 'none');
  if (a.point) out.push(`-${DRILL_ARG.point}`, a.point);
  return out;
}

/** Same rule as the app's fileNameOf (lib/capture/sweep.logic.ts): the last path segment, decoded. */
export function fileNameOf(uri) {
  const clean = String(uri).split(/[?#]/)[0].replace(/\/+$/, '');
  const last = clean.slice(clean.lastIndexOf('/') + 1);
  try {
    return decodeURIComponent(last);
  } catch {
    return last;
  }
}
