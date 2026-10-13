/**
 * apple-token Edge Function (security review H3, gap G-03; see handler.ts).
 *
 * Deploy (Supabase CLI 2.13.3 or later; --use-api bundles packages/api and
 * packages/brand from outside supabase/):
 *   npx supabase functions deploy apple-token --use-api
 * Gateway JWT verification stays on; the handler also checks the session itself.
 * Secrets (docs/ops/AUTH_SETUP.md 2.7): APPLE_TEAM_ID, APPLE_SIGNIN_KEY_ID,
 * APPLE_SIGNIN_PRIVATE_KEY, TOKEN_KEK_V<n>, optional APPLE_SERVICES_ID and
 * APPLE_EXTRA_CLIENT_IDS. SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are injected.
 */
import { makeAppleTokenHandler } from './handler.ts';

Deno.serve(makeAppleTokenHandler((name) => Deno.env.get(name)));
