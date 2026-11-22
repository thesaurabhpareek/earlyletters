#!/usr/bin/env node
/**
 * Writes apps/mobile/src/generated/licences.json: the licence notice of every npm package in the
 * iOS binary, every native library compiled in, every bundled font, the icon artwork, the speech
 * models the app downloads and every vendored file, grouped by theme (scripts/licences/components.mjs),
 * for the Licenses page (MIT, BSD, Apache and ISC ask for the
 * notice to ship with the code). The app reads it through apps/mobile/src/lib/licences.ts.
 *
 *   npm run licences:generate -w @scribe/mobile              # after any dependency change
 *   npm run licences:generate -w @scribe/mobile -- --check   # exit 1 when the file would change; writes nothing
 *   node scripts/licences/generate.mjs --check --against <file>   # check another copy (the tests use it)
 *
 * Sources: package-lock.json walked through the table in components.mjs (what ships, by theme;
 * build tools, web-only and type packages left out with a reason), `npm ls --omit=dev --all`
 * (a cross-check of the lockfile walk against npm's own), scripts/licences/third-party/ (licence
 * texts of native libraries, models and artwork, copied from upstream), each package's LICENSE and NOTICE files in
 * node_modules, packages/design-tokens/fonts/OFL-*.txt, apps/mobile/modules/*, any licence
 * file under packs/, and third-party code adapted into apps/mobile/shims (VENDORED in lib.mjs).
 * Needs node_modules installed (`npm ci` at the repo root). What goes in the file is decided by
 * deriveNotices in lib.mjs; this file adds the npm ls cross-check, the write and the report.
 *
 * The output is deterministic: no dates, entries sorted, identical texts stored once, and
 * host-specific build binaries (lightningcss-darwin-arm64 and friends, which never ship in the
 * app) left out, so the same lockfile gives the same file on every machine.
 * apps/mobile/test/licences.test.ts runs `--check`, so `npm test` fails while the file is
 * missing, stale or edited by hand.
 */
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { TABLE } from './components.mjs';
import { APP_PACKAGE, COMMAND, OUTPUT, deriveNotices, dependencyIds, flattenNpmLs, shippedPackages } from './lib.mjs';


const REPO = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const args = process.argv.slice(2);
const CHECK = args.includes('--check');
const against = args.includes('--against') ? args[args.indexOf('--against') + 1] : null;
if (args.includes('--against') && (!against || !CHECK)) fail('--against <file> needs a file and goes with --check.');

/** @param {string} msg @returns {never} */
function fail(msg) {
  console.error(`licences: ${msg}`);
  process.exit(1);
}

// ---------------------------------------------------------------- 1. the file's contents (lib.mjs)
if (!existsSync(join(REPO, 'node_modules'))) fail('node_modules is missing: run `npm ci` at the repo root first.');
/** @type {ReturnType<typeof deriveNotices>} */
let derived;
try {
  derived = deriveNotices(REPO, { table: TABLE });
} catch (e) {
  fail(/** @type {Error} */ (e).message);
}
const { all, shipped, hostSpecific, own, hash, libraries, fonts, native, data, vendored, thirdParty, entries, notices, json } = derived;

// ---------------------------------------------------------------- 2. cross-check the lockfile walk against npm's own walk of the installed tree
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
const hostIds = new Set(dependencyIds(hostSpecific));
const npmIds = new Set(
  [...flattenNpmLs(app).values()]
    .filter((p) => !own.has(p.name))
    .map((p) => `${p.name}@${p.version}`)
    .filter((id) => !hostIds.has(id)),
);
const lockIds = new Set(dependencyIds(shippedPackages(all)));
const onlyLock = [...lockIds].filter((id) => !npmIds.has(id));
const onlyNpm = [...npmIds].filter((id) => !lockIds.has(id));
if (onlyLock.length || onlyNpm.length) {
  fail(
    `the lockfile walk and npm ls disagree.\n  only in the lockfile walk: ${onlyLock.join(', ') || 'none'}\n  only in npm ls: ${onlyNpm.join(', ') || 'none'}\n` +
      'Run `npm ci` so node_modules matches package-lock.json; if they already match, productionPackages in scripts/licences/lib.mjs needs a fix.',
  );
}

// ---------------------------------------------------------------- 3. write, or check the whole file, byte for byte
const outPath = against ? resolve(against) : join(REPO, OUTPUT);
const shown = against ?? OUTPUT;
const before = existsSync(outPath) ? readFileSync(outPath, 'utf8') : null;
if (CHECK) {
  if (before === json) {
    console.log(`licences: ${shown} is up to date (${entries.length} entries in ${notices.themes.length} themes).`);
    process.exit(0);
  }
  fail(`${shown} is ${before === null ? 'missing' : 'stale or edited by hand'}. Run: ${COMMAND}`);
}
mkdirSync(dirname(outPath), { recursive: true });
writeFileSync(outPath, json);

// ---------------------------------------------------------------- 4. report
const kb = Math.round(Buffer.byteLength(json, 'utf8') / 1024);
const label = (/** @type {{ name: string, version?: string }} */ e) => (e.version ? `${e.name}@${e.version}` : e.name);
const all_ = notices.themes.flatMap((g) => g.entries);
console.log(`licences: ${before === json ? 'unchanged' : before === null ? 'wrote' : 'updated'} ${OUTPUT} (${kb} KB, ${notices.texts.length} distinct notice texts)`);
console.log(`  ${entries.length} entries: ${libraries.length} npm packages in the iOS binary, ${thirdParty.length} other components (native libraries, vendored code, models, artwork), ${fonts.length} fonts, ${native.entries.length} third-party local modules, ${data.length} data files, ${vendored.length} vendored shims; dependency hash ${hash.slice(0, 12)}`);
console.log(`  Left out of the ${shippedPackages(all).length} packages in the production tree: ${shippedPackages(all).length - shipped.length} (build tools, web-only, types; reasons in components.mjs NOT_SHIPPED)`);
for (const g of notices.themes) console.log(`    ${g.id.padEnd(10)} ${String(g.entries.length).padStart(4)}`);

const review = all_.filter((e) => e.review);
console.log(`\n  Needs review (licence missing or unexpected, or no notice text for a licence that asks for one): ${review.length}`);
for (const e of review) console.log(`    ${label(e).padEnd(44)} ${e.licence}${e.text === null ? ', no notice text' : ''}`);

const inherited = libraries.filter((e) => e.noticeFrom);
console.log(`\n  Published without a licence file; notice read from a sibling package in the same repository: ${inherited.length}`);
for (const e of inherited) console.log(`    ${label(e).padEnd(44)} from ${e.noticeFrom}`);

console.log(`\n  Our own native modules, no third-party code, not listed: ${native.own.join(', ') || 'none'}`);
console.log(`  Host-specific build binaries left out (never in the app): ${hostSpecific.length}`);
console.log(`  Our own packages, followed but not listed: ${[...own].sort().join(', ')}`);
