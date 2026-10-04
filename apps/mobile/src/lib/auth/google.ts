/**
 * Sign in with Google (PRD A-REQ-017, TDD 04 3.1.2) through
 * @react-native-google-signin/google-signin (MIT, the library Supabase and
 * Expo document for native Google sign-in; v16.1.5 verified 3 Oct 2026) and
 * Supabase signInWithIdToken.
 *
 * Nonce: the free "Original" module exposes no nonce parameter (verified in
 * the installed 16.1.5 types), while Google's iOS SDK puts its own nonce in
 * the ID token. Supabase therefore needs "Skip nonce check" on the Google
 * provider (docs/ops/AUTH_SETUP.md section 3). Replay protection rests on the
 * audience check (our client ids only) and the token's one-hour life.
 *
 * The module is required lazily: it has native code, and a missing native
 * module (web preview) must not break launch. The Google button only shows
 * when both client ids are in this build's environment.
 */
import type { SupabaseClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';

type GoogleModule = typeof import('@react-native-google-signin/google-signin');

const WEB_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ?? '';
const IOS_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID ?? '';

let mod: GoogleModule | null | undefined;
let configured = false;

function load(): GoogleModule | null {
  if (mod !== undefined) return mod;
  try {
    mod = require('@react-native-google-signin/google-signin') as GoogleModule;
  } catch {
    mod = null;
  }
  return mod;
}

export function googleSignInAvailable(): boolean {
  return Platform.OS === 'ios' && WEB_CLIENT_ID.length > 0 && IOS_CLIENT_ID.length > 0;
}

/** Resolves with the Supabase user id, or 'cancelled' when the person closed Google's sheet. */
export async function signInWithGoogle(sb: SupabaseClient): Promise<string | 'cancelled'> {
  const g = load();
  if (!g || !googleSignInAvailable()) throw Object.assign(new Error('google_unavailable'), { code: 'provider_disabled' });
  if (!configured) {
    // webClientId makes the ID token's audience our web client id, which Supabase lists first.
    g.GoogleSignin.configure({ webClientId: WEB_CLIENT_ID, iosClientId: IOS_CLIENT_ID });
    configured = true;
  }
  let res: Awaited<ReturnType<typeof g.GoogleSignin.signIn>>;
  try {
    res = await g.GoogleSignin.signIn();
  } catch (e) {
    if (g.isErrorWithCode(e) && (e.code === g.statusCodes.SIGN_IN_CANCELLED || e.code === g.statusCodes.IN_PROGRESS)) return 'cancelled';
    throw e;
  }
  if (g.isCancelledResponse(res)) return 'cancelled';
  const idToken = res.data.idToken;
  if (!idToken) throw Object.assign(new Error('google_no_id_token'), { code: 'bad_oauth_callback' });
  const { data, error } = await sb.auth.signInWithIdToken({ provider: 'google', token: idToken });
  // We keep no Google session on the phone; the next sign-in shows the account picker again.
  void g.GoogleSignin.signOut().catch(() => {});
  if (error) throw error;
  const userId = data.user?.id;
  if (!userId) throw Object.assign(new Error('google_no_user'), { code: 'bad_oauth_callback' });
  return userId;
}
