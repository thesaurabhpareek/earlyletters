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
import { afterEach, describe, expect, it, vi } from 'vitest';
import { KEEP_ARM_WINDOW_MS, armKeep, consumeKeep, peekKeep, resetKeep } from '../src/lib/capture/keep-intent';
import { arrivalToastDelayMs, secondFreeOnArrival } from '../src/components/book/book.logic';
import { SCREEN_READER_HOLD_MS, savedMomentLeaveInMs } from '../src/components/capture/review-view.logic';
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

  it('Review\'s first frame can look without spending it; only the mount spends it', () => {
    armKeep('d1', false, 0);
    expect(peekKeep('d1', 10)).toEqual({ inBook: false });
    expect(peekKeep('d1', 20)).toEqual({ inBook: false }); // looking spends nothing
    expect(peekKeep('d2', 20)).toBeNull();
    expect(peekKeep('d1', KEEP_ARM_WINDOW_MS + 1)).toBeNull();
    expect(consumeKeep('d1', 30)).toEqual({ inBook: false });
    expect(peekKeep('d1', 40)).toBeNull();
  });

  it('Review runs its own one Keep step at once for it, and never for a spoken letter', () => {
    // The first frame already holds the sheet still (no flash of the editable letter), from a look that spends nothing.
    expect(review).toMatch(/const \[keeping, setKeeping\] = useState\(\(\) => typed && peekKeep\(draftId\) !== null\)/);
    expect(review).toMatch(/const intent = consumeKeep\(draftId\);\s*if \(intent && phase === 'ready' && typed\) keepTo\(intent\.inBook\);\s*else setKeeping\(false\);/);
    // After the Plus sheet or a failed save, it is the ordinary Review again.
    expect(review).toMatch(/if \(gate \|\| saveFailed\) setKeeping\(false\)/);
  });

  it('a typed letter back in Review (the Plus sheet, a failed save) keeps Write\'s heading, never "Read it back" (M3 condition a)', () => {
    expect(review).toMatch(/\{reviewHeading\(\{ typedOnly: typed && !spoken \}\)\}/);
    expect(review).not.toMatch(/\{r\.title\}/);
  });
});

