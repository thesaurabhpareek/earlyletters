/**
 * [BL-1658] Twins: if the second addChild throws, a retry keeps the first book and makes only the second. Runs the real
 * helper (resumeBooks) that first run's finish uses, behind the real latch (runFinishOnce). Fictional family Asha only.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { resumeBooks, runFinishOnce, sameBookInput } from '../src/lib/first-run/handoff.logic';

type Arg = { name: string; birthday?: string | null; dueDate?: string | null; signsAs?: string };
type Book = { id: number; name: string };
const same = sameBookInput;

const setup = (names: string[], failOn: string[] = []) => {
  const made: { arg: Arg; book: Book }[] = [];
  const store: Book[] = [];
  const failures = [...failOn];
  const make = (a: Arg) => {
    const f = failures.indexOf(a.name);
    if (f >= 0) {
      failures.splice(f, 1);
      throw new Error('store');
    }
    const b = { id: store.length + 1, name: a.name };
    store.push(b);
    return b;
  };
  const latch = { current: false };
  // What finish does: the same wrapper for every try, one call per name in order, then the latch.
  const add = resumeBooks(made, make, same, () => names.length);
  const finish = () => {
    names.map((n) => add({ name: n }));
    latch.current = true;
  };
  return { store, made, tap: () => runFinishOnce(latch, finish) };
};

describe('[BL-1658] a retry after a failed second book keeps the first', () => {
  it('twins: second fails, retry makes one Asha and one Asha B, and more taps add nothing', () => {
    const s = setup(['Asha', 'Asha B'], ['Asha B']);
    expect(() => s.tap()).toThrow('store');
    expect(s.store.map((b) => b.name)).toEqual(['Asha']);
    s.tap();
    s.tap();
    expect(s.store.map((b) => b.name)).toEqual(['Asha', 'Asha B']);
  });

  it('the second fails twice in a row: still one Asha at the end', () => {
    const s = setup(['Asha', 'Asha B'], ['Asha B', 'Asha B']);
    expect(() => s.tap()).toThrow();
    expect(() => s.tap()).toThrow();
    s.tap();
    expect(s.store.map((b) => b.name)).toEqual(['Asha', 'Asha B']);
  });

  it('three children: the third fails, retry keeps the first two', () => {
    const s = setup(['Asha', 'Asha B', 'Asha C'], ['Asha C']);
    expect(() => s.tap()).toThrow();
    s.tap();
    expect(s.store.map((b) => b.name)).toEqual(['Asha', 'Asha B', 'Asha C']);
  });

  it('the same name twice is two books', () => {
    const s = setup(['Asha', 'Asha'], []);
    s.tap();
    expect(s.store).toHaveLength(2);
  });

  it('a run that finished but did not latch starts the list again without remaking (a throw after the books)', () => {
    const made: { arg: Arg; book: Book }[] = [];
    let n = 0;
    const add = resumeBooks(made, (a: Arg) => ({ id: ++n, name: a.name }), same, () => 2);
    add({ name: 'Asha' });
    add({ name: 'Asha B' });
    add({ name: 'Asha' });
    add({ name: 'Asha B' });
    expect(n).toBe(2);
  });

  it('names edited between tries: the book at that place is not reused', () => {
    const s = setup(['Asha', 'Asha B'], ['Asha B']);
    expect(() => s.tap()).toThrow();
    const add = resumeBooks(s.made, (a: Arg) => ({ id: 9, name: a.name }), same, () => 2);
    expect(add({ name: 'Asha C' }).id).toBe(9);
    expect(s.made).toHaveLength(1);
  });

  it('the screen makes its books through the helper, with a memory that outlives renders', () => {
    const src = readFileSync(join(__dirname, '..', 'src', 'app', 'onboarding.tsx'), 'utf8');
    expect(src).toMatch(/const madeBooks = useRef</);
    expect(src).toMatch(/const addChild = resumeBooks\(madeBooks\.current, addChildToStore,/);
  });

  // The real comparison the screen uses (sameBookInput) must look at every field finish passes to addChild.
  const screenSame = sameBookInput;
  it('the screen passes that same function to the helper', () => {
    const src = readFileSync(join(__dirname, '..', 'src', 'app', 'onboarding.tsx'), 'utf8');
    expect(src).toMatch(/const addChild = resumeBooks\(madeBooks\.current, addChildToStore, sameBookInput,/);
  });
  const base: Arg = { name: 'Asha', birthday: '2026-03-01', dueDate: null, signsAs: 'Mama' };
  for (const [field, changed] of [['name', { name: 'Asha B' }], ['birthday', { birthday: '2026-03-02' }], ['dueDate', { dueDate: '2026-09-01' }], ['signsAs', { signsAs: 'Papa' }]] as const) {
    it(`a changed ${field} between tries is not the same book: it is made again`, () => {
      expect(screenSame(base, base)).toBe(true);
      expect(screenSame(base, { ...base, ...changed })).toBe(false);
      const made: { arg: Arg; book: Book }[] = [];
      let n = 0;
      let boom = true;
      const make = (a: Arg) => {
        if (a.name === 'Asha B' && boom) {
          boom = false;
          throw new Error('store');
        }
        return { id: ++n, name: a.name };
      };
      const add = resumeBooks(made, make, screenSame, () => 2);
      add(base);
      expect(() => add({ ...base, name: 'Asha B' })).toThrow();
      // Back, edit one field of the first book, retry: the first is made again with the new value.
      add({ ...base, ...changed });
      expect(n).toBe(2);
    });
  }
});
