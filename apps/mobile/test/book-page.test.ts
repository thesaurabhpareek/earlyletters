/// <reference types="node" />
/**
 * The Book page redesign (proposals/book-page.md; BL-659 option b, BL-660, BL-675, BL-676): the excerpt that ends on
 * a whole word, the voice marker, the cover band's age, chapter headings in words, the Months sheet, the compact
 * month in the inline bar, and the screen's wiring of them. Fictional family "Asha" only: Mama and Papa.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it, vi } from 'vitest';

// child-store reads the native store; the signature rule it provides is the only part used here.
vi.mock('@/components/child/child-store', () => ({ authorOf: (e: { authorSignsAs?: string }, c: { signsAs: string }) => e.authorSignsAs ?? c.signsAs }));

import { en } from '@scribe/content';
import { tokens } from '@scribe/design-tokens';
import {
  BOOK_EXCERPT_LINES,
  LIT_BAND_STRENGTH,
  bookExcerptLines,
  cardFooterStacks,
  compactMonth,
  coverAge,
  JUMP_MAX_TRIES,
  jumpTarget,
  monthRows,
  MONTHS_BUTTON_MIN_ROWS,
  runJump,
  type JumpSteps,
  showsMonthsButton,
  topChapterKey,
  voiceMarker,
} from '../src/components/book/book-page.logic';
import { bookChapters, chapterHeading, openerOf } from '../src/components/book/chapters';
import { bookCopy } from '../src/components/book/copy';
import { cardLabel } from '../src/components/book/letter-card.logic';
import { EXCERPT_ENDING, endsOnWholeWord, FADE_FRACTION, fadeSpanFor, lastWordTail, visiblePrefix, wordFadeSpan, type TextLine } from '../src/components/motion/excerpt-fade.logic';
import { FONT_SCALE } from '../src/lib/a11y.logic';
import type { Child, Entry } from '../src/lib/store';

const src = (f: string) => readFileSync(join(__dirname, '../src', f), 'utf8');
const code = (s: string) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');

// Born 12 May 2025: on 1 November 2026 Asha is 17 months, and month 17 runs October 12 to November 11.
const ASHA: Child = { id: 'child-asha', name: 'Asha', birthday: '2025-05-12', dueDate: null, signsAs: 'Mama', remindersOn: true, familyCanRead: false };
const EXPECTING: Child = { ...ASHA, id: 'child-expecting', birthday: null, dueDate: '2027-01-20' };
const base = { captureMode: 'typed', editLevel: 'verbatim', promptKey: null, engineVersion: 3, machineEdits: [], soundsLikeMe: null, childId: ASHA.id } as const;
const letter = (id: string, occurredOn: string, extra: Partial<Entry> = {}): Entry =>
  ({ ...base, id, kind: 'letter', occurredOn, capturedAt: `${occurredOn}T19:00:00.000Z`, rawTranscript: 'You laughed.', finalText: 'You laughed.', inBook: true, ...extra }) as Entry;
const quiet = (id: string, occurredOn: string): Entry => ({ ...letter(id, occurredOn), kind: 'not_much', finalText: '', rawTranscript: '' }) as Entry;

/**
 * A stand-in for the platform's line breaker: greedy, at word boundaries, a word longer than the line broken by
 * characters, each line keeping the space that ends it (as iOS reports it). Width in characters of a fixed size.
 */
function wrap(text: string, perLine: number, charW = 10): TextLine[] {
  const lines: TextLine[] = [];
  let line = '';
  const push = (t: string) => lines.push({ text: t, x: 0, width: t.replace(/\s+$/u, '').length * charW });
  for (const token of text.match(/\S+\s*/gu) ?? []) {
    let rest = token;
    while (rest.replace(/\s+$/u, '').length > perLine) {
      if (line) {
        push(line);
        line = '';
      }
      push(rest.slice(0, perLine));
      rest = rest.slice(perLine);
    }
    if ((line + rest).replace(/\s+$/u, '').length > perLine) {
      push(line);
      line = rest;
    } else line += rest;
  }
  if (line) push(line);
  return lines;
}

