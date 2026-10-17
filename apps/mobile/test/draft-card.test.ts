/// <reference types="node" />
/**
 * Tonight (EXPERIENCE_PASS_2026-10 S09 and S33, package P3): the draft cards, "A month ago", the dateline, the
 * two-tone greeting, the quiet-day light and the once-per-launch arrival. Pure parts (draft-card.logic.ts) run here;
 * Node cannot load React Native, so the screen's use of them is checked in its source. Fixtures: the fictional family
 * Asha only (CLAUDE.md).
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { en, reminderCopy } from '@scribe/content';
import { tokens } from '@scribe/design-tokens';
import { afterEach, describe, expect, it } from 'vitest';
import { lineHeightFor } from '../src/components/motion/excerpt-fade.logic';
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
  resurfaced,
  spoken,
  tonightArrival,
  tonightDateline,
  tonightLampIntensity,
  type DraftFields,
} from '../src/components/tonight/draft-card.logic';
import { dayDate, isoOf } from '../src/lib/dates';

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
    expect(screen).toContain('markOn(listEntries(), today)');
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
    expect(screen).toContain('return () => setKeptMark(null);');
  });
});

describe('[S09] Tonight renders every draft, one question and the daypart light (source)', () => {
  const screen = code('app/(tabs)/index.tsx');

  it('lists every draft from listDrafts, never only the first', () => {
    expect(screen).toContain('listDrafts(childId)');
    expect(screen).not.toMatch(/listDrafts\([^)]*\)\s*\[\s*0\s*\]/);
    expect(screen).toContain('draftCards(room?.drafts ?? [])');
    expect(screen).toMatch(/cards\.map\(\(card, i\) =>/);
  });

  it('one question on screen: the prompt, no subtitle, and its old caps label only as the prompt\'s hint', () => {
    expect(screen).not.toContain('t.subtitle');
    expect(screen).toContain('<Text variant="promptHero" accessibilityHint={t.promptLabel}>');
    expect(screen.match(/t\.promptLabel/g)).toHaveLength(1);
  });

  it('the lamp follows the greeting\'s daypart, settles between tabs, and dims for a quiet evening', () => {
    expect(screen).toContain('<Lamp scene="tonight" daypart={daypart} persistKey="tabs" intensity={lampLevel} />');
    expect(screen).toContain('const daypart = greetingKey();');
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
  // iOS text sizes as React Native's fontScale (RCTAccessibilityManager): xSmall to xxxLarge, then AX1 to AX5.
  const SIZES = [
    ['xSmall', 0.823],
    ['Small', 0.882],
    ['Medium', 0.941],
    ['Large (default)', 1],
    ['xLarge', 1.118],
    ['xxLarge', 1.235],
    ['xxxLarge', 1.353],
    ['AX1', 1.786],
    ['AX5', 3.118],
  ] as const;

  for (const [size, fontScale] of SIZES) {
    it(`at ${size} (${fontScale}) a card's excerpt clips at exactly ${EXCERPT.lines} rendered lines`, () => {
      const type = tokens.type[EXCERPT.variant];
      const rendered = type.lineHeight * (type.maxScale === null ? fontScale : Math.min(fontScale, type.maxScale));
      const clip = EXCERPT.lines * lineHeightFor(EXCERPT.variant, fontScale);
      expect(clip / rendered).toBeCloseTo(EXCERPT.lines, 9);
      if (fontScale < 1) expect(lineHeightFor(EXCERPT.variant, fontScale)).toBeLessThan(type.lineHeight);
    });
  }

  it('the draft and month-old cards draw their words with ExcerptFade (two lines, a fade, never an ellipsis glyph)', () => {
    expect(EXCERPT).toEqual({ lines: 2, variant: 'letterBody' });
    for (const f of ['components/tonight/draft-card.tsx', 'components/tonight/resurfaced-card.tsx']) {
      const src = code(f);
      expect(src, f).toContain('<ExcerptFade text={card.words} lines={EXCERPT.lines} variant={EXCERPT.variant} surface={c.surfaceRaised} />');
      expect(src, f).not.toMatch(/numberOfLines=|ellipsizeMode=|maxHeight|height:/);
    }
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
