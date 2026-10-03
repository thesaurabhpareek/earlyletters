// Headless Chromium render helper. Usage: await shoot([{html|file, out, width, height, fullPage, scale}])
import path from 'node:path';
const PW = '/tmp/claude-0/-home-claude/0474e45a-2c84-52d9-9895-8ca6c82c5c79/scratchpad/node_modules/playwright/index.mjs';
export async function shoot(jobs) {
  const { chromium } = await import(PW);
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
  for (const j of jobs) {
    const page = await browser.newPage({ viewport: { width: j.width || 1200, height: j.height || 800 }, deviceScaleFactor: j.scale || 1 });
    if (j.html) await page.setContent(j.html); else await page.goto('file://' + path.resolve(j.file));
    await page.waitForTimeout(j.wait || 100);
    await page.screenshot({ path: j.out, fullPage: !!j.fullPage, omitBackground: !!j.transparent });
    await page.close();
  }
  await browser.close();
}
