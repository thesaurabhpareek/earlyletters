/// <reference types="node" />
/**
 * Council ruling E6 (BL-410): the web-only e2e presentation seam. One test group per constraint:
 * inert without the e2e gate, closed values, web only (empty native sibling), presentation only,
 * and the keys kept out of every file a store bundle can carry. The B-8 side is in
 * .github/scripts/seam-guard.test.mjs.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import ts from 'typescript';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { directionOf, parseFontScale, parseLang, readSeam } from '../src/dev/e2e-web-seam.logic';
import { fontScaleOverride, languageOverride } from '../src/dev/e2e-web-seam';

const APP = join(__dirname, '..');
const SRC = join(APP, 'src');
const read = (...p: string[]) => readFileSync(join(SRC, ...p), 'utf8');
const KEYS = ['e2eFontScale', 'e2eLang'];

describe('closed values: anything else is ignored', () => {
  it('[E6-3] font scale: only default, AX1, AX3 and AX5, written as the number', () => {
    expect(['1', '1.786', '2.643', '3.571'].map(parseFontScale)).toEqual([1, 1.786, 2.643, 3.571]);
    for (const bad of ['1.353', '0', '-1', '99', '3.5710', '1.0', 'NaN', 'Infinity', '', ' 1', 'ax5', '3.571;1', null, undefined]) expect(parseFontScale(bad), String(bad)).toBeNull();
  });

  it('[E6-4] language: the seven spoken-language codes only, exactly as written', () => {
    for (const ok of ['en', 'hi', 'es', 'zh', 'fr', 'ar', 'pt']) expect(parseLang(ok)).toBe(ok);
    for (const bad of ['EN', 'de', 'fr-FR', 'pt-BR', 'zh-Hant', 'xx', '', 'en,fr', '__proto__', null, undefined]) expect(parseLang(bad), String(bad)).toBeNull();
  });

  it('reads both keys from a query string, and each independently', () => {
    expect(readSeam('?e2eFontScale=3.571&e2eLang=ar')).toEqual({ fontScale: 3.571, lang: 'ar' });
    expect(readSeam('?e2eFontScale=7&e2eLang=ar')).toEqual({ fontScale: null, lang: 'ar' });
    expect(readSeam('?fontScale=3.571&lang=ar')).toEqual({ fontScale: null, lang: null });
    expect(readSeam('')).toEqual({ fontScale: null, lang: null });
  });

  it('Arabic is right to left, the others left to right', () => {
    expect(directionOf('ar')).toBe('rtl');
    expect(['en', 'hi', 'es', 'zh', 'fr', 'pt'].map((c) => directionOf(c as 'en'))).toEqual(Array(6).fill('ltr'));
  });
});

describe('the web reader', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.resetModules();
  });

  async function load(search: string) {
    const root = { lang: '', dir: '' };
    vi.stubGlobal('window', { location: { search } });
    vi.stubGlobal('document', { documentElement: root });
    vi.resetModules();
    const m = await import('../src/dev/e2e-web-seam.web');
    return { m, root };
  }

  it('[E6-5] reports the scale and language, and sets the page language and direction', async () => {
    const { m, root } = await load('?e2eFontScale=3.571&e2eLang=ar');
    expect(m.fontScaleOverride()).toBe(3.571);
    expect(m.languageOverride()).toBe('ar');
    expect(root).toEqual({ lang: 'ar', dir: 'rtl' });
  });

  it('[E6-4] ignores an open value: no override, and the page is untouched', async () => {
    const { m, root } = await load('?e2eFontScale=4&e2eLang=de');
    expect(m.fontScaleOverride()).toBeNull();
    expect(m.languageOverride()).toBeNull();
    expect(root).toEqual({ lang: '', dir: '' });
  });

  it('with no query it does nothing', async () => {
    const { m, root } = await load('');
    expect([m.fontScaleOverride(), m.languageOverride(), root.lang]).toEqual([null, null, '']);
  });

  it('[E6-5] presentation only: it imports nothing but its own pure half, and touches no store or network', () => {
    const code = read('dev', 'e2e-web-seam.web.ts').replace(/\/\*[\s\S]*?\*\//g, '');
    expect([...code.matchAll(/from '([^']+)'/g)].map((m) => m[1])).toEqual(['./e2e-web-seam.logic']);
    expect(code).not.toMatch(/localStorage|sessionStorage|fetch\(|XMLHttpRequest|sqlite|setSetting|getSetting|history\./i);
    const logic = read('dev', 'e2e-web-seam.logic.ts').replace(/\/\*[\s\S]*?\*\//g, '');
    expect([...logic.matchAll(/from '([^']+)'/g)].map((m) => m[1]).sort()).toEqual(['../lib/a11y.logic', '../lib/models/catalog', '@scribe/core']);
  });
});

describe('[E6-1] web only: the native sibling is empty', () => {
  it('answers null and carries neither key', () => {
    expect(fontScaleOverride()).toBeNull();
    expect(languageOverride()).toBeNull();
    const src = read('dev', 'e2e-web-seam.ts');
    for (const k of KEYS) expect(src).not.toContain(k);
    expect(src).not.toMatch(/window|document|location/);
  });
});

type Profile = { extends?: string; env?: Record<string, string> };
const eas = JSON.parse(readFileSync(join(APP, 'eas.json'), 'utf8')) as { build: Record<string, Profile> };
function profileEnv(name: string): Record<string, string> {
  const p = eas.build[name];
  return { ...(p.extends ? profileEnv(p.extends) : {}), ...(p.env ?? {}) };
}

/** Evaluates the gate file with `env` as Metro would inline it, and a spy for `require`. */
function gateWith(env: Record<string, string>) {
  const js = ts.transpileModule(read('dev', 'e2e-web-seam-load.ts'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  const required: string[] = [];
  const mod = { exports: {} as { e2eWebSeam?: unknown } };
  new Function('exports', 'module', 'require', 'process', js)(mod.exports, mod, (id: string) => (required.push(id), { fontScaleOverride: () => 1 }), { env });
  return { required, loaded: mod.exports.e2eWebSeam !== null };
}

describe('[E6-2] the same gate as the other seams: inert without it', () => {
  it('the e2e profile loads the reader', () => {
    expect(gateWith(profileEnv('e2e'))).toEqual({ required: ['./e2e-web-seam'], loaded: true });
  });

  it.each(Object.keys(eas.build).filter((n) => n !== 'e2e'))('%s as it builds: never required', (name) => {
    expect(gateWith(profileEnv(name))).toEqual({ required: [], loaded: false });
  });

  it.each(['preview', 'testflight', 'production'])('%s with EXPO_PUBLIC_E2E=1 leaked in: still never required', (name) => {
    expect(gateWith({ ...profileEnv(name), EXPO_PUBLIC_E2E: '1' })).toEqual({ required: [], loaded: false });
  });

  it('E2E on but app env preview or production, or E2E off or not "1": never required', () => {
    const envs: Record<string, string>[] = [{ EXPO_PUBLIC_E2E: '1', EXPO_PUBLIC_APP_ENV: 'preview' }, { EXPO_PUBLIC_E2E: '1', EXPO_PUBLIC_APP_ENV: 'production' }, { EXPO_PUBLIC_E2E: '0', EXPO_PUBLIC_APP_ENV: 'development' }, { EXPO_PUBLIC_E2E: 'true', EXPO_PUBLIC_APP_ENV: 'development' }, {}];
    for (const env of envs) {
      expect(gateWith(env).required, JSON.stringify(env)).toEqual([]);
    }
  });

  it('the gate is the same expression as e2e-seams.ts', () => {
    const cond = (f: string) => /(process\.env\.EXPO_PUBLIC_E2E === '1'[^?]*)\?/.exec(read('dev', f))?.[1]?.replace(/\s+/g, ' ').trim();
    expect(cond('e2e-web-seam-load.ts')).toBeDefined();
    expect(cond('e2e-web-seam-load.ts')).toBe(cond('e2e-seams.ts'));
  });
});

describe('[E6-3] greppable: the keys live only in the two web files', () => {
  it('no other file under src carries either key (so a store bundle cannot, B-8 searches for them)', () => {
    const hits: string[] = [];
    const walk = (d: string) => {
      for (const n of readdirSync(d)) {
        const p = join(d, n);
        if (statSync(p).isDirectory()) walk(p);
        else if (/\.(ts|tsx)$/.test(n) && KEYS.some((k) => readFileSync(p, 'utf8').includes(k))) hits.push(relative(SRC, p));
      }
    };
    walk(SRC);
    expect(hits.sort()).toEqual(['dev/e2e-web-seam.logic.ts', 'dev/e2e-web-seam.web.ts']);
  });

  it('only lib/a11y.ts loads the gate file, and it reads the override through the hook', () => {
    const loaders: string[] = [];
    const walk = (d: string) => {
      for (const n of readdirSync(d)) {
        const p = join(d, n);
        if (statSync(p).isDirectory()) walk(p);
        else if (/\.(ts|tsx)$/.test(n) && !n.startsWith('e2e-web-seam') && readFileSync(p, 'utf8').includes('e2e-web-seam-load')) loaders.push(relative(SRC, p));
      }
    };
    walk(SRC);
    expect(loaders).toEqual(['lib/a11y.ts']);
    expect(read('lib', 'a11y.ts')).toMatch(/return e2eWebSeam\?\.fontScaleOverride\(\) \?\? real;/);
  });
});
