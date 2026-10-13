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
 *   `idempotency-key` take one key per user action, reused by its retries
 *   (`actionKeys`, idempotency.logic.ts).
 * - Email links use PKCE (`flowType: 'pkce'`, security review H1): the code
 *   verifier stays in this phone's Keychain, so a link requested anywhere
 *   else cannot sign this phone in (lib/auth/email-link.logic.ts).
 *
 * Created lazily on first use, never at import, so cold start does no
 * network or Keychain work before the first frame (A-NFR-002).
 */
import 'react-native-url-polyfill/auto';
import { HEADER_APP_VERSION, HEADER_REQUEST_ID, newRequestId } from '@scribe/api';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import Constants from 'expo-constants';
import * as Crypto from 'expo-crypto';
import { AppState, type AppStateStatus } from 'react-native';
import { uuidv7 } from '../store';
import { readSupabaseEnv } from './env';
import { ActionKeys } from './idempotency.logic';
import { errorCode, isNetworkError } from './errors.logic';
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

/**
 * supabase-js makes the PKCE code verifier with `crypto.getRandomValues` and
 * falls back to Math.random without it. Hermes has no Web Crypto, so the app
 * installs expo-crypto's getRandomValues (the platform's secure generator) as
 * the standard global, once, before the client exists. `crypto.subtle` is not
 * installed: supabase-js then sends the challenge with method `plain`, which
 * is enough here because the challenge travels only from this phone to
 * Supabase over TLS (the attacker in H1 never sees it). Assumption checked on
 * device: AUTH_SETUP 11.3.
 */
function ensureRandomValues(): void {
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

/** The client, or null when this build has no Supabase settings. */
export function getSupabaseOrNull(): SupabaseClient | null {
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

/** A fresh UUIDv7. Use `actionKeys` for requests, so retries share one key. */
export function idempotencyKey(): string {
  return uuidv7();
}

/**
 * packages/api ENDPOINTS marks create_child_invite and record_policy_act as
 * `idempotency_key` writes (migration 20261005000000 reads the header). One
 * key per user action, kept across its retries (gap G-07).
 */
export const actionKeys = new ActionKeys(idempotencyKey);

/** A failure worth retrying with the same key: no answer arrived, or the server asked to retry (40001). */
export function isRetryableWrite(e: unknown): boolean {
  return isNetworkError(e) || errorCode(e) === '40001';
}
