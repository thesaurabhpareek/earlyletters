/**
 * NS-53 PR 8 follow-up (BL-1541) (BL-1541): the moments launch cleanup is wired at boot, flag off is no call, and Turn off wipes the file.
 * The store rules (a local file kept, another owner's deleted) are in moments-store.test.ts; here is the timing.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it, vi } from 'vitest';
import { startMomentsLaunchCleanup, type LaunchAuthPort } from '../src/lib/moments/launch.logic';

const src = (p: string) => readFileSync(join(__dirname, '..', 'src', p), 'utf8');

function rig(over: { user?: string | null; signedOut?: boolean; on?: boolean; books?: () => string[] | null } = {}) {
  const st = { user: over.user ?? null, signedOut: over.signedOut ?? false };
  const subs = new Set<() => void>(),
    ins = new Set<() => void>();
  const auth: LaunchAuthPort = {
    userId: () => st.user,
    settledSignedOut: () => st.signedOut,
    subscribe: (l) => (subs.add(l), () => void subs.delete(l)),
    onSignedIn: (l) => (ins.add(l), () => void ins.delete(l)),
  };
  const cleanup = vi.fn(async (_b: readonly string[] | null) => {});
  const stop = startMomentsLaunchCleanup({ on: over.on ?? true, auth, cleanup, liveBooks: over.books ?? (() => ['b1']) });
  return { st, cleanup, stop, subs, ins, fire: () => [...subs, ...ins].forEach((l) => l()) };
}

describe('[BL-1541] the launch cleanup runs once the owner is settled', () => {
  it('flag off: nothing is called, read or subscribed', () => {
    const r = rig({ on: false, signedOut: true, user: 'u' });
    expect(r.cleanup).not.toHaveBeenCalled();
    expect(r.subs.size + r.ins.size).toBe(0);
  });

  it('waits while the session is still restoring, then runs once when sign-out is settled', () => {
    const r = rig();
    expect(r.cleanup).not.toHaveBeenCalled();
    r.st.signedOut = true;
    r.fire();
    r.fire();
    expect(r.cleanup).toHaveBeenCalledTimes(1);
    expect(r.cleanup).toHaveBeenCalledWith(['b1']);
    expect(r.subs.size + r.ins.size).toBe(0);
  });

  it('a signed-in person runs it once the session is released, not before', () => {
    const r = rig();
    r.subs.forEach((l) => l());
    expect(r.cleanup).not.toHaveBeenCalled();
    r.st.user = 'asha';
    r.subs.forEach((l) => l()); // the raw subscription runs before the owner is bound: never starts it for a signed-in session
    expect(r.cleanup).not.toHaveBeenCalled();
    r.ins.forEach((l) => l()); // onSignedIn: after the bind
    expect(r.cleanup).toHaveBeenCalledTimes(1);
  });

  it('an unreadable book list passes null', () => {
    const r = rig({ signedOut: true, books: () => { throw new Error('x'); } });
    expect(r.cleanup).toHaveBeenCalledWith(null);
  });

  it('a cleanup that rejects never throws, and its error code (only) goes to failed()', async () => {
    const failed = vi.fn();
    const auth: LaunchAuthPort = { userId: () => 'a', settledSignedOut: () => false, subscribe: () => () => {}, onSignedIn: () => () => {} };
    let stop: () => void = () => {};
    expect(() => {
      stop = startMomentsLaunchCleanup({ on: true, auth, cleanup: () => Promise.reject(Object.assign(new Error('path /secret'), { code: 'moments_file_not_removed' })), failed, liveBooks: () => [] });
    }).not.toThrow();
    await new Promise((r) => setTimeout(r, 0));
    expect(failed).toHaveBeenCalledTimes(1);
    expect(failed).toHaveBeenCalledWith('moments_file_not_removed'); // the code, never the message
    stop();
    const noHook = startMomentsLaunchCleanup({ on: true, auth, cleanup: () => Promise.reject(new Error('x')), liveBooks: () => [] });
    await new Promise((r) => setTimeout(r, 0)); // no failed(): still no unhandled rejection (vitest fails the run on one)
    noHook();
  });
});

describe('[BL-1541] boot wiring (source)', () => {
  it('startServices calls it through safely, and the wiring is gated by the flag', () => {
    expect(src('app/_layout.tsx')).toMatch(/safely\(startMomentsCleanup\)/);
    const w = src('lib/moments/launch.ts');
    expect(w).toMatch(/on: boolean = MOMENTS_TAB_ON/);
    expect(src('lib/moments/launch.logic.ts')).toMatch(/if \(!d\.on\) return/);
  });
  it('the boot wiring reports a failed cleanup by code', () => {
    expect(src('lib/moments/launch.ts')).toMatch(/failed: report/);
  });
  it('the pure part imports nothing', () => {
    expect(src('lib/moments/launch.logic.ts')).not.toMatch(/^import /m);
  });
});
