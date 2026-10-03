/**
 * Public keys the app trusts for signed documents (ADR 0016).
 *
 * Empty until the founder runs `node scripts/packs/keygen.mjs` once and
 * pastes the printed public key here. While it is empty the app fails closed:
 * it installs no downloaded pack, keeps its bundled remote-config defaults and
 * shows the packaged copy. Nothing breaks; nothing unsigned is trusted.
 *
 * Rotation: add the new key, ship an app release, start signing with it, and
 * remove the old key in a later release. A key compromise needs an app
 * release to revoke, so the private key lives only in the founder's password
 * manager and the signing shell's environment, never in the repo, CI or a
 * server.
 */
import type { TrustedKey } from './integrity';

export const TRUSTED_SIGNING_KEYS: readonly TrustedKey[] = [
  // TODO(founder): paste the output of `node scripts/packs/keygen.mjs`, for example:
  // { keyId: 'el-2026-10', publicKey: '<44 base64 characters>', kinds: ['pack-manifest', 'remote-config', 'content-bundle'] },
];
