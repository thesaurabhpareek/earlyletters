/**
 * Passkeys, added after sign-in (BRIEF decision 4; decision record in
 * docs/ops/AUTH_SETUP.md section 7).
 *
 * Supabase Auth supports passkeys natively since 28 May 2026 (Beta; the
 * guide still calls the API experimental). supabase-js 2.117.2 runs the
 * browser ceremony itself, which React Native lacks, so the app uses its
 * two-step API (`auth.passkey.startRegistration` / `verifyRegistration`,
 * `startAuthentication` / `verifyAuthentication`) with the native ceremony
 * from react-native-passkey (MIT, 3.6.2, Sept 2026), which speaks the same
 * W3C JSON.
 *
 * Off unless the build sets EXPO_PUBLIC_PASSKEYS=1, because it also needs
 * (1) Passkeys turned on in the Supabase dashboard with RP ID
 * earlyletters.com, (2) `webcredentials` in the website's
 * apple-app-site-association, (3) the `webcredentials:earlyletters.com`
 * associated domain in the app (outside this module's ownership; requested
 * in the hand-off), and (4) a device test. Sign-in with Apple, Google or
 * email never depends on it.
 */
import type { SupabaseClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';

type PasskeyModule = typeof import('react-native-passkey');
type Auth = SupabaseClient['auth'];
type RegistrationCredential = Parameters<Auth['passkey']['verifyRegistration']>[0]['credential'];
type AssertionCredential = Parameters<Auth['passkey']['verifyAuthentication']>[0]['credential'];

const ENABLED = process.env.EXPO_PUBLIC_PASSKEYS === '1';

let mod: PasskeyModule | null | undefined;

function load(): PasskeyModule | null {
  if (mod !== undefined) return mod;
  try {
    mod = require('react-native-passkey') as PasskeyModule;
  } catch {
    mod = null;
  }
  return mod;
}

/** Shown only when this build enables it and the phone supports passkeys (iOS 16+). */
export function passkeysAvailable(): boolean {
  if (!ENABLED || Platform.OS !== 'ios') return false;
  const m = load();
  try {
    return !!m && m.Passkey.isSupported();
  } catch {
    return false;
  }
}

function unavailable(): Error {
  return Object.assign(new Error('passkeys_unavailable'), { error: 'NotSupported' });
}

export interface PasskeyInfo {
  id: string;
  name: string | null;
  createdAt: string;
  lastUsedAt: string | null;
}

/** Adds a passkey to the signed-in account. Rejects with the Supabase or native error. */
export async function registerPasskey(sb: SupabaseClient): Promise<void> {
  const m = load();
  if (!m || !passkeysAvailable()) throw unavailable();
  const start = await sb.auth.passkey.startRegistration();
  if (start.error || !start.data) throw start.error ?? unavailable();
  const options = start.data.options as unknown as Parameters<PasskeyModule['Passkey']['create']>[0];
  const r = await m.Passkey.create(options);
  const credential = {
    id: r.id,
    rawId: r.rawId,
    type: 'public-key',
    authenticatorAttachment: r.authenticatorAttachment,
    response: {
      clientDataJSON: r.response.clientDataJSON,
      attestationObject: r.response.attestationObject,
      transports: r.response.transports,
    },
    clientExtensionResults: {},
  } as unknown as RegistrationCredential;
  const done = await sb.auth.passkey.verifyRegistration({ challengeId: start.data.challenge_id, credential });
  if (done.error) throw done.error;
}

/** Signs in with a passkey saved for this site. Resolves with the user id. */
export async function signInWithPasskey(sb: SupabaseClient): Promise<string> {
  const m = load();
  if (!m || !passkeysAvailable()) throw unavailable();
  const start = await sb.auth.passkey.startAuthentication();
  if (start.error || !start.data) throw start.error ?? unavailable();
  const options = start.data.options as unknown as Parameters<PasskeyModule['Passkey']['get']>[0];
  const r = await m.Passkey.get(options);
  const credential = {
    id: r.id,
    rawId: r.rawId ?? r.id,
    type: 'public-key',
    authenticatorAttachment: r.authenticatorAttachment,
    response: {
      clientDataJSON: r.response.clientDataJSON,
      authenticatorData: r.response.authenticatorData,
      signature: r.response.signature,
      userHandle: r.response.userHandle,
    },
    clientExtensionResults: {},
  } as unknown as AssertionCredential;
  const done = await sb.auth.passkey.verifyAuthentication({ challengeId: start.data.challenge_id, credential });
  if (done.error) throw done.error;
  const id = done.data?.user?.id ?? done.data?.session?.user.id;
  if (!id) throw Object.assign(new Error('passkey_no_user'), { code: 'bad_oauth_callback' });
  return id;
}

export async function listPasskeys(sb: SupabaseClient): Promise<PasskeyInfo[]> {
  const { data, error } = await sb.auth.passkey.list();
  if (error) throw error;
  return (data ?? []).map((p) => ({ id: p.id, name: p.friendly_name ?? null, createdAt: p.created_at, lastUsedAt: p.last_used_at ?? null }));
}

export async function deletePasskey(sb: SupabaseClient, passkeyId: string): Promise<void> {
  const { error } = await sb.auth.passkey.delete({ passkeyId });
  if (error) throw error;
}
