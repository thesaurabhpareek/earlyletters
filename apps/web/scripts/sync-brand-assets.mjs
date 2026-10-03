// Copies every brand asset the site serves as a file into public/, at the URL the brand registry gives it
// (packages/brand/registry.json, field `url`): favicons and web manifest (/favicon/), email logos (/email/,
// loaded by every email we send), and the Open Graph image (/og/). One source of truth: packages/brand.
// Runs before dev and build. The copies are git-ignored.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '../../..');
const pub = path.resolve(here, '../public');
const registry = JSON.parse(fs.readFileSync(path.join(root, 'packages/brand/registry.json'), 'utf8'));

const served = registry.assets.filter((a) => a.url && a.path && a.status === 'primary');
const dirs = new Set(served.map((a) => a.url.split('/')[1]));

// Start each served folder clean, so a file dropped from the registry stops being served.
for (const d of dirs) fs.rmSync(path.join(pub, d), { recursive: true, force: true });

let n = 0;
for (const a of served) {
  const src = path.join(root, a.path);
  const dest = path.join(pub, a.url);
  if (!fs.existsSync(src)) throw new Error(`[brand-assets] ${a.id}: ${a.path} is missing (run node packages/brand/scripts/build-touchpoints.mjs)`);
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(src, dest);
  n++;
}
console.log(`[brand-assets] ${n} registry assets -> public/{${[...dirs].join(',')}}/`);
