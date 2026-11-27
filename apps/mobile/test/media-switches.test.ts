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
import { basename, dirname, join, relative, sep } from 'node:path';
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

const CODE_FILE = /\.(ts|tsx|js|jsx|mjs|cjs)$/;
/**
 * A test file, which no bundle holds: its name ends in `.test.<ext>` or `.spec.<ext>`, or it sits under a `__tests__`
 * folder. Only those. A module whose name merely holds `.test.` (`video.test.gate.ts`) is bundled once a screen imports
 * it, and vitest does not run it, so it is scanned like any other (Review B A3).
 */
const isTestFile = (file: string): boolean =>
  /\.(test|spec)\.(ts|tsx|js|jsx|mjs|cjs)$/.test(basename(file)) || file.split(sep).includes('__tests__');
const walk = (dir: string): string[] =>
  readdirSync(dir).flatMap((n) => {
    const p = join(dir, n);
    return statSync(p).isDirectory() ? (n === 'node_modules' ? [] : walk(p)) : /\.(ts|tsx)$/.test(n) && !isTestFile(p) ? [p] : [];
  });

const scriptKind = (file: string): ts.ScriptKind =>
  file.endsWith('.tsx') ? ts.ScriptKind.TSX : file.endsWith('.jsx') ? ts.ScriptKind.JSX : /\.[cm]?js$/.test(file) ? ts.ScriptKind.JS : ts.ScriptKind.TS;
const parse = (file: string) => ts.createSourceFile(file, readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, true, scriptKind(file));

/** Every source file under a folder that a bundle could hold, JavaScript included, tests and node_modules excluded. */
const walkCode = (dir: string): string[] =>
  readdirSync(dir).flatMap((n) => {
    const p = join(dir, n);
    return statSync(p).isDirectory() ? (n === 'node_modules' ? [] : walkCode(p)) : CODE_FILE.test(n) && !isTestFile(p) ? [p] : [];
  });

const SWITCH_NAMES: string[] = MEDIA_PHASE_SWITCHES.map((s) => s.env);

const REPO = join(APP, '..', '..');
const PACKAGES = join(REPO, 'packages');
/**
 * Where a switch read could reach a store build, so where the name scan looks (Review B A1, A2; Review A X4, X5b):
 *  - apps/mobile/src;
 *  - each workspace package's src and its top-level modules (packages/brand/index.ts, registry.ts): they reach the
 *    bundle through the node_modules/@scribe/* symlinks as real paths, so babel-preset-expo's inline-env-vars runs on
 *    them as on src (Review B ran the transformer on a file under packages/core/src: `!!"off"`);
 *  - apps/mobile/modules, the local Expo modules, bundled the same way;
 *  - apps/mobile/app.config.ts, which runs with the profile's env at build time: a switch copied into `extra` ships in
 *    the embedded config and is read through Constants.expoConfig.extra, which nothing inlines and no scan of src sees.
 * A package's build and test configs (`*.config.ts`) run in Node only and are left out.
 */
const NAME_SCAN_ROOTS: string[] = [
  SRC,
  ...readdirSync(PACKAGES)
    .map((p) => join(PACKAGES, p, 'src'))
    .filter((d) => statSync(d, { throwIfNoEntry: false })?.isDirectory()),
  ...readdirSync(PACKAGES).flatMap((p) => {
    const dir = join(PACKAGES, p);
    return statSync(dir).isDirectory() ? readdirSync(dir).filter((n) => CODE_FILE.test(n) && !/\.config\./.test(n) && !isTestFile(n)).map((n) => join(dir, n)) : [];
  }),
  join(APP, 'modules'),
  join(APP, 'app.config.ts'),
];
/** The code files a scan root holds: the file itself, or every code file under the folder. A root that holds none fails. */
function rootFiles(root: string): string[] {
  const st = statSync(root, { throwIfNoEntry: false });
  const files = !st ? [] : st.isDirectory() ? walkCode(root) : CODE_FILE.test(root) ? [root] : [];
  if (files.length === 0) throw new Error(`name scan root holds no code file: ${relative(REPO, root)}`);
  return files;
}
const nameIn = (name: string) => new RegExp(`(?<![A-Za-z0-9_$])${name}(?![A-Za-z0-9_$])`, 'g');

