/**
 * BL-347, security review H1 (docs/reviews/2026-10-04-security-privacy.md):
 * login CSRF through the email sign-in link. Each test is one step of the
 * review's failure scenario, written against the functions the app ran on
 * 4 Oct 2026 (email.verifyEmailLink, auth-store), so every test here failed
 * before the fix and passes after it.
 *
 * Fixtures: the fictional family Asha only. "Attacker" is a second, made-up account.
 */
import { afterEach, describe, expect, it } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import { currentAuthUserId, onSignedIn, publishAuth, syncAllowed } from '../src/lib/auth/auth-store';
import { verifyEmailLink } from '../src/lib/auth/email';
import { classifyIncomingUrl } from '../src/lib/auth/links.logic';
import { initialAuthState, type AuthState } from '../src/lib/auth/machine.logic';
import { clearLinkRequestForTests } from '../src/lib/auth/pending';

const CFG = { origin: 'https://earlyletters.com', scheme: 'scribe' };
const ASHA_PARENT = '11111111-1111-4111-8111-111111111111';
const ATTACKER = '0192f0aa-0000-7000-8000-00000000bad1';
const ATTACKER_HASH = 'pkce_3f9c2a7d1b8e4f60a1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6';

/** A Supabase client double that records verifyOtp and signs in as the attacker if asked. */
function fakeSupabase() {
  const calls: unknown[] = [];
  const sb = {
    auth: {
      verifyOtp: async (params: unknown) => {
        calls.push(params);
        return { data: { user: { id: ATTACKER }, session: { user: { id: ATTACKER } } }, error: null };
      },
    },
  };
  return { sb: sb as unknown as SupabaseClient, calls };
}

const signedOut: AuthState = { status: 'signedOut' };

afterEach(() => {
  publishAuth(initialAuthState);
  publishAuth(signedOut);
  clearLinkRequestForTests();
});

describe('[F02-REQ-018] BL-347 H1: a sign-in link someone else requested', () => {
  it('[F02-REQ-018] H1 steps 1-2: the attacker link is a normal-looking link on our own domain', () => {
    const link = classifyIncomingUrl(`https://earlyletters.com/auth/callback#token_hash=${ATTACKER_HASH}&type=email`, CFG);
    expect(link.kind).toBe('auth-link');
  });

  it('[F02-REQ-018] H1 step 3: a phone that never asked for an email does not verify the link', async () => {
    publishAuth(signedOut);
    const { sb, calls } = fakeSupabase();
    await expect(verifyEmailLink(sb, ATTACKER_HASH, 'email')).rejects.toBeTruthy();
    expect(calls).toHaveLength(0);
  });

  it('[F02-REQ-020] H1 variant: a link is refused while another account is signed in on this phone', async () => {
    publishAuth({ status: 'ready', userId: ASHA_PARENT, sync: 'on' });
    const { sb, calls } = fakeSupabase();
    await expect(verifyEmailLink(sb, ATTACKER_HASH, 'email')).rejects.toBeTruthy();
    expect(calls).toHaveLength(0);
  });

  it('[F02-REQ-019] H1 step 4: a new session with consent already complete does not claim the phone letters', () => {
    const claimed: string[] = [];
    const off = onSignedIn((id) => claimed.push(id));
    // The attacker's account has Terms and sensitive-data consent: my_sync_gate() passes at once.
    publishAuth({ status: 'checkingConsent', userId: ATTACKER, method: 'email' });
    publishAuth({ status: 'ready', userId: ATTACKER, sync: 'on' });
    off();
    expect(claimed).toEqual([]);
    expect(currentAuthUserId()).toBeNull();
  });

  it('[F02-REQ-019] H1 step 5: nothing can upload until the person taps on the masked-email screen', () => {
    publishAuth({ status: 'ready', userId: ATTACKER, sync: 'on' });
    expect(syncAllowed()).toBe(false);
  });
});
