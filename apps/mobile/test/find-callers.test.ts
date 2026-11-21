/// <reference types="node" />
/**
 * Find has one door (BL-952 slice 8): the store's findLetters, which checks the build switch and the account. A direct
 * `searchLetters` call from anywhere else in the app would skip both, so only lib/find itself, the store and tests may
 * name it. Also: the Find screen files carry no log, analytics or network import (NS-02-R15, R22).
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, relative, sep } from 'node:path';
import { describe, expect, it } from 'vitest';

const SRC = join(__dirname, '..', 'src');
const files = (d: string): string[] =>
  readdirSync(d).flatMap((f) => {
    const p = join(d, f);
    return statSync(p).isDirectory() ? files(p) : /\.(ts|tsx)$/.test(f) ? [p] : [];
  });
export const callersOf = (name: RegExp, allowed: (rel: string) => boolean): string[] =>
  files(SRC).map((p) => relative(SRC, p)).filter((rel) => !allowed(rel) && name.test(readFileSync(join(SRC, rel), 'utf8')));

describe('direct searchLetters callers stay inside the store', () => {
  it('only lib/find and lib/store.ts mention searchLetters', () => {
    expect(callersOf(/\bsearchLetters\b/, (r) => r.startsWith('lib/find/') || r === 'lib/store.ts')).toEqual([]);
  });
  it('the screen reaches Find only through findLetters and findAvailableNow', () => {
    const t = readFileSync(join(SRC, 'components/find/find-mode.tsx'), 'utf8');
    expect(t).toMatch(/findLetters/);
    expect(t).toMatch(/findAvailableNow/);
    expect(t).not.toMatch(/^import (?!type).*lib\/find\/(search|fts-index|scan-index|sources)/m);
  });
  it('the screen files import no analytics, log or network module', () => {
    const dir = join(SRC, 'components/find');
    const found = files(dir).flatMap((p) => forbiddenIn(readFileSync(p, 'utf8'), p));
    expect(found).toEqual([]);
  });
});

// NS-02-R15, R22: a query is never counted, logged or sent. This reads every specifier however it is written.
const DENIED_LIB = ['analytics', 'remote', 'supabase', 'sync', 'backup', 'billing', 'perf', 'resilience', 'account-deletion', 'export', 'family'];
const DENIED_PKG = /^(@scribe\/(analytics|api)|@supabase\/|@sentry\/|sentry-|posthog|expo-(sharing|network|updates|notifications|file-system|mail-composer|web-browser|tracking-transparency)|react-native-(mmkv|fs)\b)/;
const DENIED_GLOBAL = /\b(console\s*\.|fetch\s*\(|XMLHttpRequest|WebSocket|sendBeacon|Sentry\b|posthog)/;
const stripComments = (t: string) => t.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:'"`\\])\/\/.*$/gm, '$1');

/** Every module specifier in the text: `from "x"`, `import "x"`, `import("x")`, `require("x")`, one line or many. */
export function specifiers(text: string): string[] {
  const t = stripComments(text);
  const out: string[] = [];
  for (const re of [/\bfrom\s*(['"`])([^'"`]+)\1/g, /\bimport\s*(['"`])([^'"`]+)\1/g, /\bimport\s*\(\s*(['"`])([^'"`]+)\1/g, /\brequire\s*\(\s*(['"`])([^'"`]+)\1/g]) {
    for (const m of t.matchAll(re)) out.push(m[2]);
  }
  return out;
}
export function forbiddenIn(text: string, file: string): string[] {
  const bad: string[] = [];
  for (const spec of specifiers(text)) {
    let lib: string | null = null;
    if (spec.startsWith('@/lib/')) lib = spec.slice('@/lib/'.length);
    else if (spec.startsWith('.')) {
      const abs = relative(SRC, join(dirname(file), spec)).split(sep).join('/');
      if (abs.startsWith('lib/')) lib = abs.slice('lib/'.length);
    }
    const top = lib?.split('/')[0].replace(/\.(ts|tsx)$/, '');
    if ((top && DENIED_LIB.includes(top)) || DENIED_PKG.test(spec)) bad.push(`${relative(SRC, file)}: ${spec}`);
  }
  if (DENIED_GLOBAL.test(stripComments(text))) bad.push(`${relative(SRC, file)}: a log or network call`);
  return bad;
}

describe('the grep that guards the screen files catches every way of writing an import', () => {
  const f = join(SRC, 'components/find/x.tsx');
  it.each([
    ["import { a } from '@/lib/analytics';"],
    ['import { a } from "@/lib/analytics";'],
    ["import { a } from '../../lib/remote/fetch';"],
    ["import {\n  a,\n  b,\n} from '@/lib/supabase/client';"],
    ["const a = require('@/lib/sync/outbox');"],
    ['const a = await import("@/lib/analytics");'],
    ["import '@/lib/sync';"],
    ["import { x } from '@supabase/supabase-js';"],
    ["import * as S from '@sentry/react-native';"],
    ["console.log(q);"],
    ["await fetch(url);"],
  ])('flags %s', (src) => {
    expect(forbiddenIn(src, f).length).toBeGreaterThan(0);
  });
  it('lets the allowed imports and a comment that names a banned module through', () => {
    expect(forbiddenIn("import { findLetters } from '@/lib/store';\nimport { x } from '../../lib/find/debounce';\n// never import @/lib/analytics or console.log\n", f)).toEqual([]);
  });
});
