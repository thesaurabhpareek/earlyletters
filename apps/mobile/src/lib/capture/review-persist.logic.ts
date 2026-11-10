/**
 * Review's own choices survive a kill (SR-C-06, CR-39; RT-REV-02, RT-REV-07; BL-377, WP-F06-08b).
 *
 * What the person chose in Review (the fixes they put back, "With small fixes" or "Exactly as said", and their own
 * words from Change words) is written to the local draft as it happens (db v9: drafts.review_*), and read back when
 * Review opens again, so the reopened Review shows the same final text. Cleared at Keep (the draft row goes) and at
 * Let it go (drafts.beginDiscard).
 *
 * Constitution: these are the person's own choices and words. Nothing here proposes, fixes or adds a word. A put-back
 * is stored as the machine fix it removes; on reopen the engine proposes and verifies its fixes again (cleanSpoken,
 * verifyEdits) and `restoreApplied` only LEAVES OUT the ones the person put back. A stored fix is never applied from
 * storage. raw_transcript is never read for writing and never changed.
 *
 * Pure: no React Native. Tested in Node (test/store.review-v9.test.ts, test/review-writer-autosave.test.ts,
 * test/review-persist.replay.test.ts, test/review-persist.wiring.test.ts).
 */
import type { Edit } from '@scribe/core';
/** Review's view (components/capture/review-view.logic ReviewView; the same two values). */
export type ReviewView = 'fixes' | 'exact';

/**
 * The most that typed words wait before they are written (F04-REQ-011: at most 500 ms; F06-REQ-036: any change in Review
 * is on the draft within 500 ms). The first change after a write arms one timer and later changes do not move it, so
 * however long the burst of editing, a kill, a crash or a flat battery loses at most the keystrokes of the last 300 ms.
 * The name says debounce because it was one; it is now the maximum wait. Review also writes at once when the app
 * leaves the foreground, when Done is tapped, when Review closes and before Keep, so a kill from the app switcher
 * loses nothing.
 */
export const TYPED_WRITE_DEBOUNCE_MS = 300;

/** What a draft holds of Review's choices. All null on a draft where nothing was chosen. */
export interface ReviewSaved {
  putBack: Edit[];
  view: ReviewView | null;
  text: string | null;
  /** Fingerprint of the words the choices were made on (`wordsBase`). */
  base: string | null;
}

/** A partial write: only the named parts change. `base` always goes with it. */
export interface ReviewPatch {
  putBack?: Edit[];
  view?: ReviewView;
  text?: string | null;
}

/**
 * A short fingerprint of the words Review opened on (FNV-1a 32-bit plus the length). Stored with the choices so that
 * choices made on other words (a typed draft whose words changed in Write, or on another phone) are never laid over
 * new words. Not a security hash: a match only lets the person's own choices come back.
 */
export function wordsBase(words: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < words.length; i++) {
    h ^= words.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return `${words.length}:${h.toString(16).padStart(8, '0')}`;
}

const sameEdit = (a: Edit, b: Edit) =>
  a.type === b.type && a.start === b.start && a.end === b.end && a.original === b.original && a.replacement === b.replacement && a.source === b.source;

const isEdit = (x: unknown): x is Edit => {
  if (!x || typeof x !== 'object') return false;
  const e = x as Record<string, unknown>;
  return (
    typeof e.type === 'string' && typeof e.start === 'number' && typeof e.end === 'number' &&
    typeof e.original === 'string' && typeof e.replacement === 'string' && typeof e.source === 'string'
  );
};

/** The stored put-backs, read defensively: a bad value means none (a draft must always open). */
export function parsePutBack(json: string | null | undefined): Edit[] {
  if (!json) return [];
  try {
    const v = JSON.parse(json) as unknown;
    return Array.isArray(v) ? v.filter(isEdit) : [];
  } catch {
    return [];
  }
}

export function parseView(value: string | null | undefined): ReviewView | null {
  return value === 'fixes' || value === 'exact' ? value : null;
}

/**
 * The fixes in Review after reopening: the engine's freshly verified fixes, less each one the person put back. Each
 * stored put-back leaves out at most one identical fix. A stored fix that the engine no longer proposes (a different
 * engine after an update) leaves out nothing and is dropped; the result is always a subset of `fresh`.
 */
export function restoreApplied(fresh: readonly Edit[], putBack: readonly Edit[]): { applied: Edit[]; putBack: Edit[] } {
  const left = [...putBack];
  const kept: Edit[] = [];
  const matched: Edit[] = [];
  for (const e of fresh) {
    const i = left.findIndex((p) => sameEdit(p, e));
    if (i >= 0) {
      matched.push(left[i]);
      left.splice(i, 1);
    } else kept.push(e);
  }
  return { applied: kept, putBack: matched };
}

