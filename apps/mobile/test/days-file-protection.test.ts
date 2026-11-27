/// <reference types="node" />
/**
 * [NS-47-R6] The days file keeps a protection class no weaker than SEC-R15's (BL-1201, default path, no native code).
 *
 * The class is not set per file. expo-file-system 57 has no protection option, and ScribeFiles has no protection call,
 * so the days file takes the app-wide default that app.config.ts declares in the
 * `com.apple.developer.default-data-protection` entitlement: NSFileProtectionCompleteUntilFirstUserAuthentication.
 * config.test.ts already holds that declaration (PSEC-05); this file does not repeat it. It holds the two things that
 * would let the days file drift from that class without any test noticing:
 *   (a) the file moves out of the app's own Library/Application Support folder (on iOS: into Documents, which the
 *       Files app and file sharing can reach, or Caches or tmp, which have other rules), or the folder rule stops
 *       failing closed on a layout it does not know;
 *   (b) the days code passes a protection option: a protection key, an NSFileProtection string, or any option to
 *       create, write or move beyond the ones that only say where and whether to overwrite.
 * (a) runs the real daysDirectory() through expoDaysPort() over the expo-file-system stand-in, so the rule under test is
 * the one the app runs. (b) runs the same cycle and records every option and native call, and pins the source of every
 * file under src/lib/days by its syntax tree, so a comment can mention protection but code cannot pass it.
 * Reading the class back on a device is BL-2156. Fictional data only; the owner key and day id are synthetic.
 * Mutants run by hand (see the PR): the iOS folder moved to Documents; a protection option added to create.
 */
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import ts from 'typescript';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { androidContainer, createDisk, iosContainer, type Container, type Disk } from './helpers/expo-fs-standin';

const h = vi.hoisted(() => ({
  disk: null as unknown as Disk,
  excluded: new Set<string>(),
  /** Every call into expo-file-system that takes options, with its arguments after the content (if any). */
  calls: [] as { op: string; options: unknown[] }[],
  /** Every ScribeFiles method the days code reached for, by name. */
  native: [] as string[],
}));

vi.mock('expo-file-system', async () => {
  const fs = (await import('./helpers/expo-fs-standin')).expoFileSystem(() => h.disk);
  const wrap = (proto: Record<string, unknown>, method: string, op: string, skip: number) => {
    const real = proto[method] as (...a: unknown[]) => unknown;
    proto[method] = function (this: unknown, ...args: unknown[]) {
      h.calls.push({ op, options: args.slice(skip) });
      return real.apply(this, args);
    };
  };
  wrap(fs.File.prototype as never, 'create', 'File.create', 0);
  wrap(fs.File.prototype as never, 'write', 'File.write', 1);
  wrap(fs.File.prototype as never, 'move', 'File.move', 1);
  const { move } = fs.File.prototype;
  fs.File.prototype.move = async function (this: { uri: string }, to: { uri: string }, o?: { overwrite?: boolean }) {
    await move.call(this, to, o);
    if (h.excluded.delete(this.uri)) h.excluded.add(to.uri); // a rename keeps the backup attribute on iOS
  };
  wrap(fs.File.prototype as never, 'delete', 'File.delete', 0);
  wrap(fs.Directory.prototype as never, 'create', 'Directory.create', 0);
  return fs;
});

vi.mock('../modules/scribe-files', () => {
  const real: Record<string, (...a: never[]) => unknown> = {
    setExcludedFromBackup: (uri: string, on: boolean) => (on ? h.excluded.add(uri) : h.excluded.delete(uri)),
    isExcludedFromBackup: (uri: string) => h.excluded.has(uri),
  };
  // A Proxy, so a call to a method the module does not have today (a protection setter) is seen, not just a TypeError.
  const ScribeFiles = new Proxy(real, {
    get(target, name) {
      if (typeof name === 'string') h.native.push(name);
      return typeof name === 'string' && name in target ? target[name] : () => undefined;
    },
  });
  return { ScribeFiles };
});

const { expoDaysPort, readDays, removeDays, sweepDaysTemp, writeDays, DAYS_FILE, DAYS_FOLDER } = await import('../src/lib/days/store-file');

const OWNER = '1a2b3c4d5e6f7a8b';
const days = { v: 1, owner: OWNER, ticked: { 'seasonal.synthetic-day': {} } };
const strip = (u: string) => u.replace(/\/+$/, '');

function use(c: Container): Disk {
  h.disk = createDisk(c);
  h.excluded = new Set();
  h.calls = [];
  h.native = [];
  return h.disk;
}

/** Everything on the disk that was not there before: files and folders, by uri. */
function added(before: { files: Set<string>; dirs: Set<string> }): string[] {
  return [...[...h.disk.files.keys()].filter((u) => !before.files.has(u)), ...[...h.disk.dirs].filter((u) => !before.dirs.has(u))];
}
const snapshot = () => ({ files: new Set(h.disk.files.keys()), dirs: new Set(h.disk.dirs) });

