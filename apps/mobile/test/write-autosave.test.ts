/// <reference types="node" />
/**
 * [F04-REQ-011] [RT-WRT-05] Typed words reach this phone at least every 500 ms while someone types, so a kill, a crash
 * or a flat battery in the middle of a long burst loses at most the last 500 ms of typing. The session used to be a
 * pure debounce (every keystroke moved the 500 ms timer), so nothing was written until a pause and a kill lost the whole
 * burst. Now: one timer armed by the first keystroke after a write, not moved by later ones, writing the newest words
 * when it fires; and the autosave line, its announcement and the render of Write still wait for a real pause.
 *
 * Run with fake timers against the real session and the real store, through the same `persist` write.tsx uses
 * (writeWords over createDraft and setDraftTyped). The "kill" is stopping: nothing is called after it, and what is in
 * the store is all that is left. Fictional Asha family only.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { nodeDb } from './helpers/node-db';

vi.mock('expo-crypto', () => ({ getRandomBytes: (n: number) => new Uint8Array(n).fill(7) }));
vi.mock('../src/lib/db/repos/open-native', () => ({
  openNativeDb: () => {
    throw new Error('native open must not be used in tests');
  },
}));
vi.mock('../src/lib/analytics/track', () => ({ track: () => {} }));

const store = await import('../src/lib/store');
const { writeWords } = await import('../src/components/capture/review-view.logic');
const { createWriteSession, WRITE_AUTOSAVE_MS } = await import('../src/components/capture/write-session.logic');

const now = () => '2026-10-03T09:00:00.000Z';
let seq = 0;
const newId = () => `0199a5b0-0000-7000-8000-${String(++seq).padStart(12, '0')}`;
let closeDb: () => void = () => {};
let asha = '';

beforeEach(() => {
  vi.useFakeTimers();
  store.closeStore();
  const h = nodeDb();
  closeDb = h.close;
  expect(store.openStore({ open: () => ({ db: h.db, close: () => {} }), now, newId }).ok).toBe(true);
  asha = store.addChild({ name: 'Asha', birthday: '2026-03-01', dueDate: null, signsAs: 'Mama' }).id;
});
afterEach(() => {
  vi.useRealTimers();
  store.closeStore();
  closeDb();
});

/** One call to `persist`: when (ms from the start), the words, whether it was quiet, whether it went through, how many keystrokes had been typed, and whether the draft existed. */
type Persist = { at: number; value: string; quiet: boolean; ok: boolean; keys: number; hadDraft: boolean };
/** What the page would do with the autosave line, the announcement and a render: a loud write, or `settled`. `sinceKey` is the quiet time before it. */
type Screen = { at: number; kind: 'write' | 'settled'; value: string; sinceKey: number };

/** Write as write.tsx wires it: its `persist` (writeWords over the store, quiet or not) and `settled`, over the real session. */
function openWrite() {
  const t0 = Date.now();
  const at = () => Date.now() - t0;
  let draftId: string | null = null;
  const disk = { full: false };
  const persists: Persist[] = [];
  const screen: Screen[] = [];
  let keys = 0;
  let lastKeyAt = 0;
  const update = (id: string, v: string) => {
    if (disk.full) throw new Error('disk full');
    store.setDraftTyped(id, v);
  };
  const persist = (value: string, quiet: boolean): boolean => {
    const create = (v: string) => store.createDraft({ childId: asha, captureMode: 'typed', promptKey: null, audioUri: null, audioDurationMs: null, typedText: v }).id;
    const hadDraft = draftId !== null;
    const r = writeWords({ create, update }, draftId, value);
    draftId = r.draftId;
    persists.push({ at: at(), value, quiet, ok: r.ok, keys, hadDraft });
    if (!quiet) screen.push({ at: at(), kind: 'write', value, sinceKey: at() - lastKeyAt });
    return r.ok;
  };
  const settled = (value: string) => {
    screen.push({ at: at(), kind: 'settled', value, sinceKey: at() - lastKeyAt });
  };
  const session = createWriteSession(
    { persist, settled, draftId: () => draftId, hasRecording: (id) => !!store.getDraft(id)?.audioUri, deleteDraft: store.deleteDraft },
    { initial: '' },
  );
  /** One keystroke's worth of words. */
  const key = (value: string) => {
    keys += 1;
    lastKeyAt = at();
    session.change(value);
  };
  /** What a kill leaves: the words in the store. */
  const onPhone = () => (draftId ? (store.getDraft(draftId)?.typedText ?? '') : '');
  return { session, key, at, persists, screen, disk, onPhone, draftId: () => draftId };
}

