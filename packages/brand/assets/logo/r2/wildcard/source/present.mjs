// Generates ../presentation.html (self-contained: every mark inlined as data URIs) and a screenshot for review.
// Usage: node present.mjs [version-label]
import fs from 'node:fs';
import path from 'node:path';
import { C, OUT, write, render, dataUri } from './lib.mjs';

const VERSION = process.argv[2] || 'v1';
const rd = (p) => fs.readFileSync(path.join(OUT, p), 'utf8');
const sym = rd('symbol.svg'), symS = rd('symbol-small.svg'), rev = rd('symbol-reversed.svg');
const lockH = rd('lockup-horizontal.svg'), lockS = rd('lockup-stacked.svg');
const lockSmall = fs.existsSync(path.join(OUT, 'source/out/lockup-horizontal-small.svg')) ? rd('source/out/lockup-horizontal-small.svg') : lockH;
const recolor = (svg, from, to) => svg.replaceAll(`fill="${from}"`, `fill="${to}"`);
const icon = (size, dark = false) => { // app icon: accent field, paper mark; small cut at 40 and under
  const src = size <= 40 ? symS : sym; const fg = dark ? C.accentDark : C.paper, bg = dark ? '#2A2420' : C.accent;
  return `<div class="ic" style="width:${size}px;height:${size}px;border-radius:${size * 0.2237}px;background:${bg}"><img src="${dataUri(recolor(src, C.ink, fg))}" style="width:${Math.round(size * (size <= 40 ? 0.78 : 0.74))}px"></div>`;
};
// Neighbour icons for the home-screen mock: generic glyphs, not real brands.
const nb = [
  ['Camera', '#8E8E93', '<circle cx="50" cy="52" r="20" fill="none" stroke="#fff" stroke-width="7"/><rect x="22" y="30" width="56" height="44" rx="9" fill="none" stroke="#fff" stroke-width="6"/>'],
  ['Clock', '#1C1C1E', '<circle cx="50" cy="50" r="32" fill="#fff"/><path d="M50 50V28M50 50l14 10" stroke="#1C1C1E" stroke-width="5" stroke-linecap="round"/>'],
  ['Weather', 'linear-gradient(#4A90E2,#2D6CC0)', '<circle cx="42" cy="44" r="14" fill="#FFD54A"/><ellipse cx="56" cy="60" rx="22" ry="12" fill="#fff"/>'],
  ['Notes', '#fff', '<rect x="0" y="0" width="100" height="26" fill="#F7C744"/><path d="M18 46h64M18 60h64M18 74h40" stroke="#C7C7CC" stroke-width="4"/>'],
  ['Calendar', '#fff', '<text x="50" y="30" font-size="16" text-anchor="middle" fill="#E5463A" font-family="-apple-system,Helvetica" font-weight="600">SAT</text><text x="50" y="76" font-size="44" text-anchor="middle" fill="#111" font-family="-apple-system,Helvetica">3</text>'],
  ['Music', 'linear-gradient(#FA5C75,#F33A4F)', '<path d="M40 70V32l30-6v38" stroke="#fff" stroke-width="6" fill="none"/><circle cx="34" cy="70" r="8" fill="#fff"/><circle cx="64" cy="64" r="8" fill="#fff"/>'],
  ['Maps', 'linear-gradient(135deg,#9ED67A,#5EB0E5)', '<path d="M20 80L80 20" stroke="#fff" stroke-width="10"/><circle cx="64" cy="38" r="8" fill="#E5463A"/>'],
  ['Books', 'linear-gradient(#FF9F2E,#F57C00)', '<path d="M22 30q14-6 28 2v42q-14-8-28-2zM78 30q-14-6-28 2v42q14-8 28-2z" fill="#fff"/>'],
  ['Health', '#fff', '<path d="M50 74C30 60 22 50 22 40a14 14 0 0 1 28-4 14 14 0 0 1 28 4c0 10-8 20-28 34z" fill="#FF3B5C"/>'],
  ['Wallet', '#111', '<rect x="20" y="30" width="60" height="16" rx="4" fill="#5AC8FA"/><rect x="20" y="40" width="60" height="16" rx="4" fill="#FFCC00"/><rect x="20" y="50" width="60" height="22" rx="4" fill="#4CD964"/>'],
  ['Settings', '#8E8E93', '<circle cx="50" cy="50" r="24" fill="none" stroke="#fff" stroke-width="9" stroke-dasharray="7 5"/><circle cx="50" cy="50" r="9" fill="#fff"/>'],
];
const nbIcon = ([name, bg, g], size) => `<div class="app"><div class="ic" style="width:${size}px;height:${size}px;border-radius:${size * 0.2237}px;background:${bg};overflow:hidden"><svg viewBox="0 0 100 100" width="${size}" height="${size}">${g}</svg></div><span>${name}</span></div>`;
const home = (dark) => {
  const s = 60; const ours = `<div class="app">${icon(s, false)}<span>Early Letters</span></div>`;
  const cells = [...nb.slice(0, 6).map((n) => nbIcon(n, s)), ours, ...nb.slice(6).map((n) => nbIcon(n, s))];
  return `<div class="phone ${dark ? 'dark' : ''}"><div class="grid">${cells.join('')}</div></div>`;
};
const zoomCanvas = (id, svg, size, bg) => `<canvas id="${id}" width="${size * 8}" height="${size * 8}" data-src="${dataUri(svg)}" data-size="${size}" data-bg="${bg}"></canvas>`;
const iconSvgFor = (size) => { // flat icon svg for the zoom (square, accent field)
  const src = size <= 40 ? symS : sym; const vb = src.match(/viewBox="([^"]+)"/)[1].split(' ').map(Number);
  const S = Math.max(vb[2], vb[3]) / (size <= 40 ? 0.78 : 0.74); const cx = vb[0] + vb[2] / 2, cy = vb[1] + vb[3] / 2;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${cx - S / 2} ${cy - S / 2} ${S} ${S}"><rect x="${cx - S / 2}" y="${cy - S / 2}" width="${S}" height="${S}" fill="${C.accent}"/>${src.replace(/^<svg[^>]*>/, '').replace('</svg>', '').replaceAll(`fill="${C.ink}"`, `fill="${C.paper}"`)}</svg>`;
};
const squareOf = (src) => { const v = src.match(/viewBox="([^"]+)"/)[1].split(' ').map(Number); const S = Math.max(v[2], v[3]) * 1.08; return src.replace(/viewBox="[^"]+"/, `viewBox="${v[0] + v[2] / 2 - S / 2} ${v[1] + v[3] / 2 - S / 2} ${S} ${S}"`); };
const sketches = fs.readdirSync(path.join(OUT, 'sketches')).filter((f) => f.endsWith('.png')).sort();
const notes = fs.readFileSync(path.join(OUT, 'sketches/NOTES.txt'), 'utf8');

