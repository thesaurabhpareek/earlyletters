/**
 * A small stand-in for React's hooks, so a hook that holds effects and timers can be run in Node without a renderer
 * (the repo has no react-test-renderer and tests run with `environment: 'node'`). It is not React: it covers the
 * hooks the first-run gate uses, with React's rules for them, and nothing else.
 *  - state, reducer, ref and memo keep their slot between renders; a setter that changes the value renders again;
 *  - an effect runs after the render in which its dependencies changed (always, with no list), every cleanup of the
 *    effects that re-run first, then the effects, in order; the cleanups run again on unmount;
 *  - useSyncExternalStore reads the snapshot each render and renders again when the store tells it to and the snapshot
 *    changed;
 *  - a render caused by a setter called outside a render (a timer, a promise) happens at once, synchronously.
 *
 * Use it with `vi.mock('react', () => reactStandIn)` before importing the hook, and `renderHook(() => useThing())`.
 */

type Cleanup = void | (() => void);

interface Slot {
  v?: unknown;
  deps?: readonly unknown[];
  cleanup?: Cleanup;
  set?: (u: unknown) => void;
  stop?: () => void;
  subscribed?: boolean;
}

interface Runner {
  slots: Slot[];
  idx: number;
  effects: Array<{ slot: Slot; fn: () => Cleanup; deps?: readonly unknown[] }>;
  schedule(): void;
}

let active: Runner | null = null;

const same = (a: readonly unknown[] | undefined, b: readonly unknown[] | undefined): boolean =>
  !!a && !!b && a.length === b.length && a.every((x, i) => Object.is(x, b[i]));

function take(): { r: Runner; slot: Slot; fresh: boolean } {
  if (!active) throw new Error('a hook was called outside renderHook');
  const r = active;
  const fresh = r.idx >= r.slots.length;
  if (fresh) r.slots.push({});
  return { r, slot: r.slots[r.idx++], fresh };
}

export const reactStandIn = {
  useState<S>(init: S | (() => S)): [S, (u: S | ((prev: S) => S)) => void] {
    const { r, slot, fresh } = take();
    if (fresh) {
      slot.v = typeof init === 'function' ? (init as () => S)() : init;
      slot.set = (u) => {
        const next = typeof u === 'function' ? (u as (p: unknown) => unknown)(slot.v) : u;
        if (Object.is(next, slot.v)) return;
        slot.v = next;
        r.schedule();
      };
    }
    return [slot.v as S, slot.set as (u: S | ((prev: S) => S)) => void];
  },
  useReducer<S, A>(reducer: (s: S, a: A) => S, init: S): [S, (a: A) => void] {
    const { r, slot, fresh } = take();
    if (fresh) {
      slot.v = init;
      slot.set = (a) => {
        const next = reducer(slot.v as S, a as A);
        if (Object.is(next, slot.v)) return;
        slot.v = next;
        r.schedule();
      };
    }
    return [slot.v as S, slot.set as (a: A) => void];
  },
  useRef<T>(init: T): { current: T } {
    const { slot, fresh } = take();
    if (fresh) slot.v = { current: init };
    return slot.v as { current: T };
  },
  useMemo<T>(fn: () => T, deps: readonly unknown[]): T {
    const { slot, fresh } = take();
    if (fresh || !same(slot.deps, deps)) {
      slot.v = fn();
      slot.deps = deps;
    }
    return slot.v as T;
  },
  useEffect(fn: () => Cleanup, deps?: readonly unknown[]): void {
    const { r, slot } = take();
    r.effects.push({ slot, fn, deps });
  },
  useSyncExternalStore<T>(subscribe: (onChange: () => void) => () => void, getSnapshot: () => T): T {
    const { r, slot } = take();
    const value = getSnapshot();
    slot.v = value;
    if (!slot.subscribed) {
      slot.subscribed = true;
      slot.stop = subscribe(() => {
        if (!Object.is(getSnapshot(), slot.v)) r.schedule();
      });
    }
    return value;
  },
};

export interface HookRun<T> {
  readonly result: { current: T };
  /** How many times the hook has rendered. */
  readonly renders: number;
  /** Render again (a prop or a mock the hook reads has changed). */
  rerender(): void;
  unmount(): void;
}

export function renderHook<T>(hook: () => T): HookRun<T> {
  const slots: Slot[] = [];
  const result = { current: undefined as T };
  let renders = 0;
  let rendering = false;
  let dirty = false;
  let unmounted = false;

  const runner: Runner = {
    slots,
    idx: 0,
    effects: [],
    schedule() {
      if (unmounted) return;
      if (rendering) dirty = true;
      else run();
    },
  };

  function run(): void {
    let guard = 0;
    do {
      if (++guard > 50) throw new Error('the hook rendered more than 50 times in a row');
      dirty = false;
      rendering = true;
      runner.idx = 0;
      runner.effects = [];
      active = runner;
      try {
        result.current = hook();
      } finally {
        active = null;
      }
      renders += 1;
      const due = runner.effects.filter((e) => e.deps === undefined || !same(e.slot.deps, e.deps) || e.slot.deps === undefined);
      for (const e of due) if (typeof e.slot.cleanup === 'function') e.slot.cleanup();
      for (const e of due) {
        e.slot.deps = e.deps;
        e.slot.cleanup = e.fn();
      }
      rendering = false;
    } while (dirty);
  }

  run();
  return {
    result,
    get renders() {
      return renders;
    },
    rerender: () => run(),
    unmount() {
      unmounted = true;
      for (const s of slots) {
        if (typeof s.cleanup === 'function') s.cleanup();
        s.stop?.();
      }
    },
  };
}
