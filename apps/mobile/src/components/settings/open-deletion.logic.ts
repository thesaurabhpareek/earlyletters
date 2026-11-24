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
  /**
   * The last line the screen spoke that nothing else on screen reads out on Android (BL-494 point 2): announce() does
   * nothing there, so the screen draws it in a live-region node. `n` makes the same line said twice a new one.
   */
  said: { text: string; n: number } | null;
}

export const IDLE: PressState = { working: null, id: 0, acted: false, failedPresses: 0, notYet: false, said: null };

export type PressEvent =
  | { type: 'press'; action: 'cancel' | 'retry'; said?: string }
  | { type: 'cancelled'; ok: boolean; id: number }
  | { type: 'pulled'; stillOnItsWay: boolean; id: number }
  | { type: 'giveUp'; id: number }
  | { type: 'said'; text: string };

export function pressReducer(s: PressState, e: PressEvent): PressState {
  switch (e.type) {
    case 'press':
      return s.working
        ? s
        : { ...s, working: e.action, id: s.id + 1, acted: s.acted || e.action === 'cancel', notYet: false, said: e.said ? said(s, e.said) : s.said };
    case 'cancelled':
      if (e.id !== s.id) return s;
      return { ...s, working: null, failedPresses: e.ok ? s.failedPresses : s.failedPresses + 1 };
    case 'pulled':
      if (e.id !== s.id) return s;
      return { ...s, working: null, notYet: e.stillOnItsWay };
    case 'giveUp':
      return e.id === s.id && s.working ? { ...s, working: null } : s;
    case 'said':
      return { ...s, said: said(s, e.text) };
  }
}

const said = (s: PressState, text: string): NonNullable<PressState['said']> => ({ text, n: (s.said?.n ?? 0) + 1 });

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
  /** Speaks a line (announce) and keeps it for the Android live-region node; nothing once the screen is gone. */
  say(message: string): void;
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
  const begin = (action: 'cancel' | 'retry', line?: string): number | null => {
    if (gone || state.working) return null;
    send({ type: 'press', action, said: line });
    if (line) deps.announce(line);
    const id = state.id;
    clearTimer();
    timer = setTimeout(() => send({ type: 'giveUp', id }), WORKING_CAP_MS);
    return id;
  };
  const settle = (e: PressEvent & { id: number }): void => {
    if (e.id === state.id) clearTimer();
    send(e);
  };

  const say = (message: string): void => {
    if (gone) return;
    deps.announce(message);
    send({ type: 'said', text: message });
  };

  return {
    get: () => state,
    say,
    subscribe(listener) {
      listeners.add(listener);
      return () => void listeners.delete(listener);
    },
    cancel() {
      // The press and its spoken line are one change, so the screen draws once.
      const id = begin('cancel', deps.words.cancelling);
      if (id === null) return;
      // A cancel that throws (recordCancelled) is a failed press, not an unhandled rejection (BL-494 point 5d).
      void deps.cancel().then(
        (ok) => {
          if (ok) deps.success();
          settle({ type: 'cancelled', ok, id });
        },
        () => settle({ type: 'cancelled', ok: false, id }),
      );
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
          if (stillOnItsWay && state.id === id) say(deps.words.notYet);
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

/**
 * What the deletion screen opens the sign-in sheet with (BL-494 point 1). A request that can still be cancelled says so
 * in the sheet's body (`reason`); executing and cancelled cannot, so they keep the generic body. The trigger stays
 * `settings`, a value the analytics catalog already lists.
 */
export function deletionSignInParams(state: 'scheduled' | 'held' | 'executing' | 'cancelled'): { trigger: 'settings'; reason?: 'cancel_deletion' } {
  return state === 'scheduled' || state === 'held' ? { trigger: 'settings', reason: 'cancel_deletion' } : { trigger: 'settings' };
}
