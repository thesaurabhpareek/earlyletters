/**
 * Measures the iOS app against the 40 MB download budget (founder decision
 * 15; docs/ops/APP_SIZE.md). Run on every release build:
 *
 *   npx tsx scripts/size/measure.ts                          # JS and assets only (any machine, about 3 minutes)
 *   npx tsx scripts/size/measure.ts --ipa build.ipa          # plus the IPA from `eas build` (approximate)
 *   npx tsx scripts/size/measure.ts --thinning-report "App Thinning Size Report.txt"   # close to the App Store number
 *   npx tsx scripts/size/measure.ts --skip-export            # reuse dist/size from the last run
 *
 * What it does:
 *  1. `expo export --platform ios` twice: with Hermes bytecode (what ships)
 *     and without (plain JS with a source map, for attribution);
 *  2. sizes: bytecode bundle, gzip estimate, JS assets;
 *  3. dependency report: bytes per npm package and per app folder, largest first;
 *  4. app dependencies that put nothing in the JS bundle (native ones still add binary size);
 *  5. fonts and large images in the app's assets, with the cuts in APP_SIZE.md;
 *  6. the IPA breakdown and the thinning report, when given;
 *  7. the verdict against the budget. Exit code 1 when over.
 * Writes dist/size/report.md and dist/size/report.json (dist/ is git-ignored).
 */
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { dirname, extname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gzipSync } from 'node:zlib';
import { bytesPerSource, groupByOwner, ipaBreakdown, listZip, mb, parseThinningReport, unusedDependencies, verdict } from './lib';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const APP = join(ROOT, 'apps/mobile');
const OUT = join(ROOT, 'dist/size');
const argv = process.argv.slice(2);
const flag = (n: string) => argv.includes(`--${n}`);
const opt = (n: string) => {
  const i = argv.indexOf(`--${n}`);
  return i >= 0 ? (argv[i + 1] ?? null) : null;
};

function walk(dir: string): string[] {
  if (!existsSync(dir)) return [];
  return readdirSync(dir).flatMap((n) => {
    const p = join(dir, n);
    return statSync(p).isDirectory() ? walk(p) : [p];
  });
}

function exportIos(outDir: string, bytecode: boolean): void {
  const args = ['expo', 'export', '--platform', 'ios', '--source-maps', '--dump-assetmap', '--output-dir', outDir];
  if (!bytecode) args.push('--no-bytecode');
  const r = spawnSync('npx', args, { cwd: APP, stdio: 'inherit', env: { ...process.env, EXPO_NO_TELEMETRY: '1', CI: '1' } });
  if (r.status !== 0) throw new Error(`expo export failed (${bytecode ? 'bytecode' : 'plain JS'})`);
}

if (!flag('skip-export')) {
  mkdirSync(OUT, { recursive: true });
  exportIos(join(OUT, 'hbc'), true);
  exportIos(join(OUT, 'js'), false);
}

const hbcFiles = walk(join(OUT, 'hbc/_expo/static/js/ios')).filter((f) => f.endsWith('.hbc'));
const jsFiles = walk(join(OUT, 'js/_expo/static/js/ios')).filter((f) => f.endsWith('.js'));
if (!hbcFiles.length || !jsFiles.length) throw new Error('no iOS bundle in dist/size; run without --skip-export');
const hbc = readFileSync(hbcFiles[0]);
const js = readFileSync(jsFiles[0], 'utf8');
const map = JSON.parse(readFileSync(`${jsFiles[0]}.map`, 'utf8')) as { sources: string[]; mappings: string };
const assets = walk(join(OUT, 'hbc/assets'));
const assetsBytes = assets.reduce((n, f) => n + statSync(f).size, 0);

const perSource = bytesPerSource(js, map);
const owners = groupByOwner(perSource);
const files = [...perSource.entries()].map(([source, bytes]) => ({ source: relative(ROOT, resolve(APP, source)) || source, bytes })).sort((a, b) => b.bytes - a.bytes);

const pkg = JSON.parse(readFileSync(join(APP, 'package.json'), 'utf8')) as { dependencies: Record<string, string> };
const deps = Object.keys(pkg.dependencies);
const unused = unusedDependencies(deps, new Set(owners.map((o) => o.owner))).map((name) => {
  const dir = join(ROOT, 'node_modules', name);
  const native = existsSync(join(dir, 'ios')) || existsSync(join(dir, 'expo-module.config.json')) || walk(dir).some((f) => f.endsWith('.podspec') && !f.includes('node_modules/' + name + '/node_modules'));
  return { name, native };
});

