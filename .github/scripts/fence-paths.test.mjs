// Tests for the fence path rules. Run: node --test .github/scripts/fence-paths.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { isFenced, fencedPaths, segments, words } from './fence-paths.mjs';

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
  // re-review finding 2: auth words not at the start of the name
  'apps/mobile/src/useAuth.ts',
  'apps/mobile/src/AppleSignIn.tsx',
  'apps/mobile/src/apple-sign-in.ts',
  'apps/mobile/src/accessToken.ts',
  'apps/mobile/src/refresh-token.ts',
  'apps/mobile/src/my-auth.ts',
  'apps/mobile/src/reauth.ts',
  'apps/mobile/src/supabaseClient.ts',
  'apps/mobile/src/lib/jwt.ts',
  'apps/mobile/src/signInWithApple.ts',
  'apps/mobile/src/AuthProvider.tsx',
  'apps/mobile/src/JWTToken2.ts',
  'apps/mobile/src/hooks/use_session.ts',
  'apps/mobile/src/features/account/UserLogin/index.tsx',
  'packages/core/src/csrfToken.test.ts',
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
  // exclusions still hold when the word is not first
  'apps/mobile/src/AuthorBadge.tsx',
  'apps/mobile/src/components/EntryAuthor.tsx',
  'packages/content/src/co-author-note.ts',
  'experiments/textTokenizer.py',
  'experiments/word-tokenise.ts',
  'packages/design-tokens/src/accessToken-colors.ts',
  'docs/adr/useAuth-decision.md',
  // near words that are not auth
  'apps/mobile/src/DesignSystem.tsx',
  'apps/mobile/src/Signal.ts',
  'apps/mobile/src/logging.ts',
  'apps/mobile/src/catalog-in.ts',
  'apps/mobile/src/assignment.ts',
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

test('words split on camelCase, acronyms, digits and punctuation', () => {
  assert.deepEqual(words('AppleSignIn'), ['apple', 'sign', 'in']);
  assert.deepEqual(words('refresh-token'), ['refresh', 'token']);
  assert.deepEqual(words('JWTToken2'), ['jwt', 'token', '2']);
  assert.deepEqual(words('use_session'), ['use', 'session']);
});

test('the CLI prints only fenced paths, from stdin', () => {
  const script = fileURLToPath(new URL('./fence-paths.mjs', import.meta.url));
  const input = [...FENCED, ...NOT_FENCED, ''].join('\n');
  const out = execFileSync(process.execPath, [script], { input, encoding: 'utf8' });
  assert.deepEqual(out.trim().split('\n'), fencedPaths(FENCED.concat(NOT_FENCED)));
  assert.equal(out.trim().split('\n').length, FENCED.length);
});

