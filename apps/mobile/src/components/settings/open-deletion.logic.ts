/**
 * The press state of the deletion screen (open-deletion.tsx), as a small pure reducer and a controller around it, so it
 * is tested in Node (test/open-deletion-press.test.ts) instead of read off the screen's source. A press is Cancel
 * deletion or Try again: the screen answers it with the loading state (no buttons to press twice), speaks it, and says
 * afterwards what happened. Nothing here touches React Native; the screen gives the controller what it needs.
 *
 * Why it can end without an answer. cancelDeletion and the pull have no timeout of their own (critics' pass L7), so a
 * call that never settles would leave a screen with no button at all, Sign out included. After WORKING_CAP_MS the
 * buttons come back; the call itself is left to finish, and its answer still counts when it comes.
 */

/** How long a press may keep the buttons away. */
export const WORKING_CAP_MS = 20_000;

export interface PressState {
  /** Which press is on its way, if one is. */
  working: 'cancel' | 'retry' | null;
  /** The number of the last press; an answer for an older one is not this press's. */
  id: number;
  /**
   * The person has pressed Cancel deletion: only now may the hook's failure be shown (a passive read that failed says
   * nothing). Try again never sets it: its own outcome is the "still on their way" line, never the hook's error.
   */
  acted: boolean;
  /** Cancels that did not go through; each one is spoken. */
  failedPresses: number;
  /** A Try again found the book still on its way. */
  notYet: boolean;
}

export const IDLE: PressState = { working: null, id: 0, acted: false, failedPresses: 0, notYet: false };

export type PressEvent =
  | { type: 'press'; action: 'cancel' | 'retry' }
  | { type: 'cancelled'; ok: boolean; id: number }
  | { type: 'pulled'; stillOnItsWay: boolean; id: number }
  | { type: 'giveUp'; id: number };

export function pressReducer(s: PressState, e: PressEvent): PressState {
  switch (e.type) {
    case 'press':
      return s.working ? s : { ...s, working: e.action, id: s.id + 1, acted: s.acted || e.action === 'cancel', notYet: false };
    case 'cancelled':
      if (e.id !== s.id) return s;
      return { ...s, working: null, failedPresses: e.ok ? s.failedPresses : s.failedPresses + 1 };
    case 'pulled':
      if (e.id !== s.id) return s;
      return { ...s, working: null, notYet: e.stillOnItsWay };
    case 'giveUp':
      return e.id === s.id && s.working ? { ...s, working: null } : s;
  }
}

export interface PressDeps {
  /** accountDeletion's cancel: true when the server cancelled the request. */
  cancel(): Promise<boolean>;
  /** A pull for the book (syncNow). */
  pull(): Promise<unknown>;
  announce(message: string): void;
  /** The success haptic. */
  success(): void;
  /** The phone lists a book now (the pull brought it back). */
  bookListed(): boolean;
  words: { cancelling: string; notYet: string };
}

export interface PressController {
  get(): PressState;
  subscribe(listener: () => void): () => void;
  cancel(): void;
  retry(): void;
  /** The screen is up (again): its effects may re-run, as React does in development. */
  attach(): void;
  /** The screen is gone: nothing more is announced, and a tap does nothing. */
  dispose(): void;
}

export function createPressController(deps: PressDeps): PressController {
  let state = IDLE;
  let gone = false;
  let timer: ReturnType<typeof setTimeout> | null = null;
  const listeners = new Set<() => void>();

  const send = (e: PressEvent): void => {
    const next = pressReducer(state, e);
    if (next === state) return;
    state = next;
    listeners.forEach((l) => l());
  };
  const clearTimer = (): void => {
    if (timer) clearTimeout(timer);
    timer = null;
  };
  /** Starts a press; false when one is already on its way (a second tap, even in the same frame, does nothing). */
  const begin = (action: 'cancel' | 'retry'): number | null => {
    if (gone || state.working) return null;
    send({ type: 'press', action });
    const id = state.id;
    clearTimer();
    timer = setTimeout(() => send({ type: 'giveUp', id }), WORKING_CAP_MS);
    return id;
  };
  const settle = (e: PressEvent & { id: number }): void => {
    if (e.id === state.id) clearTimer();
    send(e);
  };

  return {
    get: () => state,
    subscribe(listener) {
      listeners.add(listener);
      return () => void listeners.delete(listener);
    },
    cancel() {
      const id = begin('cancel');
      if (id === null) return;
      deps.announce(deps.words.cancelling);
      void deps.cancel().then((ok) => {
        if (ok) deps.success();
        settle({ type: 'cancelled', ok, id });
      });
    },
    retry() {
      const id = begin('retry');
      if (id === null) return;
      void deps.pull()
        .catch(() => null)
        .then(() => {
          // The pull may have brought the book back: then the screen is on its way out, and "still on their way" would be untrue.
          const stillOnItsWay = !deps.bookListed();
          settle({ type: 'pulled', stillOnItsWay, id });
          if (stillOnItsWay && !gone && state.id === id) deps.announce(deps.words.notYet);
        });
    },
    attach() {
      gone = false;
    },
    dispose() {
      gone = true;
      clearTimer();
    },
  };
}
