/// <reference types="node" />
/**
 * Review and Write (EXPERIENCE_PASS_2026-10 S17 to S21, S23 and section 5.8 rows 4a to 5c, package P4b). The keep
 * intent and the saved moment's timeline are pure and run here; Node cannot load React Native, so the screens' use
 * of them is checked in their source. Fixtures: the fictional family Asha only (CLAUDE.md).
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { en } from '@scribe/content';
import { tokens } from '@scribe/design-tokens';
import { afterEach, describe, expect, it } from 'vitest';
import { KEEP_ARM_WINDOW_MS, armKeep, consumeKeep, resetKeep } from '../src/lib/capture/keep-intent';
import { fileIntoMonthPlan } from '../src/lib/transitions.logic';

const src = (p: string) => readFileSync(join(__dirname, '..', 'src', p), 'utf8');
const code = (s: string) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');
const review = code(src('app/review.tsx'));
const write = code(src('app/write.tsx'));
const moment = code(src('components/capture/saved-moment.tsx'));
const sheet = code(src('components/capture/letter-sheet.tsx'));

describe('S20: a typed letter keeps from Write with one tap (the keep intent)', () => {
  afterEach(() => resetKeep());

  it('only a tap arms it, for that draft, once', () => {
    armKeep('d1', true, 1000);
    expect(consumeKeep('d1', 1500)).toEqual({ inBook: true });
    expect(consumeKeep('d1', 1600)).toBeNull();
  });

  it('carries the destination the person chose', () => {
    armKeep('d1', false, 0);
    expect(consumeKeep('d1', 10)).toEqual({ inBook: false });
  });

  it('a link, a restored screen or another draft never keeps anything by itself', () => {
    expect(consumeKeep('d1', 0)).toBeNull();
    armKeep('d1', true, 0);
    expect(consumeKeep('d2', 10)).toBeNull();
    expect(consumeKeep('d1', 20)).toBeNull(); // spent by the other Review, never replayed
    armKeep('d1', true, 0);
    expect(consumeKeep(undefined, 10)).toBeNull();
  });

  it('only for a moment', () => {
    armKeep('d1', true, 0);
    expect(consumeKeep('d1', KEEP_ARM_WINDOW_MS + 1)).toBeNull();
    armKeep('d1', true, 0);
    expect(consumeKeep('d1', KEEP_ARM_WINDOW_MS)).toEqual({ inBook: true });
  });

  it('Write arms it after the words are on the phone, then hands over to Review: no second Keep step', () => {
    const keep = write.slice(write.indexOf('const keep = (inBook: boolean)'), write.indexOf('if (!child) return null;'));
    expect(keep).toMatch(/if \(!persist\(text\) \|\| !draftId\.current\) return;\s*armKeep\(draftId\.current, inBook\);\s*router\.replace\(\{ pathname: '\/review', params: \{ draftId: draftId\.current \} \}\)/);
    expect(write).not.toMatch(/keepGateFor|keepLetterGate|saveLetterFromDraft|decideKeepLetter/);
  });

  it('Review runs its own one Keep step at once for it, and never for a spoken letter', () => {
    expect(review).toMatch(/keepIntent\.current = consumeKeep\(draftId\)/);
    expect(review).toMatch(/if \(intent && phase === 'ready' && typed\) keepTo\(intent\.inBook\)/);
    // After the Plus sheet or a failed save, it is the ordinary Review again.
    expect(review).toMatch(/if \(gate \|\| saveFailed\) setKeeping\(false\)/);
  });
});

describe('S21: the saved moment (MOTION 5e, 5.8 rows 5 and 5a)', () => {
  it('runs on the P1 timeline from tokens: chip at 250 ms, leaves at 550 ms, done by 900 ms', () => {
    const p = fileIntoMonthPlan(false);
    expect(p).toMatchObject({ scaleTo: tokens.motion.file.scale, chipAtMs: 250, moveAtMs: 550, dy: 24, dismissAtMs: 900 });
    // The words are at part strength only while the card leaves: 350 ms.
    expect(p.dismissAtMs - p.moveAtMs!).toBe(350);
    expect(moment).toMatch(/const plan = fileIntoMonthPlan\(reduced\)/);
    expect(moment).toMatch(/const t = setTimeout\(finish, plan\.dismissAtMs\)/);
  });

  it('Reduce Motion: the chip and the line fade in, nothing travels, then the Book', () => {
    const p = fileIntoMonthPlan(true);
    expect(p).toMatchObject({ scaleTo: 1, chipAtMs: 0, chipFadeMs: tokens.motion.fadeMs, moveAtMs: null, dy: 0, dismissAtMs: 900 });
  });

  it('commits first: nothing moves until the save has committed, and a tap skips to the end', () => {
    expect(moment).toMatch(/if \(!committed\) return;/);
    expect(moment).toMatch(/if \(!committed \|\| done\.current\) return;/);
    expect(review).toMatch(/committed=\{phase === 'saved'\}/);
    const finish = review.slice(review.indexOf('const finishSave = '), review.indexOf('const devPass'));
    expect(finish.indexOf("haptic('success')")).toBeLessThan(finish.indexOf("setPhase('saved')"));
  });

  it('the line is in text with a success check, never green words; the words are never ghosted', () => {
    expect(moment).toMatch(/<CheckCircleIcon size=\{18\} color=\{c\.success\} weight="fill" \/>\s*<Text variant="callout">\{line\}<\/Text>/);
    expect(moment).not.toMatch(/tone="success"/);
    expect(moment).toMatch(/<ExcerptFade text=\{words\} lines=\{SAVED_CARD_LINES\} variant="letterBody" surface=\{c\.surfaceRaised\} \/>/);
  });

  it('the chip carries the website\'s lit edge, and a plain line under Increase Contrast or Reduce Transparency', () => {
    expect(moment).toMatch(/const LIT_EDGE = `\$\{tokens\.atmosphere\.tone\.amber\}66`/);
    expect(moment).toMatch(/borderColor: highContrast \|\| reduceTransparency \? c\.line : LIT_EDGE/);
  });

  it('lands on the Book of the book the letter was kept in, on the new letter, with no stop on Tonight', () => {
    const land = review.slice(review.indexOf('const land = () =>'), review.indexOf('const finishSave = '));
    expect(land).toMatch(/setActiveChildId\(child\.id\);\s*router\.dismissTo\(\{ pathname: '\/book', params: arrivalParams\(\{ entryId: draft\.id, secondFree \}\) \}\)/);
    expect(land).not.toMatch(/router\.back\(\)/);
  });

  it('5.8 row 5b: the first-letter sign-in sheet rises over the Book after the landing, never in place of Review', () => {
    expect(review).toMatch(/offerSignIn\.current = firstLetter && auth\.configured && auth\.state\.status === 'signedOut'/);
    expect(review).toMatch(/setTimeout\(\(\) => router\.push\(\{ pathname: '\/sign-in', params: \{ trigger: 'first_letter' \} \}\), signInAfterLandingMs\(motion\.reduced\)\)/);
    expect(review).not.toMatch(/router\.replace\(\{ pathname: '\/sign-in'/);
  });

  it('the second-free line is no longer under the chip (the Book shows it after the landing)', () => {
    expect(review).not.toMatch(/keepGate\.secondFreeNote/);
  });
});

describe('S17: Review reads as a letter', () => {
  it('the letter sits on the sheet with its header, and the permanent "we" line is gone', () => {
    expect(review).toMatch(/<LetterSheet\s+header=\{header\}\s+editing=\{editing\}/);
    expect(review).not.toMatch(/r\.trustLine|r\.destination\.privateHelp|r\.subtitle/);
    expect(sheet).toMatch(/accessibilityLabel=\{onChangeBook \? undefined : header\.toSpoken\}/);
  });

  it('the sheet: surfaceRaised, xl top and md bottom corners, elevation 2 on paper, a line edge on night paper, 20 pt padding', () => {
    expect(sheet).toMatch(/backgroundColor: c\.surfaceRaised/);
    expect(sheet).toMatch(/borderTopLeftRadius: tokens\.radius\.xl/);
    expect(sheet).toMatch(/borderBottomLeftRadius: tokens\.radius\.md/);
    expect(sheet).toMatch(/const e = tokens\.elevation\[2\]/);
    expect(sheet).toMatch(/scheme === 'dark'\s*\?\s*\{ borderWidth: 1, borderColor: c\.line \}/);
    expect(sheet).toMatch(/padding: tokens\.space\[5\]/);
  });

  it('the fix rows fold behind one disclosure row; every mark stays tappable in the letter', () => {
    expect(review).toMatch(/accessibilityState=\{\{ expanded: fixesOpen \}\}/);
    expect(review).toMatch(/view === 'fixes' && applied\.length > 0 && fixesOpen &&/);
  });

  it('a failed save keeps the letter, relabels the primary and says so directly above it', () => {
    const footer = review.slice(review.indexOf('const footer ='), review.indexOf('const keepFooter'));
    expect(footer.indexOf('{r.saveFailed}')).toBeGreaterThan(-1);
    expect(footer.indexOf('{r.saveFailed}')).toBeLessThan(footer.indexOf('savePrimaryLabel('));
    expect(en.review.saveFailed).toBe('Your words are still here. That did not work this time.');
  });

  it('a repaired name shows the struck heard word, then the kept word on a wash', () => {
    const t = code(src('components/capture/transcript.tsx'));
    expect(t).toMatch(/shows\?\.kind === 'change'/);
    expect(t).toMatch(/textDecorationLine: 'line-through'[^}]*color: c\.textMuted \}\}>\{shows\.from\}/);
    expect(t).toMatch(/<Text style=\{\{ backgroundColor: c\.accentSoft/);
  });
});

describe('S18: changing words in place', () => {
  it('no box inside the letter: the sheet\'s edge becomes the 1.5 pt accent line, Done in the header and above the keyboard', () => {
    expect(sheet).toMatch(/editing\s*\?\s*\{ borderWidth: tokens\.stroke\.selected, borderColor: c\.accent \}/);
    expect(review).not.toMatch(/tokens\.focusRing\.width/);
    expect(review).toMatch(/testID="review\.edit\.doneHeader"/);
    expect(review).toMatch(/<InputAccessoryView nativeID=\{EDIT_ACCESSORY_ID\}>/);
  });

  it('the person\'s edits are stored as theirs (userText becomes the final text, never re-cleaned)', () => {
    expect(review).toMatch(/const finalText = userText \?\? cleanedText;/);
    expect(review).toMatch(/onChangeText=\{setUserText\}/);
  });
});

describe('S19: Write', () => {
  it('is the one sheet that is a room: the still write lamp', () => {
    expect(write).toMatch(/<Lamp scene="write" \/>/);
  });

  it('the prompt is the literary line; the destinations wait above the keyboard, off until there is text', () => {
    expect(write).toMatch(/<Text variant="prompt" tone="muted" testID="write\.prompt">/);
    expect(write).toMatch(/label=\{addButtonLabel\(child\.name\)\} onPress=\{\(\) => keep\(true\)\} disabled=\{empty\}/);
    expect(write).toMatch(/label=\{copy\.review\.destination\.privateButton\} onPress=\{\(\) => keep\(false\)\} disabled=\{empty\}/);
    expect(write).not.toMatch(/typing\.saveButton/);
  });

  it('a write that fails says "Not saved yet" in the autosave line\'s place, in text (lit paper: no status colour)', () => {
    expect(write).toMatch(/setSaveState\('failed'\)/);
    expect(write).toMatch(/\{copy\.write\.notSaved\}/);
    expect(write).not.toMatch(/tone="caution"|c\.caution/);
    expect(en.write.notSaved).toBe('Not saved yet');
  });

  it('typed words are never touched by the machine (no engine call in Write)', () => {
    expect(write).not.toMatch(/cleanSpoken|faithfulClean|applyEdits|withoutEdit/);
  });
});

describe('S23: Review opened with no draft', () => {
  it('"Nothing to read back here", the page drawing, one way to the book, no error, nothing to try again', () => {
    const empty = review.slice(review.indexOf('if (!draft || !child) {'), review.indexOf('const line = countLine'));
    expect(empty).toMatch(/kind="notFound"/);
    expect(empty).toMatch(/title=\{r\.noDraft\.title\}/);
    expect(empty).toMatch(/label: r\.noDraft\.button, onPress: \(\) => router\.dismissTo\('\/book'\)/);
    expect(empty).not.toMatch(/errors\.generic|body=/);
    expect(en.review.noDraft.title).toBe('Nothing to read back here');
  });
});
