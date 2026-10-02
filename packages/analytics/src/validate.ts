/**
 * Allowlist enforcement: the `before_send` contract from ADR 0008 and
 * LEGAL-REQ-017, implemented once and used by the client and by the PostHog
 * SDK hook.
 *
 * Fail-closed policy:
 * - unknown event                     -> whole event dropped
 * - unknown property                  -> property stripped
 * - known property, wrong type/range  -> property stripped
 * - any string that looks like PII,
 *   or any string over 40 characters  -> whole event dropped (it means a
 *                                        caller is passing something it
 *                                        should not have; never guess)
 *
 * Violation reports never include the offending value, because the value is
 * exactly what must not leave the device (or reach a dev log).
 */
import { EVENTS, GLOBAL_PROPS, type EventName } from './catalog';
import type { PropSpec } from './schema';

export const MAX_STRING_LENGTH = 40;

export type ViolationKind =
  | 'unknown_event'
  | 'unknown_property'
  | 'invalid_value'
  | 'string_too_long'
  | 'pii_like_value'
  | 'free_text'
  | 'queue_overflow';

export interface Violation {
  kind: ViolationKind;
  event: string;
  /** Property key if it is a catalogue key; else '<unlisted>'. Never a value. */
  property?: string;
}

export type Props = Record<string, string | number | boolean>;

export interface SanitizeResult {
  /** null when the whole event must be dropped. */
  props: Props | null;
  violations: Violation[];
}

/**
 * Every property key used anywhere in the catalogue. Violation reports name
 * a key only if it is on this list; any other key could itself be data
 * (`{ [childName]: true }`), so it is reported as '<unlisted>'.
 */
const KNOWN_KEYS: ReadonlySet<string> = new Set([
  ...Object.values(EVENTS).flatMap((e) => Object.keys(e.props)),
  ...Object.keys(GLOBAL_PROPS),
]);

function safeKey(key: string): string {
  return KNOWN_KEYS.has(key) ? key : '<unlisted>';
}

/** Unknown event names are never echoed, for the same reason. */
function safeEvent(name: string): string {
  return isKnownEvent(name) ? name : '<unlisted>';
}

const PII_PATTERNS: readonly RegExp[] = [
  /[^\s@]+@[^\s@]+\.[^\s@]+/, // email
  /(?:\+?\d[\s().-]?){7,}/, // phone-like digit run
  /\bhttps?:\/\//i, // URL
  /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i, // uuid
  /\b\d{4}-\d{2}-\d{2}\b/, // ISO date (birthdays, due dates)
  /\b\d{1,2}[/.]\d{1,2}[/.]\d{2,4}\b/, // other dates
  /eyJ[A-Za-z0-9_-]{10,}/, // JWT
  /\b[A-Za-z0-9_-]{32,}\b/, // long token-like blob
];

/**
 * True for strings that look like contact details, ids, tokens, dates or
 * prose. Enum values are snake_case, so anything with whitespace or capitals
 * is treated as free text by the caller before this runs.
 */
export function isPiiLike(value: string): boolean {
  return PII_PATTERNS.some((re) => re.test(value));
}

/** Enum values are lower snake_case words or bucket labels like `2_4`. */
const ENUM_SHAPE = /^[a-z0-9]+(?:_[a-z0-9]+)*$/;

type Check = { ok: true } | { ok: false; kind: ViolationKind; dropEvent: boolean };

function checkValue(spec: PropSpec, value: unknown): Check {
  if (typeof value === 'string') {
    if (value.length > MAX_STRING_LENGTH) return { ok: false, kind: 'string_too_long', dropEvent: true };
    if (isPiiLike(value)) return { ok: false, kind: 'pii_like_value', dropEvent: true };
    if (!ENUM_SHAPE.test(value)) return { ok: false, kind: 'free_text', dropEvent: true };
    if (spec.type !== 'enum' || !spec.values.includes(value)) {
      return { ok: false, kind: 'invalid_value', dropEvent: false };
    }
    return { ok: true };
  }
  if (typeof value === 'boolean') {
    return spec.type === 'bool' ? { ok: true } : { ok: false, kind: 'invalid_value', dropEvent: false };
  }
  if (typeof value === 'number') {
    if (spec.type !== 'int' || !Number.isInteger(value) || value < spec.min || value > spec.max) {
      return { ok: false, kind: 'invalid_value', dropEvent: false };
    }
    return { ok: true };
  }
  // null, undefined, objects, arrays, functions: never allowed.
  return { ok: false, kind: 'invalid_value', dropEvent: false };
}

