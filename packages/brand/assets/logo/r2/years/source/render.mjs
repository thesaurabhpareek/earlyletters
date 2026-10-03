// Render HTML files (or HTML strings) to PNG with Playwright Chromium.
import { createRequire } from 'node:module';
const require = createRequire('/tmp/claude-0/-home-claude/0474e45a-2c84-52d9-9895-8ca6c82c5c79/scratchpad/node_modules/');
const { chromium } = require('playwright');
process.env.PLAYWRIGHT_BROWSERS_PATH ||= '/opt/pw-browsers';
let browser;
export async function shoot(jobs) {
  browser ||= await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  for (const j of jobs) {
    const p = await browser.newPage({ viewport: { width: j.width || 1200, height: j.height || 800 }, colorScheme: j.scheme || 'light', deviceScaleFactor: j.dpr || 1 });
    if (j.html) await p.setContent(j.html); else await p.goto('file://' + j.file);
    await p.waitForTimeout(j.wait || 200);
    await p.screenshot({ path: j.out, fullPage: !!j.full, omitBackground: !!j.transparent });
    await p.close();
  }
}
export async function done() { if (browser) await browser.close(); }
