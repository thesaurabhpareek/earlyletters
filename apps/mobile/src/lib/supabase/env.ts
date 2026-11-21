/**
 * Supabase project settings, inlined at bundle time from EXPO_PUBLIC_*
 * variables (the eas.json profile env, or `.env.development` locally; see
 * docs/ops/AUTH_SETUP.md section 8). Both values are public by design: the
 * project URL and the publishable (anon) key. RLS and the security-definer
 * functions are the authority; no service key ever ships in the app
 * (BRIEF decision 17).
 *
 * Expo only inlines `process.env.EXPO_PUBLIC_*` when written out in full, so
 * each variable is read by name below and the parsing is a separate pure
 * function.
 */
import { APP_ENV, type AppEnv } from '../build-env';

export interface SupabaseEnv {
  url: string;
  key: string;
}

const LOCAL_HOST = /^http:\/\/(localhost|127\.0\.0\.1|10\.\d+\.\d+\.\d+|192\.168\.\d+\.\d+)(:\d+)?$/;

/**
 * Null when either value is missing or the URL is not https. A local stack over http (localhost or a private
 * network address) is allowed in a development build only: a preview (TestFlight) or production (App Store)
 * build sends a session token, so plain http is refused there whatever the address (BL-600, SEC-07, SEC-R16).
 */
export function parseSupabaseEnv(url: string | undefined, key: string | undefined, appEnv: AppEnv = APP_ENV): SupabaseEnv | null {
  const u = (url ?? '').trim().replace(/\/+$/, '');
  const k = (key ?? '').trim();
  if (!u || !k) return null;
  const https = /^https:\/\/[^\s/]+$/.test(u);
  if (!https && (appEnv !== 'development' || !LOCAL_HOST.test(u))) return null;
  return { url: u, key: k };
}

export function readSupabaseEnv(): SupabaseEnv | null {
  return parseSupabaseEnv(
    process.env.EXPO_PUBLIC_SUPABASE_URL,
    process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
  );
}
