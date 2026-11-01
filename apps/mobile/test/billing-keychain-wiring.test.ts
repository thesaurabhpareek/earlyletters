/// <reference types="node" />
/**
 * Startup wires the Keychain into the letter ledger (D-083: the free-letter count survives a reinstall).
 * Loading `@/lib/billing` runs `letter-ledger.keychain.ts`, which hands the secure storage to the ledger.
 * If that import is dropped from lib/billing/index.ts, or the wiring passes anything but the secure
 * storage, the ledger quietly runs on the database alone and a reinstall resets the count, with no error
 * anywhere (#276 lens B, finding 1). This loads the real index with the secure storage faked and reads
 * the count back through the ledger. The screen-facing modules the index also re-exports are stubbed:
 * they load React Native and StoreKit, which Node does not have, and play no part in the wiring.
 */
import { describe, expect, it, vi } from 'vitest';

const keychain = vi.hoisted(() => new Map<string, string>([['earlyletters.letters.keptEver', '{"v":1,"n":5}']]));
vi.mock('../src/lib/supabase/secure-storage', () => ({
  secureStorage: {
    getItem: async (k: string) => keychain.get(k) ?? null,
    setItem: async (k: string, v: string) => void keychain.set(k, v),
    removeItem: async (k: string) => void keychain.delete(k),
  },
}));
vi.mock('expo-crypto', () => ({ getRandomBytes: (n: number) => new Uint8Array(n).fill(7) }));
vi.mock('../src/lib/db/repos/open-native', () => ({ openNativeDb: () => { throw new Error('native open must not be used in tests'); } }));
vi.mock('../src/lib/billing/plan-store', () => ({
  getPlan: () => ({ view: { state: 'none' }, details: {}, checkedAt: null }),
  refreshPlan: async () => {},
  startPlus: () => () => {},
  storeViewSupport: () => 'unsupported',
  subscribePlan: () => () => {},
}));
vi.mock('../src/lib/billing/use-plan', () => ({ usePlan: () => ({}) }));
vi.mock('../src/lib/billing/plan-reminders', () => ({
  askPlanReminderPermission: async () => 'denied',
  canAskForReminders: () => false,
  getPlanReminderPermission: async () => 'denied',
  reschedulePlanReminders: async () => {},
}));
vi.mock('../src/lib/billing/plan-notice', () => ({ PlanNoteBody: () => null, PlanNoticeHost: () => null, usePlanNote: () => null }));
vi.mock('../src/lib/billing/actions', () => ({
  manageSubscription: async () => {},
  presentPlusStore: async () => 'unavailable',
  redeemOfferCode: async () => 'unavailable',
  requestRefund: async () => {},
  restorePurchases: async () => ({}),
  storeSheetOptions: {},
}));

describe('[D-083] loading @/lib/billing wires the Keychain into the letter ledger', () => {
  it('the ledger reads the count the Keychain holds, and writes a raised count back to it', async () => {
    await import('../src/lib/billing');
    const ledger = await import('../src/lib/billing/letter-ledger');
    expect(await ledger.readKeychainCount()).toBe(5);
    await ledger.raiseKeychainCount(6);
    expect(keychain.get('earlyletters.letters.keptEver')).toBe('{"v":1,"n":6}');
  }, 30_000); // loads the store and the billing index: slow on a busy machine
});
