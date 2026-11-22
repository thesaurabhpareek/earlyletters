/// <reference types="node" />
/**
 * The adapter's stall timer (PR #541 review A): only silence stops a request. A slow but steady link (under the
 * old limit's ~2.2 Mbps for a 16 MiB chunk) runs as long as it needs; a quiet one stops after the window.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { STALL_MS } from '../engine';
import { startStallTimer } from '../stall-timer';

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

describe('stall timer', () => {
  it('a slow but steady request (bytes every 20 s for 5 minutes) never stalls', () => {
    let stalled = 0;
    const t = startStallTimer(STALL_MS, () => stalled++);
    for (let s = 20; s <= 300; s += 20) {
      vi.advanceTimersByTime(20_000);
      t.progress(s * 7_000); // about 56 kbit/s: far under the old whole-request limit
    }
    t.stop();
    vi.advanceTimersByTime(10 * STALL_MS);
    expect(stalled).toBe(0);
  });

  it('a request that goes quiet stops once, STALL_MS after its last new byte', () => {
    let stalled = 0;
    const t = startStallTimer(STALL_MS, () => stalled++);
    vi.advanceTimersByTime(10_000);
    t.progress(1_000);
    vi.advanceTimersByTime(STALL_MS - 1);
    expect(stalled).toBe(0);
    t.progress(1_000); // the same count again is not progress
    vi.advanceTimersByTime(1);
    expect(stalled).toBe(1);
    vi.advanceTimersByTime(10 * STALL_MS);
    expect(stalled).toBe(1);
  });

  it('a request with no bytes at all stops after the window', () => {
    let stalled = 0;
    startStallTimer(STALL_MS, () => stalled++);
    vi.advanceTimersByTime(STALL_MS);
    expect(stalled).toBe(1);
  });

  it('the adapter uses it, not a whole-request timeout', async () => {
    const { readFileSync } = await import('node:fs');
    const src = readFileSync(new URL('../expo-adapter.ts', import.meta.url), 'utf8');
    expect(src).toMatch(/startStallTimer\(opts\.stallMs/);
    expect(src).toMatch(/stall\.progress\(p\.bytesWritten\)/);
    expect(src).not.toMatch(/setTimeout\(\(\) => ctrl\.abort\(\)/);
  });
});
