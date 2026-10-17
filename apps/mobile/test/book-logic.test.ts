/// <reference types="node" />
/**
 * The Book's arrival, leaving and first-seen rules (EXPERIENCE_PASS S26, S36; 5.8 rows 5 and 7; package P5), and the
 * screens' wiring of them. Fictional family "Asha" only.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { tokens } from '@scribe/design-tokens';
import { arrivalOf, belowIsBook, createBookHandoff, firstSeen, pageRestPlan, parseSeen, SEEN_MAX, springArrivalMs, withLeaving } from '../src/components/book/book.logic';
import type { Entry } from '../src/lib/store';

const src = (f: string) => readFileSync(join(__dirname, '../src', f), 'utf8');
const code = (s: string) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');
const e = (id: string, occurredOn: string, capturedAt = `${occurredOn}T19:00:00.000Z`, extra: Partial<Entry> = {}) =>
  ({ id, occurredOn, capturedAt, childId: 'child-asha', kind: 'letter', inBook: true, ...extra }) as Entry;

describe('a kept letter arrives in the Book (5.8 row 5)', () => {
  const sections = [{ data: [e('n2', '2026-10-15'), e('n1', '2026-10-14')] }, { data: [e('o1', '2026-09-20')] }];

  it('finds the card the param names: its month and its row', () => {
    expect(arrivalOf('n1', sections)).toEqual({ id: 'n1', sectionIndex: 0, itemIndex: 1 });
    expect(arrivalOf(['o1'], sections)).toEqual({ id: 'o1', sectionIndex: 1, itemIndex: 0 });
  });

  it('a param that names no card here (another book, a letter since deleted) is no arrival', () => {
    expect(arrivalOf('elsewhere', sections)).toBeNull();
    expect(arrivalOf(undefined, sections)).toBeNull();
    expect(arrivalOf('', sections)).toBeNull();
  });

  it('the Book washes the card once and clears the param, so Back and tab taps never replay it (source)', () => {
    const book = code(src('app/(tabs)/book.tsx'));
    expect(book).toMatch(/useLocalSearchParams<\{ arrived\?: string \}>\(\)/);
    expect(book).toMatch(/wash\(\[arrival\.id\]\)/);
    expect(book).toMatch(/router\.setParams\(\{ arrived: undefined \}\)/);
  });
});

describe('a letter deleted from its page (S36)', () => {
  it('the handoff gives the deleted letter to the Book once', () => {
    const h = createBookHandoff();
    let heard = 0;
    h.subscribe(() => heard++);
    h.deleted(e('l1', '2026-10-14'));
    expect(h.get()?.id).toBe('l1');
    expect(h.take()?.id).toBe('l1');
    expect(h.take()).toBeNull();
    expect(heard).toBe(2);
  });

  it('keeps the card in its row while its page goes back into it, in the store\'s order', () => {
    const live = [e('l3', '2026-10-16'), e('l1', '2026-10-14')];
    const gone = e('l2', '2026-10-15');
    expect(withLeaving(live, gone, 'child-asha').map((x) => x.id)).toEqual(['l3', 'l2', 'l1']);
    expect(withLeaving(live, null, 'child-asha').map((x) => x.id)).toEqual(['l3', 'l1']);
    // Another book's letter never shows here; a letter back in the list (Undo) is not doubled.
    expect(withLeaving(live, { ...gone, childId: 'child-other' } as Entry, 'child-asha')).toHaveLength(2);
    expect(withLeaving([...live, gone], gone, 'child-asha')).toHaveLength(3);
  });

  it('knows when the screen under the page is the Book', () => {
    const tabsOn = (name: string) => ({ name: '(tabs)', state: { index: 1, routes: [{ name: 'index' }, { name }] } });
    expect(belowIsBook({ index: 1, routes: [tabsOn('book'), { name: 'letter/[id]' }] })).toBe(true);
    expect(belowIsBook({ index: 1, routes: [{ name: '(tabs)', state: { index: 0, routes: [{ name: 'index' }, { name: 'book' }] } }, { name: 'letter/[id]' }] })).toBe(false);
    expect(belowIsBook({ index: 2, routes: [tabsOn('book'), { name: 'settings' }, { name: 'letter/[id]' }] })).toBe(false);
    expect(belowIsBook({ index: 0, routes: [{ name: 'letter/[id]' }] })).toBe(false);
    expect(belowIsBook(undefined)).toBe(false);
  });

  it('no full-page deleted state: delete returns to the Book, where one toast with Undo and no timer waits (source)', () => {
    const page = code(src('app/letter/[id].tsx'));
    expect(page).not.toMatch(/deletedUndoBody|deletedBody|UndoToast/);
    expect(page).toMatch(/deleteEntry\(gone\.id\)/);
    expect(page).toMatch(/bookHandoff\.deleted\(gone\)/);
    const book = code(src('app/(tabs)/book.tsx'));
    expect(book).toMatch(/const gone = bookHandoff\.take\(\)/);
    // A toast with an action has no timer (components/ui/toast); Undo puts the card back with the wash.
    expect(book).toMatch(/message: copy\.settings\.delete\.entryToast,\s*action: \{/);
    expect(book).toMatch(/undeleteEntry\(gone\.id\);\s*wash\(\[gone\.id\]\)/);
    // Leaving the Book takes the toast away.
    expect(book).toMatch(/if \(deleteToastUp\.current\) \{\s*deleteToastUp\.current = false;\s*toast\.hide\(\);/);
  });
});

describe('the letter page while the card\'s words travel in (MOTION 5f)', () => {
  const standard = tokens.motion.standard;

  it('finds when the words are within a few points of home on the standard spring', () => {
    const t = springArrivalMs(standard, 340, 4);
    expect(t).toBeGreaterThan(200);
    expect(t).toBeLessThan(600);
    // Further to travel takes longer; already home takes nothing.
    expect(springArrivalMs(standard, 600, 4)).toBeGreaterThanOrEqual(t);
    expect(springArrivalMs(standard, 3, 4)).toBe(0);
  });

  it('the rest of the page waits for a carry (measure, hold, arrival) and is plain without one', () => {
    const o = { holdMs: tokens.motion.cardToPage.holdMs, measureMs: 64, spring: standard, travelPt: 340, withinPt: 4, fadeMs: tokens.motion.fadeMs };
    const carried = pageRestPlan({ ...o, carried: true });
    expect(carried.showAtMs).toBe(64 + tokens.motion.cardToPage.holdMs + springArrivalMs(standard, 340, 4));
    expect(carried.fadeMs).toBe(tokens.motion.fadeMs);
    // Still well inside the sequence ceiling: the whole page is on screen by the 2 s hard ceiling.
    expect(carried.showAtMs + carried.fadeMs).toBeLessThan(tokens.motion.hardCeilingMs);
    expect(pageRestPlan({ ...o, carried: false })).toEqual({ showAtMs: 0, fadeMs: 0 });
  });

  it('the page holds its rest until then, and Back sends it first (source)', () => {
    const page = code(src('app/letter/[id].tsx'));
    expect(page).toMatch(/carried: !!r && !reduced && canCarry\(r\.text, column\)/);
    expect(page).toMatch(/withDelay\(rest\.showAtMs, withTiming\(1/);
    expect(page).toMatch(/<Animated\.View style=\{\[\{ gap: 28 \}, restBody\]\}>/);
    expect(page).toMatch(/withTiming\(0, \{ duration: REST_OUT_MS[^}]*\}\);\s*leaveTimer\.current = setTimeout\(leave, REST_OUT_MS\);/);
  });
});

describe("the other parent's letter, first seen on this phone (option B)", () => {
  const own = new Set(['m1', 'm2']);
  const isOwn = (x: { id: string }) => own.has(x.id);
  const list = [{ id: 'm1' }, { id: 'p1' }, { id: 'm2' }, { id: 'p2' }];

  it('the first look takes everything already there as seen (no whole-book wash on a new phone)', () => {
    expect(firstSeen(list, isOwn, null)).toEqual({ wash: [], seen: ['p1', 'p2'] });
  });

  it('then a letter of theirs not shown before washes once', () => {
    const next = firstSeen([...list, { id: 'p3' }], isOwn, ['p1', 'p2']);
    expect(next).toEqual({ wash: ['p3'], seen: ['p3', 'p1', 'p2'] });
    expect(firstSeen([...list, { id: 'p3' }], isOwn, next.seen).wash).toEqual([]);
  });

  it('keeps ids only, at most SEEN_MAX, and reads anything unreadable as no list yet', () => {
    const many = Array.from({ length: SEEN_MAX + 20 }, (_, i) => ({ id: `p${i}` }));
    expect(firstSeen(many, isOwn, null).seen).toHaveLength(SEEN_MAX);
    expect(parseSeen(null)).toBeNull();
    expect(parseSeen('not json')).toBeNull();
    expect(parseSeen('["p1", 2, "p2"]')).toEqual(['p1', 'p2']);
  });
});

describe('the Book screen (S24 to S26, source)', () => {
  const book = code(src('app/(tabs)/book.tsx'));

  it('has no tinted explainer box; the current month is a lit opener with no sentence', () => {
    expect(book).not.toMatch(/variant="tinted"/);
    expect(book).not.toMatch(/book\.empty\.chapterBody|book\.empty\.chapterTitle/);
    expect(book).toMatch(/<MonthOpener opener=\{openerOf\(section\)\}/);
  });

  it('lights the room with the still book scene, sharing the tabs\' light', () => {
    expect(book).toMatch(/<Lamp scene="book" persistKey="tabs" \/>/);
  });

  it('hides "For Asha" with one book, and the screen that holds cards hides itself under their page', () => {
    expect(book).toMatch(/children\.length > 1 \? <ChildSwitcher \/>/);
    expect(book).toMatch(/\{\.\.\.behind\}/);
    expect(book).toMatch(/<CardSource id=\{item\.id\}>/);
  });

  it('every excerpt is the two-line fade, never an ellipsis (letter cards)', () => {
    const card = code(src('components/book/letter-card.tsx'));
    expect(card).toMatch(/<ExcerptFade text=\{text\} lines=\{2\} variant="letterBody"/);
    expect(card).not.toMatch(/numberOfLines=/);
    expect(code(src('components/book/app-note.tsx'))).not.toMatch(/numberOfLines=/);
  });
});

describe('the letter page (S27, S28, source)', () => {
  const page = code(src('app/letter/[id].tsx'));

  it('opens in the card\'s column and type, so the carried words never reflow', () => {
    expect(page).toMatch(/paddingHorizontal: CARD_TEXT_INSET/);
    expect(page).toMatch(/<PageOpening lineHeight=\{openingLineHeight\} \/>/);
    expect(page).toMatch(/<View style=\{\{ gap: CARD_TEXT_GAP \}\}>/);
    expect(src('components/book/letter-card.tsx')).toMatch(/style=\{\{ gap: CARD_TEXT_GAP \}\}/);
  });

  it('the dateline is the focus target and says the age aloud', () => {
    expect(page).toMatch(/<Text ref=\{focusRef \?\? undefined\} variant="letterDateline" caps accessibilityLabel=\{spokenDateline\}/);
  });

  it('one provenance line, no lamp, no "Record again" on a letter with no words', () => {
    expect(page).toMatch(/`\$\{provenance\}\. \$\{copy\.book\.recordingOnPhone\}\.`/);
    expect(page).toMatch(/useUnlitRoom\(\)/);
    expect(page).not.toMatch(/<Lamp/);
    expect(page).not.toMatch(/recordAgainButton/);
  });
});

describe('Read together (S30 to S32, source)', () => {
  const rt = code(src('app/read-together.tsx'));

  it('has no "1 / 5" counter: a hairline, and "Letter 1 of 5" for VoiceOver', () => {
    expect(rt).not.toMatch(/\$\{[^}]*\} \/ \$\{/);
    expect(rt).toMatch(/fill\(rt\.positionA11y, \{ n: /);
    expect(rt).toMatch(/<Progress fraction=/);
  });

  it('turns pages with PageTurn, reads the dateline without the separator, and has no word highlight', () => {
    expect(rt).toMatch(/<PageTurn/);
    expect(rt).toMatch(/accessibilityLabel=\{dateline\.spoken\}/);
    expect(rt).not.toMatch(/highlight/i);
  });

  it('"Keep playing" is a switch chip, remembered across sessions', () => {
    expect(rt).toMatch(/accessibilityRole="switch"/);
    expect(rt).toMatch(/setSetting\(KEEP_PLAYING/);
    expect(rt).not.toMatch(/<Toggle/);
  });

  it('the dusk pool is the night scene only, arriving once per opening and dimming to half at the end', () => {
    expect(rt).toMatch(/<Lamp scene="readTogether" arrive intensity=\{done \? 0\.5 : 1\} \/>/);
  });

  it('a stale link with no letters has a way forward, not only Close (S32)', () => {
    expect(rt).toMatch(/<StateScreen kind="empty"[^\n]*primary=\{write\}/);
  });
});
