/// <reference types="node" />
/**
 * [BL-378] First run's last button makes each book once. A second tap (or call) before the route changes does nothing:
 * twins make two books, not four. The guard is pure (runFinishOnce); the screen's wiring is pinned from source because
 * the screen cannot run in node. Fictional family Asha only.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { runFinishOnce } from '../src/lib/first-run/handoff.logic';

const onboarding = readFileSync(join(__dirname, '..', 'src', 'app', 'onboarding.tsx'), 'utf8').replace(/\/\*[\s\S]*?\*\/|(^|[^:])\/\/.*$/gm, '$1');

/** Mirrors the screen's finish: blocked calls make nothing; otherwise one book per name, then the latch is set. */
const screen = (names: string[], opts: { blocked?: boolean; failOnce?: boolean } = {}) => {
  const latch = { current: false };
  const books: string[] = [];
  let failed = false;
  const finish = () => {
    if (opts.blocked) return;
    if (opts.failOnce && !failed) {
      failed = true;
      throw new Error('store');
    }
    for (const n of names) books.push(n);
    latch.current = true;
  };
  return { books, tap: () => runFinishOnce(latch, finish) };
};

describe('[BL-378] finish makes one book per name', () => {
  it('a double call makes one book for one name', () => {
    const s = screen(['Asha']);
    s.tap();
    s.tap();
    expect(s.books).toEqual(['Asha']);
  });

  it('twins: two books, not four, however many taps', () => {
    const s = screen(['Asha', 'Mira']);
    s.tap();
    s.tap();
    s.tap();
    expect(s.books).toEqual(['Asha', 'Mira']);
  });

  it('a blocked call makes nothing and does not latch: the next call can still make the book', () => {
    const blocked = screen(['Asha'], { blocked: true });
    blocked.tap();
    blocked.tap();
    expect(blocked.books).toEqual([]);
    const retry = screen(['Asha'], { failOnce: true });
    expect(() => retry.tap()).toThrow();
    retry.tap();
    retry.tap();
    expect(retry.books).toEqual(['Asha']);
  });

  it('the screen sets the latch after the books are made and sends the button through the guard', () => {
    expect(onboarding).toMatch(/const created = firstRunBookNames\(names\)\.map\([\s\S]*?\);\s*booksMade\.current = true;/);
    expect(onboarding).toMatch(/const finishOnce = \(\) => runFinishOnce\(booksMade, finish\);/);
    expect(onboarding).toMatch(/onPress=\{step === 'finish' \? finishOnce : next\}/);
    expect(onboarding).not.toMatch(/onPress=\{step === 'finish' \? finish :/);
  });
});
