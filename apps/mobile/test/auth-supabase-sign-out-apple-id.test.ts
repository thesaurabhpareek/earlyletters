/// <reference types="node" />
/**
 * Cross-account stores audit F2: when Supabase ends the session itself (SIGNED_OUT event: revoked elsewhere, refresh
 * failure) the Apple user id leaves the Keychain, like every other sign-out path (Sign out, under-18, revoked).
 * Nothing needs the id after that: the revocation watch (BL-450, A-REQ-033) runs only while a session exists
 * (`signedInUser`) and only for an Apple session, and the next Apple sign-in writes the id again.
 * Read as source, like the other provider wiring tests (auth-sign-out-wait.test.ts). Fictional family "Asha" only.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const provider = readFileSync(join(__dirname, '..', 'src/lib/auth/session-provider.tsx'), 'utf8')
  .replace(/\/\*[\s\S]*?\*\//g, '')
  .replace(/\/\/.*$/gm, '');

describe('[F2] a sign-out Supabase made itself forgets the Apple user id', () => {
  it('the SIGNED_OUT branch calls forgetAppleUser beside the pending-email clear', () => {
    const branch = provider.match(/else if \(event === 'SIGNED_OUT'\) \{([\s\S]*?)\n      \}\n/)?.[1] ?? '';
    expect(branch).toContain('void forgetAppleUser();');
    expect(branch).toContain('void clearPendingEmailRequest();');
    expect(branch).toContain("dispatch({ type: 'SIGNED_OUT' })");
  });

  it('[BL-1508] it runs first, so a throw further down the branch cannot skip it', () => {
    const branch = provider.match(/else if \(event === 'SIGNED_OUT'\) \{([\s\S]*?)\n      \}\n/)?.[1] ?? '';
    expect(branch.indexOf('void forgetAppleUser();')).toBeGreaterThanOrEqual(0);
    expect(branch.indexOf('void forgetAppleUser();')).toBeLessThan(branch.indexOf("dispatch({ type: 'SIGNED_OUT' })")); // mutant: move it back to the end
  });

  it('the revocation watch still needs a signed-in user, so no id is read after the session is gone', () => {
    expect(provider).toMatch(/useEffect\(\(\) => \{\s*if \(!signedInUser\) return;\s*return startAppleRevocationWatch\(/);
  });
});
