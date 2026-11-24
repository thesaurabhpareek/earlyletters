/// <reference types="node" />
/**
 * BL-1984, spec 14 (docs/design/specs/14-REVIEW-QUIET-DEFAULT-23nov.md) section 6: Review opens folded, QD-01 to QD-11,
 * and the two lines under the Keep buttons (QD-08, QD-09). Screens do not load in Node: the rules are pure functions in
 * review-view.logic.ts and run here, and the screen's use of them is read from its source. Each requirement has a
 * mutant, a wrong version of the same rule or source, and the test shows the check fails on it, so a check that cannot
 * fail does not pass. Nothing here was run on a device. Fixtures: the fictional family Asha only.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { en } from '@scribe/content';
import { tokens } from '@scribe/design-tokens';
import { describe, expect, it } from 'vitest';
import { foldRowHint, foldRowText, foldStartsOpen, keepLines, quietFold } from '../src/components/capture/review-view.logic';

const read = (p: string) => readFileSync(join(__dirname, '..', p), 'utf8');
const code = (s: string) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');
const review = code(read('src/app/review.tsx'));
const slice = (src: string, from: string, to: string) => src.slice(src.indexOf(from), src.indexOf(to, src.indexOf(from)));

type Fold = typeof quietFold;
const two = { typed: false, userText: null, proposed: 2, open: false };
const mutate = (f: Fold, patch: Partial<ReturnType<Fold>>): Fold => (i) => ({ ...f(i), ...patch });

/** A check passes on the real thing and fails on its mutant. */
function proves<T>(check: (x: T) => boolean, real: T, mutant: T) {
  expect(check(real)).toBe(true);
  expect(check(mutant)).toBe(false);
}

