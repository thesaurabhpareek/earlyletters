/**
 * purge-worker Edge Function. Scheduled by pg_cron plus pg_net
 * (supabase/cron/purge-worker.sql): every 15 minutes with {"task":"run"} and
 * once a day with {"task":"daily"}.
 *
 * Deploy (Supabase CLI 2.13.3 or later; --use-api lets the bundle import
 * packages/brand, packages/content and packages/api from outside supabase/):
 *   npx supabase functions deploy purge-worker --no-verify-jwt --use-api
 * Secrets: docs/ops/SECURITY.md. Runbooks: docs/ops/runbooks.
 */
import { makeHandler } from './handler.ts';

declare const EdgeRuntime: { waitUntil(p: Promise<unknown>): void } | undefined;

const runInBackground = typeof EdgeRuntime !== 'undefined' && EdgeRuntime
  ? (p: Promise<unknown>) => EdgeRuntime!.waitUntil(p)
  : undefined;

Deno.serve(makeHandler((name) => Deno.env.get(name), { runInBackground }));
