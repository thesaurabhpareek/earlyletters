/**
 * apple-token Edge Function (BL-330, security review H3; see handler.ts).
 *
 * Deploy (Supabase CLI 2.13.3 or later; --use-api bundles packages/api and
 * packages/brand from outside supabase/):
 *   npx supabase functions deploy apple-token --use-api
 * Gateway JWT verification stays on; the handler also checks the session itself.
 * Never deploy it with --no-verify-jwt: the function is only ever called with a
 * user's session, and the gateway check keeps anonymous traffic away from the
 * Apple key and TOKEN_KEK. The health route sits behind it too (PR #139).
 * Secrets (docs/ops/AUTH_SETUP.md 2.7): APPLE_TEAM_ID, APPLE_SIGNIN_KEY_ID,
 * APPLE_SIGNIN_PRIVATE_KEY, TOKEN_KEK_V<n>, optional APPLE_SERVICES_ID.
 * SUPABASE_URL, SUPABASE_ANON_KEY and SUPABASE_SERVICE_ROLE_KEY are injected.
 * Needs migration 20261004200000 (ops.apple_tokens, ops_apple_token_put) applied.
 */
import { makeAppleTokenHandler } from './handler.ts';

Deno.serve(makeAppleTokenHandler((name) => Deno.env.get(name)));
