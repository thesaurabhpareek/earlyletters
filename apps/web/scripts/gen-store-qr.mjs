#!/usr/bin/env node
/**
 * Author-time QR generator (W2). Run by a person at the launch flip, never by the build:
 *
 *   npm run qr:generate -w @scribe/web -- "https://apps.apple.com/us/app/<name>/id<digits>" <provider token digits>
 *   npm run qr:generate -w @scribe/web -- --clear        (back to no QR)
 *
 * It writes src/lib/qr/qr.generated.ts, which is committed and reviewed. Safeguards (CISO ruling, council round 2):
 *   - qrcode-generator is a devDependency, pinned exactly, installed with --ignore-scripts, imported only here.
 *   - The link is an argument. Nothing is read from the environment or the network, and the site build never runs this.
 *   - Fail closed: the link must pass checkAppStoreUrl (https, host apps.apple.com exactly, an id) or nothing is written.
 *   - The QR encodes the link as the site builds it for ct=web-qr (withAppleCampaign), the string appStoreHref('qr') gives.
 * Node 22.18 or later runs the TypeScript helpers directly.
 */
import { writeFileSync } from 'node:fs';
import qrcode from 'qrcode-generator';
import { EMPTY_STORE_QR, generatedFileText, qrPathFromModules } from '../src/lib/qr/build.ts';
import { checkAppStoreUrl, withAppleCampaign } from '../src/lib/launch.ts';

const OUT = new URL('../src/lib/qr/qr.generated.ts', import.meta.url);
const args = process.argv.slice(2);
const fail = (message) => {
  console.error(`qr:generate: ${message}`);
  process.exit(1);
};

if (args[0] === '--clear') {
  writeFileSync(OUT, generatedFileText(EMPTY_STORE_QR));
  console.log('Cleared: the site draws no QR.');
  process.exit(0);
}

const [rawUrl, pt] = args;
const checked = checkAppStoreUrl(rawUrl);
if (!checked.ok) fail(`not an official App Store link (${checked.detail}). Nothing written.`);
const href = withAppleCampaign(checked.url, { pt, ct: 'web-qr' });
if (!href.includes('ct=web-qr')) console.warn('qr:generate: no provider token (second argument or pt in the link), so the QR carries no campaign token. Apple counts nothing without pt.');
if (!checkAppStoreUrl(href).ok) fail('the campaign link failed the allowlist. Nothing written.');

const qr = qrcode(0, 'M');
qr.addData(href, 'Byte');
qr.make();
const { dim, path } = qrPathFromModules(qr.getModuleCount(), (r, c) => qr.isDark(r, c));
writeFileSync(OUT, generatedFileText({ url: href, dim, path }));
console.log(`Wrote src/lib/qr/qr.generated.ts: ${qr.getModuleCount()} modules, link ${href}`);
