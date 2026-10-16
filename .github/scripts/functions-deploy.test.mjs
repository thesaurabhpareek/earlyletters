// Tests for the Edge Functions deploy plan and confirmation (deploy-functions.yml).
// Run: node --test .github/scripts/functions-deploy.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { closure, confirm, functionFolders, headerDeploy, NEVER, NO_VERIFY_JWT, parseList, plan, SMOKE_HEALTH, specifiers } from './functions-deploy.mjs';

const REPO = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const SCRIPT = join(REPO, '.github', 'scripts', 'functions-deploy.mjs');

/** A small repository: two public functions, one behind the gateway check, escrow, _shared and packages. */
function fixture(extra = {}) {
  const root = mkdtempSync(join(tmpdir(), 'fn-deploy-'));
  const files = {
    'packages/api/src/envelope.ts': 'export const ok = 1;\n',
    'packages/api/src/unused.ts': 'export const unused = 1;\n',
    'packages/brand/index.ts': "export const brand = { name: 'x' };\n",
    'supabase/functions/_shared/log/log.ts': "import { ok } from '../../../../packages/api/src/envelope.ts';\nexport const log = ok;\n",
    'supabase/functions/config/index.ts': [
      '/**',
      ' *   npx supabase functions deploy config --no-verify-jwt --use-api',
      ' */',
      "import { handler } from './handler.ts';",
      "import 'npm:valibot@1.5.0';",
      'export default handler;',
      '',
    ].join('\n'),
    'supabase/functions/config/handler.ts': "import { log } from '../_shared/log/log.ts';\nexport { serve } from './serve';\nexport const handler = log;\n",
    'supabase/functions/config/serve.ts': 'export const serve = 1;\n',
    'supabase/functions/config/handler.test.ts': "import { handler } from './handler.ts';\n",
    'supabase/functions/config/deno.json': '{ "imports": { "valibot": "npm:valibot@1.5.0" } }\n',
    'supabase/functions/purge-worker/index.ts': [
      '/**',
      ' *   npx supabase functions deploy purge-worker --no-verify-jwt --use-api',
      ' */',
      "import { brand } from '@scribe/brand';",
      "const lazy = () => import('./lazy.ts');",
      'export default [brand, lazy];',
      '',
    ].join('\n'),
    'supabase/functions/purge-worker/lazy.ts': 'export const lazy = 1;\n',
    'supabase/functions/purge-worker/deno.json': '{ "imports": { "@scribe/brand": "../../../packages/brand/index.ts" } }\n',
    'supabase/functions/content/index.ts': ' *   npx supabase functions deploy content --no-verify-jwt --use-api\nexport default 1;\n',
    'supabase/functions/analytics-forget/index.ts': " *   npx supabase functions deploy analytics-forget --use-api\nimport { log } from '../_shared/log/log.ts';\nexport default log;\n",
    'supabase/functions/escrow/index.ts': ' *   npx supabase functions deploy escrow --project-ref <ref> --no-verify-jwt\nexport default 1;\n',
    'supabase/functions/README.md': 'not a function\n',
    ...extra,
  };
  for (const [path, body] of Object.entries(files)) {
    if (body === null) continue;
    mkdirSync(dirname(join(root, path)), { recursive: true });
    writeFileSync(join(root, path), body);
  }
  return root;
}