const LETTERS = 'Asha sang to the moon and the moon sang back to her, softly, all evening long.';

describe('[F04-REQ-011] [RT-WRT-05] a long burst of typing is written at least every 500 ms', () => {
  it('a character every 100 ms for 3 seconds with no pause: written at least every 500 ms', () => {
    const w = openWrite();
    for (let i = 1; i <= 30; i++) {
      w.key(LETTERS.slice(0, i));
      vi.advanceTimersByTime(100);
    }
    const writes = w.persists.filter((p) => p.ok);
    expect(writes.length).toBeGreaterThanOrEqual(5);
    // The first write comes within 500 ms of the first keystroke, and no two are further apart than 500 ms.
    expect(writes[0].at).toBeLessThanOrEqual(WRITE_AUTOSAVE_MS);
    for (let i = 1; i < writes.length; i++) expect(writes[i].at - writes[i - 1].at, `gap before write ${i}`).toBeLessThanOrEqual(WRITE_AUTOSAVE_MS);
    // And the last write is within 500 ms of the end of the burst.
    expect(w.at() - writes[writes.length - 1].at).toBeLessThanOrEqual(WRITE_AUTOSAVE_MS);
  });

  it('a kill at any moment of the burst leaves at most the last 500 ms of typing (10 ms resolution)', () => {
    const w = openWrite();
    const perWindow = WRITE_AUTOSAVE_MS / 100; // characters typed in 500 ms at one every 100 ms
    let typedSoFar = '';
    for (let t = 0; t < 3000; t += 10) {
      if (t % 100 === 0) {
        typedSoFar = LETTERS.slice(0, t / 100 + 1);
        w.key(typedSoFar);
      }
      // A kill here: what is on the phone is a leading part of the words, short by no more than 500 ms of typing.
      const left = w.onPhone();
      expect(typedSoFar.startsWith(left), `at ${t} ms`).toBe(true);
      expect(typedSoFar.length - left.length, `at ${t} ms`).toBeLessThanOrEqual(perWindow);
      vi.advanceTimersByTime(10);
    }
  });

  it('what a reopened Write holds after the kill is what was on the phone', () => {
    const w = openWrite();
    for (let i = 1; i <= 17; i++) {
      w.key(LETTERS.slice(0, i));
      vi.advanceTimersByTime(100);
    }
    // Killed at 1.7 s: the draft, as Tonight would reopen it, holds all but the last 500 ms.
    const reopened = store.getDraft(w.draftId()!)!;
    expect(reopened.typedText).toBe(LETTERS.slice(0, 15));
    expect(reopened.typedText!.length).toBeGreaterThanOrEqual(17 - WRITE_AUTOSAVE_MS / 100);
  });

  it('100 seeded runs of typing and killing at a random moment: never more than 500 ms of typing lost, and never a stale write', () => {
    for (let seed = 1; seed <= 100; seed++) {
      const rnd = mulberry32(seed);
      const w = openWrite();
      // The script: keystrokes of 5 to 400 ms apart, now and then a real pause, now and then a backspace.
      const script: { at: number; value: string }[] = [];
      let value = '';
      let t = 0;
      const count = 5 + Math.floor(rnd() * 76);
      for (let i = 0; i < count; i++) {
        t += rnd() < 0.1 ? 500 + Math.floor(rnd() * 1000) : 5 + Math.floor(rnd() * 395);
        value = rnd() < 0.2 && value.length > 0 ? value.slice(0, -1) : value + LETTERS[i % LETTERS.length];
        script.push({ at: t, value });
      }
      const killAt = 1 + Math.floor(rnd() * (t + 800));
      let clock = 0;
      const sent: { at: number; value: string }[] = [];
      for (const k of script) {
        if (k.at > killAt) break;
        vi.advanceTimersByTime(k.at - clock);
        clock = k.at;
        w.key(k.value);
        sent.push(k);
      }
      vi.advanceTimersByTime(killAt - clock);
      // The kill. Nothing is called after this line.
      const ctx = `seed ${seed}, kill at ${killAt} ms`;
      // A write of blank words with no draft yet writes nothing (writeWords), and there is nothing to lose: it counts as done.
      const lastWrite = [...w.persists].reverse().find((p) => p.ok || (!p.hadDraft && !p.value.trim()));
      const firstUnsaved = sent[lastWrite ? lastWrite.keys : 0];
      if (firstUnsaved) expect(killAt - firstUnsaved.at, ctx).toBeLessThanOrEqual(WRITE_AUTOSAVE_MS);
      // What is on the phone is exactly the newest words at the moment of the last write, not an older burst.
      expect(w.onPhone(), ctx).toBe(lastWrite && (lastWrite.hadDraft || lastWrite.value.trim()) ? sent[lastWrite.keys - 1].value : '');
      // The page: no autosave line, announcement or render except after a real pause of 500 ms.
      for (const e of w.screen) expect(e.sinceKey, `${ctx}, ${e.kind} at ${e.at}`).toBeGreaterThanOrEqual(WRITE_AUTOSAVE_MS);
      w.session.unmount();
      vi.advanceTimersByTime(5000);
    }
  });

  it('a very long burst keeps writing: 30 seconds with no pause', () => {
    const w = openWrite();
    for (let i = 1; i <= 300; i++) {
      w.key(`${LETTERS} ${'x'.repeat(i)}`);
      vi.advanceTimersByTime(100);
      expect(w.at() - (w.persists.filter((p) => p.ok).pop()?.at ?? 0), `at ${w.at()} ms`).toBeLessThanOrEqual(WRITE_AUTOSAVE_MS);
    }
  });
});

