/// <reference types="node" />
/**
 * [B5-7] the backup gate check (scripts/lib/backup-gate-check.mjs; BRIEF B5 PR 4, CR-71 B5): `EXPO_PUBLIC_BACKUP=on`
 * fails unless B5 exists, the escrow key list is not empty and the /stop route file exists with a unit test that
 * answers 200. Static only: no network. One mutant per condition: drop it and its test goes red.
 * Also reads the real repo: today every profile is off, so the check passes with nothing required.
 */
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { B5_FILES, B5_MARKERS, backupGateProblems, bundledEscrowKeyCount, gatherBackupGateInputs, stripComments } from '../scripts/lib/backup-gate-check.mjs';

const KEY = Buffer.from(Array.from({ length: 32 }, (_, i) => i + 1)).toString('base64'); // a plausible 32-byte key (a fixture, not a real one)
const GOOD = {
  profiles: { production: 'on', development: 'off' } as Record<string, string | undefined>,
  missingB5Files: [] as string[],
  missingB5Markers: [] as string[],
  profileCount: 5,
  escrowKeyCount: 1,
  stopRouteFile: true,
  stopTestAnswers200: true,
};
const ids = (i: Parameters<typeof backupGateProblems>[0]) => backupGateProblems(i).problems.map((p: { id: string }) => p.id);

describe('[B5-7] the backup gate check', () => {
  it('flag on with all three present: no problem', () => {
    expect(backupGateProblems(GOOD)).toEqual({ on: true, problems: [] });
  });

  it('no profile on (and no shell value): nothing is required, even with everything missing', () => {
    const none = { ...GOOD, profiles: { production: 'off', preview: undefined }, missingB5Files: ['x'], escrowKeyCount: 0, stopRouteFile: false };
    expect(backupGateProblems(none)).toEqual({ on: false, problems: [] });
  });

  it('the flag is read as the app reads it: ON, On and " on " are on (a profile and the shell); off values stay off', () => {
    for (const v of ['ON', 'On', ' on ', '\ton\n']) {
      expect(ids({ ...GOOD, profiles: { production: v }, escrowKeyCount: 0 }), `profile ${JSON.stringify(v)}`).toEqual(['escrow-keys-empty']);
      expect(ids({ ...GOOD, profiles: {}, shellValue: v, escrowKeyCount: 0 }), `shell ${JSON.stringify(v)}`).toEqual(['escrow-keys-empty']);
    }
    for (const v of ['off', 'OFF', '', 'onn', 'true', '1', undefined]) {
      expect(backupGateProblems({ ...GOOD, profiles: { production: v }, shellValue: v, escrowKeyCount: 0 }).on, String(v)).toBe(false);
    }
  });

  it('a shell value of on with an eas.json that lists no profiles is a problem; with the shell not on there is nothing to check', () => {
    expect(ids({ ...GOOD, profiles: {}, profileCount: 0, shellValue: 'on' })).toEqual(['eas-no-profiles']);
    expect(backupGateProblems({ ...GOOD, profiles: {}, profileCount: 0 })).toEqual({ on: false, problems: [] });
  });

  it('the shell value counts as on', () => {
    expect(ids({ ...GOOD, profiles: {}, shellValue: 'on', escrowKeyCount: 0 })).toEqual(['escrow-keys-empty']);
  });

  it('mutant: B5 missing (a file, or a function gone) fails', () => {
    expect(ids({ ...GOOD, missingB5Files: ['src/lib/backup/token-vault.ts'] })).toEqual(['b5-missing']);
    expect(ids({ ...GOOD, missingB5Markers: ['src/lib/erase-everything.ts deleteBackupFiles'] })).toEqual(['b5-missing']);
  });

  it('mutant: an empty escrow key list fails', () => {
    expect(ids({ ...GOOD, escrowKeyCount: 0 })).toEqual(['escrow-keys-empty']);
  });

  it('mutant: no /stop route file fails; a route with no 200 test fails differently', () => {
    expect(ids({ ...GOOD, stopRouteFile: false })).toEqual(['stop-route-missing']);
    expect(ids({ ...GOOD, stopTestAnswers200: false })).toEqual(['stop-test-missing']);
  });

  it('all three missing: three problems, each naming the profile that is on', () => {
    const r = backupGateProblems({ ...GOOD, missingB5Files: ['a'], escrowKeyCount: 0, stopRouteFile: false });
    expect(r.problems.map((p: { id: string }) => p.id)).toEqual(['b5-missing', 'escrow-keys-empty', 'stop-route-missing']);
    for (const p of r.problems) expect(p.msg).toContain('production');
  });
});

