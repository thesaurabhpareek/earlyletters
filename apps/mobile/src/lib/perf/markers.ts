/**
 * Content-free performance markers (NS-34-R6; MEASUREMENT-PLAN.md section 4; BL-929 H1).
 *
 * A marker is an event name from the closed list below and one number of milliseconds, kept in a ring in memory.
 * Never a letter, a name, a path, an id, a query, a date of birth or a file name. Nothing here logs, uploads or
 * reaches analytics: the only way out is `exportRun`, which the dev-only export button shares to the founder's own
 * Mac. Fail closed: unless EXPO_PUBLIC_PERF is literally "on", `mark` does nothing.
 *
 * Not wired into any screen or EAS profile yet (the `perf` profile needs the founder's approval): until app code
 * calls `mark`, a store bundle holds this module only if something imports it. Call sites must be a literal event
 * and a number; perf-markers.test.ts scans src for any other form.
 */

/** The closed list. A new name is added in the PR that uses it, and in MEASUREMENT-PLAN.md section 4. */
export const PERF_EVENTS = [
  'launch_first_frame',
  'launch_interactive',
  'speak_tap_to_mic',
  'save_commit',
  'book_first_render',
  'book_scroll_hitch',
  'find_first_row',
  'copy_decode',
  'migration',
  'index_rebuild',
] as const;

export type PerfEvent = (typeof PERF_EVENTS)[number];
export type PerfMark = { readonly event: PerfEvent; readonly ms: number; readonly t: number };
/** Run header: model, iOS, marketing version, build and EAS fingerprint (NS-34-R3). Short plain tokens only. */
export type PerfHeader = { model: string; ios: string; version: string; build: string; fingerprint: string };

export const RING_SIZE = 2000;

const ring: PerfMark[] = [];
let next = 0;

const isEvent = (e: unknown): e is PerfEvent => typeof e === 'string' && (PERF_EVENTS as readonly string[]).includes(e);

/** Record `ms` for `event`. Drops anything that is not a listed event with a finite number; does nothing when the flag is not "on". */
export function mark(event: PerfEvent, ms: number): void {
  if (process.env.EXPO_PUBLIC_PERF !== 'on') return;
  if (!isEvent(event) || typeof ms !== 'number' || !Number.isFinite(ms) || ms < 0) return;
  const entry: PerfMark = { event, ms, t: performance.now() };
  if (ring.length < RING_SIZE) ring.push(entry);
  else ring[next] = entry;
  next = (next + 1) % RING_SIZE;
}

/** The marks, oldest first. */
export function snapshot(): PerfMark[] {
  return ring.length < RING_SIZE ? ring.slice() : [...ring.slice(next), ...ring.slice(0, next)];
}

export function resetMarks(): void {
  ring.length = 0;
  next = 0;
}

// A header value is a token like "iPhone14,6", "26.0.1" or "a1b2c3": no spaces, slashes, quotes or letters outside it.
const TOKEN = /^[A-Za-z0-9._,-]{1,64}$/;

/**
 * The export: `perf-<UTC start as YYYYMMDDTHHMMSSZ>-<counter>.json` and its text. Throws on a header value that is not a
 * plain token, so a name or a path cannot ride along in it.
 */
export function exportRun(header: PerfHeader, startedAt: Date, counter: number): { name: string; json: string } {
  for (const k of ['model', 'ios', 'version', 'build', 'fingerprint'] as const) {
    if (typeof header[k] !== 'string' || !TOKEN.test(header[k])) throw new Error(`perf header ${k} is not a plain token`);
  }
  if (!Number.isInteger(counter) || counter < 1) throw new Error('perf run counter must be a positive whole number');
  const stamp = startedAt.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
  const { model, ios, version, build, fingerprint } = header;
  return { name: `perf-${stamp}-${counter}.json`, json: JSON.stringify({ header: { model, ios, version, build, fingerprint }, marks: snapshot() }) };
}