describe('[F04-REQ-011] one keystroke and a pause still write once after 500 ms', () => {
  it('writes nothing at 499 ms, the keystroke at 500 ms, and nothing more afterwards', () => {
    const w = openWrite();
    w.key('A');
    vi.advanceTimersByTime(WRITE_AUTOSAVE_MS - 1);
    expect(w.persists).toHaveLength(0);
    expect(w.session.pending()).toBe(true);
    vi.advanceTimersByTime(1);
    expect(w.persists).toHaveLength(1);
    expect(w.persists[0]).toMatchObject({ value: 'A', ok: true });
    expect(w.onPhone()).toBe('A');
    expect(w.session.pending()).toBe(false);
    vi.advanceTimersByTime(10_000);
    expect(w.persists).toHaveLength(1);
  });

  it('a pause after a short phrase writes it once, and the page hears of it once', () => {
    const w = openWrite();
    for (let i = 1; i <= 3; i++) {
      w.key(LETTERS.slice(0, i));
      vi.advanceTimersByTime(100);
    }
    vi.advanceTimersByTime(10_000);
    expect(w.persists.filter((p) => p.ok).map((p) => p.value)).toEqual([LETTERS.slice(0, 3)]);
    expect(w.screen).toHaveLength(1);
  });
});

describe('[F04-REQ-011] the write is the newest words when the timer fires, not the first of the burst', () => {
  it('the timer armed by "A" writes what was typed by the time it fires', () => {
    const w = openWrite();
    w.key('A');
    vi.advanceTimersByTime(100);
    w.key('As');
    vi.advanceTimersByTime(100);
    w.key('Asa');
    vi.advanceTimersByTime(100);
    w.key('Asha');
    vi.advanceTimersByTime(WRITE_AUTOSAVE_MS - 300);
    expect(w.persists.map((p) => p.value)).toEqual(['Asha']);
    expect(w.onPhone()).toBe('Asha');
  });

  it('a keystroke 300 ms in does not push the write past 500 ms, and a keystroke after the write starts the next one', () => {
    const w = openWrite();
    w.key('A');
    vi.advanceTimersByTime(300);
    w.key('As'); // an old debounce would restart its 500 ms here
    vi.advanceTimersByTime(200);
    expect(w.persists.map((p) => [p.at, p.value])).toEqual([[500, 'As']]);
    vi.advanceTimersByTime(100);
    w.key('Asa'); // 600 ms: the first keystroke after the write
    vi.advanceTimersByTime(400);
    w.key('Asha'); // 1000 ms
    vi.advanceTimersByTime(99);
    expect(w.persists).toHaveLength(1); // the second write is due 500 ms after "Asa", at 1100
    vi.advanceTimersByTime(1);
    expect(w.persists.map((p) => [p.at, p.value])).toEqual([[500, 'As'], [1100, 'Asha']]);
  });

  it('words deleted in the middle of the burst are written as the shorter newest words', () => {
    const w = openWrite();
    w.key('Asha sang');
    vi.advanceTimersByTime(200);
    w.key('Asha');
    vi.advanceTimersByTime(300);
    expect(w.onPhone()).toBe('Asha');
  });
});

