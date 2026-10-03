// Write temporary symbol and background SVGs for the icon bench.
import fs from 'node:fs';
import { pair, fit, toD } from './quote.mjs';
import { pageIcon } from './s3.mjs';
import { SCR, C } from './sheet.mjs';
const d = toD(fit(pair(), { cx: 506, cy: 512, h: 500 }));
fs.writeFileSync(SCR + '/b-pair.svg', `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024"><path d="${d}"/></svg>`);
fs.writeFileSync(SCR + '/b-grad.svg', `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024"><defs><linearGradient id="g" x2="0" y2="1"><stop offset="0" stop-color="#94603F"/><stop offset="1" stop-color="#7C4F33"/></linearGradient></defs><rect width="1024" height="1024" fill="url(#g)"/></svg>`);
const pg = pageIcon({ pg: C.paper, mk: 'none', under: C.accent, flap: C.accentSoft }, { f: 330 }).replace(/<path fill="none"[^>]*\/>/, '');
fs.writeFileSync(SCR + '/b-page.svg', `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024">${pg}</svg>`);
