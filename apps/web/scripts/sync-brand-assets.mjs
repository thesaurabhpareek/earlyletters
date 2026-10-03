// Copies brand assets the site serves as files (favicons, web manifest) from
// packages/brand/assets into public/, so there is one source of truth (B3).
// Runs before dev and build. The copies are git-ignored.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const brandAssets = path.resolve(here, '../../../packages/brand/assets');
const pub = path.resolve(here, '../public');

const jobs = [{ from: 'favicon', to: 'favicon' }];

for (const { from, to } of jobs) {
  const src = path.join(brandAssets, from);
  const dest = path.join(pub, to);
  if (!fs.existsSync(src)) {
    console.warn(`[brand-assets] ${from}/ not found, skipped`);
    continue;
  }
  fs.rmSync(dest, { recursive: true, force: true });
  fs.cpSync(src, dest, { recursive: true });
  console.log(`[brand-assets] ${from}/ -> public/${to}/`);
}
