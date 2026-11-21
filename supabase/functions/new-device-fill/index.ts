/**
 * new-device-fill: the app's optional second call after sign-in. It fills the device class and the device hash on the pending
 * new-device row (NDS-2, NDR-1), so the sender can tell a known device from a new one. DARK until NEW_DEVICE_EMAIL is "on".
 * Deploy (founder only): npx supabase functions deploy new-device-fill --use-api
 * The gateway's JWT check stays ON. Secrets the founder sets: DEVICE_HASH_KEY (the same one as new-device-email); flag NEW_DEVICE_EMAIL=on.
 */
import { makeHandler } from './handler.ts';

Deno.serve(makeHandler((name) => Deno.env.get(name)));
