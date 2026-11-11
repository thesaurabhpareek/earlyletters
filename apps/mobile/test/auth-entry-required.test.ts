/**
 * Tier A, the auth entry (journey Option A; QA plan SU-01; NX-40 R6, R7; red-first file `test/auth-entry-required.test.ts`).
 * One screen, the built Welcome (#724). Its heading names both creating an account and signing in, because the flow is
 * one (email uses shouldCreateUser, so a new and a returning address cannot differ). Apple and email only: no Google, no
 * passkey, no skip, no "continue without an account" while servers are on. Source patterns and pure rules; nothing here
 * runs on a phone.
 *
 * Not tested here, and said so: the Apple scope (`apple.ts` still asks for FULL_NAME and EMAIL while NX-31-R9 says email
 * only; BL-896 waits for the stack), the co-parent coming-soon rows CP-01 to CP-03 (outside this job), and how any of it
 * looks or reads aloud (device only).
 */
import { features } from '@scribe/content';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { beginTheBookAllowed, firstRunGate, gateInputsFromAuth } from '../src/lib/first-run/gate.logic';

const src = (...p: string[]) => readFileSync(join(__dirname, '..', 'src', ...p), 'utf8');
const welcome = src('components', 'onboarding', 'welcome-sign-in.tsx');
const fr = features.firstRun.auth;

describe('[SU-01, NX-40-R6] the auth entry heading names both doors', () => {
  it('the heading is the "titleBoth" line from the first-run words, and says create an account and sign in', () => {
    expect(fr.titleBoth).toMatch(/\bcreate\b/i);
    expect(fr.titleBoth).toMatch(/\bsign in\b/i);
    expect(fr.titleBoth).not.toMatch(/log ?in|sign ?up|continue with/i);
    expect(welcome).toMatch(/firstRunCopy\.auth\.titleBoth/);
    // It is the one level-1 heading, and it takes focus on mount (A11Y-F09).
    expect(welcome).toMatch(/<Text ref=\{heading\} variant="hero" asHeading=\{1\}[^>]*>\s*\{firstRunCopy\.auth\.titleBoth\}/);
    expect(welcome).toMatch(/useFocusOnMount\(heading\)/);
  });

  it('the line under the buttons says new and returning are the same steps (one flow, not two doors)', () => {
    expect(fr.newOrBack).toMatch(/new here or back again/i);
    expect(welcome).toMatch(/firstRunCopy\.auth\.newOrBack/);
  });

  it('there is still one set of buttons: no "Create account" and "Sign in" switch, no second door for returning people', () => {
    expect(welcome).not.toMatch(/SegmentedControl|signInButton|I already have a book/);
    expect(welcome.match(/<AppleButton /g)).toHaveLength(1);
    expect(welcome.match(/label=\{authCopy\.sheet\.email\}/g)).toHaveLength(1);
  });
});

describe('[SU-01, NX-40-R7] Apple and email only; no way past the account while servers are on', () => {
  it('Google and passkey are not on the Welcome, and no skip or "continue without" control is', () => {
    expect(welcome).not.toMatch(/kind="google"|signInWithGoogle|googleSignInAvailable|signInWithPasskey|passkeysAvailable/);
    expect(welcome).not.toMatch(/authCopy\.sheet\.(later|google|passkey)|skip|Not now|without an account|continue without/i);
  });

  it('with servers on, no session and no book, the gate shows the Welcome and does not let the book begin', () => {
    const input = gateInputsFromAuth({ serverFeatures: true, authState: { status: 'signedOut' }, hasLocalBook: false });
    expect(firstRunGate(input).step).toBe('signIn');
    expect(beginTheBookAllowed(input)).toBe(false);
  });

  it('the build lists no provider beyond Apple and email unless its own switch is set (Google ids, passkey switch)', () => {
    const eas = JSON.parse(readFileSync(join(__dirname, '..', 'eas.json'), 'utf8')) as { build: Record<string, { env?: Record<string, string> }> };
    for (const [name, profile] of Object.entries(eas.build)) {
      const env = profile.env ?? {};
      expect(Object.keys(env).filter((k) => /GOOGLE/.test(k)), `${name} sets a Google id`).toEqual([]);
      expect(env.EXPO_PUBLIC_PASSKEYS, `${name} sets the passkey switch`).toBeUndefined();
    }
  });
});
