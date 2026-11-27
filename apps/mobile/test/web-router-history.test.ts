/**
 * BL-2019 (CR-241): on web, expo-router 57.0.24's memory history waited only 100 ms for the popstate of its own
 * history.go(n). A busier main thread let the timer win, the late popstate reached the listener as the browser's
 * Back button, and useLinking reset the navigator, which lost the Book's "Letter deleted." toast (J10, J10f).
 * The web build swaps in web-preview/router-memory-history.js, which waits 1000 ms. These tests pin three things:
 * the copy is the installed file with only that one change, metro swaps it in on web and nowhere else, and a
 * popstate 300 ms late no longer reaches the listener.
 */
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

const require = createRequire(import.meta.url);
const APP = join(__dirname, '..');
const SHIM = join(APP, 'web-preview', 'router-memory-history.js');
const FORK = join(dirname(require.resolve('expo-router/package.json')), 'build', 'fork');
const UPSTREAM = join(FORK, 'createMemoryHistory.js');

describe('[BL-2019] the web copy is the installed createMemoryHistory.js with one change', () => {
  it('matches the installed file apart from its header and the one timer line', () => {
    const upstream = readFileSync(UPSTREAM, 'utf8')
      .split('\n')
      .filter((line) => !line.startsWith('//# sourceMappingURL='));
    // The installed file ends on its source map line with no newline; the copy drops that line and ends on a newline.
    while (upstream.at(-1) === '') upstream.pop();
    const shimLines = readFileSync(SHIM, 'utf8').split('\n');
    while (shimLines.at(-1) === '') shimLines.pop();
    const start = shimLines.indexOf('"use strict";');
    expect(start).toBeGreaterThan(0);
    for (const line of shimLines.slice(0, start)) expect(line.startsWith('//')).toBe(true);
    const body = shimLines.slice(start);
    const changed = body.map((line, i) => [i, line, upstream[i]] as const).filter(([, a, b]) => a !== b);
    expect(body.length).toBe(upstream.length);
    expect(changed).toHaveLength(1);
    const [, ours, theirs] = changed[0];
    expect(theirs.trim()).toBe('}, 100);');
    expect(ours.trim()).toBe('}, 1000); // web preview fix 1: was 100');
  });
});

describe('[BL-2019] metro swaps the copy in on web only', () => {
  // BL-443: metro.config.js loads expo/metro-config, which can take seconds on a cold runner.
  let config: {
    resolver: { resolveRequest: (ctx: unknown, name: string, platform: string) => { type: string; filePath: string } };
  };
  beforeAll(() => {
    config = require(join(APP, 'metro.config.js')) as typeof config;
  }, 60_000);

  const fromUseLinking = (calls: string[]) => ({
    originModulePath: join(FORK, 'useLinking.js'),
    resolveRequest: (_ctx: unknown, name: string) => {
      calls.push(name);
      return { type: 'sourceFile', filePath: join(FORK, 'createMemoryHistory.js') };
    },
  });

  it('gives the web build the copy', () => {
    const calls: string[] = [];
    expect(config.resolver.resolveRequest(fromUseLinking(calls), './createMemoryHistory', 'web')).toEqual({
      type: 'sourceFile',
      filePath: SHIM,
    });
    expect(calls).toEqual([]);
  });

  it('leaves ios and android on the installed file', () => {
    for (const platform of ['ios', 'android']) {
      const calls: string[] = [];
      const result = config.resolver.resolveRequest(fromUseLinking(calls), './createMemoryHistory', platform);
      expect(result.filePath).not.toBe(SHIM);
      expect(calls).toEqual(['./createMemoryHistory']);
    }
  });

  it("resolves the copy's own imports from expo-router's fork folder", () => {
    let origin = '';
    const context = {
      originModulePath: SHIM,
      resolveRequest: (ctx: { originModulePath: string }) => {
        origin = ctx.originModulePath;
        return { type: 'sourceFile', filePath: 'resolved' };
      },
    };
    config.resolver.resolveRequest(context, 'nanoid/non-secure', 'web');
    expect(origin).toBe(UPSTREAM);
  });
});

/** A browser window just big enough for createMemoryHistory: history, popstate and document.title. */
function fakeWindow(popstateDelayMs: number) {
  const target = new EventTarget();
  const entries: { id?: string }[] = [{}];
  let at = 0;
  return {
    document: { title: 'Early Letters' },
    addEventListener: target.addEventListener.bind(target),
    removeEventListener: target.removeEventListener.bind(target),
    history: {
      get state() {
        return entries[at];
      },
      pushState(state: { id: string }) {
        entries.splice(at + 1, entries.length, state);
        at = entries.length - 1;
      },
      replaceState(state: { id: string }) {
        entries[at] = state;
      },
      go(n: number) {
        setTimeout(() => {
          at += n;
          target.dispatchEvent(new Event('popstate'));
        }, popstateDelayMs);
      },
    },
  };
}

type MemoryHistory = {
  push: (e: { path: string; state?: object }) => void;
  go: (n: number) => Promise<void>;
  listen: (listener: () => void) => () => void;
};

describe('[BL-2019] a late popstate from our own Back is not taken for the browser Back button', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => {
    vi.useRealTimers();
    delete (globalThis as { window?: unknown }).window;
  });

  async function externalBacks(file: string): Promise<number> {
    (globalThis as { window?: unknown }).window = fakeWindow(300);
    const { createMemoryHistory } = require(file) as { createMemoryHistory: () => MemoryHistory };
    const history = createMemoryHistory();
    history.push({ path: '/book' });
    history.push({ path: '/letter/asha-1' });
    const listener = vi.fn();
    history.listen(listener);
    const back = history.go(-1);
    await vi.advanceTimersByTimeAsync(1500);
    await back;
    return listener.mock.calls.length;
  }

  it('the installed file reports a popstate 300 ms late as an external Back (the bug)', async () => {
    expect(await externalBacks(UPSTREAM)).toBe(1);
  });

  it('the web copy does not', async () => {
    expect(await externalBacks(SHIM)).toBe(0);
  });
});
