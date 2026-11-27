/// <reference types="node" />
/**
 * BL-2274 (FU-858c): `setPhotosForTest` in src/lib/photos/flag.ts runs only under the test runner, the same guard as
 * `setMediaPhaseForTests` (BL-858). Outside vitest it throws and leaves the photo switch at its build value, so app
 * code can never turn photos on (NS-01-R19). On the old code (no guard) the throw case fails.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { photosBuildEnabled, setPhotosForTest } from '../src/lib/photos/flag';

const SRC = join(__dirname, '..', 'src');

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return sourceFiles(path);
    return /\.(ts|tsx|js|jsx|mjs)$/.test(name) ? [path] : [];
  });
}

describe('setPhotosForTest is for tests only (BL-2274)', () => {
  afterEach(() => setPhotosForTest(null));

  it('[BL-2274] works under vitest: on, then back to the build value', () => {
    const build = photosBuildEnabled();
    setPhotosForTest(!build);
    expect(photosBuildEnabled()).toBe(!build);
    setPhotosForTest(null);
    expect(photosBuildEnabled()).toBe(build);
  });

  it('[BL-2274, NS-01-R19] throws outside the test runner and leaves the switch at its build value after each refused call', () => {
    const build = photosBuildEnabled();
    const saved = process.env.VITEST;
    delete process.env.VITEST;
    try {
      expect(() => setPhotosForTest(!build)).toThrow(/tests only/);
      expect(photosBuildEnabled()).toBe(build);
      expect(() => setPhotosForTest(build)).toThrow(/tests only/);
      expect(() => setPhotosForTest(null)).toThrow(/tests only/);
    } finally {
      process.env.VITEST = saved;
    }
    expect(photosBuildEnabled()).toBe(build);
  });

  it('[BL-2274] no app source calls it: src names it only where it is defined', () => {
    const callers = sourceFiles(SRC)
      .filter((f) => readFileSync(f, 'utf8').includes('setPhotosForTest'))
      .map((f) => f.slice(SRC.length + 1));
    expect(callers).toEqual(['lib/photos/flag.ts']);
  });
});
