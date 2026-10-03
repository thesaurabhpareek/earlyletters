// Round 13: the cut. Flat (0.15) vs calm (0.45) vs soft (0.7); at 1024 the flat cut's corners look sharp.
import { pair, fit, toD } from './quote.mjs';
import { shoot } from './render.mjs';
import { SCR } from './sheet.mjs';
let cells = '';
for (const cap of [0.15, 0.45, 0.7]) {
  const d = toD(fit(pair({ cap }), { cx: 300, cy: 300, h: 520 }));
  cells += `<div style="display:inline-block;margin:8px;font:14px sans-serif">cap ${cap}<br><svg width="600" height="600" style="background:#8A5A3B"><path fill="#FBF8F3" d="${d}"/></svg></div>`;
}
await shoot([{ html: `<body style="margin:0;background:#ddd">${cells}</body>`, out: SCR + '/r13.png', width: 1880, height: 640 }]);
