/// <reference types="node" />
/**
 * Tonight (EXPERIENCE_PASS_2026-10 S09 and S33, package P3): the draft cards, "A month ago", the dateline, the
 * two-tone greeting, the quiet-day light and the once-per-launch arrival. Pure parts (draft-card.logic.ts) run here;
 * Node cannot load React Native, so the screen's use of them is checked in its source. Fixtures: the fictional family
 * Asha only (CLAUDE.md).
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { en, PROMPTS, reminderCopy } from '@scribe/content';
import { selectPrompt } from '@scribe/core';
import { tokens } from '@scribe/design-tokens';
import { afterEach, describe, expect, it, vi } from 'vitest';

// The Book's chapters read the native store through child-store; only the Book's own before-birth rule is used here.
vi.mock('@/components/child/child-store', () => ({ authorOf: (e: { authorSignsAs?: string }, c: { signsAs: string }) => e.authorSignsAs ?? c.signsAs }));

import { fadeBox, lineHeightFor } from '../src/components/motion/excerpt-fade.logic';
import {
  EVENING_DAYPARTS,
  EXCERPT,
  RESURFACE_DAYS,
  clockOf,
  daysBetween,
  draftCard,
  draftCards,
  draftDateline,
  draftState,
  draftWords,
  greetingParts,
  resumed,
  resurfaced,
  roomClock,
  spoken,
  tonightArrival,
  tonightDateline,
  tonightLampIntensity,
  type DraftFields,
} from '../src/components/tonight/draft-card.logic';
import { monthFor } from '../src/components/book/chapters';
import { letterHeader } from '../src/components/capture/review-view.logic';
import { tonightPromptInput, tonightStage, tonightStageLabel } from '../src/components/tonight/prompt.logic';
import { FONT_SCALE, isAccessibilitySize } from '../src/lib/a11y.logic';
import { dayDate, isoOf } from '../src/lib/dates';
import { footerPlacement } from '../src/lib/review-layout.logic';

const SRC = join(__dirname, '..', 'src');
const read = (rel: string) => readFileSync(join(SRC, rel), 'utf8');
const code = (rel: string) => read(rel).replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');

const t = en.tonight;
/** Saturday 17 October 2026, 8:30 PM on the phone's clock. */
const NOW = new Date(2026, 9, 17, 20, 30);
const at = (y: number, m: number, d: number, h = 19, min = 5) => new Date(y, m - 1, d, h, min).toISOString();
const ASHA_SAID = 'Asha, um, today you you held the spoon by yourself. You mostly painted your face with it.';

/** A draft the way listDrafts returns one, before local schema v8 (#182): no `held` field. */
function draft(over: Partial<DraftFields> = {}): DraftFields {
  return {
    id: 'draft-1',
    captureMode: 'spoken',
    audioUri: 'file:///Documents/ExpoAudio/asha-take.m4a',
    audioDurationMs: 42_000,
    audioBytes: 336_000,
    state: 'ready',
    rawTranscript: ASHA_SAID,
    typedText: null,
    recoveredAt: null,
    createdAt: at(2026, 10, 13),
    ...over,
  };
}

