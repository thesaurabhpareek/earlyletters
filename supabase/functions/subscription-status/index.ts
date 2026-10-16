/**
 * subscription-status Edge Function (D-080 status report, D-081 consent record; see handler.ts).
 *
 * Deploy (founder or CI with the approve-migration label; never an agent), after S06's
 * WP-F14-15b migration is applied:
 *   npx supabase functions deploy subscription-status --use-api
 * Gateway JWT verification stays on (supabase/config.toml entry requested from S02).
 * Secrets: optional KILL_SWITCHES. SUPABASE_URL and SUPABASE_ANON_KEY are injected.
 * No service key is used.
 */
import { makeStatusHandler } from './handler.ts';

Deno.serve(makeStatusHandler((name) => Deno.env.get(name)));