const tests = [
  ['1. 2am test', 'Partial pass', 'One second: "the cot, the quiet room, someone hung this for my baby." Soft and safe rather than striking. It feels like the nursery, not like a letter.'],
  ['2. Caption test', 'Partial pass (1 of 4)', 'Read cold it says "a baby, a nursery". It says child clearly; it does not say letters, voice or keeping. The name has to carry "letters".'],
  ['3. Recall test', 'Pass', '"A cot mobile: one big, two small discs." Seven words; parents can draw it in three strokes and three dots.'],
  ['4. Scale test', 'Pass at 29 and up, weak at 16', '60 and 180 read as a mobile. 29 (small cut) reads as three discs under an arc. 16 is a bar over three dots: a recognisable silhouette, not the idea.'],
  ['5. Misread test', 'No death, religious or political reading in the final', 'Seen in exploration and designed out: gallows (long drop from a level beam; all right angles removed), pram (two discs at one level; now three at three heights), bomb and fuse (fixed disc; now hung on threads). Remaining: a family tree or org chart diagram, a molecule, beamed musical notes, generic baby-mobile clip art.'],
  ['6. Elite test', 'Partial pass', 'The Calder lineage is real and the drawing is quiet, but beside Aesop and Apple Books it reads closer to nursery decor than to a publisher. Craft can raise it; the subject is still a baby object.'],
];

