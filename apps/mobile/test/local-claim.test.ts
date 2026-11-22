/**
 * The claim step for the two device-only files (NS-47-R7, E73; CPO-30, CPrivO-17, CDO-24). The owner key is the first 16
 * hex of SHA-256 of the user id (fixed vectors, fictional family Asha). The wiring: a released sign-in sets both
 * stores' owner, signing out puts them back to 'local', and "Keep in this account" adopts the local files BEFORE the
 * claim is confirmed. The stores' own rules are in days-store.test.ts and moments-store.test.ts.
 * Mutants: drop the setOwner call on sign-in; drop the setOwner('local') on sign-out; confirm before adopting; skip
 * either store's adopt; a hash of the wrong length.
 */
import { createHash } from 'node:crypto';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const h = vi.hoisted(() => ({
  calls: [] as string[],
  adopt: (async () => 'adopted') as (store: string, key: string) => Promise<string>,
}));
vi.mock('../src/lib/days', () => ({
  setDaysOwner: (k: string) => h.calls.push(`days.setOwner:${k}`),
  daysStore: { adoptLocal: (k: string) => (h.calls.push(`days.adopt:${k}`), h.adopt('days', k)) },
}));
vi.mock('../src/lib/moments', () => ({
  momentsStore: {
    setOwner: (k: string) => h.calls.push(`moments.setOwner:${k}`),
    adoptLocal: (k: string) => (h.calls.push(`moments.adopt:${k}`), h.adopt('moments', k)),
  },
}));

const { ownerKey, bindDeviceOnlyOwners, adoptDeviceOnlyLocal } = await import('../src/lib/auth/local-claim');
const auth = await import('../src/lib/auth/auth-store');

const ASHA = '0199a5b0-0000-7000-8000-00000000a5a1';
const ASHA_PARTNER = '0199a5b0-0000-7000-8000-00000000b0b1';
const signedOut = () => ({ status: 'signedOut' }) as never;

beforeEach(() => {
  auth.resetAuthStoreForTests();
  h.calls.length = 0;
  h.adopt = async () => 'adopted';
});

describe('[CPO-30] the owner key', () => {
  it('is the first 16 hex of SHA-256 of the user id, with fixed vectors', () => {
    expect(ownerKey(ASHA)).toBe('816987ec4a85a278');
    expect(ownerKey(ASHA_PARTNER)).toBe('0ae5ff6e37872f90');
    for (const id of [ASHA, ASHA_PARTNER, 'x']) expect(ownerKey(id)).toBe(createHash('sha256').update(id).digest('hex').slice(0, 16));
    expect(ownerKey(ASHA)).toMatch(/^[0-9a-f]{16}$/);
  });
});

describe('[CPO-30] sign-in and sign-out set the owner of both device-only stores', () => {
  it('a released sign-in sets both owners to the key; sign-out puts both back to local', () => {
    const off = bindDeviceOnlyOwners();
    auth.setClaimReaders({ owner: () => ASHA, hasLocalData: () => false });
    auth.publishAuth({ status: 'ready', userId: ASHA, sync: 'on' } as never);
    const key = ownerKey(ASHA);
    expect(h.calls).toEqual([`days.setOwner:${key}`, `moments.setOwner:${key}`]);
    h.calls.length = 0;
    auth.publishAuth(signedOut());
    expect(h.calls).toEqual(['days.setOwner:local', 'moments.setOwner:local']);
    off();
  });

  it('a session still waiting on the claim screen does not set the owner (the local file stays until Keep or Not my account)', () => {
    const off = bindDeviceOnlyOwners();
    auth.setClaimReaders({ owner: () => null, hasLocalData: () => true });
    auth.publishAuth({ status: 'ready', userId: ASHA, sync: 'on' } as never);
    expect(h.calls).toEqual([]);
    off();
  });

  it('stops listening when unbound', () => {
    bindDeviceOnlyOwners()();
    auth.setClaimReaders({ owner: () => ASHA, hasLocalData: () => false });
    auth.publishAuth({ status: 'ready', userId: ASHA, sync: 'on' } as never);
    auth.publishAuth(signedOut());
    expect(h.calls).toEqual([]);
  });
});

describe('[CPO-30] Keep in this account adopts both local files first', () => {
  it('asks both stores to adopt under the key, and resolves only when both are done', async () => {
    let done!: () => void;
    h.adopt = (store) => (store === 'moments' ? new Promise((r) => (done = () => r('adopted'))) : Promise.resolve('adopted'));
    let resolved = false;
    const p = adoptDeviceOnlyLocal(ASHA).then(() => (resolved = true));
    await Promise.resolve();
    expect(h.calls).toEqual([`days.adopt:${ownerKey(ASHA)}`, `moments.adopt:${ownerKey(ASHA)}`]);
    expect(resolved).toBe(false);
    done();
    await p;
    expect(resolved).toBe(true);
  });

  it('one store failing does not stop the other, and never rejects', async () => {
    h.adopt = async (store) => {
      if (store === 'days') throw new Error('disk');
      return 'adopted';
    };
    await expect(adoptDeviceOnlyLocal(ASHA)).resolves.toBeUndefined();
    expect(h.calls).toEqual([`days.adopt:${ownerKey(ASHA)}`, `moments.adopt:${ownerKey(ASHA)}`]);
  });
});

describe('[CPO-30] session-provider wiring', () => {
  it('Keep in this account adopts first and confirms after; the binding is mounted with the provider', async () => {
    const { readFileSync } = await import('node:fs');
    const { join } = await import('node:path');
    const t = readFileSync(join(__dirname, '..', 'src/lib/auth/session-provider.tsx'), 'utf8');
    expect(t).toMatch(/adoptDeviceOnlyLocal\(cur\.userId\)\.then\(\(\) => confirmAccountClaim\(cur\.userId\)\)/);
    expect(t).toMatch(/bindDeviceOnlyOwners\(\)/);
  });
});
