/// <reference types="node" />
/**
 * BL-495 points 3, 5 and 6, and BL-494 point 6e. The launch hook's initial open effect and its Try again, run through the
 * hook stand-in (test/helpers/mini-react.ts); the web e2e `j20-crash` is not the only thing that holds them now.
 * The recovery screen's live flag survives a development remount; the step note and first expect of the j20 flow; the
 * root layout comment says what the code does. Fictional family "Asha" only (CLAUDE.md).
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderHook } from './helpers/mini-react';

const h = vi.hoisted(() => ({ opens: [] as Array<{ ok: boolean; newer?: boolean; error?: string }>, calls: 0 }));
vi.mock('react', async () => (await import('./helpers/mini-react')).reactStandIn);
vi.mock('@/lib/store', () => ({
  openStore: () => {
    h.calls += 1;
    return h.opens.shift() ?? { ok: true };
  },
}));
vi.mock('../src/lib/store', () => ({
  openStore: () => {
    h.calls += 1;
    return h.opens.shift() ?? { ok: true };
  },
}));

import { useLaunch } from '../src/lib/resilience/use-launch';

const ROOT = join(__dirname, '..');
const read = (...p: string[]) => readFileSync(join(ROOT, ...p), 'utf8');

beforeEach(() => {
  h.opens = [];
  h.calls = 0;
});

describe('useLaunch', () => {
  it('opens nothing until the store is ready, then opens once and reports the answer', () => {
    let ready = false;
    const run = renderHook(() => useLaunch(ready));
    expect(run.result.current.status).toBe('pending');
    expect(h.calls).toBe(0);
    ready = true;
    run.rerender();
    expect(h.calls).toBe(1);
    expect(run.result.current.status).toBe('ok');
  });

  it('a failed open shows recovery, and retry opens again, hands back what it found and sets it', () => {
    h.opens = [{ ok: false, error: 'open_failed' }];
    const run = renderHook(() => useLaunch(true));
    expect(run.result.current.status).toBe('recovery');
    expect(run.result.current.retry()).toBe('ok');
    expect(h.calls).toBe(2);
    expect(run.result.current.status).toBe('ok');
  });
});

describe('[BL-494 point 6e] the recovery screen stays live through a development remount', () => {
  it('sets the live flag in the effect, not only on first render, so cleanup and mount again leaves it true', () => {
    const src = read('src/components/resilience/launch-recovery.tsx');
    expect(src).toMatch(/useEffect\(\s*\(\) => \{\s*live\.current = true;\s*return \(\) => \{\s*live\.current = false;\s*\};\s*\},\s*\[\],?\s*\);/);
  });
});

describe('[BL-495 point 3] the j20 flow note describes the screen only, and the first expect waits for a cold start', () => {
  const flow = read('e2e-web/j20-crash.flow.ts');
  it('the step note does not describe what the screen leaves unsaid', () => {
    const note = flow.split('\n').find((l) => l.includes("step('unhappy', 'The book cannot be opened"));
    expect(note).toBeTruthy();
    expect(note).not.toMatch(/does not say|doesn't say|not say the letters/i);
    expect(note).toContain('(it copies the files exactly as they are)');
  });
  it('the first expect after the cold load has its own, longer, timeout', () => {
    expect(flow).toContain("await app.goto(`${base}/?seed=asha&fault=launch-once`);\n  // The first load of a cold runner is slow (the first run timed out on the 10 s default, #394): wait longer here only.\n  await expect(app.getByRole('heading', { name: 'The book couldn\\'t open' })).toBeVisible({ timeout: 30_000 });");
  });
});

describe('[BL-495 point 6] the root layout comment says what Try again does', () => {
  it('no longer says nothing is deleted (the update steps delete three settings keys)', () => {
    const layout = read('src/app/_layout.tsx');
    expect(layout).not.toMatch(/\(Try again, Export what is readable\) and nothing is deleted/);
    expect(layout).toMatch(/Try again opens the database again, which runs the update steps/);
  });
});
