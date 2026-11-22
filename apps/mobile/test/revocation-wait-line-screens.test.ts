/// <reference types="node" />
/**
 * [BL-1461] Where the revocation wait line is drawn. The hook and the rules are run in revocation-wait-line.test.ts; the
 * repo has no renderer, so here the wiring is pinned in source, as new-phone-route.test.ts does for the same screen.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { authReducer, initialAuthState, type AuthEvent } from '../src/lib/auth/machine.logic';
import { heldNewPhoneView } from '../src/lib/first-run/gate.logic';

const read = (...p: string[]) => readFileSync(join(__dirname, '..', 'src', ...p), 'utf8');
const gate = { termsCurrent: true, ageAttested: true, sensitiveData: true, contentAllowed: true };
const run = (events: AuthEvent[]) => events.reduce(authReducer, initialAuthState);

describe('[BL-1461] the line is drawn on the launch screen and the account gate', () => {
  it('a revoked wait noticed at launch (no book on the phone) routes to the opening screen', () => {
    const s = run([
      { type: 'RESTORED', userId: 'asha-1' },
      { type: 'SIGN_OUT_REQUESTED', reason: 'apple_revoked', pendingUploads: 2 },
    ]);
    expect(s.status).toBe('signingOut');
    expect(heldNewPhoneView(s, true)).toBe('opening');
  });

  it('OpeningBookScreen reads the auth state and draws the line beside the loading screen', () => {
    const screens = read('components', 'onboarding', 'new-phone-screens.tsx');
    expect(screens).toMatch(/const \{ state \} = useAuth\(\);/);
    expect(screens).toMatch(/<StateScreen kind="loading"[^\n]*\/>\n\s+<RevocationWaitLine state=\{state\} \/>/);
  });

  it('the account gate draws it under its busy row without a wrapper view', () => {
    const ui = read('lib', 'auth', 'ui.tsx');
    expect(ui).toMatch(/<Busy label=\{authCopy\.consent\.settingUp\} \/>\n\s+<RevocationWaitLine state=\{s\} \/>/);
  });

  it('the component is gated by the hook, which needs signingOut, apple_revoked and waitingForUploads', () => {
    expect(read('lib', 'auth', 'revocation-wait-line.tsx')).toMatch(/useRevocationWaitLine\(state, authCopy\.account\.signOutRevokedWaiting\)/);
    expect(read('lib', 'auth', 'revocation-wait.logic.ts')).toMatch(/s\.reason === 'apple_revoked' && s\.waitingForUploads/);
  });

  it('home with a book has no busy view for signingOut, so nothing is drawn there', () => {
    const route = read('lib', 'first-run', 'use-first-run-route.ts');
    expect(route).toMatch(/active && !hasLocalBook \? heldNewPhoneView\(auth\.state, online\) : undefined/);
  });
});
