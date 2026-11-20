/// <reference types="node" />
/**
 * [NS-08-R6] Sign out never removes a recording (BL-976; ruling D1). With backup off a recording lives only on this
 * phone, so a sign-out that removed one would lose it for good; #847 Q1 puts this row's test before the Build 13 cut.
 * What a sign-out runs today: the provider's finishing effect (session-provider.tsx: Supabase sign-out with
 * scope 'local', forget the Apple user id, forget a pending email request), then the sync engine sees signed in become
 * signed out and only forgets the owner of an empty phone (sync/index.ts releaseEmptyPhone, ownership.ts
 * releaseEmptyOwner). Three parts:
 *  1. on a disk laid out as the phone has it (helpers/expo-fs-standin.ts), Asha's letter, a draft and a held draft with
 *     their recordings go through each step, then the next launch's sweep: every file is still there, byte for byte,
 *     and every row;
 *  2. source pins, so a later change cannot add a delete to that path unseen;
 *  3. the sheet's D1 line, which is not written yet (an `it.fails` until it is).
 * Fictional Asha family only.
 */
import { createHash } from 'node:crypto';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { authCopy } from '@scribe/content';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { phoneHoldsAnyRow } from '../src/lib/auth/account-claim.logic';
import { APPLE_USER_KEY } from '../src/lib/auth/apple';
import { authReducer, initialAuthState, shouldFinishSignOut, type AuthEvent } from '../src/lib/auth/machine.logic';
import { capabilities } from '../src/lib/capabilities';
import type { SqlDb } from '../src/lib/db/sql';
import { readSetting, SYNC_SETTING, writeSetting } from '../src/lib/sync/outbox';
import { releaseEmptyOwner } from '../src/lib/sync/ownership';
import { createDisk, iosContainer, layOutApp, put, recorderDir, type Disk } from './helpers/expo-fs-standin';
import { nodeDb } from './helpers/node-db';
import { letter } from './helpers/store-fixture';

const h = vi.hoisted(() => ({ disk: null as unknown as Disk, keychain: new Map<string, string>() }));

vi.mock('expo-file-system', async () => (await import('./helpers/expo-fs-standin')).expoFileSystem(() => h.disk));
vi.mock('react-native', () => ({ Platform: { OS: 'ios' } }));
vi.mock('expo-crypto', async () => {
  const { createHash: hash } = await import('node:crypto');
  return {
    getRandomBytes: (n: number) => new Uint8Array(n).fill(7),
    CryptoDigestAlgorithm: { SHA256: 'SHA-256' },
    digest: async (_alg: string, data: Uint8Array) => new Uint8Array(hash('sha256').update(data).digest()).buffer,
  };
});
vi.mock('expo-audio', () => ({
  AudioQuality: { HIGH: 96 },
  IOSOutputFormat: { MPEG4AAC: 'aac ' },
  setAudioModeAsync: async () => {},
  createAudioPlayer: ({ uri }: { uri: string }) => ({ isLoaded: true, duration: (h.disk.files.get(uri)?.data.length ?? 0) > 0 ? 1.5 : 0, remove() {} }),
}));
vi.mock('expo-sqlite', () => ({
  get defaultDatabaseDirectory() {
    return `${h.disk.documents.replace(/^file:\/\//, '')}SQLite`;
  },
}));
vi.mock('expo-apple-authentication', () => ({}));
vi.mock('expo-constants', () => ({ default: { expoConfig: { ios: { bundleIdentifier: 'com.example.asha' } } } }));
vi.mock('../src/lib/audio-enhance', () => ({ removeListeningCopy: () => {} }));
vi.mock('../src/lib/db/repos/open-native', () => ({
  openNativeDb: () => {
    throw new Error('native open must not be used in tests');
  },
}));
vi.mock('../src/lib/supabase/secure-storage', () => ({
  secureStorage: {
    getItem: async (k: string) => h.keychain.get(k) ?? null,
    setItem: async (k: string, v: string) => void h.keychain.set(k, v),
    removeItem: async (k: string) => void h.keychain.delete(k),
  },
}));

