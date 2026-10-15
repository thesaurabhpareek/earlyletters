/**
 * apple-token Edge Function (BL-330; see handler.ts).
 *
 * Deploy (founder only, after FT-11 secrets; Supabase CLI 2.13.3 or later; --use-api bundles
 * packages/api and packages/brand from outside supabase/):
 *   npx supabase functions deploy apple-token --use-api
 * Gateway JWT verification stays on; the handler also checks the session itself.
 * Secrets: APPLE_TEAM_ID, APPLE_SIGNIN_KEY_ID, APPLE_SIGNIN_PRIVATE_KEY, TOKEN_KEK_V1 (the same
 * values the purge worker reads; docs/ops/AUTH_SETUP.md section 2.4). SUPABASE_URL and
 * SUPABASE_SERVICE_ROLE_KEY are injected.
 */
import { makeAppleTokenHandler } from './handler.ts';

Deno.serve(makeAppleTokenHandler((name) => Deno.env.get(name)));
