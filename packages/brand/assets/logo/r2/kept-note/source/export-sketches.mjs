// Splits the sketch sheets into one PNG per rejected exploration (sketches/<n>-<slug>.png).
import fs from 'node:fs';
import path from 'node:path';
import { OUT } from './lib.mjs';
const PW = '/tmp/claude-0/-home-claude/0474e45a-2c84-52d9-9895-8ca6c82c5c79/scratchpad/node_modules/playwright/index.mjs';
const { chromium } = await import(PW);
const dir = path.join(OUT, 'sketches');
const sheets = fs.readdirSync(dir).filter((f) => /^_sheet\d+\.html$/.test(f)).sort((a, b) => parseInt(a.match(/\d+/)) - parseInt(b.match(/\d+/)) || a.localeCompare(b));
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const page = await browser.newPage({ viewport: { width: 1100, height: 800 } });
const made = [];
for (const s of sheets) {
  await page.goto('file://' + path.join(dir, s));
  await page.waitForTimeout(250);
  const cells = await page.$$('.c');
  for (const c of cells) {
    const label = (await c.$eval('.lbl', (e) => e.textContent)).trim();
    const slug = label.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60);
    const name = `${s.startsWith('_iter') ? 'round' : 'sketch'}-${s.match(/\d+/)[0]}-${slug}.png`;
    await c.screenshot({ path: path.join(dir, name) });
    made.push(name);
  }
}
await browser.close();
console.log(made.join('\n'));
