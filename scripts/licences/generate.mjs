#!/usr/bin/env node
/**
 * Writes apps/mobile/src/generated/licences.json: the licence notice of every production npm
 * package in the app's tree, every bundled font and every third-party native module, grouped by
 * licence, for Settings > Licences (MIT, BSD, Apache and ISC ask for the notice to ship with the
 * code).
 *
 *   npm run licences:generate -w @scribe/mobile              # after any dependency change
 *   npm run licences:generate -w @scribe/mobile -- --check   # exit 1 when the file would change; writes nothing
 *
 * Sources: package-lock.json (the production set, walked by lib.mjs), `npm ls --omit=dev --all`
 * (a cross-check of that walk against npm's own), each package's LICENSE and NOTICE files in
 * node_modules, packages/design-tokens/fonts/OFL-*.txt, apps/mobile/modules/* and any licence
 * file under packs/. Needs node_modules installed (`npm ci` at the repo root).
 *
 * The output is deterministic: no dates, entries sorted, identical texts stored once, and
 * host-specific build binaries (lightningcss-darwin-arm64 and friends, which never ship in the
 * app) left out, so the same lockfile gives the same file on every machine.
 * apps/mobile/test/licences.test.ts fails when the file is missing, empty or stale.
 */
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  APP_PACKAGE,
  APP_WORKSPACE,
  COMMAND,
  EXPECTED_LICENCES,
  OUTPUT,
  buildNotices,
  dependencyHash,
  dependencyIds,
  flattenNpmLs,
  fontEntries,
  inheritNotices,
  licenceText,
  nativeModuleEntries,
  normaliseRepository,
  packDataEntries,
  productionPackages,
  shippedPackages,
  workspaceNames,
} from './lib.mjs';

const REPO = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const CHECK = process.argv.includes('--check');

/** @param {string} msg */
function fail(msg) {
  console.error(`licences: ${msg}`);
  process.exit(1);
}

// ---------------------------------------------------------------- 1. the production set, from the lockfile
const lock = JSON.parse(readFileSync(join(REPO, 'package-lock.json'), 'utf8'));
const all = productionPackages(lock, APP_WORKSPACE);
const shipped = shippedPackages(all);
const hostSpecific = [...all.values()].filter((p) => p.hostSpecific);
const own = workspaceNames(lock);
const hash = dependencyHash(shipped);

// ---------------------------------------------------------------- 2. cross-check against npm's own walk of the installed tree
if (!existsSync(join(REPO, 'node_modules'))) fail('node_modules is missing: run `npm ci` at the repo root first.');
const ls = spawnSync(process.platform === 'win32' ? 'npm.cmd' : 'npm', ['ls', '--omit=dev', '--all', '--long', '--json', '-w', APP_PACKAGE], {
  cwd: REPO,
  encoding: 'utf8',
  maxBuffer: 256 * 1024 * 1024,
});
// npm ls exits 1 for extraneous packages at the root and still prints the tree; only the JSON matters.
let tree;
try {
  tree = JSON.parse(ls.stdout);
} catch {
  fail(`npm ls did not return JSON: ${(ls.stderr || ls.stdout || '').trim().split('\n').slice(-3).join(' | ')}`);
}
const app = tree.dependencies?.[APP_PACKAGE];
if (!app) fail(`npm ls lists no ${APP_PACKAGE} workspace.`);
const installed = flattenNpmLs(app);
const hostIds = new Set(dependencyIds(hostSpecific));
const npmIds = new Set(
  [...installed.values()]
    .filter((p) => !own.has(p.name))
    .map((p) => `${p.name}@${p.version}`)
    .filter((id) => !hostIds.has(id)),
);
const lockIds = new Set(dependencyIds(shipped));
const onlyLock = [...lockIds].filter((id) => !npmIds.has(id));
const onlyNpm = [...npmIds].filter((id) => !lockIds.has(id));
if (onlyLock.length || onlyNpm.length) {
  fail(
    `the lockfile walk and npm ls disagree.\n  only in the lockfile walk: ${onlyLock.join(', ') || 'none'}\n  only in npm ls: ${onlyNpm.join(', ') || 'none'}\n` +
      'Run `npm ci` so node_modules matches package-lock.json; if they already match, productionPackages in scripts/licences/lib.mjs needs a fix.',
  );
}

