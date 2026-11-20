/**
 * Crash capture, built but OFF (founder, 20 Nov 2026). Flipping it later is one
 * edit: `enabled: true` below, then a consent-sheet line and the label (privacy,
 * not code). Until then the consent sheet must not claim crash sharing and the
 * SDK is built with exception autocapture off.
 *
 * Only uncaught exceptions and unhandled rejections; no console capture; no
 * native crashes (those need `@posthog/react-native-plugin` and symbol upload,
 * a later decision). Whatever the SDK captures goes through `reduceExceptionEvent`
 * in `before_send`: an error class, stack frames, app version and OS fields.
 * The message text and anything the caller attached are dropped, because an
 * error message can quote a date or a name (OBSERVABILITY-WITHOUT-CONTENT).
 */
import { isPiiLike } from './pii';

export const CRASH_REPORTING = {
  /** THE flip. false: no `$exception` event is ever built or sent. */
  enabled: false,
  autocapture: {
    uncaughtExceptions: true,
    unhandledRejections: true,
    console: [] as never[],
    nativeCrashes: false,
  },
} as const;

/** The `errorTracking` constructor option for the SDK. */
export function errorTrackingOptions(enabled: boolean = CRASH_REPORTING.enabled) {
  if (!enabled) return { autocapture: false, exceptionSteps: { enabled: false } } as const;
  return { autocapture: { ...CRASH_REPORTING.autocapture }, exceptionSteps: { enabled: false } } as const;
}

/** Error classes we let through by name. Anything else is reported as plain `Error`. Add our own classes here, never from data. */
export const KNOWN_ERROR_CLASSES: readonly string[] = [
  'Error',
  'TypeError',
  'RangeError',
  'ReferenceError',
  'SyntaxError',
  'EvalError',
  'URIError',
  'AggregateError',
];

type Rec = Record<string, unknown>;
const isRec = (v: unknown): v is Rec => typeof v === 'object' && v !== null && !Array.isArray(v);

const SAFE_FUNCTION = /^[A-Za-z0-9_$.<>[\] ]{1,80}$/;
const SAFE_FILE = /^[A-Za-z0-9_.$-]{1,80}$/;

function reduceFrame(frame: unknown): Rec | null {
  if (!isRec(frame)) return null;
  const out: Rec = {};
  if (typeof frame.filename === 'string') {
    // The last path segment only: a path can hold a per-install folder id or a user name.
    const base = frame.filename.split(/[\\/]/).pop()?.split('?')[0] ?? '';
    if (SAFE_FILE.test(base) && !isPiiLike(base)) out.filename = base;
  }
  if (typeof frame.function === 'string' && SAFE_FUNCTION.test(frame.function) && !isPiiLike(frame.function)) out.function = frame.function;
  for (const k of ['lineno', 'colno'] as const) {
    const n = frame[k];
    if (typeof n === 'number' && Number.isInteger(n) && n >= 0 && n < 10_000_000) out[k] = n;
  }
  if (typeof frame.in_app === 'boolean') out.in_app = frame.in_app;
  if (typeof frame.platform === 'string' && /^[a-z:]{1,30}$/.test(frame.platform)) out.platform = frame.platform;
  return out;
}

/** Reduce one entry of `$exception_list` to class and frames. No `value` (the message), no `module`, no `vars`, no context lines. */
function reduceException(entry: unknown): Rec | null {
  if (!isRec(entry)) return null;
  const type = typeof entry.type === 'string' && KNOWN_ERROR_CLASSES.includes(entry.type) ? entry.type : 'Error';
  const out: Rec = { type };
  if (isRec(entry.mechanism)) {
    const m: Rec = {};
    if (typeof entry.mechanism.handled === 'boolean') m.handled = entry.mechanism.handled;
    if (typeof entry.mechanism.synthetic === 'boolean') m.synthetic = entry.mechanism.synthetic;
    if (typeof entry.mechanism.type === 'string' && /^[a-z_]{1,30}$/.test(entry.mechanism.type)) m.type = entry.mechanism.type;
    out.mechanism = m;
  }
  const frames = isRec(entry.stacktrace) && Array.isArray(entry.stacktrace.frames) ? entry.stacktrace.frames : [];
  out.stacktrace = { type: 'raw', frames: frames.slice(-50).map(reduceFrame).filter((f): f is Rec => f !== null) };
  return out;
}

/**
 * The `before_send` reducer for `$exception`. Keeps: `$exception_list` reduced as above, `$exception_level`,
 * the SDK fields on `sdkAllowed` (app version and build, OS name and version, coarse device type, ids the SDK
 * needs). Drops everything else: `$exception_message`, `$exception_values`, `$exception_steps`, fingerprints,
 * and any property the caller passed to `captureException`. Never returns person properties.
 */
export function reduceExceptionEvent<E extends { event: string; properties?: Rec; [k: string]: unknown }>(evt: E, sdkAllowed: readonly string[]): E | null {
  const props = evt.properties ?? {};
  const list = Array.isArray(props.$exception_list) ? props.$exception_list.map(reduceException).filter((e): e is Rec => e !== null) : [];
  if (list.length === 0) return null;
  const keep: Rec = {};
  for (const k of sdkAllowed) if (k in props && k.startsWith('$') && typeof props[k] !== 'object') keep[k] = props[k];
  for (const k of ['distinct_id', 'token']) if (typeof props[k] === 'string') keep[k] = props[k];
  keep.$exception_list = list;
  keep.$exception_level = props.$exception_level === 'fatal' ? 'fatal' : 'error';
  const out: Rec = { event: evt.event };
  if (evt.uuid !== undefined) out.uuid = evt.uuid;
  if (evt.timestamp !== undefined) out.timestamp = evt.timestamp;
  out.properties = keep;
  return out as E;
}
