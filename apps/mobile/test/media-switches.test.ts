/// <reference types="node" />
/**
 * The NX-39 phase switches (BL-858; NX-39-R37, R39; NX-39 section 3 for the table, section 16 for this file's name).
 *
 * Seven build switches, one per phase, live in src/lib/capabilities.ts (`MEDIA_PHASE_SWITCHES`, `mediaPhaseBuilt`,
 * `mediaPhaseMayRun`). These tests prove what a switch does and does not do:
 *  - off, its phase and every phase that builds on it may not run (no screen, no read), whatever the remote says;
 *  - the remote kill switches (`photos`, `photoMoments`, `videos`) pause and never start;
 *  - no screen or read can go round a switch, because each variable is read in one place;
 *  - Export and Erase never read a switch, and erase still removes a picture with every switch off;
 *  - each switch is off in the `production` profile and in every store profile (not written, or written `off`).
 *
 * Fixtures use the fictional family Asha. The kill-switch drill on a real TestFlight phone is not here: it is the
 * founder's device step (docs/release/media-phases-kill-switch-drill.md).
 */
import { mkdtempSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, relative } from 'node:path';
import ts from 'typescript';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  MEDIA_PHASE_SWITCHES,
  mediaPhaseBuilt,
  mediaPhaseMayRun,
  parseServerFeatures,
  setMediaPhaseForTests,
  type KillSwitchView,
  type MediaPhase,
} from '../src/lib/capabilities';
import { migrate } from '../src/lib/db/migrations';
import type { SqlDb } from '../src/lib/db/sql';
import { erasePictureOf } from '../src/lib/photos/device';
import { entryMediaStore } from '../src/lib/photos/entry-media';
import { expoPhotoFiles } from '../src/lib/photos/files';
import { planExport } from '../src/lib/export/build.logic';
import { parsePhotosFlag, photoSurfaces, photosBuildEnabled, photosPaused, setPhotosForTest } from '../src/lib/photos/flag';
import { photoStartShows } from '../src/lib/photos/start-shows';
import type { StoredPhoto } from '../src/lib/photos/types';
import { KILL_SWITCH_KEYS } from '../../../packages/api/src/kill-switches';
import { resolveProfile, STORE_FLAGS, storeProfiles } from '../../../scripts/release/store-flags.mjs';
import { ashaSnapshot } from './helpers/asha-export';
import { createDisk, iosContainer, type Disk } from './helpers/expo-fs-standin';
import { nodeDb } from './helpers/node-db';

const h = vi.hoisted(() => ({ disk: null as unknown as Disk, db: null as unknown as SqlDb, ids: 0 }));
vi.mock('expo-file-system', async () => (await import('./helpers/expo-fs-standin')).expoFileSystem(() => h.disk));
vi.mock('expo-crypto', async () => {
  const { createHash } = await import('node:crypto');
  return {
    CryptoDigestAlgorithm: { SHA256: 'SHA-256' },
    digest: async (_algorithm: string, bytes: Uint8Array) => Uint8Array.from(createHash('sha256').update(bytes).digest()).buffer,
  };
});
vi.mock('../src/lib/store', () => ({ localSqlDb: () => h.db, notifyStoreChanged: () => {}, uuidv7: () => `m${++h.ids}` }));

const APP = join(__dirname, '..');
const SRC = join(APP, 'src');
const PHASES: MediaPhase[] = MEDIA_PHASE_SWITCHES.map((s) => s.phase);
const PAUSE_KEYS: string[] = [...new Set(MEDIA_PHASE_SWITCHES.flatMap((s) => s.pauseKeys))].sort();

const switchOf = (phase: MediaPhase) => MEDIA_PHASE_SWITCHES.find((s) => s.phase === phase)!;
/** The phase and every phase it needs, nearest first. */
const chain = (phase: MediaPhase): MediaPhase[] => {
  const out: MediaPhase[] = [];
  for (let p: MediaPhase | null = phase; p; p = switchOf(p).needs) out.push(p);
  return out;
};
/** The phases that are gone when `phase` is off: itself and every phase whose chain holds it. */
const goneWith = (phase: MediaPhase): Set<MediaPhase> => new Set(PHASES.filter((q) => chain(q).includes(phase)));
/** The phases a remote key pauses: every phase whose chain names the key. */
const pausedBy = (key: string): Set<MediaPhase> => new Set(PHASES.filter((q) => chain(q).some((p) => switchOf(p).pauseKeys.includes(key))));

