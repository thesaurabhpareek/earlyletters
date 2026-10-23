/**
 * The escrow public key of each key version, pinned in this repository (review B S1 on PR #151).
 *
 * X25519 accepts any 32 bytes as a private key, so a key typed from a paper copy with one character
 * wrong is still a valid key, only not the one the app seals book keys to. So the function opens
 * nothing unless every configured ESCROW_PRIVATE_KEY_V<n> derives exactly the public key pinned here
 * for <n> (config.ts readKeys), and a rotation moves wraps only to a key pinned here (rotate.ts).
 *
 * Public keys are not secrets: the same bytes go to the app builds as EXPO_PUBLIC_ESCROW_KEYS
 * (packages/api/src/server/escrow-keys.ts). The production key and the staging drill key are
 * different versions, so each escrow project's one private key matches one line here.
 *
 * Empty until the key ceremony (docs/ops/BACKUP_RUNBOOK.md, K6 adds the line keygen.ts prints, in
 * the pull request before the deploy). Until a version is pinned, the function refuses its private
 * key: release and rotate answer 503 unavailable and open nothing.
 */
export const PINNED_PUBLIC_KEYS: Readonly<Record<number, string>> = Object.freeze({
  // <version>: '<standard base64 of the 32-byte X25519 public key, 44 characters>',
});
