/// <reference types="node" />
/**
 * The P4 critics' pass, the items fixed before build 2 (docs/design/reviews/P4_CRITICS_PASS_2026-10-24.md; package
 * P4c): M1 (the marks in the letter's face), S1 (no "Saved on this phone" over unsaved changes), S2 (Write's pair
 * stacked), S3 (VoiceOver reads the letter as it will be kept), S4 (the view control at accessibility sizes), S5
 * (Listen and Write at AX5), S8 (a mark's card under its own line), and #279's two test pins (W1, G3). S6 (the
 * screen-reader hold) is in test/review-write.test.ts. Screens do not load in Node: the rules are pure and run here,
 * and each screen's use of them is checked in its source. Fixtures: the fictional family Asha only (CLAUDE.md).
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { en } from '@scribe/content';
import { faithfulClean, segments as toSegments } from '@scribe/core';
import { tokens } from '@scribe/design-tokens';
import { describe, expect, it } from 'vitest';
import { reviewHasOwnChanges, rowShows } from '../src/components/capture/review-view.logic';
import { cardCutAt, placeAroundCard, struckGaps } from '../src/components/capture/transcript.logic';

const read = (p: string) => readFileSync(join(__dirname, '..', p), 'utf8');
const code = (s: string) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');
const transcript = code(read('src/components/capture/transcript.tsx'));
const review = code(read('src/app/review.tsx'));
const write = code(read('src/app/write.tsx'));

describe('[M1] every mark is drawn in the letter\'s face, at the letter\'s size', () => {
  it('letterBody is Literata 20/32: the face the person\'s words are in', () => {
    expect(tokens.type.letterBody).toMatchObject({ fontFamily: 'Literata-Regular', fontSize: 20, lineHeight: 32 });
  });

  it('every span in the letter, the inner ones too, is a LetterSpan: letterBody with the paragraph\'s Reading Size', () => {
    // The one helper, and the paragraph, are the only two ui Texts in the file; both are letterBody at `scale`.
    expect(transcript).toMatch(/function LetterSpan\(\{ scale, \.\.\.props \}: TextProps & \{ scale: number \}\) \{\s*return <Text variant="letterBody" scale=\{scale\} \{\.\.\.props\} \/>;/);
    const texts = transcript.match(/<Text\b[^>]*/g) ?? [];
    expect(texts).toHaveLength(2);
    for (const t of texts) expect(t).toMatch(/variant="letterBody"[\s\S]*scale=\{scale\}/);
    // Every span names the paragraph's scale; none sets a face or a size of its own.
    const spans = transcript.match(/<LetterSpan\b[^>]*>/g) ?? [];
    expect(spans.length).toBeGreaterThanOrEqual(6); // restored, change (and its 2 inner spans), struck, added
    for (const s of spans) expect(s, s).toMatch(/scale=\{scale\}/);
    expect(transcript).not.toMatch(/fontFamily|fontSize|className=/);
    // The changed word nests twice: the struck heard word and the kept name are LetterSpans inside a LetterSpan.
    const change = transcript.slice(transcript.indexOf("shows?.kind === 'change') {"), transcript.indexOf("taken?.kind === 'struck'"));
    expect(change.match(/<LetterSpan\b/g)).toHaveLength(3);
  });

  it('the spaces around struck words stay outside the strike, so "um," never reads joined to "today"', () => {
    const struck = transcript.slice(transcript.indexOf("if (taken?.kind === 'struck') {"), transcript.indexOf('if (!s.text) {\n      const h'));
    expect(struck).toMatch(/const \[before, after\] = struckGaps\(segments\[i - 1\]\?\.text, taken\.text, segments\[i \+ 1\]\?\.text\);/);
    expect(struck).toMatch(/<Fragment key=\{i\}>\s*\{before\}\s*<LetterSpan/);
    expect(struck).toMatch(/\{taken\.text\}\s*<\/LetterSpan>\s*\{after\}\s*<\/Fragment>/);
    // The words shown (for where lines break) use the same spaces.
    expect(transcript).toMatch(/const \[before, after\] = struckGaps\(segments\[i - 1\]\?\.text, shows\.text, segments\[i \+ 1\]\?\.text\);\s*return `\$\{before\}\$\{shows\.text\}\$\{after\}`;/);
    expect(transcript).not.toMatch(/\bgap\(/);
  });

  it('no space goes in front of a closing mark: "Today you held the spoon, um." shows "spoon~~, um~~." (#290 lens B)', () => {
    // The engine's own edits and segments for Asha letters, then what Transcript draws for each struck removal.
    const shown = (raw: string) => {
      const r = faithfulClean(raw, { level: 'clean', dictionary: [], language: 'en' } as never);
      const segs = toSegments(raw, r.applied);
      return segs
        .map((seg, i) => {
          if (seg.edit === null) return seg.text;
          const shows = rowShows(r.applied[seg.edit]);
          if (seg.text || shows.kind !== 'struck') return seg.text;
          const [before, after] = struckGaps(segs[i - 1]?.text, shows.text, segs[i + 1]?.text);
          return `${before}[${shows.text}]${after}`; // [ ] marks the strike
        })
        .join('');
    };
    expect(shown('Today you held the spoon, um.')).toBe('Today you held the spoon[, um].');
    expect(shown('You laughed, uh, and then um.')).toBe('You laughed, [uh,] and then [um].');
    expect(shown('Asha, um, today you held the spoon.')).toBe('Asha, [um,] today you held the spoon.');
    expect(shown('Um, you slept.')).toBe('[Um,] you slept.');
  });

  it('struckGaps: a space only between two words, never before a closing mark, never doubled', () => {
    expect(struckGaps('spoon', ', um', '.')).toEqual(['', '']);
    expect(struckGaps('and then', 'um', '.')).toEqual([' ', '']);
    expect(struckGaps('Asha, ', 'um,', 'today')).toEqual(['', ' ']);
    expect(struckGaps('you', 'you', 'held')).toEqual([' ', ' ']);
    expect(struckGaps(undefined, 'Um,', 'you')).toEqual(['', ' ']);
    expect(struckGaps('slept', 'um', undefined)).toEqual([' ', '']);
    for (const mark of [',', '.', ';', ':', '!', '?', ')', ']']) expect(struckGaps('spoon', 'um', `${mark} then`)[1], mark).toBe('');
    expect(struckGaps('spoon', 'um', '"Mama," you said')[1]).toBe(' '); // an opening quote is a new word
  });
});

