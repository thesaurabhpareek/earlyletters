#!/usr/bin/env node
/**
 * Makes the Ed25519 key that signs packs and public documents (ADR 0016).
 * Run ONCE, on your own computer, with plain Node 22 or later. No install,
 * no network, nothing written to disk:
 *
 *   node scripts/packs/keygen.mjs [key-id]            # the primary; key-id defaults to el-YYYY-MM; prints only to a terminal
 *   node scripts/packs/keygen.mjs --backup [key-id]   # the cold backup (F19-REQ-002); key-id defaults to el-YYYY-MM-backup
 *
 * It prints two things:
 *  1. the PUBLIC key line to paste into packages/api/src/keys.ts (commit it;
 *     every build made after that trusts documents signed with this key);
 *  2. the SECRET seed: store it in your password manager only. Never commit
 *     it, never put it in CI, EAS, Supabase, Vercel or a chat. Losing it means
 *     a new key and an app release; leaking it means the same.
 *
 * Format: the 32-byte seed and the 32-byte public key in standard base64,
 * exactly what packages/api/src/integrity.ts signs and verifies with
 * (@noble/ed25519, RFC 8032). scripts/packs/release.test.ts runs this file and
 * proves a key from here signs a manifest the app's verifier accepts.
 */
import { generateKeyPairSync } from 'node:crypto';
import { pathToFileURL } from 'node:url';

/** Same rule as KEY_ID_RE in packages/api/src/integrity.ts (release.test.ts checks they stay identical). */
export const KEY_ID_RE = /^[a-z0-9][a-z0-9-]{1,31}$/;

export const DEFAULT_KINDS = ['pack-manifest', 'remote-config', 'content-bundle'];

/** A fresh key: `{ secretKey, publicKey }`, standard base64 of the raw 32 bytes each. */
export function generate() {
  const { privateKey, publicKey } = generateKeyPairSync('ed25519');
  const jwk = privateKey.export({ format: 'jwk' });
  const pub = publicKey.export({ format: 'jwk' });
  const std = (u) => Buffer.from(u, 'base64url').toString('base64');
  if (jwk.crv !== 'Ed25519' || !jwk.d || !pub.x) throw new Error('unexpected key format from node:crypto');
  return { secretKey: std(jwk.d), publicKey: std(pub.x) };
}

const PRIMARY_STORAGE = `To publish, either export both in your shell, or save those two lines in a file
OUTSIDE this repo (for example ~/.config/early-letters/signing.env, chmod 600)
and pass --key-file <path>. Next: docs/ops/PACKS_HOSTING.md.
`;
const BACKUP_STORAGE = `This is the cold backup. Keep its two lines in a password manager entry of their
own and in an offline copy, apart from the primary; never in signing.env or on
the publishing computer. Use it only if the primary is lost (docs/ops/PACKS_HOSTING.md, custody).
`;

export function render(keyId, { secretKey, publicKey }, { backup = false } = {}) {
  return `1. Paste into packages/api/src/keys.ts (TRUSTED_SIGNING_KEYS), then commit and build the app:

  { keyId: '${keyId}', publicKey: '${publicKey}', kinds: ['pack-manifest', 'remote-config', 'content-bundle'] },

2. Save in your password manager (secret; shown once, never again):

  EL_SIGNING_KEY_ID=${keyId}
  EL_SIGNING_KEY=${secretKey}

${backup ? BACKUP_STORAGE : PRIMARY_STORAGE}`;
}

/**
 * The secret is printed only to an interactive terminal: piped output lands
 * in files, CI logs and agent transcripts. `--to-pipe` overrides it on
 * purpose (the test uses it; so would `... --to-pipe | your-password-manager-cli`).
 */
export function main(argv = process.argv.slice(2), io = { isTTY: Boolean(process.stdout.isTTY), ci: Boolean(process.env.CI) }) {
  const toPipe = argv.includes('--to-pipe');
  const backup = argv.includes('--backup');
  const positional = argv.filter((a) => !a.startsWith('--'));
  // The backup gets its own default id, so two runs in one month never give two keys one id (the app takes the first match).
  const keyId = positional[0] ?? `el-${new Date().toISOString().slice(0, 7)}${backup ? '-backup' : ''}`;
  if (!KEY_ID_RE.test(keyId)) {
    process.stderr.write('key id: lowercase letters, digits and hyphens, 2 to 32 characters\n');
    return 2;
  }
  if (!toPipe && (!io.isTTY || io.ci)) {
    process.stderr.write(
      'Refusing to print a signing key to a pipe, a file or CI: run this in your own terminal (docs/ops/PACKS_HOSTING.md, step 1). Pass --to-pipe only to pipe it straight into a password manager.\n',
    );
    return 3;
  }
  process.stdout.write(render(keyId, generate(), { backup }));
  return 0;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) process.exit(main());
