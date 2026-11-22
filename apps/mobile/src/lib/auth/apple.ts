/**
 * Sign in with Apple, native (PRD A-REQ-016, TDD 04 3.1.1) through
 * expo-apple-authentication and Supabase signInWithIdToken, with a hashed
 * nonce. Only the email scope is requested (O-8, NX-31-R9, FP-9): no screen
 * uses Apple's name, so it is never asked for and never kept. A name left by
 * an older build is dropped at the next sign-in. O-8 DEFAULT, reversible:
 * add FULL_NAME back here if privacy rules otherwise.
 *
 * The Apple user identifier is kept in the Keychain so launch can ask Apple
 * whether the credential was revoked (A-REQ-033).
 *
 * Right after sign-in, Apple's one-time authorization code goes to the
 * `apple-token` Edge Function (BL-330, security review H3, F02-REQ-004,
 * F02-REQ-022), which exchanges it with Apple for a refresh token and stores
 * it wrapped, so account deletion can revoke it (App Store 5.1.1(v),
 * A-NFR-011). The call never blocks or fails sign-in: the code lives five
 * minutes and works once, and a missed capture shows up as `apple: no_token`
 * on the deletion receipt and an ops alert. The code is never logged, never
 * stored on the phone, and never sent anywhere else. AUTH_SETUP 2.7.
 */
import type { SupabaseClient } from '@supabase/supabase-js';
import * as AppleAuthentication from 'expo-apple-authentication';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { serverFeaturesEnabled } from '../capabilities';
import { secureStorage } from '../supabase/secure-storage';
import { appleCaptureBody, APPLE_TOKEN_FUNCTION, captureVerdict, CAPTURE_ATTEMPTS, CAPTURE_RETRY_MS, type CaptureResult } from './apple-token.logic';
import { makeNonce } from './nonce';

export const APPLE_USER_KEY = 'scribe.auth.appleUser';
export const PENDING_NAME_KEY = 'scribe.auth.pendingName';

export async function appleSignInAvailable(): Promise<boolean> {
  if (Platform.OS !== 'ios') return false;
  try {
    return await AppleAuthentication.isAvailableAsync();
  } catch {
    return false;
  }
}

/** Resolves with the Supabase user id. Rejects with the provider or Supabase error (errors.logic maps it). */
export async function signInWithApple(sb: SupabaseClient): Promise<string> {
  const { raw, hashed } = await makeNonce();
  const credential = await AppleAuthentication.signInAsync({
    requestedScopes: [AppleAuthentication.AppleAuthenticationScope.EMAIL],
    nonce: hashed,
  });
  if (!credential.identityToken) throw Object.assign(new Error('apple_no_identity_token'), { code: 'bad_oauth_callback' });
  const { data, error } = await sb.auth.signInWithIdToken({ provider: 'apple', token: credential.identityToken, nonce: raw });
  if (error) throw error;
  const userId = data.user?.id;
  if (!userId) throw Object.assign(new Error('apple_no_user'), { code: 'bad_oauth_callback' });
  // BL-330: in the background; sign-in is already done whatever this returns.
  if (credential.authorizationCode) void captureAppleToken(sb, credential.authorizationCode).catch(() => 'failed');
  await keepAppleUser(credential.user);
  await clearPendingAppleName(); // O-8: no name is kept; drop one an older build left
  return userId;
}

/**
 * BL-1505, fail quiet (handled here, visible to the revocation watch only). A failed write must not leave the previous person's id to be read as this one's: drop it,
 * and if it cannot be dropped, mark the id unknown so the revocation watch skips (false) instead of asking Apple
 * about the wrong person. Never signs anyone out, never logs the id. The mark is memory only.
 */
let appleIdUnknown = false;

async function keepAppleUser(user: string): Promise<void> {
  try {
    await secureStorage.setItem(APPLE_USER_KEY, user);
    appleIdUnknown = false;
  } catch {
    try {
      await secureStorage.removeItem(APPLE_USER_KEY);
      appleIdUnknown = false;
    } catch {
      appleIdUnknown = true;
    }
  }
}

export async function clearPendingAppleName(): Promise<void> {
  await secureStorage.removeItem(PENDING_NAME_KEY).catch(() => {});
}

/**
 * A-REQ-033: true only when Apple says this phone's Apple sign-in was REVOKED.
 * False for AUTHORIZED, TRANSFERRED and NOT_FOUND (pinned by test, open
 * question for the CTO in PR 1125), when not an Apple user, not iOS, or when
 * the read fails: a network error must never sign a person out.
 */
export async function appleCredentialRevoked(): Promise<boolean> {
  if (Platform.OS !== 'ios') return false;
  if (appleIdUnknown) return false;
  const user = await secureStorage.getItem(APPLE_USER_KEY).catch(() => null);
  if (!user) return false;
  try {
    const state = await AppleAuthentication.getCredentialStateAsync(user);
    return state === AppleAuthentication.AppleAuthenticationCredentialState.REVOKED;
  } catch {
    return false;
  }
}

/**
 * NS-45-R4, O-18: Apple's own revocation notification (JS only, expo-apple-authentication
 * addRevokeListener). Returns the function that removes it; call it at sign-out.
 */
export function watchAppleRevocation(onRevoked: () => void): () => void {
  if (Platform.OS !== 'ios') return () => {};
  const sub = AppleAuthentication.addRevokeListener(() => onRevoked());
  return () => sub.remove();
}

export async function forgetAppleUser(): Promise<void> {
  try {
    await secureStorage.removeItem(APPLE_USER_KEY);
    appleIdUnknown = false;
  } catch {
    // keeps the mark: the id may still be there
  }
}

/** The bundle id Apple issued the code to (production, preview or dev build); the function checks it against its list. */
function appleClientId(): string | null {
  const id = Constants.expoConfig?.ios?.bundleIdentifier;
  return typeof id === 'string' && id.length > 0 ? id : null;
}

const pause = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

/**
 * POST /functions/v1/apple-token/v1 with the signed-in user's JWT (supabase-js
 * adds it). A lost connection is tried once more a few seconds later; an
 * answer from the function is final, because Apple refuses a code used twice.
 */
export async function captureAppleToken(
  sb: Pick<SupabaseClient, 'functions'>,
  authorizationCode: string,
  wait: (ms: number) => Promise<void> = pause,
): Promise<CaptureResult> {
  if (!serverFeaturesEnabled()) return 'skipped';
  const body = appleCaptureBody(authorizationCode, appleClientId());
  if (!body) return 'failed';
  for (let attempt = 1; attempt <= CAPTURE_ATTEMPTS; attempt++) {
    let verdict: CaptureResult | 'retry';
    try {
      const { error } = await sb.functions.invoke(APPLE_TOKEN_FUNCTION, { method: 'POST', body });
      verdict = captureVerdict(error);
    } catch (e) {
      verdict = captureVerdict(e);
    }
    if (verdict !== 'retry') return verdict;
    if (attempt < CAPTURE_ATTEMPTS) await wait(CAPTURE_RETRY_MS);
  }
  return 'failed';
}
