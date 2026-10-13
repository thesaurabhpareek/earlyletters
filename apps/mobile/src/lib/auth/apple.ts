/**
 * Sign in with Apple, native (PRD A-REQ-016, TDD 04 3.1.1) through
 * expo-apple-authentication and Supabase signInWithIdToken, with a hashed
 * nonce. Apple shares the name only on the first sign-in, so it is kept in
 * the Keychain until Terms are accepted and then written to
 * profiles.display_name (consent.ts), never logged.
 *
 * The Apple user identifier is kept in the Keychain so launch can ask Apple
 * whether the credential was revoked (A-REQ-033).
 *
 * Right after sign-in, Apple's one-time authorization code goes to the
 * `apple-token` Edge Function (security review H3, gap G-03), which exchanges
 * it with Apple for a refresh token and stores it wrapped, so account deletion
 * can revoke it (App Store 5.1.1(v), A-NFR-011). The call never blocks or
 * fails sign-in: the code lives five minutes and works once, and a missed
 * capture shows up as `apple: no_token` on the deletion receipt and an ops
 * alert. The code is never logged or stored on the phone.
 */
import type { SupabaseClient } from '@supabase/supabase-js';
import * as AppleAuthentication from 'expo-apple-authentication';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { secureStorage } from '../supabase/secure-storage';
import { makeNonce } from './nonce';

const APPLE_USER_KEY = 'scribe.auth.appleUser';
const PENDING_NAME_KEY = 'scribe.auth.pendingName';

export async function appleSignInAvailable(): Promise<boolean> {
  if (Platform.OS !== 'ios') return false;
  try {
    return await AppleAuthentication.isAvailableAsync();
  } catch {
    return false;
  }
}

function fullName(n: AppleAuthentication.AppleAuthenticationFullName | null): string | null {
  if (!n) return null;
  const s = [n.givenName, n.middleName, n.familyName].filter((p): p is string => !!p && p.trim().length > 0).join(' ').trim();
  return s ? s.slice(0, 60) : null; // profiles.display_name is at most 60 characters
}

/** Resolves with the Supabase user id. Rejects with the provider or Supabase error (errors.logic maps it). */
export async function signInWithApple(sb: SupabaseClient): Promise<string> {
  const { raw, hashed } = await makeNonce();
  const credential = await AppleAuthentication.signInAsync({
    requestedScopes: [AppleAuthentication.AppleAuthenticationScope.FULL_NAME, AppleAuthentication.AppleAuthenticationScope.EMAIL],
    nonce: hashed,
  });
  if (!credential.identityToken) throw Object.assign(new Error('apple_no_identity_token'), { code: 'bad_oauth_callback' });
  const { data, error } = await sb.auth.signInWithIdToken({ provider: 'apple', token: credential.identityToken, nonce: raw });
  if (error) throw error;
  const userId = data.user?.id;
  if (!userId) throw Object.assign(new Error('apple_no_user'), { code: 'bad_oauth_callback' });
  if (credential.authorizationCode) void captureAppleToken(sb, credential.authorizationCode);
  await secureStorage.setItem(APPLE_USER_KEY, credential.user).catch(() => {});
  const name = fullName(credential.fullName);
  if (name) await secureStorage.setItem(PENDING_NAME_KEY, name).catch(() => {});
  return userId;
}

/** The name Apple shared at first sign-in, if not yet written to the profile. */
export async function takePendingAppleName(): Promise<string | null> {
  const name = await secureStorage.getItem(PENDING_NAME_KEY).catch(() => null);
  return name && name.trim() ? name : null;
}

export async function clearPendingAppleName(): Promise<void> {
  await secureStorage.removeItem(PENDING_NAME_KEY).catch(() => {});
}

/**
 * A-REQ-033: true when Apple says this phone's Apple sign-in was revoked or
 * no longer exists. False when not an Apple user, not iOS, or unknown.
 */
export async function appleCredentialRevoked(): Promise<boolean> {
  if (Platform.OS !== 'ios') return false;
  const user = await secureStorage.getItem(APPLE_USER_KEY).catch(() => null);
  if (!user) return false;
  try {
    const state = await AppleAuthentication.getCredentialStateAsync(user);
    return state === AppleAuthentication.AppleAuthenticationCredentialState.REVOKED;
  } catch {
    return false;
  }
}

export async function forgetAppleUser(): Promise<void> {
  await secureStorage.removeItem(APPLE_USER_KEY).catch(() => {});
}

/** The bundle id Apple issued the code to (production, preview or dev build); the function checks it against its list. */
function appleClientId(): string | null {
  const id = Constants.expoConfig?.ios?.bundleIdentifier;
  return typeof id === 'string' && id.length > 0 ? id : null;
}

/**
 * POST /functions/v1/apple-token/v1 with the signed-in user's JWT (supabase-js
 * adds it). Two tries a few seconds apart for a lost connection; Apple refuses
 * a code used twice, so a server error is not retried.
 */
export async function captureAppleToken(sb: SupabaseClient, authorizationCode: string): Promise<'stored' | 'failed'> {
  const clientId = appleClientId();
  if (!clientId) return 'failed';
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const { error } = await sb.functions.invoke('apple-token/v1', { body: { code: authorizationCode, clientId } });
      if (!error) return 'stored';
      // FunctionsHttpError: the function answered; do not spend the one-time code again.
      if ((error as { name?: string }).name === 'FunctionsHttpError') return 'failed';
    } catch {
      // network: try once more below
    }
    await new Promise((r) => setTimeout(r, 3_000));
  }
  return 'failed';
}
