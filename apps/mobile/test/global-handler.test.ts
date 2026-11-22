/**
 * [BL-370] A crash is never a blank page: the global handler for errors outside rendering.
 * Pure: a stand-in for React Native's ErrorUtils is passed in.
 */
import { readFileSync } from 'node:fs';
import { describe, expect, it, vi } from 'vitest';
import { installGlobalErrorHandler, type ErrorUtilsLike } from '../src/lib/resilience/global-handler';

function fake() {
  const previous = vi.fn();
  let current: ((e: unknown, f?: boolean) => void) | undefined = previous;
  const utils: ErrorUtilsLike = { getGlobalHandler: () => current, setGlobalHandler: (h) => (current = h) };
  return { utils, previous, fire: (e: unknown, f?: boolean) => current?.(e, f) };
}

describe('[BL-370] global error handler', () => {
  it('[BL-370] a fatal error is handed to the handler that was there before', () => {
    const f = fake();
    installGlobalErrorHandler(f.utils, { dev: false });
    f.fire(new Error('x'), true);
    expect(f.previous).toHaveBeenCalledTimes(1);
  });

  it('[BL-370] a non-fatal error in a release build is swallowed without being read', () => {
    const f = fake();
    installGlobalErrorHandler(f.utils, { dev: false });
    const err = { get message(): string { throw new Error('read'); } };
    expect(() => f.fire(err, false)).not.toThrow();
    expect(f.previous).not.toHaveBeenCalled();
  });

  it('[BL-370] in development everything is handed on', () => {
    const f = fake();
    installGlobalErrorHandler(f.utils, { dev: true });
    f.fire(new Error('x'), false);
    expect(f.previous).toHaveBeenCalledTimes(1);
  });

  it('[BL-370] installing twice installs once; a missing ErrorUtils is not an error', () => {
    const f = fake();
    expect(installGlobalErrorHandler(f.utils, { dev: false })).toBe(true);
    expect(installGlobalErrorHandler(f.utils, { dev: false })).toBe(false);
    expect(installGlobalErrorHandler(undefined, { dev: false })).toBe(false);
  });

  it('[BL-370] a previous handler that throws does not become a second failure', () => {
    const f = fake();
    f.previous.mockImplementation(() => {
      throw new Error('boom');
    });
    installGlobalErrorHandler(f.utils, { dev: false });
    expect(() => f.fire(new Error('x'), true)).not.toThrow();
  });

  it('[BL-370] the handler never logs or keeps the error, and the root layout installs it', () => {
    const src = readFileSync(new URL('../src/lib/resilience/global-handler.ts', import.meta.url), 'utf8').replace(/\/\*\*[\s\S]*?\*\//, '');
    expect(src).not.toMatch(/console\.|fetch\(|analytics|\.message|\.stack/);
    const layout = readFileSync(new URL('../src/app/_layout.tsx', import.meta.url), 'utf8');
    expect(layout).toContain('installGlobalErrorHandler(');
  });
});