const SENTENCES = [
  'You found the spoon today and would not let it go, even in the bath, laughing at the bubbles the whole time.',
  'Asha, you said dog for the first time this morning, pointing at the neighbour and then at the cat as well.',
  'We walked to the park and back again because you wanted to see the ducks one more time before bed.',
  'Supercalifragilisticexpialidociousness is a long word Papa sang to you while you giggled.',
  'You slept.',
];

describe('BL-659: the excerpt ends on a whole word (option b, one seam)', () => {
  it('the seam is set to the word ending; the line ending stays as the fallback', () => {
    expect(EXCERPT_ENDING).toBe('word');
    expect(FADE_FRACTION).toBe(0.4);
  });

  it('the tail is the last whole word of the line, with the space after it', () => {
    expect(lastWordTail('would not let it go, even in the ')).toBe('the ');
    expect(lastWordTail('bath, laughing at')).toBe('at');
    expect(lastWordTail('   ')).toBeNull();
    expect(lastWordTail('')).toBeNull();
  });

  for (const perLine of [34, 22, 12]) {
    it(`over every Asha sentence at ${perLine} characters a line, the lines shown are a prefix that stops on a whole word`, () => {
      for (const text of SENTENCES) {
        const lines = wrap(text, perLine);
        for (const n of [BOOK_EXCERPT_LINES.standard, BOOK_EXCERPT_LINES.accessibility]) {
          const shown = visiblePrefix(lines, n);
          expect(text.startsWith(shown), text).toBe(true);
          const longWord = /\S{13,}/u.test(text) && perLine === 12;
          if (!longWord) expect(endsOnWholeWord(text, shown), `${text} at ${n} lines`).toBe(true);
        }
      }
    });
  }

  it('one word longer than a line is the only case that cannot end on a whole word, and it is still a prefix', () => {
    const text = SENTENCES[3]!;
    const lines = wrap(text, 12);
    expect(endsOnWholeWord(text, visiblePrefix(lines, 2))).toBe(false);
    expect(text.startsWith(visiblePrefix(lines, 2))).toBe(true);
    // A text that is not the start of the letter is never called whole.
    expect(endsOnWholeWord(text, 'califragilistic')).toBe(false);
  });

  it('the fade covers only the last word, ending where the line ends (left for right to left), never wider than the line', () => {
    const line = { x: 0, width: 300 };
    expect(wordFadeSpan(line, 40, false)).toEqual({ left: 260, width: 40 });
    expect(wordFadeSpan({ x: 30, width: 300 }, 40, true)).toEqual({ left: 30, width: 40 });
    expect(wordFadeSpan(line, 500, false)).toEqual({ left: 0, width: 300 });
  });

  it('before the lines and the word are measured (first frame, the web build) it is the build 1 fade over 40 percent', () => {
    const lines = wrap(SENTENCES[0]!, 34);
    const common = { visible: 3, boxWidth: 330, rtl: false };
    expect(fadeSpanFor({ ...common, ending: 'word', lines: null, tailWidth: null })).toEqual({ left: 330 - 132, width: 132 });
    expect(fadeSpanFor({ ...common, ending: 'word', lines, tailWidth: null }).width).toBeCloseTo(132);
    expect(fadeSpanFor({ ...common, ending: 'line', lines, tailWidth: 30 }).width).toBeCloseTo(132);
    const third = lines[2]!;
    expect(fadeSpanFor({ ...common, ending: 'word', lines, tailWidth: 30 })).toEqual({ left: third.x + third.width - 30, width: 30 });
    // Right to left: the 40 percent sits on the left.
    expect(fadeSpanFor({ ...common, rtl: true, ending: 'word', lines: null, tailWidth: null }).left).toBe(0);
  });

  it('three lines, two at accessibility sizes (AX1 to AX5)', () => {
    expect(bookExcerptLines(1)).toBe(3);
    expect(bookExcerptLines(FONT_SCALE.xxxLarge)).toBe(3);
    expect(bookExcerptLines(FONT_SCALE.ax1)).toBe(2);
    expect(bookExcerptLines(FONT_SCALE.ax5)).toBe(2);
    expect(cardFooterStacks(1)).toBe(false);
    expect(cardFooterStacks(FONT_SCALE.ax5)).toBe(true);
  });

  it('ExcerptFade reads the platform lines and measures the last word unseen; the carry draws the same span (source)', () => {
    const fade = code(src('components/motion/excerpt-fade.tsx'));
    expect(fade).toMatch(/onTextLayout=\{onTextLayout\}/);
    expect(fade).toMatch(/lastWordTail\(lastLine\.text\)/);
    expect(fade).toMatch(/accessibilityElementsHidden importantForAccessibility="no-hide-descendants" aria-hidden style=\{\{ position: 'absolute', left: 0, top: 0, opacity: 0 \}\}/);
    expect(fade).not.toMatch(/numberOfLines=|ellipsizeMode=/);
    const carry = code(src('components/motion/card-transition.tsx'));
    expect(carry).toMatch(/fade: slot\?\.fade\.current \?\? undefined/);
    expect(carry).toMatch(/fadeEdgeBox\(lineHeight, rtl, fadeSpan\)/);
    expect(carry).toMatch(/<ExcerptFadeSpanContext\.Provider value=\{onFade\}>/);
  });
});

