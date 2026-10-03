/**
 * Makes the Ed25519 key that signs packs and public documents (ADR 0016).
 * Run once, on your own computer:
 *
 *   npx tsx scripts/packs/keygen.ts [key-id]        # key-id defaults to el-YYYY-MM
 *
 * It prints two things and writes nothing to disk:
 *  1. the PUBLIC key line to paste into packages/api/src/keys.ts (commit it);
 *  2. the SECRET seed: store it in your password manager only. Never commit
 *     it, never put it in CI, EAS, Supabase or Vercel. Losing it means new
 *     documents need a new key and an app release; leaking it means the same.
 */
import { generateSigningKey, KEY_ID_RE } from '../../packages/api/src/index';

const keyId = process.argv[2] ?? `el-${new Date().toISOString().slice(0, 7)}`;
if (!KEY_ID_RE.test(keyId)) {
  process.stderr.write('key id: lowercase letters, digits and hyphens, 2 to 32 characters\n');
  process.exit(2);
}
const { secretKey, publicKey } = generateSigningKey();
process.stdout.write(`1. Paste into packages/api/src/keys.ts (TRUSTED_SIGNING_KEYS):

  { keyId: '${keyId}', publicKey: '${publicKey}', kinds: ['pack-manifest', 'remote-config', 'content-bundle'] },

2. Save in your password manager (secret; shown once):

  EL_SIGNING_KEY_ID=${keyId}
  EL_SIGNING_KEY=${secretKey}

Before publishing, load both into your shell (for example: export EL_SIGNING_KEY=...), then run
  npx tsx scripts/packs/publish.ts all
`);