describe('[S1] Close never says "Saved on this phone" over changes only on the screen', () => {
  it('Change words, a fix put back, or the other view are changes Review holds until Keep; going back takes them back', () => {
    const none = { userText: null, applied: 2, proposed: 2, view: 'fixes', openedView: 'fixes' } as const;
    expect(reviewHasOwnChanges(none)).toBe(false);
    expect(reviewHasOwnChanges({ ...none, userText: 'Asha, you held the spoon.' })).toBe(true);
    expect(reviewHasOwnChanges({ ...none, userText: '' })).toBe(true); // every word cleared is a change too
    expect(reviewHasOwnChanges({ ...none, applied: 1 })).toBe(true); // one put back
    expect(reviewHasOwnChanges({ ...none, applied: 0, proposed: 0 })).toBe(false); // nothing proposed
    expect(reviewHasOwnChanges({ ...none, view: 'exact' })).toBe(true); // "Exactly as said" chosen (#289 lens B)
    expect(reviewHasOwnChanges({ ...none, view: 'exact', openedView: 'exact' })).toBe(false); // opened that way (Settings)
  });

  it('the hint is dropped while they are there, and kept otherwise', () => {
    expect(review).toMatch(/closeHint=\{reviewHasOwnChanges\(\{ userText, applied: applied\.length, proposed, view, openedView \}\) \? undefined : pendingCopy\.write\.savedOnPhone\}/);
    expect(review).toMatch(/const \[openedView\] = useState\(view\);/);
    expect(review.match(/closeHint=/g)).toHaveLength(1);
  });
});

describe('[S2] Write\'s two destinations are stacked, as Review\'s footer is', () => {
  it('"Add to Asha\'s book" full width, "Keep private" quiet beneath; no side-by-side row', () => {
    const pair = write.slice(write.indexOf('<View className="gap-1 border-t border-border'), write.indexOf('</KeyboardAvoidingView>'));
    expect(pair).toMatch(/<Button size="lg" fullWidth label=\{addButtonLabel\(child\.name\)\} onPress=\{\(\) => keep\(true\)\} disabled=\{empty\} testID="write\.keep\.book" \/>\s*<Button variant="quiet" fullWidth label=\{copy\.review\.destination\.privateButton\} onPress=\{\(\) => keep\(false\)\} disabled=\{empty\} testID="write\.keep\.private" \/>/);
    expect(write).not.toMatch(/ButtonRow/);
  });
});

