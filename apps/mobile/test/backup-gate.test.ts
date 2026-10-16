/// <reference types="node" />
/**
 * `capabilities.backup` (F08-REQ-041; WP-F08-B5c): off by default, and a
 * build with it off loads none of backup. Two halves: the import graph (no
 * file outside lib/backup reaches any backup file but gate.ts, and gate.ts
 * reaches none statically), and the runtime (with the flag off the gate
 * returns nothing and never requires the runtime or the native module).
 */
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { backupEnabled, capabilities, setBackupForTests, setServerFeaturesForTests } from '../src/lib/capabilities';
import { backupInBuild, loadBackup, startBackup } from '../src/lib/backup/gate';

const APP = join(__dirname, '..');
const SRC = join(APP, 'src');
const BACKUP = join(SRC, 'lib', 'backup');
const GATE = join(BACKUP, 'gate.ts');

function sources(dir: string): string[] {
  return readdirSync(dir).flatMap((n) => {
    const f = join(dir, n);
    if (statSync(f).isDirectory()) return sources(f);
    return /\.(ts|tsx)$/.test(n) && !/\.test\.tsx?$/.test(n) ? [f] : [];
  });
}

/** Every module specifier a file names: static imports and exports, dynamic import(), require(). */
function specifiers(file: string): string[] {
  const src = readFileSync(file, 'utf8');
  const out: string[] = [];
  for (const re of [/\bfrom\s+['"]([^'"]+)['"]/g, /\bimport\s+['"]([^'"]+)['"]/g, /\bimport\(\s*['"]([^'"]+)['"]\s*\)/g, /\brequire\(\s*['"]([^'"]+)['"]\s*\)/g]) {
    for (const m of src.matchAll(re)) out.push(m[1]);
  }
  return out;
}

function resolveSpec(from: string, spec: string): string | null {
  let base: string | null = null;
  if (spec.startsWith('@/')) base = join(SRC, spec.slice(2));
  else if (spec.startsWith('.')) base = resolve(dirname(from), spec);
  if (!base) return null;
  for (const c of [base, `${base}.ts`, `${base}.tsx`, join(base, 'index.ts')]) if (existsSync(c) && statSync(c).isFile()) return c;
  return base;
}

afterEach(() => {
  setServerFeaturesForTests(null);
  setBackupForTests(null);
});

describe('[F08-REQ-041] capabilities.backup is its own flag, off by default', () => {
  it('is off in this process and in every EAS profile', () => {
    expect(capabilities.backup).toBe(false);
    const eas = JSON.parse(readFileSync(join(APP, 'eas.json'), 'utf8')) as { build: Record<string, { env?: Record<string, string> }> };
    for (const [name, p] of Object.entries(eas.build)) expect(p.env?.EXPO_PUBLIC_BACKUP ?? 'off', name).not.toBe('on');
  });

  it('needs server features too: backup on with the server off is still off', () => {
    setBackupForTests(true);
    expect(backupEnabled()).toBe(false);
    setServerFeaturesForTests(true);
    expect(backupEnabled()).toBe(true);
    setBackupForTests(false);
    expect(backupEnabled()).toBe(false);
  });

  it('server features on do not turn backup on', () => {
    setServerFeaturesForTests(true);
    expect(capabilities.backup).toBe(false);
  });
});

describe('[F08-REQ-041] a build with the flag off loads none of backup', () => {
  it('no file outside lib/backup imports any backup file but gate.ts, or the ScribeKeys module', () => {
    const offenders: string[] = [];
    for (const f of sources(SRC)) {
      if (f.startsWith(BACKUP + '/')) continue;
      for (const s of specifiers(f)) {
        if (/scribe-keys/.test(s)) offenders.push(`${relative(APP, f)} -> ${s}`);
        const target = resolveSpec(f, s);
        if (target && target.startsWith(BACKUP + '/') && target !== GATE) offenders.push(`${relative(APP, f)} -> ${s}`);
      }
    }
    expect(offenders).toEqual([]);
  });

  it('only runtime.ts, behind the gate, touches the native module', () => {
    const users = sources(BACKUP).filter((f) => specifiers(f).some((s) => /scribe-keys/.test(s)));
    expect(users.map((f) => relative(BACKUP, f))).toEqual(['runtime.ts']);
  });

  it('gate.ts imports only the capabilities switch, and requires the runtime only behind the flag', () => {
    const src = readFileSync(GATE, 'utf8');
    const imports = [...src.matchAll(/^import\s.*?from\s+['"]([^'"]+)['"]/gm)].map((m) => m[1]);
    expect(imports).toEqual(['../capabilities']);
    const body = src.slice(src.indexOf('export function loadBackup'));
    const flag = body.indexOf('if (!capabilities.backup) return null;');
    const req = body.indexOf("require('./runtime')");
    expect(flag).toBeGreaterThan(-1);
    expect(req).toBeGreaterThan(flag);
    expect(src.match(/require\(/g)).toHaveLength(1);
  });

  it('with the flag off: nothing loads, start is a no-op, and the screen has nothing to show', () => {
    // vitest runs ES modules: a `require` here would throw, so these calls prove the runtime is never required.
    expect(loadBackup()).toBeNull();
    expect(() => startBackup()).not.toThrow();
    expect(backupInBuild()).toBe(false);
    setServerFeaturesForTests(true);
    expect(loadBackup()).toBeNull();
  });

  it('the Settings row, the screen and the root layout all go through the gate', () => {
    const index = readFileSync(join(SRC, 'app/settings/index.tsx'), 'utf8');
    expect(index).toMatch(/\{backupInBuild\(\) \? <ListRow title=\{backupCopy\.title\}/);
    const screen = readFileSync(join(SRC, 'app/settings/backup.tsx'), 'utf8');
    expect(screen).toMatch(/const rt = loadBackup\(\);\s+if \(!rt\) return <Redirect href="\/settings" \/>;/);
    const layout = readFileSync(join(SRC, 'app/_layout.tsx'), 'utf8');
    expect(layout).toMatch(/import \{ startBackup \} from '@\/lib\/backup\/gate';/);
  });
});

describe('[security 1] the never-compiled native module is in no iOS build yet', () => {
  it('apps/mobile/package.json excludes scribe-keys from Expo autolinking, and the JS side treats it as absent', () => {
    const pkg = JSON.parse(readFileSync(join(APP, 'package.json'), 'utf8')) as { expo?: { autolinking?: { exclude?: string[] } } };
    // Remove this line, and this test, in the PR whose Mac or macOS CI build first compiles modules/scribe-keys.
    expect(pkg.expo?.autolinking?.exclude).toEqual(['scribe-keys']);
    const index = readFileSync(join(APP, 'modules', 'scribe-keys', 'index.ts'), 'utf8');
    expect(index).toMatch(/requireOptionalNativeModule<ScribeKeysNative>\('ScribeKeys'\)/);
  });
});
