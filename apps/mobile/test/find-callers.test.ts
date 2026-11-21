/// <reference types="node" />
/**
 * Find has one door (BL-952 slice 8): the store's findLetters, which checks the build switch and the account. A direct
 * `searchLetters` call from anywhere else in the app would skip both, so only lib/find itself, the store and tests may
 * name it. Also: the Find screen files carry no log, analytics or network import (NS-02-R15, R22).
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
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
    const bad = files(join(SRC, 'components/find')).filter((p) => /from '@\/lib\/(analytics|remote\/fetch|supabase|sync)|console\./.test(readFileSync(p, 'utf8')));
    expect(bad).toEqual([]);
  });
});