/** One full life of the file through the real port: open, write, read back, sweep, remove. */
async function cycle(): Promise<void> {
  const port = expoDaysPort();
  expect(port).not.toBeNull();
  expect(await writeDays(port!, days)).toBe('ok');
  expect(readDays(port!, OWNER)).toMatchObject({ state: 'ok' });
  sweepDaysTemp(port!);
  expect(await writeDays(port!, days)).toBe('ok'); // a second write renames over the first
  expect(removeDays(port!)).toBe(true);
}

const IOS = iosContainer('6F0C3A2E-ASHA-4C1B-9D55-DAYS00001201');
const iosRoot = strip(IOS.documents).replace(/\/Documents$/, '');
const IOS_DAYS = `${iosRoot}/Library/Application%20Support/${DAYS_FOLDER}`;

describe('[NS-47-R6] the days file stays in the app\'s own Application Support folder', () => {
  beforeEach(() => {
    use(IOS);
  });

  it('on iOS every file and folder the store makes is under <container>/Library/Application Support/days', async () => {
    const before = snapshot();
    const port = expoDaysPort()!;
    expect(await writeDays(port, days)).toBe('ok');
    expect(h.disk.files.has(`${IOS_DAYS}/${DAYS_FILE}`)).toBe(true);
    const made = added(before);
    expect(made.length).toBeGreaterThan(0);
    for (const u of made) {
      // A folder on the way to days (Library, Application Support) is fine; anything else must sit inside days.
      expect(u === IOS_DAYS || u.startsWith(`${IOS_DAYS}/`) || IOS_DAYS.startsWith(`${u}/`)).toBe(true);
    }
    // Not under Documents (Files app and file sharing can reach it), not under Caches (the system may purge it).
    for (const u of h.disk.files.keys()) {
      expect(u.startsWith(strip(IOS.documents))).toBe(false);
      expect(u.startsWith(strip(IOS.caches))).toBe(false);
    }
  });

  it('the iOS folder is the sibling Library of Documents in the same container, not a folder inside Documents', async () => {
    await cycle();
    const dirs = [...h.disk.dirs].filter((u) => u.endsWith(`/${DAYS_FOLDER}`));
    expect(dirs).toEqual([IOS_DAYS]);
    expect(IOS_DAYS.startsWith(`${iosRoot}/Library/`)).toBe(true);
  });

  it('on Android the file is under the app\'s own files/days', async () => {
    const disk = use(androidContainer());
    const files = strip(disk.documents);
    expect(files.endsWith('/files')).toBe(true);
    const before = snapshot();
    expect(await writeDays(expoDaysPort()!, days)).toBe('ok');
    expect(h.disk.files.has(`${files}/${DAYS_FOLDER}/${DAYS_FILE}`)).toBe(true);
    for (const u of added(before)) expect(u === `${files}/${DAYS_FOLDER}` || u.startsWith(`${files}/${DAYS_FOLDER}/`)).toBe(true);
  });

  it('an unknown layout gives no port and makes nothing on disk (fail closed)', () => {
    const odd: Container[] = [
      { documents: 'file:///var/mobile/Containers/Shared/AppGroup/ASHA-0000/', caches: 'file:///var/mobile/Containers/Shared/AppGroup/ASHA-0000/Caches/', os: 'ios' },
      // "Documents" or "files" in the middle of the path is not the app's own folder.
      { documents: `${IOS.documents}inner/`, caches: IOS.caches, os: 'ios' },
      { documents: 'file:///data/user/0/org.example.standin/files/inner/', caches: 'file:///data/user/0/org.example.standin/cache/', os: 'android' },
      { documents: 'file:///private/var/mobile/Library/Mobile%20Documents/', caches: 'file:///private/var/mobile/Library/Caches/', os: 'ios' },
    ];
    for (const c of odd) {
      use(c);
      const before = snapshot();
      expect(expoDaysPort()).toBeNull();
      expect(added(before)).toEqual([]);
    }
  });
});

/** Options that only say where and whether to replace. Anything else (a protection key above all) is a review question. */
const ALLOWED: Record<string, readonly string[]> = {
  'File.create': ['overwrite', 'intermediates'],
  'Directory.create': ['intermediates', 'idempotent', 'overwrite'],
  'File.move': ['overwrite'],
  'File.write': [],
  'File.delete': [],
};
const NATIVE_ALLOWED = ['setExcludedFromBackup', 'isExcludedFromBackup'];
const PROTECTION = /protect/i; // protection, NSFileProtection*, FileProtectionType, completeFileProtection, dataProtection

