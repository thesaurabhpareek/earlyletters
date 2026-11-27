/**
 * CDesO-63 (BL-479 point 4): an `authCopy` label on a control a person presses is a button for the 22-character rule
 * ("Every button label is 22 characters or fewer with the Asha fixtures", EXPERIENCE_PASS_2026-10.md:28), whether or
 * not someone remembered to put it on `AUTH_BUTTONS`. A `ListRow` with no `onPress` is not a control and is not held
 * to 22 (the Sync value row, and `signOutWaiting`, a sentence by design).
 *
 * The scan covers every file under apps/mobile/src that reads `authCopy`. rules.test.ts holds the listed keys to 22;
 * this test makes sure the lists cannot fall behind the screens, and holds AUTH_PRESSABLE (the keys the scan found on
 * no list) to 22 itself. It lives here, not in rules.test.ts (stream 4's file).
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { describe, expect, it } from 'vitest';
import { authCopy } from '../src';
import { AUTH_PRESSABLE, get, SURFACES } from './support/copy-surfaces';
import { expandSites, pressableAuthKeys, pressableProblems, type PressableSite } from './support/pressable-labels';

const REPO = join(__dirname, '../../..');
const MOBILE_SRC = join(REPO, 'apps/mobile/src');
const AUTH = SURFACES.find((s) => s.copy === authCopy)!;
/** The button lists for authCopy: AUTH_BUTTONS (held to 22 by rules.test.ts) and AUTH_PRESSABLE (held here). */
const LISTED: readonly string[] = [...AUTH.buttons, ...AUTH_PRESSABLE];

function tsxFiles(dir: string, out: string[] = []): string[] {
  for (const n of readdirSync(dir).sort()) {
    const p = join(dir, n);
    if (statSync(p).isDirectory()) tsxFiles(p, out);
    else if (n.endsWith('.tsx') && !/\.test\.tsx$/.test(n)) out.push(p);
  }
  return out;
}

const SCREENS = tsxFiles(MOBILE_SRC)
  .map((p) => ({ file: relative(REPO, p).split('\\').join('/'), source: readFileSync(p, 'utf8') }))
  .filter((f) => /\bauthCopy\b/.test(f.source));
const SITES: PressableSite[] = expandSites(
  SCREENS.flatMap((f) => pressableAuthKeys(f.source, f.file)),
  authCopy,
);
const KEYS = new Set(SITES.map((s) => s.key));

describe('[CDesO-63] every authCopy label on a pressable control is held to the button rule', () => {
  it('[CDesO-63] scans every screen that reads authCopy and finds the Account rows the ruling names', () => {
    expect(AUTH).toBeDefined();
    expect(SCREENS.map((f) => f.file)).toContain('apps/mobile/src/app/settings/account.tsx');
    // The four pressable Account rows CDesO-63 found on no list, and two that already were: if the scan stops seeing
    // them, it has stopped working, and this fails before the list can quietly fall behind.
    for (const key of ['account.finishSetup', 'account.passkeyFallbackName', 'account.addPasskey', 'account.signOutOthers', 'account.signOut', 'account.signIn']) {
      expect([...KEYS], key).toContain(key);
    }
  });

  it('[CDesO-63] leaves a ListRow with no onPress out: the Sync value row and the waiting sentence', () => {
    expect(KEYS.has('account.syncTitle')).toBe(false);
    expect(KEYS.has('account.signOutWaiting')).toBe(false);
    expect([...KEYS].some((k) => k.startsWith('account.sync.'))).toBe(false);
  });

  it('[CDesO-63] every such label is on a button list and is 22 characters or fewer, as written and with the Asha fixtures', () => {
    expect(pressableProblems(SITES, authCopy, LISTED, AUTH.vars)).toEqual([]);
  });

  it('[CDesO-63] AUTH_PRESSABLE cannot go stale: each key is a string the scan finds, on one list only', () => {
    expect(AUTH_PRESSABLE.filter((k) => !KEYS.has(k))).toEqual([]);
    expect(AUTH_PRESSABLE.filter((k) => AUTH.buttons.includes(k))).toEqual([]);
    expect(new Set(AUTH_PRESSABLE).size).toBe(AUTH_PRESSABLE.length);
    // Held to 22 here whether or not a screen draws it today, as rules.test.ts holds AUTH_BUTTONS.
    const fill = (t: string) => t.replace(/\{(\w+)\}/g, (m, k: string) => AUTH.vars[k] ?? m);
    for (const k of AUTH_PRESSABLE) {
      const t = get(authCopy, k);
      expect(typeof t, k).toBe('string');
      expect((t as string).length, k).toBeLessThanOrEqual(22);
      expect(fill(t as string).length, k).toBeLessThanOrEqual(22);
    }
  });

  // The ruling's mutant: a 23-character pressable row label on no list must fail.
  it('[CDesO-63] mutant: a 23-character pressable row label on no list fails', () => {
    const source = [
      "import { authCopy } from '@/lib/auth/copy';",
      'export function Page() {',
      '  const a = authCopy.account;',
      '  return (<>',
      '    <ListRow title={a.tooLong} onPress={() => {}} />',
      '    <ListRow title={a.status} />',
      '  </>);',
      '}',
    ].join('\n');
    const copy = { account: { tooLong: 'Sign out other devices.', status: 'A row nothing can press, and long by design.' } };
    expect(copy.account.tooLong).toHaveLength(23);
    const sites = pressableAuthKeys(source, 'mutant.tsx');
    expect(sites.map((s) => s.key)).toEqual(['account.tooLong']);
    expect(pressableProblems(sites, copy, [], AUTH.vars)).toEqual([
      'mutant.tsx:5 <ListRow> account.tooLong: on no button list',
      'mutant.tsx:5 <ListRow> account.tooLong: over 22 characters (23)',
    ]);
    // Listing it does not let it through: it is still held to 22.
    expect(pressableProblems(sites, copy, ['account.tooLong'], AUTH.vars)).toEqual(['mutant.tsx:5 <ListRow> account.tooLong: over 22 characters (23)']);
  });

  it('[CDesO-63] resolves the ways the screens name a label: aliases, destructuring, both sides of a choice', () => {
    const source = [
      "import { authCopy as copyA } from '@scribe/content';",
      'const { termsLink } = copyA.consent.terms;',
      'function A({ busy }: { busy: boolean }) {',
      '  const k = copyA.code;',
      '  return <Button label={busy ? copyA.sheet.busy : k.verify} onPress={go} />;',
      '}',
      'function B() {',
      '  const k = copyA.email;',
      '  return <><QuietButton label={k.send} onPress={go} /><Button label={termsLink} onPress={go} /></>;',
      '}',
      'const C = () => <ListRow title="Literal" value={copyA.account.sync["on"]} onPress={go} />;',
    ].join('\n');
    expect(pressableAuthKeys(source, 'x.tsx').map((s) => s.key)).toEqual(['sheet.busy', 'code.verify', 'email.send', 'consent.terms.termsLink', 'account.sync.on']);
  });
});
