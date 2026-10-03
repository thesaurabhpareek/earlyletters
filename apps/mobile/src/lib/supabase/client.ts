/**
 * The one Supabase client in the app (TDD 01 3.0, TDD 04 3.2).
 *
 * - Configured from EXPO_PUBLIC_SUPABASE_URL and
 *   EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY (env.ts). Without them the app runs
 *   fully local and the sign-in sheet says sign-in is not available in this
 *   build; nothing throws at launch.
 * - Session in the Keychain (secure-storage.ts), refreshed automatically
 *   while the app is in the foreground (startAutoRefreshWhileActive) and
 *   cleared by signOut. Requests use the user's JWT only (BRIEF 17).
 * - Every request carries an `x-request-id` (BRIEF 17), never content.
 *
 * Created lazily on first use, never at import, so cold start does no
 * network or Keychain work before the first frame (A-NFR-002).
 */
import 'react-native-url-polyfill/auto';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import * as Crypto from 'expo-crypto';
import { AppState, type AppStateStatus } from 'react-native';
import { readSupabaseEnv } from './env';
import { secureStorage } from './secure-storage';

/**
 * The surface other modules (sync, family, consent) may depend on. A Pick of
 * the real client, so tests can hand in a fake with the same shape and
 * nothing outside src/lib/supabase constructs a client.
 */
export type SupabaseLike = Pick<SupabaseClient, 'from' | 'rpc' | 'auth' | 'storage' | 'functions' | 'schema'>;

/** supabase-js storage key; also the Keychain item name (letters, '.', '-', '_' only). */
export const SESSION_STORAGE_KEY = 'scribe.auth';

export class SupabaseNotConfiguredError extends Error {
  constructor() {
    super('supabase_not_configured');
    this.name = 'SupabaseNotConfiguredError';
  }
}

let client: SupabaseClient | null = null;

export function isSupabaseConfigured(): boolean {
  return readSupabaseEnv() !== null;
}

/** Adds a request id to every call; the server logs it instead of anything about the person. */
const fetchWithRequestId: typeof fetch = (input, init) => {
  const headers = new Headers(init?.headers);
  if (!headers.has('x-request-id')) headers.set('x-request-id', Crypto.randomUUID());
  return fetch(input, { ...init, headers });
};

/** The client, or null when this build has no Supabase settings. */
export function getSupabaseOrNull(): SupabaseClient | null {
  if (client) return client;
  const env = readSupabaseEnv();
  if (!env) return null;
  client = createClient(env.url, env.key, {
    auth: {
      storage: secureStorage,
      storageKey: SESSION_STORAGE_KEY,
      autoRefreshToken: true,
      persistSession: true,
      // Links are handled by the app (lib/auth/links.logic.ts), never by URL sniffing.
      detectSessionInUrl: false,
    },
    global: { fetch: fetchWithRequestId },
  });
  return client;
}

export function getSupabase(): SupabaseClient {
  const c = getSupabaseOrNull();
  if (!c) throw new SupabaseNotConfiguredError();
  return c;
}

/**
 * React Native has no visibility events, so supabase-js cannot tell when the
 * app sleeps. Refresh only while active (Supabase's documented pattern for
 * React Native); returns an unsubscribe.
 */
export function startAutoRefreshWhileActive(): () => void {
  const c = getSupabaseOrNull();
  if (!c) return () => {};
  const apply = (s: AppStateStatus) => {
    if (s === 'active') void c.auth.startAutoRefresh();
    else void c.auth.stopAutoRefresh();
  };
  apply(AppState.currentState);
  const sub = AppState.addEventListener('change', apply);
  return () => sub.remove();
}
