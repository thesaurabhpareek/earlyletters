/**
 * BL-568 (APP-03): the global error handler. Installed before the first render (the root layout calls it at
 * module load), it shows the recovery screen on a fatal throw outside React and records ids and error codes
 * only, never the error's words (PRIV-R10). Fixtures use the fictional family Asha.
 */
import { describe, expect, it, vi } from 'vitest';
import {
  createFaultLog,
  createFaultStore,
  errorCode,
  installGlobalErrorHandlers,
  type ErrorUtilsLike,
  type FaultRecord,
  type RejectionTrackerLike,
} from '../src/lib/resilience/global-errors.logic';

const ASHA = 'Asha took her first steps to the window today';

function fakeErrorUtils() {
  const previous = vi.fn();
  let handler: ((e: unknown, fatal?: boolean) => void) | undefined = previous;
  const eu: ErrorUtilsLike = {
    getGlobalHandler: () => handler,
    setGlobalHandler: (h) => {
      handler = h;
    },
  };
  return { eu, previous, fire: (e: unknown, fatal?: boolean) => handler?.(e, fatal) };
}

function fakeHermes() {
  let opts: Parameters<NonNullable<RejectionTrackerLike['enablePromiseRejectionTracker']>>[0] | undefined;
  const hermes: RejectionTrackerLike = {
    enablePromiseRejectionTracker: (o) => {
      opts = o;
    },
  };
  return { hermes, reject: (id: number, r: unknown) => opts?.onUnhandled(id, r), enabled: () => opts !== undefined };
}

function setup(dev: boolean) {
  const { eu, previous, fire } = fakeErrorUtils();
  const h = fakeHermes();
  const log = createFaultLog();
  const store = createFaultStore();
  const warn = vi.fn();
  const installed = installGlobalErrorHandlers({ errorUtils: eu, hermes: h.hermes, dev, record: log.push, onFatal: store.set, warn, now: () => 1000 });
  return { installed, previous, fire, log, store, warn, ...h };
}

describe('[BL-568] global error handler', () => {
  it('[BL-568] a fatal throw in a timer shows the recovery screen (the fault store is set)', async () => {
    const s = setup(false);
    expect(s.installed).toBe(true);
    expect(s.store.get()).toBeNull();
    // What React Native does with a throw inside a timer: the global handler, isFatal true.
    await new Promise<void>((done) =>
      setTimeout(() => {
        try {
          throw new TypeError(ASHA);
        } catch (e) {
          s.fire(e, true);
        }
        done();
      }, 0),
    );
    expect(s.store.get()).toEqual<FaultRecord>({ kind: 'fatal', code: 'type_error', id: 1, at: 1000 });
    s.store.clear();
    expect(s.store.get()).toBeNull();
  });

  it('[BL-568] a throw planted with Asha text records no Asha text, in Release or development', () => {
    for (const dev of [false, true]) {
      const s = setup(dev);
      const e = new Error(ASHA);
      e.name = `Asha ${ASHA}`;
      (e as { cause?: unknown }).cause = { child: 'Asha' };
      s.fire(e, true);
      s.fire(ASHA, false);
      s.reject(7, new RangeError(ASHA));
      const captured = JSON.stringify({ log: s.log.list(), store: s.store.get(), warn: s.warn.mock.calls });
      expect(captured).not.toMatch(/Asha|steps|window/);
      if (!dev) {
        expect(s.log.list()).toEqual([
          { kind: 'fatal', code: 'error', id: 1, at: 1000 },
          { kind: 'non_fatal', code: 'non_error', id: 2, at: 1000 },
          { kind: 'rejection', code: 'range_error', id: 7, at: 1000 },
        ]);
      }
    }
  });

  it('[BL-568] Release never passes the error on to the default handler (it would crash and attach the message)', () => {
    const s = setup(false);
    s.fire(new Error(ASHA), true);
    expect(s.previous).not.toHaveBeenCalled();
    expect(s.warn).not.toHaveBeenCalled();
  });

  it('[BL-568] development passes it on as non-fatal, so LogBox shows it and the recovery screen stays', () => {
    const s = setup(true);
    const e = new Error(ASHA);
    s.fire(e, true);
    expect(s.previous).toHaveBeenCalledWith(e, false);
    expect(s.store.get()?.kind).toBe('fatal');
    // React Native keeps its own development tracker; ours is Release only.
    expect(s.enabled()).toBe(false);
  });

  it('[BL-568] Release tracks unhandled rejections without showing the recovery screen', () => {
    const s = setup(false);
    expect(s.enabled()).toBe(true);
    s.reject(3, new Error(ASHA));
    expect(s.store.get()).toBeNull();
    expect(s.log.list()).toEqual([{ kind: 'rejection', code: 'error', id: 3, at: 1000 }]);
  });

  it('[BL-568] a non-fatal throw is recorded and does not take over the screen', () => {
    const s = setup(false);
    s.fire(new Error(ASHA), false);
    expect(s.store.get()).toBeNull();
    expect(s.log.list()).toHaveLength(1);
  });

  it('[BL-568] installing twice keeps one handler, and a throwing recorder never loops', () => {
    const { eu, fire } = fakeErrorUtils();
    const onFatal = vi.fn();
    const record = vi.fn(() => {
      throw new Error('disk full');
    });
    installGlobalErrorHandlers({ errorUtils: eu, dev: false, record, onFatal });
    const first = eu.getGlobalHandler();
    installGlobalErrorHandlers({ errorUtils: eu, dev: false, record, onFatal });
    expect(eu.getGlobalHandler()).toBe(first);
    expect(() => fire(new Error(ASHA), true)).not.toThrow();
    expect(onFatal).toHaveBeenCalledTimes(1);
  });

  it('[BL-568] with no ErrorUtils and no Hermes nothing is installed', () => {
    expect(installGlobalErrorHandlers({ dev: false, record: () => {}, onFatal: () => {} })).toBe(false);
  });

  it('[BL-568] codes come from the built-in class only, never from name or message', () => {
    class AshaError extends Error {}
    expect(errorCode(new TypeError('x'))).toBe('type_error');
    expect(errorCode(new AshaError(ASHA))).toBe('error');
    expect(errorCode(Object.assign(new Error('x'), { name: 'TypeError' }))).toBe('error');
    expect(errorCode({ message: ASHA })).toBe('non_error');
    expect(errorCode(null)).toBe('non_error');
  });

  it('[BL-568] the fault log keeps the last 20 only', () => {
    const log = createFaultLog();
    for (let i = 1; i <= 25; i++) log.push({ kind: 'rejection', code: 'error', id: i, at: 0 });
    expect(log.list().map((r) => r.id)).toEqual([6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25]);
  });
});

describe('[BL-568] wiring', () => {
  it('[BL-568] the root layout installs the handler at module load, before the first render', async () => {
    const { readFileSync } = await import('node:fs');
    const src = readFileSync(new URL('../src/app/_layout.tsx', import.meta.url), 'utf8');
    const install = src.search(/^startGlobalErrorHandlers\(\);/m);
    expect(install).toBeGreaterThan(-1);
    expect(install).toBeLessThan(src.indexOf('export default function RootLayout'));
    expect(src).toMatch(/if \(globalFault\.fault\) return <GlobalFaultScreen/);
  });
});
