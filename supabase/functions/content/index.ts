/**
 * `content` Edge Function: signed content bundles (prompts, tips, onboarding
 * story cards, announcements) for the app's native renderers (ADR 0016).
 *
 * Publish (founder, manual; ADR 0016 "Publishing"):
 *   node scripts/packs/publish.mjs content       # builds from packages/content, signs, writes published.ts
 *   npx supabase functions deploy content --no-verify-jwt --use-api
 */
import { makeContentHandler } from './handler.ts';
import { CONTENT_BUNDLES } from './published.ts';

Deno.serve(makeContentHandler(CONTENT_BUNDLES));
