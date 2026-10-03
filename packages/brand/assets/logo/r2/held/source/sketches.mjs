// Round-1 sketches for the `held` territory. Rough on purpose: 100x100 boxes, hand-placed beziers.
// node sketches.mjs  -> writes ../sketches/sheet.html and one PNG per sketch.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { shoot } from './shoot.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.resolve(HERE, '../sketches');
const SCR = process.env.SCRATCH || HERE;

const ink = '#2B2722', paper = '#FBF8F3', accent = '#8A5A3B';

// mirror a path drawn on the left half around x=50 (only absolute M/C/L/Q/Z, numbers in pairs)
function mirror(d) {
  return d.replace(/(-?\d*\.?\d+)\s+(-?\d*\.?\d+)/g, (_, x, y) => `${+(100 - +x).toFixed(2)} ${y}`);
}

export const SKETCHES = [
  {
    id: 's1-cradle-dot',
    name: 'Cradle book, dot',
    why: 'Reads as a person with raised arms, or a smiley; the dot is a head.',
    d: (() => {
      const L = 'M50 84 C30 84 10 68 12 44 C13 33 20 27 28 28 C24 36 23 50 29 60 C35 70 43 73 50 73 Z';
      return L + mirror(L) + 'M50 54 m-8 0 a8 8 0 1 0 16 0 a8 8 0 1 0 -16 0Z';
    })(),
  },
  {
    id: 's2-shelter-arcs',
    name: 'Large arc shelters small',
    why: 'Rainbow, sunrise, WiFi and a dozen insurance marks. No book in it at all.',
    d: 'M12 76 A38 38 0 0 1 88 76 L76 76 A26 26 0 0 0 24 76 Z M36 76 A14 14 0 0 1 64 76 Z',
  },
  {
    id: 's3-dogear-pocket',
    name: 'Dog-ear pocket',
    why: 'Pleasant, but it is a document icon; the fold reads as "file", not as being held.',
    d: 'M22 10 H70 Q78 10 78 18 V58 L54 90 H22 Q14 90 14 82 V18 Q14 10 22 10 Z M54 90 L54 66 Q54 58 62 58 H78 Z',
    extra: `<circle cx="64" cy="76" r="0"/>`,
    evenodd: false,
  },
  {
    id: 's4-parentheses',
    name: 'Two leaves around a small page',
    why: 'Reads as parentheses or code brackets; at 16px it is "( | )".',
    d: (() => {
      const L = 'M36 12 C14 26 14 74 36 88 C24 72 24 28 36 12 Z';
      return L + mirror(L) + 'M44 36 H56 Q58 36 58 38 V62 Q58 64 56 64 H44 Q42 64 42 62 V38 Q42 36 44 36 Z';
    })(),
  },
  {
    id: 's5-big-leaf-small-leaf',
    name: 'One book, a big page curls over a small page',
    why: 'Promising: one book, two pages, one leans over the other. Too busy and wave-like as drawn.',
    d: 'M42 86 C26 80 14 62 16 44 C18 24 36 12 56 14 C72 16 84 28 86 42 C78 34 66 28 54 30 C38 32 30 46 32 60 C34 72 40 80 48 86 Z M48 86 C52 74 60 64 72 58 C70 70 62 80 54 86 Z',
  },
  {
    id: 's6-book-holds-letter',
    name: 'Open book cradles a folded letter',
    why: 'Strongest idea: a small page held in the curve of a big open book. Needs simplifying.',
    d: (() => {
      const L = 'M50 88 C36 80 20 78 8 80 L8 34 C22 32 38 36 50 46 Z';
      return L + mirror(L);
    })(),
    extra: `<path fill="${paper}" d="M38 22 L62 22 L62 50 L38 50 Z" transform="rotate(-8 50 36)"/><path d="M40 24 L60 24 L60 48 L40 48 Z" transform="rotate(-8 50 36)"/>`,
  },
  {
    id: 's7-heart-gutter',
    name: 'Pages curl into the gutter, heart in the space',
    why: 'Emergent heart works, but it is the stock "book pages folded into a heart" photo; sentimental, not elite.',
    d: (() => {
      const L = 'M50 90 C40 84 22 82 8 84 L8 40 C8 26 18 16 31 16 C43 16 50 26 50 38 Z M50 76 C42 68 22 58 22 44 C22 35 27 29 34 29 C42 29 50 35 50 46 Z';
      return L + mirror(L);
    })(),
    evenodd: true,
  },
  {
    id: 's8-cradle-page',
    name: 'Open book curls round a small page',
    why: 'Chosen to develop: leaves read as a book and as arms; the small page is the letter and the child.',
    d: (() => {
      const L = 'M50 86 C28 86 9 70 11 46 C12 34 19 27 28 27 C24 36 23 50 29 61 C35 71 43 75 50 75 Z';
      return L + mirror(L) + 'M43 36 L57 34 Q60 33.6 60.4 36.6 L62.6 58 Q63 61 60 61.4 L46 63.4 Q43 63.8 42.6 60.8 L40.4 39.4 Q40 36.4 43 36 Z';
    })(),
  },
  {
    id: 's9-fanned-pages',
    name: 'Fanned pages rise around a small page',
    why: 'Reads as a book from the end and as a gathering-in, but six blades at 29px become a fan, a lotus or a crown.',
    d: (() => {
      // crescent from spine S to tip T, outer control pushed out by w
      const leaf = (tx, ty, ox, oy, w) => `M50 86 C${ox} ${oy} ${tx - 2} ${ty + 12} ${tx} ${ty} C${tx + w} ${ty + 14} ${ox + w * 2.2} ${oy - w} 50 86 Z`;
      const L = leaf(12, 34, 14, 84, 3) + leaf(24, 22, 26, 76, 3) + leaf(38, 16, 38, 68, 2.4);
      return L + mirror(L) + 'M44 44 H56 Q58 44 58 46 V60 Q58 62 56 62 H44 Q42 62 42 60 V46 Q42 44 44 44 Z';
    })(),
  },
  {
    id: 's10-page-turns-over',
    name: 'A turning page arches over a small page',
    why: 'Most book-like gesture, but the curl plus a small form reads as an ear, a wave or a snail shell.',
    d: 'M44 82 C58 74 76 72 92 76 L92 66 C76 62 58 64 44 72 Z M44 82 C30 80 14 70 12 52 C10 32 26 18 46 16 C62 15 76 24 82 36 C70 30 58 26 46 28 C30 30 22 42 24 54 C26 64 34 70 44 72 Z M54 46 L66 45 Q68 45 68.2 47 L69 59 Q69 61 67 61.2 L55 62 Q53 62 52.8 60 L52 48 Q52 46 54 46 Z',
  },
  {
    id: 's11-leaning-spines',
    name: 'A small book leans on a tall one',
    why: 'Tender and drawable, but without spine detail it is two rectangles: a bar chart, a pause icon, a domino.',
    d: 'M34 12 H52 Q56 12 56 16 V84 Q56 88 52 88 H34 Q30 88 30 84 V16 Q30 12 34 12 Z',
    extra: '<rect x="0" y="0" width="17" height="44" rx="4" transform="translate(57 46) rotate(-18)"/>',
  },
  {
    id: 's12-cradle-tapered',
    name: 'Cradle, tapered leaves, spine notch',
    why: 'Better book cue from the notch, but still a horseshoe or magnet holding a card; the embrace is a U.',
    d: (() => {
      const L = 'M50 80 C44 86 30 88 20 80 C8 70 6 50 14 36 C18 29 24 25 30 24 C24 32 21 46 24 58 C27 69 38 74 50 72 Z';
      return L + mirror(L) + 'M44 40 H56 Q58 40 58 42 V60 Q58 62 56 62 H44 Q42 62 42 60 V42 Q42 40 44 40 Z';
    })(),
  },
  {
    id: 's13-two-leaves-a-side',
    name: 'Two pages a side, curled in, pointed spine',
    why: 'The pointed spine and paired leaves read as a tulip or lotus before they read as a book.',
    d: (() => {
      const L = 'M50 88 C30 80 12 64 12 44 C12 34 17 26 25 22 C22 34 24 50 34 64 C40 72 46 78 50 82 Z M50 80 C38 70 30 56 31 42 C31 36 34 31 38 28 C37 40 41 56 50 68 Z';
      return L + mirror(L) + 'M45 44 H55 Q57 44 57 46 V58 Q57 60 55 60 H45 Q43 60 43 58 V46 Q43 44 45 44 Z';
    })(),
  },
];

