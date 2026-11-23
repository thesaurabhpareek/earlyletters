/**
 * Crash capture, built but OFF (founder, 20 Nov 2026). Flipping it later is one
 * edit: `enabled: true` below, then a consent-sheet line and the label (privacy,
 * not code). Until then the consent sheet must not claim crash sharing and the
 * SDK is built with exception autocapture off.
 *
 * Only uncaught exceptions and unhandled rejections; no console capture; no
 * native crashes (those need `@posthog/react-native-plugin` and symbol upload,
 * a later decision). Whatever the SDK captures goes through `reduceExceptionEvent`
 * in `before_send` (validate.ts, only while `enabled` is true): an error class, frames from our
 * own bundle only, app version and OS fields.
 * The message text and anything the caller attached are dropped, because an
 * error message can quote a date or a name (OBSERVABILITY-WITHOUT-CONTENT).
 */
import { IDENTITY_PROPERTIES, identityValueOk, isPiiLike, sdkValueOk } from './pii';

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

/**
 * Frames come only from our own app bundle. The names below are the file names a Hermes build gives our bundle
 * (UNVERIFIED until ER-G01 captures a real payload: add the real name there, never a pattern). A frame from any
 * other file (a library, native code, a document the person picked) is dropped whole, so a runtime-derived file
 * name cannot leave the phone.
 */
export const APP_BUNDLE_FILES: readonly string[] = ['app.bundle', 'main.jsbundle', 'index.bundle', 'index.ios.bundle', 'index.android.bundle'];

/**
 * A function name is kept only if it is an identifier path of at most three dotted parts of at most 60 characters
 * (`saveLetter`, `Screen.onPress`, `<anonymous>`): no spaces, brackets, quotes or slashes, so prose cannot pass.
 */
const FUNCTION_SHAPE = /^(?:<anonymous>|[A-Za-z_$][A-Za-z0-9_$]{0,59}(?:\.[A-Za-z_$][A-Za-z0-9_$]{0,59}){0,2})$/;
/** A single short capitalised or all-lowercase word is how a first name looks as an identifier, so it is dropped. */
const NAME_LIKE_FUNCTION = /^(?:[A-Z][a-z]{1,11}|[a-z]{2,8})$/;
/** Plain words that are code, not names, and common enough to be worth keeping. */
const KEEP_SHORT_FUNCTIONS: readonly string[] = ['render', 'App', 'onPress', 'run', 'init', 'main', 'load', 'save', 'open', 'close', 'start', 'stop', 'play', 'pause', 'sync', 'then', 'catch', 'map', 'call', 'apply', 'bind'];

const MEDIA_FILE = /\.(?:m4a|wav|mp3|aac|caf|aiff?|ogg|opus|flac|amr|3gp|mp4|mov|m4v|heic|heif|jpe?g|png|gif|webp|bmp|tiff?)(?![a-z0-9])/i;

function safeFunctionName(name: string): boolean {
  if (!FUNCTION_SHAPE.test(name) || isPiiLike(name) || MEDIA_FILE.test(name)) return false;
  return !NAME_LIKE_FUNCTION.test(name) || KEEP_SHORT_FUNCTIONS.includes(name);
}

function reduceFrame(frame: unknown): Rec | null {
  if (!isRec(frame) || frame.in_app !== true) return null;
  // The last path segment only, query stripped: a path can hold a per-install folder id or a user name.
  const base = typeof frame.filename === 'string' ? (frame.filename.split(/[\\/]/).pop()?.split(/[?#]/)[0] ?? '') : '';
  if (!APP_BUNDLE_FILES.includes(base)) return null;
  const out: Rec = { filename: base };
  if (typeof frame.function === 'string' && safeFunctionName(frame.function)) out.function = frame.function;
  for (const k of ['lineno', 'colno'] as const) {
    const n = frame[k];
    if (typeof n === 'number' && Number.isInteger(n) && n >= 0 && n < 10_000_000) out[k] = n;
  }
  out.in_app = true;
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
  // ER-A11(a): every kept `$` value passes the same screen as a normal event (scalar, 40 characters at most, not PII-shaped).
  for (const k of sdkAllowed) {
    if (!k.startsWith('$') || !(k in props)) continue;
    if (sdkValueOk(k, props[k])) keep[k] = props[k];
  }
  for (const k of IDENTITY_PROPERTIES) {
    if (!(k in props)) continue;
    if (!identityValueOk(k, props[k])) return null; // a wrong-shaped id means a caller is passing something it should not: drop the event
    keep[k] = props[k];
  }
  keep.$exception_list = list;
  keep.$exception_level = props.$exception_level === 'fatal' ? 'fatal' : 'error';
  const out: Rec = { event: evt.event };
  if (evt.uuid !== undefined) out.uuid = evt.uuid;
  if (evt.timestamp !== undefined) out.timestamp = evt.timestamp;
  out.properties = keep;
  return out as E;
}
