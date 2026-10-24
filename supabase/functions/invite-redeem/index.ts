/**
 * invite-redeem Edge Function (code redemption for co-parent invites; see handler.ts).
 *
 * Deploy: deploy-functions.yml deploys it to staging with every function once
 * develop changes (after approval in the staging environment; never an agent),
 * or the founder runs:
 *   npx supabase functions deploy invite-redeem --use-api
 * Gateway JWT verification stays on: never --no-verify-jwt (NO_VERIFY_JWT in
 * .github/scripts/functions-deploy.mjs leaves it out, and the plan fails when
 * the two disagree). The handler checks the session itself as well. There is
 * no anonymous health route, so a deploy is confirmed in the function list,
 * not by the smoke. Until S02's invite_redeem_by_code exists, or without the
 * two secrets below, every redeem answers 503 (retryable); links keep working.
 * Secrets: INVITE_CODE_PEPPER (32+ characters, the same pepper the create path uses),
 * RATE_SUBJECT_SECRET (32+ characters), optional KILL_SWITCHES. SUPABASE_URL,
 * SUPABASE_ANON_KEY and SUPABASE_SERVICE_ROLE_KEY are injected by the platform.
 */
import { makeRedeemHandler } from './handler.ts';

Deno.serve(makeRedeemHandler((name) => Deno.env.get(name)));