describe('[S09] a card for every waiting draft: its line and action come from its own fields', () => {
  it('spoken, words ready: the first words, then Read it back (Review)', () => {
    const c = draftCard(draft(), NOW);
    expect(c.state).toBe('ready');
    expect(c.words).toBe(ASHA_SAID);
    expect(c.line).toBeNull();
    expect(c.action).toBe(t.afterSave.reviewButton);
    expect(c.route).toEqual({ pathname: '/review', params: { draftId: 'draft-1' } });
  });

  it('spoken, words ready but empty: "A recording is ready to read back." in place of the words', () => {
    const c = draftCard(draft({ rawTranscript: '   ' }), NOW);
    expect(c.state).toBe('ready');
    expect(c.words).toBeNull();
    expect(c.line).toBe(t.draftWaiting.title);
    expect(t.draftWaiting.title).toBe('A recording is ready to read back.');
  });

  it('spoken, words not yet written down: book.waitingForWords, then Open (Review)', () => {
    const c = draftCard(draft({ rawTranscript: null }), NOW);
    expect(c.state).toBe('waiting');
    expect(c.words).toBeNull();
    expect(c.line).toBe(en.book.waitingForWords);
    expect(c.action).toBe(t.draft.openButton);
    expect(c.route.pathname).toBe('/review');
  });

  it('typed, closed mid-sentence: its first words and Pick it up (Write), no visible state line (J07-05)', () => {
    const c = draftCard(draft({ captureMode: 'typed', audioUri: null, audioDurationMs: null, rawTranscript: null, typedText: 'Asha, you found your toes today and' }), NOW);
    expect(c.state).toBe('typed');
    expect(c.words).toBe('Asha, you found your toes today and');
    expect(c.line).toBeNull();
    expect(c.action).toBe(t.draft.pickUpButton);
    expect(c.route).toEqual({ pathname: '/write', params: { draftId: 'draft-1' } });
    expect(c.clock).toBeNull();
    // Typed drafts show the first words, so the "A letter you started" line is for VoiceOver only.
    expect(c.a11yLabel.startsWith(t.draft.typedA11y.replace('{date}.', ''))).toBe(true);
  });

  it('held at the Plus gate (Draft.held, #182): the first words, then "Waiting to be kept." and Keep it (Review, then the gate)', () => {
    const c = draftCard(draft({ held: true }), NOW);
    expect(c.state).toBe('held');
    expect(c.words).toBe(ASHA_SAID);
    expect(c.line).toBe('Waiting to be kept.');
    expect(c.action).toBe('Keep it');
    expect(c.route.pathname).toBe('/review');
    // A held typed letter is held too; held wins over every other state.
    expect(draftState(draft({ held: true, captureMode: 'typed', audioUri: null, typedText: 'Asha' }))).toBe('held');
    expect(draftState(draft({ held: true, recoveredAt: at(2026, 10, 16) }))).toBe('held');
  });

  it('a draft without `held` (develop today, before #182) uses the first row; nothing is inferred', () => {
    const before = draft();
    expect('held' in before).toBe(false);
    expect(draftState(before)).toBe('ready');
    expect(draftState(draft({ held: false }))).toBe('ready');
    expect(draftCard(before, NOW).action).toBe(t.afterSave.reviewButton);
  });

  it('found by the launch sweep: "Recorded before the app closed." and Read it back, also for a take that would not play', () => {
    const swept = draftCard(draft({ recoveredAt: at(2026, 10, 17, 7), rawTranscript: null }), NOW);
    expect(swept.state).toBe('swept');
    expect(swept.line).toBe('Recorded before the app closed.');
    expect(swept.action).toBe(t.afterSave.reviewButton);
    expect(swept.words).toBeNull();
    expect(draftState(draft({ recoveredAt: at(2026, 10, 17, 7), audioDurationMs: 0 }))).toBe('swept');
  });

  it('a take with no sound in it says so, never that its words are coming (review note 4 on #221)', () => {
    // The recorder stores a 0-byte take as unrecoverable (lib/capture/recorder.ts); its words will never come.
    const empty = draftCard(draft({ state: 'unrecoverable', audioBytes: 0, audioDurationMs: 0, rawTranscript: null }), NOW);
    expect(empty.state).toBe('empty');
    expect(empty.line).toBe(en.review.emptyTake.body);
    expect(empty.line).toBe('The recording ended before any sound came in.');
    expect(empty.words).toBeNull();
    expect(empty.action).toBe(t.draft.openButton);
    expect(empty.route).toEqual({ pathname: '/review', params: { draftId: 'draft-1' } });
    expect(empty.clock).toBeNull();
    expect(empty.a11yLabel).toBe(`${dayDate('2026-10-13')}. The recording ended before any sound came in. Open.`);
    expect(empty.a11yLabel).not.toContain(en.book.waitingForWords);
    // Found empty by the launch sweep: the same honest line, which is truer than "Read it back".
    expect(draftState(draft({ state: 'unrecoverable', audioBytes: 0, rawTranscript: null, recoveredAt: at(2026, 10, 17, 7) }))).toBe('empty');
    // A take the sweep kept but could not open (it has bytes): found by the sweep, as before.
    expect(draftState(draft({ state: 'unrecoverable', audioBytes: 5_120, rawTranscript: null, recoveredAt: at(2026, 10, 17, 7) }))).toBe('swept');
    // Held wins, and words win: an unrecoverable row that somehow has words shows them.
    expect(draftState(draft({ state: 'unrecoverable', audioBytes: 0, held: true }))).toBe('held');
    expect(draftState(draft({ state: 'unrecoverable', audioBytes: 0 }))).toBe('ready');
  });

  it('a state that cannot be read (a spoken row with no file yet) is the first row', () => {
    expect(draftState(draft({ audioUri: null, rawTranscript: null }))).toBe('ready');
    expect(draftCard(draft({ audioUri: null, rawTranscript: null }), NOW).line).toBe(t.draftWaiting.title);
  });

  it('typing onto a recording (a mixed draft) shows what was typed and reads it back in Review', () => {
    const c = draftCard(draft({ rawTranscript: null, typedText: 'Typed for the recording.' }), NOW);
    expect(c.state).toBe('ready');
    expect(c.words).toBe('Typed for the recording.');
    expect(c.route.pathname).toBe('/review');
  });

  it('after a kill with two kept takes, Tonight shows two cards, in listDrafts order (newest first)', () => {
    const newer = draft({ id: 'take-2', createdAt: at(2026, 10, 17, 20, 1), rawTranscript: null, recoveredAt: at(2026, 10, 17, 20, 10) });
    const older = draft({ id: 'take-1', createdAt: at(2026, 10, 17, 19, 40), rawTranscript: null, recoveredAt: at(2026, 10, 17, 20, 10) });
    const cards = draftCards([newer, older], NOW);
    expect(cards.map((c) => c.id)).toEqual(['take-2', 'take-1']);
    expect(cards.every((c) => c.line === t.draft.swept)).toBe(true);
    expect(draftCards([], NOW)).toEqual([]);
  });

  it('shows the person\'s own words as stored: the raw transcript, never a fix, whitespace folded for display only', () => {
    const raw = 'So it rained   all morning\nso we we sat by the window.';
    expect(draftWords({ typedText: null, rawTranscript: raw })).toBe('So it rained all morning so we we sat by the window.');
    expect(draftWords({ typedText: '  ', rawTranscript: null })).toBeNull();
  });

  it('every action label fits a button (22 characters) and every line comes from packages/content', () => {
    for (const label of [t.afterSave.reviewButton, t.draft.openButton, t.draft.pickUpButton, t.draft.keepButton]) expect(label.length).toBeLessThanOrEqual(22);
    const logic = code('components/tonight/draft-card.logic.ts');
    expect(logic).not.toMatch(/['"`][A-Z][a-z]+ [a-z]+[^'"`]*[.]['"`]/); // no sentence typed in the logic
  });
});

describe('[S09] the dateline and what VoiceOver reads', () => {
  it('a draft from this week shows its weekday; an older one the full date; a recording its length', () => {
    expect(draftDateline(at(2026, 10, 13), NOW)).toBe(reminderCopy.weekdays[2]); // Tuesday
    expect(draftDateline(at(2026, 10, 17, 9), NOW)).toBe(reminderCopy.weekdays[6]); // today, Saturday
    expect(draftDateline(at(2026, 10, 9), NOW)).toBe(dayDate('2026-10-09'));
    expect(clockOf(42_000)).toBe('0:42');
    expect(clockOf(61_400)).toBe('1:01');
    expect(clockOf(0)).toBeNull();
    expect(clockOf(null)).toBeNull();
    expect(draftCard(draft(), NOW).clock).toBe('0:42');
  });

  it("the weekday holds for six days and gives way to the full date at seven, by the phone's calendar, in four time zones", () => {
    const before = process.env.TZ;
    try {
      for (const tz of ['America/Los_Angeles', 'Asia/Kolkata', 'Pacific/Auckland', 'UTC']) {
        process.env.TZ = tz;
        // Saturday 10 PM on the phone's clock.
        const made = new Date(2026, 9, 17, 22, 0).toISOString();
        expect(reminderCopy.weekdays[new Date(made).getDay()], tz).toBe('Saturday');
        expect(draftDateline(made, new Date(2026, 9, 23, 22, 0)), `${tz}: 6 days on`).toBe('Saturday');
        expect(draftDateline(made, new Date(2026, 9, 23, 23, 59)), `${tz}: the last minute of the sixth day`).toBe('Saturday');
        // From the seventh calendar day the weekday would be today's own, so the full date shows instead.
        expect(draftDateline(made, new Date(2026, 9, 24, 0, 1)), `${tz}: the first minute of the seventh day`).toBe(dayDate('2026-10-17'));
        expect(draftDateline(made, new Date(2026, 9, 24, 22, 1)), `${tz}: 7 days and a minute on`).toBe(dayDate('2026-10-17'));
        // Started at 11:50 PM on Tuesday, seen at 12:10 AM on Wednesday: still Tuesday's.
        expect(draftDateline(new Date(2026, 9, 13, 23, 50).toISOString(), new Date(2026, 9, 14, 0, 10)), `${tz}: past midnight`).toBe('Tuesday');
        // Across the US clock change (1 Nov 2026): six calendar days are still six, seven are a week.
        expect(draftDateline(new Date(2026, 9, 31, 21, 0).toISOString(), new Date(2026, 10, 6, 21, 0)), `${tz}: across 1 Nov`).toBe('Saturday');
        expect(draftDateline(new Date(2026, 9, 31, 21, 0).toISOString(), new Date(2026, 10, 7, 21, 0)), `${tz}: a week across 1 Nov`).toBe(dayDate('2026-10-31'));
        // A draft dated after the phone's clock (the clock moved back) gets the full date, never a weekday.
        expect(draftDateline(new Date(2026, 9, 18, 9, 0).toISOString(), new Date(2026, 9, 17, 9, 0)), `${tz}: from the future`).toBe(dayDate('2026-10-18'));
      }
    } finally {
      if (before === undefined) delete process.env.TZ;
      else process.env.TZ = before;
    }
  });

  it('a card reads as sentences: the full date, the words or the state, the action; no separator glyph, no total', () => {
    const c = draftCard(draft({ held: true }), NOW);
    expect(c.a11yLabel).toBe(`${dayDate('2026-10-13')}. ${ASHA_SAID} Waiting to be kept. Keep it.`);
    const typed = draftCard(draft({ captureMode: 'typed', audioUri: null, rawTranscript: null, typedText: 'Asha' }), NOW);
    expect(typed.a11yLabel).toBe(`A letter you started, ${dayDate('2026-10-13')}. Asha. Pick it up.`);
    for (const card of [c, typed, draftCard(draft({ rawTranscript: null }), NOW)]) {
      expect(card.a11yLabel).not.toMatch(/·/);
      expect(card.a11yLabel).not.toMatch(/\.\./);
    }
    expect(spoken(['One', 'Two.', null, '', 'Three?'])).toBe('One. Two. Three?');
  });

  it('Tonight\'s dateline shows "Asha · 7 months" and is read as "Asha, 7 months": the separator is never read aloud', () => {
    const d = tonightDateline('Asha', '7 months', dayDate('2026-10-17'));
    expect(d.text).toBe('Asha · 7 months');
    expect(d.a11y).toBe('Asha, 7 months');
    // With no age at all (the Family tab, which has no stage) it is still the day's date, as before.
    expect(tonightDateline('Asha', null, dayDate('2026-10-17'))).toEqual({ text: dayDate('2026-10-17'), a11y: dayDate('2026-10-17') });
  });

  it('whole calendar days, across a clock change', () => {
    expect(daysBetween('2026-10-13', '2026-10-17')).toBe(4);
    expect(daysBetween('2026-10-31', '2026-11-02')).toBe(2); // US clocks go back on 1 November 2026
    expect(daysBetween('2026-10-17', '2026-10-13')).toBe(-4);
  });
});

describe('[S09] the greeting in two tones', () => {
  it('"Good evening, " in text and "Mama." in textMuted, for every greeting', () => {
    expect(greetingParts(t.greeting.evening, 'Mama')).toEqual({ lead: 'Good evening, ', rest: 'Mama.' });
    for (const [key, template] of Object.entries(t.greeting)) {
      const g = greetingParts(template, 'Mama');
      expect(g.lead + g.rest, key).toBe(template.replace('{name}', 'Mama'));
      expect(g.rest.startsWith('Mama'), key).toBe(true);
      expect(g.lead, key).not.toContain('Mama');
    }
    expect(greetingParts('Hello.', 'Mama')).toEqual({ lead: 'Hello.', rest: '' });
  });
});

describe('[S09] A month ago', () => {
  const letter = (id: string, occurredOn: string, over: Record<string, unknown> = {}) => ({
    id,
    kind: 'letter' as const,
    inBook: true,
    occurredOn,
    capturedAt: `${occurredOn}T19:00:00.000Z`,
    finalText: 'Bath time. You splash with your whole body, both hands, both feet, and then you check that I saw.',
    ...over,
  });
  const TODAY = '2026-10-17';

  it('the newest letter in the book dated 28 to 35 days ago, one card, with its words and how VoiceOver reads it', () => {
    const pick = resurfaced([letter('a', '2026-09-12'), letter('b', '2026-09-19'), letter('c', '2026-09-14')], TODAY, 0);
    expect(pick?.id).toBe('b'); // 28 days ago, the newest in the window
    expect(pick?.kicker).toBe('A month ago');
    expect(pick?.a11yLabel).toBe(`A month ago. ${letter('b', '2026-09-19').finalText} A letter from ${dayDate('2026-09-19')}. Opens the letter.`);
    expect(RESURFACE_DAYS).toEqual({ from: 28, to: 35 });
    expect(resurfaced([letter('edge', '2026-09-12')], TODAY, 0)?.id).toBe('edge'); // 35 days
  });

  it('never when a draft is waiting, never a private letter, a quiet-day mark, a letter with no words, or outside the window', () => {
    expect(resurfaced([letter('b', '2026-09-19')], TODAY, 1)).toBeNull();
    expect(resurfaced([letter('p', '2026-09-19', { inBook: false })], TODAY, 0)).toBeNull();
    expect(resurfaced([letter('q', '2026-09-19', { kind: 'not_much', finalText: '' })], TODAY, 0)).toBeNull();
    expect(resurfaced([letter('w', '2026-09-19', { finalText: '' })], TODAY, 0)).toBeNull();
    expect(resurfaced([letter('young', '2026-09-20'), letter('old', '2026-09-11')], TODAY, 0)).toBeNull(); // 27 and 36 days
  });
});

describe('[S33] not much today, and the light', () => {
  it('in the evening dayparts the kept quiet day lowers the lamp to 70 percent; Undo (no mark) brings it back', () => {
    expect([...EVENING_DAYPARTS]).toEqual(['evening', 'night', 'lateNight']);
    for (const d of EVENING_DAYPARTS) {
      expect(Object.keys(t.greeting)).toContain(d);
      expect(tonightLampIntensity(d, true), d).toBe(tokens.motion.lamp.dimTo);
      expect(tonightLampIntensity(d, false), d).toBe(1);
    }
    expect(tokens.motion.lamp.dimTo).toBe(0.7);
    for (const d of ['earlyMorning', 'morning', 'midday', 'afternoon'] as const) expect(tonightLampIntensity(d, true), d).toBe(1);
  });

  it('the mark stores no words, and the kept line is the line in text with the Moon, never a count or a success colour (source)', () => {
    const screen = code('app/(tabs)/index.tsx');
    expect(screen).toContain('newQuietMark(');
    expect(screen).toContain('markOn(listEntries(), day)');
    const inline = code('components/tonight/quiet-day-inline.tsx');
    expect(inline).toContain('<MoonIcon size={20} color={c.textMuted}');
    expect(inline).toContain('<Text variant="callout">{copy.notMuch.savedToast}</Text>');
    expect(inline).toContain('label={copy.notMuch.undo}');
    expect(en.notMuch.savedToast).toBe('A quiet day, kept.');
    for (const f of ['app/(tabs)/index.tsx', 'components/tonight/quiet-day-inline.tsx', 'components/tonight/draft-card.tsx', 'components/tonight/resurfaced-card.tsx']) {
      expect(code(f), f).not.toMatch(/\bsuccess\b|\bcaution\b|\bdestructive\b|tone="recording"|c\.recording/);
    }
  });

  it('Undo restores the link and the lamp: it removes the mark, the line goes, and the light follows the mark (source)', () => {
    const screen = code('app/(tabs)/index.tsx');
    expect(screen).toMatch(/const undoNotMuch = \(\) => \{\s*if \(keptMark\) deleteEntry\(keptMark\);\s*setKeptMark\(null\);/);
    expect(screen).toContain('tonightLampIntensity(daypart, !!markOn(room.entries, today))');
    // The line stays until Undo or until the person leaves Tonight (blur), never moving content on a return.
    expect(screen).toMatch(/return \(\) => \{\s*focused\.current = false;\s*setKeptMark\(null\);\s*\};/);
  });
});

describe('[S09] Tonight renders every draft, one question and the daypart light (source)', () => {
  const screen = code('app/(tabs)/index.tsx');

  it('reads its room on the first render, so the first painted frame has the lamp and the words (P1 on #221)', () => {
    // An empty first render (`useState(undefined)`, then a read in useFocusEffect) returned null for one frame: no lamp
    // and no words, and on the web build that frame stayed through the mount's long frame (150 to 430 ms), so the light
    // from "The book is open." went out on the way to Tonight. readRoom is synchronous, the same store read as before.
    expect(screen).toContain('const [room, setRoom] = useState<Room | undefined>(readRoom);');
    expect(screen).not.toMatch(/useState<Room \| undefined>\(undefined\)/);
    expect(screen).toMatch(/function readRoom\(\): Room \{/);
  });

  it('lists every draft from listDrafts, never only the first', () => {
    expect(screen).toContain('listDrafts(childId)');
    expect(screen).not.toMatch(/listDrafts\([^)]*\)\s*\[\s*0\s*\]/);
    expect(screen).toContain('draftCards(room?.drafts ?? [], room?.at)');
    // F14-REQ-041 (SR-C-08): every draft is still drawn, through tonightRows, which folds two or more held letters into
    // one row that opens their list (test/tonight-plus.test.ts); every other draft keeps its own card.
    expect(screen).toContain('tonightRows(cards)');
    expect(screen).toMatch(/rows\.map\(\(row, i\) =>/);
  });

  it('one question on screen: the prompt, no subtitle, and its old caps label only as the prompt\'s hint', () => {
    expect(screen).not.toContain('t.subtitle');
    expect(screen).toContain('<Text variant="promptHero" accessibilityHint={t.promptLabel}>');
    expect(screen.match(/t\.promptLabel/g)).toHaveLength(1);
  });

  it('the lamp follows the greeting\'s daypart, settles between tabs, and dims for a quiet evening', () => {
    expect(screen).toContain('<Lamp scene="tonight" daypart={daypart} persistKey="tabs" intensity={lampLevel} />');
    expect(screen).toContain('const daypart = clock.daypart;');
    expect(screen).toContain('t.greeting[daypart]');
  });

  it('the dateline is read without its separator', () => {
    expect(screen).toContain('accessibilityLabel={dateline.a11y}');
  });

  it('under a card\'s page Tonight hides from screen readers, and the month-old card names its place', () => {
    expect(screen).toContain('const behind = useHiddenBehindCardPage();');
    expect(screen).toContain('{...behind}');
    expect(screen).toContain('<CardSource id={monthAgo.id}>');
  });

  it('no count, days-since or streak anywhere on Tonight', () => {
    // daysSince feeds the prompt choice only; it is never rendered.
    const jsx = screen.slice(screen.indexOf('return (\n    <SafeAreaView'));
    expect(jsx).not.toMatch(/daysSince|\.length\}|streak|count/i);
    for (const f of ['components/tonight/draft-card.tsx', 'components/tonight/resurfaced-card.tsx']) expect(code(f), f).not.toMatch(/\.length\}|streak|count/i);
  });

  it('Speak and Type are pinned and never animate in; lines enter once per cold launch', () => {
    const pinned = screen.slice(screen.indexOf('<ButtonRow>'), screen.indexOf('</ButtonRow>'));
    expect(pinned).not.toMatch(/entering=/);
    expect(screen).toContain('const enter = (i: number) => (arriving ? motion.enter(i) : undefined);');
  });
});

describe('[P3] whole-line excerpts at every Dynamic Type size, xSmall, Small and Medium included', () => {
  /**
   * The oracle, written out and not computed by the code under test: iOS text sizes as React Native's fontScale
   * (RCTAccessibilityManager: xSmall to xxxLarge, then AX1 to AX5) and the line a letterBody line (20/32, no cap)
   * renders at. Text scales a line by fontScale and caps it only at maxFontSizeMultiplier, which is 0 (none) for
   * letterBody, so the rendered line is 32 x fontScale, and two whole lines are twice that (52.672 pt at xSmall).
   */
  const SIZES = [
    ['xSmall', 0.823, 26.336],
    ['Small', 0.882, 28.224],
    ['Medium', 0.941, 30.112],
    ['Large (default)', 1, 32],
    ['xLarge', 1.118, 35.776],
    ['xxLarge', 1.235, 39.52],
    ['xxxLarge', 1.353, 43.296],
    ['AX1', 1.786, 57.152],
    ['AX5', 3.118, 99.776],
  ] as const;

  const CARDS = ['components/tonight/draft-card.tsx', 'components/tonight/resurfaced-card.tsx'];

  /** Every ExcerptFade a card draws, as written in its source, with its props resolved (EXCERPT.* to their values). */
  function excerptsIn(rel: string) {
    const value = (props: string, name: string): string | number | undefined => {
      const m = new RegExp(`\\b${name}=(?:\\{([^}]+)\\}|"([^"]+)")`).exec(props);
      if (!m) return undefined;
      const v = (m[1] ?? m[2]).trim();
      if (v === 'EXCERPT.lines') return EXCERPT.lines;
      if (v === 'EXCERPT.variant') return EXCERPT.variant;
      if (/^\d+(\.\d+)?$/.test(v)) return Number(v);
      if (m[2]) return v;
      throw new Error(`${rel}: ExcerptFade ${name}={${v}} is not resolved by this test; teach it the value`);
    };
    return [...code(rel).matchAll(/<ExcerptFade\b([\s\S]*?)\/>/g)].map((m) => ({
      lines: value(m[1], 'lines') as number,
      variant: value(m[1], 'variant') as keyof typeof tokens.type,
      scale: (value(m[1], 'scale') as number | undefined) ?? 1,
      props: m[1],
    }));
  }

  it('ExcerptFade clips at its lines times the line its text renders at, and never sets numberOfLines (source)', () => {
    const src = code('components/motion/excerpt-fade.tsx');
    // The clip and the drawn text share one line height, from lineHeightFor with the same variant, fontScale and scale.
    expect(src).toContain('const lh = lineHeightFor(variant, fontScale, scale ?? 1);');
    expect(src).toContain("<View style={[{ maxHeight: lines * lh, overflow: 'hidden' }, containerStyle]}>");
    expect(src).toMatch(/<Text variant=\{variant\} scale=\{scale\}/);
    // Callers cannot pass numberOfLines (it is left out of the props), and the component sets no ellipsis itself.
    expect(src).toContain("Omit<TextProps, 'children' | 'variant' | 'numberOfLines'>");
    expect(src).not.toMatch(/numberOfLines=|ellipsizeMode=/);
  });

  it('each card draws its words with ExcerptFade only, with nothing that cuts or ellipsises them (source)', () => {
    for (const f of CARDS) {
      const src = code(f);
      const found = excerptsIn(f);
      expect(found.length, f).toBe(1);
      expect(found[0].props, f).not.toMatch(/containerStyle|numberOfLines|ellipsizeMode/);
      // No ellipsis on any text in the card, and nothing around the excerpt that sets a height or clips it.
      expect(src, f).not.toMatch(/numberOfLines|ellipsizeMode|maxHeight|height:|overflow/);
    }
  });

  for (const [size, fontScale, line] of SIZES) {
    it(`at ${size} (${fontScale}) each card's excerpt shows whole lines, cut at a line's end, and the fade sits on the last one`, () => {
      expect(tokens.type.letterBody.lineHeight * fontScale, 'the oracle matches the letterBody token').toBeCloseTo(line, 9);
      for (const f of CARDS) {
        for (const ex of excerptsIn(f)) {
          const type = tokens.type[ex.variant];
          // What Text renders: the token's line, times Reading Size, times Dynamic Type up to the style's cap.
          const rendered = type.lineHeight * ex.scale * (type.maxScale === null ? fontScale : Math.min(fontScale, type.maxScale));
          if (ex.variant === 'letterBody') expect(rendered, `${f}: the rendered line`).toBeCloseTo(line * ex.scale, 9);
          // What ExcerptFade clips at (its own formula, pinned above).
          const lh = lineHeightFor(ex.variant, fontScale, ex.scale);
          const clip = ex.lines * lh;
          const shown = clip / rendered;
          expect(Math.abs(shown - Math.round(shown)), `${f}: ${shown.toFixed(3)} lines shown, so a line is cut through`).toBeLessThan(1e-9);
          expect(Math.round(shown), `${f}: lines shown`).toBe(ex.lines);
          const fade = fadeBox(ex.lines, lh, false);
          expect(fade.top, `${f}: the fade starts at the top of the last line`).toBeCloseTo((ex.lines - 1) * rendered, 9);
          expect(fade.top + fade.height, `${f}: and ends at its foot`).toBeCloseTo(clip, 9);
        }
      }
    });
  }
});