describe('[NS-47-R6] the days code passes no protection option, so the file inherits the app-wide class', () => {
  for (const [name, c] of [['iOS', IOS], ['Android', androidContainer()]] as const) {
    it(`a full write, read, sweep and remove on ${name} passes only where-and-overwrite options and calls no protection setter`, async () => {
      use(c);
      await cycle();
      expect(h.calls.map((x) => x.op)).toEqual(expect.arrayContaining(['Directory.create', 'File.create', 'File.write', 'File.move']));
      for (const { op, options } of h.calls) {
        expect(Object.keys(ALLOWED)).toContain(op);
        for (const o of options) {
          if (o === undefined) continue;
          expect(typeof o, `${op} took a non-object option`).toBe('object');
          const keys = Object.keys(o as object);
          expect(keys.filter((k) => !ALLOWED[op].includes(k)), `${op} options`).toEqual([]);
          expect(JSON.stringify(o)).not.toMatch(PROTECTION);
        }
      }
      for (const m of h.native) expect(NATIVE_ALLOWED, `ScribeFiles.${m}`).toContain(m);
    });
  }
});

/** Calls whose options could carry a protection class: expo-file-system's create, write, move, copy and the port's rename. */
const OPTION_CALLS = new Set(['create', 'write', 'move', 'copy', 'rename', 'createFile', 'writeAsStringAsync', 'moveAsync', 'copyAsync', 'makeDirectoryAsync']);
const OPTION_KEYS = new Set(['overwrite', 'intermediates', 'idempotent', 'encoding', 'append']);

/** What the syntax of one source says about protection: names and strings that mention it, and option keys outside the allow-list. */
function findings(file: string, text: string): string[] {
  const sf = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true, file.endsWith('x') ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
  const out: string[] = [];
  const at = (n: ts.Node) => `${file}:${sf.getLineAndCharacterOfPosition(n.getStart(sf)).line + 1}`;
  const visit = (n: ts.Node) => {
    if ((ts.isIdentifier(n) || ts.isPrivateIdentifier(n)) && PROTECTION.test(n.text)) out.push(`${at(n)} name ${n.text}`);
    if ((ts.isStringLiteralLike(n) || ts.isTemplateLiteralToken(n)) && PROTECTION.test(n.text)) out.push(`${at(n)} string ${n.text}`);
    if (ts.isCallExpression(n)) {
      const callee = n.expression;
      const name = ts.isPropertyAccessExpression(callee) ? callee.name.text : ts.isIdentifier(callee) ? callee.text : '';
      if (OPTION_CALLS.has(name)) {
        for (const a of n.arguments) {
          if (!ts.isObjectLiteralExpression(a)) continue;
          for (const p of a.properties) {
            const key = p.name && (ts.isIdentifier(p.name) || ts.isStringLiteral(p.name)) ? p.name.text : null;
            if (key === null || !OPTION_KEYS.has(key)) out.push(`${at(p)} option ${key ?? p.getText(sf)} on ${name}`);
          }
        }
      }
    }
    ts.forEachChild(n, visit);
  };
  visit(sf);
  return out;
}

const DAYS_SRC = join(__dirname, '..', 'src', 'lib', 'days');
function walk(dir: string, out: string[] = []): string[] {
  for (const d of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, d.name);
    if (d.isDirectory()) walk(p, out);
    else if (/\.(tsx?|jsx?)$/.test(d.name)) out.push(p);
  }
  return out;
}

describe('[NS-47-R6] source pin: no code under src/lib/days names a protection class or passes a protection option', () => {
  it('the pin reads the days code (not an empty folder) and finds nothing', () => {
    const files = walk(DAYS_SRC);
    expect(files.map((f) => f.slice(DAYS_SRC.length + 1)).sort()).toEqual(expect.arrayContaining(['index.ts', 'store-file.ts', 'store.logic.ts']));
    const storeFile = readFileSync(join(DAYS_SRC, 'store-file.ts'), 'utf8');
    expect(storeFile).toMatch(/from 'expo-file-system'/); // the file that touches the disk is the one read
    expect(files.flatMap((f) => findings(f.slice(DAYS_SRC.length + 1), readFileSync(f, 'utf8')))).toEqual([]);
  });

  it('the pin itself catches each shape of a protection option (so a broken scanner cannot pass)', () => {
    const shapes = [
      "f.create({ overwrite: true, protection: 'complete' });",
      "f.write(t, { encoding: 'utf8', fileProtection: x });",
      "f.move(g, { overwrite: true, attributes: a });",
      "const c = 'NSFileProtectionNone';",
      'ScribeFiles?.setFileProtection(f.uri, c);',
      'f.create({ overwrite: true, ...opts });',
    ];
    for (const s of shapes) expect(findings('mutant.ts', s), s).not.toEqual([]);
    expect(findings('ok.ts', "// protection is inherited\nf.create({ overwrite: true }); f.move(g, { overwrite: true }); dir.create({ intermediates: true, idempotent: true });")).toEqual([]);
  });
});
