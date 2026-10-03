// Exports each rejected sketch as its own PNG into ../sketches/.
import { shoot } from './render.mjs';
const INK = '#2B2722', PAPER = '#FBF8F3', ACC = '#8A5A3B';
const mods = [await import('./sketches.mjs'), await import('./sk2.mjs?x')].map((m) => m.S || {});
const all = Object.assign({}, ...mods);
const pick = process.argv.slice(2);
const jobs = pick.map((k) => {
  const fn = all[k];
  const svg = (f, g, sz) => `<svg xmlns="http://www.w3.org/2000/svg" width="${sz}" height="${sz}" viewBox="0 0 100 100">${fn(f, g)}</svg>`;
  const html = `<body style="margin:0;background:${PAPER};font:13px system-ui;padding:16px;width:330px"><div>${svg(INK, PAPER, 240)}</div>
  <div style="display:flex;align-items:center;gap:10px"><div style="background:${ACC};border-radius:13px;width:60px;height:60px;display:grid;place-items:center">${svg(PAPER, ACC, 42)}</div>${svg(INK, PAPER, 29)}${svg(INK, PAPER, 16)}</div><p>${k}</p></body>`;
  return { html, out: `../sketches/${k}.png`, width: 362, height: 380 };
});
await shoot(jobs);
