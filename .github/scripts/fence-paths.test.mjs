// Tests for the fence path rules. Run: node --test .github/scripts/fence-paths.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { isFenced, fencedPaths, segments } from './fence-paths.mjs';

const FENCED = [
  // database and CI
  'supabase/migrations/20261001000000_scribe_hardening.sql',
  'supabase/tests/rls.test.sql',
  '.github/workflows/fence.yml',
  '.github/scripts/fence-paths.mjs',
  // caught before this change
  'apps/mobile/src/auth.ts',
  'apps/mobile/src/auth/login.ts',
  'packages/core/src/session.ts',
  'apps/mobile/app/sign-in.tsx',
  'apps/mobile/app/signin.tsx',
  // the review's near misses (finding 2)
  'apps/mobile/src/features/authentication/useLogin.ts',
  'apps/mobile/src/authState.ts',
  'apps/mobile/src/login.ts',
  'packages/api/src/token.ts',
  'auth/index.ts',
  'services/auth/handler.ts',
  // other auth names and places
  'apps/mobile/app/(auth)/welcome.tsx',
  'apps/mobile/app/[session]/index.tsx',
  'apps/mobile/app/_login.tsx',
  'apps/mobile/src/Session/Provider.tsx',
  'apps/mobile/src/SignIn.tsx',
  'apps/mobile/src/sign_up.tsx',
  'apps/mobile/src/logout.ts',
  'apps/mobile/src/passkeys/register.ts',
  'packages/core/src/tokenStore.ts',
  'packages/core/src/credentials.ts',
  'packages/core/src/oauth/apple.ts',
  'packages/core/src/authorization.ts',
  'packages/core/src/Authoriser.ts',
  'scripts/auth.test.ts',
  'supabase/functions/session-refresh/index.ts',
  './apps/mobile/src/auth.ts',
];

const NOT_FENCED = [
  'packages/content/src/strings.en.ts',
  'docs/legal/terms.md',
  'docs/adr/0007-auth-provider.md',
  'docs/auth/flows.md',
  'packages/design-tokens/src/tokens.ts',
  'packages/design-tokens/dist/tokens.native.css',
  'packages/design-tokens/test/tokens.test.ts',
  'apps/mobile/src/authorName.ts',
  'packages/content/src/authors.ts',
  'experiments/tokenizer.py',
  'packages/core/src/verify.ts',
  'apps/mobile/src/features/capture/Recorder.tsx',
  'README.md',
  'package.json',
  'apps/mobile/src/history.ts',
  'apps/mobile/src/blogin.ts',
];

test('every fenced fixture is fenced', () => {
  for (const p of FENCED) assert.equal(isFenced(p), true, p);
});

test('every non-fenced fixture passes', () => {
  for (const p of NOT_FENCED) assert.equal(isFenced(p), false, p);
});

test('segments are folders plus the stem before the first dot', () => {
  assert.deepEqual(segments('apps/mobile/src/authState.test.ts'), ['apps', 'mobile', 'src', 'authState']);
  assert.deepEqual(segments('a/.env.local'), ['a', 'env']);
  assert.deepEqual(segments(''), []);
  assert.deepEqual(segments('app/(auth)/[token].tsx'), ['app', 'auth', 'token']);
});

test('the CLI prints only fenced paths, from stdin', () => {
  const script = fileURLToPath(new URL('./fence-paths.mjs', import.meta.url));
  const input = [...FENCED, ...NOT_FENCED, ''].join('\n');
  const out = execFileSync(process.execPath, [script], { input, encoding: 'utf8' });
  assert.deepEqual(out.trim().split('\n'), fencedPaths(FENCED.concat(NOT_FENCED)));
  assert.equal(out.trim().split('\n').length, FENCED.length);
});
