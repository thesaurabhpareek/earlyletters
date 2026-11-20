/// <reference types="node" />
/**
 * useArrival (lib/first-run/use-arrival.ts), run in Node on the small stand-in for React's hooks: what the outage screen
 * does for VoiceOver when it arrives (review of PR #724, lens B must-fix 1). The heading takes focus and the title is
 * announced once on arrival, and again only if the variant changes (offline becoming an outage). iOS needs `announce()`:
 * StateScreen's live region is Android-only (lib/a11y.ts). Nothing here can say how VoiceOver lands: that is the device row.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';

const h = vi.hoisted(() => ({
  spoken: [] as string[],
  focusCalls: [] as Array<{ target: unknown; when: boolean; key: unknown }>,
}));

vi.mock('react', async () => (await import('./helpers/mini-react')).reactStandIn);
vi.mock('@/lib/a11y', () => ({
  announce: (m: string) => void h.spoken.push(m),
  useFocusOnMount: (target: unknown, when: boolean, key: unknown) => void h.focusCalls.push({ target, when, key }),
}));

import { authCopy } from '@scribe/content';
import { useArrival } from '../src/lib/first-run/use-arrival';
import { renderHook } from './helpers/mini-react';

beforeEach(() => {
  h.spoken.length = 0;
  h.focusCalls.length = 0;
});

describe('[NX-36-S3] the outage screen on arrival, for VoiceOver', () => {
  const target = { current: null };

  it('[NX-36-S3] it asks for the heading to take focus and says the title once', () => {
    renderHook(() => useArrival(target, authCopy.outage.title, 'outage'));
    expect(h.spoken).toEqual([authCopy.outage.title]);
    expect(h.focusCalls[0]).toEqual({ target, when: true, key: 'outage' });
  });

  it('[NX-36-S3] an ordinary render says nothing more, even with a new sentence', () => {
    let title: string = authCopy.outage.title;
    const run = renderHook(() => useArrival(target, title, 'outage'));
    run.rerender();
    title = 'Something else';
    run.rerender();
    expect(h.spoken).toEqual([authCopy.outage.title]);
  });

  it('[NX-36-S3] offline becoming an outage is a new arrival: said again and focus asked again', () => {
    let variant: 'offline' | 'outage' = 'offline';
    const run = renderHook(() => useArrival(target, variant === 'offline' ? authCopy.offline.title : authCopy.outage.title, variant));
    expect(h.spoken).toEqual([authCopy.offline.title]);
    variant = 'outage';
    run.rerender();
    expect(h.spoken).toEqual([authCopy.offline.title, authCopy.outage.title]);
    expect(h.focusCalls.at(-1)?.key).toBe('outage');
  });
});
