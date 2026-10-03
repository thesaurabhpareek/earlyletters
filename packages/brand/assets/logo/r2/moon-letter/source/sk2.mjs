import { shoot } from './render.mjs';
const INK = '#2B2722', PAPER = '#FBF8F3', ACC = '#8A5A3B';
// crescent: outer circle (cx,cy,R), inner circle offset (dx,dy) radius r. Draw with evenodd mask trick via path.
function crescent(cx, cy, R, dx, dy, rr) {
  // intersections
  const x2 = cx + dx, y2 = cy + dy, d = Math.hypot(dx, dy);
  const a = (R * R - rr * rr + d * d) / (2 * d), h = Math.sqrt(R * R - a * a);
  const mx = cx + a * dx / d, my = cy + a * dy / d;
  const p1 = [mx + h * dy / d, my - h * dx / d], p2 = [mx - h * dy / d, my + h * dx / d];
  return `M${p1} A${R} ${R} 0 1 0 ${p2} A${rr} ${rr} 0 1 1 ${p1}Z`;
}
export const S = {
  'open-moon': (f, g) => `
    <path d="M14 44 L50 14 L86 44Z" fill="${f}"/>
    <path d="${crescent(48, 44, 24, 12, -8, 21)}" fill="${f}" stroke="${g}" stroke-width="4" paint-order="stroke"/>
    <path d="M12 44 L50 70 L88 44 L88 84 Q88 88 84 88 L16 88 Q12 88 12 84Z" fill="${f}" stroke="${g}" stroke-width="4" paint-order="stroke"/>`,
  'pocket-moon': (f, g) => `
    <path d="${crescent(50, 42, 26, 13, -9, 22)}" fill="${f}"/>
    <path d="M10 46 L50 72 L90 46 L90 85 Q90 90 85 90 L15 90 Q10 90 10 85Z" fill="${f}" stroke="${g}" stroke-width="5" paint-order="stroke"/>`,
  'tuck-in': (f, g) => `
    <path d="${crescent(50, 46, 42, 10, -16, 38)}" fill="${f}"/>
    <g transform="rotate(-18 54 46)"><rect x="38" y="30" width="34" height="24" rx="2.5" fill="${f}" stroke="${g}" stroke-width="4" paint-order="stroke"/><path d="M39.5 31.5 L55 43 L70.5 31.5" fill="none" stroke="${g}" stroke-width="2.6"/></g>`,
  'moon-letter-fused': (f, g) => `
    <path d="${crescent(44, 50, 40, 18, -12, 34)}" fill="${f}"/>
    <path d="M44 54 L90 54 L90 86 Q90 90 86 90 L48 90 Q44 90 44 86Z" fill="${f}"/>
    <path d="M45 55 L67 70 L89 55" fill="none" stroke="${g}" stroke-width="3"/>`,
  'sealed-moon': (f, g) => `
    <rect x="8" y="22" width="84" height="58" rx="6" fill="${f}"/>
    <path d="M10 24 L50 56 L90 24" fill="none" stroke="${g}" stroke-width="3.4"/>
    <path d="${crescent(50, 38, 11, 5, -4, 9.5)}" fill="${g}"/>`,
};
const cell = (name, fn) => {
  const svg = (f, g, sz) => `<svg xmlns="http://www.w3.org/2000/svg" width="${sz}" height="${sz}" viewBox="0 0 100 100">${fn(f, g)}</svg>`;
  return `<div class="c"><div class="big">${svg(INK, PAPER, 220)}</div>
  <div class="row"><div class="tile">${svg(PAPER, ACC, 40)}</div>${svg(INK, PAPER, 60)}${svg(INK, PAPER, 29)}${svg(INK, PAPER, 16)}
  <img src="data:image/svg+xml;base64,${Buffer.from(svg(INK, PAPER, 16)).toString('base64')}" style="width:16px;height:16px;image-rendering:pixelated;transform:scale(4);transform-origin:left;margin-left:8px"></div><p>${name}</p></div>`;
};
const html = `<body style="margin:0;background:${PAPER};font:14px system-ui;display:flex;flex-wrap:wrap;gap:16px;padding:16px">
<style>.c{width:260px}.row{display:flex;align-items:center;gap:10px}.tile{background:${ACC};border-radius:10px;padding:10px;line-height:0}</style>
${Object.entries(S).map(([k, f]) => cell(k, f)).join('')}</body>`;
if (process.argv[1].endsWith("sk2.mjs")) await shoot([{ html, out: process.argv[2], width: 1150, height: 700, fullPage: true }]);
