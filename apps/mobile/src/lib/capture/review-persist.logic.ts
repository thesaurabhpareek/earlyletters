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
 * Pure: no React Native. Tested in Node (test/review-persist.test.ts, test/review-persist.replay.test.ts).
 */
import type { Edit } from '@scribe/core';
/** Review's view (components/capture/review-view.logic ReviewView; the same two values). */
export type ReviewView = 'fixes' | 'exact';

/**
 * How long typed words wait before they are written (F04-REQ-011: at most 500 ms). A kill inside this window loses at
 * most the keystrokes of the last 300 ms; Review also writes at once when the app leaves the foreground, when Done is
 * tapped and when Review closes, so a kill from the app switcher loses nothing.
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
  /** The person's words changed: written after TYPED_WRITE_DEBOUNCE_MS of quiet. */
  text(text: string | null): void;
  /** Writes typed words still waiting, now (leaving the foreground, Done, Close). */
  flush(): void;
  /** Drops typed words still waiting (Keep: the letter took them; Let it go). */
  cancel(): void;
}

/**
 * Review's writer. `write` takes a patch and stores it on the draft with `base` (store.setDraftReview). A failed
 * write never reaches the screen: the words are still on screen and the next change writes again.
 */
export function reviewWriter(write: (patch: ReviewPatch) => void, delayMs = TYPED_WRITE_DEBOUNCE_MS, timers: Timers = realTimers): ReviewWriter {
  let pending: { text: string | null } | null = null;
  let handle: unknown = null;
  const safe = (patch: ReviewPatch) => {
    try {
      write(patch);
    } catch {
      // Kept on screen; written again with the next change, Done or Close.
    }
  };
  const stop = () => {
    if (handle !== null) timers.clearTimeout(handle);
    handle = null;
  };
  const flush = () => {
    stop();
    if (!pending) return;
    const p = pending;
    pending = null;
    safe({ text: p.text });
  };
  return {
    putBack: (list) => safe({ putBack: list }),
    view: (view) => safe({ view }),
    text: (text) => {
      pending = { text };
      stop();
      handle = timers.setTimeout(flush, delayMs);
    },
    flush,
    cancel: () => {
      stop();
      pending = null;
    },
  };
}