describe('S21: the saved moment (MOTION 5e, 5.8 rows 5 and 5a)', () => {
  it('runs on the P1 timeline from tokens: chip at 250 ms, leaves at 550 ms, done by 900 ms', () => {
    const p = fileIntoMonthPlan(false);
    expect(p).toMatchObject({ scaleTo: tokens.motion.file.scale, chipAtMs: 250, moveAtMs: 550, dy: 24, dismissAtMs: 900 });
    // The words are at part strength only while the card leaves: 350 ms.
    expect(p.dismissAtMs - p.moveAtMs!).toBe(350);
    expect(moment).toMatch(/const plan = fileIntoMonthPlan\(reduced\)/);
    // With VoiceOver on, the moment holds until its announcement can be heard (next test).
    expect(moment).toMatch(/const screenReader = useScreenReader\(\)/);
  });

  it('with a screen reader on, both paths hold about 3 s from the commit, even when that state arrives after it (follow-up L2)', () => {
    // saved-moment.tsx: the commit effect starts the clock; a second effect times the leaving, again whenever the
    // screen-reader state changes, counting from the commit.
    const commit = moment.slice(moment.indexOf('useEffect(() => {\n    if (!committed) return;'), moment.indexOf('const cardStyle'));
    expect(commit).toMatch(/if \(!committed\) return;\s*committedAt\.current = Date\.now\(\);/);
    expect(commit).toMatch(/useEffect\(\(\) => \{\s*if \(!committed \|\| committedAt\.current === null\) return;\s*const wait = savedMomentLeaveInMs\(\{ dismissAtMs: plan\.dismissAtMs, screenReader, elapsedMs: Date\.now\(\) - committedAt\.current \}\);\s*const t = setTimeout\(finish, wait\);\s*return \(\) => clearTimeout\(t\);[\s\S]*?\}, \[committed, screenReader\]\);/);
    expect(moment).not.toMatch(/savedMomentDoneMs/);
    // The commit effect runs once, at the commit: its deps are exactly [committed]. With screenReader in them, a late
    // screen-reader answer would restart the clock and say the chip again over the Book (lens A A3).
    const commitEffect = commit.slice(0, commit.indexOf('}, [') + 30);
    expect(commitEffect).toMatch(/committedAt\.current = Date\.now\(\);[\s\S]*announce\(said\);[\s\S]*\}, \[committed\]\);/);
    expect(moment.match(/announce\(/g)).toHaveLength(1);
    expect(moment.match(/committedAt\.current = /g)).toHaveLength(1);

    // The same two effects, run on fake timers: when does the moment leave for the Book?
    vi.useFakeTimers();
    try {
      const plan = fileIntoMonthPlan(false);
      const leavesAt = (readerAtCommit: boolean, readerArrivesAtMs: number | null): number => {
        const t0 = Date.now();
        let left = -1;
        let timer: ReturnType<typeof setTimeout> | undefined;
        const time = (screenReader: boolean) => {
          clearTimeout(timer);
          timer = setTimeout(() => {
            if (left < 0) left = Date.now() - t0;
          }, savedMomentLeaveInMs({ dismissAtMs: plan.dismissAtMs, screenReader, elapsedMs: Date.now() - t0 }));
        };
        time(readerAtCommit);
        if (readerArrivesAtMs !== null) setTimeout(() => time(true), readerArrivesAtMs);
        vi.advanceTimersByTime(10_000);
        return left;
      };
      expect(leavesAt(false, null)).toBe(plan.dismissAtMs); // no screen reader: 900 ms, as designed
      expect(leavesAt(true, null)).toBe(SCREEN_READER_HOLD_MS); // the one-tap path: known before the commit
      expect(leavesAt(false, 30)).toBe(SCREEN_READER_HOLD_MS); // Review's path: known 30 ms after the commit
      expect(leavesAt(false, 850)).toBe(SCREEN_READER_HOLD_MS);
    } finally {
      vi.useRealTimers();
    }
  });

  it('Reduce Motion: the chip and the line fade in, nothing travels, then the Book', () => {
    const p = fileIntoMonthPlan(true);
    expect(p).toMatchObject({ scaleTo: 1, chipAtMs: 0, chipFadeMs: tokens.motion.fadeMs, moveAtMs: null, dy: 0, dismissAtMs: 900 });
    // The plan is chosen from the person's own setting (lens B X2).
    expect(moment).toMatch(/const reduced = useReducedMotion\(\);/);
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
    expect(moment).toMatch(/<ExcerptFade text=\{words\} lines=\{large \? SAVED_CARD_LINES_LARGE : SAVED_CARD_LINES\} variant="letterBody" surface=\{c\.surfaceRaised\} \/>/);
  });

  it('at accessibility text sizes the card shows fewer lines, so the chip and the line stay on screen', () => {
    expect(moment).toMatch(/const large = useIsAccessibilitySize\(\)/);
    expect(moment).toMatch(/export const SAVED_CARD_LINES = 6;/);
    expect(moment).toMatch(/export const SAVED_CARD_LINES_LARGE = 2;/);
  });

  it('the chip reads in subhead (P1\'s trust-copy floor), its edge from the stroke token', () => {
    expect(moment).toMatch(/<Text variant="subhead" tone="default">\s*\{chip\}/);
    expect(moment).not.toMatch(/variant="caption"/);
    expect(moment).toMatch(/borderWidth: tokens\.stroke\.control,/);
    expect(moment).not.toMatch(/borderWidth: 1\b/);
  });

  it('VoiceOver hears the chip and the line once, as they appear, and nothing claims a save before the commit', () => {
    const effect = moment.slice(moment.indexOf('useEffect(() => {'), moment.indexOf('const cardStyle'));
    expect(effect.indexOf('if (!committed) return;')).toBeGreaterThan(-1);
    expect(effect.indexOf('announce(said);')).toBeGreaterThan(effect.indexOf('if (!committed) return;'));
    expect(moment).toMatch(/const said = momentAnnouncement\(chip, line\)/);
    expect(moment).toMatch(/accessible=\{committed\}/);
    expect(moment).toMatch(/accessibilityLabel=\{said\}/);
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

  it('the Book shows "That was your second free letter." once, after the landing, with no action (S21, D-082)', () => {
    expect(secondFreeOnArrival('1')).toBe(true);
    expect(secondFreeOnArrival(['1'])).toBe(true);
    for (const v of [undefined, '', '0', 'true', 'yes', ['2']]) expect(secondFreeOnArrival(v as string | string[] | undefined), String(v)).toBe(false);
    expect(arrivalToastDelayMs(false)).toBe(tokens.motion.route.dissolveMs);
    expect(arrivalToastDelayMs(true)).toBe(tokens.motion.fadeMs);
    const book = code(src('app/(tabs)/book.tsx'));
    const arrival = book.slice(book.indexOf('const arrival = arrivalOf('), book.indexOf('router.setParams({ arrived: undefined, secondFree: undefined });') + 80);
    expect(arrival).toMatch(/if \(secondFreeOnArrival\(params\.secondFree\)\) \{\s*secondFreeTimer\.current = setTimeout\(\(\) => toast\.show\(\{ message: billingCopy\.keepGate\.secondFreeNote \}\), arrivalToastDelayMs\(reduced\)\);/);
    // No action, so it leaves on its own; cleared with `arrived`, so Back and tab taps never replay it.
    expect(arrival).not.toMatch(/secondFreeNote[^)]*action/);
    expect(arrival).toMatch(/router\.setParams\(\{ arrived: undefined, secondFree: undefined \}\)/);
  });
});

describe('S17: Review reads as a letter', () => {
  it('the letter sits on the sheet with its header, and the permanent "we" line is gone', () => {
    expect(review).toMatch(/<LetterSheet\s+header=\{header\}\s+editing=\{editing\}/);
    expect(review).not.toMatch(/r\.trustLine|r\.destination\.privateHelp|r\.subtitle/);
    expect(sheet).toMatch(/accessibilityLabel=\{onChangeBook \? undefined : header\.toSpoken\}/);
    // With twins, the header is the button: VoiceOver hears "To Asha, Month 7", then what a tap does.
    expect(sheet).toMatch(/<Pressable onPress=\{onChangeBook\} accessibilityRole="button" accessibilityLabel=\{header\.toSpoken\} accessibilityHint=\{changeLabel\}/);
  });

  it('the sheet: surfaceRaised, xl top and md bottom corners, elevation 2 on paper, a line edge on night paper, 20 pt padding', () => {
    expect(sheet).toMatch(/backgroundColor: c\.surfaceRaised/);
    expect(sheet).toMatch(/borderTopLeftRadius: tokens\.radius\.xl/);
    expect(sheet).toMatch(/borderBottomLeftRadius: tokens\.radius\.md/);
    expect(sheet).toMatch(/const e = tokens\.elevation\[2\]/);
    expect(sheet).toMatch(/scheme === 'dark'\s*\?\s*\{ borderWidth: tokens\.stroke\.control, borderColor: c\.line \}/);
    expect(sheet).not.toMatch(/borderWidth: 1\b/);
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
    // Said aloud too (iOS VoiceOver ignores live regions).
    expect(review).toMatch(/useEffect\(\(\) => \{\s*if \(saveFailed\) announce\(r\.saveFailed\);\s*\}, \[saveFailed, r\.saveFailed\]\);/);
  });

  it('"Keep private" stays after a failed save, so focus is never dropped and the other destination is one tap away', () => {
    const footer = review.slice(review.indexOf('const footer ='), review.indexOf('const keepFooter'));
    expect(footer).toMatch(/<Button variant="quiet" fullWidth onPress=\{\(\) => keepTo\(false\)\} disabled=\{!finalText\.trim\(\)\} testID="review\.save\.private">/);
    expect(footer).not.toMatch(/!saveFailed\s*&&/);
  });

  it('switching how the letter reads cross-fades the words (swapMs), never a jump', () => {
    expect(review).toMatch(/<Animated\.View key=\{view\} entering=\{FadeIn\.duration\(tokens\.motion\.swapMs\)\}>/);
  });

  it('a repaired name shows the struck heard word, then the kept word on a wash', () => {
    const t = code(src('components/capture/transcript.tsx'));
    expect(t).toMatch(/shows\?\.kind === 'change'/);
    expect(t).toMatch(/textDecorationLine: 'line-through'[^}]*color: c\.textMuted \}\}>\{shows\.from\}/);
    expect(t).toMatch(/<Text style=\{\{ backgroundColor: c\.accentSoft/);
  });
});

