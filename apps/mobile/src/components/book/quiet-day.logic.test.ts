/** Quiet-day marks (D-084). Fictional family "Asha" only. */
import { describe, expect, it } from 'vitest';
import type { Entry } from '@/lib/store';
import { isLetterLike, isQuietMark, markOn, newQuietMark, readableInBook, showsSignature, visibleInBook } from './quiet-day.logic';

const base = { capturedAt: '2026-10-03T19:00:00.000Z', captureMode: 'typed', editLevel: 'verbatim', promptKey: null, engineVersion: 3, machineEdits: [], soundsLikeMe: null } as const;
const letter = (id: string, occurredOn: string, extra: Partial<Entry> = {}): Entry =>
  ({ ...base, id, kind: 'letter', occurredOn, rawTranscript: 'Asha laughed.', finalText: 'Asha laughed.', inBook: true, ...extra }) as Entry;
/** A mark saved by an older build: it holds the template sentence. */
const oldMark = (id: string, occurredOn: string): Entry =>
  letter(id, occurredOn, { kind: 'not_much', rawTranscript: 'Tuesday. Not much today. Just Asha, and us, and an ordinary day.', finalText: 'Tuesday. Not much today. Just Asha, and us, and an ordinary day.', inBook: false });

describe('newQuietMark', () => {
  const m = newQuietMark({ id: 'm1', occurredOn: '2026-10-03', capturedAt: '2026-10-03T19:00:00.000Z' });

  it('carries no words anywhere and is never in the book', () => {
    expect(m).toMatchObject({ kind: 'not_much', rawTranscript: '', finalText: '', machineEdits: [], inBook: false, promptKey: null, editLevel: 'verbatim', captureMode: 'typed', soundsLikeMe: null });
    expect(JSON.stringify(m)).not.toMatch(/not much|ordinary day|Just /i);
  });
});

describe('markOn: one mark a day', () => {
  it('finds a mark on that day, old or new, and nothing for other days or for letters', () => {
    const entries = [letter('l1', '2026-10-03'), oldMark('q1', '2026-10-02')];
    expect(markOn(entries, '2026-10-02')?.id).toBe('q1');
    expect(markOn(entries, '2026-10-03')).toBeNull();
    expect(markOn(entries, '2026-10-01')).toBeNull();
  });
});

describe('visibleInBook', () => {
  it('lists a mark on a day with no letter, and hides it on a day that has a letter or note', () => {
    const entries = [letter('l1', '2026-10-03'), oldMark('q1', '2026-10-03'), oldMark('q2', '2026-10-02'), letter('n1', '2026-10-01', { kind: 'note' }), oldMark('q3', '2026-10-01')];
    expect(visibleInBook(entries).map((e) => e.id)).toEqual(['l1', 'q2', 'n1']);
  });
});

describe('what may be read, printed or moved', () => {
  it('a mark is never letter-like, whatever its text or inBook says', () => {
    expect(isQuietMark(oldMark('q1', '2026-10-02'))).toBe(true);
    expect(isLetterLike(oldMark('q1', '2026-10-02'))).toBe(false);
    expect(isLetterLike(letter('l1', '2026-10-03'))).toBe(true);
  });

  it('Read together never holds a mark, even one an old build moved into the book', () => {
    const moved = { ...oldMark('q1', '2026-10-02'), inBook: true };
    const waiting = letter('w1', '2026-10-04', { transcriptStatus: 'waiting', finalText: '', rawTranscript: '' });
    const private1 = letter('p1', '2026-10-05', { inBook: false });
    expect(readableInBook([moved, waiting, private1, letter('l1', '2026-10-03')]).map((e) => e.id)).toEqual(['l1']);
  });
});

describe('showsSignature', () => {
  it('the nobody-spoke and waiting notes carry no signature; words do', () => {
    expect(showsSignature('nobodySpoke')).toBe(false);
    expect(showsSignature('waiting')).toBe(false);
    expect(showsSignature('words')).toBe(true);
  });
});
