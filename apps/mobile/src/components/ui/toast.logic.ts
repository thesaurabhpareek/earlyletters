/**
 * Pure state for Toast (EXPERIENCE_PASS principle 8, S36, S38): a toast states what just happened and
 * is replaced, never stacked or contradicted. One toast for the whole app, whichever host shows it (the
 * root host above the stack and the tabs host above the tab bar share this one store), so a show()
 * anywhere replaces the toast on screen everywhere: a stale "Letter restored." can never sit under
 * "Erased from this phone.". Tested in test/toast.test.ts.
 */

export type ToastEntry<O> = {
  /** Unique per show(): timers, announcements and closes act on this key only. */
  key: number;
  /** Stays the same while one toast replaces another in place, so the box does not leave and come back. */
  session: number;
  /** Which host draws it (the nearest ToastHost to the show() call). */
  host: string;
  options: O;
};

export type ToastState<O> = { current: ToastEntry<O> | null; nextKey: number; nextSession: number };

export const EMPTY_TOAST: ToastState<never> = { current: null, nextKey: 1, nextSession: 1 };

export type ToastAction<O> = { type: 'show'; host: string; options: O } | { type: 'hide'; key?: number };

/**
 * show: the new toast replaces the one on screen (`replaced` is the one it took the place of, so its owner
 * hears that it was dismissed). Replacing in the same host keeps the session: the box stays and only the words
 * change. hide(key) closes only that toast: a late timer or a swipe on a toast already replaced never closes
 * the new one. hide() with no key closes whatever is showing.
 */
export function reduceToast<O>(state: ToastState<O>, action: ToastAction<O>): { state: ToastState<O>; replaced: ToastEntry<O> | null; hidden: ToastEntry<O> | null } {
  if (action.type === 'show') {
    const prev = state.current;
    const sameBox = !!prev && prev.host === action.host;
    const entry: ToastEntry<O> = { key: state.nextKey, session: sameBox ? prev.session : state.nextSession, host: action.host, options: action.options };
    return {
      state: { current: entry, nextKey: state.nextKey + 1, nextSession: sameBox ? state.nextSession : state.nextSession + 1 },
      replaced: prev,
      hidden: null,
    };
  }
  const cur = state.current;
  if (!cur || (action.key !== undefined && action.key !== cur.key)) return { state, replaced: null, hidden: null };
  return { state: { ...state, current: null }, replaced: null, hidden: cur };
}

/** A tiny external store around reduceToast (for useSyncExternalStore). */
export function createToastStore<O extends { onDismiss?: () => void }>() {
  let state: ToastState<O> = EMPTY_TOAST as ToastState<O>;
  const listeners = new Set<() => void>();
  const emit = () => listeners.forEach((l) => l());
  return {
    get: (): ToastEntry<O> | null => state.current,
    subscribe: (l: () => void) => {
      listeners.add(l);
      return () => {
        listeners.delete(l);
      };
    },
    show: (host: string, options: O): number => {
      const r = reduceToast(state, { type: 'show', host, options });
      state = r.state;
      emit();
      // The replaced toast's chance to act is over: tell its owner it was dismissed (an Undo can no longer run).
      r.replaced?.options.onDismiss?.();
      return r.state.current!.key;
    },
    hide: (key?: number): void => {
      const r = reduceToast(state, { type: 'hide', key });
      if (r.state === state) return;
      state = r.state;
      emit();
    },
    /** Tests only. */
    reset: (): void => {
      state = EMPTY_TOAST as ToastState<O>;
      emit();
    },
  };
}
