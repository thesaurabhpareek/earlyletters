// Tests for scripts/qa/pr-size.mjs (retro package R2-06). Run: node --test scripts/qa/pr-size.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { breaches, classify, inRange, percentile, report, summarize } from './pr-size.mjs';

test('classifies paths from this repo', () => {
  const cases = {
    'package-lock.json': 'lockfile',
    'apps/mobile/ios/Podfile.lock': 'lockfile',
    'apps/mobile/src/generated/licences.json': 'generated',
    'packages/design-tokens/dist/tokens.web.css': 'generated',
    'packages/brand/registry.json': 'generated',
    'apps/mobile/src/uniwind-types.d.ts': 'generated',
    'docs/TRACE.md': 'generated',
    'packages/brand/assets/logo/primary/png/mark-512.png': 'generated',
    'packages/brand/assets/logo/primary/lockup-stacked.svg': 'generated',
    'packages/brand/assets/logo/primary/source/build.mjs': 'product',
    'docs/brand/archive/photos/a.jpg': 'generated',
    'apps/mobile/test/store.test.ts': 'tests',
    'apps/mobile/test/__golden__/export-asha/README.txt': 'tests',
    'packages/core/test/golden/engine-v8.json': 'tests',
    'packages/emails/test/fixtures/a.json': 'tests',
    'supabase/tests/access_matrix.test.mjs': 'tests',
    'supabase/tests/grants.mjs': 'tests',
    'apps/mobile/src/lib/packs/__tests__/engine.test.ts': 'tests',
    'apps/mobile/e2e-web/j01-first-run.flow.ts': 'tests',
    'scripts/qa/pr-size.test.mjs': 'tests',
    'docs/adr/0025-sync-protocol-v1.md': 'docs',
    'docs/release/journey/steps/J00-open.json': 'docs',
    'CLAUDE.md': 'docs',
    '.claude/agents/qa.md': 'docs',
    'apps/mobile/src/lib/store.ts': 'product',
    'supabase/migrations/20261016000000_sync_v1_server.sql': 'product',
    '.github/workflows/ci.yml': 'product',
    'agents/roster.json': 'product',
    'scripts/qa/pr-size.mjs': 'product',
  };
  for (const [path, want] of Object.entries(cases)) assert.equal(classify(path), want, path);
});

test('summarize splits lines and files by category and flags short file lists', () => {
  const s = summarize({
    number: 1, base: 'develop', merged_at: '2026-10-20T00:00:00Z', additions: 600, deletions: 100, changed_files: 5,
    files: [
      { filename: 'apps/mobile/src/a.ts', additions: 300, deletions: 50 },
      { filename: 'apps/mobile/test/a.test.ts', additions: 200, deletions: 0 },
      { filename: 'docs/a.md', additions: 40, deletions: 10 },
      { filename: 'package-lock.json', additions: 60, deletions: 40 },
    ],
  });
  assert.equal(s.lines, 700);
  assert.equal(s.files, 5);
  assert.deepEqual(s.split.product, { lines: 350, files: 1 });
  assert.deepEqual(s.split.tests, { lines: 200, files: 1 });
  assert.deepEqual(s.split.docs, { lines: 50, files: 1 });
  assert.deepEqual(s.split.lockfile, { lines: 100, files: 1 });
  assert.equal(s.incomplete, true);
  assert.deepEqual(breaches([s], 'raw', 400, 20), { total: 1, lines: 1, files: 0, either: 1 });
  assert.deepEqual(breaches([s], 'product', 400, 20), { total: 1, lines: 0, files: 0, either: 0 });
});

test('percentile is nearest rank; date and base filter', () => {
  assert.equal(percentile([5, 1, 3, 2, 4], 50), 3);
  assert.equal(percentile([1, 2, 3, 4], 50), 2);
  assert.equal(percentile([1, 2, 3, 4], 90), 4);
  assert.equal(percentile([], 50), 0);
  const pr = { merged_at: '2026-10-20T12:00:00Z', base: 'main' };
  assert.equal(inRange(pr, '2026-10-16', '2026-10-28T03:56:00Z'), true);
  assert.equal(inRange(pr, '2026-10-21', null), false);
  assert.equal(inRange(pr, null, null, 'develop'), false);
  assert.equal(inRange({ merged_at: null }, null, null), false);
});

