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
 * After Supabase accepts the identity token, the one-time authorization code
 * goes to the `apple-token` Edge Function (apple-token.ts, BL-330), which
 * stores Apple's refresh token encrypted so account deletion can revoke it
 * (A-NFR-011, Apple 5.1.1(v)). See docs/ops/AUTH_SETUP.md section 2.4.
 */
import type { SupabaseClient } from '@supabase/supabase-js';
import * as AppleAuthentication from 'expo-apple-authentication';
import { Platform } from 'react-native';
import { secureStorage } from '../supabase/secure-storage';
import { captureAppleRefreshToken } from './apple-token';
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
  // BL-330: the session now exists, so the function can tell whose token it stores. Never awaited by sign-in.
  void captureAppleRefreshToken((name, options) => sb.functions.invoke(name, options), credential.authorizationCode).catch(() => 'failed');
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