const withFixture = (extra, fn) => {
  const root = fixture(extra);
  try {
    return fn(root);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
};

test('function folders: folders with an index.ts, not _shared, not files', () =>
  withFixture({}, (root) => {
    assert.deepEqual(functionFolders(root), ['analytics-forget', 'config', 'content', 'escrow', 'purge-worker']);
  }));

test('specifiers: static, side-effect, dynamic, re-export and type imports', () => {
  const src = "import a from './a.ts';\nimport type { B } from \"../b.ts\";\nimport './c.ts';\nexport { d } from './d';\nconst e = await import('./e.ts');\n";
  assert.deepEqual(specifiers(src).sort(), ['../b.ts', './a.ts', './c.ts', './d', './e.ts']);
});

test('closure: follows relative imports, sloppy imports, deno.json entries and _shared into packages; leaves out npm: and tests', () =>
  withFixture({}, (root) => {
    assert.deepEqual(closure(root, 'config'), [
      'packages/api/src/envelope.ts',
      'supabase/functions/_shared/log/log.ts',
      'supabase/functions/config/deno.json',
      'supabase/functions/config/handler.ts',
      'supabase/functions/config/index.ts',
      'supabase/functions/config/serve.ts',
    ]);
    assert.deepEqual(closure(root, 'purge-worker'), [
      'packages/brand/index.ts',
      'supabase/functions/purge-worker/deno.json',
      'supabase/functions/purge-worker/index.ts',
      'supabase/functions/purge-worker/lazy.ts',
    ]);
  }));

test('a push that changes one function deploys every function except escrow, and names the changed one', () =>
  withFixture({}, (root) => {
    const r = plan(root, { changed: ['supabase/functions/config/serve.ts'] });
    assert.deepEqual(r.errors, []);
    assert.deepEqual(r.changed, ['config']);
    assert.deepEqual(r.deploy, ['analytics-forget', 'config', 'content', 'purge-worker']);
    assert.deepEqual(r.noVerifyJwt, ['config', 'content', 'purge-worker']);
    assert.deepEqual(r.smoke, ['config', 'content', 'purge-worker']);
  }));

test('a change in packages that a function imports deploys; one it does not import does not', () =>
  withFixture({}, (root) => {
    assert.deepEqual(plan(root, { changed: ['packages/api/src/envelope.ts'] }).changed, ['analytics-forget', 'config']);
    assert.deepEqual(plan(root, { changed: ['packages/brand/index.ts'] }).changed, ['purge-worker']);
    const none = plan(root, { changed: ['packages/api/src/unused.ts', 'packages/core/src/x.ts'] });
    assert.deepEqual(none.deploy, []);
    assert.deepEqual(none.changed, []);
  }));

test('a test file or README next to a function does not deploy it', () =>
  withFixture({}, (root) => {
    assert.deepEqual(plan(root, { changed: ['supabase/functions/config/handler.test.ts', 'supabase/functions/README.md'] }).deploy, []);
  }));

test('planted failure 2: a change under supabase/functions/escrow/ is not deployed, and says why', () =>
  withFixture({}, (root) => {
    const r = plan(root, { changed: ['supabase/functions/escrow/index.ts'] });
    assert.deepEqual(r.deploy, []);
    assert.equal(r.errors.length, 0);
    assert.match(r.notes.join('\n'), /escrow changed and is not deployed: escrow lives in its own project/);
    const all = plan(root, { changed: ['supabase/functions/escrow/index.ts', 'supabase/functions/content/index.ts'] });
    assert.ok(!all.deploy.includes('escrow'));
    assert.ok(!plan(root, { only: 'all' }).deploy.includes('escrow'));
    assert.ok('escrow' in NEVER);
  }));

test('a manual run deploys the named function, or all; escrow and unknown names are refused', () =>
  withFixture({}, (root) => {
    assert.deepEqual(plan(root, { only: 'content' }).deploy, ['content']);
    assert.deepEqual(plan(root, { only: 'all' }).deploy, ['analytics-forget', 'config', 'content', 'purge-worker']);
    const escrow = plan(root, { only: 'escrow' });
    assert.deepEqual(escrow.deploy, []);
    assert.match(escrow.errors[0], /escrow: not deployed here/);
    assert.match(plan(root, { only: 'nope' }).errors[0], /no such function folder/);
    assert.match(plan(root, { only: '../config' }).errors[0], /no such function folder/);
  }));

test('a header that disagrees with NO_VERIFY_JWT stops the whole plan', () =>
  withFixture({ 'supabase/functions/content/index.ts': ' *   npx supabase functions deploy content --use-api\nexport default 1;\n' }, (root) => {
    const r = plan(root, { only: 'all' });
    assert.deepEqual(r.deploy, []);
    assert.match(r.errors.join('\n'), /content: its index\.ts deploys it without --no-verify-jwt but NO_VERIFY_JWT .* says with/);
  }));

test('a function with no deploy line in its header keeps the gateway check, with a warning', () =>
  withFixture({ 'supabase/functions/apple-token/index.ts': 'export default 1;\n' }, (root) => {
    const r = plan(root, { only: 'all' });
    assert.ok(r.deploy.includes('apple-token'));
    assert.ok(!r.noVerifyJwt.includes('apple-token'));
    assert.ok(!r.smoke.includes('apple-token'));
    assert.match(r.warnings.join('\n'), /apple-token: index\.ts has no "supabase functions deploy apple-token" line/);
  }));

test('an import outside the watched paths is a warning', () =>
  withFixture(
    {
      'scripts/shared.ts': 'export const s = 1;\n',
      'supabase/functions/content/index.ts': " *   npx supabase functions deploy content --no-verify-jwt --use-api\nimport { s } from '../../../scripts/shared.ts';\nexport default s;\n",
    },
    (root) => {
      assert.match(plan(root, { only: 'content' }).warnings.join('\n'), /content imports scripts\/shared\.ts, which the push paths/);
    },
  ));

test('a change to the deploy rules redeploys every function; an unknown previous commit does too', () =>
  withFixture({}, (root) => {
    const r = plan(root, { changed: ['.github/workflows/deploy-functions.yml'] });
    assert.deepEqual(r.deploy, ['analytics-forget', 'config', 'content', 'purge-worker']);
    assert.deepEqual(r.changed, []);
    assert.deepEqual(plan(root, { changed: null }).deploy, ['analytics-forget', 'config', 'content', 'purge-worker']);
  }));

test('a function removed from the repository is noted, never pruned', () =>
  withFixture({}, (root) => {
    const r = plan(root, { changed: ['supabase/functions/old-thing/index.ts'] });
    assert.deepEqual(r.deploy, []);
    assert.match(r.notes.join('\n'), /old-thing is no longer in the repository; staging keeps it/);
  }));

test('every SMOKE_HEALTH function is deployed with --no-verify-jwt', () => {
  for (const n of SMOKE_HEALTH) assert.ok(NO_VERIFY_JWT.includes(n), n);
});

test('this repository: the plan has no errors, and NO_VERIFY_JWT matches every function header', () => {
  const r = plan(REPO, { only: 'all' });
  assert.deepEqual(r.errors, []);
  assert.ok(r.deploy.length > 0);
  for (const n of r.deploy) {
    const h = headerDeploy(REPO, n);
    if (h) assert.equal(h.noVerifyJwt, NO_VERIFY_JWT.includes(n), n);
  }
});

const fn = (slug, version, updated, verifyJwt, status = 'ACTIVE') => ({ id: 'x', slug, name: slug, status, version, created_at: 1, updated_at: updated, verify_jwt: verifyJwt });
const asList = (...fns) => parseList(JSON.stringify(fns));

test('confirm: ACTIVE, a new version and the expected gateway setting pass', () => {
  const r = confirm({
    before: asList(fn('config', 3, 100, false)),
    after: asList(fn('config', 4, 200, false), fn('analytics-forget', 1, 200, true)),
    deployed: ['config', 'analytics-forget'],
  });
  assert.equal(r.ok, true);
  assert.match(r.markdown, /all 2 confirmed/);
  assert.match(r.markdown, /\| config \| 3 to 4 \| off \| PASS/);
  assert.match(r.markdown, /\| analytics-forget \| new, 1 \| on \| PASS/);
});

test('confirm: an unchanged version, a wrong gateway setting, a missing function, a bad status and a failed command each fail', () => {
  const r = confirm({
    before: asList(fn('config', 3, 100, false), fn('content', 2, 100, false), fn('purge-worker', 5, 100, false)),
    after: asList(fn('config', 3, 100, false), fn('content', 3, 200, true), fn('purge-worker', 6, 200, false, 'THROTTLED')),
    deployed: ['config', 'content', 'purge-worker', 'analytics-forget'],
    failed: ['apple-token'],
  });
  assert.equal(r.ok, false);
  assert.match(r.markdown, /RED, 5 of 5 not confirmed/);
  assert.match(r.markdown, /config .*same version and update time/);
  assert.match(r.markdown, /content .*gateway JWT check is on, expected off/);
  assert.match(r.markdown, /purge-worker .*status is THROTTLED/);
  assert.match(r.markdown, /analytics-forget .*not in the function list/);
  assert.match(r.markdown, /apple-token .*the deploy command failed/);
});

test('confirm: prints closed values only (no ids, paths or odd strings)', () => {
  const r = confirm({
    before: asList(),
    after: parseList(JSON.stringify([{ ...fn('config', 1, 1, false, 'https://example.invalid/x'), entrypoint_path: 'file:///secret/path' }])),
    deployed: ['config'],
  });
  assert.doesNotMatch(r.markdown, /example\.invalid|secret\/path|"id"/);
  assert.match(r.markdown, /status is an unexpected status/);
});

test('parseList: null means no functions; anything but an array of slugs is refused', () => {
  assert.equal(parseList('null').size, 0);
  assert.equal(parseList('{"functions":[]}'), null);
  assert.equal(parseList('[{"name":"x"}]'), null);
  assert.equal(parseList('Fetching functions...'), null);
});

test('CLI: plan prints JSON and exits 1 on an error; confirm exits 1 when red', () =>
  withFixture({}, (root) => {
    const ok = JSON.parse(execFileSync('node', [SCRIPT, 'plan', '--only', 'all', '--root', root], { encoding: 'utf8' }));
    assert.deepEqual(ok.deploy, ['analytics-forget', 'config', 'content', 'purge-worker']);
    const bad = spawnSync('node', [SCRIPT, 'plan', '--only', 'escrow', '--root', root], { encoding: 'utf8' });
    assert.equal(bad.status, 1);
    assert.match(JSON.parse(bad.stdout).errors[0], /escrow/);
    const changed = join(root, 'changed.txt');
    writeFileSync(changed, 'supabase/functions/config/serve.ts\n');
    assert.deepEqual(JSON.parse(execFileSync('node', [SCRIPT, 'plan', '--changed', changed, '--root', root], { encoding: 'utf8' })).changed, ['config']);
    writeFileSync(join(root, 'b.json'), JSON.stringify([fn('config', 1, 1, false)]));
    writeFileSync(join(root, 'a.json'), JSON.stringify([fn('config', 1, 1, false)]));
    const red = spawnSync('node', [SCRIPT, 'confirm', '--before', join(root, 'b.json'), '--after', join(root, 'a.json'), '--deployed', 'config'], { encoding: 'utf8' });
    assert.equal(red.status, 1);
    assert.match(red.stdout, /RED, 1 of 1/);
    assert.equal(spawnSync('node', [SCRIPT, 'nonsense'], { encoding: 'utf8' }).status, 2);
  }));
