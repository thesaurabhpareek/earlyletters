/**
 * new-device-email: sends the "new sign-in" email (NS-08-R21, E83). DARK until NEW_DEVICE_EMAIL is "on" (words PROPOSED).
 * Deploy (founder only): npx supabase functions deploy new-device-email --no-verify-jwt --use-api
 * Secrets the founder sets: NEW_DEVICE_SENDER_SECRET, DEVICE_HASH_KEY (32+ chars; DEVICE_HASH_KEY_NEXT only during a rotation), RESEND_API_KEY; flag NEW_DEVICE_EMAIL=on.
 */
import { makeHandler } from './handler.ts';

Deno.serve(makeHandler((name) => Deno.env.get(name)));
