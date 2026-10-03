// Lineup: every tile candidate on ONE home screen among the same colourful neighbours, on four wallpapers.
// Usage: node .../lineup.mjs <symbol.svg> <tag> [--scale 0.56]
import { mkdirSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { appearances, measureSymbol, BASE_CSS, neighbourTile, NEIGHBOURS, ourIcon, wallpaper } from './bench-fixed.mjs';
import { TILES } from './colors.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const [symbol, tag, , scaleArg] = process.argv.slice(2);
const PNG = join(HERE, '..', 'png', tag); mkdirSync(PNG, { recursive: true });
const req = createRequire(import.meta.url);
const { chromium } = req('/tmp/claude-0/-home-claude/0474e45a-2c84-52d9-9895-8ca6c82c5c79/scratchpad/node_modules/playwright');
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const m = await browser.newPage({ viewport: { width: 1200, height: 1200 } });
const sym = await measureSymbol(m, readFileSync(resolve(symbol), 'utf8'), { scale: scaleArg ?? 0.56 });
const bgCss = (t) => (t.top === t.bot ? t.top : `linear-gradient(180deg, ${t.top}, ${t.bot})`);
const short = { 't0-flat-current': 'Current', 't1-flat-deep': 'Deep', 't2-grad-critic': 'Grad A', 't3-grad-deep': 'Grad B', 't4-grad-leather': 'Leather', 'p-paper': 'Paper', 'n-ink': 'Ink', 't5-grad-leather-token': 'Leather T' };
const ours = TILES.map((t) => ({ label: short[t.id], html: ourIcon(sym, appearances({ bg: bgCss(t), fg: t.fg, darkBg: '#1F1B18', darkFg: '#D9A47E', tint: '#E3A35A' }), 'default'), ours: true }));
const WALL = {
  'light-gradient': [wallpaper('default'), '#fff'],
  'dark-photo': ['radial-gradient(90% 60% at 30% 20%,#355a4a 0%,#14231d 55%,#070b09 100%)', '#fff'],
  'pale-neutral': ['linear-gradient(180deg,#f4f4f2,#dcdcd8)', 'rgba(20,20,20,.86)'],
  'warm-beige': ['linear-gradient(170deg,#e7d6bf,#c9a985)', 'rgba(20,20,20,.86)'],
};
const W = 402, H = 640, ICON = 60, side = 30, cols = 4, gap = (W - 2 * side - cols * ICON) / (cols - 1);
const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 3 });
for (const [name, [wp, lab]] of Object.entries(WALL)) {
  const n = (i) => ({ ...neighbourTile(NEIGHBOURS[i], 'default', {}), label: NEIGHBOURS[i][0] });
  // rows: neighbours / 4 candidates / neighbours / 3 candidates + neighbour / neighbours
  const grid = [n(0), n(1), n(2), n(5), ours[0], ours[1], ours[3], ours[4], n(7), ours[2], n(9), n(11), ours[5], ours[6], ours[7], n(13), n(15), n(16), n(17), n(18)];
  const cells = grid.map((t, i) => { const c = i % cols, r = Math.floor(i / cols); return `<div class="app" style="left:${side + c * (ICON + gap)}px;top:${40 + r * 98}px"><div class="iw">${t.html}</div><div class="lb">${t.label}</div></div>`; }).join('');
  await page.setContent(`<!doctype html><html><head><style>${BASE_CSS}
    html,body{width:${W}px;height:${H}px;overflow:hidden}.scr{position:relative;width:${W}px;height:${H}px;background:${wp}}
    .app{position:absolute;width:${ICON}px;display:flex;flex-direction:column;align-items:center}
    .iw{width:${ICON}px;height:${ICON}px;font-size:${ICON}px;filter:drop-shadow(0 1px 2px rgba(0,0,0,.18))}
    .lb{margin-top:6px;font-size:11.5px;font-weight:500;color:${lab};white-space:nowrap}</style></head><body><div class="scr">${cells}</div></body></html>`);
  await page.waitForTimeout(150);
  await page.screenshot({ path: join(PNG, `lineup-${name}.png`) });
}
await browser.close();
console.log('lineups ->', PNG);