describe('[F04-REQ-011] the autosave line, its announcement and the render wait for a real pause', () => {
  it('an unbroken burst writes quietly many times and the page is told nothing until the pause', () => {
    const w = openWrite();
    for (let i = 1; i <= 30; i++) {
      w.key(LETTERS.slice(0, i));
      vi.advanceTimersByTime(100);
    }
    expect(w.persists.length).toBeGreaterThanOrEqual(5);
    expect(w.persists.every((p) => p.quiet)).toBe(true); // write.tsx: no setSaveState, announce or setText
    expect(w.screen).toHaveLength(0);
    // The person stops: after a real pause the page is told once, and nothing is written again.
    const written = w.persists.length;
    vi.advanceTimersByTime(WRITE_AUTOSAVE_MS - 100 - 1);
    expect(w.screen).toHaveLength(0);
    vi.advanceTimersByTime(1);
    expect(w.screen).toHaveLength(1);
    expect(w.screen[0]).toMatchObject({ value: LETTERS.slice(0, 30), sinceKey: WRITE_AUTOSAVE_MS });
    vi.advanceTimersByTime(10_000);
    expect(w.screen).toHaveLength(1);
    expect(w.persists).toHaveLength(written);
  });

  it('a burst that ends with words not yet on the phone writes them at the pause, and the page is told with that write', () => {
    const w = openWrite();
    w.key('Asha');
    vi.advanceTimersByTime(300);
    w.key('Asha sang'); // 300 ms: the quiet write is due at 500
    vi.advanceTimersByTime(200);
    expect(w.persists.map((p) => [p.value, p.quiet])).toEqual([['Asha sang', true]]);
    vi.advanceTimersByTime(100);
    w.key('Asha sang a'); // 600 ms: armed again, due at 1100; the pause is due at 1100 too
    vi.advanceTimersByTime(WRITE_AUTOSAVE_MS);
    expect(w.persists.filter((p) => !p.quiet).map((p) => p.value)).toEqual(['Asha sang a']);
    expect(w.screen.map((e) => e.kind)).toEqual(['write']);
  });

  it('two bursts with a pause between: the page hears of each pause once', () => {
    const w = openWrite();
    let text = '';
    for (let burst = 0; burst < 2; burst++) {
      for (let i = 0; i < 20; i++) {
        text += 'a';
        w.key(text);
        vi.advanceTimersByTime(100);
      }
      vi.advanceTimersByTime(2000);
    }
    expect(w.screen).toHaveLength(2);
    expect(w.onPhone()).toBe(text);
  });
});

describe('[F04-REQ-011] every way out still writes the newest words once, and never twice', () => {
  /** A burst of 2.3 s, so quiet writes have happened and the last 300 ms are not on the phone yet. */
  const burst = () => {
    const w = openWrite();
    let text = '';
    for (let i = 0; i < 23; i++) {
      text += LETTERS[i];
      w.key(text);
      vi.advanceTimersByTime(100);
    }
    return { w, text };
  };
  const exits: [string, (s: ReturnType<typeof openWrite>['session']) => unknown][] = [
    ['close', (s) => s.close()],
    ['keep', (s) => s.keep()],
    ['unmount (a swipe down)', (s) => s.unmount()],
    ['background (the app leaves the foreground)', (s) => s.background()],
  ];

  it.each(exits)('%s mid-burst writes the newest words, once', (_name, exit) => {
    const { w, text } = burst();
    expect(w.onPhone().length).toBeLessThan(text.length); // the tail is only in the session
    const before = w.persists.length;
    exit(w.session);
    expect(w.onPhone()).toBe(text);
    expect(w.persists).toHaveLength(before + 1);
    // Nothing writes again: not the disarmed timers, and not any of the other ways out.
    vi.advanceTimersByTime(10_000);
    w.session.unmount();
    w.session.background();
    expect(w.persists).toHaveLength(before + 1);
  });

  it.each([
    ['unmount (a swipe down)', (s: ReturnType<typeof openWrite>['session']) => s.unmount()],
    ['background (the app leaves the foreground)', (s: ReturnType<typeof openWrite>['session']) => s.background()],
  ])('%s when a quiet write has just put every word on the phone writes nothing', (_name, exit) => {
    const w = openWrite();
    let text = '';
    for (let i = 0; i < 20; i++) {
      text += LETTERS[i];
      w.key(text);
      vi.advanceTimersByTime(100);
    }
    expect(w.onPhone()).toBe(text); // the write at 2.0 s took every word
    const before = w.persists.length;
    exit(w.session);
    expect(w.persists).toHaveLength(before);
    expect(w.onPhone()).toBe(text);
  });

  it('leaving the foreground with every word on the phone leaves the pause to say so when it fires, with no second write', () => {
    const w = openWrite();
    let text = '';
    for (let i = 0; i < 20; i++) {
      text += LETTERS[i];
      w.key(text);
      vi.advanceTimersByTime(100);
    }
    const before = w.persists.length;
    w.session.background();
    expect(w.persists).toHaveLength(before);
    vi.advanceTimersByTime(WRITE_AUTOSAVE_MS);
    expect(w.persists).toHaveLength(before);
    expect(w.screen.map((e) => e.kind)).toEqual(['settled']);
  });

  it('an empty typed draft is still deleted on Close, after quiet writes put words in it', () => {
    const w = openWrite();
    let text = '';
    for (let i = 0; i < 12; i++) {
      text += LETTERS[i];
      w.key(text);
      vi.advanceTimersByTime(100);
    }
    const id = w.draftId()!;
    expect(store.getDraft(id)?.typedText).not.toBe('');
    w.key('');
    expect(w.session.close()).toBe(true);
    expect(store.getDraft(id)).toBeNull();
    const before = w.persists.length;
    vi.advanceTimersByTime(10_000);
    w.session.unmount();
    w.session.background();
    expect(w.persists).toHaveLength(before); // nothing brings the deleted draft back
  });
});

