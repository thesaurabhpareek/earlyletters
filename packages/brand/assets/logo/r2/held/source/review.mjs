// Review sheet for a set of parameter variants. node review.mjs <name> ; variants from variants.mjs
import fs from 'node:fs'; import { shoot } from './shoot.mjs'; import { P, svgMark, deep, clearance, seat } from './mark.mjs';
const SCR = '/tmp/claude-0/-home-claude/0474e45a-2c84-52d9-9895-8ca6c82c5c79/scratchpad/held';
const { default: V } = await import('./variants.mjs?' + Date.now());
const ink = '#2B2722', paper = '#FBF8F3', accent = '#8A5A3B', night = '#161412', inkD = '#F2ECE4';

const cell = ([name, over]) => { const p0 = deep(P, over); const p = over.gap ? seat(p0, over.gap) : p0; return `<section><h2>${name} (gap ${clearance(p)})</h2><div class="row">
<div class="big">${svgMark(p, ink)}</div>
<div class="icon" style="width:150px;height:150px">${svgMark(p, paper, accent, 26)}</div>
<div class="icon" style="width:60px;height:60px">${svgMark(p, paper, accent, 26)}</div>
<div class="icon" style="width:29px;height:29px">${svgMark(p, paper, accent, 26)}</div>
<div style="width:16px;height:16px">${svgMark(p, ink)}</div>
<div class="icon" style="width:60px;height:60px">${svgMark(p, accent, night, 26)}</div>
</div></section>`; };
const out = process.argv[2] || 'rev';
fs.writeFileSync(`${SCR}/${out}.html`, `<!doctype html><style>body{margin:0;background:${paper};font:13px Georgia;display:grid;grid-template-columns:1fr 1fr}section{padding:12px 20px;border-bottom:1px solid #E6DED3}h2{margin:0 0 6px;font-size:13px}.row{display:flex;gap:16px;align-items:center}.big{width:220px;height:220px}.icon{border-radius:22%;overflow:hidden}svg{display:block;width:100%;height:100%}</style>${Object.entries(V).map(cell).join('')}`);
await shoot([{ file: `${SCR}/${out}.html`, out: `${SCR}/${out}.png`, width: 1200, height: 600, fullPage: true }]);
