#!/usr/bin/env node
/**
 * Proves the Licenses page lists exactly the npm packages in the iOS app, against a real build:
 * the node_modules folders in the source map of a production iOS export, plus the packages
 * autolinking links into the native project. Compares name@version with the `library` entries of
 * apps/mobile/src/generated/licences.json and exits 1 on any difference, or on a package folder in
 * the source map that package-lock.json does not have.
 *
 *   node scripts/licences/verify-shipped.mjs                          # exports the iOS bundle itself (a minute or two)
 *   node scripts/licences/verify-shipped.mjs --sourcemap <file.map>   # reuse an export made with --source-maps
 *
 * Run before a release candidate (docs/ops/RELEASE.md) and after any dependency change that
 * touches components.mjs. Needs node_modules (`npm ci`). Writes only to a temporary folder.
 */
import { spawnSync } from 'node:child_process';
import { mkdtempSync, readdirSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { OUTPUT } from './lib.mjs';

const REPO = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const APP = join(REPO, 'apps', 'mobile');
const args = process.argv.slice(2);
const given = args.includes('--sourcemap') ? args[args.indexOf('--sourcemap') + 1] : null;

/** Thrown by run() so the temporary export folder is removed on every way out. */
class Failure extends Error {}

const run = (/** @type {string[]} */ cmd, /** @type {Record<string, string>} */ env = {}) => {
  // --no-install: use the CLIs in node_modules (npm ci); never download one.
  const r = spawnSync('npx', ['--no-install', ...cmd], { cwd: APP, encoding: 'utf8', maxBuffer: 256 * 1024 * 1024, env: { ...process.env, ...env } });
  if (r.status !== 0) throw new Failure(`npx --no-install ${cmd.join(' ')} failed\n${r.stderr || r.stdout}`);
  return r.stdout;
};

/** @type {string | null} */
let temp = null;
let code = 1;
try {
  code = verify();
} catch (e) {
  console.error(`verify-shipped: ${/** @type {Error} */ (e).message}`);
  if (!(e instanceof Failure)) console.error(/** @type {Error} */ (e).stack);
} finally {
  if (temp) rmSync(temp, { recursive: true, force: true });
}
process.exit(code);

function verify() {
  let mapPath = given;
  if (!mapPath) {
    temp = mkdtempSync(join(tmpdir(), 'licences-export-'));
    run(['expo', 'export', '-p', 'ios', '--source-maps', '--output-dir', temp], { CI: '1', NODE_ENV: 'production', EXPO_PUBLIC_APP_ENV: 'production' });
    const dir = join(temp, '_expo', 'static', 'js', 'ios');
    const map = readdirSync(dir).find((f) => f.endsWith('.map'));
    if (!map) throw new Failure(`the export wrote no source map in ${dir}`);
    mapPath = join(dir, map);
  }

  const lock = JSON.parse(readFileSync(join(REPO, 'package-lock.json'), 'utf8')).packages;
  const bundled = new Set();
  /** Package folders in the source map that package-lock.json does not have: reported, never skipped. */
  const unknown = new Set();
  for (const src of JSON.parse(readFileSync(mapPath, 'utf8')).sources) {
    const i = src.indexOf('node_modules/');
    if (i < 0) continue;
    // Lockfile key of the package folder a source sits in: every node_modules/<name> segment from the first.
    const parts = src.slice(i).split('/');
    const key = [];
    let j = 0;
    while (parts[j] === 'node_modules') {
      const name = parts[j + 1].startsWith('@') ? `${parts[j + 1]}/${parts[j + 2]}` : parts[j + 1];
      key.push('node_modules', name);
      j += name.includes('/') ? 3 : 2;
    }
    const k = key.join('/');
    const entry = lock[k] ?? lock[`apps/mobile/${k}`];
    if (entry) bundled.add(`${entry.name ?? key[key.length - 1]}@${entry.version}`);
    else unknown.add(k);
  }

  const versionOf = (/** @type {string} */ name) => JSON.parse(readFileSync(join(REPO, 'node_modules', name, 'package.json'), 'utf8')).version;
  const expo = JSON.parse(run(['expo-modules-autolinking', 'resolve', '-p', 'ios', '--json']));
  for (const m of expo.modules) if (m.packageVersion) bundled.add(`${m.packageName}@${m.packageVersion}`);
  const rn = JSON.parse(run(['expo-modules-autolinking', 'react-native-config', '--platform', 'ios', '--json']));
  for (const name of Object.keys(rn.dependencies ?? {})) bundled.add(`${name}@${versionOf(name)}`);

  const listed = new Set(
    JSON.parse(readFileSync(join(REPO, OUTPUT), 'utf8'))
      .themes.flatMap((/** @type {any} */ g) => g.entries)
      .filter((/** @type {any} */ e) => e.kind === 'library')
      .map((/** @type {any} */ e) => `${e.name}@${e.version}`),
  );
  const notListed = [...bundled].filter((id) => !listed.has(id)).sort();
  const notBuilt = [...listed].filter((id) => !bundled.has(id)).sort();
  console.log(`verify-shipped: ${bundled.size} npm packages in the iOS build, ${listed.size} listed.`);
  if (unknown.size) console.log(`  in the source map, not in package-lock.json (run npm ci; if it persists, the folder is vendored or generated and needs a row in components.mjs):\n    ${[...unknown].sort().join('\n    ')}`);
  if (notListed.length) console.log(`  in the build, not listed (add to PACKAGES in components.mjs):\n    ${notListed.join('\n    ')}`);
  if (notBuilt.length) console.log(`  listed, not in the build (move to NOT_SHIPPED in components.mjs, with the reason):\n    ${notBuilt.join('\n    ')}`);
  return unknown.size || notListed.length || notBuilt.length ? 1 : 0;
}
