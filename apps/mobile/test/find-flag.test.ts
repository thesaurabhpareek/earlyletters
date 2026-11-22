/// <reference types="node" />
/**
 * The Find switch and the remote pause (NS-02-R1, R22, R43 with slice 7). Moved from #798's find-logic.test.ts.
 */
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { describe, expect, it } from 'vitest';
import { findPaused, findSurface, parseBookSearchFlag } from '../src/lib/find/flag';
import { findPausedNow } from '../src/lib/find/pause';

const SRC = join(__dirname, '..', 'src');
const strip = (code: string) => code.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '').replace(/\s\/\/ .*$/gm, '');
const files = (dir: string): string[] =>
  existsSync(dir) ? readdirSync(dir).flatMap((n) => (statSync(join(dir, n)).isDirectory() ? files(join(dir, n)) : /\.tsx?$/.test(n) ? [join(dir, n)] : [])) : [];

describe('[NS-02-R1] the switch defaults to off, and the pause only hides', () => {
  it('[NS-02-R1] the build switch reads EXPO_PUBLIC_BOOK_SEARCH and only the word on turns it on', () => {
    for (const raw of [undefined, null, '', 'off', 'true', '1']) expect(parseBookSearchFlag(raw), String(raw)).toBe(false);
    expect(parseBookSearchFlag(' ON ')).toBe(true);
    expect(readFileSync(join(SRC, 'lib', 'find', 'flag.ts'), 'utf8')).toMatch(/process\.env\.EXPO_PUBLIC_BOOK_SEARCH/);
  });

  it('[NS-02-R1] the action draws only with the switch on, no pause, and a letter to find: absent otherwise, never greyed', () => {
    const on = { build: true, paused: false, hasLetters: true };
    expect(findSurface(on)).toBe(true);
    for (const off of [{ build: false }, { paused: true }, { hasLetters: false }]) expect(findSurface({ ...on, ...off })).toBe(false);
  });

  it('[NS-02-R1] the remote pause can hide Find and can never turn it on', () => {
    for (const c of [undefined, null, { killSwitches: {} }, { killSwitches: { bookSearch: false } }]) expect(findPaused(c)).toBe(false);
    expect(findPaused({ killSwitches: { bookSearch: true } })).toBe(true);
    for (const paused of [true, false]) expect(findSurface({ build: false, paused, hasLetters: true })).toBe(false);
    expect(findPausedNow(() => ({ killSwitches: { bookSearch: true } }))).toBe(true);
    expect(findPausedNow(() => ({ killSwitches: { bookSearch: false } }))).toBe(false);
    expect(findPausedNow(() => null)).toBe(false);
    expect(findPausedNow(() => { throw new Error('not loaded'); })).toBe(false);
  });
});

describe('[NS-02-R22] the remote module', () => {
  it('[NS-02-R22] no Find file names the remote module: the caller hands the pause its config reader', () => {
    const all = [...files(join(SRC, 'lib', 'find')), ...files(join(SRC, 'components', 'find'))];
    expect(all.filter((p) => /remote/.test(strip(readFileSync(p, 'utf8')))).map((p) => relative(SRC, p))).toEqual([]);
  });
});