function svg(s, color = ink, bg = 'none', pad = 0) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${-pad} ${-pad} ${100 + 2 * pad} ${100 + 2 * pad}"><rect x="${-pad}" y="${-pad}" width="${100 + 2 * pad}" height="${100 + 2 * pad}" fill="${bg}"/><g fill="${color}"><path fill-rule="${s.evenodd ? 'evenodd' : 'nonzero'}" d="${s.d}"/>${s.extra || ''}</g></svg>`;
}

const cell = (s) => `
<section id="${s.id}">
  <h2>${s.name}</h2>
  <div class="row">
    <div class="big">${svg(s)}</div>
    <div class="icon" style="width:180px;height:180px">${svg(s, paper, accent, 30)}</div>
    <div class="icon" style="width:60px;height:60px">${svg(s, paper, accent, 30)}</div>
    <div class="icon" style="width:29px;height:29px">${svg(s, paper, accent, 30)}</div>
    <div style="width:16px;height:16px">${svg(s)}</div>
  </div>
  <p>${s.why}</p>
</section>`;

const html = `<!doctype html><meta charset="utf-8"><style>
body{margin:0;background:${paper};font:14px/1.4 Georgia,serif;color:${ink}}
section{padding:24px 32px;border-bottom:1px solid #E6DED3;width:820px}
h2{margin:0 0 12px;font-size:16px}.row{display:flex;gap:28px;align-items:center}
.big{width:300px;height:300px}.icon{border-radius:22%;overflow:hidden}svg{display:block;width:100%;height:100%}
p{margin:12px 0 0;color:#6B645B}
</style>${SKETCHES.map(cell).join('')}`;

fs.writeFileSync(path.join(SCR, 'sheet.html'), html);
await shoot(SKETCHES.map((s) => ({ file: path.join(SCR, 'sheet.html'), out: path.join(OUT, `${s.id}.png`), width: 900, height: 2400, selector: '#' + s.id })));
console.log('sketches done');
