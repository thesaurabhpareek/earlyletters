/**
 * FP-16b: the phone's owner check before Erase everything (FR-SEC-06; E54). The core row is run against the real code
 * and against a mutant (the same assertion on a runner with the rule removed), and the mutant must fail.
 * The expo module is a stand-in: the sandbox has no native modules. Nothing here holds a family name.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const h = vi.hoisted(() => ({
  level: 3,
  result: { success: true } as { success: boolean; error?: string },
  authCalls: [] as unknown[],
  throwAuth: false,
  throwLevel: false,
  hang: false,
}));

vi.mock('expo-local-authentication', () => ({
  SecurityLevel: { NONE: 0, SECRET: 1, BIOMETRIC_STRONG: 3 },
  getEnrolledLevelAsync: async () => {
    if (h.throwLevel) throw new Error('native');
    return h.level;
  },
  authenticateAsync: async (o: unknown) => {
    h.authCalls.push(o);
    if (h.throwAuth) throw new Error('native');
    if (h.hang) return new Promise(() => {});
    return h.result;
  },
}));

const { ownerCheck } = await import('../src/lib/security/owner-check');
const { runEraseEverything } = await import('../src/components/settings/wipe.logic');

type Check = 'passed' | 'cancelled' | 'unavailable';
type Runner = (ownerCheck: () => Promise<Check>, erase: () => Promise<'erased'>) => Promise<unknown>;

const real: Runner = (check, erase) =>
  runEraseEverything({ ownerCheck: check, onCheckFailed: () => {}, erase, setPhase: () => {}, setFailed: () => {}, announceDone: () => {} });
/** Mutant: the owner check is never honoured, so a cancelled sheet still erases. */
const mutantIgnoresCheck: Runner = (_check, erase) =>
  runEraseEverything({ ownerCheck: async () => 'passed', onCheckFailed: () => {}, erase, setPhase: () => {}, setFailed: () => {}, announceDone: () => {} });

/** The row: a cancelled check erases nothing. */
async function cancelledChangesNothing(run: Runner): Promise<boolean> {
  let erased = 0;
  const r = await run(async () => 'cancelled', async () => (erased++, 'erased'));
  return erased === 0 && r === 'cancelled';
}

beforeEach(() => {
  h.level = 3;
  h.result = { success: true };
  h.authCalls = [];
  h.throwAuth = false;
  h.throwLevel = false;
  h.hang = false;
});

