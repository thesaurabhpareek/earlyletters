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

/** One report in flight per account: a second ask from the same account shares it (its first attempt may still be timing out). Another account never gets it. */
const inFlight = new Map<string, Promise<void>>();

export function reportNewDeviceFor(sb: SupabaseLike, userId: string): Promise<void> {
  const shared = inFlight.get(userId);
  if (shared) return shared;
  const run = reportOnce(sb, userId).finally(() => {
    if (inFlight.get(userId) === run) inFlight.delete(userId);
  });
  inFlight.set(userId, run);
  return run;
}

function reportOnce(sb: SupabaseLike, userId: string): Promise<void> {
  return reportNewDevice({
    enabled: newDeviceEmailEnabled,
    deviceId: deviceIdOnce,
    accessToken: async () => {
      const session = (await sb.auth.getSession()).data.session;
      // The session may have moved to another account since this report was asked for: send nothing for the starter then.
      if (session?.user?.id && session.user.id !== userId) return null;
      return session?.access_token ?? null;
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