describe('BL-660: the letter card (signature, voice marker, every word to VoiceOver)', () => {
  it('"Voice 1:06" to the eye, "Voice recording, 1 minute 6 seconds" to VoiceOver; nothing without a length', () => {
    expect(voiceMarker(66_000)).toEqual({ text: 'Voice 1:06', a11y: 'Voice recording, 1 minute 6 seconds' });
    expect(voiceMarker(45_400)).toEqual({ text: 'Voice 0:45', a11y: 'Voice recording, 45 seconds' });
    expect(voiceMarker(0)).toBeNull();
    expect(voiceMarker(null)).toBeNull();
  });

  it('the card is one element: who and when, the recording in words, then every word of the letter (D-027)', () => {
    const words = 'You found the spoon today and would not let it go, even in the bath, laughing at the bubbles the whole time.';
    const label = cardLabel({ signature: 'From Papa', dateline: 'Sunday, November 1, 2026, 17 months', voice: voiceMarker(66_000)!.a11y, text: words, inBook: true, privateLabel: 'Private', spoken: true, own: false, recordingOnPhone: en.book.recordingOnPhone });
    expect(label).toBe(`From Papa. Sunday, November 1, 2026, 17 months. Voice recording, 1 minute 6 seconds. ${words}`);
  });

  it('the card shows the signature italic and a waveform glyph with the word, never a play button (source)', () => {
    const card = code(src('components/book/letter-card.tsx'));
    expect(card).toMatch(/<Text variant="signature">\{signature\}<\/Text>/);
    expect(card).toMatch(/<WaveformIcon size=\{14\} color=\{c\.textMuted\}/);
    expect(card).not.toMatch(/PlayIcon|MicrophoneIcon/);
    expect(card).toMatch(/voice: voice\?\.a11y \?\? null,/);
    expect(card).toMatch(/stacked \? 'items-start gap-1 pt-0\.5'/);
  });
});

