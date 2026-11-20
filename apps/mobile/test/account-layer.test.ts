/// <reference types="node" />
/**
 * The screen cover for another account (BL-961 PR 2; NS-10-R3, `[X4-R1]`; 08-keeping.md 3.2): the parts Node cannot
 * render, pinned in their source as test/app-lock-wiring.test.ts pins the app lock. The decision itself is
 * account-scope.test.ts; the route is account-gate.test.ts and account-route.test.ts. What only a phone can show (the
 * cover over a presented sheet, VoiceOver landing on the heading, AX5) is a device row in the PR.
 */
import { readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { authCopy } from '../../../packages/content/src/features/auth.en';
import { accountScopeCopy } from '../src/components/account/copy';

const APP = resolve(__dirname, '..');
const src = (rel: string) => readFileSync(join(APP, rel), 'utf8');
/** Source without comments, so a pin never passes on a comment that names the thing. */
const code = (rel: string) => src(rel).replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '').replace(/\{\/\*[\s\S]*?\*\/\}/g, '');

describe('[NS-10-R3] the root layout mounts the cover over every route, under the app lock', () => {
  const layout = code('src/app/_layout.tsx');

  it('inside the session provider, after the stack, before the app lock (which stays on top)', () => {
    const session = layout.indexOf('<SessionProvider');
    const stack = layout.indexOf('</Stack>');
    const cover = layout.indexOf('<AccountLayer />');
    const lock = layout.indexOf('<AppLockLayer />');
    expect(session).toBeGreaterThan(-1);
    expect(cover).toBeGreaterThan(stack);
    expect(cover).toBeGreaterThan(session);
    expect(lock).toBeGreaterThan(cover);
    expect(layout.indexOf('</SessionProvider>')).toBeGreaterThan(lock);
  });
});

describe('[NS-10-R3] AccountLayer: decided by the one reader, over everything, one way out', () => {
  const layer = code('src/components/account/account-layer.tsx');

  it('asks bookVisibleTo with the raw session user and the stored owner, and renders nothing when visible', () => {
    expect(layer).toContain("import { bookVisibleTo } from '@/lib/auth/account-scope.logic';");
    expect(layer).toContain('const sessionUser = authUserId(auth.state);');
    expect(layer).toContain('const readOwner = sessionUser ? currentUserId : noOwner;');
    expect(layer).toMatch(/if \(bookVisibleTo\(\{ owner, sessionUser \}\)\) return null;/);
    // The owner changes at the first claim and at releaseEmptyOwner; both emit a settings change.
    expect(layer).toContain("subscribeTo('settings', onChange)");
  });

  it('draws in FullWindowOverlay on iOS, modal for VoiceOver, opaque page colour', () => {
    expect(layer).toMatch(/import \{ FullWindowOverlay \} from 'react-native-screens'/);
    expect(layer).toMatch(/Platform\.OS === 'ios'\) return <FullWindowOverlay unstable_accessibilityContainerViewIsModal>/);
    expect(layer).toContain('accessibilityViewIsModal');
    expect(layer).toMatch(/StyleSheet\.absoluteFill, \{ backgroundColor: c\.bg \}/);
    expect(layer).toContain("useArrival(block, accountScopeCopy.title, 'otherAccount');");
  });

  it('uses the standard state screen, with Sign out as its one action', () => {
    expect(layer).toContain('<StateScreenView');
    expect(layer).toContain('label: authCopy.account.signOut');
    expect(layer).not.toMatch(/quiet=/);
    expect(authCopy.account.signOut).toBe('Sign out');
  });

  it('signs out without waiting on the owner\'s queued uploads (they can never go up under this account)', () => {
    expect(layer).toContain('auth.notMyAccount()');
    expect(layer).not.toMatch(/auth\.signOut\(|signOut\(\)\.then|eraseEverything|deleteAccount/);
  });

  it('reads nothing of the book: no child, letter, draft or email', () => {
    expect(layer).not.toMatch(/listChildren|getActiveChild|getFamily|listEntries|listDrafts|getEntry|\.email|maskedEmail|child\.name|\{child\}/);
  });
});

describe('the cover\'s words (PROPOSED, needs the founder)', () => {
  it('are marked PROPOSED, and name nobody and nothing of the book', () => {
    expect(src('src/components/account/copy.ts')).toMatch(/PROPOSED: every sentence here waits for the founder's approval/);
    for (const text of Object.values(accountScopeCopy)) expect(text).not.toMatch(/\{child\}|\{name\}|\{email\}|lost|missing|gone|removed|deleted|erase/i);
  });
});
