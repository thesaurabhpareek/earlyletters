/// <reference types="node" />
/**
 * RA-20-18, the wiring line (docs/release/AUTOMATION.md section 5; apps/mobile/e2e/README.md section 9): the root
 * layout calls `useE2eSeams()` as the first line of `Root()`, so an e2e simulator build arms the kill drill, and
 * every other build calls a no-op that loads no seam code.
 *
 * Two halves, because Node tests do not render React Native:
 * 1. A source test: `Root()` calls the hook once, first, unconditionally, and no other app file loads the seams.
 * 2. The seams module evaluated once per eas.json build profile, with that profile's env (following `extends`) as
 *    Metro would inline it and a spy in place of `require`: the e2e profile gets the kill drill's hook; every other
 *    profile gets the no-op and never asks for `./kill-drill`, even with EXPO_PUBLIC_E2E=1 leaked into a store
 *    profile. Whether the drill's code is also absent from the store bundles is B-8, proven by
 *    `.github/scripts/seam-guard.mjs` on real `expo export` output in ci.yml.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import ts from 'typescript';
import { describe, expect, it } from 'vitest';

const APP = join(__dirname, '..');
const SRC = join(APP, 'src');
const code = (t: string) => t.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\{\/\*[\s\S]*?\*\/\}/g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');

/** The body of `function <name>() { ... }`, by brace matching on comment-free source. */
function bodyOf(source: string, name: string): string {
  const head = source.indexOf(`function ${name}(`);
  expect(head, `function ${name} exists`).toBeGreaterThanOrEqual(0);
  const open = source.indexOf('{', source.indexOf(')', head));
  let depth = 0;
  for (let i = open; i < source.length; i++) {
    if (source[i] === '{') depth++;
    else if (source[i] === '}' && --depth === 0) return source.slice(open + 1, i);
  }
  throw new Error(`unbalanced braces in ${name}`);
}

describe('RA-20-18: the root layout calls useE2eSeams()', () => {
  const layout = code(readFileSync(join(SRC, 'app', '_layout.tsx'), 'utf8'));

  it('imports the hook from the seams module and calls it as the first line of Root(), once', () => {
    expect(layout).toMatch(/^import \{ useE2eSeams \} from '@\/dev\/e2e-seams';$/m);
    expect(bodyOf(layout, 'Root').trimStart().startsWith('useE2eSeams();')).toBe(true);
    // Once in the file: never behind a condition, so every render of every build runs the same hooks.
    expect(layout.match(/\buseE2eSeams\(\)/g)).toHaveLength(1);
    // Not in RootLayout, which renders before the store opens; the drill reads and writes the store.
    expect(bodyOf(layout, 'RootLayout')).not.toMatch(/useE2eSeams/);
  });

  it('no other app file loads the seams module or the kill drill', () => {
    const files: string[] = [];
    const walk = (d: string) => {
      for (const n of readdirSync(d)) {
        const p = join(d, n);
        if (statSync(p).isDirectory()) walk(p);
        // The drill's own files (kill-drill.ts and its logic) are what is loaded, not loaders.
        else if (/\.(ts|tsx)$/.test(n) && !/\.test\.tsx?$/.test(n) && !p.includes(join('dev', 'kill-drill'))) files.push(p);
      }
    };
    walk(SRC);
    const loaders = files
      .filter((f) => /['/]e2e-seams['.]|['/]kill-drill['.]/.test(code(readFileSync(f, 'utf8'))))
      .map((f) => relative(SRC, f))
      .sort();
    expect(loaders).toEqual(['app/_layout.tsx', 'dev/e2e-seams.ts']);
  }, 30_000);
});

type Profile = { extends?: string; env?: Record<string, string> };
const eas = JSON.parse(readFileSync(join(APP, 'eas.json'), 'utf8')) as { build: Record<string, Profile> };

/** A profile's env as EAS merges it: the base first, each child over it. */
function profileEnv(name: string, seen: string[] = []): Record<string, string> {
  const p = eas.build[name];
  if (!p || seen.includes(name)) throw new Error(`no build profile ${name}, or a cycle`);
  return { ...(p.extends ? profileEnv(p.extends, [...seen, name]) : {}), ...(p.env ?? {}) };
}

/** Evaluates src/dev/e2e-seams.ts with `env` and a spy for `require`. */
function seamsWith(env: Record<string, string>) {
  const source = readFileSync(join(SRC, 'dev', 'e2e-seams.ts'), 'utf8');
  const js = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  const required: string[] = [];
  const calls: string[] = [];
  const useKillDrill = () => {
    calls.push('useKillDrill');
  };
  const spy = (id: string) => {
    required.push(id);
    return { useKillDrill };
  };
  const mod = { exports: {} as { useE2eSeams?: () => void } };
  new Function('exports', 'module', 'require', 'process', js)(mod.exports, mod, spy, { env });
  const hook = mod.exports.useE2eSeams;
  expect(typeof hook).toBe('function');
  hook!();
  return { required, calls, isDrill: hook === useKillDrill };
}

describe('RA-20-18: the hook is the kill drill under the e2e profile and a no-op under every other', () => {
  it('the e2e profile (B-1) loads ./kill-drill and the root layout calls its hook', () => {
    const env = profileEnv('e2e');
    expect(env).toMatchObject({ EXPO_PUBLIC_E2E: '1', EXPO_PUBLIC_APP_ENV: 'development' });
    expect(seamsWith(env)).toEqual({ required: ['./kill-drill'], calls: ['useKillDrill'], isDrill: true });
  });

  const others = Object.keys(eas.build).filter((n) => n !== 'e2e');

  it('every other profile is listed: development and the three store profiles at least', () => {
    expect(others).toEqual(expect.arrayContaining(['development', 'preview', 'testflight', 'production']));
  });

  it.each(others)('%s as it builds: a no-op, and ./kill-drill is never required', (name) => {
    const env = profileEnv(name);
    expect(env.EXPO_PUBLIC_E2E).toBeUndefined();
    expect(seamsWith(env)).toEqual({ required: [], calls: [], isDrill: false });
  });

  it.each(['preview', 'testflight', 'production'])('%s with EXPO_PUBLIC_E2E=1 leaked in: still a no-op (B-9 also refuses that build)', (name) => {
    const env: Record<string, string> = { ...profileEnv(name), EXPO_PUBLIC_E2E: '1' };
    expect(['preview', 'production']).toContain(env.EXPO_PUBLIC_APP_ENV);
    expect(seamsWith(env)).toEqual({ required: [], calls: [], isDrill: false });
  });

  it('only the exact value 1 turns the seam on', () => {
    for (const v of ['0', 'true', ' 1', '']) {
      expect(seamsWith({ EXPO_PUBLIC_E2E: v, EXPO_PUBLIC_APP_ENV: 'development' }).isDrill, `EXPO_PUBLIC_E2E=${JSON.stringify(v)}`).toBe(false);
    }
  });
});