// The 141 PRs merged 2026-10-16T00:00Z to 2026-10-28T03:56Z, fetched live on 2026-10-28 with this script:
// [number, raw changed lines, raw files, product lines, product files]. Same set and raw counts as panel 05.
const PANEL_05 = [
  [42,2570,32,112,2], [79,43,2,0,0], [107,1,1,0,0], [111,371,2,0,0], [117,119,2,0,0], [120,859,18,75,4], [123,31,1,0,0], [124,16366,55,0,0],
  [125,145,5,44,3], [126,218,16,93,7], [128,81,2,0,0], [132,275,230,23,5], [138,5187,52,3284,34], [139,2595,33,1214,20], [140,3850,22,2531,8], [144,802,19,424,11],
  [145,1444,14,587,7], [146,3408,34,1178,15], [150,8643,40,4681,26], [151,6382,53,3800,31], [153,537,5,0,0], [157,19,1,0,0], [159,100,4,2,1], [162,3555,25,1969,14],
  [165,164,15,35,7], [166,467,15,215,7], [169,2067,35,1507,25], [170,4711,6,0,0], [173,15,1,0,0], [174,3578,33,2578,24], [175,5559,8,822,5], [176,3148,39,565,2],
  [177,1058,29,746,14], [178,2565,29,1422,17], [179,3473,41,918,16], [180,3966,43,463,23], [181,1055,15,446,11], [182,4277,28,1159,12], [183,8,1,0,0], [184,3767,38,1968,19],
  [185,689,3,0,0], [186,25,2,0,0], [188,234,1,234,1], [192,5237,44,3063,26], [193,2,1,0,0], [194,319,4,148,2], [195,173,1,0,0], [201,6,1,6,1],
  [202,1407,14,858,11], [203,3082,22,659,3], [204,120,4,0,0], [205,1588,7,1063,4], [206,539,3,0,0], [207,976,11,258,7], [208,3318,8,2152,1], [209,2,1,0,0],
  [210,742,4,408,3], [211,627,7,279,3], [212,10,1,0,0], [213,2638,43,733,18], [214,9,1,9,1], [215,111,5,21,2], [217,43,1,0,0], [218,223,7,50,2],
  [219,309,7,118,3], [220,1828,21,1367,10], [221,1496,14,769,7], [222,2927,27,2258,16], [223,227,3,0,0], [224,28,4,4,1], [225,366,4,0,0], [226,371,7,140,2],
  [227,28,4,0,0], [228,724,21,435,10], [229,24,1,0,0], [235,827,1,0,0], [236,534,7,351,2], [237,306,32,67,13], [238,20,4,4,1], [240,18,4,0,0],
  [241,89,8,30,1], [242,182,15,69,6], [243,975,13,357,9], [244,200,4,125,2], [245,204,10,86,5], [246,14,1,0,0], [247,485,10,185,7], [248,959,9,450,1],
  [249,1320,8,312,3], [250,237,4,20,2], [251,887,8,404,1], [252,912,22,344,11], [253,809,17,273,5], [254,499,5,164,2], [255,375,12,106,6], [256,86,3,0,0],
  [257,317,8,29,4], [258,551,6,153,2], [259,639,7,79,3], [260,550,12,168,8], [261,482,14,122,2], [262,1705,12,382,2], [263,222,2,2,1], [264,226,3,4,2],
  [265,904,33,179,3], [267,12,3,2,1], [268,344,13,86,6], [269,877,6,719,3], [270,110,6,35,2], [271,1835,18,1083,9], [272,404,7,155,2], [273,139,2,0,0],
  [274,2011,24,1188,10], [275,148,14,29,2], [276,185,12,18,7], [277,273,7,77,3], [278,234,3,8,1], [279,342,6,132,3], [280,105,14,6,1], [281,961,12,0,0],
  [282,1517,6,1182,4], [283,49,2,0,0], [284,234,1,234,1], [286,271,2,0,0], [287,55,2,0,0], [288,54,4,47,3], [289,797,15,556,7], [290,257,2,32,1],
  [291,602,10,173,2], [292,166,8,45,4], [293,181,11,57,5], [294,411,5,0,0], [295,165,4,0,0], [296,480,13,174,8], [297,1736,24,727,12], [298,82,3,37,2],
  [299,533,204,374,3], [300,18,1,0,0], [303,467,4,250,1], [304,48,9,9,3], [305,4,1,0,0],
];
const fromTuple = ([number, lines, files, pl, pf]) => ({ number, lines, files, split: { product: { lines: pl, files: pf } } });

test('reproduces panel 05: 72 of 141 merged PRs break CODE-R02 on the raw measure', () => {
  const s = PANEL_05.map(fromTuple);
  assert.equal(s.length, 141);
  assert.deepEqual(breaches(s, 'raw', 400, 20), { total: 141, lines: 70, files: 31, either: 72 });
  assert.equal(percentile(s.map((x) => x.lines), 50), 375);
  assert.equal(percentile(s.map((x) => x.lines), 90), 3408);
});

test('product-only breach rate on the same 141 PRs', () => {
  const s = PANEL_05.map(fromTuple);
  assert.deepEqual(breaches(s, 'product', 400, 20), { total: 141, lines: 39, files: 7, either: 39 });
  assert.equal(breaches(s, 'raw', 800, 30).either, 52);
  assert.equal(breaches(s, 'product', 800, 30).either, 23);
});

test('report prints both breach rates', () => {
  const s = [summarize({ number: 2, additions: 10, deletions: 0, changed_files: 1, files: [{ filename: 'a.ts', additions: 10, deletions: 0 }] })];
  const text = report(s, { maxLines: 400, maxFiles: 20 });
  assert.match(text, /Breach \(raw\): 0 of 1/);
  assert.match(text, /Breach \(product code only\): 0 of 1/);
});