describe('S18: changing words in place', () => {
  it('no box inside the letter: the sheet\'s edge becomes the 1.5 pt accent line; Done in the header and in the footer the keyboard lifts', () => {
    expect(sheet).toMatch(/editing\s*\?\s*\{ borderWidth: tokens\.stroke\.selected, borderColor: c\.accent \}/);
    expect(review).not.toMatch(/tokens\.focusRing\.width/);
    expect(review).toMatch(/testID="review\.edit\.doneHeader"/);
    // One Done above the keyboard, not two: the footer rides on the keyboard (KeyboardAvoidingView), no input accessory.
    expect(review).not.toMatch(/InputAccessoryView|EDIT_ACCESSORY_ID|inputAccessoryViewID/);
    const open = review.indexOf("<KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}");
    const end = review.indexOf('</KeyboardAvoidingView>');
    expect(open).toBeGreaterThan(-1);
    expect(review.indexOf('{!inlineFooter && footer}', open)).toBeGreaterThan(open);
    expect(review.indexOf('{!inlineFooter && footer}', open)).toBeLessThan(end);
    const footer = review.slice(review.indexOf('const footer ='), review.indexOf('const keepFooter'));
    expect(footer).toMatch(/editing \? \(\s*<Button size="lg" fullWidth label=\{copy\.common\.doneButton\} onPress=\{\(\) => setEditing\(false\)\} testID="review\.edit\.done" \/>/);
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
    expect(write).toMatch(/if \(r\.saveState\) setSaveState\(r\.saveState\);\s*if \(r\.saveState === 'failed'\) announce\(copy\.write\.notSaved\);/);
    expect(write).toMatch(/\{copy\.write\.notSaved\}/);
    expect(write).not.toMatch(/tone="caution"|c\.caution/);
    expect(en.write.notSaved).toBe('Not saved yet');
  });

  it('typed words are never touched by the machine: no engine call in Write, and Review keeps them as typed (F04-REQ-012)', () => {
    expect(write).not.toMatch(/cleanSpoken|faithfulClean|applyEdits|withoutEdit|normalizeChars/);
    expect(review).toMatch(/typed \? typedFinalText\(raw\)/);
    expect(review).not.toMatch(/normalizeChars|applyEdits/);
    // End to end, byte for byte, on the one-tap path and the Review path: test/review-keep-from-write.test.ts.
  });

  it('words that cannot be written to this phone keep Write open; a pending autosave is written on any way out', () => {
    const close = write.slice(write.indexOf('const close = () =>'), write.indexOf('const keep = (inBook: boolean)'));
    expect(close).toMatch(/else if \(text\.trim\(\) && !persist\(text\)\) return;\s*router\.back\(\);/);
    expect(write).toMatch(/timer\.current = setTimeout\(\(\) => \{\s*timer\.current = null;\s*persist\(value\);/);
    expect(write).toMatch(/latest\.current = value;/);
    // Unmount (a swipe down within the pause): the pending autosave is flushed with the newest words, not dropped.
    expect(write).toMatch(/useEffect\(\s*\(\) => \(\) => \{\s*if \(timer\.current\) \{\s*clearTimeout\(timer\.current\);\s*timer\.current = null;\s*persistRef\.current\(latest\.current\);/);
    // Close and Keep write now and disarm the timer, so the flush never writes twice or brings back a deleted draft.
    expect(close).toMatch(/timer\.current = null;/);
    const keep = write.slice(write.indexOf('const keep = (inBook: boolean)'), write.indexOf('if (!child) return null;'));
    expect(keep).toMatch(/timer\.current = null;/);
  });

  it('after a write that did not go through, neither the swipe down nor Android\'s back can close Write, until the next write works (follow-up L3)', () => {
    // Every write goes through writeWords; its answer sets the autosave line, which the swipe reads.
    const persist = write.slice(write.indexOf('const persist = (value: string): boolean =>'), write.indexOf('const latest = useRef'));
    expect(persist).toMatch(/const r = writeWords\(\{ create, update: setDraftTyped \}, draftId\.current, value\);\s*draftId\.current = r\.draftId;/);
    expect(persist).toMatch(/if \(r\.saveState\) setSaveState\(r\.saveState\);/);
    expect(persist).toMatch(/if \(!r\.ok\) return false;/);
    expect(write).not.toMatch(/createDraft\(\{[\s\S]*?\}\)\.id;\s*\} else setDraftTyped/); // no second write path
    // The swipe: from the last write, one options object per answer (no setOptions on every keystroke).
    expect(write).toMatch(/const swipeAllowed = writeSwipeAllowed\(\{ text, writeFailed: saveState === 'failed' \}\);\s*const screenOptions = useMemo\(\(\) => \(\{ gestureEnabled: swipeAllowed \}\), \[swipeAllowed\]\);/);
    expect(write).toMatch(/<Stack\.Screen options=\{screenOptions\} \/>/);
    // A swipe iOS refused is a Close too, so it retries the write; an ordinary drag let go halfway is not (lens B).
    expect(write).toMatch(/swipeHeld\.current = !swipeAllowed;/);
    expect(write).toMatch(/navigation\.addListener\('gestureCancel' as never, \(\) => \{\s*if \(swipeHeld\.current\) closeRef\.current\(\);\s*\}\)/);
    // Android's back is Close: it writes now and stays on Write when the words cannot be written (lens A, Android).
    expect(write).toMatch(/closeRef\.current = close;/);
    expect(write).toMatch(/if \(Platform\.OS !== 'android'\) return;\s*const sub = BackHandler\.addEventListener\('hardwareBackPress', \(\) => \{\s*closeRef\.current\(\);\s*return true;\s*\}\);\s*return \(\) => sub\.remove\(\);/);
    // Run against the real store, with a lasting failure: test/review-keep-from-write.test.ts.
  });
});

describe('every word on these screens comes from packages/content (lens B X1, X4)', () => {
  const screens = { review, write, moment, sheet, transcript: code(src('components/capture/transcript.tsx')) };

  it('no text typed into a Text or a label, a title or a hint', () => {
    for (const [name, s] of Object.entries(screens)) {
      expect([...s.matchAll(/>([^<>{}]*[A-Za-z][^<>{}]*)<\/Text>/g)].map((m) => m[1].trim()), name).toEqual([]);
      expect(s.match(/\b(label|title|body|accessibilityLabel|accessibilityHint|message|placeholder)="[^"]*[A-Za-z]/g), name).toBeNull();
    }
  });

  it('a changed word carries its own label and hint ("Usher to Asha", from the row copy)', () => {
    const t = screens.transcript;
    const change = t.slice(t.indexOf("shows?.kind === 'change'"), t.indexOf("taken?.kind === 'struck'"));
    expect(change).toMatch(/accessibilityRole="button"\s*accessibilityLabel=\{fill\(copy\.review\.rowChange, \{ a: shows\.from, b: shows\.to \}\)\}\s*accessibilityHint=\{pendingCopy\.review\.editA11yHint\}/);
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