export function isKnownEvent(name: string): name is EventName {
  return Object.prototype.hasOwnProperty.call(EVENTS, name);
}

/**
 * Validates one event against the catalogue (event props plus GLOBAL_PROPS).
 * Returns the cleaned props, or null when the event must not be sent.
 */
export function sanitizeEvent(name: string, input: unknown): SanitizeResult {
  const violations: Violation[] = [];
  if (!isKnownEvent(name)) {
    violations.push({ kind: 'unknown_event', event: safeEvent(name) });
    return { props: null, violations };
  }
  const specs: Record<string, PropSpec> = { ...EVENTS[name].props, ...GLOBAL_PROPS };
  const out: Props = {};
  const record = input && typeof input === 'object' ? (input as Record<string, unknown>) : {};

  for (const [key, value] of Object.entries(record)) {
    if (value === undefined) continue;
    const spec = Object.prototype.hasOwnProperty.call(specs, key) ? specs[key] : undefined;
    if (!spec) {
      // Even an unknown property gets the PII screen: a leaking caller is a
      // bug worth dropping the whole event for.
      if (typeof value === 'string' && (value.length > MAX_STRING_LENGTH || isPiiLike(value))) {
        violations.push({ kind: isPiiLike(value) ? 'pii_like_value' : 'string_too_long', event: name, property: safeKey(key) });
        return { props: null, violations };
      }
      violations.push({ kind: 'unknown_property', event: name, property: safeKey(key) });
      continue;
    }
    const check = checkValue(spec, value);
    if (!check.ok) {
      violations.push({ kind: check.kind, event: name, property: key });
      if (check.dropEvent) return { props: null, violations };
      continue;
    }
    out[key] = value as string | number | boolean;
  }
  return { props: out, violations };
}

// ---------------------------------------------------------------------------
// SDK-level filter (PostHog `before_send`)
// ---------------------------------------------------------------------------

/**
 * SDK-added properties we accept. Everything else starting with `$` is
 * dropped: notably `$device_name` (often "<Name>'s iPhone"), `$timezone` and
 * `$locale` (coarse location; LEGAL-REQ-012 bans location), `$screen_name`,
 * `$network_carrier`, and `$set` / `$set_once` (person properties,
 * LEGAL-REQ-017). Verify this list against the SDK version in staging: if
 * ingestion needs a field that is missing here, add it with a reason.
 */
export const ALLOWED_SDK_PROPERTIES: readonly string[] = [
  'distinct_id',
  'token',
  '$lib',
  '$lib_version',
  '$os',
  '$os_name',
  '$os_version',
  '$app_version',
  '$app_build',
  '$device_type',
  '$session_id',
  '$anon_distinct_id',
  '$process_person_profile',
  '$geoip_disable',
];

/** SDK-internal events we let through (no properties beyond the above). */
export const ALLOWED_SDK_EVENTS: readonly string[] = ['$identify'];

export interface OutgoingEvent {
  event: string;
  properties?: Record<string, unknown>;
  [key: string]: unknown;
}

/**
 * Last line of defence, run by the SDK right before upload. Returns null to
 * drop. Splits SDK `$` properties (allowlisted above) from catalogue
 * properties (validated by `sanitizeEvent`).
 */
export function sanitizeOutgoing(
  evt: OutgoingEvent,
  onViolation?: (v: Violation) => void,
): OutgoingEvent | null {
  const sdkEvent = ALLOWED_SDK_EVENTS.includes(evt.event);
  if (!sdkEvent && !isKnownEvent(evt.event)) {
    onViolation?.({ kind: 'unknown_event', event: safeEvent(evt.event) });
    return null;
  }
  const sdkProps: Record<string, unknown> = {};
  const ours: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(evt.properties ?? {})) {
    if (ALLOWED_SDK_PROPERTIES.includes(k)) {
      if (typeof v === 'string' && isPiiLike(v) && k !== 'distinct_id' && k !== '$anon_distinct_id' && k !== '$session_id' && k !== 'token') {
        onViolation?.({ kind: 'pii_like_value', event: evt.event, property: k });
        return null;
      }
      sdkProps[k] = v;
    } else if (!k.startsWith('$') && !sdkEvent) {
      ours[k] = v;
    }
  }
  if (sdkEvent) return { ...evt, properties: sdkProps };
  const { props, violations } = sanitizeEvent(evt.event, ours);
  violations.forEach((v) => onViolation?.(v));
  if (!props) return null;
  return { ...evt, properties: { ...sdkProps, ...props } };
}