// ---------------------------------------------------------------- 3. notice texts
const libraries = inheritNotices(
  shipped.map((p) => {
    const pkg = JSON.parse(readFileSync(join(REPO, p.path, 'package.json'), 'utf8'));
    return {
      name: p.name,
      version: p.version,
      kind: /** @type {const} */ ('library'),
      licence: p.licence,
      text: licenceText(join(REPO, p.path)),
      repository: normaliseRepository(pkg.repository),
    };
  }),
);
const fonts = fontEntries(join(REPO, 'packages', 'design-tokens', 'fonts'));
const native = nativeModuleEntries(join(REPO, 'apps', 'mobile', 'modules'));
const data = packDataEntries(join(REPO, 'packs'));
const entries = [...libraries, ...fonts, ...native.entries, ...data];
const notices = buildNotices({ entries, dependencyHash: hash });
const json = `${JSON.stringify(notices, null, 2)}\n`;

// ---------------------------------------------------------------- 4. write, or check
const outPath = join(REPO, OUTPUT);
const before = existsSync(outPath) ? readFileSync(outPath, 'utf8') : null;
if (CHECK) {
  if (before === json) {
    console.log(`licences: ${OUTPUT} is up to date (${entries.length} entries, ${notices.licences.length} licences).`);
    process.exit(0);
  }
  fail(`${OUTPUT} is ${before === null ? 'missing' : 'stale'}. Run: ${COMMAND}`);
}
mkdirSync(dirname(outPath), { recursive: true });
writeFileSync(outPath, json);

// ---------------------------------------------------------------- 5. report
const kb = Math.round(Buffer.byteLength(json, 'utf8') / 1024);
const label = (/** @type {{ name: string, version?: string }} */ e) => (e.version ? `${e.name}@${e.version}` : e.name);
console.log(`licences: ${before === json ? 'unchanged' : before === null ? 'wrote' : 'updated'} ${OUTPUT} (${kb} KB, ${notices.texts.length} distinct notice texts)`);
console.log(`  ${entries.length} entries: ${libraries.length} npm packages, ${fonts.length} fonts, ${native.entries.length} native modules, ${data.length} data files; dependency hash ${hash.slice(0, 12)}`);
console.log(`  ${notices.licences.length} licences:`);
for (const g of notices.licences) console.log(`    ${g.id.padEnd(28)} ${String(g.entries.length).padStart(4)}  ${g.name}`);

const unusual = entries.filter((e) => !e.licence || !EXPECTED_LICENCES.has(e.licence));
console.log(`\n  To look at (licence missing or outside the expected set): ${unusual.length}`);
for (const e of unusual) console.log(`    ${label(e).padEnd(44)} ${e.licence ?? '(none stated)'}`);

const inherited = libraries.filter((e) => e.noticeFrom);
console.log(`\n  Published without a licence file; notice read from a sibling package in the same repository (its root LICENSE): ${inherited.length}`);
for (const e of inherited) console.log(`    ${label(e).padEnd(44)} from ${e.noticeFrom} (${e.repository})`);

const noText = entries.filter((e) => e.text === null);
console.log(`\n  Published without a licence file and no sibling to read from (listed with the licence from package.json only): ${noText.length}`);
for (const e of noText) console.log(`    ${label(e).padEnd(44)} ${e.licence ?? '(none stated)'}`);

console.log(`\n  Our own native modules, no third-party code, not listed: ${native.own.join(', ') || 'none'}`);
console.log(`  Host-specific build binaries left out (never in the app): ${hostSpecific.length}${hostSpecific.length ? ` (${[...new Set(hostSpecific.map((p) => p.name.replace(/-[^-]+-[^-]+(-[^-]+)?$/, '-*')))].join(', ')})` : ''}`);
console.log(`  Our own packages, followed but not listed: ${[...own].sort().join(', ')}`);
