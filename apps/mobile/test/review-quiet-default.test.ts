/// <reference types="node" />
/**
 * [BL-1984] Review opens quiet (spec 14 section 6, QD-01 to QD-11). The decisions are pure (`review-fold.logic.ts`);
 * the wiring in `app/review.tsx` is read as source, since a screen cannot load in Node. Nothing here ran on a device
 * or a simulator.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { copy } from '@/lib/copy';
import { tokens } from '@scribe/design-tokens';
import { countRowText, foldApplies, foldedControlsShow, foldHint, foldIsOpen, foldToggledTo, keepLine, keepLinesShow, markCardTiming } from '@/lib/review-fold.logic';

const REVIEW = readFileSync(join(__dirname, '..', 'src', 'app', 'review.tsx'), 'utf8');
const spoken = { typed: false, userText: null, editing: false, proposed: 2 };
const shows = (o: { applies: boolean; toggled: boolean | null; screenReader: boolean }) => foldedControlsShow({ applies: o.applies, open: foldIsOpen(o) });

describe('[QD-01] opens folded', () => {
  it('a spoken letter with a proposed fix and no screen reader hides the three controls', () => {
    expect(foldApplies(spoken)).toBe(true);
    expect(shows({ applies: true, toggled: null, screenReader: false })).toBe(false);
  });
  it('the count row is drawn whenever the fold applies, and the three controls sit behind the same flag', () => {
    expect(REVIEW).toMatch(/applies \? \(\s*<Pressable/);
    expect(REVIEW).toMatch(/showViewControl\(proposed\) && foldedShow &&/);
    expect(REVIEW).toMatch(/applied\.length > 0 && foldedShow &&/);
    expect(REVIEW).toMatch(/!later && foldedShow &&/);
  });
});

describe('[QD-02] one tap opens every control', () => {
  it('a tap opens all three together and a second tap folds them', () => {
    const first = foldToggledTo(foldIsOpen({ applies: true, toggled: null, screenReader: false }));
    expect(first).toBe(true);
    expect(shows({ applies: true, toggled: first, screenReader: false })).toBe(true);
    const second = foldToggledTo(foldIsOpen({ applies: true, toggled: first, screenReader: false }));
    expect(shows({ applies: true, toggled: second, screenReader: false })).toBe(false);
  });
  it('the row is one button that speaks expanded or collapsed, wraps, and is at least 44 pt', () => {
    expect(REVIEW).toMatch(/accessibilityState=\{\{ expanded: foldOpen \}\}/);
    expect(REVIEW).toMatch(/accessibilityHint=\{foldHint\(foldOpen\)\}/);
    expect(REVIEW).toMatch(/className="min-h-12 flex-row[^"]*"\s+testID="review\.count"/);
    expect(REVIEW).toMatch(/variant="subhead" className="flex-1">\{countText\}/);
    const row = REVIEW.slice(REVIEW.indexOf('{applies ? ('), REVIEW.indexOf('{applies ? (') + 1500);
    expect(row).not.toMatch(/numberOfLines/);
    expect(tokens.target.min).toBeGreaterThanOrEqual(44);
  });
  it('the hint says what a tap does from the state it is in', () => {
    expect(foldHint(false)).toBe(copy.review.foldOpenHint);
    expect(foldHint(true)).toBe(copy.review.foldCloseHint);
  });
});

describe('[QD-03] way back stays', () => {
  it('the count row is there in "Exactly as said" and after every fix is put back', () => {
    // The fold depends on the proposal, not on the view or on how many fixes are in force.
    expect(foldApplies({ ...spoken, proposed: 3 })).toBe(true);
    expect(REVIEW).not.toMatch(/applies = foldApplies\(\{[^}]*view/);
  });
  it('its words are the old line outside the count case', () => {
    expect(countRowText({ kind: 'other', applied: 0, other: copy.review.noChangesAfterUndo })).toBe(copy.review.noChangesAfterUndo);
  });
});

describe('[QD-04] nothing to fold', () => {
  it('no proposed fix, a typed letter, the parent own words or editing: no fold and the controls show', () => {
    for (const o of [{ ...spoken, proposed: 0 }, { ...spoken, typed: true }, { ...spoken, userText: 'my words' }, { ...spoken, editing: true }]) {
      expect(foldApplies(o)).toBe(false);
      expect(shows({ applies: false, toggled: null, screenReader: false })).toBe(true);
    }
  });
});

describe('[QD-05] marks never folded', () => {
  it('the words are not behind the fold flag', () => {
    const words = REVIEW.slice(REVIEW.indexOf('<Transcript'), REVIEW.indexOf('</Transcript') > 0 ? REVIEW.indexOf('</Transcript') : REVIEW.indexOf('/>', REVIEW.indexOf('<Transcript')));
    expect(words).not.toMatch(/foldedShow|foldOpen|applies/);
    expect(REVIEW).toMatch(/edits=\{view === 'fixes' \? applied : undefined\}/);
  });
});

describe('[QD-06] no wide claim', () => {
  it('the count row words say marked and none of every, all, exactly, nothing else', () => {
    for (const text of [countRowText({ kind: 'count', applied: 1, other: '' }), countRowText({ kind: 'count', applied: 4, other: '' })]) {
      expect(text).toMatch(/marked in your words/);
      expect(text).not.toMatch(/\b(every|all|exactly|nothing else)\b/i);
    }
    expect(countRowText({ kind: 'count', applied: 1, other: '' })).toBe(copy.review.changesMarkedOne);
    expect(countRowText({ kind: 'count', applied: 4, other: '' })).toBe('4 small fixes, marked in your words.');
  });
});

describe('[QD-07] keep unchanged', () => {
  it('the Keep path reads nothing of the fold', () => {
    // From `save` to the end of `keepTo`: the whole Keep step.
    const keep = REVIEW.slice(REVIEW.indexOf('const save = async'), REVIEW.indexOf('const dismissFirstNote'));
    expect(keep.length).toBeGreaterThan(1500);
    expect(keep).not.toMatch(/foldToggled|foldOpen|foldedShow|applies/);
    expect(REVIEW).toMatch(/keepTo\(primaryDestination\(\{ saveFailed, lastInBook: lastDestination\.current \}\)\)/);
    expect(REVIEW).toMatch(/onPress=\{\(\) => keepTo\(false\)\}/);
  });
});

describe('[QD-08] one line each', () => {
  it('each button has its line from content, no printed book, and the button carries it as its hint', () => {
    for (const k of ['add', 'private'] as const) {
      expect(keepLine(k).length).toBeGreaterThan(0);
      expect(keepLine(k)).not.toMatch(/print/i);
    }
    expect(keepLine('add')).toBe(copy.review.destination.addLine);
    expect(keepLine('private')).toBe(copy.review.destination.privateLine);
    expect(REVIEW).toMatch(/accessibilityHint=\{lines \? keepLine\('add'\)/);
    expect(REVIEW).toMatch(/accessibilityHint=\{lines \? keepLine\('private'\)/);
  });
  it('the visible line is footnote size, muted, and hidden from VoiceOver so it is not read twice', () => {
    const fn = REVIEW.slice(REVIEW.indexOf('function KeepLine'), REVIEW.indexOf('function KeepLine') + 500);
    expect(fn).toMatch(/variant="footnote"/);
    expect(fn).toMatch(/tone="muted"/);
    expect(fn).toMatch(/accessibilityElementsHidden/);
    expect(fn).toMatch(/no-hide-descendants/);
  });
});

describe('[QD-09] failed state unchanged', () => {
  it('the lines are not shown after a failed save or while editing', () => {
    expect(keepLinesShow({ saveFailed: true, editing: false })).toBe(false);
    expect(keepLinesShow({ saveFailed: false, editing: true })).toBe(false);
    expect(keepLinesShow({ saveFailed: false, editing: false })).toBe(true);
    expect(REVIEW).toMatch(/keepLinesShow\(\{ saveFailed, editing \}\)/);
  });
});

describe('[QD-10] fold does not persist', () => {
  it('the choice is a per-Review flag that starts unchosen and is never stored', () => {
    expect(REVIEW).toMatch(/useState<boolean \| null>\(null\)/);
    expect(REVIEW).not.toMatch(/setSetting\([^)]*fold/i);
    expect(foldIsOpen({ applies: true, toggled: null, screenReader: false })).toBe(false);
  });
});

describe('[QD-11] unfolded for a screen reader', () => {
  it('a screen reader with a proposed fix gets the controls without a tap, and the row still toggles them', () => {
    expect(shows({ applies: true, toggled: null, screenReader: true })).toBe(true);
    expect(foldIsOpen({ applies: true, toggled: foldToggledTo(true), screenReader: true })).toBe(false);
  });
  it('the screen reader comes from useScreenReader, not a separate flag', () => {
    expect(REVIEW).toMatch(/const screenReader = useScreenReader\(\)/);
    expect(REVIEW).toMatch(/foldIsOpen\(\{ applies, toggled: foldToggled, screenReader \}\)/);
    expect(REVIEW).not.toMatch(/fixesOpen/);
  });
});

describe('[BL-1754] Review motion reads the tokens', () => {
  it('the mark card entry and the wash timer have no typed number', () => {
    expect(REVIEW).not.toMatch(/FadeIn\.delay\(\s*\d/);
    expect(REVIEW).not.toMatch(/setTimeout\([^;]*,\s*\d+\s*\)/);
    expect(REVIEW).toMatch(/setTimeout\(\(\) => setWash\(false\), tokens\.motion\.newMarkMs\)/);
  });
  it('the card waits 80 ms and fades in 160 ms, and under Reduce Motion waits for nothing and fades over fadeMs', () => {
    expect(markCardTiming(false)).toEqual({ delayMs: 80, ms: 160 });
    expect(markCardTiming(true)).toEqual({ delayMs: 0, ms: tokens.motion.fadeMs });
    expect(tokens.motion.markCard).toEqual({ delayMs: 80, ms: 160 });
  });
});
