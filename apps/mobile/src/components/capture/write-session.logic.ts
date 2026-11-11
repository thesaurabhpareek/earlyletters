/**
 * Write's words between the keyboard and this phone (S19; founder report on TestFlight build 1; PR #545 review B).
 *
 * The page is uncontrolled: each keystroke lands here (`change`), never back in the field. The words reach this phone
 * at least every `delayMs` while someone types (F04-REQ-011, RT-WRT-05): the first keystroke after a write arms one
 * timer, later keystrokes do not move it, and when it fires it writes the newest words, not the ones it was armed with.
 * So a kill, a crash or a flat battery loses at most the last `delayMs` of typing, however long the burst. That write
 * is quiet (`persist(value, true)`): it puts the words on the phone and the page does nothing else, so the autosave
 * line, its announcement and a render of Write still come only after a real pause. A second timer, moved by every
 * keystroke, finds that pause: after `delayMs` with no keystroke the newest words are written, or, when a quiet write
 * already put them there, only `settled` is told (words already on the phone are not written twice).
 * Every way out writes the newest words first, so the last keystrokes typed inside the window are never dropped:
 * - Close (`close`): an empty typed draft is deleted (a recording draft is always kept); words that cannot be written
 *   keep Write open (false), so they are never lost.
 * - "Add to Asha's book" and "Keep private" (`keep`): the words are written now, then the draft is handed to Review;
 *   null when they could not be written (Write stays, "Not saved yet" shows).
 * - A swipe down or any other unmount (`unmount`): a pending write, or one that did not go through, is written now with
 *   the newest words.
 * - The app leaving the foreground (`background`, on AppState `inactive` or `background`; QE-06): the newest words are
 *   written now, because iOS pauses timers in the background and may end the app before the timer ever fires. A write
 *   that did not go through is tried again here too. Words already on the phone are not written twice.
 * A write that did not go through is tried again by the next quiet write (a keystroke later, within `delayMs`), and
 * shown, as "Not saved yet", at the next pause.
 * Pure and timer-injected, so it runs in Node with fake timers against the real store (test/write-session.test.ts,
 * test/write-autosave.test.ts).
 */
export const WRITE_AUTOSAVE_MS = 500;

export type WriteSessionIo = {
  /**
   * Write the words to this phone (write.tsx `persist`: writeWords, then the autosave line). False when it did not go
   * through. `quiet` is a write inside an unbroken burst of typing: only the words go to the phone, with no autosave
   * line, announcement or render, which wait for the pause.
   */
  persist: (value: string, quiet: boolean) => boolean;
  /** Typing paused and the newest words were already on this phone (a quiet write put them there): the autosave line says so now. */
  settled: (value: string) => void;
  /** The typed draft written so far, if any. */
  draftId: () => string | null;
  /** Whether the draft holds a recording (reached from Review with ?draftId=): such a draft is never deleted here. */
  hasRecording: (draftId: string) => boolean;
  deleteDraft: (draftId: string) => void;
};

type Timers = { set: (fn: () => void, ms: number) => unknown; clear: (handle: unknown) => void };

export type WriteSession = {
  /** One keystroke's worth of words, exactly as the keyboard sent them. */
  change: (value: string) => void;
  /** The newest words. */
  latest: () => string;
  /** Whether a write, or the pause that follows typing, is waiting on a timer. */
  pending: () => boolean;
  /** Close: true when Write may leave. */
  close: () => boolean;
  /** A destination tap: the draft to keep, or null to stay on Write. */
  keep: () => string | null;
  /** The screen is going away: write any pending words, and any not yet on this phone, now. */
  unmount: () => void;
  /** The app is leaving the foreground: write any words not yet on this phone now. */
  background: () => void;
};

/** AppState values that mean the app is leaving the foreground (QE-06): iOS may end it from either without warning. */
export const leavesForeground = (state: string): boolean => state === 'inactive' || state === 'background';

