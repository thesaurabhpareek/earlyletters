/// <reference types="node" />
/**
 * Tonight's "From the book" card and the day-zero card (NX-36 S13, BL-790). The pure picker and the card model run
 * here; the screen's use of them is checked in its source (Node cannot load React Native). Fixtures: the fictional
 * family Asha only (CLAUDE.md).
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/components/child/child-store', () => ({ authorOf: (e: { authorSignsAs?: string }, c: { signsAs: string }) => e.authorSignsAs ?? c.signsAs }));

import {
  cappedWords,
  dayZeroCard,
  daysSinceEpoch,
  eligibleForTheBook,
  EXCERPT_MAX_CHARS,
  excerptOf,
  fromTheBookCard,
  LABEL_MAX_CHARS,
  LABEL_MAX_WORDS,
  pickFromTheBook,
  showsDayZero,
  tonightGift,
  type BookLetter,
} from '../src/components/tonight/from-the-book.logic';
import { copy } from '../src/lib/copy';
import { dayDate } from '../src/lib/dates';

const SRC = join(__dirname, '..', 'src');
const read = (rel: string) => readFileSync(join(SRC, rel), 'utf8');

const TODAY = '2026-10-17';
const WORDS = 'She laughed at the dog this morning, the whole way through breakfast, and then looked at me to be sure I had seen it. I had.';
const letter = (id: string, occurredOn: string, over: Partial<BookLetter> = {}): BookLetter => ({
  id,
  kind: 'letter',
  inBook: true,
  occurredOn,
  capturedAt: `${occurredOn}T19:00:00.000Z`,
  finalText: WORDS,
  ...over,
});
const days = (n: number) => {
  // n days before TODAY, as YYYY-MM-DD
  const d = new Date(Date.UTC(2026, 9, 17, 12) - n * 864e5);
  return d.toISOString().slice(0, 10);
};
const BIRTHDAY = '2026-03-14';
const asha = { birthday: BIRTHDAY, signsAs: 'Mama' };

describe('[NX-36-S13] the pick', () => {
  const book = [letter('a', '2026-05-02'), letter('b', '2026-06-11'), letter('c', '2026-07-20'), letter('d', '2026-08-09')];

  it('[NX-36-S13] the From the book pick is stable per day, skips private, mark, month-only and today\'s letters, and shows 0 numerals', () => {
    // Stable: the same letter however often it is asked, on any order of the same book.
    const first = pickFromTheBook(book, TODAY);
    expect(first?.kind).toBe('fromTheBook');
    for (let i = 0; i < 5; i += 1) expect(pickFromTheBook([...book].reverse(), TODAY)?.letter.id).toBe(first?.letter.id);
    // Date-seeded, oldest first, the day count mod n: no score.
    const oldestFirst = ['a', 'b', 'c', 'd'];
    expect(first?.letter.id).toBe(oldestFirst[daysSinceEpoch(TODAY) % 4]);
    // It moves on the next day, by one place, and wraps.
    const ids = [0, 1, 2, 3, 4].map((i) => pickFromTheBook(book, `2026-10-${17 + i}`)?.letter.id);
    expect(new Set(ids.slice(0, 4)).size).toBe(4);
    expect(ids[4]).toBe(ids[0]);
    // Never private, a quiet-day mark, a month-only letter, today's letter, a letter with no words.
    const skipped = [
      letter('p', '2026-05-03', { inBook: false }),
      letter('q', '2026-05-04', { kind: 'not_much', finalText: '' }),
      letter('m', '2026-05-05', { occurredPrecision: 'month' }),
      letter('t', TODAY),
      letter('w', '2026-05-06', { finalText: '  ' }),
    ];
    for (const s of skipped) expect(pickFromTheBook([s], TODAY), s.id).toBeNull();
    for (let i = 0; i < 12; i += 1) {
      const got = pickFromTheBook([...skipped.filter((x) => x.id !== 't'), letter('only', '2026-06-01')], `2026-10-${10 + i}`);
      expect(got?.letter.id).toBe('only');
    }
    // One kept letter, not from today: that letter every day. Written today: nothing.
    expect(pickFromTheBook([letter('one', '2026-10-01')], TODAY)?.letter.id).toBe('one');
    expect(pickFromTheBook([letter('one', TODAY)], TODAY)).toBeNull();
    // Zero numerals about letters or days in the strings the card adds (the age and date are facts, not counts).
    const card = fromTheBookCard(pickFromTheBook(book, TODAY)!, asha);
    expect(card.kicker).toBe('From the book');
    expect(`${card.kicker} ${card.signature}`).not.toMatch(/\d/);
    expect(dayZeroCard('Asha').title + dayZeroCard('Asha').line).not.toMatch(/\d/);
    expect(dayZeroCard('').title + dayZeroCard('').line).not.toMatch(/\d/);
  });

  it('[NX-36-S13] a letter 28 to 35 days old takes priority with the kicker A month ago, the newest of them', () => {
    const near = [letter('old', '2026-05-02'), letter('edge35', days(35)), letter('edge28', days(28)), letter('mid', days(30))];
    const pick = pickFromTheBook(near, TODAY);
    expect(pick?.kind).toBe('monthAgo');
    expect(pick?.letter.id).toBe('edge28');
    expect(fromTheBookCard(pick!, asha).kicker).toBe('A month ago');
    expect(pickFromTheBook([letter('x35', days(35))], TODAY)?.kind).toBe('monthAgo');
    // 27 and 36 days old are in the rotation, with the book's own kicker.
    expect(pickFromTheBook([letter('x27', days(27))], TODAY)?.kind).toBe('fromTheBook');
    expect(pickFromTheBook([letter('x36', days(36))], TODAY)?.kind).toBe('fromTheBook');
    // A private or month-only letter in the window does not take the priority.
    expect(pickFromTheBook([letter('p', days(30), { inBook: false }), letter('o', '2026-05-02')], TODAY)?.letter.id).toBe('o');
    expect(pickFromTheBook([letter('m', days(30), { occurredPrecision: 'month' }), letter('o', '2026-05-02')], TODAY)?.letter.id).toBe('o');
  });

  it('[NX-36-S13] with more than one letter the pick never repeats yesterday\'s', () => {
    const today = pickFromTheBook(book, TODAY)!;
    expect(pickFromTheBook(book, TODAY, today.letter.id)?.letter.id).not.toBe(today.letter.id);
    // One letter: the same letter, since there is nothing else.
    expect(pickFromTheBook([letter('one', '2026-10-01')], TODAY, 'one')?.letter.id).toBe('one');
  });

  it('[NX-36-S13] the day count does not move with the time zone: it is a calendar date', () => {
    expect(daysSinceEpoch('1970-01-02') - daysSinceEpoch('1970-01-01')).toBe(1);
    expect(daysSinceEpoch('2026-11-02') - daysSinceEpoch('2026-10-31')).toBe(2); // clocks go back on 1 November 2026
  });
});

describe('[NX-36-S13] a hard-day letter does not resurface', () => {
  it('[NX-36-S13] a letter started from a hard.* prompt is never picked, month ago or not', () => {
    expect(eligibleForTheBook(letter('h', '2026-10-01', { promptKey: 'hard.tired' }), TODAY)).toBe(false);
    expect(eligibleForTheBook(letter('o', '2026-10-01', { promptKey: 'daily.first_smile' }), TODAY)).toBe(true);
    expect(eligibleForTheBook(letter('n', '2026-10-01', { promptKey: null }), TODAY)).toBe(true);
    expect(pickFromTheBook([letter('h', days(30), { promptKey: 'hard.tired' })], TODAY)).toBeNull();
    expect(pickFromTheBook([letter('h', days(30), { promptKey: 'hard.tired' }), letter('o', '2026-05-02')], TODAY)?.letter.id).toBe('o');
    for (let d = 0; d < 40; d++) {
      const day = days(-d);
      expect(pickFromTheBook([letter('h', '2026-09-01', { promptKey: 'hard.x' }), letter('o', '2026-08-01')], day)?.letter.id).toBe('o');
    }
  });
});

describe('[NX-36-S13] cuts never end mid-sequence', () => {
  const FAMILY = '\u{1F468}\u200D\u{1F469}\u200D\u{1F467}';
  it('[NX-36-S13] a ZWJ family is kept whole or dropped whole, and the label never ends on a ZWJ', () => {
    const text = `${FAMILY}${FAMILY}${FAMILY}`;
    for (let max = 1; max <= 8; max++) {
      const ex = excerptOf(text, max);
      expect(text.startsWith(ex)).toBe(true);
      expect(ex.endsWith('\u200D')).toBe(false);
      const lab = cappedWords(text, 25, max);
      expect(text.startsWith(lab)).toBe(true);
      expect(lab.endsWith('\u200D')).toBe(false);
    }
  });
  it('[NX-36-S13] Devanagari without spaces never ends on a dangling virama', () => {
    const text = '\u0915\u094D\u0937\u0924\u094D\u0930'.repeat(60) + '\u0915\u094D'.repeat(40);
    for (let max = 1; max <= 40; max++) {
      for (const out of [excerptOf(text, max), cappedWords(text, 25, max)]) {
        expect(text.startsWith(out)).toBe(true);
        expect(/[\u094D\u200D]$/.test(out)).toBe(false);
      }
    }
  });
});

describe('[NX-36-S13] cuts never end mid-sequence when Intl.Segmenter is missing', () => {
  // Hermes on some devices has no Intl.Segmenter; the fallback splits a joiner from what follows, so the trim must hold.
  const original = Object.getOwnPropertyDescriptor(Intl, 'Segmenter');
  afterEach(() => {
    if (original) Object.defineProperty(Intl, 'Segmenter', original);
  });
  const withoutSegmenter = () => Object.defineProperty(Intl, 'Segmenter', { value: undefined, configurable: true, writable: true });
  const DANGLING = /[\u200D\u094D]$/;

  it('[NX-36-S13] the stub is in force', () => {
    withoutSegmenter();
    expect((Intl as { Segmenter?: unknown }).Segmenter).toBeUndefined();
  });
  it('[NX-36-S13] a ZWJ family never ends on a ZWJ at any cut length', () => {
    withoutSegmenter();
    const text = '\u{1F468}\u200D\u{1F469}\u200D\u{1F467}'.repeat(3);
    for (let max = 1; max <= 12; max++) {
      for (const out of [excerptOf(text, max), cappedWords(text, 25, max)]) {
        expect(text.startsWith(out)).toBe(true);
        expect(DANGLING.test(out)).toBe(false);
      }
    }
  });
  it('[NX-36-S13] unspaced Devanagari never ends on a virama at any cut length', () => {
    withoutSegmenter();
    const text = '\u0915\u094D\u0937\u0924\u094D\u0930'.repeat(60) + '\u0915\u094D'.repeat(40);
    for (let max = 1; max <= 40; max++) {
      for (const out of [excerptOf(text, max), cappedWords(text, 25, max)]) {
        expect(text.startsWith(out)).toBe(true);
        expect(DANGLING.test(out)).toBe(false);
      }
    }
  });
  it('[NX-36-S13] a long unspaced Devanagari letter is cut at the default length without a dangling virama', () => {
    withoutSegmenter();
    const text = '\u0915\u094D\u0937\u0924\u094D\u0930'.repeat(300);
    const out = excerptOf(text);
    expect(text.startsWith(out)).toBe(true);
    expect(DANGLING.test(out)).toBe(false);
  });
});

describe('[NX-36-S13] the words are the parent\'s own', () => {
  it('[NX-36-S13] the excerpt is a verbatim prefix of the letter and is cut only at a space', () => {
    const long = Array.from({ length: 200 }, (_, i) => `word${i}`).join(' ');
    const ex = excerptOf(long);
    expect(long.startsWith(ex)).toBe(true);
    expect(ex.length).toBeLessThanOrEqual(320);
    expect(long[ex.length]).toBe(' '); // the next character is the space the cut sat on: no word is split
    // A short letter is returned as it is, character for character, line breaks included.
    const poem = 'First line,\nsecond line, "quoted" -- and an apostrophe\'s.\n\nThird.';
    expect(excerptOf(poem)).toBe(poem);
    expect(excerptOf(`  ${poem}  `)).toBe(poem);
    // No added or changed character, in any state, for any cut length.
    for (const max of [7, 20, 41, 99]) {
      const e = excerptOf(WORDS, max);
      expect(WORDS.startsWith(e)).toBe(true);
      expect(e === WORDS || /\s/.test(WORDS[e.length]) || e === '').toBe(true);
    }
    // The card carries it unchanged, and the stored letter is never touched.
    const stored = letter('v', '2026-06-01', { finalText: long });
    const before = JSON.stringify(stored);
    const card = fromTheBookCard({ letter: stored, kind: 'fromTheBook' }, asha);
    expect(long.startsWith(card.excerpt)).toBe(true);
    expect(JSON.stringify(stored)).toBe(before);
  });

  it('[NX-36-S13] the From the book label is capped to whole words', () => {
    const long = Array.from({ length: 90 }, (_, i) => `word${i}`).join(' ');
    const capped = cappedWords(long);
    expect(capped.split(' ')).toHaveLength(LABEL_MAX_WORDS);
    expect(long.startsWith(capped)).toBe(true);
    expect(long[capped.length]).toBe(' ');
    expect(cappedWords('One two  three\nfour.')).toBe('One two three four.');
    const card = fromTheBookCard({ letter: letter('v', '2026-06-01', { finalText: long }), kind: 'fromTheBook' }, asha);
    // kicker, the first words, the date: not the whole letter, and not the hint (it is read once, as the hint).
    expect(card.a11yLabel).toBe(`From the book. ${capped}. A letter from ${dayDate('2026-06-01')}.`);
    expect(card.a11yLabel).not.toContain('Opens');
    expect(card.a11yLabel).not.toContain('word26');
    expect(card.a11yLabel.split(/\s+/).length).toBeLessThan(45);
  });
});

describe('[NX-36-S13] text without spaces is capped by characters', () => {
  const jp = '今日は初めてお散歩に行きました。'.repeat(60); // about 960 characters, no space
  it('the label reads at most LABEL_MAX_CHARS of an unspaced letter, as a verbatim prefix', () => {
    const capped = cappedWords(jp);
    expect(Array.from(capped)).toHaveLength(LABEL_MAX_CHARS);
    expect(jp.startsWith(capped)).toBe(true);
    const card = fromTheBookCard({ letter: letter('j', '2026-06-01', { finalText: jp }), kind: 'fromTheBook' }, asha);
    expect(card.a11yLabel.length).toBeLessThan(LABEL_MAX_CHARS + 80);
    expect(card.a11yLabel).not.toContain(jp.slice(0, 400));
  });
  it('a few long unspaced runs drop whole runs first, then cut', () => {
    const run = '你'.repeat(150);
    expect(cappedWords(`${run} ${run} ${run}`)).toBe(run);
    expect(cappedWords(`${'你'.repeat(300)} tail`)).toBe('你'.repeat(LABEL_MAX_CHARS));
    expect(cappedWords('short words stay whole')).toBe('short words stay whole');
  });
  it('the excerpt is cut at EXCERPT_MAX_CHARS, verbatim, and never splits a surrogate pair', () => {
    const ex = excerptOf(jp);
    expect(Array.from(ex)).toHaveLength(EXCERPT_MAX_CHARS);
    expect(jp.startsWith(ex)).toBe(true);
    const emoji = '\u{1F600}'.repeat(400); // astral characters, two UTF-16 units each
    const e2 = excerptOf(emoji, 10);
    expect(Array.from(e2)).toHaveLength(10);
    expect(emoji.startsWith(e2)).toBe(true);
    expect(excerptOf('Short 日本語.')).toBe('Short 日本語.');
  });
});

describe('[NX-36-S13] the card model', () => {
  it('[NX-36-S13] the footer carries the child\'s age at the letter, the day and the signature', () => {
    const c = fromTheBookCard({ letter: letter('v', '2026-06-20'), kind: 'fromTheBook' }, asha);
    expect(c.dateline).toBe(`Month 3 · ${dayDate('2026-06-20')}`);
    expect(c.signature).toBe('From Mama');
    expect(fromTheBookCard({ letter: letter('w', '2026-06-20', { authorSignsAs: 'Papa' }), kind: 'fromTheBook' }, asha).signature).toBe('From Papa');
    expect(fromTheBookCard({ letter: letter('b', '2026-01-02'), kind: 'fromTheBook' }, asha).dateline.startsWith('Before You')).toBe(true);
    expect(fromTheBookCard({ letter: letter('n', '2026-03-20'), kind: 'fromTheBook' }, asha).dateline.startsWith('The first weeks')).toBe(true);
  });

  it('[NX-36-S13] a nameless child: no name in the card, no empty or "undefined" string anywhere', () => {
    const nameless = { birthday: BIRTHDAY, signsAs: 'Mama' };
    const c = fromTheBookCard({ letter: letter('v', '2026-06-20'), kind: 'fromTheBook' }, nameless);
    for (const v of Object.values(c)) expect(String(v)).not.toMatch(/undefined|null|^\s*$/);
    const z = dayZeroCard('');
    expect(z.title).toBe("Your child's book");
    expect(z.a11yLabel).toBe("Your child's book. Ready for its first letter.");
    expect(dayZeroCard('   ').title).toBe("Your child's book");
  });
});

describe('[NX-36-S13] day zero', () => {
  it('[NX-36-S13] the empty-book card reads as spec and shows only while no letter exists', () => {
    const z = dayZeroCard('Asha');
    expect(z).toEqual({ title: "Asha's book", line: 'Ready for its first letter.', a11yLabel: "Asha's book. Ready for its first letter." });
    expect(showsDayZero([])).toBe(true);
    expect(showsDayZero([{ kind: 'not_much' }])).toBe(true); // a quiet day is not a letter
    expect(showsDayZero([{ kind: 'letter' }])).toBe(false);
    expect(showsDayZero([{ kind: 'not_much' }, { kind: 'letter' }])).toBe(false);
  });
});

describe('[NX-36-S13] the screen (source)', () => {
  const screen = read('app/(tabs)/index.tsx');
  const card = read('components/tonight/resurfaced-card.tsx');
  const zero = read('components/tonight/day-zero-card.tsx');

  it('[NX-36-S13] the slot follows the waiting letters, enters on the existing stagger, and opens the letter or the Book', () => {
    expect(screen.indexOf('{/* After the waiting letters')).toBeGreaterThan(screen.indexOf('rows.map('));
    expect(screen).toContain('entering={enter(3 + rows.length)}');
    expect(screen).toContain("pathname: '/letter/[id]', params: { id: gift.card.id }");
    expect(screen).toContain("router.push('/book')");
    expect(screen).toContain('tonightGift({ entries: room?.entries ?? [], today, draftsWaiting: cards.length');
  });

  it('[NX-36-S13] no new motion, no analytics event, no audio, no count, no new dependency', () => {
    for (const [name, src] of [['logic', read('components/tonight/from-the-book.logic.ts')], ['card', card], ['zero', zero]] as const) {
      expect(src, name).not.toMatch(/track[A-Z]\w*\(|analytics|reanimated|tokens\.motion|Audio|Sound|useAudio/);
    }
    expect(screen).not.toMatch(/track\w*\(.*(fromTheBook|resurface)/);
    expect(zero).toContain('animate={false}');
  });

  it('[NX-36-S13] the card is one element with a capped label and an Opens-the-letter hint', () => {
    expect(card).toContain('accessibilityLabel={card.a11yLabel}');
    expect(card).toContain('accessibilityHint={copy.reader.openHint}');
    expect(zero).toContain('accessibilityLabel={card.a11yLabel}');
    expect(zero).toContain('copy.tonight.fromTheBook.emptyA11yHint');
    // The hint is spoken once: it is the prop, never inside the label.
    expect(copy.tonight.resurfaced.a11y).not.toMatch(/Opens/);
    expect(dayZeroCard('Asha').a11yLabel).not.toContain(copy.tonight.fromTheBook.emptyA11yHint);
  });
});

describe('[NX-36-S13][F09-REQ-003] a waiting draft no longer hides the card from the book', () => {
  const family = { childName: 'Asha', childBirthday: BIRTHDAY, signsAs: 'Mama' };
  const monthOld = letter('m', days(30));

  it('[NX-36-S13] with a draft waiting, a letter 28 to 35 days old still shows as A month ago, below the draft with a tighter gap', () => {
    const waiting = tonightGift({ entries: [monthOld], today: TODAY, draftsWaiting: 2, family });
    expect(waiting?.kind).toBe('fromTheBook');
    if (waiting?.kind !== 'fromTheBook') throw new Error('expected the From the book card');
    expect(waiting.card.id).toBe('m');
    expect(waiting.card.kicker).toBe(copy.tonight.resurfaced.kicker);
    expect(waiting.afterDrafts).toBe(true);
    const none = tonightGift({ entries: [monthOld], today: TODAY, draftsWaiting: 0, family });
    expect(none?.kind === 'fromTheBook' && none.afterDrafts).toBe(false);
    // The same letter and words with or without a draft: a waiting draft changes only where the card sits.
    expect(none?.kind === 'fromTheBook' && none.card).toEqual(waiting.card);
  });

  it('[NX-36-S13] with a draft waiting, a letter outside the window shows as From the book, not nothing', () => {
    const g = tonightGift({ entries: [letter('old', days(90))], today: TODAY, draftsWaiting: 1, family });
    expect(g?.kind === 'fromTheBook' && g.card.kicker).toBe(copy.tonight.fromTheBook.kicker);
  });

  it('[F09-REQ-003] a month-only letter is never the card, with or without a draft waiting; a day letter in the window takes the slot', () => {
    const monthOnly = { ...letter('mo', days(30)), occurredPrecision: 'month' as const };
    for (const draftsWaiting of [0, 1]) {
      expect(tonightGift({ entries: [monthOnly], today: TODAY, draftsWaiting, family })).toBeNull();
      const g = tonightGift({ entries: [monthOnly, letter('d', days(29))], today: TODAY, draftsWaiting, family });
      expect(g?.kind === 'fromTheBook' && g.card.id).toBe('d');
    }
  });

  it('[NX-36-S13] never a private letter or a quiet-day mark; the empty-book card shows while no letter exists, with a draft waiting too', () => {
    const quiet = letter('q', days(30), { kind: 'not_much', finalText: '' });
    const priv = letter('p', days(30), { inBook: false });
    for (const draftsWaiting of [0, 1]) {
      expect(tonightGift({ entries: [], today: TODAY, draftsWaiting, family })?.kind).toBe('dayZero');
      expect(tonightGift({ entries: [quiet], today: TODAY, draftsWaiting, family })?.kind).toBe('dayZero'); // a mark is not a letter
      expect(tonightGift({ entries: [priv], today: TODAY, draftsWaiting, family })).toBeNull(); // a letter exists, none may be shown
    }
  });

  it('[NX-36-S13] nothing without a book', () => {
    expect(tonightGift({ entries: [monthOld], today: TODAY, draftsWaiting: 0, family: null })).toBeNull();
  });

  it('[NX-36-S13] the old resurfaced() is gone: Tonight has one rule, tonightGift', () => {
    expect(read('components/tonight/draft-card.logic.ts')).not.toMatch(/export function resurfaced|ResurfacedCard =/);
  });
});