const allSwitches = (value: boolean | null) => {
  PHASES.forEach((p) => setMediaPhaseForTests(p, value));
  // P0's screens read lib/photos/flag.ts, which has its own test override; keep the two in step.
  setPhotosForTest(value);
};
afterEach(() => allSwitches(null));

/** Every remote config a phone could hold, from none to every key true. */
const CONFIGS: Array<KillSwitchView | null | undefined> = [
  null,
  undefined,
  {},
  { killSwitches: null },
  { killSwitches: Object.fromEntries(PAUSE_KEYS.map((k) => [k, false])) },
  { killSwitches: Object.fromEntries(PAUSE_KEYS.map((k) => [k, true])) },
];

const stripComments = (s: string) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');
const walk = (dir: string): string[] =>
  readdirSync(dir).flatMap((n) => {
    const p = join(dir, n);
    return statSync(p).isDirectory() ? walk(p) : /\.(ts|tsx)$/.test(n) && !/\.test\./.test(n) ? [p] : [];
  });

/** Resolve a module specifier written in `from` to a file under src, or null (a package, or not a source file). */
function resolveImport(from: string, spec: string): string | null {
  const base = spec.startsWith('@/') ? join(SRC, spec.slice(2)) : spec.startsWith('.') ? join(dirname(from), spec) : null;
  if (!base) return null;
  for (const c of [base, `${base}.ts`, `${base}.tsx`, join(base, 'index.ts'), join(base, 'index.tsx')]) {
    try {
      if (statSync(c).isFile() && /\.tsx?$/.test(c)) return c;
    } catch {
      // not this candidate
    }
  }
  return null;
}

