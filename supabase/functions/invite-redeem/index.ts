/**
 * invite-redeem Edge Function (code redemption for co-parent invites; see handler.ts).
 *
 * Deploy (founder or CI with the approve-migration label; never an agent):
 *   npx supabase functions deploy invite-redeem --use-api
 * Gateway JWT verification stays on (supabase/config.toml entry requested from S02);
 * the handler checks the session itself as well.
 * Secrets: INVITE_CODE_PEPPER (32+ characters, the same pepper the create path uses),
 * RATE_SUBJECT_SECRET (32+ characters), optional KILL_SWITCHES. SUPABASE_URL,
 * SUPABASE_ANON_KEY and SUPABASE_SERVICE_ROLE_KEY are injected by the platform.
 */
import { makeRedeemHandler } from './handler.ts';

Deno.serve(makeRedeemHandler((name) => Deno.env.get(name)));