/** The put-backs after the person undoes one (the last identical one goes). */
export function withoutPutBack(putBack: readonly Edit[], edit: Edit): Edit[] {
  const out = [...putBack];
  for (let i = out.length - 1; i >= 0; i--) {
    if (sameEdit(out[i], edit)) {
      out.splice(i, 1);
      break;
    }
  }
  return out;
}

/** What to restore on mount, or null when nothing applies (none saved, or saved on other words). */
export function restorable(saved: ReviewSaved | null, words: string): ReviewSaved | null {
  if (!saved || saved.base === null || saved.base !== wordsBase(words)) return null;
  if (saved.putBack.length === 0 && saved.view === null && saved.text === null) return null;
  return saved;
}

/**
 * Review's mount (review.tsx calls exactly this, and the replay test does too): what the person chose before, on these
 * same words only, else the defaults. `putBack` seeds the put-backs that `restoreApplied` leaves out once the engine
 * has proposed and verified its fixes for `words`.
 */
export function mountReview(input: { saved: ReviewSaved | null; words: string; defaultView: ReviewView }): {
  saved: ReviewSaved | null;
  view: ReviewView;
  userText: string | null;
  putBack: Edit[];
} {
  const saved = restorable(input.saved, input.words);
  return { saved, view: saved?.view ?? input.defaultView, userText: saved?.text ?? null, putBack: saved?.putBack ?? [] };
}

export interface Timers {
  setTimeout: (fn: () => void, ms: number) => unknown;
  clearTimeout: (handle: unknown) => void;
}

const realTimers: Timers = {
  setTimeout: (fn, ms) => setTimeout(fn, ms),
  clearTimeout: (h) => clearTimeout(h as ReturnType<typeof setTimeout>),
};

export interface ReviewWriter {
  /** A fix put back or restored: written at once. */
  putBack(list: Edit[]): void;
  /** The view chosen: written at once. */
  view(view: ReviewView): void;
  /** The person's words changed: written within TYPED_WRITE_DEBOUNCE_MS, however long the editing goes on. */
  text(text: string | null): void;
  /** Writes typed words still waiting, now, and leaves no timer (leaving the foreground, Done, Close, unmount, Keep). */
  flush(): void;
  /** Drops typed words still waiting and the timer (Keep: the letter took them; Let it go). */
  cancel(): void;
}

/**
 * Review's writer. `write` takes a patch and stores it on the draft with `base` (store.setDraftReview). A failed
 * write never reaches the screen: the words are still on screen and are written again later.
 *
 * Typed words (F06-REQ-036, F04-REQ-011; the same shape as Write's autosave, write-session.logic.ts): the first change
 * after a write arms one timer, later changes do not move it, and when it fires it writes the newest words, not the
 * ones it was armed with. A pause needs no timer of its own: the timer was armed by the first change after the last
 * write, so it is never later than a pause would be. Words a timer already wrote are not written twice.
 *
 * A write that throws (the store failed) leaves the words waiting and disarms the timer: they are written again at the
 * next change, at flush (Done, Close, unmount, leaving the foreground, Keep), and only there. Nothing retries on a
 * timer, so a draft that is gone can never loop. setDraftReview returns false for a refusal (the draft is being
 * recorded or let go, or is gone, or has no base); that is not a failure, so the return value is not looked at: the
 * words stop waiting, as if written, and are not retried (review.tsx's callback returns nothing either).
 */
export function reviewWriter(
  write: (patch: ReviewPatch) => void,
  delayMs = TYPED_WRITE_DEBOUNCE_MS,
  timers: Timers = realTimers,
): ReviewWriter {
  // The newest typed words not yet on the draft, or null when none wait.
  let waiting: { text: string | null } | null = null;
  let handle: unknown = null;
  const disarm = () => {
    if (handle !== null) timers.clearTimeout(handle);
    handle = null;
  };
  // Writes the words that wait, now. They stop waiting once the store has answered, true or false (a refusal is final);
  // a throw leaves them waiting.
  const send = () => {
    if (!waiting) return;
    try {
      write({ text: waiting.text });
    } catch {
      // Kept on screen and kept waiting; written again with the next change, Done, Close or unmount.
      return;
    }
    waiting = null;
  };
  // Put-backs and the view are written at once. Only typed words wait, so a throw here is not retried: the next
  // put-back or view change writes its own value again.
  const safe = (patch: ReviewPatch) => {
    try {
      write(patch);
    } catch {
      // Nothing reaches the screen.
    }
  };
  const flush = () => {
    disarm();
    send();
  };
  return {
    putBack: (list) => safe({ putBack: list }),
    view: (view) => safe({ view }),
    text: (text) => {
      waiting = { text };
      // Not re-armed by later changes: that would make this a debounce again, and a long burst would write nothing.
      if (handle !== null) return;
      handle = timers.setTimeout(() => {
        handle = null;
        send(); // the newest words now, not the words this timer was armed with
      }, delayMs);
    },
    flush,
    cancel: () => {
      disarm();
      waiting = null;
    },
  };
}
