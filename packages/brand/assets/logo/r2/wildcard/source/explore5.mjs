// Exploration 5: open hooks that read as two crooked little fingers; plus a refined mobile and lamp-over-page.
import { C, render, sheetHtml, write } from './lib.mjs';
const SP = process.argv[2];
const wrap = (b, fg, bg) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1000">${b.replaceAll('FG', fg).replaceAll('BG', bg)}</svg>`;
const st = (d, w, col = 'FG') => `<path d="${d}" fill="none" stroke="${col}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`;
const over = (d, w, g) => st(d, w + 2 * g, 'BG') + st(d, w);

// Hooks with wide openings: each finger is a straight then a 3/4 curl. Big hook opens down, small opens up.
function hooks({ R = 150, r = 105, W = 110, w = 80, gap = 24, dx = 0 } = {}) {
  // big: from left at y=330, along to cx, curls clockwise down and back left.
  const cx = 470 + dx, cy = 330 + R; // big centre
  const big = `M60 330 L${cx} 330 A${R} ${R} 0 0 1 ${cx + R} ${cy} A${R} ${R} 0 0 1 ${cx + R * 0.5} ${cy + R * 0.866}`;
  const bigFront = `M${cx + R} ${cy} A${R} ${R} 0 0 1 ${cx + R * 0.5} ${cy + R * 0.866}`;
  // small: from right at y = sy, along leftwards, curls clockwise up and back right.
  const sx = cx + R * 0.15, sy = cy + R - 10 + r; // small bottom line
  const scy = sy - r;
  const small = `M940 ${sy} L${sx} ${sy} A${r} ${r} 0 0 1 ${sx - r} ${scy} A${r} ${r} 0 0 1 ${sx - r * 0.5} ${scy - r * 0.866}`;
  return st(small, w) + over(big, W, gap) + over(`M${sx - r} ${scy} A${r} ${r} 0 0 1 ${sx - r * 0.5} ${scy - r * 0.866}`, w, gap);
}
// Mobile, Calder-like: one curved arm, a big leaf and a small disc, hung from a single point.
const mobile = `${st('M500 90 L500 300', 22)}${st('M180 380 Q500 220 830 330', 30)}<path fill="FG" d="M180 380 m-150 140 a150 150 0 1 0 300 0 a150 150 0 1 0 -300 0"/>${st('M180 380 L180 400', 22)}${st('M830 330 L830 560', 16)}<circle cx="830" cy="620" r="70" fill="FG"/>`;
// Lamp over a page: shade above, the pool of light is the page.
const lampPage = `<path fill="FG" d="M390 120 L610 120 L700 360 L300 360 Z"/><path fill="FG" d="M300 430 L700 430 L820 860 L180 860 Z" opacity="1"/><path fill="BG" d="M300 430 L700 430 L820 860 L180 860 Z" transform="translate(0 0) scale(1)" opacity="0"/>`;
const list = [
  ['Hooks wide', 'R150 r105', hooks()],
  ['Hooks wide, closer', 'dx -40', hooks({ R: 140, r: 100, W: 120, w: 84 })],
  ['Hooks, slender', 'thinner fingers', hooks({ R: 150, r: 110, W: 90, w: 64, gap: 20 })],
  ['Mobile', 'one arm, big and small', mobile],
  ['Lamp over a page', 'shade and its light', lampPage],
];
const marks = list.map(([name, note, b]) => ({ name, note, ink: wrap(b, C.ink, C.paper), rev: wrap(b, C.paper, C.accent) }));
write(SP + '/e5.html', sheetHtml(marks, 'Exploration 5'));
await render([{ file: SP + '/e5.html', out: SP + '/e5.png', width: 1200, height: 900, fullPage: true, wait: 500 }]);
console.log('ok');