describe('BL-675: the cover band and chapter headings in words', () => {
  it('the age is months only in plain words, weeks in the first month, and "Before You" while expecting', () => {
    expect(coverAge(ASHA, '2026-11-01')).toBe('17 months');
    expect(coverAge(ASHA, '2026-11-20')).toBe('18 months');
    expect(coverAge(ASHA, '2025-06-20')).toBe('1 month');
    expect(coverAge(ASHA, '2025-06-03')).toBe('3 weeks');
    expect(coverAge(EXPECTING, '2026-11-01')).toBe(en.book.beforeYouChapter);
    expect(coverAge(ASHA, '2025-05-01')).toBe(en.book.beforeYouChapter);
    for (const d of ['2026-11-01', '2026-11-30', '2025-07-25']) expect(coverAge(ASHA, d)).not.toMatch(/ and /);
  });

  it('a heading is the month in words: "1 month", "17 months"; the first weeks and Before You by name', () => {
    expect(chapterHeading(1)).toBe('1 month');
    expect(chapterHeading(17)).toBe('17 months');
    expect(chapterHeading(0)).toBe(en.book.chapterNewborn);
    expect(chapterHeading(null)).toBe(en.book.beforeYouChapter);
    const [ch] = bookChapters([letter('l1', '2026-11-01')], ASHA, '2026-11-01', 'en-US');
    expect(openerOf(ch!).a11yLabel).toBe('This month, 17 months, October 12 to November 11');
  });

  it('textMuted keeps 4.5:1 on the lit band, over the lamp at its peak, in light and dark, and on surfaceRaised', () => {
    const rgb = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
    const mix = (fg: number[], bg: number[], a: number) => fg.map((v, i) => v * a + bg[i]! * (1 - a));
    const lum = (c: number[]) => {
      const [r, g, b] = c.map((v) => {
        const s = v / 255;
        return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
      });
      return 0.2126 * r! + 0.7152 * g! + 0.0722 * b!;
    };
    const ratio = (a: number[], b: number[]) => {
      const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x);
      return (hi! + 0.05) / (lo! + 0.05);
    };
    const gold = rgb(tokens.atmosphere.tone.gold);
    for (const mode of ['light', 'dark'] as const) {
      for (const hc of [false, true]) {
        const c = { ...tokens[mode], ...(hc ? tokens.highContrast[mode] : {}) };
        const peak = tokens.atmosphere.peak[mode].gold;
        // The lamp's pool at its peak under the band, then the band's own light over it.
        const lit = mix(gold, mix(gold, rgb(c.bg), peak), peak * LIT_BAND_STRENGTH);
        expect(ratio(rgb(c.textMuted), lit), `${mode}${hc ? ' high contrast' : ''}: textMuted on the lit band`).toBeGreaterThanOrEqual(4.5);
        expect(ratio(rgb(c.textMuted), rgb(c.surfaceRaised)), `${mode}: textMuted on surfaceRaised`).toBeGreaterThanOrEqual(4.5);
      }
    }
  });

  it('VoiceOver meets title, age, switcher, Read together, Months, Settings in that order; the gear has no row of its own (source)', () => {
    const band = code(src('components/book/cover-band.tsx'));
    const laid = band.slice(band.indexOf(') : ('), band.indexOf('function LitGlow'));
    const at = (s: string) => laid.indexOf(s);
    expect(at('{titleText}')).toBeGreaterThan(-1);
    expect(at('{titleText}')).toBeLessThan(at('{ageText}'));
    expect(at('{ageText}')).toBeLessThan(at('{switcher}'));
    expect(at('{switcher}')).toBeLessThan(at('{read}'));
    expect(at('{read}')).toBeLessThan(at('{trailing}'));
    const trailing = band.slice(band.indexOf('const trailing'), band.indexOf('return ('));
    expect(trailing.indexOf('months.label')).toBeLessThan(trailing.indexOf('GearSixIcon'));
    expect(band).toMatch(/<Text variant="display" asHeading=\{1\}/);
    expect(band).toMatch(/size="md"\s+fullWidth\s+icon=\{BookOpenTextIcon\}/);
    // The light: plain under Increase Contrast and Reduce Transparency.
    expect(band).toMatch(/const plain = highContrast \|\| reduceTransparency;/);
    expect(band).toMatch(/\{plain \? null : <LitGlow/);
  });

  it('the month heading is a level-2 header and the lit month card is gone (source)', () => {
    const opener = code(src('components/book/month-opener.tsx'));
    expect(opener).toMatch(/accessibilityRole="header"\s+aria-level=\{2\}/);
    expect(opener).not.toMatch(/LitGlow|borderColor|variant="numeral"/);
  });
});

