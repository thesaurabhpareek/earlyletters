/// <reference types="node" />
/**
 * BL-801, YOU-TAB-STATES-9nov (slice 4b): the You tab as named states A (signed in), B (signed out), C (local start) and
 * 0 (a build without sign-in), the Sign in card, the Delete account gate, the nameless book and Account's one Sync row.
 * Screens do not load in Node, so their structure is pinned in their source, as settings-home.test.ts does. Titles in
 * the "12. Acceptance checks" describe are the spec's own words.
 *
 * Not checkable here, and never checked by this file: VoiceOver reading order on a device, AX5 wrapping on a 320 pt
 * phone, Reduce Motion and Reduce Transparency walks, contrast. They are device checks.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { authCopy, en } from '@scribe/content';
import { tokens } from '@scribe/design-tokens';
import { childRowTitle } from '../src/components/child/child-settings.logic';
import { headerCard, localDeletionAllowedFor, youTabView } from '../src/components/settings/settings-home.logic';


const SRC = join(__dirname, '..', 'src');
const read = (p: string) => readFileSync(join(SRC, p), 'utf8');
const code = (t: string) => t.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\{\/\*[\s\S]*?\*\/\}/g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');
const home = code(read('app/settings/index.tsx'));
const card = code(read('components/settings/signed-out-card.tsx'));
const account = code(read('app/settings/account.tsx'));
const child = code(read('app/settings/children/[id].tsx'));

type Status = Parameters<typeof youTabView>[0]['status'];
const SESSION: Status[] = ['checkingConsent', 'needsConsent', 'ready', 'signingOut'];
const NO_SESSION: Status[] = ['restoring', 'signedOut', 'signingIn', 'awaitingCode'];

describe('the named states', () => {
  it('A: a phone with a session is signed in whether or not an account has claimed its letters yet', () => {
    for (const status of SESSION) for (const owner of [null, 'user-1']) {
      expect(youTabView({ signIn: true, status, owner }), `${status} ${owner}`).toMatchObject({ state: 'account', signedOutCard: false, localStartLine: false });
    }
  });

  it('B: no session and the phone was claimed by an account before', () => {
    for (const status of NO_SESSION) expect(youTabView({ signIn: true, status, owner: 'user-1' }), status).toEqual({ state: 'signedOut', signedOutCard: true, localStartLine: false, accountReady: false });
  });

  it('C: no session and no account has ever claimed this phone', () => {
    for (const status of NO_SESSION) expect(youTabView({ signIn: true, status, owner: null }), status).toEqual({ state: 'localStart', signedOutCard: true, localStartLine: true, accountReady: false });
  });

  it('0: a build without sign-in keeps today\'s card, whatever the status or owner', () => {
    for (const status of [...SESSION, ...NO_SESSION]) for (const owner of [null, 'user-1']) {
      expect(youTabView({ signIn: false, status, owner }).state).toBe('noSignIn');
      expect(youTabView({ signIn: false, status, owner }).signedOutCard).toBe(false);
    }
    expect(headerCard({ signIn: false, status: 'signedOut', provider: null, signsAs: null })).toEqual({ title: 'On this phone', subtitle: undefined, route: null, hint: undefined });
  });

  it('a just-signed-in phone is A, never C: the session decides, the sync owner only separates B from C', () => {
    // The owner is written by takeOwnership when sync starts (after consent and the claim screen), later than the sign-in.
    const afterVerify = { signIn: true, owner: null as string | null };
    for (const status of ['checkingConsent', 'needsConsent'] as const) expect(youTabView({ ...afterVerify, status }).state).toBe('account');
    expect(read('lib/sync/ownership.ts')).toMatch(/writeSetting\(db, SYNC_SETTING\.owner, userId\)/);
    expect(read('lib/sync/engine.ts')).toMatch(/result = takeOwnership\(db, userId, ctx\(\)\)/);
    expect(read('lib/store.ts')).toMatch(/export function currentUserId\(\): string \| null \{\s*return getSetting\(SYNC_SETTING\.owner\);/);
    expect(home).toMatch(/youTabView\(\{ signIn: capabilities\.signIn, status: auth\.state\.status, owner: currentUserId\(\) \}\)/);
  });
});

describe('Delete account: one meaning of signed in for the card and the row (GAP 2)', () => {
  it('the row needs the build flag, a session and a settled session; absent during checkingConsent, needsConsent and signingOut', () => {
    const m = home.match(/\{([^{}?]+)\?\s*\(\s*<ListSection>\s*<ListRow title=\{h\.deleteAccountLabel\}/);
    expect(m, 'the Delete account row and its condition').not.toBeNull();
    const shown = new Function('capabilities', 'auth', 'you', `return Boolean(${m![1]});`) as (c: unknown, a: unknown, y: unknown) => boolean;
    for (const status of SESSION) {
      const you = youTabView({ signIn: true, status, owner: 'user-1' });
      const want = status === 'ready';
      expect(shown({ accountDeletion: true }, { signedIn: true }, you), status).toBe(want);
      // The card is the Account card in the same four statuses: the two cannot disagree about having an account.
      expect(you.state, status).toBe('account');
      // The deletion flag is still required.
      expect(shown({ accountDeletion: false }, { signedIn: true }, you), `${status} flag off`).toBe(false);
    }
    for (const status of NO_SESSION) expect(shown({ accountDeletion: true }, { signedIn: false }, youTabView({ signIn: true, status, owner: null })), status).toBe(false);
  });

  it('the gate is not loosened: the row still reads capabilities.accountDeletion and auth.signedIn, and the route is unchanged', () => {
    expect(home).toMatch(/\{capabilities\.accountDeletion && auth\.signedIn && you\.accountReady \? \(/);
    expect(code(read('app/settings/delete-account.tsx'))).toMatch(/return capabilities\.accountDeletion \? <DeleteAccount \/> : <Redirect href="\/settings" \/>;/);
  });
});

describe('Account passkey rows are hidden, not removed (Build 12)', () => {
  it('they draw only behind passkeysAvailable(), which is off unless EXPO_PUBLIC_PASSKEYS=1; no build profile sets it', () => {
    expect(account).toMatch(/const showPasskeys = auth\.signedIn && passkeysAvailable\(\);/);
    expect(account).toMatch(/\{showPasskeys && \(\s*<ListSection title=\{a\.passkeysTitle\}/);
    expect(read('lib/auth/passkey.ts')).toMatch(/const ENABLED = process\.env\.EXPO_PUBLIC_PASSKEYS === '1';\s*[\s\S]*if \(!ENABLED \|\| Platform\.OS !== 'ios'\) return false;/);
    // The code stays: add and remove handlers are still there.
    expect(account).toMatch(/registerPasskey\(client\)/);
    expect(account).toMatch(/deletePasskey\(client, p\.id\)/);
  });
});

describe('Erase everything and Delete this book follow the code (founder ruling d)', () => {
  it('they are hidden once the phone has been claimed by an account, and the You tab state does not change that', () => {
    expect(read('lib/store.ts')).toMatch(/export function localDeletionAllowed\(\): boolean \{\s*return syncOwner\(ctx\(\)\.db\) === null;/);
    expect(home).toMatch(/\{localDeletionAllowed\(\) \? \(\s*<ListRow title=\{copy\.settings\.erase\.rowLabel\}/);
    expect(code(read('app/settings/children/[id].tsx'))).toMatch(/localDeletionAllowed\(\)/);
    expect(code(read('app/settings/children/delete-book.tsx'))).toMatch(/!localDeletionAllowed\(\)/);
    // The card, the states and the Sign in card never read it: no second rule.
    expect(card).not.toMatch(/localDeletionAllowed|erase/i);
  });
});

describe('the Sign in card (B and C)', () => {
  it('names where the letters are, with the words in packages/content; C adds one paragraph; no co-parent, family or sharing', () => {
    expect(en.settingsHome.signedOut.body).toBe('Your letters are on this phone.');
    expect(en.settingsHome.signedOut.body).not.toMatch(/any phone|new phone|opens?\b/i);
    expect(en.settingsHome.localStart.body).toBe('This book is on this phone. Signing in adds it to your account after you agree.');
    expect(en.settingsHome.localStart.body).not.toMatch(/\bmoves?\b/i);
    expect(en.settingsHome).not.toHaveProperty('childFallback'); // the nameless row and title use develop's childRowTitle, "Your child"
    expect(en.settingsHome.youTabHint).toBe('Settings and account');
    const words = [en.settingsHome.signedOut.body, en.settingsHome.localStart.body, authCopy.account.signedOutTitle, authCopy.account.signIn].join(' ');
    expect(words).not.toMatch(/co-parent|other parent|family|share|sharing|backup|back up|safe\b|\bAI\b/i);
    expect(words).not.toMatch(/[–—‘’“”…]/);
    // No flag at all in the card: it has no co-parent wording to key off familySurfacesShown, and it never reads the sign-in switch for wording.
    expect(card).not.toMatch(/coParent|familySurfacesShown|capabilities/);
    expect(card).toMatch(/h\.signedOut\.body/);
    expect(card).toMatch(/localStart \? \(/);
  });

  it('has exactly one button, a heading first and Sign in last, and the card as a whole is not a button', () => {
    expect(card.match(/<Button\b/g)).toHaveLength(1);
    expect(card).not.toMatch(/<Card[^>]*onPress/);
    expect(card.indexOf('asHeading')).toBeLessThan(card.indexOf('h.signedOut.body'));
    expect(card.indexOf('h.signedOut.body')).toBeLessThan(card.indexOf('h.localStart.body'));
    expect(card.indexOf('h.localStart.body')).toBeLessThan(card.indexOf('<Button'));
    expect(card).toMatch(/<Card variant="outlined"/);
    expect(card).toMatch(/variant="primary"\s+size="md"\s+fullWidth\s+label=\{authCopy\.account\.signIn\}/);
    expect(card).toMatch(/pathname: '\/sign-in', params: \{ trigger: 'settings' \}/);
  });

  it('keeps 44 pt targets and lets every line wrap: md is 48 pt, no line limit anywhere on the card', () => {
    expect(card).not.toMatch(/numberOfLines|ellipsize|adjustsFontSizeToFit/);
    expect(code(read('components/ui/button.tsx'))).toMatch(/md: 'min-h-12 /);
    expect(tokens.target.min).toBe(44);
  });
});

describe('12. Acceptance checks', () => {
  it('Three states render from one component; A shows the Account card, B and C show SignedOutCard.', () => {
    expect(home.match(/<SignedOutCard /g)).toHaveLength(1);
    expect(home).toMatch(/\{!you\.signedOutCard \? \(\s*<ListSection>\s*<ListRow\s+title=\{card\.title\}/);
    expect(code(read('app/(tabs)/you.tsx')).trim()).toBe("export { default } from '../settings/index';");
  });

  it('Plan row is present in A, B and C.', () => {
    expect(home.match(/title=\{h\.planLabel\}/g)).toHaveLength(2);
    // B and C: in its own section directly under the card.
    expect(home).toMatch(/<SignedOutCard localStart=\{you\.localStartLine\} \/>\s*<ListSection>\s*<ListRow title=\{h\.planLabel\}/);
    expect(home.match(/ROUTES\.plan\b/g)).toHaveLength(2);
  });

  it('B and C cards have exactly one button; C has the extra paragraph; neither names a co-parent, family or sharing.', () => {
    expect(card.match(/<Button\b/g)).toHaveLength(1);
    expect(youTabView({ signIn: true, status: 'signedOut', owner: 'u' }).localStartLine).toBe(false);
    expect(youTabView({ signIn: true, status: 'signedOut', owner: null }).localStartLine).toBe(true);
  });

  it('Erase everything is present only in C and 0; absent in A and B (until GAP 3 is decided otherwise).', () => {
    // "Present" is localDeletionAllowed(): the sync owner is empty. A has an owner once sync started, B always has one.
    expect(localDeletionAllowedFor(null)).toBe(true);
    expect(localDeletionAllowedFor('user-1')).toBe(false);
  });

  it('Account has no Sync and sharing label; Sync reads "Sync".', () => {
    expect(account).toMatch(/<ListRow title=\{a\.syncTitle\} trailing=\{a\.sync\[view\.sync\]\} \/>/);
    expect(account).not.toMatch(/a\.syncLabel/);
    // No section heading over the one row, so VoiceOver says it once.
    expect(account).not.toMatch(/<ListSection title=\{a\.syncTitle\}/);
    expect(authCopy.account.syncTitle).toBe('Sync');
    // Finish setting up and Agree and sync stay in the same section, as the row's siblings.
    expect(account).toMatch(/a\.finishSetup[\s\S]*copy\.sensitiveConsent\.agreeButton/);
  });

  it('Account keeps its passkey rows as they are (founder ruling f; a product question)', () => {
    expect(account).toMatch(/a\.addPasskey/);
    expect(account).toMatch(/a\.removePasskey/);
  });

  it('Nameless child row has a title: develop\'s childRowTitle, "Your child", on the row and the page.', () => {
    expect(childRowTitle('')).toBe('Your child');
    expect(childRowTitle('   ')).toBe('Your child');
    expect(childRowTitle(null)).toBe('Your child');
    expect(childRowTitle('Asha')).toBe('Asha');
    expect(home).toMatch(/title=\{childRowTitle\(ch\.name\)\}/);
    expect(home).not.toMatch(/title=\{ch\.name\}/);
    expect(child).toMatch(/title: name\.trim\(\) \? fill\(s\.title, \{ child: name \}\) : childRowTitle\(name\)/);
  });

  it('Header "Settings" is heading 1 and VoiceOver does not start on "Back".', () => {
    const layout = code(read('app/(tabs)/_layout.tsx'));
    const block = layout.slice(layout.indexOf('name="you"'));
    expect(block).toMatch(/headerTitle: copy\.settings\.title/);
    expect(block).not.toMatch(/headerLeft/);
    // The tab button says what the tab holds, from content.
    expect(layout).toMatch(/title === t\.you \? \{ \.\.\.base, accessibilityHint: copy\.settingsHome\.youTabHint \} : base/);
  });
});
