// Render HTML/SVG files to PNG with Playwright Chromium so every round can be looked at.
// Usage: node shoot.mjs <in.html> <out.png> [width] [height] [fullPage 0|1] [scale]
// Playwright is not a repo dependency; point PW_PATH at an install (defaults to the session scratchpad).
import { createRequire } from 'node:module';
import path from 'node:path';

const PW = process.env.PW_PATH || '/tmp/claude-0/-home-claude/0474e45a-2c84-52d9-9895-8ca6c82c5c79/scratchpad/node_modules/playwright';
const require = createRequire(import.meta.url);
const { chromium } = require(PW);

export async function shoot(jobs) {
  const browser = await chromium.launch({ executablePath: process.env.PW_CHROMIUM || '/opt/pw-browsers/chromium' });
  for (const j of jobs) {
    const page = await browser.newPage({ viewport: { width: j.width || 1200, height: j.height || 800 }, deviceScaleFactor: j.scale || 1, colorScheme: j.scheme || 'light' });
    await page.goto('file://' + path.resolve(j.file));
    await page.waitForTimeout(j.wait ?? 150);
    if (j.selector) await page.locator(j.selector).screenshot({ path: j.out, omitBackground: !!j.transparent });
    else await page.screenshot({ path: j.out, fullPage: !!j.fullPage, omitBackground: !!j.transparent });
    await page.close();
  }
  await browser.close();
}

if (process.argv[1] && process.argv[1].endsWith('shoot.mjs') && process.argv[2]) {
  const [, , file, out, w, h, fp, sc] = process.argv;
  await shoot([{ file, out, width: +w || 1200, height: +h || 800, fullPage: fp === '1', scale: +sc || 1 }]);
  console.log('shot', out);
}
