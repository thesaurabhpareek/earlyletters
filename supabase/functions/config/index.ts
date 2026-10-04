/**
 * `config` Edge Function: signed remote config and pack manifest (ADR 0016).
 *
 * Publish (founder, manual; ADR 0016 "Publishing"):
 *   node scripts/packs/publish.mjs config        # signs, writes published.ts
 *   npx supabase functions deploy config --no-verify-jwt --use-api
 * --no-verify-jwt: these documents are public and must work before sign-in;
 * they hold no user data. --use-api: the bundle imports two dependency-free
 * modules from packages/api (standards.ts, envelope.ts).
 */
import { makeConfigHandler } from './handler.ts';
import { PACK_MANIFEST, REMOTE_CONFIG } from './published.ts';

Deno.serve(makeConfigHandler({ remoteConfig: REMOTE_CONFIG, packManifest: PACK_MANIFEST }));
