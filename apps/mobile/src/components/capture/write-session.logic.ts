/**
 * Write's words between the keyboard and this phone (S19; founder report on TestFlight build 1; PR #545 review B).
 *
 * The page is uncontrolled: each keystroke lands here (`change`), never back in the field. A pause of `delayMs`
 * writes the words to this phone. Every way out writes the newest words first, so the last keystrokes typed inside
 * the pause are never dropped:
 * - Close (`close`): an empty typed draft is deleted (a recording draft is always kept); words that cannot be written
 *   keep Write open (false), so they are never lost.
 * - "Add to Asha's book" and "Keep private" (`keep`): the words are written now, then the draft is handed to Review;
 *   null when they could not be written (Write stays, "Not saved yet" shows).
 * - A swipe down or any other unmount (`unmount`): a pending write is written now with the newest words.
 * Pure and timer-injected, so it runs in Node with fake timers against the real store (test/write-session.test.ts).
 */
export const WRITE_AUTOSAVE_MS = 500;

export type WriteSessionIo = {
  /** Write the words to this phone (write.tsx `persist`: writeWords, then the autosave line). False when it did not go through. */
  persist: (value: string) => boolean;
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
  /** Whether a write is waiting for the pause. */
  pending: () => boolean;
  /** Close: true when Write may leave. */
  close: () => boolean;
  /** A destination tap: the draft to keep, or null to stay on Write. */
  keep: () => string | null;
  /** The screen is going away: write any pending words now. */
  unmount: () => void;
};

export function createWriteSession(
  io: WriteSessionIo,
  opts: { initial: string; delayMs?: number; timers?: Timers },
): WriteSession {
  const delay = opts.delayMs ?? WRITE_AUTOSAVE_MS;
  const timers: Timers = opts.timers ?? { set: (fn, ms) => setTimeout(fn, ms), clear: (h) => clearTimeout(h as ReturnType<typeof setTimeout>) };
  let latest = opts.initial;
  let timer: unknown = null;

  const cancel = () => {
    if (timer !== null) timers.clear(timer);
    timer = null;
  };

  return {
    change(value) {
      latest = value;
      cancel();
      timer = timers.set(() => {
        timer = null;
        io.persist(value);
      }, delay);
    },
    latest: () => latest,
    pending: () => timer !== null,
    close() {
      // Close writes now and disarms the pause, so a later flush never writes twice or brings back a deleted draft.
      cancel();
      const id = io.draftId();
      if (id && !latest.trim() && !io.hasRecording(id)) {
        io.deleteDraft(id);
        return true;
      }
      if (latest.trim() && !io.persist(latest)) return false;
      return true;
    },
    keep() {
      cancel();
      if (!io.persist(latest)) return null;
      return io.draftId();
    },
    unmount() {
      if (timer === null) return;
      cancel();
      io.persist(latest);
    },
  };
}
