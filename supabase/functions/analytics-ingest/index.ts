/**
 * analytics-ingest Edge Function (first-party analytics sink; see handler.ts).
 *
 * Deploy only after the founder's reversal of D-124 item 3 and approval of migration 20261108000000:
 *   npx supabase functions deploy analytics-ingest --use-api --no-verify-jwt
 * The route is anonymous on purpose: the phone sends a random analytics id and no account token, so
 * nothing here can be joined to a person. SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are injected.
 */
import { makeIngestHandler } from './handler.ts';

Deno.serve(makeIngestHandler((name) => Deno.env.get(name)));
