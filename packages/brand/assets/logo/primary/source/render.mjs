// Chromium rendering for the icon rasters. Same engine the approved r3 files were made with, so a rebuild is
// byte-comparable. No installs: playwright is found via PLAYWRIGHT_MODULE, the workspace, or the shared scratch copy.
import { createRequire } from 'node:module';
import { existsSync } from 'node:fs';

function loadChromium() {
  const req = createRequire(import.meta.url);
  const tries = [process.env.PLAYWRIGHT_MODULE, 'playwright', '/tmp/claude-0/-home-claude/0474e45a-2c84-52d9-9895-8ca6c82c5c79/scratchpad/node_modules/playwright'].filter(Boolean);
  for (const t of tries) { try { return req(t).chromium; } catch {} }
  throw new Error('playwright not found: set PLAYWRIGHT_MODULE to a playwright package path (no install is done here)');
}
const EXE = process.env.CHROMIUM_EXE ?? (existsSync('/opt/pw-browsers/chromium-1194/chrome-linux/chrome') ? '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' : undefined);

export async function shoot(jobs) {
  const b = await loadChromium().launch({ executablePath: EXE });
  try {
    for (const j of jobs) {
      const pg = await b.newPage({ viewport: { width: j.width, height: j.height }, deviceScaleFactor: j.scale ?? 1, colorScheme: j.colorScheme ?? 'light' });
      if (j.file) await pg.goto('file://' + j.file); else await pg.setContent(j.html, { waitUntil: 'load' });
      await pg.waitForTimeout(j.wait ?? 60);
      await pg.screenshot({ path: j.out, fullPage: !!j.fullPage, omitBackground: !!j.transparent });
      await pg.close();
    }
  } finally { await b.close(); }
}