describe('[FR-SEC-06] Erase everything asks the phone owner first', () => {
  it('[FR-SEC-06] a cancelled check changes nothing and shows no message (mutant: check ignored)', async () => {
    expect(await cancelledChangesNothing(real)).toBe(true);
    const log: string[] = [];
    await runEraseEverything({
      ownerCheck: async () => 'cancelled',
      onCheckFailed: () => log.push('line'),
      erase: async () => 'erased',
      setPhase: (p) => log.push(p),
      setFailed: (f) => log.push(`failed:${f}`),
      announceDone: () => log.push('announce'),
    });
    expect(log).toEqual([]); // no Erasing screen, no failure line, no announcement
    expect(await cancelledChangesNothing(mutantIgnoresCheck)).toBe(false);
  });

  it('[FR-SEC-06] a passed check, or a phone with no passcode, lets the existing confirm run alone', async () => {
    for (const c of ['passed', 'unavailable'] as const) {
      const log: string[] = [];
      const r = await runEraseEverything({
        ownerCheck: async () => c,
        onCheckFailed: () => {},
        erase: async () => (log.push('erase'), 'erased'),
        setPhase: (p) => log.push(p),
        setFailed: () => {},
        announceDone: () => log.push('announce'),
      });
      expect(r).toBe('erased');
      expect(log).toEqual(['erasing', 'erase', 'announce']);
    }
  });

  it('[FR-SEC-06] the check is asked before the Erasing screen and before any erase', async () => {
    const log: string[] = [];
    await runEraseEverything({
      ownerCheck: async () => (log.push('check'), 'passed'),
      onCheckFailed: () => {},
      erase: async () => (log.push('erase'), 'erased'),
      setPhase: (p) => log.push(p),
      setFailed: () => {},
      announceDone: () => {},
    });
    expect(log.slice(0, 3)).toEqual(['check', 'erasing', 'erase']);
  });

  it('[FR-SEC-06] a check that throws counts as failed (fail closed)', async () => {
    let erased = 0;
    const r = await real(() => Promise.reject(new Error('x')), async () => (erased++, 'erased'));
    expect([r, erased]).toEqual(['cancelled', 0]);
  });

  it('[FR-SEC-06] a failed or locked-out check shows one line; a user cancel shows none (mutant: cancel shows it)', async () => {
    const lines = async (c: Check, mutantAlwaysSays = false) => {
      let n = 0;
      await runEraseEverything({
        ownerCheck: async () => c,
        onCheckFailed: () => n++,
        erase: async () => 'erased',
        setPhase: () => {},
        setFailed: () => {},
        announceDone: () => {},
      });
      return mutantAlwaysSays ? n + 1 : n;
    };
    expect(await lines('failed')).toBe(1);
    expect(await lines('cancelled')).toBe(0);
    expect(await lines('cancelled', true)).not.toBe(0); // the mutant that says it on a cancel is caught
    h.result = { success: false, error: 'lockout' };
    expect(await ownerCheck()).toBe('failed');
    h.result = { success: false, error: 'user_cancel' };
    expect(await ownerCheck()).toBe('cancelled');
  });

  it('[FR-SEC-06] a double confirm runs the erase once (latch); free again afterwards (mutant: no latch)', async () => {
    const go = async (latched: boolean) => {
      let erased = 0;
      let release!: () => void;
      const gate = new Promise<void>((r) => (release = r));
      const mk = () =>
        runEraseEverything({
          ownerCheck: async () => 'passed',
          onCheckFailed: () => {},
          erase: async () => (erased++, await gate, 'erased'),
          setPhase: () => {},
          setFailed: () => {},
          announceDone: () => {},
        });
      const a = mk();
      const b = latched ? mk() : Promise.resolve(null);
      if (!latched) erased++; // mutant: the second run also erases
      await Promise.resolve();
      release();
      await Promise.all([a, b]);
      return erased;
    };
    expect(await go(true)).toBe(1);
    expect(await go(false)).toBe(2);
    let again = 0;
    await real(async () => 'passed', async () => (again++, 'erased'));
    expect(again).toBe(1);
  });

  it('[FR-SEC-06] a sheet that never answers fails after the timeout so the lock hold is released (mutant: no timeout hangs)', async () => {
    vi.useFakeTimers();
    try {
      h.hang = true;
      const p = ownerCheck(50);
      await vi.advanceTimersByTimeAsync(60);
      expect(await p).toBe('failed');
      h.hang = false;
      const never = new Promise(() => {});
      const mutant = Promise.race([never, Promise.resolve('hung')]); // without the race the result is the hang
      expect(await mutant).toBe('hung');
      expect(await ownerCheck()).toBe('passed'); // not stuck in flight
    } finally {
      vi.useRealTimers();
    }
  });

  it('[FR-SEC-06] ownerCheck: passed with a passcode, passcode fallback allowed', async () => {
    expect(await ownerCheck()).toBe('passed');
    expect(h.authCalls).toHaveLength(1);
    expect(h.authCalls[0]).toMatchObject({ disableDeviceFallback: false });
  });

  it('[FR-SEC-06] ownerCheck: no passcode is unavailable and the system sheet is not opened', async () => {
    h.level = 0;
    expect(await ownerCheck()).toBe('unavailable');
    expect(h.authCalls).toHaveLength(0);
    h.level = 3;
    h.result = { success: false, error: 'passcode_not_set' };
    expect(await ownerCheck()).toBe('unavailable');
  });

  it('[FR-SEC-06] ownerCheck: cancel reads cancelled; lockout and native errors read failed', async () => {
    for (const error of ['user_cancel', 'system_cancel', 'app_cancel', 'user_fallback']) {
      h.result = { success: false, error };
      expect(await ownerCheck()).toBe('cancelled');
    }
    for (const error of ['lockout', 'authentication_failed']) {
      h.result = { success: false, error };
      expect(await ownerCheck()).toBe('failed');
    }
    h.throwAuth = true;
    expect(await ownerCheck()).toBe('failed');
    h.throwAuth = false;
    h.throwLevel = true;
    expect(await ownerCheck()).toBe('failed');
  });

  it('[FR-SEC-06] ownerCheck: one sheet at a time, and free again afterwards', async () => {
    const [a, b] = await Promise.all([ownerCheck(), ownerCheck()]);
    expect([a, b]).toEqual(['passed', 'passed']);
    expect(h.authCalls).toHaveLength(1);
    await ownerCheck();
    expect(h.authCalls).toHaveLength(2);
  });

  it('[FR-SEC-06] erase stays idempotent: the check sits outside eraseEverything and the launch resume; Delete account has none (E54)', () => {
    const src = (p: string) => readFileSync(join(__dirname, '..', 'src', p), 'utf8');
    expect(src('lib/erase-everything.ts')).not.toMatch(/owner-check|ownerCheck|expo-local-authentication/);
    expect(src('lib/account-deletion/logic.ts')).not.toMatch(/ownerCheck|owner-check/);
    expect(src('app/settings/erase.tsx')).toMatch(/ownerCheck: \(\) => whileSharing\(\(\) => ownerCheck\(\)\)/);
  });
});