export function createWriteSession(
  io: WriteSessionIo,
  opts: { initial: string; delayMs?: number; timers?: Timers },
): WriteSession {
  const delay = opts.delayMs ?? WRITE_AUTOSAVE_MS;
  const timers: Timers = opts.timers ?? { set: (fn, ms) => setTimeout(fn, ms), clear: (h) => clearTimeout(h as ReturnType<typeof setTimeout>) };
  let latest = opts.initial;
  // Moved by every keystroke: fires after `delay` with no keystroke, the pause that shows the autosave line.
  let pause: unknown = null;
  // Armed by the first keystroke after a write and then left alone: fires within `delay` of it, mid-burst or not.
  let wait: unknown = null;
  // Words typed since the last write that went through: what `background` must still put on the phone.
  let unsaved = false;
  const write = (value: string, quiet = false): boolean => {
    const ok = io.persist(value, quiet);
    if (ok && value === latest) unsaved = false;
    return ok;
  };

  const cancelPause = () => {
    if (pause !== null) timers.clear(pause);
    pause = null;
  };
  const cancelWait = () => {
    if (wait !== null) timers.clear(wait);
    wait = null;
  };
  const cancel = () => {
    cancelPause();
    cancelWait();
  };

  return {
    change(value) {
      latest = value;
      unsaved = true;
      cancelPause();
      pause = timers.set(() => {
        pause = null;
        cancelWait(); // the pause comes first: nothing is left for the other timer to write
        if (unsaved) write(latest);
        else io.settled(latest);
      }, delay);
      // Not re-armed by later keystrokes: that would make this a debounce again, and a long burst would write nothing.
      if (wait === null) {
        wait = timers.set(() => {
          wait = null;
          if (unsaved) write(latest, true); // `latest` now, not the words this timer was armed with
        }, delay);
      }
    },
    latest: () => latest,
    pending: () => pause !== null || wait !== null,
    close() {
      // Close writes now and disarms the pause, so a later flush never writes twice or brings back a deleted draft.
      cancel();
      const id = io.draftId();
      if (id && !latest.trim() && !io.hasRecording(id)) {
        io.deleteDraft(id);
        unsaved = false; // nothing left to write: a later flush must not bring the deleted draft back
        return true;
      }
      if (latest.trim() && !write(latest)) return false;
      unsaved = false;
      return true;
    },
    keep() {
      cancel();
      if (!write(latest)) return null;
      return io.draftId();
    },
    unmount() {
      cancel();
      if (unsaved) write(latest); // words a quiet write already put on the phone are not written twice
    },
    background() {
      // Nothing unsaved: a pause still waiting just says so when it fires (iOS pauses the timer, it resumes on return).
      if (!unsaved) return;
      cancel();
      write(latest);
    },
  };
}

/**
 * How long Write waits for its sheet to measure itself before it raises the keyboard anyway (PR #545 review A).
 * Layout normally reports within a frame or two; this only covers a layout that never comes.
 */
export const WRITE_FOCUS_FALLBACK_MS = 400;

export type FirstFocus = {
  /** The sheet measured itself: raise the keyboard now, once. */
  measured: (sheetHeight: number) => void;
  /** The screen is going away: never focus after it. */
  dispose: () => void;
};

/**
 * Write raises the keyboard itself, once, after its sheet has measured itself, and never through autoFocus (PR #545
 * review A). RN 0.86's KeyboardAvoidingView computes its padding when the keyboard moves and when its own height
 * changes, not when `keyboardVerticalOffset` changes; a keyboard raised by autoFocus before the sheet's height (and so
 * its offset, sheetKeyboardOffset) is known kept the too-small padding, and "Keep private" could sit behind the
 * keyboard on first open. If layout never reports, the keyboard still comes up after `fallbackMs`.
 */
export function createFirstFocus(focus: () => void, opts: { fallbackMs?: number; timers?: Timers } = {}): FirstFocus {
  const timers: Timers = opts.timers ?? { set: (fn, ms) => setTimeout(fn, ms), clear: (h) => clearTimeout(h as ReturnType<typeof setTimeout>) };
  let done = false;
  let fallback: unknown = null;
  const once = () => {
    if (done) return;
    done = true;
    if (fallback !== null) timers.clear(fallback);
    fallback = null;
    focus();
  };
  fallback = timers.set(() => {
    fallback = null;
    once();
  }, opts.fallbackMs ?? WRITE_FOCUS_FALLBACK_MS);
  return {
    measured(sheetHeight) {
      if (sheetHeight > 0) once();
    },
    dispose() {
      done = true;
      if (fallback !== null) timers.clear(fallback);
      fallback = null;
    },
  };
}

/**
 * BL-378: how long one typed letter may be. Generous (about 40 pages), so no real letter meets it; a paste of
 * 100k characters or more is held at this size by the field itself and never cut after the fact.
 */
export const WRITE_MAX_CHARS = 100_000;

/** True when the page is as full as it can be, so the calm "This page is full" line shows. */
export function writePageFull(length: number): boolean {
  return length >= WRITE_MAX_CHARS;
}