describe('Tonight comes back from the background up to date (review note 3 on #221)', () => {
  it('reads its room again when the app comes to the front, and only then', () => {
    expect(resumed('background', 'active')).toBe(true);
    expect(resumed('inactive', 'active')).toBe(true);
    expect(resumed(null, 'active')).toBe(true);
    expect(resumed('active', 'active')).toBe(false);
    expect(resumed('active', 'background')).toBe(false);
    expect(resumed('active', 'inactive')).toBe(false);
  });

  it('a room read again after midnight has the new day, the new greeting and light, and fresh datelines', () => {
    const evening = roomClock(new Date(2026, 9, 17, 20, 30));
    const pastMidnight = roomClock(new Date(2026, 9, 18, 0, 20));
    expect(evening).toMatchObject({ today: '2026-10-17', daypart: 'evening' });
    expect(pastMidnight).toMatchObject({ today: '2026-10-18', daypart: 'lateNight' });
    expect(t.greeting[pastMidnight.daypart]).not.toBe(t.greeting[evening.daypart]);
    expect(tokens.atmosphere.daypart[pastMidnight.daypart]).not.toEqual(tokens.atmosphere.daypart[evening.daypart]);
    // A Saturday 10 PM draft read on Friday night shows "Saturday"; read again a week on, its full date.
    const sat = draft({ createdAt: new Date(2026, 9, 17, 22, 0).toISOString() });
    expect(draftCards([sat], roomClock(new Date(2026, 9, 23, 21, 0)).at)[0].dateline).toBe('Saturday');
    expect(draftCards([sat], roomClock(new Date(2026, 9, 24, 22, 1)).at)[0].dateline).toBe(dayDate('2026-10-17'));
    expect(roomClock(new Date(2026, 9, 18, 9, 30)).daypart).toBe('morning');
  });

  it('Tonight listens for the app coming to the front and takes every time from the room it read (source)', () => {
    const screen = code('app/(tabs)/index.tsx');
    expect(screen).toContain("const sub = AppState.addEventListener('change', (next) => {");
    expect(screen).toContain('if (resumed(last, next) && focused.current) refresh();');
    expect(screen).toContain('return () => sub.remove();');
    expect(screen).toContain('at: new Date()');
    expect(screen).toContain('const clock = roomClock(room?.at ?? new Date());');
    // Nothing in the render reads the clock on its own: the day, the daypart and the cards' "now" are the room's.
    const render = screen.slice(screen.indexOf('const today = clock.today'), screen.indexOf('const keepNotMuch'));
    expect(render).not.toMatch(/greetingKey\(|todayISO\(|new Date\(\)\)/);
    // The refresh is the focus refresh: the room and the prompt's inputs.
    expect(screen).toMatch(/const refresh = useCallback\(\(\) => \{\s*load\(\);/);
    expect(screen).toMatch(/focused\.current = true;\s*refresh\(\);/);
  });
});

describe('[5.8 rule 2] Tonight arrives once per cold launch', () => {
  afterEach(() => tonightArrival.reset());

  it('pending until Tonight has shown its content once; a later mount moves nothing', () => {
    expect(tonightArrival.pending()).toBe(true);
    tonightArrival.done();
    expect(tonightArrival.pending()).toBe(false);
  });

  it('isoOf keeps the phone\'s own calendar day for a draft started late at night', () => {
    expect(isoOf(new Date(2026, 9, 13, 23, 50))).toBe('2026-10-13');
  });
});

/* ------------------------------------------------------------------ */
/* P3 critics' pass, 28 Oct 2026                                       */
/* ------------------------------------------------------------------ */

describe('[S2] a book that is not born yet: the dateline names the child, and the prompts are the pre-birth set', () => {
  const TODAY = '2026-10-28';
  /** The dateline's separator, a middle dot (U+00B7). */
  const DOT = '\u00b7';
  // The fictional family Asha, started with "Not here yet" and a due date 60 days ahead: no birthday.
  const preBirthBook = { name: 'Asha', birthday: null as string | null, dueDate: '2026-12-27' };

  it('no birthday, or a birthday after today, is before the birth; the Book files such letters in Before You', () => {
    expect(tonightStage(null, TODAY)).toEqual({ beforeBirth: true, ageMonths: 0 });
    expect(tonightStage('2026-10-29', TODAY)).toEqual({ beforeBirth: true, ageMonths: 0 });
    expect(tonightStage('2026-10-28', TODAY)).toEqual({ beforeBirth: false, ageMonths: 0 });
    expect(tonightStage('2026-03-28', TODAY)).toEqual({ beforeBirth: false, ageMonths: 7 });
    // One rule for the Book, Review and Tonight: the Book's own.
    for (const birthday of [null, '2026-10-29', '2026-10-28', '2026-03-28']) {
      expect(tonightStage(birthday, TODAY).beforeBirth).toBe(monthFor({ birthday }, TODAY) === null);
    }
  });

  it('the dateline reads "Asha", the dot, "Before You", with Review\'s words, and "Asha, Before You" aloud: no count of weeks, no gap', () => {
    const stage = tonightStageLabel(preBirthBook.birthday, TODAY);
    const d = tonightDateline(preBirthBook.name, stage, dayDate(TODAY));
    expect(d.text).toBe(`Asha ${DOT} Before You`);
    expect(d.a11y).toBe('Asha, Before You');
    expect(d.a11y).not.toContain(DOT);
    expect(d.text).not.toMatch(/\d|week|day|month|due|born/i);
    // The same words Review's header uses for these letters ("To Asha", the dot, "Before You").
    const review = letterHeader({ childName: 'Asha', signsAs: 'Mama', month: monthFor({ birthday: preBirthBook.birthday }, TODAY) });
    expect(review.to).toBe(`To Asha ${DOT} Before You`);
    expect(review.to.endsWith(d.text.slice(`Asha ${DOT} `.length))).toBe(true);
    // Not the day's date alone, which is what a book without a birthday showed.
    expect(d.text).not.toBe(dayDate(TODAY));
  });

  it('a born child\'s dateline is as before: the name and the age; the day of birth is still "0 days" (L1 is not in this change)', () => {
    expect(tonightDateline('Asha', tonightStageLabel('2026-03-28', TODAY), dayDate(TODAY))).toEqual({ text: `Asha ${DOT} 7 months`, a11y: 'Asha, 7 months' });
    expect(tonightStageLabel('2026-10-28', TODAY)).toBe('0 days');
    expect(tonightStageLabel('2026-10-29', TODAY)).toBe('Before You');
    // The label and the stage agree on every kind of birthday: "Before You" exactly when the stage is before the birth.
    for (const birthday of [null, '2027-01-01', '2026-10-29', '2026-10-28', '2026-10-27', '2026-09-01', '2026-03-28', '2024-01-10']) {
      expect(tonightStageLabel(birthday, TODAY) === 'Before You', String(birthday)).toBe(tonightStage(birthday, TODAY).beforeBirth);
    }
  });

  it('probe: 14 presses of "Another thought" on a book before the birth show no prompt about a born child', () => {
    const shown: string[] = [];
    let leftKey: string | null = null;
    for (let shuffle = 0; shuffle < 14; shuffle++) {
      const input = tonightPromptInput({ birthday: preBirthBook.birthday, today: TODAY, daysSinceLastEntry: null, recentKeys: [], shuffle, leftKey });
      expect(input).toMatchObject({ beforeBirth: true, ageMonths: 0, hardStretch: false, together: false, role: 'parent' });
      const prompt = selectPrompt(input, PROMPTS);
      expect(prompt.band, prompt.key).toBe('before');
      shown.push(prompt.text.replace(/\{child\}/g, preBirthBook.name));
      leftKey = prompt.key;
    }
    // The review's probe showed these on the same book, 28 Oct 2026.
    const all = shown.join(' | ');
    expect(all).not.toMatch(/look like today|first day home|Describe Asha's hands|came to meet|face do while sleeping/);
    expect(new Set(shown).size).toBeGreaterThan(3);
  });

  it('the same book, back after a week away: still the pre-birth set, never the gap prompts about a child who is here', () => {
    for (let shuffle = 0; shuffle < 30; shuffle++) {
      const input = tonightPromptInput({ birthday: null, today: TODAY, daysSinceLastEntry: 9, recentKeys: [], shuffle, leftKey: null });
      expect(selectPrompt(input, PROMPTS).band).toBe('before');
    }
  });

  it('a born book is unchanged: the age decides, and the seed is the day and the press', () => {
    const input = tonightPromptInput({ birthday: '2026-03-28', today: TODAY, daysSinceLastEntry: 2, recentKeys: ['opening.7-9.games'], shuffle: 3, leftKey: 'opening.7-9.peekaboo' });
    expect(input).toEqual({
      ageMonths: 7,
      beforeBirth: false,
      daysSinceLastEntry: 2,
      hardStretch: false,
      role: 'parent',
      together: false,
      recentKeys: ['opening.7-9.games'],
      seed: '2026-10-28:3',
      excludeKeys: ['opening.7-9.peekaboo'],
    });
    for (let shuffle = 0; shuffle < 30; shuffle++) {
      const p = selectPrompt(tonightPromptInput({ birthday: '2026-03-28', today: TODAY, daysSinceLastEntry: 2, recentKeys: [], shuffle, leftKey: null }), PROMPTS);
      expect(p.band).not.toBe('before');
    }
  });

  it('the screen builds its prompt and its dateline from these (source)', () => {
    const screen = code('app/(tabs)/index.tsx');
    expect(screen).toContain('selectPrompt(tonightPromptInput({ birthday, today, daysSinceLastEntry: daysSince, recentKeys: recent, shuffle, leftKey }), PROMPTS)');
    expect(screen).toContain('tonightDateline(child, tonightStageLabel(book.childBirthday, today), dayDate(today))');
    // The old input, which turned a missing birthday into month 0, is gone.
    expect(screen).not.toMatch(/ageMonths:/);
    expect(screen).not.toMatch(/age\.days >= 0/);
    expect(screen).not.toMatch(/ageText\(/);
  });
});

describe('[S4] "Another thought" never shows the prompt that is on screen', () => {
  it('leaves the prompt that was pressed on out of the next draw; before any press nothing is left out', () => {
    const args = { birthday: '2026-03-28', today: '2026-10-28', daysSinceLastEntry: 9, recentKeys: [], shuffle: 1 };
    expect(tonightPromptInput({ ...args, leftKey: 'gap.any.small' }).excludeKeys).toEqual(['gap.any.small']);
    expect(tonightPromptInput({ ...args, leftKey: null }).excludeKeys).toEqual([]);
  });

  it('after five days away, over 60 days of 12 presses on the real library, no press repeats and the tap is never dead', () => {
    let presses = 0;
    for (const birthday of ['2026-03-28', '2025-04-12', '2024-01-10', null]) {
      for (let day = 0; day < 60; day++) {
        const today = isoOf(new Date(2026, 9, 1 + day));
        let leftKey: string | null = null;
        let on = selectPrompt(tonightPromptInput({ birthday, today, daysSinceLastEntry: 9, recentKeys: [], shuffle: 0, leftKey }), PROMPTS).key;
        for (let shuffle = 1; shuffle <= 12; shuffle++) {
          leftKey = on;
          const next = selectPrompt(tonightPromptInput({ birthday, today, daysSinceLastEntry: 9, recentKeys: [], shuffle, leftKey }), PROMPTS).key;
          expect(next, `${birthday} ${today} press ${shuffle}`).not.toBe(on);
          on = next;
          presses++;
        }
      }
    }
    expect(presses).toBe(4 * 60 * 12);
  });

  it('the button records the prompt it was pressed on, in the same press that changes the seed (source)', () => {
    const screen = code('app/(tabs)/index.tsx');
    expect(screen).toMatch(/haptic\('tap'\);\s*setLeftKey\(prompt\.key\);\s*setShuffle\(\(s\) => s \+ 1\);/);
    expect(screen).toContain('const [leftKey, setLeftKey] = useState<string | null>(null);');
    // it is a dependency of the memo, so the draw sees it
    expect(screen).toMatch(/\[birthday, daysSince, recent, today, shuffle, leftKey\]/);
  });
});

describe('[S1] at accessibility text sizes Speak, Type and "Not much today" ride in the scroll, under the question', () => {
  const screen = code('app/(tabs)/index.tsx');

  it('inline from AX1 up, pinned at every smaller size: the same rule as Review\'s footer', () => {
    for (const [name, scale] of Object.entries(FONT_SCALE)) {
      const ax = name.startsWith('ax');
      expect(isAccessibilitySize(scale), name).toBe(ax);
      expect(footerPlacement(isAccessibilitySize(scale)), name).toBe(ax ? 'inline' : 'pinned');
    }
    expect(footerPlacement(isAccessibilitySize(FONT_SCALE.ax3))).toBe('inline');
    expect(footerPlacement(isAccessibilitySize(FONT_SCALE.ax5))).toBe('inline');
    expect(footerPlacement(isAccessibilitySize(FONT_SCALE.xxxLarge))).toBe('pinned');
  });

  it('the screen reads the size with the same hook and rule as Review, and draws the actions in exactly one place at a time (source)', () => {
    expect(screen).toContain("const inlineActions = footerPlacement(useIsAccessibilitySize()) === 'inline';");
    expect(screen).toContain('{inlineActions ? actions : null}');
    expect(screen).toContain('{inlineActions ? null : actions}');
    // one definition of the buttons, so the two places can never drift apart
    expect(screen.match(/<ButtonRow>/g)).toHaveLength(1);
    expect(screen.match(/label=\{t\.notMuchButton\}/g)).toHaveLength(1);
  });

  it('inline, the actions come after the question and "Another thought" and before the cards; pinned, after the scroll (source)', () => {
    const at = (needle: string) => {
      const i = screen.indexOf(needle);
      expect(i, needle).toBeGreaterThan(-1);
      return i;
    };
    const question = at('label={t.newPromptButton}');
    const inline = at('{inlineActions ? actions : null}');
    const cardsAt = at('{cards.length > 0 ? (');
    const scrollEnds = at('</ScrollView>');
    const pinned = at('{inlineActions ? null : actions}');
    expect(question).toBeLessThan(inline);
    expect(inline).toBeLessThan(cardsAt);
    expect(cardsAt).toBeLessThan(scrollEnds);
    expect(scrollEnds).toBeLessThan(pinned);
    // the inline copy is inside the ScrollView, the pinned copy outside it
    expect(at('<ScrollView')).toBeLessThan(inline);
  });

  it('the inline block has no pinned padding and keeps the quiet link and the kept line with the buttons', () => {
    expect(screen).toContain("className={inlineActions ? 'mt-6 gap-2' : 'gap-2 px-5 pb-3 pt-3'}");
    const block = screen.slice(screen.indexOf('const actions = ('), screen.indexOf('return (\n    <SafeAreaView'));
    expect(block).toContain('<QuietDayInline onUndo={undoNotMuch} entering={lineIn} />');
    expect(block).toContain('exiting={linkOut}');
    // Speak and Type still never animate in, inline or pinned
    expect(block.slice(block.indexOf('<ButtonRow>'), block.indexOf('</ButtonRow>'))).not.toMatch(/entering=/);
  });
});
