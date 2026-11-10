/// <reference types="node" />
/**
 * BL-801 slice 4c: Settings > Account sections that 4b left (YOU-TAB-STATES-9nov section 5; NX-36 S15): Signs letters as,
 * Ways to sign in (read only), Lock, Your data (Plan, Sync, Export), Help, in that order, with the sections that were
 * already there (Devices, passkeys, Sign out) as they were. Screens do not load in Node, so their structure is pinned in
 * their source, as you-tab-states.test.ts does.
 *
 * Not checkable here, and never checked by this file: VoiceOver reading order, AX5 wrapping, 44 pt targets on a device,
 * Reduce Motion. Those are device checks.
 *
 * Not built, and pinned as not built so nobody adds it by accident: a Devices list (no `list_my_sessions` anywhere in the
 * app or the database), the session-3 lock offer (the ask sequencer has no lock offer and #702's counter is a draft), and S17's "recording elsewhere" line
 * (the letter page draws a Play button for every spoken letter).
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { authCopy, en } from '@scribe/content';
import { methodSubtitle, signInMethods, signedInWithKind } from '../src/lib/auth/methods.logic';

const SRC = join(__dirname, '..', 'src');
const read = (p: string) => readFileSync(join(SRC, p), 'utf8');
const code = (t: string) => t.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\{\/\*[\s\S]*?\*\/\}/g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');
const account = code(read('app/settings/account.tsx'));
const at = (needle: string) => {
  const i = account.indexOf(needle);
  expect(i, `account.tsx has ${needle}`).toBeGreaterThan(-1);
  return i;
};

describe('Account sections, in the order of the spec', () => {
  it('the signed-in page draws You, Signs letters as, Ways to sign in, Devices, Lock, Your data, Help, Sign out, in that order', () => {
    const order = ['a.signedInWith[provider]', 'a.signsAsTitle', 'a.methodsTitle', 'a.devicesTitle', 'appLockCopy.settingsHome.appLock', 'a.dataTitle', 'h.helpLabel', 'a.signOut}'];
    const where = order.map(at);
    expect(where).toEqual([...where].sort((x, y) => x - y));
  });

  it('Signs letters as: one row, the name as its value, opens the book page where the editor lives; Account keeps no copy', () => {
    expect(account).toMatch(/title=\{a\.signsAsTitle\}/);
    expect(account).toMatch(/pathname: '\/settings\/children\/\[id\]', params: \{ id: active\.id \}/);
    expect(account).toMatch(/active\.signsAs\?\.trim\(\)/);
    expect(authCopy.account.signsAsTitle).toBe('Signs letters as');
    // Never the child's name: the row is about the parent.
    expect(account.slice(at('a.signsAsTitle'), at('a.methodsTitle'))).not.toMatch(/active\.name/);
  });

  it('Ways to sign in is read only: rows with no onPress, no Add and no Remove inside the section', () => {
    const section = account.slice(at('a.methodsTitle'), at('showPasskeys && ('));
    expect(section).toMatch(/methods\.map\(/);
    expect(section).not.toMatch(/onPress/);
    expect(section).not.toMatch(/addPasskey|removePasskey|registerPasskey|deletePasskey/);
  });

  it('passkey rows stay hidden behind passkeysAvailable(), exactly as before', () => {
    expect(account).toMatch(/const showPasskeys = auth\.signedIn && passkeysAvailable\(\);/);
    expect(account).toMatch(/\{showPasskeys && \(\s*<ListSection title=\{a\.passkeysTitle\}/);
  });

  it('Lock: the App lock row with its On or Off value opens the existing page and says nothing about the account', () => {
    const lock = account.slice(at('appLockCopy.settingsHome.appLock'), at('a.dataTitle'));
    expect(lock).toMatch(/lockOn \? appLockCopy\.settingsHome\.appLockOn : appLockCopy\.settingsHome\.appLockOff/);
    expect(lock).toMatch(/router\.push\('\/settings\/app-lock'\)/);
    expect(lock).not.toMatch(/protect|your account/i);
  });

  it('Your data groups Plan, Sync and Export, with the one Sync row unchanged', () => {
    const data = account.slice(at('a.dataTitle'), at('h.helpLabel'));
    expect(data).toMatch(/title=\{h\.planLabel\}[\s\S]*title=\{a\.syncTitle\}[\s\S]*a\.finishSetup[\s\S]*copy\.sensitiveConsent\.agreeButton[\s\S]*title=\{h\.exportLabel\}/);
    expect(data).toMatch(/router\.push\('\/settings\/plus'\)/);
    expect(data).toMatch(/router\.push\('\/settings\/export'\)/);
    expect(authCopy.account.dataTitle).toBe('Your data');
    // The Settings home keeps its own retired key retired (settings-home.test.ts).
    expect((en.settingsHome.sections as Record<string, unknown>).data).toBeUndefined();
  });

  it('Help is one row, the support mailbox with the fixed subject and nothing else (the same hook and subject as Settings)', () => {
    expect(account).toMatch(/help\.open\(mailTarget\(h\.helpSubject\)\)/);
    expect(account.match(/title=\{h\.helpLabel\}/g)).toHaveLength(1);
    expect(account).toMatch(/\{help\.sheet\}/);
    const addresses = (account.match(/@[a-z0-9-]+\.[a-z]{2,}/gi) ?? []).length;
    expect(addresses, 'no address typed into the screen: brand.support through the settings copy').toBe(0);
  });

  it('Delete account is still not repeated in Account (one entry, on the You tab root)', () => {
    expect(account).not.toMatch(/deleteAccount|delete-account/);
  });

  it('no section claims backup or safekeeping, and none names a co-parent, family or sharing', () => {
    expect(account).not.toMatch(/coParent|family|sharing|backup/i);
  });
});

describe('Ways to sign in (pure)', () => {
  const ids = [
    { provider: 'apple', created_at: '2026-11-01T09:30:00.000Z' },
    { provider: 'email', created_at: '2026-11-05T09:30:00.000Z' },
  ];

  it('one row per method with the day it was added, and the mark on the method used here', () => {
    expect(signInMethods(ids, 'email')).toEqual([
      { kind: 'apple', addedOn: '2026-11-01', current: false },
      { kind: 'email', addedOn: '2026-11-05', current: true },
    ]);
  });

  it('a method listed twice is one row; an unknown provider reads as another way', () => {
    expect(signInMethods([...ids, { provider: 'apple', created_at: '2026-11-09T00:00:00Z' }], 'apple').map((r) => r.kind)).toEqual(['apple', 'email']);
    expect(signInMethods([{ provider: 'github' }], null)).toEqual([{ kind: 'other', addedOn: null, current: true }]);
  });

  it('with no identities the one known method still has its row, with no invented date', () => {
    expect(signInMethods(undefined, 'google')).toEqual([{ kind: 'google', addedOn: null, current: true }]);
    expect(signInMethods([], null)).toEqual([]);
  });

  it('a date that is not a date is no date', () => {
    expect(signInMethods([{ provider: 'apple', created_at: 'yesterday' }], 'apple')[0]!.addedOn).toBeNull();
    expect(signInMethods([{ provider: 'apple', created_at: 5 }], 'apple')[0]!.addedOn).toBeNull();
  });

  it('exactly one row is marked, even when the method used is not listed', () => {
    expect(signInMethods(ids, 'google').filter((r) => r.current)).toHaveLength(1);
  });

  it('the method used here is the last method, else the account provider (a passkey sign-in reads as the provider)', () => {
    expect(signedInWithKind('google', 'apple')).toBe('google');
    expect(signedInWithKind('passkey', 'apple')).toBe('apple');
    expect(signedInWithKind(null, null)).toBeNull();
  });

  it('the row text is the added line, then the "this is how you signed in" line', () => {
    const words = { thisOne: authCopy.account.methodThisOne, addedOn: (d: string) => `${authCopy.account.methodAdded} ${d}` };
    expect(methodSubtitle({ kind: 'email', addedOn: '2026-11-05', current: true }, words)).toBe('Added 2026-11-05\nThis is how you signed in');
    expect(methodSubtitle({ kind: 'apple', addedOn: null, current: true }, words)).toBe('This is how you signed in');
    expect(methodSubtitle({ kind: 'apple', addedOn: null, current: false }, words)).toBeUndefined();
  });

  it('the words: no co-parent, family, sharing, backup, safe, em dash or ellipsis in what was added', () => {
    const a = authCopy.account;
    const words = [a.signsAsTitle, a.methodsTitle, a.methodThisOne, a.methodAdded, a.dataTitle, ...Object.values(a.methodNames)].join(' ');
    expect(words).not.toMatch(/co-?parent|family|shar|backup|backed|safe|kept|—|–|…|[‘’“”]/i);
  });
});

describe('Left unbuilt on purpose (each is a gap named in the PR)', () => {
  const walk = (dir: string): string[] =>
    readdirSync(dir).flatMap((f) => {
      const p = join(dir, f);
      return statSync(p).isDirectory() ? walk(p) : /\.(ts|tsx)$/.test(f) ? [p] : [];
    });

  it('there is no device-list data in the app, so Account draws no Devices list', () => {
    for (const f of walk(SRC)) expect(readFileSync(f, 'utf8'), f).not.toMatch(/list_my_sessions|listMySessions/);
    expect(account).not.toMatch(/devicesThisPhone|devicesOther|devicesLastUsed/);
    // The one Devices row that exists today stays as it was.
    expect(account).toMatch(/<ListSection title=\{a\.devicesTitle\} footer=\{a\.signOutOthersHelp\}>/);
  });

  it('the lock offer is still only on the first-run finish and not moved: the session-3 sequencer is not in the app', () => {
    expect(code(read('app/onboarding.tsx'))).toMatch(/<LockOffer child=\{child\} \/>/);
    // The ask sequencer knows the reminder prime and Keep the book only; it has no lock offer and no kept-letter session counter (#702).
    expect(read('lib/asks/next-ask.logic.ts')).toMatch(/export type NextAsk = 'reminder_prime' \| 'keep_book' \| null;/);
  });

  it('S17: the letter page still draws the player for a spoken letter, so no "recording elsewhere" line is wired', () => {
    expect(code(read('app/letter/[id].tsx'))).toMatch(/\{spoken && <AudioPlayer entryId=\{entry\.id\} \/>\}/);
    expect(JSON.stringify(authCopy)).not.toMatch(/arrivedWords|audioElsewhere/);
  });
});
