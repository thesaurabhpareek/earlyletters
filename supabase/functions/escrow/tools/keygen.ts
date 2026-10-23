/**
 * Escrow key ceremony (WP-F08-B8, F08 6.5 G1; docs/ops/BACKUP_RUNBOOK.md step K1 to K7).
 * Run ONLY on a computer with networking off for the whole ceremony:
 *   deno run --no-prompt supabase/functions/escrow/tools/keygen.ts <version>
 * No permissions are granted, so this cannot read files, the environment or the network.
 * Prints one X25519 key pair: the private key (for the two paper copies and, typed once, the
 * escrow project's ESCROW_PRIVATE_KEY_V<version> secret) and the public key, the only part that
 * leaves the ceremony: pinned in supabase/functions/escrow/public-keys.ts (the function refuses a
 * private key that does not derive it, so a slip typing the paper copy opens nothing) and given
 * to the app builds as EXPO_PUBLIC_ESCROW_KEYS (packages/api/src/server/escrow-keys.ts). It
 * writes nothing to disk.
 * Not deployed: the function's entry point (index.ts) does not import it.
 */
import { encodeBase64, toHex } from '../bytes.ts';
import { generateKeyPair, publicKeyOf } from '../hpke.ts';

// deno-lint-ignore no-explicit-any
const D = (globalThis as any).Deno;
const version = Number(D.args[0]);
const out = (s: string) => D.stdout.writeSync(new TextEncoder().encode(`${s}\n`));
if (!Number.isInteger(version) || version < 1 || version > 9) {
  out('usage: keygen.ts <escrow key version 1 to 9>');
  D.exit(2);
}
const kp = await generateKeyPair();
if (toHex(await publicKeyOf(kp.sk)) !== toHex(kp.pk)) throw new Error('self-check failed');
out(`Escrow key version ${version}`);
out('');
out(`PRIVATE (paper copies and ESCROW_PRIVATE_KEY_V${version} only; never on a networked device):`);
out(`  ${encodeBase64(kp.sk)}`);
out('');
out('PUBLIC (safe to share). Pin it in supabase/functions/escrow/public-keys.ts, this line:');
out(`  ${version}: '${encodeBase64(kp.pk)}',`);
out('and add it to EXPO_PUBLIC_ESCROW_KEYS for the builds of its environment (packages/api/src/server/escrow-keys.ts):');
out(`  {"version": ${version}, "publicKey": "${encodeBase64(kp.pk)}", "environment": "<production or drill>", "current": true}`);
out('  ("current": false while it is the next key of a rotation, R1)');
out(`The same public key in hex: ${toHex(kp.pk)}`);
kp.sk.fill(0);
