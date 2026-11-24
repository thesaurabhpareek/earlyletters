// Fails when the committed content map is stale against the tree. Run: node --test scripts/content/export-content-map.test.mjs
// Wired into the root `npm test` list (BL-1880), so a stale map fails CI.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync, mkdirSync, writeFileSync, rmSync, mkdtempSync, readdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildMap, render, COLUMNS } from './export-content-map.mjs';

const dir = join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'docs', 'content', 'map');
const map = buildMap();

// Skipped only while the generated files are not in the tree yet (the generator lands before its output).
const committed = existsSync(join(dir, 'content-map.json')) && existsSync(join(dir, 'content-map.csv'));
test('the committed map matches the tree (regenerate: node scripts/content/export-content-map.mjs)', { skip: !committed }, () => {
  const out = render(map);
  assert.equal(readFileSync(join(dir, 'content-map.json'), 'utf8'), out.json, 'content-map.json is stale');
  assert.equal(readFileSync(join(dir, 'content-map.csv'), 'utf8'), out.csv, 'content-map.csv is stale');
});
test('output is deterministic and sorted, ids are unique', () => {
  assert.equal(render(buildMap()).json, render(map).json);
  assert.equal(new Set(map.rows.map((r) => r.id)).size, map.rows.length);
  for (const r of map.rows) assert.deepEqual(Object.keys(r), COLUMNS);
});
test('the protected lines are flagged and no text is empty', () => {
  assert.ok(map.rows.some((r) => r.hold === 'protected' && /D-133/.test(r.hold_reason)));
  assert.ok(map.rows.some((r) => r.hold === 'protected' && /helpline/.test(r.hold_reason)));
  assert.ok(map.rows.every((r) => r.text.trim() && r.chars > 0));
  assert.ok(map.rows.filter((r) => r.surface === 'prompt').every((r) => /^[a-z0-9.-]+$/.test(r.id)));
});
const bdOf = (r) => (/build-dependent: true for (servers o\w+) only/.exec(r.hold_reason) ?? [])[1] ?? '';
const byId = (id) => map.rows.find((r) => r.id.endsWith(id));
test('[BL-1883] the privacy promise is protected and the consent terms are held', () => {
  const promise = byId('strings.en.ts#en.trust.promise');
  assert.equal(promise.hold, 'protected');
  assert.match(promise.hold_reason, /D-061/);
  for (const k of ['title', 'body', 'termsLink', 'privacyLink', 'agree', 'notNow']) {
    const r = byId(`features/auth.en.ts#authCopy.consent.terms.${k}`);
    assert.equal(r.hold, 'held', `authCopy.consent.terms.${k}`);
    assert.equal(r.surface, 'legal');
    assert.equal(r.channel, 'consent');
  }
});
test('[BL-1883] build-dependent privacy lines name the build they are true for', () => {
  const want = {
    'strings.en.ts#en.settings.privacy.keptOnPhone': 'servers off', 'strings.en.ts#en.settings.privacy.keptSynced': 'servers on',
    'strings.en.ts#en.whereLive.onPhone': 'servers off', 'strings.en.ts#en.whereLive.onPhoneSynced': 'servers on',
    'strings.en.ts#en.settings.erase.onThisPhone': 'servers off', 'features/account-deletion.en.ts#accountDeletionCopy.what.intro': 'servers on',
    'store.en.ts#storeListing.reviewNotes': 'servers on', 'release/app-review.en.ts#notesServersOn': 'servers on',
  };
  for (const [id, v] of Object.entries(want)) assert.equal(bdOf(byId(id)), v, id);
  // a flag does not replace a hold: the erase line is both
  assert.equal(byId('strings.en.ts#en.settings.erase.onThisPhone').hold, 'held');
  assert.equal(byId('strings.en.ts#en.whereLive.onPhone').hold, 'build-dependent');
  // found by pattern, not named: any line that says our servers hold it
  assert.equal(bdOf(byId('strings.en.ts#en.settings.delete.bookBody')), 'servers on');
  assert.ok(map.rows.every((r) => (r.hold === 'build-dependent') === (r.hold_reason.startsWith('build-dependent:'))));
});

test('[BL-1880] the root npm test list runs this check', () => {
  const pkg = JSON.parse(readFileSync(join(dir, '..', '..', '..', 'package.json'), 'utf8'));
  assert.match(pkg.scripts.test, /scripts\/content\/export-content-map\.test\.mjs/);
});
test('[BL-1880] a planted stale map fails --check and a current one passes', () => {
  const root = join(dir, '..', '..', '..');
  const tmp = mkdtempSync(join(root, '.map-check-'));
  const rel = tmp.slice(root.length + 1);
  const run = () => spawnSync(process.execPath, [join(root, 'scripts/content/export-content-map.mjs'), '--check', '--out', rel], { encoding: 'utf8' });
  try {
    const out = render(map);
    writeFileSync(join(tmp, 'content-map.json'), out.json);
    writeFileSync(join(tmp, 'content-map.csv'), out.csv);
    assert.equal(run().status, 0);
    writeFileSync(join(tmp, 'content-map.json'), out.json.replace('"', '"x', 1));
    assert.equal(run().status, 1);
  } finally { rmSync(tmp, { recursive: true, force: true }); }
});

// [BL-1932] The CSV is compared on its own: a map whose JSON is current but whose CSV is stale must fail, and the
// message must name the CSV only. A check that skipped the CSV compare would pass this planted case.
test('[BL-1932] a stale CSV alone fails --check and names only the CSV', () => {
  const root = join(dir, '..', '..', '..');
  const tmp = mkdtempSync(join(root, '.map-check-'));
  const rel = tmp.slice(root.length + 1);
  const run = () => spawnSync(process.execPath, [join(root, 'scripts/content/export-content-map.mjs'), '--check', '--out', rel], { encoding: 'utf8' });
  try {
    const out = render(map);
    writeFileSync(join(tmp, 'content-map.json'), out.json);
    writeFileSync(join(tmp, 'content-map.csv'), out.csv + 'planted,stale,row\n');
    const r = run();
    assert.equal(r.status, 1);
    assert.match(r.stderr, /stale: content-map\.csv\./);
    assert.doesNotMatch(r.stderr, /content-map\.json/);
  } finally { rmSync(tmp, { recursive: true, force: true }); }
});

// [BL-1932] A killed run can leave a .map-check-* directory in the repo root; git must not offer it for a commit.
test('[BL-1932] .gitignore covers the .map-check-* scratch directories', () => {
  const root = join(dir, '..', '..', '..');
  const r = spawnSync('git', ['check-ignore', '-q', '.map-check-planted/content-map.json'], { cwd: root });
  assert.equal(r.status, 0, '.map-check-* is not ignored');
});

test('[BL-1932] the --check run leaves no scratch directory behind', () => {
  const root = join(dir, '..', '..', '..');
  const scratch = () => readdirSync(root).filter((n) => n.startsWith('.map-check-'));
  assert.deepEqual(scratch(), [], 'an earlier check run left a scratch directory');
  spawnSync(process.execPath, [join(root, 'scripts/content/export-content-map.mjs'), '--check'], { encoding: 'utf8' });
  assert.deepEqual(scratch(), []);
});
