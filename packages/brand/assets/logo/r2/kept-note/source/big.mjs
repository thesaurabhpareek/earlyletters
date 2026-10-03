// Render one variant very large to judge curves. node big.mjs '<json params>' out.png
import path from 'node:path';
import { render, svg, C, OUT } from './lib.mjs';
import { mark as raw, fit } from './mark.mjs';
const p = JSON.parse(process.argv[2]);
const d = fit(raw(p), p.fitH ?? 760);
const html = `<body style="margin:0;background:${C.paper}"><div style="display:flex">${svg(d, { fill: C.ink }).replace('<svg ', '<svg width="900" height="900" ')}${svg(d, { fill: C.paper, bg: C.accent }).replace('<svg ', '<svg width="300" height="300" ')}</div></body>`;
await render([{ html, out: path.join(OUT, 'sketches', process.argv[3]), width: 1200, height: 900 }]);
console.log(d.length, 'chars');