// The fence step itself (re-review finding 1). Runs the exact `run:` block
// from fence.yml under bash with a stub `gh`, so an API failure or a partial
// file listing must fail the check rather than read as "nothing fenced".
import { readFileSync, writeFileSync, mkdtempSync, chmodSync, rmSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const workflow = readFileSync(new URL('../workflows/fence.yml', import.meta.url), 'utf8');

// Minimal block-scalar reader for this one step; avoids a YAML dependency.
function fenceStep() {
  const lines = workflow.split('\n');
  const from = lines.findIndex((l) => l.includes('- name: Check fenced paths'));
  assert.ok(from >= 0, 'fence step not found');
  const runAt = lines.findIndex((l, i) => i > from && l === '        run: |');
  const body = [];
  for (const l of lines.slice(runAt + 1)) {
    if (l.trim() && !l.startsWith('          ')) break;
    body.push(l.slice(10));
  }
  const shell = lines.slice(from, runAt).some((l) => l.trim() === 'shell: bash');
  const fallback = lines.slice(from, runAt).find((l) => l.trim().startsWith('FALLBACK_FENCE:'));
  return { run: body.join('\n'), shell, fallback: fallback.trim().replace(/^FALLBACK_FENCE: '(.*)'$/, '$1') };
}

const STUB = `#!/usr/bin/env bash
case "$*" in
  *pulls/*/files*)
    [ "$STUB_FILES" = fail ] && { echo 'gh: HTTP 502' >&2; exit 1; }
    cat "$STUB_DIR/files.tsv" ;;
  *contents/*)
    case "$STUB_RULES" in
      ok) cat "$STUB_RULES_SRC" ;;
      404) echo 'gh: Not Found (HTTP 404)' >&2; exit 1 ;;
      *) echo 'gh: Server Error (HTTP 500)' >&2; exit 1 ;;
    esac ;;
  *) exit 2 ;;
esac
`;

function runFence({ files = [], renamedFrom = [], changed, rules = 'ok', listing = 'ok', approved = false }) {
  const dir = mkdtempSync(join(tmpdir(), 'fence-'));
  try {
    writeFileSync(join(dir, 'gh'), STUB);
    chmodSync(join(dir, 'gh'), 0o755);
    const tsv = files.map((f) => `F\t${f}`).concat(renamedFrom.map((f) => `P\t${f}`));
    writeFileSync(join(dir, 'files.tsv'), tsv.length ? `${tsv.join('\n')}\n` : '');
    const { run, fallback } = fenceStep();
    const r = spawnSync('bash', ['--noprofile', '--norc', '-eo', 'pipefail', '-c', run], {
      encoding: 'utf8',
      env: {
        PATH: `${dir}:${process.env.PATH}`,
        RUNNER_TEMP: dir,
        STUB_DIR: dir,
        STUB_FILES: listing,
        STUB_RULES: rules,
        STUB_RULES_SRC: fileURLToPath(new URL('./fence-paths.mjs', import.meta.url)),
        REPO: 'o/r',
        PR: '30',
        BASE_SHA: 'abc123',
        CHANGED: changed === undefined ? String(files.length) : changed,
        APPROVED: String(approved),
        RULES: '.github/scripts/fence-paths.mjs',
        FALLBACK_FENCE: fallback,
      },
    });
    return { status: r.status, out: r.stdout + r.stderr };
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

const CLEAN = ['packages/content/src/strings.en.ts', 'docs/legal/terms.md'];

test('the fence step runs under bash with pipefail', () => {
  assert.equal(fenceStep().shell, true);
  assert.match(fenceStep().run, /^set -euo pipefail$/m);
});

test('fence step: clean pull request passes; fenced one fails unless labelled', () => {
  assert.equal(runFence({ files: CLEAN }).status, 0);
  const r = runFence({ files: [...CLEAN, 'apps/mobile/src/useAuth.ts'] });
  assert.equal(r.status, 1);
  assert.match(r.out, /apps\/mobile\/src\/useAuth.ts/);
  assert.equal(runFence({ files: [...CLEAN, 'apps/mobile/src/useAuth.ts'], approved: true }).status, 0);
});

test('fence step: a rename out of a fenced folder is fenced', () => {
  const r = runFence({ files: ['apps/mobile/src/account.ts'], renamedFrom: ['apps/mobile/src/auth/account.ts'] });
  assert.equal(r.status, 1);
  assert.match(r.out, /src\/auth\/account.ts/);
});

test('fence step fails closed when the file listing fails', () => {
  const r = runFence({ files: CLEAN, listing: 'fail' });
  assert.equal(r.status, 1);
  assert.match(r.out, /Could not list the pull request's files/);
  assert.doesNotMatch(r.out, /No fenced paths touched/);
});

test('fence step fails closed when the listing is empty or short of changed_files', () => {
  assert.match(runFence({ files: [], changed: '3' }).out, /Listed 0 changed files but the pull request reports 3/);
  assert.equal(runFence({ files: [], changed: '3' }).status, 1);
  assert.equal(runFence({ files: CLEAN, changed: '3001' }).status, 1);
  assert.equal(runFence({ files: CLEAN, changed: '' }).status, 1);
  assert.equal(runFence({ files: CLEAN, changed: 'x' }).status, 1);
});

test('fence step fails closed when the rules cannot be fetched (not a 404)', () => {
  const r = runFence({ files: CLEAN, rules: '500' });
  assert.equal(r.status, 1);
  assert.match(r.out, /Could not fetch the fence rules/);
});

test('fence step uses the fallback only on a 404, and it still fences', () => {
  const ok = runFence({ files: CLEAN, rules: '404' });
  assert.equal(ok.status, 0, ok.out);
  assert.match(ok.out, /fence bootstrap/);
  const hit = runFence({ files: [...CLEAN, 'apps/mobile/src/AppleSignIn.tsx'], rules: '404' });
  assert.equal(hit.status, 1);
});

test('the fallback pattern fences a superset of the rules on every fixture', () => {
  const re = new RegExp(fenceStep().fallback, 'i');
  const excluded = /^(docs|packages\/design-tokens)\//;
  const byFallback = (p) => re.test(p) && !excluded.test(p);
  for (const p of FENCED.map((f) => f.replace(/^\.\//, ''))) assert.equal(byFallback(p), true, p);
});
