/**
 * BL-1788: the two lines under the Keep buttons in Review and the folded count row (spec 14 sections 4 and 5).
 * Words only. Wiring is BL-1984. Limits pinned here: no printed book (D-010), no "every" claim (D-169 item 2, QD-06),
 * no promise about who else can read, no "we", and the lines do not repeat listen.audience.
 */
import { describe, expect, it } from 'vitest';
import { en } from '../src';

const lines = {
  add: en.review.destination.addLine,
  priv: en.review.destination.privateLine,
};
const count = {
  many: en.review.changesMarked,
  one: en.review.changesMarkedOne,
};
const hints = [en.review.foldOpenHint, en.review.foldCloseHint];
const all = [...Object.values(lines), ...Object.values(count), ...hints];

describe('[BL-1788] the Keep lines say what each button does to the letter', () => {
  it('[QD-08] has one plain sentence per button', () => {
    for (const t of Object.values(lines)) {
      expect(t.length).toBeGreaterThan(0);
      expect(t.match(/[.!?]/g)?.length).toBe(1);
    }
  });

  it('never mentions a printed book, other readers, sharing, safety words or "we"', () => {
    const banned = /\b(print\w*|paper|share\w*|family|co-parent|anyone|everyone|nobody|only you|safe\w*|secure\w*|we|our|us)\b/i;
    expect(all.filter((t) => banned.test(t))).toEqual([]);
  });

  it('uses only glossary words for the book and Read together, and does not repeat listen.audience', () => {
    expect(lines.add).toContain('Read together');
    expect(lines.priv).toContain('Read together');
    expect(lines.priv).toContain('Private');
    for (const t of Object.values(lines)) expect(t).not.toBe(en.listen.audience);
    expect(all.filter((t) => /\b(journal|diary|entry|draft|take|transcript)\b/i.test(t))).toEqual([]);
  });

  it('[QD-06] the count row makes no wide claim and keeps the count', () => {
    for (const t of Object.values(count)) {
      expect(/\b(every|all|exactly|nothing else|unchanged)\b/i.test(t), t).toBe(false);
      expect(t).toContain('marked in your words');
    }
    expect(count.many).toContain('{count}');
    expect(count.one.startsWith('1 small fix,')).toBe(true);
  });
});
