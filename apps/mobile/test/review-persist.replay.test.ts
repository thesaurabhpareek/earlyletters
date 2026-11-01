/// <reference types="node" />
/**
 * Replay (SR-C-06, CR-39; RT-REV-02, RT-REV-07): a seeded random run of Review — fixes put back and undone, the view
 * switched, the person's words typed with pauses, Done — writes through the real store over a file on disk
 * (node:sqlite, as store.shelf.test.ts), and at a seeded random moment every bit of in-memory state is dropped: no
 * flush, no unmount, the store closed as a kill leaves it. The database is opened again from the file and Review's
 * mount is rebuilt exactly as review.tsx does it (restorable, a fresh verified clean, restoreApplied). The final text
 * must be the one on screen at the kill, except typed words still inside the 300 ms debounce, which may be lost and
 * nothing older (F04-REQ-011). 100 seeds. Fictional family "Asha" only.
 */
import { copyFileSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, describe, expect, it, vi } from 'vitest';
import { faithfulClean, finalText, type Edit } from '@scribe/core';
import { nodeDb } from './helpers/node-db';

vi.mock('expo-crypto', () => ({ getRandomBytes: (n: number) => new Uint8Array(n).fill(7) }));
vi.mock('../src/lib/db/repos/open-native', () => ({
  openNativeDb: () => {
    throw new Error('native open must not be used in tests');
  },
}));

const store = await import('../src/lib/store');
const { TYPED_WRITE_DEBOUNCE_MS, restorable, restoreApplied, reviewWriter, withoutPutBack, wordsBase } = await import(
  '../src/lib/capture/review-persist.logic'
);
type Timers = import('../src/lib/capture/review-persist.logic').Timers;
type ReviewView = 'fixes' | 'exact';

const dir = mkdtempSync(join(tmpdir(), 'review-replay-'));
afterAll(() => rmSync(dir, { recursive: true, force: true }));

const SAYINGS = [
  'um Asha, you you laughed at the rain today and uh we we stood at the window.',
  'so um today Asha found the the blue cup and and would not let go of it, uh, all morning.',
  'Asha, uh, you said Papa Papa when the door opened and um I I could not stop smiling.',
];
const WORDS = ['and', 'the', 'rain', 'Asha', 'laughed', 'Mama', 'today', 'cup'];

/** mulberry32: small, seeded, the same on every machine. */
function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** A clock the test moves; timers fire only when it passes them. */
function virtualTimers() {
  let now = 0;
  let next = 1;
  const due = new Map<number, { at: number; fn: () => void }>();
  const timers: Timers = {
    setTimeout: (fn, ms) => {
      const h = next++;
      due.set(h, { at: now + ms, fn });
      return h;
    },
    clearTimeout: (h) => void due.delete(h as number),
  };
  const advance = (ms: number) => {
    const until = now + ms;
    for (;;) {
      const first = [...due.entries()].filter(([, t]) => t.at <= until).sort((a, b) => a[1].at - b[1].at)[0];
      if (!first) break;
      due.delete(first[0]);
      now = first[1].at;
      first[1].fn();
    }
    now = until;
  };
  return { timers, advance, now: () => now };
}

const cleanOf = (raw: string) => faithfulClean(raw, { level: 'clean', dictionary: [] }).applied;
const shown = (raw: string, s: { applied: Edit[]; view: ReviewView; userText: string | null }) =>
  s.userText ?? finalText(raw, s.view === 'exact' ? [] : s.applied);

function open(path: string) {
  store.closeStore();
  const h = nodeDb(path);
  // A kill here is the app's process going, not the disk: the OS still has every committed write. Skipping fsync keeps
  // 100 runs fast and changes nothing about what a closed connection leaves in the file.
  h.db.exec('PRAGMA synchronous = OFF');
  let seq = 0;
  const ok = store.openStore({
    open: () => ({ db: h.db, close: () => {} }),
    now: () => '2026-10-03T09:00:00.000Z',
    newId: () => `0199a5b0-0000-7000-8000-${String(++seq).padStart(12, '0')}`,
  }).ok;
  expect(ok).toBe(true);
  return h;
}

/** Review's mount after a reopen, as review.tsx builds it. */
function mount(draftId: string, defaultView: ReviewView) {
  const d = store.getDraft(draftId)!;
  const raw = d.rawTranscript!;
  const saved = restorable(store.getDraftReview(draftId), raw);
  const kept = restoreApplied(cleanOf(raw), saved?.putBack ?? []);
  return { raw, applied: kept.applied, putBacks: kept.putBack, view: saved?.view ?? defaultView, userText: saved?.text ?? null };
}

