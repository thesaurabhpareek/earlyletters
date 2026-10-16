/**
 * escrow Edge Function. Deploy ONLY to the separate Supabase project `scribe-escrow`, from CI on a
 * release tag with the founder's approval (docs/ops/BACKUP_RUNBOOK.md, steps B3 to B6):
 *   npx supabase functions deploy escrow --project-ref <scribe-escrow ref> --no-verify-jwt
 * --no-verify-jwt because the caller's token comes from the MAIN project; the function verifies it
 * against the main project's signing keys itself (jwt.ts). Never deploy this to the main project.
 * Secrets: the runbook's step B4 lists every name. This folder imports nothing from outside itself.
 */
import { makeHandler } from './handler.ts';

// deno-lint-ignore no-explicit-any
const D = (globalThis as any).Deno;
D.serve(makeHandler((name: string) => D.env.get(name)));
