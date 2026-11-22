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
 * - Every request carries an `x-request-id` and `x-app-version` (BRIEF 17,
 *   packages/api), never content. Write RPCs the contract marks with an
 *   `idempotency-key` set it per call (withIdempotencyKey).
 * - Email links use PKCE (`flowType: 'pkce'`; BL-347, security review H1,
 *   ADR 0023): the code verifier stays in this phone's Keychain, so a link
 *   requested anywhere else cannot sign this phone in
 *   (lib/auth/email-link.logic.ts).
 *
 * Created lazily on first use, never at import, so cold start does no
 * network or Keychain work before the first frame (A-NFR-002). With server
 * features off nothing here runs past the switch check.
 */
import 'react-native-url-polyfill/auto';
import { HEADER_APP_VERSION, HEADER_REQUEST_ID, newRequestId } from '@scribe/api';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import Constants from 'expo-constants';
import * as Crypto from 'expo-crypto';
import { AppState, type AppStateStatus } from 'react-native';
import { serverFeaturesEnabled } from '../capabilities';
import { uuidv7 } from '../store';
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

/** False when the build has server features off (v1.0, lib/capabilities.ts) or no Supabase settings. */
export function isSupabaseConfigured(): boolean {
  return serverFeaturesEnabled() && readSupabaseEnv() !== null;
}

/**
 * supabase-js makes the PKCE code verifier with `crypto.getRandomValues` and
 * falls back to Math.random when it is missing. Where the runtime has no Web
 * Crypto, install expo-crypto's getRandomValues (the platform's secure
 * generator, SecRandomCopyBytes on iOS) as the standard global, once, just
 * before the client is made. `crypto.subtle` is deliberately not installed:
 * a partial WebCrypto would mislead other feature checks, and without it
 * supabase-js sends the challenge with method `plain`. That is enough for H1:
 * the challenge travels only from this phone to Supabase over TLS, and the
 * attacker in H1 holds a different flow (ADR 0023 records the trade-off).
 */
export function ensureRandomValues(): void {
  const g = globalThis as { crypto?: { getRandomValues?: unknown } };
  if (typeof g.crypto?.getRandomValues === 'function') return;
  const getRandomValues = <T extends ArrayBufferView | null>(array: T): T => Crypto.getRandomValues(array as never) as T;
  if (g.crypto) (g.crypto as { getRandomValues?: unknown }).getRandomValues = getRandomValues;
  else Object.defineProperty(globalThis, 'crypto', { value: { getRandomValues }, configurable: true, writable: true });
}

const APP_VERSION = (Constants.expoConfig?.version ?? '0.0.0').slice(0, 32);

/**
 * Every call carries a fresh request id (12 hex characters, packages/api
 * envelope) and the app version (ADR 0017); the server logs those instead of
 * anything about the person.
 */
const fetchWithRequestId: typeof fetch = (input, init) => {
  const headers = new Headers(init?.headers);
  if (!headers.has(HEADER_REQUEST_ID)) headers.set(HEADER_REQUEST_ID, newRequestId((n) => Crypto.getRandomBytes(n)));
  headers.set(HEADER_APP_VERSION, APP_VERSION);
  return fetch(input, { ...init, headers });
};

/**
 * The client, or null when this build has server features off (v1.0: the app is
 * fully local, lib/capabilities.ts) or no Supabase settings. With the switch off
 * nothing is ever constructed, so no request reaches Supabase.
 */
export function getSupabaseOrNull(): SupabaseClient | null {
  if (!serverFeaturesEnabled()) return null;
  if (client) return client;
  const env = readSupabaseEnv();
  if (!env) return null;
  ensureRandomValues();
  client = createClient(env.url, env.key, {
    auth: {
      storage: secureStorage,
      storageKey: SESSION_STORAGE_KEY,
      autoRefreshToken: true,
      persistSession: true,
      // Links are handled by the app (lib/auth/links.logic.ts), never by URL sniffing.
      detectSessionInUrl: false,
      // BL-347: an email link can finish only on the phone holding this flow's verifier.
      flowType: 'pkce',
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

/**
 * packages/api ENDPOINTS marks create_child_invite and record_policy_act as
 * `idempotency_key` writes: each call carries a client-made UUIDv7 so a retry
 * can be applied once. Today's SQL functions do not read it yet (see the
 * hand-off); sending it now keeps the client on the contract.
 */
export function idempotencyKey(): string {
  return uuidv7();
}
