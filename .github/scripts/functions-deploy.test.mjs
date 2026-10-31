// Tests for the Edge Functions deploy plan and confirmation (deploy-functions.yml).
// Run: node --test .github/scripts/functions-deploy.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { closure, confirm, functionFolders, headerDeploy, localMigrations, migrationsCheck, NEVER, NO_VERIFY_JWT, parseList, pendingMigrations, pgEnv, plan, psqlRead, SMOKE_HEALTH, specifiers, STOPPED_LINE } from './functions-deploy.mjs';

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

test('this repository: every function that takes a person\'s session keeps the gateway JWT check and is confirmed through the function list', () => {
  const r = plan(REPO, { only: 'all' });
  assert.deepEqual(r.warnings, [], 'every function names its own deploy line');
  // The exact sets (review B N6 on #138): a function added, or added with --no-verify-jwt in both its header
  // and NO_VERIFY_JWT, or given an anonymous smoke, must change this test too, never only those places.
  const PUBLIC = ['config', 'content', 'purge-worker'];
  assert.deepEqual(NO_VERIFY_JWT, PUBLIC);
  assert.deepEqual([...r.noVerifyJwt].sort(), PUBLIC);
  assert.deepEqual(SMOKE_HEALTH, PUBLIC);
  assert.deepEqual([...r.smoke].sort(), PUBLIC);
  // And the deploy list itself (review B note 1 on #253): a new function fails here until it is named.
  assert.deepEqual([...r.deploy].sort(), ['analytics-forget', 'apple-token', 'config', 'content', 'invite-redeem', 'purge-worker', 'subscription-status']);
  const session = r.deploy.filter((n) => !PUBLIC.includes(n));
  for (const n of ['analytics-forget', 'apple-token', 'invite-redeem', 'subscription-status', ...session]) {
    assert.ok(r.deploy.includes(n), `${n} is deployed`);
    assert.ok(!r.noVerifyJwt.includes(n), `${n} keeps the gateway JWT check`);
    assert.ok(!r.smoke.includes(n), `${n} has no anonymous health route, so the smoke never calls it`);
    assert.equal(headerDeploy(REPO, n)?.noVerifyJwt, false, `${n}: its index.ts deploy line has no --no-verify-jwt`);
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
  assert.match(r.markdown, /config .*still version 3, the same as before the deploy/);
  assert.match(r.markdown, /content .*gateway JWT check is on, expected off/);
  assert.match(r.markdown, /purge-worker .*status is THROTTLED/);
  assert.match(r.markdown, /analytics-forget .*not in the function list/);
  assert.match(r.markdown, /apple-token .*the deploy command failed/);
});

test('confirm: a list that does not report verify_jwt fails the posture check, for either expected setting', () => {
  const noJwt = (slug) => {
    const f = fn(slug, 2, 200, false);
    delete f.verify_jwt;
    return f;
  };
  const r = confirm({
    before: asList(fn('config', 1, 100, false), fn('analytics-forget', 1, 100, true)),
    after: asList(noJwt('config'), { ...noJwt('analytics-forget'), verify_jwt: null }),
    deployed: ['config', 'analytics-forget'],
  });
  assert.equal(r.ok, false);
  assert.match(r.markdown, /RED, 2 of 2 not confirmed/);
  assert.match(r.markdown, /\| config \| 1 to 2 \| not reported \| FAIL: the function list does not report verify_jwt, so the gateway JWT check \(expected off\) is unconfirmed/);
  assert.match(r.markdown, /analytics-forget .*expected on\) is unconfirmed/);
});

test('confirm: only a higher version counts as this deploy; a later updated_at on the same version, or a non-numeric version, fails', () => {
  const r = confirm({
    before: asList(fn('config', 4, 100, false), fn('content', 2, 100, false), fn('purge-worker', 1, 100, false)),
    after: asList(fn('config', 4, 999, false), { ...fn('content', 3, 200, false), version: '3' }, fn('purge-worker', 2, 50, false)),
    deployed: ['config', 'content', 'purge-worker'],
  });
  assert.equal(r.ok, false);
  assert.match(r.markdown, /\| config \| .*FAIL: still version 4, the same as before the deploy/);
  assert.match(r.markdown, /\| content \| .*FAIL: the function list does not give a numeric version/);
  assert.match(r.markdown, /\| purge-worker \| 1 to 2 \| off \| PASS/);
  const lower = confirm({ before: asList(fn('config', 5, 100, false)), after: asList(fn('config', 3, 200, false)), deployed: ['config'] });
  assert.match(lower.markdown, /FAIL: version 3, lower than 5 before the deploy/);
});

