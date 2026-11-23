/**
 * PII-shaped string detection, shared by the allowlist (validate.ts) and the
 * crash reducer (crash.ts). No import, so there is no cycle. This is the only
 * copy: validate.ts re-exports it.
 *
 * It finds SHAPES (contact details, ids, links, files, paths, dates, handles,
 * vendor keys). It cannot find a name: "Asha" is a word like any other, so
 * names are kept out by shape rules elsewhere (enum values are lower snake
 * case; a crash function name must fit a closed shape, crash.ts) and by never
 * sending free text at all.
 */
const MONTH =
  '(?:jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|june?|july?|aug(?:ust)?|sept?(?:ember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)';
const SEP = '[\\s_.,-]*';

export const PII_PATTERNS: readonly RegExp[] = [
  /[^\s@]+@[^\s@]+\.[^\s@]+/, // email
  /(?:\+?\d[\s().-]?){7,}/, // phone-like digit run
  /\bhttps?:\/\//i, // URL
  /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i, // uuid
  /\b\d{4}-\d{2}-\d{2}\b/, // ISO date (birthdays, due dates)
  /\b\d{1,2}[/.]\d{1,2}[/.]\d{2,4}\b/, // other dates
  /eyJ[A-Za-z0-9_-]{10,}/, // JWT
  /\b[A-Za-z0-9_-]{32,}\b/, // long token-like blob
  /\b(?:[a-z][a-z0-9+.-]{1,20}:\/\/|(?:mailto|tel|sms|file|blob|data|content|intent|javascript):)/i, // non-http scheme
  /\b(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+(?:com|net|org|io|app|dev|xyz|info|biz|edu|gov|online|site|link|us|uk|eu|ca|de|fr)\b/i, // bare host
  /\.(?:m4a|wav|mp3|aac|caf|aiff?|ogg|opus|flac|amr|3gp|mp4|mov|m4v|heic|heif|jpe?g|png|gif|webp|bmp|tiff?)(?![a-z0-9])/i, // audio, video and image file name
  /(?:^|[\s"'=(])(?:\/(?:users|var|private|data|storage|sdcard|home|volumes|mnt|tmp|documents|library)\/|~\/|[a-z]:\\)|\\users\\|\/containers\/data\/|\bstorage\/emulated\b/i, // device path
  new RegExp(`(?<![a-z])${MONTH}${SEP}(?:\\d{1,2}(?:st|nd|rd|th)?(?![a-z0-9])|(?:19|20)\\d{2}(?![a-z0-9]))|(?<![a-z0-9])\\d{1,2}(?:st|nd|rd|th)?${SEP}(?:of${SEP})?${MONTH}(?![a-z])`, 'i'), // written date
  /(?<![A-Za-z0-9_.])@[A-Za-z0-9_.]{2,}/, // handle
  /\b[A-Za-z]{2,15}['\u2019]s\b/, // possessive name ("Asha's")
  /[a-z]['\u2019]?s[_ -]?(?:iphone|ipad|ipod|macbook|galaxy|pixel)\b/i, // device name ("ashas_iPhone")
  /\b(?:ph[cx]_[A-Za-z0-9]{6,}|sk_(?:live|test)_[A-Za-z0-9]{6,}|[pr]k_(?:live|test)_[A-Za-z0-9]{6,}|sb_(?:publishable|secret)_[A-Za-z0-9_-]{6,}|AKIA[0-9A-Z]{12,}|gh[pousr]_[A-Za-z0-9]{20,}|github_pat_[A-Za-z0-9_]{20,}|xox[abprs]-[A-Za-z0-9-]{8,}|AIza[0-9A-Za-z_-]{20,}|(?:appl|goog|amzn)_[A-Za-z]{10,}|bearer\s+[A-Za-z0-9._~+\/=-]{8,})/i, // vendor key
];

/**
 * True for strings that look like contact details, ids, tokens, dates or
 * prose. Enum values are snake_case, so anything with whitespace or capitals
 * is treated as free text by the caller before this runs.
 */
export function isPiiLike(value: string): boolean {
  return PII_PATTERNS.some((re) => re.test(value));
}


/** Same limit as MAX_STRING_LENGTH in validate.ts (V13); kept here so this file stays import-free. */
const SDK_VALUE_MAX = 40;

/**
 * The two identity keys PostHog needs to ingest an event. They are not `$` keys and are not one of the ten:
 * `distinct_id` must be the random consent id (a uuid, the one uuid V13 allows) and `token` a `phc_` project
 * key; any other shape drops the event.
 */
export const IDENTITY_PROPERTIES: readonly string[] = ['distinct_id', 'token'];

const UUID_SHAPE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const PROJECT_KEY_SHAPE = /^phc_[A-Za-z0-9]{10,100}$/;

/** True when an identity key holds a value of the one shape it may have. */
export function identityValueOk(key: string, value: unknown): boolean {
  if (typeof value !== 'string') return false;
  return key === 'distinct_id' ? UUID_SHAPE.test(value) : key === 'token' ? PROJECT_KEY_SHAPE.test(value) : false;
}

/** `$session_id` is a random uuid the SDK makes for one foreground session, so it is the one `$` value exempt from the PII screen. */
const UUID_SDK_KEYS: readonly string[] = ['$session_id'];

/** Version-like keys are checked by shape: a build such as `1.0.10` looks like a day.month.year date to the PII screen. */
const VERSION_SDK_KEYS: readonly string[] = ['$app_version', '$app_build', '$os_version', '$lib_version'];
const VERSION_SHAPE = /^\d{1,6}(?:\.\d{1,6}){0,3}$/;

/** True when a `$` SDK value may be kept: a plain scalar, short, and not PII-shaped (the session uuid excepted). */
export function sdkValueOk(key: string, value: unknown): boolean {
  if (typeof value === 'boolean' || typeof value === 'number') return true;
  if (typeof value !== 'string' || value.length > SDK_VALUE_MAX) return false;
  if (UUID_SDK_KEYS.includes(key)) return UUID_SHAPE.test(value);
  if (VERSION_SDK_KEYS.includes(key)) return VERSION_SHAPE.test(value);
  return !isPiiLike(value);
}