/** Every source file reachable from the entries by import, export-from, require() or import(). */
function closureOf(entries: string[]): string[] {
  const seen = new Set<string>();
  const stack = [...entries];
  while (stack.length) {
    const file = stack.pop() as string;
    if (seen.has(file)) continue;
    seen.add(file);
    const code = readFileSync(file, 'utf8');
    for (const m of code.matchAll(/(?:from\s+|require\(\s*|import\(\s*)['"]([^'"]+)['"]/g)) {
      const next = resolveImport(file, m[1]);
      if (next && !seen.has(next)) stack.push(next);
    }
  }
  return [...seen].sort();
}

/** The functions that read a phase switch, for P0 through its own module and for every phase through capabilities. */
const SWITCH_READERS = ['mediaPhaseMayRun', 'mediaPhaseBuilt', 'photosBuildEnabled', 'photosPausedNow', 'photosPaused', 'photoSurfaces', 'photoStartShows'];

/** `file#function` for every call to a switch reader in these files (the enclosing named function, or `<module>`). */
function switchReads(files: string[]): string[] {
  const found: string[] = [];
  for (const file of files) {
    const sf = ts.createSourceFile(file, readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, true, file.endsWith('x') ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
    // A reader imported under another name (`import { mediaPhaseMayRun as gate }`) is still a reader.
    const readers = new Set(SWITCH_READERS);
    sf.forEachChild((st) => {
      const named = ts.isImportDeclaration(st) ? st.importClause?.namedBindings : undefined;
      if (named && ts.isNamedImports(named)) {
        for (const el of named.elements) if (SWITCH_READERS.includes((el.propertyName ?? el.name).text)) readers.add(el.name.text);
      }
    });
    const visit = (n: ts.Node, owner: string): void => {
      let here = owner;
      if ((ts.isFunctionDeclaration(n) || ts.isMethodDeclaration(n)) && n.name) here = n.name.getText(sf);
      else if (ts.isVariableDeclaration(n) && n.initializer && (ts.isArrowFunction(n.initializer) || ts.isFunctionExpression(n.initializer))) here = n.name.getText(sf);
      if (ts.isCallExpression(n)) {
        const callee = n.expression.getText(sf).split('.').pop() as string;
        // a reader calling a reader is the definition itself (mediaPhaseBuilt recurses through `needs`), not a use
        if (readers.has(callee) && !SWITCH_READERS.includes(here)) found.push(`${relative(SRC, file)}#${here}`);
      }
      n.forEachChild((c) => visit(c, here));
    };
    visit(sf, '<module>');
  }
  return [...new Set(found)].sort();
}

/**
 * The data-right entry points: Export (lib/export, the one module its screen calls) and Erase everything. Erase now
 * and the 30-day purge call `erasePictureOf` from the store's audio eraser, so the store is in Erase's closure.
 */
const DATA_RIGHT_ENTRIES = [join(SRC, 'lib', 'export', 'index.ts'), join(SRC, 'lib', 'erase-everything.ts'), join(SRC, 'lib', 'photos', 'device.ts')];
/**
 * The one switch read allowed inside that closure: `registerPhotoDevice` registers the picker (a screen's input) and
 * returns early when P0 is off. It is not called by any data right; the erasers and the sweep in the same file read no
 * switch (NS-01-R19).
 */
const ALLOWED_IN_DATA_RIGHTS = ['lib/photos/device.ts#registerPhotoDevice'];

// A phone on the newest schema with one letter and its picture, for the erase check (as test/photos-phone.test.ts).
const ctx = { now: '2026-11-25T00:00:00.000Z', newId: () => 'id' };
function phoneWithPicture(name: string): SqlDb {
  const { db } = nodeDb();
  migrate(db, ctx);
  db.run(
    `INSERT INTO entries (id, kind, occurred_on, captured_at, capture_mode, edit_level, engine_version, raw_transcript, machine_edits, final_text, in_book, updated_at)
     VALUES ('e1', 'letter', '2026-06-12', '2026-06-12T09:00:00Z', 'typed', 'clean', 1, 'x', '[]', 'Asha and the rain boots.', 1, '2026-06-12T09:00:00Z')`,
  );
  h.db = db;
  h.disk = createDisk(iosContainer(`B81D7E44-NEW0-4A7F-8C21-ASHA0000${name}`));
  const photo: StoredPhoto = { entryId: 'e1', mediaId: 'm1', ext: 'jpg', bytes: 3, sha256: 'ab', width: 4, height: 4, text: null, place: null, addedAt: '2026-11-25T00:00:00Z', deletedAt: null };
  entryMediaStore(db).put(photo);
  return db;
}

describe('[NX-39-R37] a phase switch removes screens and reads, never a data right', () => {
  it('[NX-39-R37] each phase switch removes its screens and reads and leaves export and erase working', async () => {
    // Built with nothing on (every test build, and production): no phase may run, whatever the remote config holds.
    // A kill switch can pause; nothing remote can start a phase.
    for (const phase of PHASES) {
      expect(mediaPhaseBuilt(phase), phase).toBe(false);
      for (const config of CONFIGS) expect(mediaPhaseMayRun(phase, config), `${phase} ${JSON.stringify(config)}`).toBe(false);
    }

    // Every switch on: every phase may run with no remote config.
    allSwitches(true);
    for (const phase of PHASES) expect(mediaPhaseMayRun(phase, null), phase).toBe(true);

    // One switch off takes its phase and every phase built on it, and nothing else.
    for (const off of PHASES) {
      allSwitches(true);
      setMediaPhaseForTests(off, false);
      const gone = goneWith(off);
      for (const phase of PHASES) expect(mediaPhaseMayRun(phase, null), `${off} off: ${phase}`).toBe(!gone.has(phase));
    }
    // The chain the table implies: P0 off removes every picture phase; P2b off removes P2c; P4a stands alone.
    expect([...goneWith('photos')].sort()).toEqual(['libraryChooser', 'mediaMetadata', 'moments', 'momentsBackground', 'photos', 'video']);
    expect([...goneWith('moments')].sort()).toEqual(['moments', 'momentsBackground']);
    expect([...goneWith('occasions')]).toEqual(['occasions']);

    // Each remote key pauses the phases that name it and the phases built on them, and only `true` pauses.
    allSwitches(true);
    for (const key of PAUSE_KEYS) {
      const paused = pausedBy(key);
      for (const phase of PHASES) {
        expect(mediaPhaseMayRun(phase, { killSwitches: { [key]: true } }), `${key}: ${phase}`).toBe(!paused.has(phase));
        for (const notTrue of [false, 'true', 1, null]) expect(mediaPhaseMayRun(phase, { killSwitches: { [key]: notTrue } }), `${key}=${String(notTrue)}: ${phase}`).toBe(true);
      }
    }
    // The remote `photos` switch removes P2a and every later picture phase (the row's drill), and leaves P4a.
    expect([...pausedBy('photos')].sort()).toEqual(['libraryChooser', 'mediaMetadata', 'moments', 'momentsBackground', 'photos', 'video']);
    for (const key of PAUSE_KEYS) expect(KILL_SWITCH_KEYS as readonly string[], `${key} is a key the signed config can carry`).toContain(key);

    // P0 is the one phase with screens today. Every screen that draws a P0 surface asks photoSurfaces with the build
    // switch, and with the switch off nothing draws, paused or not; Home's photo start is absent too.
    const p0Callers = walk(SRC).filter((f) => /\bphotoSurfaces\(/.test(stripComments(readFileSync(f, 'utf8'))) && !f.endsWith(join('photos', 'flag.ts')));
    expect(p0Callers.length).toBeGreaterThan(0);
    for (const f of p0Callers) {
      const calls = stripComments(readFileSync(f, 'utf8')).match(/photoSurfaces\(\{[^}]*\}\)/g) ?? [];
      expect(calls.length, relative(SRC, f)).toBeGreaterThan(0);
      for (const c of calls) expect(c, relative(SRC, f)).toMatch(/build:\s*photosBuildEnabled\(\)/);
    }
    allSwitches(false);
    expect(photosBuildEnabled()).toBe(false);
    for (const paused of [false, true]) {
      expect(photoSurfaces({ build: photosBuildEnabled(), paused })).toEqual({ start: false, lens: false, addActions: false });
      expect(photoStartShows(paused)).toBe(false);
    }

    // Export and Erase read no switch: in everything they import, the only switch read is the picker registration.
    const closure = closureOf(DATA_RIGHT_ENTRIES);
    expect(closure.map((f) => relative(SRC, f))).toEqual(expect.arrayContaining(['lib/export/index.ts', 'lib/erase-everything.ts', 'lib/store.ts', 'lib/photos/device.ts']));
    expect(switchReads(closure)).toEqual(ALLOWED_IN_DATA_RIGHTS);

    // Export works with every switch off: the plan is the same as with every switch on (nothing a switch hides is
    // dropped from a parent's copy of their book).
    allSwitches(true);
    const planOn = planExport(ashaSnapshot());
    allSwitches(false);
    const planOff = planExport(ashaSnapshot());
    expect(planOff.textFiles.length).toBeGreaterThan(0);
    expect(planOff).toEqual(planOn);

    // And erase works with every switch off: the letter's picture file and its row go.
    const db = phoneWithPicture('0858');
    const files = expoPhotoFiles();
    await files.write('m1.jpg', Uint8Array.of(1, 2, 3));
    expect(await files.list()).toEqual(['m1.jpg']);
    erasePictureOf('e1');
    expect(await files.list()).toEqual([]);
    expect(db.all('SELECT id FROM entry_media')).toEqual([]);
  });

  it('[NX-39-R37] positive control: a switch read added to an export or erase function is caught', () => {
    const dir = mkdtempSync(join(tmpdir(), 'nx39-r37-'));
    try {
      const file = join(dir, 'copy.ts');
      writeFileSync(file, "import { mediaPhaseMayRun } from './capabilities';\nexport function exportCopy() {\n  if (!mediaPhaseMayRun('photos', null)) return;\n}\n");
      expect(switchReads([file])[0]).toMatch(/copy\.ts#exportCopy$/);
      writeFileSync(file, 'export const eraseAll = () => { if (photosBuildEnabled()) return; };\n');
      expect(switchReads([file])[0]).toMatch(/copy\.ts#eraseAll$/);
      writeFileSync(file, "import { mediaPhaseMayRun as gate } from './capabilities';\nexport function exportSnapshot() {\n  return gate('photos', null);\n}\n");
      expect(switchReads([file])[0]).toMatch(/copy\.ts#exportSnapshot$/);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('[NX-39-R37] P0\'s screens read the same variable, with the same rule and the same pause, as its switch here', () => {
    // lib/photos/flag.ts draws P0's surfaces; it must agree with capabilities.ts, or one could be on while the other is off.
    for (const v of [undefined, null, '', 'off', 'on', ' ON ', 'On', 'true', '1', 'yes']) expect(parsePhotosFlag(v), String(v)).toBe(parseServerFeatures(v));
    expect(stripComments(readFileSync(join(SRC, 'lib', 'photos', 'flag.ts'), 'utf8'))).toMatch(/parsePhotosFlag\(process\.env\.EXPO_PUBLIC_PHOTOS\)/);
    setMediaPhaseForTests('photos', true);
    for (const config of CONFIGS) {
      expect(photosPaused(config as Parameters<typeof photosPaused>[0]), JSON.stringify(config)).toBe(!mediaPhaseMayRun('photos', config));
    }
  });

  it('[NX-39-R37] no screen or read goes round a switch: each phase variable is read in capabilities.ts only (and P0 in lib/photos/flag.ts)', () => {
    const readers = (env: string) =>
      walk(SRC)
        .filter((f) => new RegExp(`process\\.env\\.${env}\\b`).test(stripComments(readFileSync(f, 'utf8'))))
        .map((f) => relative(SRC, f))
        .sort();
    for (const s of MEDIA_PHASE_SWITCHES) {
      expect(readers(s.env), s.env).toEqual(s.phase === 'photos' ? ['lib/capabilities.ts', 'lib/photos/flag.ts'] : ['lib/capabilities.ts']);
    }
  });
});

type Eas = { build: Record<string, { env?: Record<string, unknown>; distribution?: string; ios?: { simulator?: boolean }; extends?: string }> };
const readEas = (path = join(APP, 'eas.json')): Eas => JSON.parse(readFileSync(path, 'utf8'));
const isOff = (v: unknown) => v === undefined || String(v).trim().toLowerCase() === 'off';

/**
 * Problems with the phase switches in one eas.json: in production and in every store profile each switch is off, that
 * is not written or written `off` (store-flags.mjs reads off the same way). The switches are not written today:
 * test/config.test.ts pins the names each profile writes, and the build reads a missing name as off.
 */
function phaseSwitchProblems(eas: Eas): string[] {
  const problems: string[] = [];
  const names = new Set([...storeProfiles(eas), 'production']);
  for (const name of [...names].sort()) {
    const env = (resolveProfile(eas.build, name)?.env ?? {}) as Record<string, unknown>;
    for (const s of MEDIA_PHASE_SWITCHES) if (!isOff(env[s.env])) problems.push(`${name} ${s.env}=${JSON.stringify(env[s.env])}`);
  }
  return problems;
}

describe('[NX-39-R39] the switches of section 3', () => {
  it('[NX-39-R39] every phase has a switch and each is off in production', () => {
    expect(MEDIA_PHASE_SWITCHES.map((s) => [s.nx39, s.env])).toEqual([
      ['P0', 'EXPO_PUBLIC_PHOTOS'],
      ['P1', 'EXPO_PUBLIC_MEDIA_METADATA'],
      ['P2a', 'EXPO_PUBLIC_LIBRARY_CHOOSER'],
      ['P2b', 'EXPO_PUBLIC_PHOTO_MOMENTS'], // NX-39 proposed the bare name MOMENTS; develop's name wins (CR-69 A5)
      ['P2c', 'EXPO_PUBLIC_MOMENTS_BACKGROUND'],
      ['P3', 'EXPO_PUBLIC_VIDEO'],
      ['P4a', 'EXPO_PUBLIC_OCCASIONS'],
    ]);
    // Expo inlines only a read written out in full: each variable is read once, literally, in capabilities.ts.
    const code = stripComments(readFileSync(join(SRC, 'lib', 'capabilities.ts'), 'utf8'));
    for (const s of MEDIA_PHASE_SWITCHES) expect(code.match(new RegExp(`process\\.env\\.${s.env}\\b`, 'g'))?.length, s.env).toBe(1);
    // production and every store profile leave each one off, and the build reads what production holds as off
    const eas = readEas();
    expect(storeProfiles(eas)).toContain('production');
    expect(phaseSwitchProblems(eas)).toEqual([]);
    const production = (resolveProfile(eas.build, 'production')?.env ?? {}) as Record<string, string | undefined>;
    for (const s of MEDIA_PHASE_SWITCHES) expect(parseServerFeatures(production[s.env]), s.env).toBe(false);
    // and the store-wide gates know every name: STORE_FLAGS (preflight and store-flags.test.ts) or G6's own list
    const g6 = readFileSync(join(APP, 'test', 'g6-production-flags-off.test.ts'), 'utf8');
    const storeFlagNames = STORE_FLAGS.map((f: { env: string }) => f.env);
    for (const s of MEDIA_PHASE_SWITCHES) expect(storeFlagNames.includes(s.env) || g6.includes(`'${s.env}'`), s.env).toBe(true);
  });

  it('[NX-39-R39] mutant: a copy of eas.json with any one switch on in production or a store profile is caught', () => {
    for (const s of MEDIA_PHASE_SWITCHES) {
      for (const value of ['on', ' ON ', 'true']) {
        const copy = readEas();
        copy.build.production.env = { ...copy.build.production.env, [s.env]: value };
        expect(phaseSwitchProblems(copy), `${s.env}=${value}`).toEqual([`production ${s.env}=${JSON.stringify(value)}`]);
      }
      // written `off` is as good as not written
      const written = readEas();
      written.build.production.env = { ...written.build.production.env, [s.env]: 'off' };
      expect(phaseSwitchProblems(written), `${s.env}=off`).toEqual([]);
      const copy = readEas();
      copy.build.testflight.env = { ...copy.build.testflight.env, [s.env]: 'on' };
      expect(phaseSwitchProblems(copy), `testflight ${s.env}`).toEqual([`testflight ${s.env}="on"`]);
    }
  });
});