/** One migrated database with Asha's book, copied for every run (migrating 100 times would only test the migrator). */
let template: { path: string; child: string } | null = null;
function fresh(seed: number): { path: string; child: string } {
  if (!template) {
    const path = join(dir, 'template.db');
    const h = open(path);
    const child = store.addChild({ name: 'Asha', birthday: '2026-03-01', dueDate: null, signsAs: 'Mama' }).id;
    h.close();
    store.closeStore();
    template = { path, child };
  }
  const path = join(dir, `seed-${seed}.db`);
  copyFileSync(template.path, path);
  return { path, child: template.child };
}

function run(seed: number) {
  const r = rng(seed);
  const pick = <T>(xs: readonly T[]) => xs[Math.floor(r() * xs.length)];
  const { path, child } = fresh(seed);
  let h = open(path);
  const draft = store.createDraft({ childId: child, captureMode: 'spoken', promptKey: null, audioUri: 'file:///Documents/recording-1.m4a', audioDurationMs: 9000 });
  const said = pick(SAYINGS);
  store.setDraftTranscript(draft.id, said);
  const defaultView: ReviewView = r() < 0.2 ? 'exact' : 'fixes';

  const clock = virtualTimers();
  // The screen's state, as review.tsx holds it, and the same writer.
  let s = mount(draft.id, defaultView);
  let restored: Edit | null = null;
  const base = wordsBase(s.raw);
  const writer = reviewWriter((p) => void store.setDraftReview(draft.id, base, p), TYPED_WRITE_DEBOUNCE_MS, clock.timers);

  // Typed words the screen holds but may not have written yet: when they changed, and what stood before them on disk.
  let typedAt = -Infinity;
  let durableText: string | null = null; // the person's words a kill cannot lose
  let pendingText: string | null | undefined; // set while a debounce is open

  const steps = 5 + Math.floor(r() * 40);
  const killAt = Math.floor(r() * (steps + 1));
  for (let i = 0; i < steps && i < killAt; i++) {
    const op = r();
    if (op < 0.3 && s.view === 'fixes' && s.userText === null && s.applied.length > 0) {
      const idx = Math.floor(r() * s.applied.length);
      const edit = s.applied[idx];
      s = { ...s, applied: s.applied.filter((_, j) => j !== idx), putBacks: [...s.putBacks, edit] };
      restored = edit;
      writer.putBack(s.putBacks);
    } else if (op < 0.4 && restored) {
      s = { ...s, applied: [...s.applied, restored], putBacks: withoutPutBack(s.putBacks, restored) };
      restored = null;
      writer.putBack(s.putBacks);
    } else if (op < 0.5 && s.userText === null) {
      const view: ReviewView = s.view === 'fixes' ? 'exact' : 'fixes';
      s = { ...s, view };
      restored = null;
      writer.view(view);
    } else if (op < 0.85) {
      const cur = shown(s.raw, s);
      const text = r() < 0.7 ? `${cur} ${pick(WORDS)}` : cur.slice(0, Math.max(0, cur.length - 1 - Math.floor(r() * 5)));
      s = { ...s, userText: text };
      pendingText = text;
      typedAt = clock.now();
      writer.text(text);
    } else if (op < 0.9 && pendingText !== undefined) {
      writer.flush(); // Done, or the app leaving the foreground
      durableText = pendingText;
      pendingText = undefined;
    }
    clock.advance(Math.floor(r() * 2 * TYPED_WRITE_DEBOUNCE_MS));
    if (pendingText !== undefined && clock.now() - typedAt >= TYPED_WRITE_DEBOUNCE_MS) {
      durableText = pendingText;
      pendingText = undefined;
    }
  }

  // The kill: in-memory state is gone with no flush; the file is all that is left.
  const onScreen = shown(s.raw, s);
  const lostWindowOpen = pendingText !== undefined;
  const expectedText = shown(s.raw, { ...s, userText: lostWindowOpen ? durableText : s.userText });
  h.close();
  store.closeStore();

  h = open(path);
  const back = mount(draft.id, defaultView);
  expect(back.raw).toBe(said); // raw_transcript untouched
  expect(shown(back.raw, back), `seed ${seed}`).toBe(expectedText);
  if (!lostWindowOpen) expect(shown(back.raw, back), `seed ${seed}`).toBe(onScreen);
  // Everything shown after reopen is the person's or a fix the verifier accepted just now.
  const verified = cleanOf(back.raw);
  for (const e of back.applied) expect(verified).toContainEqual(e);
  h.close();
  store.closeStore();
  return lostWindowOpen;
}

describe('[SR-C-06] RT-REV-02 replay: Review\'s final text survives a kill at any moment', () => {
  it('100 seeded runs reopen to the same final text (typed words inside the debounce aside)', () => {
    let windows = 0;
    for (let seed = 1; seed <= 100; seed++) if (run(seed)) windows++;
    // The runs reach both cases: a kill with nothing pending, and one inside the typed debounce.
    expect(windows).toBeGreaterThan(0);
    expect(windows).toBeLessThan(100);
  }, 120_000);
});
