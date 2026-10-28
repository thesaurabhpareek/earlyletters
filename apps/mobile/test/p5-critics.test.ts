/// <reference types="node" />
/**
 * P5's critics' pass (docs/design/reviews/P5_CRITICS_PASS_2026-10-28.md), the items fixed in this change: S1 (the
 * arrival wash when the Book mounts with `arrived`), S3 (Write the words on a recording with no words), S4 (Read
 * together's buttons at accessibility sizes), S6 (Erase now fails with a word), S7 (a card's spoken label), S8 (the
 * provenance line on the other parent's phone), S9 (j10c picks the Book's card), L4 (Read together on the Book) and L9
 * (Restore with no book name). Pure logic is tested by running it; screens, which nothing here can mount, are pinned by
 * source, as the rest of the Book's tests are. Fictional family "Asha" only.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { en } from '@scribe/content';
import { tokens } from '@scribe/design-tokens';
import { arrivalToastDelayMs, createArrivalGate } from '../src/components/book/book.logic';
import { cardLabel } from '../src/components/book/letter-card.logic';
import { readableInBook } from '../src/components/book/quiet-day.logic';
import { eraseOutcome, restoredLine } from '../src/components/book/shelf.logic';
import { turnControls } from '../src/components/book/turn-controls.logic';
import { wordsCardKind, wordsCardState } from '../src/components/book/words-card.logic';
import { pageProvenanceKey, provenanceLine } from '../src/lib/provenance';
import type { Entry } from '../src/lib/store';

const src = (f: string) => readFileSync(join(__dirname, '../src', f), 'utf8');
const flow = (f: string) => readFileSync(join(__dirname, '../e2e-web', f), 'utf8');
const code = (s: string) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');

const e = (id: string, extra: Partial<Entry> = {}) =>
  ({ id, occurredOn: '2026-10-14', capturedAt: '2026-10-14T19:00:00.000Z', childId: 'child-asha', kind: 'letter', inBook: true, captureMode: 'spoken', finalText: 'Asha laughed.', rawTranscript: 'Asha laughed.', transcriptStatus: null, ...extra }) as Entry;

describe('[S1] the arrival wash survives a Book that mounts with `arrived`', () => {
  const book = [{ data: [e('n2'), e('n1')] }, { data: [e('o1')] }];
  const look = (gate: ReturnType<typeof createArrivalGate>, o: { param?: string | string[]; sections?: typeof book; loaded?: boolean; reduced?: boolean }) =>
    gate.step({ param: o.param, sections: o.sections ?? [], loaded: o.loaded ?? true, reduced: o.reduced ?? false });

  it('keeps the param through an empty first read, then runs once the card is found', () => {
    const gate = createArrivalGate();
    // The Book mounts with the param and has read nothing yet (the first letter of a new install).
    expect(look(gate, { param: 'n1', sections: [], loaded: false })).toEqual({ act: 'wait' });
    expect(look(gate, { param: 'n1', sections: [], loaded: false })).toEqual({ act: 'wait' });
    // The letters land (the effect-driven read, or a change of book): the card is found and the arrival runs.
    const run = look(gate, { param: 'n1', sections: book, loaded: true });
    expect(run).toEqual({ act: 'run', arrival: { id: 'n1', sectionIndex: 0, itemIndex: 1 }, afterMs: tokens.motion.route.dissolveMs });
  });

  it('runs the arrival once for a param, however often the Book renders', () => {
    const gate = createArrivalGate();
    expect(look(gate, { param: 'o1', sections: book }).act).toBe('run');
    for (let i = 0; i < 5; i++) expect(look(gate, { param: 'o1', sections: book })).toEqual({ act: 'idle' });
  });

  it('forgets the arrival when the param is cleared, so a later arrival for the same letter runs again', () => {
    const gate = createArrivalGate();
    expect(look(gate, { param: 'n1', sections: book }).act).toBe('run');
    expect(look(gate, { param: undefined, sections: book })).toEqual({ act: 'idle' });
    expect(look(gate, { param: 'n1', sections: book }).act).toBe('run');
  });

  it('washes after the route has dissolved away, the length of the fade under Reduce Motion', () => {
    expect(arrivalToastDelayMs(false)).toBe(tokens.motion.route.dissolveMs);
    expect(arrivalToastDelayMs(true)).toBe(tokens.motion.fadeMs);
    const step = look(createArrivalGate(), { param: 'n1', sections: book, reduced: true });
    expect(step).toMatchObject({ act: 'run', afterMs: tokens.motion.fadeMs });
  });

  it('a letter read for this book that is not in it (another book, since deleted) runs without a card: nothing to wash, but the param still goes', () => {
    const step = look(createArrivalGate(), { param: 'elsewhere', sections: book });
    expect(step).toEqual({ act: 'run', arrival: null, afterMs: tokens.motion.route.dissolveMs });
  });

  it('reads the first id of an array param, and an empty param is no arrival', () => {
    expect(look(createArrivalGate(), { param: ['n2', 'x'], sections: book })).toMatchObject({ act: 'run', arrival: { id: 'n2' } });
    expect(look(createArrivalGate(), { param: '', sections: book })).toEqual({ act: 'idle' });
  });

  it('mounts the Book with a param and an empty first read: nothing runs, the param is kept, and the wash starts when the letters land', () => {
    // The Book's effect, step by step: render 1 has no letters read (the old state initialiser), render 2 has them.
    const gate = createArrivalGate();
    const acts: string[] = [];
    let param: string | undefined = 'n1';
    const render = (sections: typeof book, loaded: boolean) => {
      const step = look(gate, { param, sections, loaded });
      acts.push(step.act);
      if (step.act === 'run') {
        // The timer would wash `step.arrival` after `afterMs`, then clear the param.
        param = undefined;
      }
    };
    render([], false);
    expect(param).toBe('n1'); // not cleared: the old code cleared it here and the wash was lost
    render(book, true);
    expect(param).toBeUndefined();
    expect(acts).toEqual(['wait', 'run']);
  });

  describe('the Book screen (source)', () => {
    const screen = code(src('app/(tabs)/book.tsx'));

    it('reads the letters in the state initialiser, so the first frame is the book and not the empty-book state', () => {
      expect(screen).toMatch(/useState\(\(\) => \(\{ childId: active\?\.id \?\? null, entries: active \? listEntriesForChild\(active\.id\) : \[\] \}\)\)/);
      expect(screen).not.toMatch(/useState<Entry\[\]>\(\[\]\)/);
      expect(screen).toMatch(/const loaded = read\.childId === \(active\?\.id \?\? null\);/);
    });

    it('asks the gate with the read state, positions at once, and washes and clears the param together once uncovered', () => {
      expect(screen).toMatch(/const step = arrivalGate\.step\(\{ param: params\.arrived, sections: chapters, loaded, reduced \}\);/);
      const run = screen.slice(screen.indexOf('const step = arrivalGate.step'), screen.indexOf('}, step.afterMs);'));
      // Positioned before the timer, washed and cleared inside it, wash first.
      const position = run.indexOf('scrollToArrival();');
      const timer = run.indexOf('setTimeout(');
      const wash = run.indexOf('wash([arrival.id])');
      const clear = run.indexOf('router.setParams({ arrived: undefined, secondFree: undefined })');
      expect(position).toBeGreaterThan(-1);
      expect(timer).toBeGreaterThan(position);
      expect(wash).toBeGreaterThan(timer);
      expect(clear).toBeGreaterThan(wash);
      // The effect is asked again when the letters or the read change, not only when the param does.
      expect(screen).toMatch(/\}, \[params\.arrived, chapters, loaded\]\);/);
    });

    it('lets the timer go with the screen, and the old immediate wash and clear are gone', () => {
      expect(screen).toMatch(/useEffect\(\(\) => \(\) => \{\s*if \(arrivalTimer\.current\) clearTimeout\(arrivalTimer\.current\);\s*\}, \[\]\);/);
      expect(screen).not.toMatch(/arrivalOf\(/);
    });
  });
});

describe('[S3] "Write the words" on a recording with no words', () => {
  it('a waiting letter and a no-words recording of the reader\'s own get the card; anyone else\'s, and a letter with words, do not', () => {
    expect(wordsCardKind({ own: true, words: 'waiting', canWrite: false })).toBe('waiting');
    expect(wordsCardKind({ own: true, words: 'nobodySpoke', canWrite: true })).toBe('noWords');
    expect(wordsCardKind({ own: false, words: 'waiting', canWrite: true })).toBeNull();
    expect(wordsCardKind({ own: false, words: 'nobodySpoke', canWrite: true })).toBeNull();
    expect(wordsCardKind({ own: true, words: 'words', canWrite: true })).toBeNull();
  });

  it('is not offered where the store would refuse the words (the letter is on the server, its raw fixed)', () => {
    expect(wordsCardKind({ own: true, words: 'nobodySpoke', canWrite: false })).toBeNull();
  });

  it('a recording with no words shows no "Try again" and no "Get words ready", whatever an old job says', () => {
    const stale = [{ phase: 'failed', failure: 'transcribe_failed' }, { phase: 'waiting_for_pack' }, { phase: 'waiting_for_language' }, { phase: 'done' }, null, undefined] as const;
    for (const job of stale) expect(wordsCardState('noWords', job)).toEqual({ failed: false, retryable: false, packWait: false, languageWait: false });
  });

  it('a waiting letter keeps its reasons and actions', () => {
    expect(wordsCardState('waiting', { phase: 'failed', failure: 'transcribe_failed' })).toMatchObject({ failed: true, retryable: true });
    expect(wordsCardState('waiting', { phase: 'failed', failure: 'file_missing' })).toMatchObject({ failed: true, retryable: false });
    expect(wordsCardState('waiting', { phase: 'failed', failure: 'unsupported' })).toMatchObject({ retryable: false });
    expect(wordsCardState('waiting', { phase: 'waiting_for_pack' })).toMatchObject({ packWait: true, retryable: false });
    expect(wordsCardState('waiting', { phase: 'waiting_for_language' })).toMatchObject({ languageWait: true });
    expect(wordsCardState('waiting', null)).toEqual({ failed: false, retryable: false, packWait: false, languageWait: false });
  });

  it('the letter page renders the card for both kinds, asks the store first, and opens the same sheet that leads to Review (source)', () => {
    const page = code(src('app/letter/[id].tsx'));
    expect(page).toMatch(/const wordsCard = wordsCardKind\(\{ own, words, canWrite: words === 'nobodySpoke' && canTypeWordsFor\(entry\.id\) \}\);/);
    expect(page).toMatch(/\{wordsCard && <WaitingCard entry=\{entry\} kind=\{wordsCard\} \/>\}/);
    expect(page).not.toMatch(/own && words === 'waiting' && <WaitingCard/);
    expect(page).toMatch(/const state = wordsCardState\(kind, job\);/);
    // One sheet, one way out: the typed words are stored, then Review opens for the letter.
    expect(page.match(/function WordsSheet\(/g)).toHaveLength(1);
    expect(page).toMatch(/if \(!setTypedWordsForWaitingEntry\(entryId, text\)\) return;\s*onClose\(\);\s*router\.push\(\{ pathname: '\/review', params: \{ entryId \} \}\);/);
  });

  it('the journey asserts it: j10e sees "Write the words" and neither retry nor "Get words ready", and the save goes to Review', () => {
    const j10 = flow('j10-letter.flow.ts');
    const e2e = j10.slice(j10.indexOf("test('[J10e]"), j10.indexOf("test('[J10d]"));
    expect(e2e).toMatch(/await expect\(btn\(app, 'Write the words'\)\)\.toBeVisible\(\);/);
    expect(e2e).toMatch(/await expect\(btn\(app, 'Try again'\)\)\.toHaveCount\(0\);/);
    expect(e2e).toMatch(/await expect\(btn\(app, 'Get words ready'\)\)\.toHaveCount\(0\);/);
    expect(e2e).toMatch(/await expect\(app\)\.toHaveURL\(\/\\\/review\/\);/);
  });
});

describe('[S9] j10c picks the Book\'s own card', () => {
  it('selects the card by test id, because the Tonight screen under the Book carries the same words on the web', () => {
    const j10 = flow('j10-letter.flow.ts');
    const waiting = j10.slice(j10.indexOf("test('[J10c]"), j10.indexOf("test('[J10e]"));
    expect(waiting).toMatch(/app\.getByTestId\('book\.card'\)\.filter\(\{ hasText: \/waiting for its words\/i \}\)\.first\(\)\.click\(\);/);
    expect(waiting).not.toMatch(/app\.getByText\(\/waiting for its words\/i\)\.first\(\)\.click\(\)/);
    // The id it picks is the one the card sets.
    expect(code(src('components/book/letter-card.tsx'))).toMatch(/testID="book\.card"/);
  });
});

describe('[S4] Read together\'s page buttons at accessibility sizes', () => {
  it('sit side by side, Back one then Next letter, at the usual sizes', () => {
    expect(turnControls(false)).toEqual({ stacked: false, order: ['back', 'next'] });
  });

  it('stack, Next letter first, at accessibility sizes', () => {
    expect(turnControls(true)).toEqual({ stacked: true, order: ['next', 'back'] });
  });

  it('the screen reads the size, stacks full width and gives no button a half-width shape when stacked (source)', () => {
    const rt = code(src('app/read-together.tsx'));
    expect(rt).toMatch(/const turn = turnControls\(useIsAccessibilitySize\(\)\);/);
    expect(rt).toMatch(/className=\{turn\.stacked \? 'gap-3 px-5 pb-2 pt-3' : 'flex-row gap-3 px-5 pb-2 pt-3'\}/);
    expect(rt.match(/className=\{turn\.stacked \? 'px-4' : 'flex-1 px-4'\}/g)).toHaveLength(2);
    expect(rt.match(/fullWidth=\{turn\.stacked\}/g)).toHaveLength(2);
    expect(rt).toMatch(/turn\.order\.map\(/);
    // Both buttons keep their labels and ids.
    expect(rt).toMatch(/label=\{rt\.previousButton\}\s*testID="readTogether\.back"/);
    expect(rt).toMatch(/label=\{rt\.nextButton\} testID="readTogether\.next"/);
  });
});

describe('[S6] Erase now fails with a word', () => {
  const d = en.settings.delete;

  it('says it when the letter is still on the shelf after a refused erase, and nothing otherwise', () => {
    expect(eraseOutcome(true, false)).toBe('erased');
    expect(eraseOutcome(false, true)).toBe('kept');
    // Refused, but the card has already left (restored or erased on another phone): nothing to say.
    expect(eraseOutcome(false, false)).toBe('gone');
  });

  it('the line says what did not happen, then what is true, and claims nothing about the recording', () => {
    expect(d.eraseFailedToast).toBe('The letter was not erased. It is still in Recently deleted.');
    expect(d.eraseFailedToast).not.toMatch(/recording|file|try again|sorry|error|fail/i);
    expect(d.eraseFailedToast).not.toBe(d.erasedToast);
  });

  it('the shelf shows it only on the refused path, and "Letter erased." only on success (source)', () => {
    const screen = code(src('app/settings/recently-deleted.tsx'));
    expect(screen).toMatch(/const outcome = eraseOutcome\(done, left\.some\(\(r\) => r\.id === id\)\);/);
    expect(screen).toMatch(/if \(outcome === 'erased'\) toast\.show\(\{ message: d\.erasedToast \}\);\s*else if \(outcome === 'kept'\) toast\.show\(\{ message: d\.eraseFailedToast \}\);/);
  });
});

describe('[S7] a Book card says where the recording is only for the reader\'s own letters', () => {
  const base = { signature: 'From Mama', dateline: 'Tuesday, October 14, 2026, Asha is 7 months old', text: 'Asha laughed at the dog', inBook: true, privateLabel: 'Private', spoken: true, own: true, recordingOnPhone: en.book.recordingOnPhone };

  it('names the recording\'s place on the reader\'s own spoken letter, word for word', () => {
    expect(cardLabel(base)).toBe('From Mama. Tuesday, October 14, 2026, Asha is 7 months old. Asha laughed at the dog. Recording kept on this phone');
  });

  it('leaves it out for the other parent\'s letter, and for a typed one', () => {
    expect(cardLabel({ ...base, own: false })).not.toMatch(/Recording kept on this phone/);
    expect(cardLabel({ ...base, own: true, spoken: false })).not.toMatch(/Recording kept on this phone/);
    // Everything else the card says is unchanged.
    expect(cardLabel({ ...base, own: false })).toBe('From Mama. Tuesday, October 14, 2026, Asha is 7 months old. Asha laughed at the dog');
  });

  it('still carries the private mark and the waiting reason, in their places', () => {
    expect(cardLabel({ ...base, inBook: false, reason: 'Getting ready, 40%' })).toMatch(/Asha laughed at the dog\. Private\. Getting ready, 40%\. Recording kept on this phone$/);
    expect(cardLabel({ ...base, own: false, inBook: false, reason: 'Ready to read back' })).toMatch(/Private\. Ready to read back$/);
  });

  it('the held words are untouched, and the card asks isOwnEntry (source)', () => {
    expect(en.book.recordingOnPhone).toBe('Recording kept on this phone');
    const card = code(src('components/book/letter-card.tsx'));
    expect(card).toMatch(/own: isOwnEntry\(entry\),/);
    expect(card).toMatch(/recordingOnPhone: copy\.book\.recordingOnPhone,/);
    expect(card).not.toMatch(/spoken \? copy\.book\.recordingOnPhone/);
  });
});

describe('[S8] the letter page claims no fixes it cannot know', () => {
  const words = en.book.provenance;
  const line = (entry: { captureMode: string; finalText: string; rawTranscript: string }, own: boolean) => provenanceLine(entry, { own, words, recordingOnPhone: en.book.recordingOnPhone });
  const fixed = { captureMode: 'spoken', rawTranscript: 'Asha um laughed', finalText: 'Asha laughed' };
  const exact = { captureMode: 'spoken', rawTranscript: 'Asha laughed', finalText: 'Asha laughed' };
  // The other parent's phone never holds the author's working material (book_entries leaves it out).
  const theirs = { captureMode: 'spoken', rawTranscript: '', finalText: 'Asha laughed' };

  it('keeps the two honest lines for the author, with where the recording is', () => {
    expect(line(fixed, true)).toBe('Spoken, with small fixes. Recording kept on this phone.');
    expect(line(exact, true)).toBe('Spoken, exactly as said. Recording kept on this phone.');
    expect(line({ captureMode: 'typed', rawTranscript: 'Asha laughed', finalText: 'Asha laughed' }, true)).toBe('Typed');
    expect(line({ captureMode: 'mixed', rawTranscript: 'Asha laughed', finalText: 'Asha laughed' }, true)).toBe('Typed. Recording kept on this phone.');
  });

  it('on the other parent\'s phone says only that the letter was spoken, whether or not a fix was made', () => {
    for (const entry of [theirs, { ...theirs, rawTranscript: 'Asha um laughed' }, { ...theirs, rawTranscript: 'Asha laughed' }]) {
      expect(line(entry, false)).toBe('Spoken');
      expect(line(entry, false)).not.toMatch(/fix|exact|phone/i);
    }
    expect(pageProvenanceKey(theirs, { own: false })).toBe('spokenOther');
    // Their typed words are known to be typed from the capture mode alone.
    expect(line({ captureMode: 'typed', rawTranscript: '', finalText: 'Asha laughed' }, false)).toBe('Typed');
  });

  it('says nothing it cannot back for the author\'s own letter either, when the raw words are not on this phone', () => {
    expect(pageProvenanceKey({ ...exact, rawTranscript: '  ' }, { own: true })).toBe('spokenOther');
  });

  it('the new words are plain, are not the registered or held ones, and the two honest lines are unchanged', () => {
    expect(words.spokenOther).toBe('Spoken');
    expect(words.spokenFixed).toBe('Spoken, with small fixes');
    expect(words.spokenExact).toBe('Spoken, exactly as said');
    expect(words.typed).toBe('Typed');
  });

  it('the page composes the line from lib/provenance (source)', () => {
    const page = code(src('app/letter/[id].tsx'));
    expect(page).toMatch(/provenanceLineOf\(entry, \{ own, words: copy\.book\.provenance, recordingOnPhone: copy\.book\.recordingOnPhone \}\)/);
    expect(page).not.toMatch(/copy\.book\.provenance\[/);
  });
});

describe('[L4] Read together shows on the Book for what it can read', () => {
  it('a kept letter still waiting for its words, or only a private one, has nothing to read together', () => {
    const waiting = e('w1', { transcriptStatus: 'waiting', finalText: '', rawTranscript: '' });
    const privateOne = e('p1', { inBook: false });
    expect(readableInBook([waiting])).toHaveLength(0);
    expect(readableInBook([waiting, privateOne])).toHaveLength(0);
    expect(readableInBook([waiting, e('l1')])).toHaveLength(1);
  });

  it('the Book asks the same question as the screen (source)', () => {
    const book = code(src('app/(tabs)/book.tsx'));
    expect(book).toMatch(/\{readableInBook\(entries\)\.length > 0 && \(/);
    expect(book).not.toMatch(/entries\.some\(\(e\) => e\.inBook && !isQuietMark\(e\)\)/);
    expect(code(src('app/read-together.tsx'))).toMatch(/readableInBook\(listEntriesForChild\(child\.id\)\)/);
  });
});

describe('[L9] Restore never reads "Back in \'s book."', () => {
  const d = en.settings.delete;

  it('names the book when it has a name', () => {
    expect(restoredLine(d, 'Asha')).toBe("Back in Asha's book.");
    expect(restoredLine(d, '  Asha ')).toBe("Back in Asha's book.");
    // A name with a replacement pattern in it is still just a name.
    expect(restoredLine(d, 'A$&B')).toBe("Back in A$&B's book.");
  });

  it('falls back to the same line without a name when no book can be named', () => {
    for (const name of [undefined, null, '', '   ']) {
      const out = restoredLine(d, name);
      expect(out).toBe('Back in the book.');
      expect(out).not.toMatch(/ 's |\{child\}/);
    }
  });

  it('the shelf fills it through restoredLine, from the letter\'s book or the open one (source)', () => {
    const screen = code(src('app/settings/recently-deleted.tsx'));
    expect(screen).toMatch(/const child = \(e\.childId \? getChild\(e\.childId\) : null\) \?\? getActiveChild\(\);/);
    expect(screen).toMatch(/message: restoredLine\(d, child\?\.name\),/);
  });
});
