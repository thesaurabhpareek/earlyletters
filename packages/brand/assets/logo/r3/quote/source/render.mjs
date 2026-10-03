// Playwright Chromium screenshot helper (no installs: shared scratch module).
export const S = '/tmp/claude-0/-home-claude/0474e45a-2c84-52d9-9895-8ca6c82c5c79/scratchpad';
export async function shoot(jobs) {
  const { chromium } = await import(S + '/node_modules/playwright/index.mjs');
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
  try {
    for (const j of jobs) {
      const pg = await b.newPage({ viewport: { width: j.width, height: j.height }, deviceScaleFactor: j.scale ?? 1, colorScheme: j.colorScheme ?? 'light' });
      if (j.file) await pg.goto('file://' + j.file); else await pg.setContent(j.html, { waitUntil: 'load' });
      await pg.waitForTimeout(j.wait ?? 50);
      await pg.screenshot({ path: j.out, fullPage: !!j.fullPage, omitBackground: !!j.transparent });
      await pg.close();
    }
  } finally { await b.close(); }
}
