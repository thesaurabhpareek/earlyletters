/**
 * One invite the person asked for, made on this phone before anything is sent (PRD V2 F11 D5,
 * F11-REQ-002; gap G-07): an id (UUIDv7), a 32-byte token for the link, and the token's SHA-256
 * for the server. The token never leaves the phone except inside the link the person shares;
 * the server stores and compares only the hash.
 *
 * The screen keeps one draft per sheet and signature. A retry after a lost answer, or a second
 * tap on Share, sends the same draft, so the server sees one request (it answers a repeat with the
 * same id and hash as success) and the person gets one invite (F11-U15).
 *
 * Pure: randomness, hashing and ids are passed in (expo-crypto on the phone, node:crypto in tests).
 */
import { INVITE_TOKEN_BYTES, inviteTokenFromBytes } from '@scribe/core/src/invite';

export interface InviteDraft {
  /** UUIDv7 made on this phone; the invite's id on the server. */
  id: string;
  /** 43 base64url characters; only ever in the shared link. */
  token: string;
  /** SHA-256 of the token's UTF-8 text, 64 lowercase hex: what the server stores (`token_hash`). */
  tokenHash: string;
}

export interface InviteDraftDeps {
  randomBytes(n: number): Uint8Array;
  /** SHA-256 of a UTF-8 string, hex. */
  sha256Hex(text: string): Promise<string>;
  newId(): string;
}

const HEX64 = /^[0-9a-f]{64}$/;

export async function newInviteDraft(deps: InviteDraftDeps): Promise<InviteDraft> {
  const token = inviteTokenFromBytes(deps.randomBytes(INVITE_TOKEN_BYTES));
  const tokenHash = (await deps.sha256Hex(token)).toLowerCase();
  if (!HEX64.test(tokenHash)) throw new Error('invite_hash_invalid');
  return { id: deps.newId(), token, tokenHash };
}

/** PostgREST's text form of a bytea argument: `\x` and lowercase hex. */
export function byteaArg(hex: string): string {
  if (!HEX64.test(hex)) throw new Error('invite_hash_invalid');
  return `\\x${hex}`;
}
