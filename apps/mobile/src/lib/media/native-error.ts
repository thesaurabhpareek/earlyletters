/**
 * Native errors cross the bridge as a closed code and nothing else (NX-39 v2 R50; SEC-ML-5; BL-862).
 *
 * A PhotoKit, picker, transcoder or scheduler failure can arrive as an error whose message holds a file path, an asset
 * identifier, a place or a date (an NSError's description and userInfo do). That text must never reach a log, a
 * breadcrumb, a crash report or an analytics property. So media code catches an error and does only this:
 *
 *     } catch (e) {
 *       throw new MediaNativeError(toNativeErrorCode(e));
 *     }
 *
 * `toNativeErrorCode` reads the error's `name`, `code` and `domain` (identifiers the platform defines, never text a
 * person or a file supplied) against a small literal table, and returns one of NATIVE_ERROR_CODES. It never reads the
 * message, the stack, `userInfo` or `cause`. `MediaNativeError` carries the code as its whole message and keeps no
 * cause. The scanner (test/support/media-scan.ts, rule `catch-leak`) fails the build if media code uses a caught error
 * any other way.
 *
 * The table below is the part that is UNVERIFIED: the NSError and Expo code names are from memory of the platform
 * documentation and no module that throws them is installed yet. A name that is wrong only costs a more specific code
 * (the error maps to `unknown`); it can never leak, because the output set is closed. The first pull request that
 * installs a media package checks each line against that package's source.
 */

export const NATIVE_ERROR_CODES = [
  'permission_denied',
  'cancelled',
  'icloud_unavailable',
  'no_space',
  'file_missing',
  'decode_failed',
  'transcode_failed',
  'timeout',
  'unavailable',
  'unknown',
] as const;

export type NativeErrorCode = (typeof NATIVE_ERROR_CODES)[number];

/** `name`, `code` or `domain:code` as the platform spells it, to our code. Keys are compared exactly. */
const TABLE: Readonly<Record<string, NativeErrorCode>> = {
  // JavaScript and Node.
  AbortError: 'cancelled',
  ENOSPC: 'no_space',
  ENOENT: 'file_missing',
  ETIMEDOUT: 'timeout',
  // PhotoKit (UNVERIFIED numbers; see the header).
  'PHPhotosErrorDomain:3072': 'cancelled',
  'PHPhotosErrorDomain:3164': 'icloud_unavailable',
  'PHPhotosErrorDomain:3310': 'permission_denied',
  'PHPhotosErrorDomain:3311': 'permission_denied',
  // Expo modules (UNVERIFIED names).
  ERR_NO_PERMISSIONS: 'permission_denied',
  E_PERMISSION_MISSING: 'permission_denied',
  ERR_CANCELED: 'cancelled',
  E_PICKER_CANCELLED: 'cancelled',
};

const isCode = (v: unknown): v is string | number => typeof v === 'string' || typeof v === 'number';

/** One of the closed codes for any thrown value. Never reads the message, stack, userInfo or cause. */
export function toNativeErrorCode(error: unknown): NativeErrorCode {
  if (error instanceof MediaNativeError) return error.code;
  if (typeof error !== 'object' || error === null) return 'unknown';
  const e = error as { name?: unknown; code?: unknown; domain?: unknown };
  const keys: string[] = [];
  if (isCode(e.domain) && isCode(e.code)) keys.push(`${e.domain}:${e.code}`);
  if (isCode(e.code)) keys.push(String(e.code));
  if (typeof e.name === 'string') keys.push(e.name);
  for (const k of keys) {
    // Own table keys only: a thrown value's text can never select a code the table does not list.
    const hit = Object.prototype.hasOwnProperty.call(TABLE, k) ? TABLE[k] : undefined;
    if (hit) return hit;
  }
  return 'unknown';
}

/** The only error media code throws out of a native call. Its message is its code; it keeps no cause. */
export class MediaNativeError extends Error {
  readonly code: NativeErrorCode;

  constructor(code: NativeErrorCode) {
    const closed = (NATIVE_ERROR_CODES as readonly string[]).includes(code) ? code : 'unknown';
    super(closed);
    this.name = 'MediaNativeError';
    this.code = closed;
  }

  toJSON(): { code: NativeErrorCode } {
    return { code: this.code };
  }
}
