/**
 * analytics-forget Edge Function (stateless PostHog person deletion; see handler.ts).
 *
 * Deploy (Supabase CLI 2.13.3 or later; --use-api bundles packages/api from outside supabase/):
 *   npx supabase functions deploy analytics-forget --use-api
 * Gateway JWT verification stays on; the handler also checks the session itself.
 * Secrets: POSTHOG_PERSONAL_API_KEY, POSTHOG_PROJECT_ID, optional POSTHOG_HOST
 * (docs/ops/SECURITY.md). SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are injected.
 */
import { makeForgetHandler } from './handler.ts';

Deno.serve(makeForgetHandler((name) => Deno.env.get(name)));
