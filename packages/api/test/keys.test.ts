/**
 * The trusted signing keys shipped in the app (keys.ts, ADR 0016, F19-REQ-002).
 * The verifier and scripts/packs take the first key with a given id, so a second
 * key under the same id would never be used (review A of #162, N5). Empty today:
 * the checks hold from the first key the founder pastes in.
 */
import { describe, expect, it } from 'vitest';
import { KEY_ID_RE } from '../src/index';
import { TRUSTED_SIGNING_KEYS } from '../src/keys';

describe('[F19-REQ-002] TRUSTED_SIGNING_KEYS', () => {
  it('never lists two keys with one key id, or one public key twice', () => {
    const ids = TRUSTED_SIGNING_KEYS.map((k) => k.keyId);
    const publicKeys = TRUSTED_SIGNING_KEYS.map((k) => k.publicKey);
    expect(ids.filter((id, i) => ids.indexOf(id) !== i)).toEqual([]);
    expect(publicKeys.filter((p, i) => publicKeys.indexOf(p) !== i)).toEqual([]);
  });

  it('every key id is one the signer accepts', () => {
    for (const k of TRUSTED_SIGNING_KEYS) expect(k.keyId).toMatch(KEY_ID_RE);
  });
});