const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>The mobile</title>
<style>
@font-face{font-family:Literata;src:url(../../../../../../node_modules/@fontsource/literata/files/literata-latin-500-normal.woff2);font-weight:500}
@font-face{font-family:Literata;src:url(../../../../../../node_modules/@fontsource/literata/files/literata-latin-400-normal.woff2);font-weight:400}
:root{--ink:${C.ink};--muted:${C.inkMuted};--paper:${C.paper};--accent:${C.accent};--soft:${C.accentSoft};--line:${C.line};--night:${C.paperDark}}
*{box-sizing:border-box}body{margin:0;background:var(--paper);color:var(--ink);font:15px/1.5 -apple-system,"Helvetica Neue",Helvetica,sans-serif}
main{max-width:1180px;margin:0 auto;padding:40px 24px 80px}
h1{font:500 40px/1.1 Literata,Georgia,serif;margin:0 0 6px}h2{font:500 22px/1.2 Literata,Georgia,serif;margin:56px 0 16px}
.lede{color:var(--muted);max-width:720px}
.hero{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-top:24px}.hero>div{aspect-ratio:1.25;display:flex;align-items:center;justify-content:center;border-radius:20px}
.hero img{width:68%}.paper{background:var(--paper);border:1px solid var(--line)}.night{background:var(--night)}
.rationale{font:400 21px/1.5 Literata,Georgia,serif;max-width:820px;margin:28px 0 0}
.row{display:flex;gap:28px;align-items:flex-end;flex-wrap:wrap}.row figure{margin:0;text-align:center;color:var(--muted);font-size:12px}
.ic{display:flex;align-items:center;justify-content:center;flex:none}
canvas{image-rendering:pixelated;border:1px solid var(--line)}
.phones{display:flex;gap:24px;flex-wrap:wrap}.phone{width:360px;padding:28px 18px;border-radius:44px;background:linear-gradient(160deg,#E9DCCB,#CDB9A2);}
.phone.dark{background:linear-gradient(160deg,#2A2622,#121110)}
.grid{display:grid;grid-template-columns:repeat(4,1fr);row-gap:22px}.app{display:flex;flex-direction:column;align-items:center;gap:6px}.app span{font-size:11px;color:#1d1d1f}.dark .app span{color:#f2f2f2}
.dark .ic:not(.ours){filter:brightness(.92)}
.email{background:#EFEBE5;padding:28px;border-radius:16px;max-width:640px}.email .card{background:#fff;border-radius:10px;overflow:hidden}.email header{padding:20px 28px;border-bottom:1px solid var(--line)}.email .body{padding:24px 28px;font:400 16px/1.6 Literata,Georgia,serif}
.books{display:flex;gap:28px;align-items:flex-end;flex-wrap:wrap}
.cloth{position:relative;background-color:var(--accent);background-image:repeating-linear-gradient(0deg,rgba(255,255,255,.035) 0 1px,transparent 1px 3px),repeating-linear-gradient(90deg,rgba(0,0,0,.05) 0 1px,transparent 1px 3px);box-shadow:inset -6px 0 12px rgba(0,0,0,.18),0 18px 30px rgba(43,39,34,.25)}
.cover{width:340px;height:440px;border-radius:4px 10px 10px 4px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:30px}
.spine{width:58px;height:440px;border-radius:4px;display:flex;flex-direction:column;align-items:center;padding:26px 0;gap:22px}
.spine .t{writing-mode:vertical-rl;font:500 15px Literata,Georgia,serif;color:#6E4730;letter-spacing:.04em;text-shadow:1px 1px 0 rgba(255,255,255,.18),-1px -1px 0 rgba(0,0,0,.25)}
.emboss{filter:drop-shadow(1.2px 1.2px 0 rgba(255,255,255,.22)) drop-shadow(-1.2px -1.2px 0 rgba(0,0,0,.32))}
.cover .name{font:500 22px Literata,Georgia,serif;color:#6E4730;text-shadow:1px 1px 0 rgba(255,255,255,.18),-1px -1px 0 rgba(0,0,0,.25)}
.tests{display:grid;grid-template-columns:repeat(2,1fr);gap:14px}.test{border:1px solid var(--line);border-radius:14px;padding:16px 18px;background:#fff}.test b{display:block}.verdict{color:var(--accent);font-weight:600;font-size:13px;margin:2px 0 6px}
.sk{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}.sk img{width:100%;border:1px solid var(--line);border-radius:8px}
pre{white-space:pre-wrap;font:13px/1.5 ui-monospace,Menlo,monospace;background:#fff;border:1px solid var(--line);border-radius:12px;padding:16px}
@media (max-width:760px){.hero,.tests,.sk{grid-template-columns:1fr}}
</style></head><body><main>
<p style="color:var(--muted);margin:0">Logo round 2 · D6 wildcard · ${VERSION}</p>
<h1>The mobile</h1>
<p class="lede">A cot mobile in the Calder manner: one large disc and, on a second arm, two smaller ones, each holding the others in balance. Wordmark: round 1 A (outlined Literata 500, joined tt).</p>
<div class="hero"><div class="paper"><img src="${dataUri(sym)}" alt=""></div><div class="night"><img src="${dataUri(recolor(rev, C.paper, C.inkDark))}" alt=""></div></div>
<p class="rationale">Before your child can remember anything, they lie on their back and watch the mobile you hung over the cot. This is that mobile: a big disc and two small ones, each holding the others up, the way a family does. It is the first thing they looked at, and the letters are what they will read when they are older.</p>

<h2>Sizes</h2>
<div class="row">${[16, 29, 60, 180].map((s) => `<figure>${icon(s)}<figcaption>${s}px${s <= 40 ? ', small cut' : ''}</figcaption></figure>`).join('')}
<figure>${zoomCanvas('z16', iconSvgFor(16), 16, C.accent)}<figcaption>16px at 8x</figcaption></figure>
<figure>${zoomCanvas('z29', iconSvgFor(29), 29, C.accent)}<figcaption>29px at 8x</figcaption></figure></div>
<div class="row" style="margin-top:20px">${[16, 29, 60, 180].map((s) => `<figure><img src="${dataUri(s <= 40 ? symS : sym)}" style="width:${s}px"><figcaption>ink ${s}px</figcaption></figure>`).join('')}
<figure>${zoomCanvas('z16i', squareOf(symS), 16, C.paper)}<figcaption>ink 16px at 8x</figcaption></figure></div>

<h2>Home screen, light and dark</h2>
<div class="phones">${home(false)}${home(true)}</div>

<h2>Lockups</h2>
<div style="display:flex;gap:40px;align-items:center;flex-wrap:wrap"><img src="${dataUri(lockH)}" style="height:96px"><img src="${dataUri(lockS)}" style="height:220px"></div>
<div style="background:var(--night);padding:28px;border-radius:16px;margin-top:16px;display:inline-block"><img src="${dataUri(recolor(lockH, C.ink, C.inkDark))}" style="height:64px"></div>

<h2>Email header at 28px</h2>
<div class="email"><div class="card"><header><img src="${dataUri(lockSmall)}" style="height:28px;display:block"></header><div class="body">Nani wrote a letter to Asha.<br><span style="color:var(--muted);font-size:14px">From Nani · Month 9</span></div></div></div>

<h2>Book: spine and cloth cover, single-colour blind emboss</h2>
<div class="books"><div class="cloth spine"><img class="emboss" src="${dataUri(recolor(symS, C.ink, '#7A4F33'))}" style="width:40px"><div class="t">Early Letters: Year One</div></div>
<div class="cloth cover"><img class="emboss" src="${dataUri(recolor(sym, C.ink, '#7A4F33'))}" style="width:190px"><div class="name">Asha</div></div></div>

<h2>The six tests, honestly</h2>
<div class="tests">${tests.map(([t, v, n]) => `<div class="test"><b>${t}</b><div class="verdict">${v}</div>${n}</div>`).join('')}</div>

<h2>Near matches found</h2>
<p class="lede">Image and web search (Oct 3 2026), not a clearance: no well-known logo uses a cot mobile. Closest: generic baby-mobile clip art and UI icon sets (for example IconPark "baby-mobile"); Flensted Mobiles, a Danish maker of mobiles, sells the object itself; Google's 2011 Calder Doodle. The risk is genericness, not confusion with one owner. A professional search in classes 9, 16 and 42 is still needed.</p>

<h2>Sketches and rejected routes</h2>
<div class="sk">${sketches.map((s) => `<figure style="margin:0"><img src="sketches/${s}" alt="${s}"><figcaption style="font-size:12px;color:var(--muted)">${s}</figcaption></figure>`).join('')}</div>
<pre>${notes.replaceAll('<', '&lt;')}</pre>
</main>
<script>
document.querySelectorAll('canvas[data-src]').forEach((cv)=>{const s=+cv.dataset.size;const im=new Image();im.onload=()=>{const c=document.createElement('canvas');c.width=s;c.height=s;const x=c.getContext('2d');x.fillStyle=cv.dataset.bg;x.fillRect(0,0,s,s);x.drawImage(im,0,0,s,s);const z=cv.getContext('2d');z.imageSmoothingEnabled=false;z.drawImage(c,0,0,s,s,0,0,s*8,s*8);};im.src=cv.dataset.src;});
</script></body></html>`;
write('presentation.html', html);
await render([{ file: path.join(OUT, 'presentation.html'), out: path.join(OUT, 'png/presentation.png'), width: 1240, height: 900, fullPage: true, wait: 800 }]);
console.log('ok');