describe('[F04-REQ-011] a write that did not go through is tried again', () => {
  it('a quiet write that fails changes nothing on the page; the next one, a keystroke later, goes through', () => {
    const w = openWrite();
    for (let i = 1; i <= 5; i++) {
      w.key(LETTERS.slice(0, i));
      vi.advanceTimersByTime(100);
    }
    expect(w.onPhone()).toBe(LETTERS.slice(0, 5)); // the write at 500 ms
    w.disk.full = true;
    for (let i = 6; i <= 10; i++) {
      w.key(LETTERS.slice(0, i));
      vi.advanceTimersByTime(100);
    }
    expect(w.persists.some((p) => !p.ok && p.quiet)).toBe(true); // tried at 1 s, did not go through
    expect(w.onPhone()).toBe(LETTERS.slice(0, 5));
    expect(w.screen).toHaveLength(0); // no "Not saved yet" in the middle of a burst
    w.disk.full = false;
    for (let i = 11; i <= 15; i++) {
      w.key(LETTERS.slice(0, i));
      vi.advanceTimersByTime(100);
    }
    expect(w.onPhone()).toBe(LETTERS.slice(0, 15)); // retried within 500 ms of the next keystroke
    expect(w.screen).toHaveLength(0);
  });

  it('a quiet write that failed is tried again at the pause, and the page is told then', () => {
    const w = openWrite();
    w.key('Asha');
    vi.advanceTimersByTime(WRITE_AUTOSAVE_MS);
    expect(w.onPhone()).toBe('Asha');
    const told = w.screen.length;
    w.disk.full = true;
    w.key('Asha sang');
    vi.advanceTimersByTime(200);
    w.key('Asha sang to'); // 200 ms: the quiet write is due at 500 and fails
    vi.advanceTimersByTime(WRITE_AUTOSAVE_MS - 200);
    expect(w.persists.filter((p) => !p.ok && p.quiet)).toHaveLength(1);
    expect(w.screen).toHaveLength(told); // nothing said in the middle of the burst
    vi.advanceTimersByTime(200); // 500 ms after the last keystroke: the pause tries again, loudly
    expect(w.persists.filter((p) => !p.ok && !p.quiet)).toHaveLength(1);
    expect(w.screen).toHaveLength(told + 1); // "Not saved yet" is the page's to show now
    expect(w.onPhone()).toBe('Asha');
    expect(w.session.pending()).toBe(false);
    w.disk.full = false;
    w.session.background(); // the way out that retries (QE-06)
    expect(w.onPhone()).toBe('Asha sang to');
  });

  it('words that failed to write are written again when Write unmounts', () => {
    const w = openWrite();
    w.key('Asha');
    vi.advanceTimersByTime(WRITE_AUTOSAVE_MS);
    w.disk.full = true;
    w.key('Asha sang');
    vi.advanceTimersByTime(WRITE_AUTOSAVE_MS * 2);
    expect(w.onPhone()).toBe('Asha');
    w.disk.full = false;
    const before = w.persists.length;
    w.session.unmount();
    expect(w.onPhone()).toBe('Asha sang');
    expect(w.persists).toHaveLength(before + 1);
  });
});