describe('[S3] VoiceOver reads the letter as it will be kept, and the fix rows are open', () => {
  it('the paragraph\'s label is the words as kept; the rest of a cut letter is not read twice', () => {
    expect(review).toMatch(/accessibilityLabel=\{finalText\}/);
    expect(transcript).toMatch(/accessibilityLabel=\{key === 'below' \? undefined : accessibilityLabel\}/);
    expect(transcript).toMatch(/accessibilityElementsHidden=\{key === 'below' && !!accessibilityLabel\}/);
    // No hint: iOS replaces a paragraph's hint with "2 buttons found" (#289 lens B); the count row says it right below.
    expect(transcript).not.toMatch(/accessibilityHint=\{accessibilityHint\}|accessibilityHint=\{key/);
    expect(review).not.toMatch(/accessibilityHint=\{line === 'count'/);
  });

  it('with a screen reader on, the marks inside the paragraph are not buttons of their own (iOS would read each by its visible text)', () => {
    expect(transcript).toMatch(/const screenReader = useScreenReader\(\);\s*const role = screenReader \? undefined : \('button' as const\);/);
    const spans = transcript.slice(transcript.indexOf('const render = '), transcript.indexOf('const paragraph = '));
    const letterSpanButtons = spans.match(/<LetterSpan[\s\S]*?accessibilityRole=\{?[^\s>]*/g)?.map((m) => m.slice(m.lastIndexOf('accessibilityRole'))) ?? [];
    expect(letterSpanButtons).toEqual(['accessibilityRole={role}', 'accessibilityRole={role}', 'accessibilityRole={role}']);
  });

  it('with a screen reader on, the fix rows (the path to every mark) start open', () => {
    expect(review).toMatch(/const screenReader = useScreenReader\(\);\s*useEffect\(\(\) => \{\s*if \(screenReader\) setFixesOpen\(true\);\s*\}, \[screenReader\]\);/);
  });
});

describe('[S4] "With small fixes | Exactly as said" at accessibility sizes', () => {
  it('stacks full width with no line limit, so neither label is cut', () => {
    const control = review.slice(review.indexOf('function ViewControl('), review.indexOf('function FixRow('));
    expect(control).toMatch(/const stacked = useIsAccessibilitySize\(\);/);
    expect(control).toMatch(/className=\{stacked \? 'gap-2' : 'flex-row gap-2'\}/);
    expect(control).toMatch(/numberOfLines=\{stacked \? undefined : 2\}/);
    expect(control).toMatch(/className=\{stacked \? 'min-h-11 flex-row[^']*' : 'min-h-11 flex-1 flex-row/); // no flex-1 when stacked
  });
});

describe('[S5] Write at accessibility sizes', () => {
  it('the autosave line moves under the header, where it can wrap, instead of running into Close', () => {
    expect(write).toMatch(/const large = useIsAccessibilitySize\(\);/);
    expect(write).toMatch(/<ModalHeader onClose=\{close\} leading=\{large \? null : status\} \/>\s*\{large && status \? <View className="px-5 pb-1">\{status\}<\/View> : null\}/);
    expect(write.match(/className="shrink"/g)?.length).toBeGreaterThanOrEqual(2); // both lines may wrap
  });
});

describe('[S8] a mark\'s card opens under its own line', () => {
  const shown = ['Asha, ', 'um,', ' today you held the spoon by yourself. You mostly painted ', 'your', ' face.'];

  it('with the lines known: the cut is the end of the line the mark ends on, so no line moves', () => {
    const lines = ['Asha, um, today you held ', 'the spoon by yourself. You ', 'mostly painted your face.'];
    expect(lines.join('')).toBe(shown.join(''));
    expect(cardCutAt({ shown, open: 1, lines })).toBe(lines[0].length); // "um," is on line 1
    expect(cardCutAt({ shown, open: 3, lines })).toBe(shown.join('').length); // "your" is on the last line
  });

  it('a mark that ends exactly where its line ends opens its card under that line, not the next (#289 lens A)', () => {
    // A struck "um," carries the space after it, so its line can end exactly where the mark ends.
    const words = ['Asha, ', 'um, ', 'today you held the spoon by yourself.'];
    const lines = ['Asha, um, ', 'today you held the spoon ', 'by yourself.'];
    expect(lines.join('')).toBe(words.join(''));
    expect(cardCutAt({ shown: words, open: 1, lines })).toBe(10); // under line 1
    expect(cardCutAt({ shown: words, open: 0, lines })).toBe(10); // "Asha, " ends inside line 1: under line 1 too
    expect(cardCutAt({ shown: words, open: 2, lines })).toBe(words.join('').length); // the last word: under the last line
  });

  it('with the lines unknown or not adding up (the web): the cut is the end of the mark\'s sentence', () => {
    const sentence = 'Asha, um, today you held the spoon by yourself. '.length;
    expect(cardCutAt({ shown, open: 1, lines: null })).toBe(sentence);
    expect(cardCutAt({ shown, open: 1, lines: ['Asha, um, today'] })).toBe(sentence);
    expect(cardCutAt({ shown, open: 3, lines: null })).toBe(shown.join('').length); // the last sentence: after it
    expect(cardCutAt({ shown, open: 9, lines: null })).toBe(shown.join('').length); // no such mark: after the letter
  });

  it('a plain run of words is cut in two at the line\'s end; a mark is never cut', () => {
    const at = 'Asha, um, today you held '.length;
    expect(placeAroundCard({ shown, plain: [true, false, true, false, true], at })).toEqual(['above', 'above', { cut: ' today you held '.length }, 'below', 'below']);
    // A mark running over the cut stays whole above it.
    expect(placeAroundCard({ shown: ['Asha ', 'held the spoon'], plain: [true, false], at: 8 })).toEqual(['above', 'above']);
  });

  it('Transcript cuts the letter there and puts the card between; Review hands it the card instead of drawing it after the letter', () => {
    expect(transcript).toMatch(/const at = cardCutAt\(\{ shown, open: openAt, lines: lines\.current \}\);/);
    expect(transcript).toMatch(/\{paragraph\(above, false, 'above'\)\}\s*\{card\}\s*\{below\.length > 0 && paragraph\(below, false, 'below'\)\}/);
    expect(transcript).toMatch(/onTextLayout=\{whole \? \(e\) => \(lines\.current = e\.nativeEvent\.lines\.map\(\(l\) => l\.text\)\) : undefined\}/);
    expect(review).toMatch(/card=\{openE && view === 'fixes' \? markCard : null\}/);
    expect(review.match(/testID="review\.card"/g)).toHaveLength(1);
    expect(review).not.toMatch(/\{openE && view === 'fixes' && userText === null && \(/);
  });
});

describe('#279 re-check pins (W1, G3)', () => {
  it('W1: Write has one write path: createDraft once, setDraftTyped only handed to writeWords', () => {
    expect(write.match(/createDraft\(/g)).toHaveLength(1);
    expect(write.match(/setDraftTyped\(/g)).toBeNull();
    expect(write).toMatch(/writeWords\(\{ create, update: setDraftTyped \}, draftId\.current, value\)/);
  });

  it('G3: the refused-swipe listener is removed with the screen (the effect returns addListener\'s unsubscribe)', () => {
    expect(write).toMatch(/useEffect\(\s*\(\) =>\s*navigation\.addListener\('gestureCancel' as never, \(\) => \{\s*if \(swipeHeld\.current\) closeRef\.current\(\);\s*\}\),\s*\[navigation\],\s*\);/);
  });
});

describe('[S12] the legal record quotes what the app says when the microphone is off', () => {
  it('app-store-privacy-labels.md quotes errors.micDenied, not the old words', () => {
    const doc = readFileSync(join(__dirname, '..', '..', '..', 'docs', 'legal', 'app-store-privacy-labels.md'), 'utf8');
    expect(doc).toContain(`${en.errors.micDenied.title}. ${en.errors.micDenied.body}`);
    expect(doc).not.toContain('Allow the microphone in Settings to speak your letters');
  });
});
