/**
 * Public keys the app trusts for signed documents (ADR 0016).
 *
 * Empty until the founder generates the signing keys once (the packs key
 * generator, `node scripts/packs/keygen.mjs`, run twice: a primary and a
 * cold backup, F19-REQ-002) and pastes the two printed public keys here.
 * While it is empty the app fails closed: it installs no downloaded pack,
 * keeps its bundled remote-config defaults and shows the packaged copy.
 * Nothing breaks; nothing unsigned is trusted.
 *
 * Rotation: add the new key, ship an app release, start signing with it, and
 * remove the old key in a later release. A key compromise needs an app
 * release to revoke, so the private key lives only in the founder's password
 * manager and the signing shell's environment, never in the repo, CI or a
 * server.
 */
import type { TrustedKey } from './integrity';

export const TRUSTED_SIGNING_KEYS: readonly TrustedKey[] = [
  // TODO(founder): paste the two public key lines `node scripts/packs/keygen.mjs` prints (docs/ops/PACKS_HOSTING.md step 1), for example:
  // { keyId: 'el-2026-10', publicKey: '<44 base64 characters>', kinds: ['pack-manifest', 'remote-config', 'content-bundle'] },
];
