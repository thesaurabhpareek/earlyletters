/**
 * escrow Edge Function. Deploy ONLY to the separate Supabase project `scribe-escrow`, by the
 * founder from their own computer (docs/ops/BACKUP_RUNBOOK.md, steps B3 to B6) until S20's release
 * job for it exists; deploy-functions.yml never deploys it:
 *   npx supabase functions deploy escrow --project-ref <scribe-escrow ref> --no-verify-jwt
 * --no-verify-jwt because the caller's token comes from the MAIN project; the function verifies it
 * against the main project's signing keys itself (jwt.ts). Never deploy this to the main project.
 * Secrets: the runbook's step B5 lists every name. Public keys: public-keys.ts (K6). This folder
 * imports nothing from outside itself.
 */
import { makeHandler } from './handler.ts';

// deno-lint-ignore no-explicit-any
const D = (globalThis as any).Deno;
D.serve(makeHandler((name: string) => D.env.get(name)));
