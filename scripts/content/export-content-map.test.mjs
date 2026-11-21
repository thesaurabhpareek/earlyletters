// Fails when the committed content map is stale against the tree. Run: node --test scripts/content/export-content-map.test.mjs
// Not wired into `npm test` (root package.json is founder-listed); wiring is proposed in docs/content/map/README.md.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildMap, render, COLUMNS } from './export-content-map.mjs';

const dir = join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'docs', 'content', 'map');
const map = buildMap();

test('the committed map matches the tree (regenerate: node scripts/content/export-content-map.mjs)', () => {
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