/**
 * How many times each switch variable is named in a file's code: in an identifier, a string, a template or JSX text
 * (as the parser reads them, so an escape such as `\\u005f` counts), or in the comment-stripped source text, whichever
 * is more. Comments do not count. Any spelling Expo inlines (`process.env.NAME`, `process.env?.NAME`,
 * `process.env['NAME']`, `process['env'].NAME`) names the variable, so this sees every read whatever its spelling.
 */
function nameMentions(file: string): Record<string, number> {
  const texts: string[] = [];
  const visit = (n: ts.Node): void => {
    if (ts.isIdentifier(n) || ts.isPrivateIdentifier(n) || ts.isStringLiteral(n) || ts.isNoSubstitutionTemplateLiteral(n) || ts.isTemplateHead(n) || ts.isTemplateMiddle(n) || ts.isTemplateTail(n) || ts.isRegularExpressionLiteral(n) || ts.isJsxText(n)) texts.push(n.text);
    n.forEachChild(visit);
  };
  visit(parse(file));
  const parsed = texts.join('\n');
  const stripped = stripComments(readFileSync(file, 'utf8'));
  return Object.fromEntries(SWITCH_NAMES.map((n) => [n, Math.max(parsed.match(nameIn(n))?.length ?? 0, stripped.match(nameIn(n))?.length ?? 0)]));
}

const RESOLVE_EXTS = ['ts', 'tsx', 'js', 'jsx', 'mjs', 'cjs'];
/**
 * Resolve a module specifier written in `from` to a file under src, or null (a package, or not a source file).
 * JavaScript counts as much as TypeScript: Metro bundles a `.js`, `.jsx` or `.mjs` helper an eraser imports, so the
 * closure follows it (Review A X3: `./erase-gate.js` calling mediaPhaseBuilt was never scanned).
 */
