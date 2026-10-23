/**
 * The phone's side of an invite draft (invite-draft.logic.ts): expo-crypto for the 32 random
 * bytes and the SHA-256, and the store's UUIDv7 for the id. Nothing here is logged or tracked.
 */
import * as Crypto from 'expo-crypto';
import { uuidv7 } from '../store';
import { newInviteDraft, type InviteDraft } from './invite-draft.logic';

export function makeInviteDraft(): Promise<InviteDraft> {
  return newInviteDraft({
    randomBytes: (n) => Crypto.getRandomBytes(n),
    // Lowercase hex by default (lib/auth/nonce.ts relies on the same).
    sha256Hex: (text) => Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, text),
    newId: () => uuidv7(),
  });
}
