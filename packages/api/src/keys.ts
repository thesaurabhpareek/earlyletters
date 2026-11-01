/**
 * Public keys the app trusts for signed documents (ADR 0016).
 *
 * Two keys from the first ceremony (1 Nov 2026, F19-REQ-002): the primary
 * `el-2026-11` and the cold backup `el-2026-11-backup`, made with
 * `node scripts/packs/keygen.mjs` and `--backup`. These are the public halves
 * only. Every build trusts both, so if the primary is lost, publishing
 * continues with the backup. With no key listed the app would fail closed:
 * it installs no downloaded pack, keeps its bundled remote-config defaults
 * and shows the packaged copy. Nothing unsigned is ever trusted.
 *
 * Rotation: add the new key, ship an app release, start signing with it, and
 * remove the old key in a later release. A key compromise needs an app
 * release to revoke, so the private key lives only in the founder's password
 * manager and the signing shell's environment, never in the repo, CI or a
 * server.
 */
import type { TrustedKey } from './integrity';

export const TRUSTED_SIGNING_KEYS: readonly TrustedKey[] = [
  { keyId: 'el-2026-11', publicKey: '3lnUU4b9YTzh2twX8CoRXkeu4qH+Lx76AD+zAlT603Y=', kinds: ['pack-manifest', 'remote-config', 'content-bundle'] },
  { keyId: 'el-2026-11-backup', publicKey: 'dqbrwq6qWJyaa8Wha3CWz+bEPmtj4rn0DXf+LprNPGw=', kinds: ['pack-manifest', 'remote-config', 'content-bundle'] },
];