function resolveImport(from: string, spec: string): string | null {
  const base = spec.startsWith('@/') ? join(SRC, spec.slice(2)) : spec.startsWith('.') ? join(dirname(from), spec) : null;
  if (!base) return null;
  for (const c of [base, ...RESOLVE_EXTS.map((e) => `${base}.${e}`), ...RESOLVE_EXTS.map((e) => join(base, `index.${e}`))]) {
    try {
      if (statSync(c).isFile() && CODE_FILE.test(c)) return c;
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

/** The name an import, an export or a declaration gives, which is not a use of what it names. */
function isDeclaredName(id: ts.Identifier): boolean {
  const p = id.parent;
  if (ts.isImportSpecifier(p) || ts.isExportSpecifier(p) || ts.isImportClause(p) || ts.isNamespaceImport(p)) return true;
  if (ts.isFunctionDeclaration(p) || ts.isFunctionExpression(p) || ts.isMethodDeclaration(p) || ts.isVariableDeclaration(p) || ts.isParameter(p) || ts.isPropertyAssignment(p) || ts.isPropertyDeclaration(p) || ts.isPropertySignature(p)) {
    return p.name === id;
  }
  return false;
}

/** The functions that read a phase switch, for P0 through its own module and for every phase through capabilities. */
const SWITCH_READERS = ['mediaPhaseMayRun', 'mediaPhaseBuilt', 'photosBuildEnabled', 'photosPausedNow', 'photosPaused', 'photoSurfaces', 'photoStartShows'];

/**
 * `file#function` for every reference to a switch reader in these files (the enclosing named function, or `<module>`).
 * Any reference counts, not only a call: a copy into a local (`const gate = mediaPhaseMayRun`), `.call`, `.apply` or
 * `.bind`, or passing it as a value would each go round a call-only scan. An import or export specifier and the name a
 * declaration gives (a function's own name, an object key) are not references, with one exception: an export that
 * renames a reader (`export { mediaPhaseBuilt as phaseOn } from './capabilities'`) is a reference where it is written,
 * and the new name is a reader in every file scanned (Review B N3: a barrel alias imported by erase-everything.ts).
 */
function switchReads(files: string[]): string[] {
  const found: string[] = [];
  const parsed = files.map((file) => ({ file, sf: parse(file) }));
  // Names a reader is exported under, across the files, until no new one turns up (an alias of an alias is one too).
  const exported = new Set(SWITCH_READERS);
  for (let size = -1; size !== exported.size; ) {
    size = exported.size;
    for (const { sf } of parsed) {
      const visitExports = (n: ts.Node): void => {
        if (ts.isExportSpecifier(n) && exported.has((n.propertyName ?? n.name).text)) exported.add(n.name.text);
        n.forEachChild(visitExports);
      };
      visitExports(sf);
    }
  }
  for (const { file, sf } of parsed) {
    // A reader imported under another name (`import { mediaPhaseMayRun as gate }`) is still a reader.
    const readers = new Set(exported);
    sf.forEachChild((st) => {
      const named = ts.isImportDeclaration(st) ? st.importClause?.namedBindings : undefined;
      if (named && ts.isNamedImports(named)) {
        for (const el of named.elements) if (exported.has((el.propertyName ?? el.name).text)) readers.add(el.name.text);
      }
    });
    const visit = (n: ts.Node, owner: string): void => {
      let here = owner;
      if ((ts.isFunctionDeclaration(n) || ts.isMethodDeclaration(n)) && n.name) here = n.name.getText(sf);
      else if (ts.isVariableDeclaration(n) && n.initializer && (ts.isArrowFunction(n.initializer) || ts.isFunctionExpression(n.initializer))) here = n.name.getText(sf);
      // a reader using a reader is the definition itself (mediaPhaseBuilt recurses through `needs`), not a use
      if (ts.isIdentifier(n) && readers.has(n.text) && !isDeclaredName(n) && !SWITCH_READERS.includes(here)) found.push(`${relative(SRC, file)}#${here}`);
      // A reader named by a string is a reference too: `caps['mediaPhaseBuilt']('video')` after `import * as caps`
      // (Review A X7), or the name kept in a const and looked up later. An object's own key is a name it gives, not a use.
      if ((ts.isStringLiteral(n) || ts.isNoSubstitutionTemplateLiteral(n)) && exported.has(n.text) && !(ts.isPropertyAssignment(n.parent) && n.parent.name === n) && !ts.isImportDeclaration(n.parent) && !ts.isExportDeclaration(n.parent) && !SWITCH_READERS.includes(here)) found.push(`${relative(SRC, file)}#${here}`);
      if (ts.isExportSpecifier(n) && n.propertyName && n.propertyName.text !== n.name.text && readers.has(n.propertyName.text)) found.push(`${relative(SRC, file)}#${here}`);
      n.forEachChild((c) => visit(c, here));
    };
    visit(sf, '<module>');
  }
  return [...new Set(found)].sort();
}

/**
 * The data-right entry points: the Export and Erase everything screens and the logic behind them (Review B N4: a switch
 * read in the Export screen itself), lib/export and Erase everything. Erase now and the 30-day purge call
 * `erasePictureOf` from the store's audio eraser, so the store is in Erase's closure.
 */
const DATA_RIGHT_ENTRIES = [
  join(SRC, 'app', 'settings', 'export.tsx'),
  join(SRC, 'app', 'settings', 'erase.tsx'),
  join(SRC, 'components', 'settings', 'wipe.logic.ts'),
  join(SRC, 'lib', 'export', 'index.ts'),
  join(SRC, 'lib', 'erase-everything.ts'),
  join(SRC, 'lib', 'photos', 'device.ts'),
];
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
    expect(closure.map((f) => relative(SRC, f))).toEqual(expect.arrayContaining(['app/settings/export.tsx', 'app/settings/erase.tsx', 'components/settings/wipe.logic.ts', 'lib/export/index.ts', 'lib/erase-everything.ts', 'lib/store.ts', 'lib/photos/device.ts']));
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
    // About 3 s alone; vitest's default 5 s was hit once under a full run on 4 cores (Review B).
  }, 20_000);

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
      // Review B M4 and M5: a copy into a local, and `.call`, are references too.
      writeFileSync(file, "import { mediaPhaseMayRun } from './capabilities';\nexport function exportPlan() {\n  const gate = mediaPhaseMayRun;\n  return gate('photos', null);\n}\n");
      expect(switchReads([file])).toEqual([expect.stringMatching(/copy\.ts#exportPlan$/)]);
      writeFileSync(file, "import { mediaPhaseMayRun } from './capabilities';\nconst gate = mediaPhaseMayRun;\nexport function exportPlan() {\n  return gate('photos', null);\n}\n");
      expect(switchReads([file])).toEqual([expect.stringMatching(/copy\.ts#<module>$/)]);
      writeFileSync(file, "import { mediaPhaseBuilt } from './capabilities';\nexport function eraseEverything() {\n  return mediaPhaseBuilt.call(null, 'photos');\n}\n");
      expect(switchReads([file])).toEqual([expect.stringMatching(/copy\.ts#eraseEverything$/)]);
      // Review B N3: a barrel that renames a reader, and the eraser that imports the new name, are both reads.
      const barrel = join(dir, 'barrel.ts');
      writeFileSync(barrel, "export { mediaPhaseBuilt as phaseOn } from './capabilities';\n");
      writeFileSync(file, "import { phaseOn } from './barrel';\nexport function eraseEverything() {\n  if (phaseOn('video')) return;\n}\n");
      expect(switchReads([barrel, file])).toEqual([expect.stringMatching(/barrel\.ts#<module>$/), expect.stringMatching(/copy\.ts#eraseEverything$/)]);
      writeFileSync(barrel, "import { mediaPhaseMayRun } from './capabilities';\nexport { mediaPhaseMayRun as gate };\n");
      expect(switchReads([barrel])).toEqual([expect.stringMatching(/barrel\.ts#<module>$/)]);
      // Review A X7: a reader looked up by a string key, written in place or kept in a const.
      writeFileSync(file, "import * as caps from './capabilities';\nexport function eraseEverything() {\n  if (caps['mediaPhaseBuilt']('video')) return;\n}\n");
      expect(switchReads([file])).toEqual([expect.stringMatching(/copy\.ts#eraseEverything$/)]);
      writeFileSync(file, "import * as caps from './capabilities';\nconst key = `photosBuildEnabled`;\nexport function exportPlan() {\n  return (caps as Record<string, () => boolean>)[key]();\n}\n");
      expect(switchReads([file])).toEqual([expect.stringMatching(/copy\.ts#<module>$/)]);
      // Review A X3: a JavaScript helper an eraser imports is in the closure, and its read is seen.
      writeFileSync(join(dir, 'erase-gate.js'), "import { mediaPhaseBuilt } from './capabilities';\nexport function eraseGate() {\n  return mediaPhaseBuilt('video');\n}\n");
      writeFileSync(join(dir, 'erase-mod.mjs'), "export { mediaPhaseMayRun as gateMjs } from './capabilities';\n");
      writeFileSync(file, "import { eraseGate } from './erase-gate.js';\nimport { gateMjs } from './erase-mod.mjs';\nexport function eraseEverything() {\n  if (eraseGate() || gateMjs('video', null)) return;\n}\n");
      const jsClosure = closureOf([file]);
      expect(jsClosure.map((f) => basename(f))).toEqual(['copy.ts', 'erase-gate.js', 'erase-mod.mjs']);
      expect(switchReads(jsClosure)).toEqual([
        expect.stringMatching(/copy\.ts#eraseEverything$/),
        expect.stringMatching(/erase-gate\.js#eraseGate$/),
        expect.stringMatching(/erase-mod\.mjs#<module>$/),
      ]);
      // and the names an import or a declaration gives are not reads
      writeFileSync(file, "import { mediaPhaseBuilt } from './capabilities';\nexport { mediaPhaseBuilt };\nexport const keys = { mediaPhaseBuilt: 1, 'photosPaused': 2 };\n");
      expect(switchReads([file])).toEqual([]);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('[NX-39-R37] the phase override is for tests only, and goes back to the build value', () => {
    setMediaPhaseForTests('occasions', true);
    expect(mediaPhaseBuilt('occasions')).toBe(true);
    const saved = process.env.VITEST;
    delete process.env.VITEST;
    try {
      expect(() => setMediaPhaseForTests('occasions', false)).toThrow(/tests only/);
      expect(() => setMediaPhaseForTests('photos', true)).toThrow(/tests only/);
    } finally {
      process.env.VITEST = saved;
    }
    // the refused calls changed nothing
    expect(mediaPhaseBuilt('occasions')).toBe(true);
    expect(mediaPhaseBuilt('photos')).toBe(false);
    setMediaPhaseForTests('occasions', null);
    expect(mediaPhaseBuilt('occasions')).toBe(false);
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

  it('[NX-39-R37] no screen or read goes round a switch: each phase variable is named in capabilities.ts only (and P0 in lib/photos/flag.ts), in any spelling, anywhere a build reads code', () => {
    // Expo inlines `process.env.NAME`, `process.env?.NAME`, `process.env['NAME']` and `process['env'].NAME` alike
    // (babel-preset-expo, plugins/inline-env-vars), so the scan is for the bare name anywhere in code (Review B N1, N2),
    // in src, the workspace packages, the local modules and app.config.ts (Review B A1, A2).
    const CAPS = 'apps/mobile/src/lib/capabilities.ts';
    const FLAG = 'apps/mobile/src/lib/photos/flag.ts';
    // The roots are the ones meant: src, at least the core package, the local modules and app.config.ts. Each root
    // must hold a file (rootFiles throws on an empty one), so a moved folder cannot turn the scan into a pass.
    const rels = NAME_SCAN_ROOTS.map((r) => relative(REPO, r));
    expect(rels).toEqual(expect.arrayContaining(['apps/mobile/src', 'packages/core/src', 'packages/content/src', 'packages/brand/index.ts', 'apps/mobile/modules', 'apps/mobile/app.config.ts']));
    const named: Record<string, string[]> = Object.fromEntries(SWITCH_NAMES.map((n) => [n, []]));
    const counts: Record<string, Record<string, number>> = {};
    for (const root of NAME_SCAN_ROOTS) {
      for (const f of rootFiles(root)) {
        const rel = relative(REPO, f);
        counts[rel] = nameMentions(f);
        for (const n of SWITCH_NAMES) if (counts[rel][n] > 0) named[n].push(rel);
      }
    }
    expect(Object.keys(counts)).toEqual(expect.arrayContaining([CAPS, FLAG, 'apps/mobile/app.config.ts', 'packages/core/src/index.ts']));
    for (const s of MEDIA_PHASE_SWITCHES) {
      expect(named[s.env].sort(), s.env).toEqual(s.phase === 'photos' ? [CAPS, FLAG] : [CAPS]);
    }
    // capabilities.ts names each one twice, its row in MEDIA_PHASE_SWITCHES and its one read (R39 pins both), so a
    // second read in another spelling there (N1: `process.env?.EXPO_PUBLIC_VIDEO` in mediaPhaseMayRun) fails here.
    expect(counts[CAPS]).toEqual(Object.fromEntries(SWITCH_NAMES.map((n) => [n, 2])));
    // flag.ts names P0's once, in its one read, and no other switch.
    expect(counts[FLAG]).toEqual(Object.fromEntries(SWITCH_NAMES.map((n) => [n, n === 'EXPO_PUBLIC_PHOTOS' ? 1 : 0])));
  });

  it('[NX-39-R37] positive control: only real test files are skipped, and an empty scan root fails', () => {
    for (const f of ['a.test.ts', 'a.test.tsx', 'a.spec.ts', 'a.spec.mjs', join('lib', '__tests__', 'gate.ts')]) expect(isTestFile(f), f).toBe(true);
    // Review B A3: a module whose name only holds `.test.` is bundled, so it is scanned.
    for (const f of ['video.test.gate.ts', 'test.ts', 'a.testing.ts', 'spec.js', join('lib', 'tests', 'gate.ts')]) expect(isTestFile(f), f).toBe(false);
    const dir = mkdtempSync(join(tmpdir(), 'nx39-roots-'));
    try {
      expect(() => rootFiles(dir)).toThrow(/holds no code file/);
      expect(() => rootFiles(join(dir, 'missing'))).toThrow(/holds no code file/);
      writeFileSync(join(dir, 'video.test.ts'), 'export {};\n');
      expect(() => rootFiles(dir)).toThrow(/holds no code file/);
      writeFileSync(join(dir, 'video.test.gate.ts'), 'export const a = !!process.env?.EXPO_PUBLIC_VIDEO;\n');
      expect(rootFiles(dir).map((f) => basename(f))).toEqual(['video.test.gate.ts']);
      expect(nameMentions(join(dir, 'video.test.gate.ts')).EXPO_PUBLIC_VIDEO).toBe(1);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('[NX-39-R37] positive control: a switch name in any spelling Expo inlines is counted, and a comment is not', () => {
    const dir = mkdtempSync(join(tmpdir(), 'nx39-names-'));
    try {
      const file = join(dir, 'flag.ts');
      const cases: Array<[string, number]> = [
        ["export const a = !!process.env?.EXPO_PUBLIC_VIDEO;\n", 1],
        ["export const a = !!process.env['EXPO_PUBLIC_VIDEO'];\n", 1],
        ['export const a = process["env"]?.EXPO_PUBLIC_VIDEO !== undefined;\n', 1],
        ['export const a = process.env?.["EXPO_PUBLIC_VIDEO"];\n', 1],
        ["export const a = process.env['EXPO\\u005fPUBLIC_VIDEO'];\n", 1],
        ["export const a = process.env[`EXPO_PUBLIC_VIDEO`];\n", 1],
        ["const s = '/*';\nexport const a = process.env?.EXPO_PUBLIC_VIDEO;\nconst t = '*/';\n", 1],
        ['// process.env?.EXPO_PUBLIC_VIDEO\n/* process.env.EXPO_PUBLIC_VIDEO */\nexport const a = 1;\n', 0],
        ["export const a = process.env.EXPO_PUBLIC_VIDEO_X;\n", 0],
      ];
      for (const [code, n] of cases) {
        writeFileSync(file, code);
        expect(nameMentions(file).EXPO_PUBLIC_VIDEO, code).toBe(n);
      }
    } finally {
      rmSync(dir, { recursive: true, force: true });
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
    // What each phase builds on and which remote keys pause it, written out here so a change to the table is a
    // reviewed change to this test too (Review A K3, K8: the loops in R37 build their expectations from the table).
    expect(MEDIA_PHASE_SWITCHES.map((s) => [s.nx39, s.phase, s.needs, s.pauseKeys])).toEqual([
      ['P0', 'photos', null, ['photos']],
      ['P1', 'mediaMetadata', 'photos', []],
      ['P2a', 'libraryChooser', 'photos', ['photoMoments']], // E6: photoMoments pauses library picking (NS-51)
      ['P2b', 'moments', 'photos', ['photoMoments']],
      ['P2c', 'momentsBackground', 'moments', []],
      ['P3', 'video', 'photos', ['videos']],
      ['P4a', 'occasions', null, []],
    ]);
    // and what each remote key pauses, with every switch on
    allSwitches(true);
    const pausedNow = (key: string) => PHASES.filter((p) => !mediaPhaseMayRun(p, { killSwitches: { [key]: true } })).sort();
    expect(PAUSE_KEYS).toEqual(['photoMoments', 'photos', 'videos']);
    expect(pausedNow('photos')).toEqual(['libraryChooser', 'mediaMetadata', 'moments', 'momentsBackground', 'photos', 'video']);
    expect(pausedNow('photoMoments')).toEqual(['libraryChooser', 'moments', 'momentsBackground']);
    expect(pausedNow('videos')).toEqual(['video']);
    allSwitches(null);
    // Expo inlines only a read written out in full: each variable is read once, literally, in capabilities.ts, through
    // parseServerFeatures into its own phase's build value (Review B M2: a `!!process.env...` read would turn `off` on).
    const code = stripComments(readFileSync(join(SRC, 'lib', 'capabilities.ts'), 'utf8'));
    const buildValues = code.match(/const MEDIA_PHASE_BUILD_VALUE: Readonly<Record<MediaPhase, boolean>> = \{\n([\s\S]*?)\n\};/)?.[1];
    expect(buildValues).toBeDefined();
    expect(buildValues!.split('\n')).toEqual(MEDIA_PHASE_SWITCHES.map((s) => `  ${s.phase}: parseServerFeatures(process.env.${s.env}),`));
    expect(code).toMatch(/const own = mediaPhaseTestOverride\[phase\] \?\? MEDIA_PHASE_BUILD_VALUE\[phase\];/);
    // The readers' bodies, word for word (Review A X6). The env test below runs them under vitest, where `__DEV__` is
    // undefined and Platform is a stand-in, so a branch on either (`if (!__DEV__ && phase === 'video') return true;`)
    // would turn a phase on in a release build alone and pass every other test here.
    const caps = parse(join(SRC, 'lib', 'capabilities.ts'));
    const bodyOf = (name: string): string | undefined => {
      let out: string | undefined;
      const visit = (n: ts.Node): void => {
        if (ts.isFunctionDeclaration(n) && n.name?.text === name && n.body) out = n.body.getText(caps);
        else if (ts.isVariableDeclaration(n) && ts.isIdentifier(n.name) && n.name.text === name && n.initializer && ts.isArrowFunction(n.initializer)) out = n.initializer.body.getText(caps);
        n.forEachChild(visit);
      };
      visit(caps);
      return out === undefined ? undefined : stripComments(out).replace(/\s+/g, ' ').trim();
    };
    expect(bodyOf('mediaPhaseSwitch')).toBe(
      "{ const s = MEDIA_PHASE_SWITCHES.find((m) => m.phase === phase); if (!s) throw new Error(`unknown media phase ${phase}`); return s; }",
    );
    expect(bodyOf('mediaPhaseBuilt')).toBe(
      '{ const s = mediaPhaseSwitch(phase); const own = mediaPhaseTestOverride[phase] ?? MEDIA_PHASE_BUILD_VALUE[phase]; return own && (s.needs === null || mediaPhaseBuilt(s.needs)); }',
    );
    expect(bodyOf('mediaPhaseMayRun')).toBe(
      '{ if (!mediaPhaseBuilt(phase)) return false; for (let s: MediaPhaseSwitch | null = mediaPhaseSwitch(phase); s; s = s.needs === null ? null : mediaPhaseSwitch(s.needs)) { if (s.pauseKeys.some((k) => config?.killSwitches?.[k] === true)) return false; } return true; }',
    );
    // and neither reader file branches on the build mode anywhere in its code
    for (const f of [join(SRC, 'lib', 'capabilities.ts'), join(SRC, 'lib', 'photos', 'flag.ts')]) {
      expect(stripComments(readFileSync(f, 'utf8')), relative(SRC, f)).not.toMatch(/\b__DEV__\b/);
    }
    // and nothing else touches the build values or the test override: MEDIA_PHASE_BUILD_VALUE is named at its
    // declaration and in the `own` line only, so no later write (guarded by the environment, say) can turn a phase on
    // after the pinned block (Review A N2); the override is named where it is declared, read in `own`, and in
    // setMediaPhaseForTests (copied, then replaced).
    expect(code.match(/\bMEDIA_PHASE_BUILD_VALUE\b/g)?.length).toBe(2);
    expect(code.match(/\bmediaPhaseTestOverride\b/g)?.length).toBe(4);
    for (const s of MEDIA_PHASE_SWITCHES) {
      expect(code.match(new RegExp(`process\\.env\\.${s.env}\\b`, 'g'))?.length, s.env).toBe(1);
      expect(code, s.env).toMatch(new RegExp(`\\n  ${s.phase}: parseServerFeatures\\(process\\.env\\.${s.env}\\),\\n`));
    }
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

  it('[NX-39-R39] each switch is off for every value but `on`, read from the environment as a build reads it', async () => {
    // A fresh copy of capabilities.ts per value, with the variable set in process.env, as a bundle inlines it, read
    // through both mediaPhaseBuilt and mediaPhaseMayRun.
    // `on` is matched after trim and lower-case (parseServerFeatures, the rule of every switch in capabilities.ts and of
    // lib/photos/flag.ts), so `On` and ` ON ` are on; store-flags.mjs and G6 refuse any written value but `off` anyway.
    const OFF_VALUES: Array<string | undefined> = [undefined, '', '   ', 'off', ' OFF ', 'Off', 'true', '1', 'yes', 'no', 'onn', 'o n', 'enabled'];
    const ON_VALUES = ['on', 'On', ' ON '];
    const saved = Object.fromEntries(MEDIA_PHASE_SWITCHES.map((s) => [s.env, process.env[s.env]]));
    const builtWith = async (env: Record<string, string | undefined>): Promise<Record<MediaPhase, boolean>> => {
      for (const s of MEDIA_PHASE_SWITCHES) {
        const v = env[s.env];
        if (v === undefined) delete process.env[s.env];
        else process.env[s.env] = v;
      }
      vi.resetModules();
      const fresh = await import('../src/lib/capabilities');
      // What a screen asks, mediaPhaseMayRun, must give the same answer as the build value with no remote config and
      // with every remote key false (Review B N1: a second read of the variable inside mediaPhaseMayRun).
      const noKeys = { killSwitches: Object.fromEntries(PAUSE_KEYS.map((k) => [k, false])) };
      for (const p of PHASES) {
        expect(fresh.mediaPhaseMayRun(p, null), `${p} may run, ${JSON.stringify(env)}`).toBe(fresh.mediaPhaseBuilt(p));
        expect(fresh.mediaPhaseMayRun(p, noKeys), `${p} may run, keys false, ${JSON.stringify(env)}`).toBe(fresh.mediaPhaseBuilt(p));
      }
      return Object.fromEntries(PHASES.map((p) => [p, fresh.mediaPhaseBuilt(p)])) as Record<MediaPhase, boolean>;
    };
    try {
      for (const s of MEDIA_PHASE_SWITCHES) {
        // every phase it builds on is on, so only its own value decides
        const needed = Object.fromEntries(chain(s.phase).slice(1).map((p) => [switchOf(p).env, 'on']));
        for (const v of [...OFF_VALUES, ...ON_VALUES]) {
          const built = await builtWith({ ...needed, [s.env]: v });
          expect(built[s.phase], `${s.env}=${JSON.stringify(v)}`).toBe(ON_VALUES.includes(v as string));
          for (const p of chain(s.phase).slice(1)) expect(built[p], `${s.env}: ${p} needed and on`).toBe(true);
        }
      }
      // nothing set at all (production, every test build): every phase is off
      expect(Object.values(await builtWith({}))).toEqual(PHASES.map(() => false));
    } finally {
      for (const [k, v] of Object.entries(saved)) {
        if (v === undefined) delete process.env[k];
        else process.env[k] = v;
      }
      vi.resetModules();
    }
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
