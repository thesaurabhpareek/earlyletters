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

export function reportNewDeviceFor(sb: SupabaseLike): Promise<void> {
  return reportNewDevice({
    enabled: newDeviceEmailEnabled,
    deviceId: deviceIdOnce,
    accessToken: async () => (await sb.auth.getSession()).data.session?.access_token ?? null,
    deviceClass: deviceClassOf(Platform.OS),
    send: async ({ token, body }) => {
      const call = sb.functions.invoke(NEW_DEVICE_FUNCTION, { method: 'POST', body, headers: { Authorization: `Bearer ${token}` } });
      const timeout = new Promise<{ error: unknown }>((resolve) => setTimeout(() => resolve({ error: 'timeout' }), REPORT_TIMEOUT_MS));
      return !(await Promise.race([call, timeout])).error;
    },
  });
}
