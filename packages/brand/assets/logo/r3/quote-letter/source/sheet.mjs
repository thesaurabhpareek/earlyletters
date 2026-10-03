// Review sheet: each candidate as a 1024 icon (light + dark), plus true-pixel 60/29/16 renders magnified.
// cand = { name, note, icon(theme) -> inner SVG markup in a 0..1024 box }, theme = { bg, fg, sub, paper }
import fs from 'node:fs';
import { shoot } from './render.mjs';
export const SCR = '/tmp/claude-0/-home-claude-earlyletters/0474e45a-2c84-52d9-9895-8ca6c82c5c79/scratchpad/ql';
export const C = { ink: '#2B2722', inkMuted: '#6B645B', paper: '#FBF8F3', accent: '#8A5A3B', accentSoft: '#F1E6DC', inkDark: '#F2ECE4', paperDark: '#161412', paperRaisedDark: '#201D1A', accentDark: '#D9A47E', line: '#E6DED3' };
export const LIGHT = { bg: C.accent, fg: C.paper, sub: '#7A4E32', paper: C.paper, ink: C.accent };
export const DARK = { bg: '#1E1A17', fg: C.accentDark, sub: '#2A2420', paper: C.accentDark, ink: '#1E1A17' };
// superellipse n=5 (same approximation as the bench)
export function squircle(size = 1024, n = 5, steps = 200) {
  const r = size / 2, pts = [];
  for (let i = 0; i < steps; i++) { const t = (i / steps) * Math.PI * 2, c = Math.cos(t), s = Math.sin(t); pts.push(`${(r + r * Math.sign(c) * Math.abs(c) ** (2 / n)).toFixed(1)} ${(r + r * Math.sign(s) * Math.abs(s) ** (2 / n)).toFixed(1)}`); }
  return `M${pts.join('L')}Z`;
}
const SQ = squircle();
export const iconSvg = (cand, theme, px, mask = true) => `<svg xmlns="http://www.w3.org/2000/svg" width="${px}" height="${px}" viewBox="0 0 1024 1024">${mask ? `<clipPath id="q"><path d="${SQ}"/></clipPath><g clip-path="url(#q)">` : '<g>'}${cand.icon(theme)}</g></svg>`;

export async function sheet(cands, out, { cols = 1 } = {}) {
  const tmp = SCR + '/px'; fs.mkdirSync(tmp, { recursive: true });
  const jobs = [];
  cands.forEach((c, i) => { for (const px of [60, 29, 16]) for (const [tn, th] of [['l', c.light ?? LIGHT], ['d', c.dark ?? DARK]]) jobs.push({ html: `<body style="margin:0;background:${tn === 'l' ? '#fff' : '#000'}">${iconSvg(c, th, px)}</body>`, out: `${tmp}/${i}-${px}-${tn}.png`, width: px, height: px }); });
  await shoot(jobs);
  const img = (p, m) => `<img src="data:image/png;base64,${fs.readFileSync(p).toString('base64')}" style="width:${m}px;height:${m}px;image-rendering:pixelated;margin:0 8px 8px 0;vertical-align:top">`;
  let html = `<body style="margin:0;background:#EDE7DF;font:15px -apple-system,Helvetica,sans-serif;color:#444"><div style="display:grid;grid-template-columns:repeat(${cols},1fr)">`;
  cands.forEach((c, i) => {
    html += `<div style="padding:14px 18px;border-bottom:1px solid #d6cdc2"><div style="margin-bottom:6px"><b>${c.name}</b> ${c.note ?? ''}</div>
      <div style="display:flex;gap:14px;align-items:flex-start">${iconSvg(c, c.light ?? LIGHT, 300)}${iconSvg(c, c.dark ?? DARK, 300)}
      <div>${img(`${tmp}/${i}-29-l.png`, 145)}${img(`${tmp}/${i}-16-l.png`, 128)}<br>${img(`${tmp}/${i}-60-l.png`, 60)}${img(`${tmp}/${i}-29-l.png`, 29)}${img(`${tmp}/${i}-16-l.png`, 16)}${img(`${tmp}/${i}-60-d.png`, 60)}${img(`${tmp}/${i}-29-d.png`, 29)}${img(`${tmp}/${i}-16-d.png`, 16)}</div></div></div>`;
  });
  html += '</div></body>';
  await shoot([{ html, out, width: cols * 1000, height: 300, fullPage: true }]);
}