describe('[QD-01] opens folded', () => {
  const check = (f: Fold) => {
    const s = f(two);
    return s.countRow && !s.viewControl && !s.fixRows && !s.changeWords;
  };
  it('the count row is shown; the view control, the fix rows and Change words are not', () => {
    proves(check, quietFold, mutate(quietFold, { viewControl: true }));
    proves(check, quietFold, mutate(quietFold, { changeWords: true }));
    proves(check, quietFold, mutate(quietFold, { fixRows: true }));
    proves(check, quietFold, mutate(quietFold, { countRow: false }));
  });
  it('the screen draws the view control, the rows and Change words from the fold, not from their own conditions', () => {
    const wired = (src: string) =>
      /\{fold\.viewControl && <ViewControl/.test(src) && /!later && fold\.changeWords &&/.test(src) && /fold\.countRow \?/.test(src);
    proves(wired, review, review.replace('fold.viewControl && <ViewControl', 'showViewControl(proposed) && <ViewControl'));
    proves(wired, review, review.replace('!later && fold.changeWords &&', '!later &&'));
  });
});

describe('[QD-02] one tap opens every control', () => {
  it('opened, the view control, the fix rows and Change words are all there', () => {
    const check = (f: Fold) => {
      const s = f({ ...two, open: true });
      return s.countRow && s.viewControl && s.fixRows && s.changeWords;
    };
    proves(check, quietFold, mutate(quietFold, { changeWords: false }));
    proves(check, quietFold, mutate(quietFold, { viewControl: false }));
  });
  it('the row is one control: a button that says expanded, with a hint, 48 pt, its words wrap beside the chevron (AX5)', () => {
    const row = slice(review, 'fold.countRow ? (', ') : (');
    const check = (src: string) =>
      /accessibilityRole="button"/.test(src) &&
      /accessibilityState=\{\{ expanded: fixesOpen \}\}/.test(src) &&
      /accessibilityHint=\{foldRowHint\(fixesOpen\)\}/.test(src) &&
      /min-h-12/.test(src) &&
      /<Text variant="subhead" className="flex-1">/.test(src) &&
      !/numberOfLines/.test(src) &&
      /CaretDownIcon[\s\S]*CaretRightIcon/.test(src);
    proves(check, row, row.replace('className="flex-1"', ''));
    proves(check, row, row.replace('<Text variant="subhead" className="flex-1">', '<Text variant="subhead" numberOfLines={1} className="flex-1">'));
    proves(check, row, row.replace('min-h-12', 'min-h-8'));
    proves(check, row, row.replace('expanded: fixesOpen', 'expanded: true'));
  });
  it('the hint says what a tap does from where it is; the open state itself is spoken by the control', () => {
    expect(foldRowHint(false)).toBe(en.review.foldOpenHint);
    expect(foldRowHint(true)).toBe(en.review.foldCloseHint);
  });
  it('a tap on the row toggles one flag, so the three open and fold together', () => {
    expect(review).toMatch(/setFixesOpen\(\(o\) => !o\)/);
    expect(review).toMatch(/quietFold\(\{ typed, userText, proposed, open: fixesOpen \}\)/);
  });
});

describe('[QD-03] way back stays', () => {
  it('after "Exactly as said", and after every fix is put back, the count row is still there', () => {
    const check = (f: Fold) => f(two).countRow && f({ ...two, proposed: 1 }).countRow;
    proves(check, quietFold, ((i) => ({ ...quietFold(i), countRow: false })) as Fold);
    // The row is driven by what the machine proposed, which neither choosing "Exactly as said" nor a put-back changes.
    const text = (view: 'fixes' | 'exact', applied: number) => foldRowText({ view, applied, proposed: 2 });
    expect(text('exact', 0)).toBe('2 small fixes');
    expect(text('fixes', 0)).toBe(en.review.noChangesAfterUndo);
    expect(text('fixes', 2)).toBe('2 small fixes, marked in your words.');
    const wired = (src: string) => /const fold = quietFold\(\{ typed, userText, proposed, open: fixesOpen \}\)/.test(src) && !/fold\.countRow[^\n]*view/.test(src);
    proves(wired, review, review.replace('proposed, open: fixesOpen', 'proposed: applied.length, open: fixesOpen'));
  });
});

describe('[QD-04] nothing to fold', () => {
  it('with no proposed fix, Change words is visible and there is no fold', () => {
    const check = (f: Fold) => {
      const s = f({ ...two, proposed: 0 });
      return !s.countRow && s.changeWords && !s.viewControl && !s.fixRows;
    };
    proves(check, quietFold, mutate(quietFold, { changeWords: false }));
    proves(check, quietFold, mutate(quietFold, { countRow: true }));
  });
  it('a typed letter and a letter with the person\'s own words have no fold either', () => {
    expect(quietFold({ ...two, typed: true }).changeWords).toBe(true);
    expect(quietFold({ ...two, typed: true }).countRow).toBe(false);
    expect(quietFold({ ...two, userText: 'Asha laughed.' }).changeWords).toBe(true);
    expect(quietFold({ ...two, userText: 'Asha laughed.' }).countRow).toBe(false);
  });
});

describe('[QD-05] marks never folded', () => {
  it('the letter sheet and its marks do not read the fold', () => {
    const sheet = slice(review, '<LetterSheet', '</LetterSheet>');
    expect(sheet.length).toBeGreaterThan(200);
    expect(sheet).toMatch(/card=\{openE && view === 'fixes' \? markCard : null\}/);
    const check = (src: string) => !/fixesOpen|fold\./.test(src);
    proves(check, sheet, sheet.replace('card={openE', 'card={fixesOpen && openE'));
    proves(check, sheet, sheet.replace('<LetterSheet', '<LetterSheet hidden={fold.countRow}'));
  });
  it('the fold shows and hides controls only: no field of it is about the words', () => {
    expect(Object.keys(quietFold(two)).sort()).toEqual(['changeWords', 'countRow', 'fixRows', 'viewControl']);
  });
});

describe('[QD-06] no wide claim', () => {
  const WIDE = /\b(every|all|exactly|nothing else)\b/i;
  const check = (lines: string[]) => lines.every((l) => !WIDE.test(l));
  it('the count line words hold none of "every", "all", "exactly", "nothing else"', () => {
    const real = [en.review.changesMarked, en.review.changesMarkedOne, foldRowText({ view: 'fixes', applied: 1, proposed: 2 }), foldRowText({ view: 'fixes', applied: 3, proposed: 3 }), foldRowText({ view: 'exact', applied: 0, proposed: 3 })];
    proves(check, real, [...real, 'Every small fix is marked in your words.']);
    proves(check, real, [...real, 'Nothing else changed.']);
    expect(real.every((l) => l.includes('small fix'))).toBe(true);
  });
  it('it says the fixes are marked, beside the count, and nothing wider', () => {
    expect(en.review.changesMarked).toBe('{count} small fixes, marked in your words.');
    expect(en.review.changesMarkedOne).toBe('1 small fix, marked in your words.');
  });
});

describe('[QD-07] keep unchanged', () => {
  it('Keep and Keep private read neither the fold nor its state, and still go through keepTo and the Plus gate', () => {
    const footer = slice(review, 'const footer =', 'const keepFooter');
    const check = (src: string) =>
      /onPress=\{\(\) => keepTo\(primaryDestination\(\{ saveFailed, lastInBook: lastDestination\.current \}\)\)\}/.test(src) &&
      /onPress=\{\(\) => keepTo\(false\)\}/.test(src) &&
      !/fixesOpen|fold\.|quietFold/.test(src);
    proves(check, footer, footer.replace('disabled={!finalText.trim()}', 'disabled={!finalText.trim() || fixesOpen}'));
    proves(check, footer, footer.replace('keepTo(false)', 'keepTo(fold.countRow)'));
    const keepTo = slice(review, 'const keepNeedsPlus = ', 'const keepTo = (inBook');
    expect(keepTo.length).toBeGreaterThan(100);
    expect(keepTo).toMatch(/keepNeedsPlus/);
    proves((src: string) => !/fixesOpen|fold\./.test(src), keepTo, `${keepTo} if (fixesOpen) return;`);
  });
});

describe('[QD-08] one line each', () => {
  const lines = keepLines({ saveFailed: false })!;
  it('each button has one line from the content keys, and neither mentions a printed book', () => {
    expect(lines.add).toBe(en.review.destination.addLine);
    expect(lines.private).toBe(en.review.destination.privateLine);
    const check = (l: { add: string; private: string }) => !/print|paper|hardcover|bound/i.test(`${l.add} ${l.private}`) && l.add.length > 0 && l.private.length > 0;
    proves(check, lines, { ...lines, add: 'It goes in the book and in the printed book.' });
  });
  it('the line is the button\'s spoken hint, and the visible line is hidden from the screen reader so it is read once', () => {
    const footer = slice(review, 'const footer =', 'const keepFooter');
    const check = (src: string) =>
      /accessibilityHint=\{keepLine\?\.add\}/.test(src) &&
      /accessibilityHint=\{keepLine\?\.private\}/.test(src) &&
      /<KeepLine text=\{keepLine\.add\}/.test(src) &&
      /<KeepLine text=\{keepLine\.private\}/.test(src);
    proves(check, footer, footer.replace('accessibilityHint={keepLine?.add}', ''));
    proves(check, footer, footer.replace('<KeepLine text={keepLine.private}', '<KeepLine text={"x"}'));
    const component = slice(review, 'function KeepLine', '\n}\n');
    const hidden = (src: string) => /variant="footnote" tone="muted"/.test(src) && /accessibilityElementsHidden/.test(src) && /importantForAccessibility="no-hide-descendants"/.test(src);
    proves(hidden, component, component.replace('accessibilityElementsHidden', ''));
    proves(hidden, component, component.replace('tone="muted"', 'tone="default"'));
  });
});

describe('[QD-09] failed state unchanged', () => {
  it('after a save that did not work there are no lines, and the caution line is still above "Try again"', () => {
    expect(keepLines({ saveFailed: true })).toBeNull();
    const check = (f: typeof keepLines) => f({ saveFailed: true }) === null && f({ saveFailed: false }) !== null;
    proves(check, keepLines, ((i: { saveFailed: boolean }) => (i.saveFailed ? { add: 'a', private: 'b' } : null)) as typeof keepLines);
    const footer = slice(review, 'const footer =', 'const keepFooter');
    expect(footer).toMatch(/\{saveFailed && \(\s*<Text[^>]*testID="review\.saveFailed"/);
    expect(footer.indexOf('{r.saveFailed}')).toBeLessThan(footer.indexOf('savePrimaryLabel('));
    expect(review).toMatch(/const keepLine = keepLines\(\{ saveFailed \}\)/);
  });
});

describe('[QD-10] fold does not persist', () => {
  it('a new Review starts folded: the open flag starts false and is never written to a setting', () => {
    expect(foldStartsOpen(false)).toBe(false);
    const check = (src: string) => /const \[fixesOpen, setFixesOpen\] = useState\(false\);/.test(src) && !/(setSetting|getSetting)\([^)]*(fold|fixesOpen)/i.test(src);
    proves(check, review, review.replace('useState(false);\n  // With a screen reader', 'useState(true);\n  // With a screen reader').replace('const [fixesOpen, setFixesOpen] = useState(false)', 'const [fixesOpen, setFixesOpen] = useState(true)'));
    proves(check, review, `${review}\nsetSetting('review.foldOpen', fixesOpen ? '1' : '0');`);
  });
});

describe('[QD-11] unfolded for a screen reader', () => {
  it('with a screen reader on, the fold starts open, so the rows, the view control and Change words are there without a tap', () => {
    proves((f: (sr: boolean) => boolean) => f(true) === true && f(false) === false, foldStartsOpen, (() => false) as (sr: boolean) => boolean);
    const open = quietFold({ ...two, open: foldStartsOpen(true) });
    expect(open).toEqual({ countRow: true, viewControl: true, fixRows: true, changeWords: true });
  });
  it('it reads useScreenReader, not a separate flag', () => {
    const check = (src: string) => /const screenReader = useScreenReader\(\);\s*useEffect\(\(\) => \{\s*if \(screenReader\) setFixesOpen\(true\);\s*\}, \[screenReader\]\);/.test(src);
    proves(check, review, review.replace('const screenReader = useScreenReader();', 'const [screenReader] = useState(false);'));
    proves(check, review, review.replace('if (screenReader) setFixesOpen(true);', 'if (screenReader) setFixesOpen(false);'));
  });
});

describe('[BL-1984] motion tokens (BL-1754, CDESO-3)', () => {
  it('the mark card enters on tokens.motion.markCard and Reduce Motion drops the wait for the fade', () => {
    expect(tokens.motion.markCard).toEqual({ delayMs: 80, ms: 160 });
    const check = (src: string) =>
      /motion\.reduced \? FadeIn\.duration\(tokens\.motion\.fadeMs\) : FadeIn\.delay\(tokens\.motion\.markCard\.delayMs\)\.duration\(tokens\.motion\.markCard\.ms\)/.test(src);
    proves(check, review, review.replace('FadeIn.delay(tokens.motion.markCard.delayMs)', 'FadeIn.delay(80)'));
  });
  it('the new-mark wash lasts newMarkMs', () => {
    const check = (src: string) => /setTimeout\(\(\) => setWash\(false\), tokens\.motion\.newMarkMs\)/.test(src);
    proves(check, review, review.replace('tokens.motion.newMarkMs', '1600'));
    expect(tokens.motion.newMarkMs).toBe(1600);
  });
});