describe('BL-676: the Months sheet and the compact month', () => {
  // Three months with letters, one month with only a quiet day, and the current month before its first letter.
  const entries = [
    letter('a3', '2026-10-01', { authorSignsAs: 'Mama' }),
    letter('a2', '2026-09-30', { authorSignsAs: 'Papa' }),
    letter('a1', '2026-09-20', { authorSignsAs: 'Mama' }),
    quiet('q1', '2026-08-20'),
    letter('b1', '2026-07-29', { authorSignsAs: 'Papa' }),
    letter('c1', '2026-06-01'),
  ];
  const chapters = bookChapters(entries, ASHA, '2026-11-01', 'en-US');

  it('lists only months that have letters, newest first, with what exists in each', () => {
    const rows = monthRows(chapters);
    expect(rows.map((r) => r.label)).toEqual(['16 months', '14 months', '12 months']);
    expect(rows[0]).toMatchObject({ line: '3 letters, from Mama and Papa', a11yLabel: '16 months. 3 letters, from Mama and Papa' });
    expect(rows[1]!.line).toBe('1 letter, from Papa');
    // Each row knows where its chapter is in the list: the current month (empty) is first, the quiet month is skipped.
    expect(chapters[0]!.current).toBe(true);
    expect(rows.map((r) => chapters[r.sectionIndex]!.key)).toEqual(rows.map((r) => r.key));
    for (const r of rows) expect(r.line).not.toMatch(/·|0 letters|missing|no letters/i);
  });

  it('the Months button shows once there is more than one month to go to', () => {
    expect(MONTHS_BUTTON_MIN_ROWS).toBe(2);
    expect(showsMonthsButton(monthRows(chapters))).toBe(true);
    expect(showsMonthsButton(monthRows(bookChapters([letter('l1', '2026-10-20')], ASHA, '2026-11-01')))).toBe(false);
  });

  it('the compact month is the chapter at the top of the list, in the same words as its heading', () => {
    expect(topChapterKey([{ section: null }, { section: { key: 'm14' } }, { section: { key: 'm12' } }])).toBe('m14');
    expect(topChapterKey([])).toBeNull();
    expect(compactMonth(chapters, 'm14')).toEqual({ heading: '14 months', range: 'July 12 to August 11', a11yLabel: '14 months, July 12 to August 11' });
    expect(compactMonth(chapters, 'nowhere')).toBeNull();
  });

  it('1,200 letters over 18 months (F09-U02 fixture): chapters and rows stay well inside a frame budget', () => {
    const many: Entry[] = [];
    for (let i = 0; i < 1200; i++) {
      const d = new Date(Date.UTC(2026, 10, 1) - Math.floor(i * 0.45) * 864e5).toISOString().slice(0, 10);
      many.push(letter(`p${i}`, d, { authorSignsAs: i % 3 ? 'Mama' : 'Papa' }));
    }
    const t0 = performance.now();
    const chs = bookChapters(many, ASHA, '2026-11-01', 'en-US');
    const rows = monthRows(chs);
    const ms = performance.now() - t0;
    expect(rows.length).toBeGreaterThanOrEqual(17);
    expect(rows.reduce((n, r) => n + chs[r.sectionIndex]!.data.length, 0)).toBe(1200);
    expect(ms).toBeLessThan(250);
  });

  it('the screen jumps with a cross-fade and no animated scroll; the bar takes touches only once it is up (source)', () => {
    const book = code(src('app/(tabs)/book.tsx'));
    expect(book).toMatch(/scrollToLocation\(\{ sectionIndex, itemIndex: 0, viewPosition: 0, viewOffset, animated: false \}\)/);
    // The month is found again by its key when the fade ends, and the move goes through runJump.
    expect(book).toMatch(/locate: \(\) => jumpTarget\(chaptersNow\.current, row\.key\)/);
    expect(book).toMatch(/runJump\(\{/);
    // The offset is the bar's whole measured height (its compact month line included), the old sum only as a fallback.
    expect(book).toMatch(/const viewOffset = barHeight\.current \|\| insets\.top \+ BAR_HEIGHT;/);
    expect(book).toMatch(/barHeight\.current = e\.nativeEvent\.layout\.height;/);
    // A month not measured yet: the failed-index handler marks it, and the next layout runs the retry.
    expect(book).toMatch(/jumpFailed\.current = true;/);
    expect(book).toMatch(/scrollToArrival\(\);\s*runPendingJump\(\);/);
    expect(book).toMatch(/const half = tokens\.motion\.fadeMs \/ 2;/);
    expect(book).toMatch(/pointerEvents=\{barUp \? 'box-none' : 'none'\}/);
    expect(book).toMatch(/accessibilityElementsHidden=\{!barUp\}/);
    expect(book).toMatch(/<MonthsSheet open=\{monthsOpen\} rows=\{rows\}/);
    expect(book).toMatch(/ListFooterComponent=\{EndOfBook\}/);
    expect(book).toMatch(/<CoverBand\b/);
    // The compact month wraps: no numberOfLines on it.
    const bar = book.slice(book.indexOf('const topBar'), book.indexOf('return (\n    <View className="flex-1 bg-background"'));
    expect(bar).toMatch(/testID="book\.bar\.month"/);
    expect(bar.slice(bar.indexOf('compact ?'))).not.toMatch(/numberOfLines/);
  });
});

describe('going to a month always brings the list back (Review A on #674)', () => {
  /** A fake list: records what happened, in order. `measuredAfter` = the attempt from which the target is reachable. */
  function fake(o: { at?: () => number | null; measuredAfter?: number; throwOnScroll?: boolean } = {}) {
    const log: string[] = [];
    let opacity = 1;
    let tries = 0;
    const pending: (() => void)[] = [];
    const steps: JumpSteps = {
      fadeOut: (next) => {
        opacity = 0;
        log.push('out');
        next();
      },
      locate: o.at ?? (() => 3),
      scroll: (i) => {
        tries++;
        log.push(`scroll ${i}`);
        if (o.throwOnScroll) throw new Error('sections[i] is undefined');
        return tries >= (o.measuredAfter ?? 1);
      },
      afterLayout: (retry) => {
        log.push('wait');
        pending.push(retry);
      },
      fadeIn: () => {
        opacity = 1;
        log.push('in');
      },
    };
    const layout = () => {
      while (pending.length) pending.shift()!();
    };
    return { steps, log, layout, opacity: () => opacity, tries: () => tries };
  }

  it('a throw while moving still fades the list back in (the restore is in a finally)', () => {
    const f = fake({ throwOnScroll: true });
    expect(() => runJump(f.steps)).toThrow();
    expect(f.opacity()).toBe(1);
    expect(f.log).toEqual(['out', 'scroll 3', 'in']);
  });

  it('a month gone since the tap (a deletion, a sync rebuild) is not moved to, and the list comes back', () => {
    const f = fake({ at: () => null });
    runJump(f.steps);
    expect(f.log).toEqual(['out', 'in']);
    expect(f.opacity()).toBe(1);
  });

  it('the month is found again by its key: a new place after the list changed, null when gone or empty', () => {
    const chapters = [
      { key: 'm17', countLine: '' },
      { key: 'm16', countLine: '3 letters' },
      { key: 'm12', countLine: '1 letter' },
    ];
    expect(jumpTarget(chapters, 'm12')).toBe(2);
    expect(jumpTarget(chapters.filter((c) => c.key !== 'm16'), 'm12')).toBe(1);
    expect(jumpTarget(chapters, 'm14')).toBeNull();
    // The current month before its first letter is not a place to go.
    expect(jumpTarget(chapters, 'm17')).toBeNull();
  });

  it('a month the list has not measured yet is tried again after the next layout, then the list fades in once', () => {
    const f = fake({ measuredAfter: 3 });
    runJump(f.steps);
    // Out, a first try that misses, and the list stays faded while it waits.
    expect(f.log).toEqual(['out', 'scroll 3', 'wait']);
    expect(f.opacity()).toBe(0);
    f.layout();
    expect(f.log).toEqual(['out', 'scroll 3', 'wait', 'scroll 3', 'wait', 'scroll 3', 'in']);
    expect(f.opacity()).toBe(1);
  });

  it('never measured: it gives up after JUMP_MAX_TRIES and still fades back in', () => {
    const f = fake({ measuredAfter: Infinity });
    runJump(f.steps);
    f.layout();
    expect(f.tries()).toBe(JUMP_MAX_TRIES);
    expect(f.log.filter((l) => l === 'in')).toHaveLength(1);
    expect(f.opacity()).toBe(1);
  });

  it('a month that is gone by the retry is left alone, and the list comes back', () => {
    let present = true;
    const f = fake({ at: () => (present ? 2 : null), measuredAfter: 2 });
    runJump(f.steps);
    present = false;
    f.layout();
    expect(f.log).toEqual(['out', 'scroll 2', 'wait', 'in']);
    expect(f.opacity()).toBe(1);
  });
});

describe('book-page strings (working copy for content)', () => {
  it('fill their slots and keep the content rules', () => {
    for (const [k, v] of Object.entries(bookCopy)) {
      expect(v, k).not.toMatch(/[\u2013\u2014\u2018\u2019\u201C\u201D\u2026]/u);
      expect(v, k).not.toMatch(/\p{Extended_Pictographic}/u);
    }
    expect(bookCopy.monthsTitle).toBe('Go to a month');
    expect(bookCopy.cardVoice).toBe('Voice {duration}');
  });
});
