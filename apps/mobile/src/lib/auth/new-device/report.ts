/** Device wiring for report.logic.ts: Keychain id, Supabase session token, the function call. */
import * as Crypto from 'expo-crypto';
import { Platform } from 'react-native';
import { secureStorage } from '../../supabase/secure-storage';
import type { SupabaseLike } from '../../supabase/client';
import { newDeviceEmailEnabled } from './flag';
import { DEVICE_ID_KEY } from './key';
import { DEVICE_ID_PATTERN, NEW_DEVICE_FUNCTION, REPORT_TIMEOUT_MS, deviceClassOf, reportNewDevice } from './report.logic';

/** Random once per install (32 random bytes, hex). Never a hardware id or an advertising id. Erase everything clears it. */
export async function deviceIdOnce(): Promise<string | null> {
  try {
    const kept = await secureStorage.getItem(DEVICE_ID_KEY);
    if (kept && DEVICE_ID_PATTERN.test(kept)) return kept;
    const fresh = Array.from(Crypto.getRandomBytes(32), (b) => b.toString(16).padStart(2, '0')).join('');
    await secureStorage.setItem(DEVICE_ID_KEY, fresh);
    return fresh;
  } catch {
    return null;
  }
}

/**
 * One report in flight per account: a second ask from the same account shares it (its first attempt may still be timing out).
 * Another account never gets it. A run records the token it sent with; a later ask that finds a different session (the same
 * account signed out and in again) or a run that had no token to send starts its own run instead of sharing.
 */
type Run = { promise: Promise<void>; token?: string | null };
const inFlight = new Map<string, Run>();

function start(sb: SupabaseLike, userId: string): Promise<void> {
  const run: Run = { promise: Promise.resolve() };
  run.promise = reportOnce(sb, userId, (t) => (run.token = t)).finally(() => {
    if (inFlight.get(userId) === run) inFlight.delete(userId);
  });
  inFlight.set(userId, run);
  return run.promise;
}

export function reportNewDeviceFor(sb: SupabaseLike, userId: string): Promise<void> {
  const shared = inFlight.get(userId);
  if (!shared) return start(sb, userId);
  if (shared.token === undefined) return shared.promise; // still reading the session: it will read the live one
  const seen = shared;
  return (async () => {
    const now = (await sb.auth.getSession()).data.session?.access_token ?? null;
    if (seen.token !== null && seen.token === now) return seen.promise;
    return start(sb, userId);
  })().catch(() => {});
}

function reportOnce(sb: SupabaseLike, userId: string, noteToken: (t: string | null) => void): Promise<void> {
  return reportNewDevice({
    enabled: newDeviceEmailEnabled,
    deviceId: deviceIdOnce,
    accessToken: async () => {
      const session = (await sb.auth.getSession()).data.session;
      // The session may have moved to another account since this report was asked for: send nothing for the starter then.
      // A session with a token and no user id cannot be shown to be this account's: fail closed.
      const token = session && session.user?.id === userId ? (session.access_token ?? null) : null;
      noteToken(token);
      return token;
    },
    deviceClass: deviceClassOf(Platform.OS),
    send: async ({ token, body }) => {
      // A timed-out attempt is cancelled, so the retry never overlaps it.
      const ctl = new AbortController();
      let timer: ReturnType<typeof setTimeout> | undefined;
      const timeout = new Promise<{ error: unknown }>((resolve) => {
        timer = setTimeout(() => {
          ctl.abort();
          resolve({ error: 'timeout' });
        }, REPORT_TIMEOUT_MS);
      });
      try {
        const call = sb.functions.invoke(NEW_DEVICE_FUNCTION, { method: 'POST', body, headers: { Authorization: `Bearer ${token}` }, signal: ctl.signal });
        return !(await Promise.race([call, timeout])).error;
      } finally {
        clearTimeout(timer);
      }
    },
  });
}