const APP = join(__dirname, '..');
const SRC = join(APP, 'src');
const T0 = Date.parse('2026-10-03T09:00:00.000Z');
const U = '0192f0aa-0000-7000-8000-0000000a5a01';
const SIGNED_IN: AuthEvent[] = [
  { type: 'RESTORED', userId: U },
  { type: 'GATE_LOADED', gate: { termsCurrent: true, ageAttested: true, sensitiveData: true, contentAllowed: true }, sensitiveDeclined: false },
];

let seq = 0;
let db: SqlDb;
let closeDb: () => void = () => {};

const sha256 = (data: Uint8Array) => createHash('sha256').update(data).digest('hex');
const src = (rel: string) => readFileSync(join(SRC, rel), 'utf8');
const KEYWORDS = new Set(['if', 'for', 'while', 'switch', 'catch', 'return', 'void', 'typeof', 'async', 'await']);
/** The functions a piece of code calls, in order, comments left out. */
const callsIn = (code: string) =>
  [...code.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '').matchAll(/([A-Za-z_$][\w$.]*)\s*\(/g)].map((m) => m[1]).filter((n) => !KEYWORDS.has(n));

/** One app process over the same database file, as after a quit and a relaunch. */
async function launch() {
  vi.resetModules();
  const store = await import('../src/lib/store');
  const opened = store.openStore({
    open: () => ({ db, close: () => {} }),
    now: () => new Date().toISOString(),
    newId: () => `0199a5b0-0000-7000-8000-${String(++seq).padStart(12, '0')}`,
  });
  expect(opened.ok).toBe(true);
  return { store, sweep: await import('../src/lib/capture/sweep') };
}

/** Every file on the phone with its hash, and the rows that point at recordings. */
function phone() {
  const files = Object.fromEntries([...h.disk.files].map(([uri, f]) => [uri, sha256(f.data)]));
  const rows = db.get<Record<string, number>>(
    'SELECT (SELECT COUNT(*) FROM children) AS children, (SELECT COUNT(*) FROM entries) AS entries, (SELECT COUNT(*) FROM drafts) AS drafts, (SELECT COUNT(*) FROM drafts WHERE held_kind IS NOT NULL) AS held',
  );
  return { files, rows };
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(T0);
  seq = 0;
  h.keychain.clear();
  h.disk = createDisk(iosContainer('6F0C3A2E-ASHA-4C1B-9D55-ASHA0000A5A1'));
  layOutApp(h.disk);
  const n = nodeDb();
  db = n.db;
  closeDb = n.close;
});
afterEach(() => {
  vi.useRealTimers();
  closeDb();
});