describe('[F04-REQ-011] write.tsx keeps the burst quiet', () => {
  const code = readFileSync(join(__dirname, '..', 'src', 'app', 'write.tsx'), 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/(^|[^:])\/\/.*$/gm, '$1');
  const persist = code.slice(code.indexOf('const persist = '), code.indexOf('const settled = '));
  const settled = code.slice(code.indexOf('const settled = '), code.indexOf('const persistRef = useRef(persist)'));

  it('a quiet write puts the words on the phone and returns before the autosave line, the announcement and the render', () => {
    const quietReturn = persist.indexOf('if (quiet) return r.ok;');
    expect(quietReturn).toBeGreaterThan(persist.indexOf('writeWords('));
    expect(quietReturn).toBeGreaterThan(persist.indexOf('draftId.current = r.draftId;')); // the draft id is kept: the next write updates it
    const beforeReturn = persist.slice(0, quietReturn);
    expect(beforeReturn).not.toMatch(/setSaveState|setText|announce/);
    const afterReturn = persist.slice(quietReturn);
    expect(afterReturn).toMatch(/setSaveState\(r\.saveState\)/);
    expect(afterReturn).toMatch(/announce\(copy\.write\.notSaved\)/);
    expect(afterReturn).toMatch(/setText\(value\)/);
    expect(afterReturn).toMatch(/announceSaved\(\)/);
  });

  it('settled is the pause: the line, the render and the announcement, at most every 10 seconds', () => {
    expect(settled).toMatch(/setSaveState\('saved'\);\s*setText\(value\);\s*announceSaved\(\);/);
    expect(code).toMatch(/const announceSaved = \(\) => \{\s*const now = Date\.now\(\);\s*if \(now - lastAnnounced\.current > ANNOUNCE_EVERY_MS\) \{\s*lastAnnounced\.current = now;\s*announce\(pendingCopy\.write\.savedOnPhone\);\s*\}\s*\};/);
  });

  it('a keystroke still renders Write only when the page goes from empty to words or back, and Write keeps no timer of its own', () => {
    expect(code).toMatch(/if \(pageEmptinessChanged\(session\.latest\(\), value\)\) setText\(value\);\s*session\.change\(value\);/);
    expect(code).not.toMatch(/setTimeout\(|clearTimeout\(|setInterval\(/);
  });

  it('both callbacks reach the session through refs, so the session outlives the render that made it', () => {
    expect(code).toMatch(/persist: \(value, quiet\) => persistRef\.current\(value, quiet\),\s*settled: \(value\) => settledRef\.current\(value\),/);
    expect(code).toMatch(/const settledRef = useRef\(settled\);\s*settledRef\.current = settled;/);
  });
});

/** A small seeded random number generator (mulberry32), so a failing run can be replayed. */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

describe('[BL-378] a very long letter is held calmly, never cut', () => {
  it('[BL-378] the page is full at 100,000 characters and not before', async () => {
    const { WRITE_MAX_CHARS, writePageFull } = await import('../src/components/capture/write-session.logic');
    expect(WRITE_MAX_CHARS).toBe(100_000);
    expect(writePageFull(WRITE_MAX_CHARS - 1)).toBe(false);
    expect(writePageFull(WRITE_MAX_CHARS)).toBe(true);
  });

  it('[BL-378] Write never caps the field (D-057), says so from packages/content, and keeps "Not saved yet" first', async () => {
    const { readFileSync } = await import('node:fs');
    const src = readFileSync(new URL('../src/app/write.tsx', import.meta.url), 'utf8');
    expect(src).not.toMatch(/maxLength=/);
    expect(src).toContain('copy.write.tooLong');
    expect(src).toMatch(/pageFull && saveState !== 'failed'/);
    const { copy } = await import('../src/lib/copy');
    expect(copy.write.tooLong).not.toMatch(/[–—…“”]/);
  });

  it('[BL-378] a 100k-character burst is written as the newest words, once per window', () => {
    const w = openWrite();
    const big = 'a'.repeat(100_000);
    w.key(big);
    vi.advanceTimersByTime(WRITE_AUTOSAVE_MS);
    expect(w.onPhone()).toBe(big);
    expect(w.persists.filter((p) => p.ok).length).toBe(1);
  });
});
