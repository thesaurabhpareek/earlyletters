// Round 0: quick sketches in the moon-letter territory. Sketch-grade SVG (primitives allowed here only).
import { shoot } from './render.mjs';
import fs from 'node:fs';
const INK = '#2B2722', PAPER = '#FBF8F3', ACC = '#8A5A3B';
const S = {
  // 1. Closed envelope; the flap edge is a crescent (horns at the top corners)
  'flap-crescent': (f, g) => `<rect x="8" y="22" width="84" height="58" rx="7" fill="${f}"/>
    <path d="M12 25 Q50 72 88 25 Q50 52 12 25Z" fill="${g}"/>`,
  // 2. Crescent cradle holding a small envelope
  'cradle': (f, g) => `<g transform="rotate(-12 50 50)"><path d="M10 48 A40 40 0 0 0 90 48 A44 30 0 0 1 10 48Z" fill="${f}"/></g>
    <g transform="rotate(-12 50 50)"><rect x="32" y="30" width="36" height="25" rx="3" fill="${f}"/><path d="M33.5 31.5 L50 44 L66.5 31.5" fill="none" stroke="${g}" stroke-width="2.6" stroke-linejoin="round"/></g>`,
  // 3. Open envelope, crescent rising out of it
  'moon-inside': (f, g) => `<path d="M10 46 L50 74 L90 46 L90 86 Q90 90 86 90 L14 90 Q10 90 10 86Z" fill="${f}"/>
    <path d="M10 46 L50 74 L90 46" fill="none" stroke="${f}" stroke-width="3"/>
    <path d="M42 12 A26 26 0 1 0 72 56 A20 20 0 1 1 42 12Z" fill="${f}"/>`,
  // 4. Moon behind the letter
  'moon-behind': (f, g) => `<path d="M58 8 A30 30 0 1 0 92 50 A23 23 0 1 1 58 8Z" fill="${f}"/>
    <rect x="6" y="40" width="68" height="48" rx="6" fill="${f}" stroke="${g}" stroke-width="5" paint-order="stroke"/>
    <path d="M9 43 L40 66 L71 43" fill="none" stroke="${g}" stroke-width="3.2" stroke-linejoin="round"/>`,
  // 5. Envelope whose open flap is a crescent over it
  'flap-arch': (f, g) => `<rect x="10" y="48" width="80" height="42" rx="6" fill="${f}"/>
    <path d="M12 46 A40 40 0 0 1 88 46 A44 30 0 0 0 12 46Z" fill="${f}"/>`,
  // 6. A page whose folded corner is a crescent
  'page-fold': (f, g) => `<path d="M22 8 L62 8 Q78 14 80 30 L80 88 Q80 92 76 92 L22 92 Q18 92 18 88 L18 12 Q18 8 22 8Z" fill="${f}"/>
    <path d="M60 10 Q60 30 78 32 Q66 22 60 10Z" fill="${g}"/>`,
  // 7. Tilted crescent with a folded note tucked in its hollow
  'tucked-note': (f, g) => `<path d="M46 6 A44 44 0 1 0 94 70 A34 34 0 1 1 46 6Z" fill="${f}"/>
    <g transform="rotate(14 60 48)"><rect x="46" y="36" width="30" height="22" rx="2.5" fill="${f}"/><path d="M47.5 37.5 L61 48 L74.5 37.5" fill="none" stroke="${g}" stroke-width="2.4"/></g>`,
};
const cell = (name, fn) => {
  const svg = (f, g, sz) => `<svg width="${sz}" height="${sz}" viewBox="0 0 100 100">${fn(f, g)}</svg>`;
  return `<div class="c"><div class="big">${svg(INK, PAPER, 220)}</div>
  <div class="row"><div class="tile">${svg(PAPER, ACC, 40)}</div>${svg(INK, PAPER, 60)}${svg(INK, PAPER, 29)}${svg(INK, PAPER, 16)}
  <img src="data:image/svg+xml;base64,${Buffer.from(svg(INK, PAPER, 16).replace('<svg ', '<svg xmlns="http://www.w3.org/2000/svg" ')).toString('base64')}" style="width:16px;height:16px;image-rendering:pixelated;transform:scale(4);transform-origin:left;margin-left:8px"></div>
  <p>${name}</p></div>`;
};
const only = process.argv[2];
const html = `<body style="margin:0;background:${PAPER};font:14px system-ui;display:flex;flex-wrap:wrap;gap:16px;padding:16px">
<style>.c{width:260px}.row{display:flex;align-items:center;gap:10px}.tile{background:${ACC};border-radius:10px;padding:10px;line-height:0}</style>
${Object.entries(S).filter(([k]) => !only || k === only).map(([k, f]) => cell(k, f)).join('')}</body>`;
export { S };
if (process.argv[1].endsWith('sketches.mjs')) await shoot([{ html, out: process.argv[3] || '/tmp/claude-0/-home-claude/0474e45a-2c84-52d9-9895-8ca6c82c5c79/scratchpad/sk.png', width: 1150, height: 700, fullPage: true }]);