describe('[NS-08-R6] sign out never removes a recording', () => {
  it('with backup off, a sign-out and the next launch leave every recording and every row on the phone', async () => {
    expect(capabilities.backup).toBe(false);
    let app = await launch();
    const asha = app.store.addChild({ name: 'Asha', birthday: '2026-03-01', dueDate: null, signsAs: 'Mama' }).id;
    const dir = recorderDir(h.disk);
    const kept = put(h.disk, `${dir}/recording-0A1B2C3D-0000-4000-8000-0000000A5A01.m4a`, 31_000);
    const waiting = put(h.disk, `${dir}/recording-0A1B2C3D-0000-4000-8000-0000000A5A02.m4a`, 9_000);
    const held = put(h.disk, `${dir}/recording-0A1B2C3D-0000-4000-8000-0000000A5A03.m4a`, 12_000);
    const letterId = '0199a5b0-0000-7000-8000-00000000a5a1';
    app.store.saveEntry(letter({ id: letterId, childId: asha, audioUri: kept, audioSha256: sha256(h.disk.files.get(kept)!.data), audioBytes: 31_000 }));
    const draft = app.store.createDraft({ childId: asha, captureMode: 'spoken', promptKey: null, audioUri: waiting, audioDurationMs: 4000, state: 'ready' });
    const heldDraft = app.store.createDraft({ childId: asha, captureMode: 'spoken', promptKey: 'first-laugh', audioUri: held, audioDurationMs: 5000, state: 'ready' });
    expect(app.store.holdDraft(heldDraft.id, { inBookChoice: true })).toBe(true);
    writeSetting(db, SYNC_SETTING.owner, U); // this phone's book belongs to the account that signs out
    h.keychain.set(APPLE_USER_KEY, 'asha-apple-user');
    const before = phone();
    expect(before.rows).toEqual({ children: 1, entries: 1, drafts: 2, held: 1 });
    expect(Object.keys(before.files)).toEqual(expect.arrayContaining([kept, waiting, held]));

    // Sign out on the sheet, nothing queued: the machine finishes at once.
    const asked = authReducer(SIGNED_IN.reduce(authReducer, initialAuthState), { type: 'SIGN_OUT_REQUESTED', reason: 'user', pendingUploads: 0 });
    expect(shouldFinishSignOut(asked)).toBe(true);
    // The finishing effect's own steps (the Supabase call is pinned to scope 'local' below; it clears the Keychain session only).
    const { forgetAppleUser } = await import('../src/lib/auth/apple');
    const { clearPendingEmailRequest } = await import('../src/lib/auth/pending');
    await forgetAppleUser();
    await clearPendingEmailRequest();
    expect(h.keychain.has(APPLE_USER_KEY)).toBe(false); // the steps ran; they touch the Keychain only
    expect(authReducer(asked, { type: 'SIGNED_OUT' })).toEqual({ status: 'signedOut' });
    // The engine's reaction: the phone holds Asha's book, so it keeps its owner and nothing moves.
    expect(releaseEmptyOwner(db, phoneHoldsAnyRow)).toBe(false);
    expect(readSetting(db, SYNC_SETTING.owner)).toBe(U);
    expect(phone()).toEqual(before);

    // The next launch, signed out: the sweep has nothing to remove.
    app = await launch();
    expect(await app.sweep.runLaunchSweep()).toEqual({});
    expect(phone()).toEqual(before);
    expect(app.store.getEntry(letterId)).toMatchObject({ audioUri: kept, finalText: 'Asha, you laughed at the rain today.' });
    expect(app.store.getDraft(draft.id)).toMatchObject({ state: 'ready', audioUri: waiting });
    expect(app.store.getDraft(heldDraft.id)).toMatchObject({ audioUri: held });
  });

  it("the provider's finishing effect signs out with scope 'local' and calls nothing else that could remove a file", () => {
    const provider = src('lib/auth/session-provider.tsx');
    const start = provider.indexOf('const finishing = shouldFinishSignOut(state);');
    const end = provider.indexOf('}, [finishing, sb]);', start);
    expect(start).toBeGreaterThan(-1);
    expect(end).toBeGreaterThan(start);
    const effect = provider.slice(start, end);
    // A new call here is read against NS-08-R6 and ruling D1 first, then added.
    expect(callsIn(effect)).toEqual(['shouldFinishSignOut', 'useEffect', 'sb.auth.signOut', 'forgetAppleUser', 'clearPendingEmailRequest', 'dispatch']);
    expect(effect).toContain("sb.auth.signOut({ scope: 'local' })");
  });

  it("the engine's reaction to a finished sign-out only forgets the owner of an empty phone, and deletes no row", () => {
    const index = src('lib/sync/index.ts');
    const onAuth = index.slice(index.indexOf('unsubs.push(subscribeAuth((s) => {'), index.indexOf('unsubs.push(onInviteAccepted('));
    expect(onAuth).toMatch(/const ended = wasSignedIn && s\.status === 'signedOut';/);
    expect(callsIn(onAuth)).toEqual(['unsubs.push', 'subscribeAuth', 'isSignedIn', 'ensureEngine', 'releaseEmptyPhone']);
    // releaseEmptyPhone itself (review A on #874): it asks ownership.ts and, only when the owner was forgotten, tells the screens.
    const start = index.indexOf('function releaseEmptyPhone(): void {');
    expect(start).toBeGreaterThan(-1);
    const phoneRelease = index.slice(start, index.indexOf('\n}\n', start));
    expect(phoneRelease).not.toMatch(/\bDELETE\b|\.delete\(/i);
    expect(callsIn(phoneRelease)).toEqual(['releaseEmptyPhone', 'releaseEmptyOwner', 'localSqlDb', 'notifyStoreChanged']);
    // ensureEngine, on a session that ended, only stops the engine; stopping it only drops listeners.
    const body = (head: string) => {
      const at = index.indexOf(head);
      expect(at, head).toBeGreaterThan(-1);
      return index.slice(at, index.indexOf('\n}\n', at));
    };
    const ensure = body('function ensureEngine(): void {');
    expect(ensure).toMatch(/if \(!userId \|\| !client \|\| !syncAllowed\(\) \|\| mismatchUser === userId\) \{\s*if \(engine\) stopEngine\(\);\s*return;\s*\}/);
    const stop = body('function stopEngine(): void {');
    expect(callsIn(stop)).toEqual(['stopEngine', 'stop', 'engineUnsubs.forEach', 'u', 'idleStatus', 'statusListeners.forEach', 'l']);
    for (const b of [ensure, stop]) expect(b).not.toMatch(/\bDELETE\b|\.delete\(/i);
    const ownership = src('lib/sync/ownership.ts');
    const release = ownership.slice(ownership.indexOf('export function releaseEmptyOwner'), ownership.indexOf('export function retryRefusedBook'));
    expect(release).not.toMatch(/\bDELETE\b|\.delete\(/i);
    expect([...release.matchAll(/writeSetting\(db, SYNC_SETTING\.(\w+), null\)/g)].map((m) => m[1])).toEqual(['owner', 'heldCursor']);
  });

  it('no module lib/auth can reach removes a recording: the only file code it reaches is listed, with what it touches', () => {
    const specifiers = (f: string) => {
      const text = readFileSync(f, 'utf8');
      return [/\bfrom\s+['"]([^'"]+)['"]/g, /\bimport\(\s*['"]([^'"]+)['"]\s*\)/g, /\brequire\(\s*['"]([^'"]+)['"]\s*\)/g].flatMap((re) => [...text.matchAll(re)].map((m) => m[1]));
    };
    const resolveLocal = (from: string, spec: string): string | null => {
      const base = spec.startsWith('@/') ? join(SRC, spec.slice(2)) : spec.startsWith('.') ? resolve(dirname(from), spec) : null;
      if (!base) return null;
      for (const c of [base, `${base}.ts`, `${base}.tsx`, join(base, 'index.ts'), join(base, 'index.tsx')]) if (existsSync(c) && statSync(c).isFile()) return c;
      return null;
    };
    const auth = join(SRC, 'lib/auth');
    const queue = readdirSync(auth).filter((n) => /\.tsx?$/.test(n)).map((n) => join(auth, n));
    const seen = new Set<string>();
    while (queue.length) {
      const f = queue.pop()!;
      if (seen.has(f)) continue;
      seen.add(f);
      for (const s of specifiers(f)) {
        const r = resolveLocal(f, s);
        if (r) queue.push(r);
      }
    }
    const touchesFiles = [...seen].filter((f) => specifiers(f).includes('expo-file-system')).map((f) => relative(SRC, f)).sort();
    expect(touchesFiles).toEqual([
      'lib/packs/app-support.ts', // names the packs folder in Application Support; deletes nothing
      'lib/remote/expo-adapter.ts', // the remote-config cache: remove(name) deletes only that cache file
    ]);
    const adapter = src('lib/remote/expo-adapter.ts');
    expect(adapter.match(/\.delete\(\)/g)).toHaveLength(1);
    expect(src('lib/packs/app-support.ts')).not.toMatch(/\.delete\(\)/);
  });
});

describe('[NS-08-R6] the sign-out sheet says what stays on this phone and who can read it (ruling D1)', () => {
  const sheetKeys = () => {
    const m = src('app/settings/account.tsx').match(/const signOut = \(\) => \{\s*Alert\.alert\(a\.(\w+), a\.(\w+),/);
    return m ? [m[1], m[2]] : null;
  };

  it('the sheet is a native confirm whose title and body are authCopy.account keys', () => {
    expect(sheetKeys()).toEqual(['signOutTitle', 'signOutBody']);
  });

  // OPEN: today's body names letters only. The D1 line is a BL-965 key (content writes it, the founder approves it),
  // wired here by BL-961 or P-6c. When it lands this case starts failing: change `it.fails` to `it`.
  it.fails('names the recordings, and says anyone who opens the app on this phone can read them', () => {
    const [title, body] = sheetKeys()!;
    const account = authCopy.account as unknown as Record<string, unknown>;
    const sheet = `${String(account[title])} ${String(account[body])}`;
    expect(sheet).toMatch(/\brecordings?\b/i);
    expect(sheet).toMatch(/\banyone\b/i);
  });
});