describe('[B5-7] reading the escrow key list', () => {
  const src = (body: string) => `export const BUNDLED_ESCROW_KEYS: readonly EscrowPublicKey[] = [\n${body}\n];\n`;
  it('empty, or only a commented-out key: zero', () => {
    expect(bundledEscrowKeyCount(src(''))).toBe(0);
    expect(bundledEscrowKeyCount(src(`  // TODO(S07): { version: 1, publicKey: '${KEY}' },`))).toBe(0);
    expect(bundledEscrowKeyCount(src(`  /* { version: 1, publicKey: '${KEY}' }, */`))).toBe(0);
  });
  it('a placeholder does not count: TODO, too short, not base64, all zero bytes, 33 bytes', () => {
    for (const k of ['TODO', 'AAAA', '<base64 of 32 raw X25519 bytes>', 'A'.repeat(43) + '=', Buffer.alloc(33, 5).toString('base64'), KEY.slice(0, 40)]) {
      expect(bundledEscrowKeyCount(src(`  { version: 1, publicKey: '${k}' },`)), k).toBe(0);
    }
  });
  it('a real entry counts; an entry with an empty key does not', () => {
    expect(bundledEscrowKeyCount(src(`  { version: 1, publicKey: '${KEY}' },`))).toBe(1);
    expect(bundledEscrowKeyCount(src("  { version: 1, publicKey: '' },"))).toBe(0);
    expect(bundledEscrowKeyCount(src(`  { version: 1, publicKey: '${KEY}' },\n  { version: 2, publicKey: '${KEY}' },`))).toBe(2);
  });
  it('strips comments but not a URL', () => {
    expect(stripComments('a // b\nhttps://x')).toBe('a \nhttps://x');
  });
});

describe('[B5-7] the real repository', () => {
  const mobile = join(__dirname, '..');
  const web = join(__dirname, '..', '..', 'web');
  const io = { exists: existsSync, read: (p: string) => readFileSync(p, 'utf8'), list: (d: string) => readdirSync(d) };
  const inputs = gatherBackupGateInputs({ mobileDir: mobile, webDir: web, join, io, shellValue: undefined });

  it('every EAS profile is off today, so nothing is required (and the lists name real files)', () => {
    expect(Object.values(inputs.profiles).every((v) => v !== 'on')).toBe(true);
    expect(backupGateProblems(inputs).problems).toEqual([]);
    expect(B5_FILES.length).toBeGreaterThan(0);
    expect(B5_MARKERS.length).toBeGreaterThan(0);
  });

  it('what it reads is what the repo says: the escrow list is read from escrow-keys.ts, and a profile turned on would be caught', () => {
    expect(inputs.escrowKeyCount).toBe(bundledEscrowKeyCount(readFileSync(join(mobile, 'src/lib/backup/escrow-keys.ts'), 'utf8')));
    const wouldBeOn = { ...inputs, profiles: { ...inputs.profiles, production: 'on' } };
    expect(backupGateProblems(wouldBeOn).on).toBe(true);
  });

  it('extends: a profile inherits its parent\'s flag, its own env wins; a cycle does not hang', () => {
    const files = new Map<string, string>([
      ['/m/eas.json', JSON.stringify({ build: { base: { env: { EXPO_PUBLIC_BACKUP: 'ON' } }, child: { extends: 'base' }, own: { extends: 'base', env: { EXPO_PUBLIC_BACKUP: 'off' } }, a: { extends: 'b' }, b: { extends: 'a' } } })],
    ]);
    const io = { exists: (p: string) => files.has(p), read: (p: string) => files.get(p) ?? '', list: () => [] as string[] };
    const got = gatherBackupGateInputs({ mobileDir: '/m', webDir: '/w', join: (...p: string[]) => p.join('/'), io, shellValue: undefined });
    expect(got.profiles).toEqual({ base: 'ON', child: 'ON', own: 'off', a: undefined, b: undefined });
    expect(got.profileCount).toBe(5);
  });

  it('a fixture tree with all three present reads as present (no network, only the file system)', () => {
    const files = new Map<string, string>([
      ['/m/eas.json', JSON.stringify({ build: { production: { env: { EXPO_PUBLIC_BACKUP: 'on' } } } })],
      ...B5_FILES.map((f) => [`/m/${f}`, ''] as [string, string]),
      ['/m/src/lib/backup/escrow-keys.ts', `export const BUNDLED_ESCROW_KEYS = [ { version: 1, publicKey: '${KEY}' } ];`],
      ['/w/src/app/stop/page.tsx', ''],
      ['/w/test/stop.test.ts', 'expect(res.status).toBe(200)'],
    ]);
    for (const f of new Set(B5_MARKERS.map(([p]) => p))) files.set(`/m/${f}`, B5_MARKERS.filter(([p]) => p === f).map(([, re]) => (re as RegExp).source.replace(/\\b|\\/g, '')).join('\n'));
    const fixture = {
      exists: (p: string) => files.has(p) || p === '/w/test',
      read: (p: string) => files.get(p) ?? '',
      list: (d: string) => [...files.keys()].filter((k) => k.startsWith(`${d}/`)).map((k) => k.slice(d.length + 1)),
    };
    const joinPosix = (...p: string[]) => p.join('/');
    const got = gatherBackupGateInputs({ mobileDir: '/m', webDir: '/w', join: joinPosix, io: fixture, shellValue: undefined });
    expect(backupGateProblems(got)).toEqual({ on: true, problems: [] });
  });
});