test('specifiers: a comment with a quote inside an import clause, and a template-literal dynamic import, are both found', () => {
  const src = [
    'import {',
    '  a, // the "a" helper',
    "  b, /* it's b */",
    "} from './ab.ts';",
    'const lazy = () => import(`./lazy.ts`);',
    "const url = 'https://example.invalid/x'; // a URL in a string is not a comment",
    "import { c } from './c.ts';",
  ].join('\n');
  const found = specifiers(src);
  for (const s of ['./ab.ts', './lazy.ts', './c.ts']) assert.ok(found.includes(s), s);
});

test('closure equals deno info for every function folder (CI sets DENO_INFO_CHECK=1)', { skip: process.env.DENO_INFO_CHECK !== '1' && 'set DENO_INFO_CHECK=1 to compare with deno info' }, () => {
  for (const name of functionFolders(REPO)) {
    const dir = join(REPO, 'supabase', 'functions', name);
    const args = ['-y', 'deno@2.9.6', 'info', '--json', '--no-lock'];
    if (existsSync(join(dir, 'deno.json'))) args.push('--config', join(dir, 'deno.json'));
    const out = execFileSync('npx', [...args, join(dir, 'index.ts')], { cwd: REPO, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
    const prefix = `file://${REPO}/`;
    const deno = JSON.parse(out).modules.map((m) => m.specifier).filter((s) => s.startsWith(prefix)).map((s) => decodeURIComponent(s.slice(prefix.length))).sort();
    const mine = closure(REPO, name).filter((f) => !f.endsWith('/deno.json'));
    assert.deepEqual(mine, deno, `${name}: the plan's closure and deno info disagree`);
  }
});

test('deploy-functions.yml: the Deploy step refuses an escrow name itself, before any deploy (second guard after the plan)', () => {
  const yml = readFileSync(join(REPO, '.github', 'workflows', 'deploy-functions.yml'), 'utf8');
  const step = yml.slice(yml.indexOf('- name: Deploy\n'), yml.indexOf('- name: Confirm in the function list'));
  const guardAt = step.indexOf('escrow|escrow-*|escrow_*');
  assert.ok(guardAt > 0, 'the Deploy step has its own escrow guard');
  assert.ok(guardAt < step.indexOf('supabase functions deploy'), 'the guard runs before the first deploy');
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

test('migrations: local versions in file order, and the files staging lacks', () =>
  withFixture(
    {
      'supabase/migrations/20261002000000_b.sql': 'select 1;\n',
      'supabase/migrations/20261001000000_a.sql': 'select 1;\n',
      'supabase/migrations/README.md': 'not a migration\n',
    },
    (root) => {
      const local = localMigrations(root);
      assert.deepEqual(local.map((m) => m.file), ['20261001000000_a.sql', '20261002000000_b.sql']);
      assert.deepEqual(pendingMigrations(local, ['20261001000000']), ['20261002000000_b.sql']);
      assert.deepEqual(pendingMigrations(local, ['20261001000000', '20261002000000', '20990101000000']), []);
    },
  ));

test('pgEnv: the pooler URL becomes PG* variables (password decoded, sslmode require by default)', () => {
  assert.deepEqual(pgEnv('postgresql://postgres.abcdefghijklmnopqrst:p%40ss%2Fw@aws-0-us-west-1.pooler.supabase.com:5432/postgres'), {
    env: {
      PGHOST: 'aws-0-us-west-1.pooler.supabase.com',
      PGPORT: '5432',
      PGUSER: 'postgres.abcdefghijklmnopqrst',
      PGPASSWORD: 'p@ss/w',
      PGDATABASE: 'postgres',
      PGSSLMODE: 'require',
    },
    problem: null,
  });
  for (const mode of ['require', 'verify-ca', 'verify-full']) assert.equal(pgEnv(`postgresql://u:p@h/db?sslmode=${mode}`).env.PGSSLMODE, mode);
});

test('pgEnv refuses, in fixed sentences that echo nothing: no TLS, control characters, malformed escapes, other schemes', () => {
  const cases = {
    '': 'SUPABASE_DB_URL is not set',
    'not a url': 'SUPABASE_DB_URL is not a postgres:// URL',
    'https://u:p@h/db': 'SUPABASE_DB_URL is not a postgres:// URL',
    'postgresql://h/db': 'SUPABASE_DB_URL needs a host and a user',
    'postgresql://u:pw-probe-SECRET%00x@h/db': 'SUPABASE_DB_URL holds a control character',
    'postgresql://u%0Aname:pw-probe-SECRET@h/db': 'SUPABASE_DB_URL holds a control character',
    'postgresql://u:pw-probe-SECRET@h/db%1F': 'SUPABASE_DB_URL holds a control character',
    'postgresql://u:pw-probe-SECRET\u0000x@h/db': 'SUPABASE_DB_URL holds a control character',
    'postgresql://u:pw-probe-SECRET%E0%A4%A@h/db': 'SUPABASE_DB_URL has a malformed percent escape',
  };
  for (const mode of ['disable', 'allow', 'prefer', 'bogus']) cases[`postgresql://u:pw-probe-SECRET@h/db?sslmode=${mode}`] = 'SUPABASE_DB_URL must use TLS: sslmode require, verify-ca or verify-full';
  for (const [url, problem] of Object.entries(cases)) {
    const r = pgEnv(url);
    assert.equal(r.env, null, url);
    assert.equal(r.problem, problem, url);
    assert.doesNotMatch(r.problem, /SECRET|pw-probe/);
  }
});

test('planted NUL: the migrations command never prints a decoded credential, on stdout or stderr', () => {
  for (const url of ['postgresql://postgres.abcdefghijklmnopqrst:pw-probe-SECRET%00x@127.0.0.1:1/postgres', 'postgresql://postgres.abc%00def:pw-probe-SECRET@127.0.0.1:1/po%00stgres']) {
    const r = spawnSync('node', [SCRIPT, 'migrations'], { encoding: 'utf8', env: { ...process.env, SUPABASE_DB_URL: url } });
    assert.equal(r.status, 1, url);
    assert.doesNotMatch(r.stdout + r.stderr, /pw-probe|SECRET|abc.def|po.stgres|TypeError|at /, url);
    assert.deepEqual(JSON.parse(r.stdout), { ok: false, error: 'SUPABASE_DB_URL holds a control character' });
    assert.equal(r.stderr, '');
  }
});

test('psqlRead: a spawn that throws (with the value in its message) becomes a fixed reason', () => {
  const r = psqlRead({ PGPASSWORD: 'pw-probe-SECRET' }, 'select 1', () => {
    throw new TypeError("The property 'options.env['PGPASSWORD']' must be a string without null bytes. Received 'pw-probe-SECRET'");
  });
  assert.deepEqual(r, { ok: false, why: 'psql did not run' });
});

test('anything that throws prints one fixed line and exits 2, never the error or a stack', () => {
  const r = spawnSync('node', [SCRIPT, 'plan', '--changed', '/nonexistent/pw-probe-SECRET.txt'], { encoding: 'utf8' });
  assert.equal(r.status, 2);
  assert.equal(r.stdout.trim(), STOPPED_LINE);
  assert.equal(r.stderr, '');
  assert.doesNotMatch(r.stdout, /pw-probe|ENOENT|at /);
});

test('psqlRead: credentials only in the environment, a read-only transaction, and no psql message kept', () => {
  const calls = [];
  const run = (cmd, args, opts) => {
    calls.push({ cmd, args, env: opts.env });
    return { status: 1, stdout: '', stderr: 'psql: ERROR:  42501 permission denied for schema secret_host_name' };
  };
  const r = psqlRead({ PGHOST: 'h', PGPASSWORD: 'pw' }, 'select 1', run);
  assert.deepEqual(r, { ok: false, why: 'the read failed (SQLSTATE 42501)' });
  assert.ok(!calls[0].args.join(' ').includes('pw'));
  assert.equal(calls[0].env.PGPASSWORD, 'pw');
  assert.deepEqual(calls[0].args.slice(-8), ['-c', 'begin transaction read only', '-c', "set local statement_timeout = '10s'", '-c', 'select 1', '-c', 'rollback']);
  assert.deepEqual(psqlRead({}, 'x', () => ({ status: 2, stdout: '', stderr: 'host secret' })), { ok: false, why: 'could not connect' });
  assert.deepEqual(psqlRead({}, 'x', () => ({ error: Object.assign(new Error('x'), { code: 'ENOENT' }) })), { ok: false, why: 'psql not found' });
  assert.deepEqual(psqlRead({}, 'x', () => ({ status: 0, stdout: 'BEGIN\nt\n', stderr: '' })), { ok: true, text: 't' });
});

test('migrationsCheck: a fresh database lacks every file; a partial history lacks the rest; a failed read is an error, not "up to date"', () =>
  withFixture({ 'supabase/migrations/20261001000000_a.sql': '', 'supabase/migrations/20261002000000_b.sql': '' }, (root) => {
    const url = 'postgresql://u:p@h/db';
    const reads = (answers) => {
      let i = 0;
      return () => answers[i++];
    };
    assert.deepEqual(migrationsCheck(root, url, reads([{ ok: true, text: 'f' }])), { ok: true, upToDate: false, local: 2, pending: ['20261001000000_a.sql', '20261002000000_b.sql'] });
    assert.deepEqual(migrationsCheck(root, url, reads([{ ok: true, text: 't' }, { ok: true, text: '20261001000000' }])).pending, ['20261002000000_b.sql']);
    assert.equal(migrationsCheck(root, url, reads([{ ok: true, text: 't' }, { ok: true, text: '20261001000000 20261002000000' }])).upToDate, true);
    assert.deepEqual(migrationsCheck(root, url, reads([{ ok: false, why: 'could not connect' }])), { ok: false, error: 'could not connect' });
    assert.equal(migrationsCheck(root, '', reads([])).ok, false);
  }));
