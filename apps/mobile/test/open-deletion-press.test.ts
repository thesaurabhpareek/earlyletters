/// <reference types="node" />
/**
 * The press state of the deletion screen (components/settings/open-deletion.logic.ts), run in Node: Cancel deletion and
 * Try again are answered by the loading state, spoken, and followed by a line or a failure; a second press does nothing;
 * a call that never settles gives the buttons back (lens B S-1 and lens A A6 of the third review of PR #393). The
 * screen itself (open-deletion.tsx) only draws what this says.
 * Fictional family "Asha" only (CLAUDE.md).
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { accountDeletionCopy as c } from '@scribe/content';
import { createPressController, IDLE, pressReducer, WORKING_CAP_MS, type PressDeps } from '../src/components/settings/open-deletion.logic';

function setup(over: Partial<PressDeps> = {}) {
  const calls = { cancel: 0, pull: 0, announce: [] as string[], success: 0 };
  let finishCancel: (ok: boolean) => void = () => undefined;
  let finishPull: () => void = () => undefined;
  const deps: PressDeps = {
    cancel: () => {
      calls.cancel += 1;
      return new Promise<boolean>((res) => (finishCancel = res));
    },
    pull: () => {
      calls.pull += 1;
      return new Promise<void>((res) => (finishPull = res));
    },
    announce: (m) => void calls.announce.push(m),
    success: () => void (calls.success += 1),
    bookListed: () => false,
    words: { cancelling: c.open.cancelling, notYet: c.open.notYet },
    ...over,
  };
  const ctl = createPressController(deps);
  return { ctl, calls, finishCancel: (ok: boolean) => finishCancel(ok), finishPull: () => finishPull() };
}
const settle = () => vi.advanceTimersByTimeAsync(0);

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

describe('the reducer', () => {
  it('a press starts work, counts, and allows a failure to be shown from then on; a second press while working is ignored', () => {
    const a = pressReducer(IDLE, { type: 'press', action: 'cancel' });
    expect(a).toMatchObject({ working: 'cancel', id: 1, acted: true, notYet: false });
    expect(pressReducer(a, { type: 'press', action: 'retry' })).toBe(a);
  });

  it('[BL-496] only a cancel press sets acted: a retry press leaves it false, so the hook\'s passive failure stays hidden', () => {
    expect(IDLE.acted).toBe(false);
    const retry = pressReducer(IDLE, { type: 'press', action: 'retry' });
    expect(retry).toMatchObject({ working: 'retry', id: 1, acted: false, notYet: false });
    expect(pressReducer(retry, { type: 'pulled', stillOnItsWay: true, id: 1 })).toMatchObject({ working: null, acted: false, notYet: true });
    expect(pressReducer(retry, { type: 'giveUp', id: 1 })).toMatchObject({ working: null, acted: false });
    expect(pressReducer(IDLE, { type: 'press', action: 'cancel' })).toMatchObject({ working: 'cancel', id: 1, acted: true });
  });

  it('[BL-496] a retry after a cancel leaves acted as the cancel set it (it never clears it either)', () => {
    const cancelled = pressReducer(pressReducer(IDLE, { type: 'press', action: 'cancel' }), { type: 'cancelled', ok: true, id: 1 });
    expect(cancelled.acted).toBe(true);
    expect(pressReducer(cancelled, { type: 'press', action: 'retry' })).toMatchObject({ working: 'retry', id: 2, acted: true });
  });

  it('an answer is for its own press only', () => {
    const a = pressReducer(IDLE, { type: 'press', action: 'cancel' });
    expect(pressReducer(a, { type: 'cancelled', ok: false, id: 7 })).toBe(a);
    expect(pressReducer(a, { type: 'pulled', stillOnItsWay: true, id: 7 })).toBe(a);
    expect(pressReducer(a, { type: 'giveUp', id: 7 })).toBe(a);
  });

  it('a cancel that did not go through is counted, a pull that found nothing sets the line, giving up returns the buttons', () => {
    const a = pressReducer(IDLE, { type: 'press', action: 'cancel' });
    expect(pressReducer(a, { type: 'cancelled', ok: false, id: 1 })).toMatchObject({ working: null, failedPresses: 1, acted: true });
    expect(pressReducer(a, { type: 'cancelled', ok: true, id: 1 })).toMatchObject({ working: null, failedPresses: 0 });
    const b = pressReducer(IDLE, { type: 'press', action: 'retry' });
    expect(pressReducer(b, { type: 'pulled', stillOnItsWay: true, id: 1 })).toMatchObject({ working: null, notYet: true });
    expect(pressReducer(b, { type: 'pulled', stillOnItsWay: false, id: 1 })).toMatchObject({ working: null, notYet: false });
    expect(pressReducer(b, { type: 'giveUp', id: 1 })).toMatchObject({ working: null });
    expect(pressReducer(IDLE, { type: 'giveUp', id: 0 })).toBe(IDLE);
  });
});

describe('Cancel deletion', () => {
  it('is answered at once: working, nothing to press twice, spoken; a failure may be shown from the first press on', async () => {
    const t = setup();
    expect(t.ctl.get().acted).toBe(false); // a passive failure says nothing before a press
    t.ctl.cancel();
    expect(t.ctl.get()).toMatchObject({ working: 'cancel', acted: true });
    expect(t.calls.announce).toEqual([c.open.cancelling]);
    t.ctl.cancel(); // a second tap, even in the same frame
    expect(t.calls.cancel).toBe(1);
    expect(t.calls.announce).toHaveLength(1);
  });

  it('a cancel that goes through plays the success haptic and returns the screen to its buttons', async () => {
    const t = setup();
    t.ctl.cancel();
    t.finishCancel(true);
    await settle();
    expect(t.calls.success).toBe(1);
    expect(t.ctl.get()).toMatchObject({ working: null, failedPresses: 0 });
  });

  it('a cancel that fails counts as a failed press (the screen speaks its line) and plays no haptic', async () => {
    const t = setup();
    t.ctl.cancel();
    t.finishCancel(false);
    await settle();
    expect(t.calls.success).toBe(0);
    expect(t.ctl.get()).toMatchObject({ working: null, failedPresses: 1, acted: true });
    t.ctl.cancel(); // and it can be tried again
    expect(t.calls.cancel).toBe(2);
  });

  it('a call that never settles gives the buttons back after the cap, and its late answer still counts', async () => {
    const t = setup();
    t.ctl.cancel();
    await vi.advanceTimersByTimeAsync(WORKING_CAP_MS - 1);
    expect(t.ctl.get().working).toBe('cancel');
    await vi.advanceTimersByTimeAsync(1);
    expect(t.ctl.get().working).toBeNull();
    t.finishCancel(false);
    await settle();
    expect(t.ctl.get().failedPresses).toBe(1);
  });

  it('notifies the screen of each change, and stops when the screen is gone', async () => {
    const t = setup();
    const seen = vi.fn();
    t.ctl.subscribe(seen);
    t.ctl.cancel();
    expect(seen).toHaveBeenCalledTimes(1);
    t.ctl.dispose();
    t.finishCancel(true);
    await settle();
    expect(t.calls.success).toBe(1); // the server did cancel; the haptic is not lost
    expect(t.ctl.get().working).toBeNull(); // and the press is settled, so a screen that comes back is not stuck
    t.ctl.cancel();
    expect(t.calls.cancel).toBe(1); // a tap on a gone screen does nothing
    t.ctl.attach(); // development runs an effect twice
    t.ctl.cancel();
    expect(t.calls.cancel).toBe(2);
  });
});

describe('Try again', () => {
  it('is a pull, answered by working and then by the line "Still on their way" (spoken) when the book has not come', async () => {
    const t = setup();
    t.ctl.retry();
    expect(t.ctl.get()).toMatchObject({ working: 'retry', acted: false, notYet: false });
    t.ctl.retry();
    expect(t.calls.pull).toBe(1);
    t.finishPull();
    await settle();
    expect(t.ctl.get()).toMatchObject({ working: null, acted: false, notYet: true });
    expect(t.calls.announce).toEqual([c.open.notYet]);
  });

  it('[BL-496] a whole Try again press, answered or given up, never lets a failure be shown', async () => {
    const t = setup();
    t.ctl.retry();
    t.finishPull();
    await settle();
    expect(t.ctl.get().acted).toBe(false);
    t.ctl.retry();
    await vi.advanceTimersByTimeAsync(WORKING_CAP_MS);
    expect(t.ctl.get()).toMatchObject({ working: null, acted: false });
  });

  it('says nothing about "still on their way" when the pull has just brought the book back', async () => {
    const t = setup({ bookListed: () => true });
    t.ctl.retry();
    t.finishPull();
    await settle();
    expect(t.ctl.get()).toMatchObject({ working: null, notYet: false });
    expect(t.calls.announce).toEqual([]);
  });

  it('a pull that fails is the same as one that found nothing, and a pull that never settles gives the buttons back', async () => {
    const t = setup({ pull: () => Promise.reject(new Error('offline')) });
    t.ctl.retry();
    await settle();
    expect(t.ctl.get()).toMatchObject({ working: null, notYet: true });

    const u = setup();
    u.ctl.retry();
    await vi.advanceTimersByTimeAsync(WORKING_CAP_MS);
    expect(u.ctl.get().working).toBeNull();
    expect(u.calls.announce).toEqual([]); // nothing was found, nothing is claimed
  });

  it('a screen that is gone is not spoken to', async () => {
    const t = setup();
    t.ctl.retry();
    t.ctl.dispose();
    t.finishPull();
    await settle();
    expect(t.calls.announce).toEqual([]);
  });

  it('a new press clears the line of the last one', async () => {
    const t = setup();
    t.ctl.retry();
    t.finishPull();
    await settle();
    expect(t.ctl.get().notYet).toBe(true);
    t.ctl.retry();
    expect(t.ctl.get().notYet).toBe(false);
  });
});
