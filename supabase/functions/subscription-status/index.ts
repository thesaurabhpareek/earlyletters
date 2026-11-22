/**
 * subscription-status Edge Function (D-080 status report, D-081 consent record; see handler.ts).
 *
 * Deploy: deploy-functions.yml deploys it to staging with every function once
 * develop changes (after approval in the staging environment; never an agent),
 * or the founder runs:
 *   npx supabase functions deploy subscription-status --use-api
 * Until S06's WP-F14-15b migration is applied it answers 503 (retryable) and the
 * phone keeps the report; no build sends one yet (EXPO_PUBLIC_STATUS_REPORT is off).
 * Gateway JWT verification stays on: never --no-verify-jwt (NO_VERIFY_JWT in
 * .github/scripts/functions-deploy.mjs leaves it out). No anonymous health route,
 * so a deploy is confirmed in the function list, not by the smoke.
 * Secrets: optional KILL_SWITCHES. SUPABASE_URL and SUPABASE_ANON_KEY are injected.
 * No service key is used.
 */
import { makeStatusHandler } from './handler.ts';

Deno.serve(makeStatusHandler((name) => Deno.env.get(name)));
