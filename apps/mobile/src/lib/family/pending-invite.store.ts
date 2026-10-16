/**
 * The pending invite token's store over any Keychain-like storage (pure, so
 * the F11-REQ-006 gate test runs against a fake; pending-invite.ts passes the
 * real expo-secure-store wrapper). Rules in pending-invite.ts.
 */
import { decodePendingInvite, encodePendingInvite, isInviteToken, type PendingInvite } from './invite-link.logic';

export const PENDING_INVITE_KEY = 'scribe.family.pendingInvite';

export interface KeychainLike {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
}

export interface PendingInviteStore {
  save(token: string, now?: number): Promise<void>;
  read(now?: number): Promise<PendingInvite | null>;
  clear(): Promise<void>;
}

export function createPendingInviteStore(storage: KeychainLike): PendingInviteStore {
  const clear = async () => {
    await storage.removeItem(PENDING_INVITE_KEY).catch(() => {});
  };
  return {
    async save(token, now = Date.now()) {
      if (!isInviteToken(token)) return;
      await storage.setItem(PENDING_INVITE_KEY, encodePendingInvite({ token, receivedAt: now }));
    },
    async read(now = Date.now()) {
      let raw: string | null = null;
      try {
        raw = await storage.getItem(PENDING_INVITE_KEY);
      } catch {
        return null; // Keychain locked (before first unlock): try again later
      }
      const p = decodePendingInvite(raw, now);
      if (raw && !p) await clear();
      return p;
    },
    clear,
  };
}
