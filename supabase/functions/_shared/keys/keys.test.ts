import assert from 'node:assert/strict';
import { isJwtKey, publishableKeyOf, secretKeyOf, serviceHeaders } from './keys.ts';

const env = (vars: Record<string, string>) => (name: string) => vars[name];
const LEGACY = 'eyJhbGciOiJIUzI1NiJ9.eyJyb2xlIjoic2VydmljZV9yb2xlIn0.c2lnbmF0dXJl';
const NEW_SECRET = 'sb_secret_abcdefghijklmnopqrstuv';
const NEW_PUBLISHABLE = 'sb_publishable_abcdefghijklmnop';

Deno.test('[BL-594] the new secret key wins over the legacy one', () => {
  assert.deepEqual(secretKeyOf(env({ SUPABASE_SECRET_KEYS: JSON.stringify({ default: NEW_SECRET }), SUPABASE_SERVICE_ROLE_KEY: LEGACY })), NEW_SECRET);
});

Deno.test('[BL-594] with legacy keys switched off, the new keys alone are enough', () => {
  const e = env({ SUPABASE_SECRET_KEYS: JSON.stringify({ default: NEW_SECRET }), SUPABASE_PUBLISHABLE_KEYS: JSON.stringify({ default: NEW_PUBLISHABLE }) });
  assert.deepEqual(secretKeyOf(e), NEW_SECRET);
  assert.deepEqual(publishableKeyOf(e), NEW_PUBLISHABLE);
});

Deno.test('[BL-594] a project with only legacy keys still works', () => {
  const e = env({ SUPABASE_SERVICE_ROLE_KEY: LEGACY, SUPABASE_ANON_KEY: 'anon.jwt.key' });
  assert.deepEqual(secretKeyOf(e), LEGACY);
  assert.deepEqual(publishableKeyOf(e), 'anon.jwt.key');
});

Deno.test('[BL-594] a malformed or empty dictionary falls back, and nothing at all is null', () => {
  assert.deepEqual(secretKeyOf(env({ SUPABASE_SECRET_KEYS: 'not json', SUPABASE_SERVICE_ROLE_KEY: LEGACY })), LEGACY);
  assert.deepEqual(secretKeyOf(env({ SUPABASE_SECRET_KEYS: JSON.stringify({ other: NEW_SECRET }) })), null);
  assert.deepEqual(secretKeyOf(env({ SUPABASE_SECRET_KEYS: '[]' })), null);
  assert.deepEqual(publishableKeyOf(env({})), null);
});

Deno.test('[BL-594] a new key never goes as a bearer token; a legacy key keeps both headers', () => {
  assert.deepEqual(isJwtKey(LEGACY), true);
  assert.deepEqual(isJwtKey(NEW_SECRET), false);
  assert.deepEqual(serviceHeaders(NEW_SECRET), { apikey: NEW_SECRET });
  assert.deepEqual(serviceHeaders(LEGACY), { apikey: LEGACY, Authorization: `Bearer ${LEGACY}` });
});