const fontDirs = [join(APP, 'assets'), join(ROOT, 'packages/design-tokens/fonts')];
const fonts = fontDirs.flatMap(walk).filter((f) => /\.(ttf|otf|woff2?)$/i.test(f)).map((f) => ({ file: relative(ROOT, f), bytes: statSync(f).size }));
const images = walk(join(APP, 'assets'))
  .filter((f) => /\.(png|jpe?g|gif|heic|webp|avif)$/i.test(f))
  .map((f) => ({ file: relative(ROOT, f), bytes: statSync(f).size, format: extname(f).slice(1).toLowerCase() }))
  .filter((i) => i.bytes > 100_000)
  .sort((a, b) => b.bytes - a.bytes);

const ipaPath = opt('ipa');
const ipa = ipaPath ? { bytes: statSync(ipaPath).size, parts: ipaBreakdown(listZip(readFileSync(ipaPath))) } : null;
const thinPath = opt('thinning-report');
const thinning = thinPath ? parseThinningReport(readFileSync(thinPath, 'utf8')) : null;
const thinMax = thinning && thinning.length ? Math.max(...thinning.map((t) => t.compressed)) : null;

const v = verdict({ thinningMaxCompressed: thinMax, ipaBytes: ipa?.bytes ?? null, jsBundleBytes: hbc.length, jsAssetsBytes: assetsBytes });
const gz = gzipSync(hbc, { level: 9 }).length;

const lines: string[] = [];
const row = (...cells: (string | number)[]) => lines.push(`| ${cells.join(' | ')} |`);
lines.push(`# App size report (${new Date().toISOString().slice(0, 10)})`, '');
lines.push(`Verdict: **${v.pass ? 'within budget' : 'OVER BUDGET'}** (source: ${v.source}${v.downloadBytes != null ? `, download ${mb(v.downloadBytes)}` : ''}).`);
for (const n of v.notes) lines.push(`- ${n}`);
lines.push('', '## JS', '');
row('Item', 'Size');
row('---', '---');
row('Hermes bytecode bundle (ships)', mb(hbc.length));
row('Bytecode, gzip -9 (download estimate)', mb(gz));
row('Plain JS bundle (minified, for attribution)', mb(Buffer.byteLength(js)));
row('JS assets', `${mb(assetsBytes)} in ${assets.length} files`);
lines.push('', '## Largest packages in the JS bundle (minified JS bytes)', '');
row('Package', 'Bytes', 'Share');
row('---', '---', '---');
const total = Buffer.byteLength(js);
for (const o of owners.slice(0, 30)) row(o.owner, o.bytes.toLocaleString('en-US'), `${((o.bytes / total) * 100).toFixed(1)}%`);
lines.push('', '## Largest files', '');
row('File', 'Bytes');
row('---', '---');
for (const f of files.slice(0, 25)) row(f.source, f.bytes.toLocaleString('en-US'));
lines.push('', '## App dependencies with nothing in the JS bundle', '');
lines.push('Native ones are still compiled into the binary by autolinking: remove them if unused.', '');
for (const u of unused) lines.push(`- ${u.name}${u.native ? ' (native code)' : ''}`);
lines.push('', '## Fonts', '');
for (const f of fonts) lines.push(`- ${f.file}: ${mb(f.bytes)}`);
if (!fonts.length) lines.push('- none bundled');
lines.push('', '## Images over 100 KB', '');
for (const i of images) lines.push(`- ${i.file}: ${mb(i.bytes)} (${i.format})`);
if (ipa) {
  lines.push('', `## IPA (${mb(ipa.bytes)}, approximate)`, '');
  row('Part', 'Compressed', 'Uncompressed');
  row('---', '---', '---');
  for (const p of ipa.parts.slice(0, 25)) row(p.part, mb(p.compressed), mb(p.uncompressed));
}
if (thinning) {
  lines.push('', '## App Thinning Size Report', '');
  for (const t of thinning) lines.push(`- ${t.variant}: ${mb(t.compressed)} download, ${mb(t.uncompressed)} installed`);
}

mkdirSync(OUT, { recursive: true });
writeFileSync(join(OUT, 'report.md'), `${lines.join('\n')}\n`);
writeFileSync(
  join(OUT, 'report.json'),
  JSON.stringify({ verdict: v, hbcBytes: hbc.length, hbcGzipBytes: gz, jsBytes: total, assetsBytes, owners: owners.slice(0, 100), unused, fonts, images, ipa, thinning }, null, 2),
);
process.stdout.write(`${lines.slice(0, 14).join('\n')}\n\nFull report: dist/size/report.md\n`);
process.exit(v.pass ? 0 : 1);
