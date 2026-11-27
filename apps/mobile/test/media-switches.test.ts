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
import { existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { basename, dirname, join, matchesGlob, relative, resolve, sep } from 'node:path';
import { pathToFileURL } from 'node:url';
import ts from 'typescript';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { configDefaults } from 'vitest/config';
import { getConfig } from 'expo/config';
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

const scriptKind = (file: string): ts.ScriptKind =>
  file.endsWith('.tsx') ? ts.ScriptKind.TSX : file.endsWith('.jsx') ? ts.ScriptKind.JSX : /\.[cm]?js$/.test(file) ? ts.ScriptKind.JS : ts.ScriptKind.TS;
const parse = (file: string) => ts.createSourceFile(file, readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, true, scriptKind(file));

const SWITCH_NAMES: string[] = MEDIA_PHASE_SWITCHES.map((s) => s.env);

const REPO = join(APP, '..', '..');
const PACKAGES = join(REPO, 'packages');
const posix = (p: string) => p.split(sep).join('/');
const repoRel = (file: string) => posix(relative(REPO, file));

/**
 * The name scan walks the whole tree, not a list of roots, so its coverage no longer depends on a root list (round 5:
 * Review A N1 to N3, Review B B1 to B6). Every code file under
 * apps/mobile and under each packages/* directory is read: subpath exports such as packages/design-tokens/fonts and
 * textures, apps/mobile/shims (metro.config.js resolves decode-uri-component to it on every platform), the local modules,
 * the configs (app.config.ts, metro.config.js), scripts, test helpers and anything under a `__tests__` folder.
 * Left out are only folders a tool writes: node_modules, dist, build, coverage, .expo, .turbo and .cache anywhere, and
 * ios and android at the app's top level (prebuild output; the local modules' own ios and android folders are walked).
 * apps/mobile/web-preview is walked too, though only a web build holds it: skipping it would make the scan depend on
 * metro.config.js's platform switch staying as it is.
 */
const SKIP_ANYWHERE = new Set(['node_modules', 'dist', 'build', 'coverage', '.expo', '.turbo', '.cache']);
const SKIP_AT_APP_TOP = new Set(['ios', 'android']);
const WALK_ROOTS: string[] = [APP, ...readdirSync(PACKAGES).map((p) => join(PACKAGES, p)).filter((d) => statSync(d).isDirectory())];
function walkTree(dir: string): string[] {
  return readdirSync(dir).flatMap((n) => {
    const p = join(dir, n);
    const st = statSync(p, { throwIfNoEntry: false });
    if (!st) return [];
    if (st.isDirectory()) return SKIP_ANYWHERE.has(n) || (dir === APP && SKIP_AT_APP_TOP.has(n)) ? [] : walkTree(p);
    return st.isFile() && CODE_FILE.test(n) ? [p] : [];
  });
}

/** One set of files a vitest run collects: its include and exclude globs, relative to its root. */
type VitestRun = { root: string; include: string[]; exclude: string[]; from: string };
const VITEST_CONFIG_NAMES = ['vitest', 'vite'].flatMap((b) => ['ts', 'mts', 'cts', 'js', 'mjs', 'cjs'].map((e) => `${b}.config.${e}`));

/**
 * The config file each `vitest` command in a workspace's package.json scripts runs: `--config X`, or the config file
 * vitest finds by itself in the workspace folder, or null when there is none (vitest's own defaults). An argument this
 * does not know (a file filter, `--root`, `--project`) fails the test rather than guess what the command runs.
 */
function vitestConfigsOf(dir: string): Array<string | null> {
  const scripts: Record<string, string> = JSON.parse(readFileSync(join(dir, 'package.json'), 'utf8')).scripts ?? {};
  const out: Array<string | null> = [];
  for (const [name, command] of Object.entries(scripts)) {
    for (const part of command.split(/&&|\|\||;/)) {
      const words = part.trim().split(/\s+/);
      const at = words.indexOf('vitest');
      if (at < 0) continue;
      let config: string | null = null;
      const args = words.slice(at + 1);
      for (let i = 0; i < args.length; i++) {
        if (i === 0 && args[i] === 'run') continue;
        if (args[i] === '--config' || args[i] === '-c') config = args[++i];
        else if (args[i].startsWith('--config=')) config = args[i].slice('--config='.length);
        else throw new Error(`${repoRel(dir)} script "${name}": vitest argument ${args[i]} is not read by the switch scan; teach vitestConfigsOf what it runs`);
      }
      out.push(config ? join(dir, config) : (VITEST_CONFIG_NAMES.map((n) => join(dir, n)).find((f) => existsSync(f)) ?? null));
    }
  }
  return out;
}

type LoadedConfig = { root?: string; test?: { include?: string[]; exclude?: string[]; root?: string; projects?: Array<string | LoadedConfig> } };
async function loadVitestConfig(file: string): Promise<LoadedConfig> {
  const mod = (await import(pathToFileURL(file).href)) as { default?: unknown };
  const c = mod.default ?? mod;
  return (typeof c === 'function' ? await c({ command: 'serve', mode: 'test' }) : c) as LoadedConfig;
}

/** What one config runs: its projects' files when it has projects (as vitest 3 runs them), else its own include. */
async function runsOf(file: string | null, dir: string): Promise<VitestRun[]> {
  const defaults = { include: [...configDefaults.include], exclude: [...configDefaults.exclude] };
  if (file === null) return [{ root: dir, ...defaults, from: `${repoRel(dir)} (vitest defaults)` }];
  const c = await loadVitestConfig(file);
  const root = c.root ? resolve(dir, c.root) : dir;
  const own = (p: LoadedConfig, at: string, from: string): VitestRun => ({
    root: p.root ? resolve(at, p.root) : at,
    include: p.test?.include ?? defaults.include,
    exclude: p.test?.exclude ?? defaults.exclude,
    from,
  });
  const projects = c.test?.projects;
  if (!projects) return [own({ ...c, root: undefined }, root, repoRel(file))];
  const out: VitestRun[] = [];
  for (const p of projects) {
    if (typeof p === 'string') {
      const f = resolve(root, p);
      if (!statSync(f, { throwIfNoEntry: false })?.isFile()) throw new Error(`${repoRel(file)}: project ${p} is not a config file the switch scan can read`);
      out.push(...(await runsOf(f, dirname(f))));
    } else out.push(own(p, root, `${repoRel(file)} project ${(p as { test?: { name?: string } }).test?.name ?? '?'}`));
  }
  return out;
}

/** Does a vitest run collect this file: one of its include globs matches it and none of its exclude globs. */
const collectedBy = (run: VitestRun, file: string): boolean => {
  const rel = posix(relative(run.root, file));
  return !rel.startsWith('../') && run.include.some((g) => matchesGlob(rel, g)) && !run.exclude.some((g) => matchesGlob(rel, g));
};

/** Every vitest run of apps/mobile and of each package, from the configs their scripts name (and the projects in them). */
async function vitestRuns(): Promise<VitestRun[]> {
  const out: VitestRun[] = [];
  for (const dir of WALK_ROOTS) for (const file of vitestConfigsOf(dir)) out.push(...(await runsOf(file, dir)));
  return out;
}

const RESOLVE_EXTS = ['ts', 'tsx', 'js', 'jsx', 'mjs', 'cjs'];
const firstFile = (base: string): string | null => {
  for (const c of [base, ...RESOLVE_EXTS.map((e) => `${base}.${e}`), ...RESOLVE_EXTS.map((e) => join(base, `index.${e}`))]) {
    if (statSync(c, { throwIfNoEntry: false })?.isFile() && CODE_FILE.test(c)) return c;
  }
  return null;
};
/** The workspace packages by name, with their export map, so `@scribe/design-tokens/fonts` resolves as Metro does. */
const WORKSPACES: Map<string, { dir: string; main?: string; exports?: Record<string, string> }> = new Map(
  WALK_ROOTS.filter((d) => d !== APP).map((dir) => {
    const pkg = JSON.parse(readFileSync(join(dir, 'package.json'), 'utf8')) as { name: string; main?: string; exports?: Record<string, string> };
    return [pkg.name, { dir, main: pkg.main, exports: pkg.exports }];
  }),
);
/**
 * Resolve a module specifier written in `from` to a code file in the tree, or null (an outside package, or not code):
 * relative paths, the app's `@/` alias, and the workspace packages through their `exports` (or `main` and a deep path).
 * JavaScript counts as much as TypeScript: Metro bundles a `.js`, `.jsx` or `.mjs` helper an eraser imports, so the
 * closure follows it (Review A X3: `./erase-gate.js` calling mediaPhaseBuilt was never scanned).
 */
function resolveImport(from: string, spec: string): string | null {
  if (spec.startsWith('@/')) return firstFile(join(SRC, spec.slice(2)));
  if (spec.startsWith('.')) return firstFile(join(dirname(from), spec));
  const m = /^(@scribe\/[^/]+)(?:\/(.*))?$/.exec(spec);
  const ws = m ? WORKSPACES.get(m[1]) : undefined;
  if (!m || !ws) return null;
  const sub = m[2] === undefined ? '.' : `./${m[2]}`;
  if (ws.exports) {
    const exact = ws.exports[sub];
    if (exact !== undefined) return firstFile(join(ws.dir, exact));
    for (const [k, v] of Object.entries(ws.exports)) {
      if (k.endsWith('/*') && sub.startsWith(k.slice(0, -1))) return firstFile(join(ws.dir, v.replace('*', sub.slice(k.length - 1))));
    }
    return null;
  }
  return firstFile(join(ws.dir, sub === '.' ? (ws.main ?? 'index') : sub));
}
const importsOf = (file: string): string[] =>
  [...readFileSync(file, 'utf8').matchAll(/(?:from\s+|require\(\s*|import\(\s*)['"]([^'"]+)['"]/g)].map((m) => resolveImport(file, m[1])).filter((f): f is string => f !== null);

/**
 * The files the name scan reads, out of the walked ones: every file but those vitest runs. A file vitest runs is left
 * out only while no scanned file imports it (Metro would bundle it then, test or not), so the scan follows imports
 * from what it reads into a test file until nothing new turns up. The skip comes from the configs vitest actually runs
 * (`include` and `exclude` of apps/mobile's projects and of each package's test configs), never from a file's name:
 * a `.spec.ts` or `.test.js` in src, or a helper under `__tests__`, is not collected by apps/mobile's
 * `*.test.ts` glob under src, so it is read like any other (Review B B3 to B5, Review A N3).
 */
function scanSet(walked: string[], isRun: (f: string) => boolean): { scanned: string[]; skipped: string[] } {
  const scanned = new Set(walked.filter((f) => !isRun(f)));
  const walkedSet = new Set(walked);
  for (const queue = [...scanned]; queue.length; ) {
    for (const next of importsOf(queue.pop() as string)) {
      if (walkedSet.has(next) && !scanned.has(next)) {
        scanned.add(next);
        queue.push(next);
      }
    }
  }
  return { scanned: [...scanned].sort(), skipped: walked.filter((f) => !scanned.has(f)).sort() };
}

let treeScan: Promise<{ walked: string[]; scanned: string[]; skipped: string[]; runs: VitestRun[] }> | undefined;
/** The walk, the vitest runs and the scan set, worked out once per file run. */
function nameScan() {
  treeScan ??= (async () => {
    const walked = WALK_ROOTS.flatMap(walkTree).sort();
    const runs = await vitestRuns();
    return { walked, runs, ...scanSet(walked, (f) => runs.some((r) => collectedBy(r, f))) };
  })();
  return treeScan;
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
    const p0Callers = (await nameScan()).scanned.filter((f) => f.startsWith(SRC + sep) && /\.tsx?$/.test(f)).filter((f) => /\bphotoSurfaces\(/.test(stripComments(readFileSync(f, 'utf8'))) && !f.endsWith(join('photos', 'flag.ts')));
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

  it('[NX-39-R37] no screen or read goes round a switch: each phase variable is named in capabilities.ts only (and P0 in lib/photos/flag.ts), in any spelling, anywhere a build reads code', async () => {
    // Expo inlines `process.env.NAME`, `process.env?.NAME`, `process.env['NAME']` and `process['env'].NAME` alike
    // (babel-preset-expo, plugins/inline-env-vars), so the scan is for the bare name anywhere in code (Review B N1, N2),
    // in every code file of apps/mobile and of the packages that vitest does not run (nameScan above).
    const CAPS = 'apps/mobile/src/lib/capabilities.ts';
    const FLAG = 'apps/mobile/src/lib/photos/flag.ts';
    // Test support, not a read: media-log-canary.test.ts gates the eas.json names this file lists (NX-39-R30). Vitest
    // does not collect it, so it is scanned like any other file, and it may name them only while every file that
    // imports it is one vitest runs, so no bundle can hold it (checked below).
    const CANARY = 'apps/mobile/test/support/media-log-canary.ts';
    const { walked, scanned, skipped } = await nameScan();
    const rels = new Set(scanned.map(repoRel));
    // The walk reaches what the root list missed (Review A N1 to N3, Review B B1 to B6) as well as src and the packages.
    expect([...rels]).toEqual(
      expect.arrayContaining([
        CAPS,
        FLAG,
        CANARY,
        'apps/mobile/app.config.ts',
        'apps/mobile/metro.config.js',
        'apps/mobile/shims/decode-uri-component.js',
        'apps/mobile/web-preview/sqlite-worker-channel.js',
        'apps/mobile/modules/scribe-photo/index.ts',
        'apps/mobile/src/lib/packs/__tests__/memory-ports.ts',
        'packages/core/src/index.ts',
        'packages/content/src/index.ts',
        'packages/brand/index.ts',
        'packages/design-tokens/fonts/index.ts',
        'packages/design-tokens/textures/index.ts',
      ]),
    );
    // Every code file a workspace package exports (its main and each `exports` entry) is scanned, so a folder that
    // the walk skips can never hold one.
    for (const [name, ws] of WORKSPACES) {
      const targets = [ws.main, ...Object.values(ws.exports ?? {})].filter((t): t is string => !!t && CODE_FILE.test(t) && !t.includes('*'));
      expect(targets.length, name).toBeGreaterThan(0);
      for (const t of targets) expect(rels.has(repoRel(join(ws.dir, t))), `${name} exports ${t}`).toBe(true);
    }
    // What is skipped is the files vitest runs: this one, the component suite, each package's tests.
    expect(skipped.map(repoRel)).toEqual(expect.arrayContaining(['apps/mobile/test/media-switches.test.ts', 'apps/mobile/test/capabilities.test.ts', 'packages/content/test/claims-capabilities.test.ts']));
    expect(skipped.some((f) => repoRel(f).startsWith('apps/mobile/test/component/'))).toBe(true);
    expect(scanned.length + skipped.length).toBe(walked.length);

    const named: Record<string, string[]> = Object.fromEntries(SWITCH_NAMES.map((n) => [n, []]));
    const counts: Record<string, Record<string, number>> = {};
    for (const f of scanned) {
      const rel = repoRel(f);
      counts[rel] = nameMentions(f);
      for (const n of SWITCH_NAMES) if (counts[rel][n] > 0) named[n].push(rel);
    }
    const CANARY_NAMES = ['EXPO_PUBLIC_PHOTO_MOMENTS', 'EXPO_PUBLIC_MOMENTS_BACKGROUND'];
    for (const s of MEDIA_PHASE_SWITCHES) {
      const expected = [CAPS, ...(s.phase === 'photos' ? [FLAG] : []), ...(CANARY_NAMES.includes(s.env) ? [CANARY] : [])];
      expect(named[s.env].sort(), s.env).toEqual(expected.sort());
    }
    // capabilities.ts names each one twice, its row in MEDIA_PHASE_SWITCHES and its one read (R39 pins both), so a
    // second read in another spelling there (N1: `process.env?.EXPO_PUBLIC_VIDEO` in mediaPhaseMayRun) fails here.
    expect(counts[CAPS]).toEqual(Object.fromEntries(SWITCH_NAMES.map((n) => [n, 2])));
    // flag.ts names P0's once, in its one read, and no other switch.
    expect(counts[FLAG]).toEqual(Object.fromEntries(SWITCH_NAMES.map((n) => [n, n === 'EXPO_PUBLIC_PHOTOS' ? 1 : 0])));
    // the canary list names its two once each, and only files vitest runs import it
    expect(counts[CANARY]).toEqual(Object.fromEntries(SWITCH_NAMES.map((n) => [n, CANARY_NAMES.includes(n) ? 1 : 0])));
    const importers = walked.filter((f) => importsOf(f).includes(join(REPO, CANARY)));
    expect(importers.map(repoRel)).toEqual(['apps/mobile/test/media-log-canary.test.ts']);
    for (const f of importers) expect(skipped, repoRel(f)).toContain(f);
    // The walk reads about 1,700 files and parses the 1,000 or so it scans: about 2 s alone, so the R37 main test's
    // 20 s, as for any slow test here (Review A note 1: the default 5 s was hit under load).
  }, 20_000);

  it('[NX-39-R37] positive control: the scan skips only what vitest runs, and follows an import into a test file', async () => {
    const { runs } = await nameScan();
    const isRun = (rel: string) => runs.some((r) => collectedBy(r, join(REPO, rel)));
    for (const f of ['apps/mobile/src/lib/a.test.ts', 'apps/mobile/test/a.test.ts', 'apps/mobile/test/component/a.test.tsx', 'apps/mobile/src/lib/packs/a.test.ts', 'packages/core/test/a.test.ts', 'packages/api/test/a.test.ts', 'packages/content/test/a.spec.ts']) {
      expect(isRun(f), f).toBe(true);
    }
    // Review B B3 to B5, Review A N3: names a bundle can hold that no vitest run collects.
    for (const f of [
      'apps/mobile/src/lib/video.spec.ts',
      'apps/mobile/src/lib/video.test.js',
      'apps/mobile/src/lib/a.test.tsx',
      'apps/mobile/src/lib/remote/__tests__/gate.ts',
      'apps/mobile/src/lib/video.test.gate.ts',
      'apps/mobile/test/helpers/gate.ts',
      'apps/mobile/shims/gate.js',
      'apps/mobile/metro.config.js',
      'packages/design-tokens/fonts/index.ts',
      'packages/api/src/a.spec.ts',
    ]) {
      expect(isRun(f), f).toBe(false);
    }
    const dir = mkdtempSync(join(tmpdir(), 'nx39-scan-'));
    try {
      const gate = join(dir, 'gate.test.ts');
      const alone = join(dir, 'alone.test.ts');
      const screen = join(dir, 'screen.ts');
      writeFileSync(gate, 'export const on = !!process.env?.EXPO_PUBLIC_VIDEO;\n');
      writeFileSync(alone, "import { on } from './gate.test';\nexport const b = on;\n");
      writeFileSync(screen, 'export const a = 1;\n');
      const byName = (f: string) => f.endsWith('.test.ts');
      expect(scanSet([gate, alone, screen], byName)).toEqual({ scanned: [screen], skipped: [alone, gate].sort() });
      // a screen that imports a test file puts it in the bundle, so it is scanned, and its read is counted
      writeFileSync(screen, "import { on } from './gate.test';\nexport const a = on;\n");
      expect(scanSet([gate, alone, screen], byName).scanned).toEqual([gate, screen].sort());
      expect(nameMentions(gate).EXPO_PUBLIC_VIDEO).toBe(1);
      // the scripts are read as vitest reads them, and a command the scan does not understand fails
      mkdirSync(join(dir, 'pkg'));
      const scripts = (s: Record<string, string>) => writeFileSync(join(dir, 'pkg', 'package.json'), JSON.stringify({ name: 'x', scripts: s }));
      scripts({ test: 'vitest run', cover: 'vitest run --config v.config.ts && node report.mjs' });
      expect(vitestConfigsOf(join(dir, 'pkg'))).toEqual([null, join(dir, 'pkg', 'v.config.ts')]);
      writeFileSync(join(dir, 'pkg', 'vitest.config.ts'), 'export default {};\n');
      expect(vitestConfigsOf(join(dir, 'pkg'))[0]).toBe(join(dir, 'pkg', 'vitest.config.ts'));
      scripts({ test: 'vitest run src/one.test.ts' });
      expect(() => vitestConfigsOf(join(dir, 'pkg'))).toThrow(/not read by the switch scan/);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
    // 20 s: run alone (a -t filter), this test is the one that pays for the walk and the vitest configs.
  }, 20_000);

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
    // A pin fails on any change inside these bodies, a Prettier rewrap included (Review A N7, note 4): re-pin after review.
    const PIN = 're-pin after review: a switch reader changed';
    // parseServerFeatures decides what each inlined value means, and the override's initializer is the one value the
    // override starts from in a release build (Review A N5, N6: a `HermesInternal` branch in either passes every test
    // run in Node). Both live in capabilities.ts; they are pinned here without editing it.
    expect(bodyOf('parseServerFeatures'), PIN).toBe("{ return (raw ?? '').trim().toLowerCase() === 'on'; }");
    const overrideDecl = caps.statements.filter(ts.isVariableStatement).filter((st) => st.declarationList.declarations.some((d) => ts.isIdentifier(d.name) && d.name.text === 'mediaPhaseTestOverride'));
    expect(overrideDecl.map((st) => stripComments(st.getText(caps)).replace(/\s+/g, ' ').trim()), PIN).toEqual(['let mediaPhaseTestOverride: Partial<Record<MediaPhase, boolean>> = {};']);
    expect(code.match(/\bfunction parseServerFeatures\b/g)?.length, PIN).toBe(1);
    expect(bodyOf('mediaPhaseSwitch'), PIN).toBe(
      "{ const s = MEDIA_PHASE_SWITCHES.find((m) => m.phase === phase); if (!s) throw new Error(`unknown media phase ${phase}`); return s; }",
    );
    expect(bodyOf('mediaPhaseBuilt'), PIN).toBe(
      '{ const s = mediaPhaseSwitch(phase); const own = mediaPhaseTestOverride[phase] ?? MEDIA_PHASE_BUILD_VALUE[phase]; return own && (s.needs === null || mediaPhaseBuilt(s.needs)); }',
    );
    expect(bodyOf('mediaPhaseMayRun'), PIN).toBe(
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

/**
 * Each place a file writes `process.env` or lets it go where a write could follow: an assignment, `delete`, `++` or
 * `--` on one of its keys or on `process.env` itself, `process.env` handed to anything (`Object.assign`,
 * `Reflect.set`, a local alias), `process` itself handed on, or `process` imported. A read of one key, and a spread
 * into a new object, are not. Comments are not code, so they never count.
 */
function processEnvWrites(file: string): string[] {
  const sf = parse(file);
  const out: string[] = [];
  const at = (n: ts.Node, what: string) => out.push(`${repoRel(file)}:${sf.getLineAndCharacterOfPosition(n.getStart(sf)).line + 1} ${what}`);
  const keyOf = (n: ts.Node): string | null =>
    ts.isPropertyAccessExpression(n) ? n.name.text : ts.isElementAccessExpression(n) ? (ts.isStringLiteralLike(n.argumentExpression) ? n.argumentExpression.text : '[computed]') : null;
  const isMemberOf = (n: ts.Node) => (ts.isPropertyAccessExpression(n.parent) || ts.isElementAccessExpression(n.parent)) && n.parent.expression === n;
  const isWriteTarget = (n: ts.Node): boolean => {
    const p = n.parent;
    if (ts.isParenthesizedExpression(p)) return isWriteTarget(p);
    if (ts.isBinaryExpression(p) && p.left === n && p.operatorToken.kind >= ts.SyntaxKind.FirstAssignment && p.operatorToken.kind <= ts.SyntaxKind.LastAssignment) return true;
    if (ts.isDeleteExpression(p)) return true;
    if ((ts.isPrefixUnaryExpression(p) || ts.isPostfixUnaryExpression(p)) && [ts.SyntaxKind.PlusPlusToken, ts.SyntaxKind.MinusMinusToken].includes(p.operator)) return true;
    return ts.isShorthandPropertyAssignment(p) || ts.isArrayLiteralExpression(p) || (ts.isPropertyAssignment(p) && p.initializer === n && ts.isObjectLiteralExpression(p.parent) && isWriteTarget(p.parent));
  };
  const isProcess = (n: ts.Node): boolean =>
    (ts.isIdentifier(n) && n.text === 'process' && !(isMemberOf(n.parent) === false && (ts.isPropertyAccessExpression(n.parent) && n.parent.name === n))) ||
    (keyOf(n) === 'process' && ts.isIdentifier((n as ts.PropertyAccessExpression).expression) && ['globalThis', 'global', 'window', 'self'].includes(((n as ts.PropertyAccessExpression).expression as ts.Identifier).text));
  const visit = (n: ts.Node): void => {
    if ((ts.isImportDeclaration(n) && ts.isStringLiteral(n.moduleSpecifier) && /^(node:)?process$/.test(n.moduleSpecifier.text)) || (ts.isCallExpression(n) && n.arguments.length > 0 && ts.isStringLiteral(n.arguments[0]) && /^(node:)?process$/.test(n.arguments[0].text) && n.expression.getText(sf) === 'require')) {
      at(n, 'imports process');
    } else if (isProcess(n) && !(ts.isPropertyAccessExpression(n.parent) && n.parent.name === n)) {
      if (!isMemberOf(n)) at(n, 'hands process on');
      else if (keyOf(n.parent) === 'env' || keyOf(n.parent) === '[computed]') {
        const env = n.parent;
        if (isWriteTarget(env)) at(env, 'writes process.env');
        else if (isMemberOf(env)) {
          if (isWriteTarget(env.parent)) at(env.parent, `writes process.env ${keyOf(env.parent)}`);
        } else if (!ts.isSpreadAssignment(env.parent) && !ts.isSpreadElement(env.parent)) at(env, 'hands process.env on');
      }
    }
    n.forEachChild(visit);
  };
  visit(sf);
  return out;
}

/** The configs that run in the bundler's process, before Metro's transform workers copy process.env (Review A N4). */
const BUNDLER_CONFIGS = ['app.config.ts', 'metro.config.js', 'babel.config.js', 'babel.config.cjs', 'babel.config.mjs', 'babel.config.ts'].map((n) => join(APP, n));

/** Every variable eas.json writes in any profile, the switches and EAS's own: what one evaluation sets or clears. */
const configVariables = (eas: Eas): string[] => [...new Set([...Object.values(eas.build).flatMap((p) => Object.keys(p.env ?? {})), ...SWITCH_NAMES, 'EAS_BUILD_PROFILE', 'EXPO_PUBLIC_E2E'])];

/**
 * app.config.ts evaluated fresh, as one EAS build of `profile` evaluates it: exactly the profile's env (eas.json,
 * through `extends`), EAS_BUILD_PROFILE set to its name, and `extra` on top. The module is dropped from Node's
 * require cache first, so a read at its top level runs again with this env. Returned as JSON, so it can be compared.
 * `source` evaluates other text in the file's place (a mutant, for the positive control), never written to disk.
 */
function appConfigFor(eas: Eas, profile: string, extra: Record<string, string> = {}, source?: string): string {
  const req = createRequire(join(APP, 'package.json'));
  const file = join(APP, 'app.config.ts');
  const names = configVariables(eas);
  const saved = Object.fromEntries(names.map((k) => [k, process.env[k]]));
  try {
    for (const k of names) delete process.env[k];
    const env = { ...((resolveProfile(eas.build, profile)?.env ?? {}) as Record<string, string>), EAS_BUILD_PROFILE: profile, ...extra };
    for (const [k, v] of Object.entries(env)) process.env[k] = v;
    for (const k of Object.keys(req.cache)) if (k === file || basename(k) === 'app.config.ts') delete req.cache[k];
    if (source !== undefined) {
      // @expo/require-utils takes a loaded module from the cache as it is, so the mutant stands in for the file.
      const { outputText } = ts.transpileModule(source, { fileName: file, compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true } });
      const mod = { exports: {} as Record<string, unknown>, loaded: true, id: file, filename: file };
      new Function('module', 'exports', 'require', '__dirname', '__filename', outputText)(mod, mod.exports, createRequire(file), APP, file);
      req.cache[file] = mod as unknown as NodeJS.Module;
    }
    return JSON.stringify(getConfig(APP, { skipSDKVersionRequirement: true, isPublicConfig: false }).exp);
  } finally {
    for (const [k, v] of Object.entries(saved)) {
      if (v === undefined) delete process.env[k];
      else process.env[k] = v;
    }
    if (source !== undefined) delete req.cache[file];
  }
}

describe('[NX-39-R39] no config path carries a switch into a build', () => {
  it('[NX-39-R39] app.config.ts evaluates the same for preview, testflight and production with each switch unset, off or on', () => {
    // A name scan cannot see a switch name built at config time (Review B B7: `process.env[['EXPO', 'PUBLIC',
    // 'VIDEO'].join('_')]` copied into `extra`, which ships in the embedded config). So evaluate the config itself: a
    // switch that reaches `extra`, a plugin's options or any other key changes the result, whatever its spelling.
    const eas = readEas();
    const profiles = [...new Set([...storeProfiles(eas), 'production'])].sort();
    expect(profiles).toEqual(expect.arrayContaining(['preview', 'production', 'testflight']));
    for (const profile of profiles) {
      const unset = appConfigFor(eas, profile);
      expect(JSON.parse(unset).ios.bundleIdentifier, profile).toMatch(/\./);
      for (const s of MEDIA_PHASE_SWITCHES) {
        for (const value of ['off', 'on']) expect(appConfigFor(eas, profile, { [s.env]: value }) === unset, `${profile} ${s.env}=${value}`).toBe(true);
      }
      const allOn = Object.fromEntries(SWITCH_NAMES.map((n) => [n, 'on']));
      expect(appConfigFor(eas, profile, allOn) === unset, `${profile} every switch on`).toBe(true);
    }
    // Each evaluation is under 100 ms once @expo/config is loaded, but the first one pays that cold load (BL-443).
  }, 20_000);

  it('[NX-39-R39] positive control: the evaluation sees a switch copied into the config, at the top level or in the function', () => {
    // The real app.config.ts with B7 applied, evaluated in the file's place (nothing is written): the check above fails.
    const eas = readEas();
    const real = readFileSync(join(APP, 'app.config.ts'), 'utf8');
    const b7 = real.replace('  extra: {\n', "  extra: {\n    video: process.env[['EXPO', 'PUBLIC', 'VIDEO'].join('_')],\n");
    const top = real.replace('export default (', "const VIDEO = process.env[['EXPO', 'PUBLIC', 'VIDEO'].join('_')];\nexport default (").replace('  extra: {\n', '  extra: {\n    video: VIDEO,\n');
    expect(b7).not.toBe(real);
    expect(top).not.toBe(real);
    // the real text, evaluated the same way, matches the file
    expect(appConfigFor(eas, 'production', {}, real)).toBe(appConfigFor(eas, 'production'));
    for (const mutant of [b7, top]) {
      expect(appConfigFor(eas, 'production', { EXPO_PUBLIC_VIDEO: 'off' }, mutant)).not.toBe(appConfigFor(eas, 'production', {}, mutant));
    }
  }, 20_000);

  it('[NX-39-R39] no bundler config writes process.env, so none can turn a switch on in every profile', () => {
    // metro.config.js (and app.config.ts, and a babel config if one is added) runs in the bundler's process before
    // the transform workers inline process.env, so `process.env.EXPO_PUBLIC_VIDEO = 'on'` there would flip the inlined
    // value in every profile while eas.json and G6 still show off (Review A N4). There is no babel config today (Expo's
    // default preset); one added later is read here.
    expect(existsSync(join(APP, 'metro.config.js'))).toBe(true);
    const present = BUNDLER_CONFIGS.filter((f) => existsSync(f));
    expect(present.map(repoRel)).toEqual(expect.arrayContaining(['apps/mobile/app.config.ts', 'apps/mobile/metro.config.js']));
    expect(present.flatMap(processEnvWrites)).toEqual([]);
    // and no .env file Expo loads at build time names a switch
    const dotEnv = readdirSync(APP).filter((n) => n === '.env' || n.startsWith('.env.'));
    for (const n of dotEnv) for (const s of SWITCH_NAMES) expect(readFileSync(join(APP, n), 'utf8'), `${n} ${s}`).not.toMatch(nameIn(s));
  });

  it('[NX-39-R39] positive control: a write to process.env in a bundler config is caught, and a read is not', () => {
    const dir = mkdtempSync(join(tmpdir(), 'nx39-env-'));
    try {
      const file = join(dir, 'metro.config.js');
      const writes = [
        "process.env.EXPO_PUBLIC_VIDEO = 'on';\n",
        "process.env['EXPO_PUBLIC_VIDEO'] = 'on';\n",
        "process['env'][['EXPO', 'PUBLIC', 'VIDEO'].join('_')] = 'on';\n",
        "process.env.EXPO_PUBLIC_VIDEO ||= 'on';\n",
        "globalThis.process.env.EXPO_PUBLIC_VIDEO = 'on';\n",
        "Object.assign(process.env, { EXPO_PUBLIC_VIDEO: 'on' });\n",
        "const e = process.env;\ne.EXPO_PUBLIC_VIDEO = 'on';\n",
        "const p = process;\np.env.EXPO_PUBLIC_VIDEO = 'on';\n",
        "({ x: process.env.EXPO_PUBLIC_VIDEO } = { x: 'on' });\n",
        "delete process.env.EXPO_PUBLIC_PHOTOS;\n",
        "process.env = { EXPO_PUBLIC_VIDEO: 'on' };\n",
        "const { env } = require('node:process');\nenv.EXPO_PUBLIC_VIDEO = 'on';\n",
      ];
      for (const code of writes) {
        writeFileSync(file, code);
        expect(processEnvWrites(file).length, code).toBeGreaterThan(0);
      }
      writeFileSync(file, "// process.env.EXPO_PUBLIC_VIDEO = 'on';\nconst a = process.env.CI;\nconst b = { ...process.env };\nconst c = process.platform;\nconst d = x.process;\nmodule.exports = { a, b, c, d };\n");
      expect(processEnvWrites(file)).toEqual([]);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
