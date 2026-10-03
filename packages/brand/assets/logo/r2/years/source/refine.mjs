import { shoot, done } from './render.mjs';
import { years } from './mark.mjs';
const OUT = '/tmp/claude-0/-home-claude/0474e45a-2c84-52d9-9895-8ca6c82c5c79/scratchpad/years';
const tag = process.argv[2];
const V = (await import('./variants-' + tag + '.mjs')).default;
const ink = '#2B2722', paper = '#FBF8F3', accent = '#8A5A3B';
const svg = (d, c, w) => `<svg viewBox="0 0 100 100" width=${w}><path fill-rule="nonzero" d="${d}" fill="${c}"/></svg>`;
const cell = (name, d) => `<div class=c><div class=big>${svg(d, ink, 240)}</div>
 <div class=row><div class=ic>${svg(d, paper, 44)}</div>
 <div class=ic style="width:29px;height:29px;border-radius:7px">${svg(d, paper, 21)}</div>
 ${svg(d, ink, 16)}<div class=ic style="background:#161412">${svg(d, '#D9A47E', 44)}</div>
 <div style="image-rendering:pixelated">${svg(d, ink, 16).replace('width=16', 'width=16 style="zoom:4"')}</div></div><p>${name}</p></div>`;
const html = `<style>body{margin:0;background:${paper};font:14px sans-serif;display:flex;flex-wrap:wrap;gap:20px;padding:20px}
.c{width:340px;background:#fff;padding:12px;border-radius:12px}.big{display:flex;justify-content:center}.row{display:flex;gap:14px;align-items:center}
.ic{width:60px;height:60px;border-radius:14px;background:${accent};display:flex;align-items:center;justify-content:center}</style>
${Object.entries(V).map(([k, p]) => cell(k, years(p))).join('')}`;
await shoot([{ html, out: `${OUT}/refine-${tag}.png`, width: 1140, height: 900, full: true }]);
await done();
