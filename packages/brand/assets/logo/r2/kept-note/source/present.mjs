// Writes presentation.html for the kept-note direction and screenshots it for review.
import fs from 'node:fs';
import path from 'node:path';
import { C, OUT, render, write } from './lib.mjs';
import { dMain, dSmall, dFav, iconSVG } from './build.mjs';
import { bbox } from './mark.mjs';

const rd = (f) => fs.readFileSync(path.join(OUT, f), 'utf8').replace(/<title>[^<]*<\/title>/, '');
const sq = (d, m = 0.04) => { const b = bbox(d), s = b.h * (1 + 2 * m); return `${b.x0 + b.w / 2 - s / 2} ${b.y0 + b.h / 2 - s / 2} ${s} ${s}`; };
const sym = (d, fill, size, extra = '') => `<svg viewBox="${sq(d)}" width="${size}" height="${size}" aria-hidden="true" ${extra}><path fill="${fill}" d="${d}"/></svg>`;
const icon = (opts, size, rad = 0.2237) => `<div class="ic" style="width:${size}px;height:${size}px;border-radius:${size * rad}px">${iconSVG({ ...opts, size: 1024 }).replace('width="1024" height="1024"', `width="${size}" height="${size}"`)}</div>`;
const enc = (s) => encodeURIComponent(s);
const pix = (svgStr, s, scale = 8) => `<canvas class="pix" data-s="${s}" data-src="${enc(svgStr)}" width="${s * scale}" height="${s * scale}"></canvas>`;

// neighbour icons for the home screen: plain glyphs in system-like colours (no real logos)
const nb = [
  ['Calendar', '#FFFFFF', `<text x="50" y="40" font-size="16" text-anchor="middle" fill="#E5483E" font-family="-apple-system,Helvetica" font-weight="600">FRI</text><text x="50" y="80" font-size="40" text-anchor="middle" fill="#1d1d1f" font-family="-apple-system,Helvetica" font-weight="300">3</text>`],
  ['Weather', '#3A7BD5', `<circle cx="42" cy="44" r="16" fill="#FFD54A"/><rect x="40" y="52" width="40" height="18" rx="9" fill="#fff"/>`],
  ['Camera', '#9A9A9F', `<rect x="18" y="32" width="64" height="44" rx="10" fill="#3b3b3d"/><circle cx="50" cy="54" r="14" fill="#d8d8dc"/><circle cx="50" cy="54" r="8" fill="#3b3b3d"/>`],
  ['Notes', '#FFFFFF', `<rect x="0" y="0" width="100" height="26" fill="#F7C948"/><rect x="18" y="40" width="64" height="4" fill="#d0d0d0"/><rect x="18" y="56" width="64" height="4" fill="#d0d0d0"/><rect x="18" y="72" width="44" height="4" fill="#d0d0d0"/>`],
  ['Messages', '#34C759', `<ellipse cx="50" cy="48" rx="30" ry="24" fill="#fff"/>`],
  ['Clock', '#111111', `<circle cx="50" cy="50" r="34" fill="#fff"/><rect x="48" y="26" width="4" height="26" fill="#111"/><rect x="48" y="48" width="20" height="4" fill="#111"/>`],
  ['Maps', '#E9F0E1', `<path d="M0 70L100 30L100 44L0 84Z" fill="#F4C542"/><path d="M30 0L46 0L60 100L44 100Z" fill="#fff"/>`],
  ['Health', '#FFFFFF', `<circle cx="50" cy="50" r="22" fill="#FF2D55" opacity=".18"/><circle cx="50" cy="50" r="10" fill="#FF2D55"/>`],
  ['Podcasts', '#9B51E0', `<circle cx="50" cy="44" r="12" fill="#fff"/><rect x="45" y="56" width="10" height="24" rx="5" fill="#fff"/>`],
  ['Photos', '#FFFFFF', `<circle cx="38" cy="42" r="14" fill="#F2994A" opacity=".85"/><circle cx="62" cy="42" r="14" fill="#56CCF2" opacity=".85"/><circle cx="50" cy="62" r="14" fill="#6FCF97" opacity=".85"/>`],
  ['Books', '#F28C28', `<rect x="26" y="26" width="48" height="50" rx="4" fill="#fff"/><rect x="30" y="26" width="4" height="50" fill="#F28C28" opacity=".5"/>`],
];
const nbIcon = ([name, bg, g], size, dark) => `<div class="app"><div class="ic" style="width:${size}px;height:${size}px;border-radius:${size * 0.2237}px;background:${dark && bg === '#FFFFFF' ? '#2a2a2c' : bg}"><svg viewBox="0 0 100 100" width="${size}" height="${size}">${dark && bg === '#FFFFFF' ? g.replaceAll('#1d1d1f', '#fff') : g}</svg></div><span>${name}</span></div>`;
function phone(dark) {
  const s = 62, ours = `<div class="app">${icon(dark ? { bg: C.paperDark, fg: C.accentDark, d: dMain } : { d: dMain }, s)}<span>Early Le...</span></div>`;
  const apps = [...nb.slice(0, 6).map((n) => nbIcon(n, s, dark)), ours, ...nb.slice(6).map((n) => nbIcon(n, s, dark))];
  const wall = dark ? 'linear-gradient(160deg,#1b1a20,#2b2630 60%,#141316)' : 'linear-gradient(160deg,#9c8268,#7d6550 55%,#5f4b3b)';
  return `<div class="phone" style="background:${wall}"><div class="status" style="color:${dark ? '#fff' : '#111'}">9:41</div><div class="grid">${apps.join('')}</div><div class="dock">${nb.slice(1, 5).map((n) => nbIcon(n, s, dark).replace(/<span>.*<\/span>/, '')).join('')}</div></div>`;
}

const tests = [
  ['2am test', 'Partial pass', 'A small note, opened just a little, with a heart showing through the fold. The feeling is "someone left this for me" and it is warm without being babyish. Honest risk: a tired eye may simply read "a card with a heart", which is kind but not specific to this product.'],
  ['Caption test', 'Partial pass', 'Without words people say "a love note", "a card", "a letter". Love and keeping come through. Voice does not, and nothing says "child" on its own; the wordmark and the category line ("memory book") have to carry those.'],
  ['Recall test', 'Pass', '"A folded note with a heart cut through." Seven words, and it can be drawn in three strokes: a tall rectangle, a line down the middle, a heart on the line.'],
  ['Scale test', 'Pass with optical cuts', 'Three drawings: the main mark from 60 px up; a small cut (wider crease, bigger heart, softer corners) for 29 to 40 px; a favicon cut for 16 px where the crease is carried by the silhouette so the heart stays whole. At 16 px the fold is barely visible and it reads as "a card with a heart".'],
  ['Misread test', 'Watch list', 'Greeting-card and Valentine shops; the generic "book-heart" UI icon in Lucide, Material Design Icons and Boxicons; stock "open book with a heart cut out" art, which some church and Bible-reading brands use; a door left ajar (a shelter or charity reading, mild); at 29 px the crease under the heart can read as a heart-shaped keyhole; a heart on a card can hint at health or cardiology. No death, loss, political or body readings found. The heart is never split: the crease runs above and below it, not through it.'],
  ['Elite test', 'Partial pass', 'The drawing is exact, quiet and flat, and the turning right leaf gives it life, so it holds its own next to Apple Books and Day One. Next to Aesop or Penguin it is more sentimental: a heart is the most common symbol in the category, and ownership rests on the fold, the cut and the turn, not on the heart.'],
];

const sketches = [
  ['sketch-1-s1-standing-card', 'Card folded once, crease toward you: reads as an open box or a cube.'],
  ['sketch-1-s2-dog-ear-line', 'Dog-eared note: the generic document icon, exactly what the brief bans.'],
  ['sketch-1-s3-note-in-a-pocket', 'Note in a pocket, first try: a pot or a top hat.'],
  ['sketch-1-s4-shelter-fold', 'Corners folded to the centre: a house, an envelope and the first fold of a paper plane all at once.'],
  ['sketch-1-s6-heart-in-the-fold', 'Two curled leaves forming a heart: just a drawn heart outline, or horns.'],
  ['sketch-2-a-one-oblique-fold', 'One oblique fold: the diagonal gap reads as a slash.'],
  ['sketch-2-b-half-open-note-lying', 'Half-open note lying flat: a laptop.'],
  ['sketch-2-c-pocket-v2', 'Pocket, second try: a cup or a bucket.'],
  ['sketch-2-g-tri-fold-letter', 'Letter in thirds: the maps icon.'],
  ['sketch-2-h-tent-from-the-end', 'Note standing as a tent: the Greek lambda, or a mountain.'],
  ['sketch-3-aj1-note-ajar', 'Note ajar: a door, close to the logout icon.'],
  ['sketch-3-aj2-note-ajar-one-curl-inside', 'Ajar with one handwritten curl: the curl reads as a question mark.'],
  ['sketch-3-tent-a-folded-note-keeping-a-small-light', 'Folded note keeping a small light: reads as the letter A with a dot.'],
  ['sketch-3-booklet-folded-twice-into-a-little-book', 'Note folded twice into a booklet: the generic open-book icon.'],
  ['sketch-4-ori-origata-wrapper', 'Japanese origata wrapper: a box with a slash through it.'],
  ['sketch-4-t2-soft-tent-light', 'Softer tent: still an A, and now a camp fire.'],
  ['sketch-5-tc-tented-note-a-small-light-inside', 'Tented card in three-quarter view: a tent with a lantern, a camping app.'],
  ['sketch-5-tcn-tented-note-alone', 'Tented card alone: paper-honest but no feeling.'],
  ['sketch-5-cc-corner-folded-to-the-centre', 'Corner folded to the centre: a sticky note, banned.'],
  ['sketch-6-pk1-pointed-shirt-pocket-slanted-note', 'Shirt pocket over the heart: a lovely story, but it reads as a pocket shield (close to the Pocket app) and Apple Wallet is cards in a pocket.'],
  ['sketch-6-pk2-rounded-pocket-note', 'Rounded pocket: a mug with a card.'],
  ['sketch-6-pk3-pocket-note-folded-once-and-slightly-open', 'Pocket with a folded note: a pen pot.'],
  ['sketch-7-t3-tent-note-soft-crease-a-light-inside', 'Soft-crease tent: still an A.'],
  ['sketch-7-t4-asymmetric-hand-folded-tent', 'Hand-folded tent: still an A, just tilted.'],
  ['sketch-7-pk4-soft-pocket-note-folded-once', 'Soft pocket: a bowl.'],
  ['sketch-8-r1-a-folded-note-as-a-roof-a-light-kept-under-it', 'Note as a roof over a light: a smart-home or estate-agent logo.'],
  ['sketch-8-r2-roof-in-slight-perspective', 'Roof in perspective: same problem.'],
  ['sketch-9-h1-open-note-heart-cut-through-the-fold', 'Heart cut through a flat open note: the idea arrives, but flat it is a double door.'],
  ['sketch-9-h2-note-still-holding-its-fold-heart-across-the-crease', 'Heart cut through a symmetric fold: right idea, but reads as an open book.'],
  ['sketch-9-h3-closed-note-half-a-heart-at-the-fold', 'Closed note with half a heart: clever, but reads as a question mark or a 2.'],
];

const paperIcon = { bg: C.accent, fg: C.paper };
const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Kept note</title>
<style>
:root{--ink:${C.ink};--muted:${C.inkMuted};--paper:${C.paper};--accent:${C.accent};--soft:${C.accentSoft};--line:${C.line};--night:${C.paperDark};--nightInk:${C.inkDark};--nightAccent:${C.accentDark}}
*{box-sizing:border-box}body{margin:0;background:var(--paper);color:var(--ink);font:16px/1.5 Georgia,"Literata",serif}
.wrap{max-width:1180px;margin:0 auto;padding:0 32px}
h1,h2{font-weight:500;letter-spacing:-.01em}h2{font-size:26px;margin:0 0 18px}
.k{font:600 11px/1 -apple-system,Helvetica,Arial;letter-spacing:.14em;text-transform:uppercase;color:var(--muted);margin-bottom:10px}
section{padding:56px 0;border-top:1px solid var(--line)}
.hero{display:grid;grid-template-columns:1fr 1fr;min-height:560px}
.hero>div{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:40px;padding:48px}
.night{background:var(--night);color:var(--nightInk)}
.lead{font-size:21px;max-width:760px}
.row{display:flex;gap:28px;align-items:flex-end;flex-wrap:wrap}
.cap{font:12px/1.3 -apple-system,Helvetica,Arial;color:var(--muted);margin-top:8px;text-align:center}
.cell{display:flex;flex-direction:column;align-items:center}
.ic{overflow:hidden;flex:none;display:block}.ic svg{display:block}
canvas.pix{image-rendering:pixelated;border:1px solid var(--line);display:block}
.panel{padding:28px;border-radius:14px}
.phones{display:flex;gap:40px;flex-wrap:wrap}
.phone{width:390px;height:560px;border-radius:44px;padding:56px 22px 22px;position:relative;box-shadow:0 0 0 10px #111,0 20px 40px rgba(0,0,0,.25);overflow:hidden}
.status{position:absolute;top:18px;left:34px;font:600 15px -apple-system,Helvetica}
.grid{display:grid;grid-template-columns:repeat(4,1fr);row-gap:22px;justify-items:center}
.app{display:flex;flex-direction:column;align-items:center;gap:6px;font:11px -apple-system,Helvetica;color:#fff;text-shadow:0 1px 2px rgba(0,0,0,.35)}
.dock{position:absolute;left:14px;right:14px;bottom:14px;height:92px;border-radius:30px;background:rgba(255,255,255,.28);backdrop-filter:blur(10px);display:flex;justify-content:space-around;align-items:center}
.mail{border:1px solid var(--line);border-radius:12px;overflow:hidden;max-width:560px;width:100%;flex:1 1 300px;background:#fff;font-family:-apple-system,Helvetica,Arial}
.mail .hd{padding:20px 28px;border-bottom:1px solid var(--line)}
.mail .bd{padding:24px 28px;color:var(--ink);font:16px/1.5 Georgia,serif}
.btn{display:inline-block;background:var(--accent);color:#fff;border-radius:999px;padding:9px 18px;font:600 14px -apple-system,Helvetica}
.shelf{display:flex;flex-wrap:wrap;gap:28px;align-items:flex-end;padding:40px;background:linear-gradient(#efe7dc,#e3d7c7);border-radius:14px}
.cloth{background-color:var(--accent);background-image:repeating-linear-gradient(0deg,rgba(255,255,255,.05) 0 1px,transparent 1px 3px),repeating-linear-gradient(90deg,rgba(0,0,0,.06) 0 1px,transparent 1px 3px);box-shadow:inset 0 0 40px rgba(0,0,0,.25),0 10px 24px rgba(0,0,0,.25)}
.cover{width:320px;height:420px;border-radius:4px 10px 10px 4px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:26px;position:relative}
.cover .yr{font:500 15px Georgia,serif;letter-spacing:.2em;color:#6f452c;text-shadow:0 1px 0 rgba(255,255,255,.18),0 -1px 0 rgba(0,0,0,.35)}
.spine{width:58px;height:420px;border-radius:3px;display:flex;flex-direction:column;align-items:center;justify-content:space-between;padding:22px 0}
.spine .t{writing-mode:vertical-rl;font:500 17px Georgia,serif;color:#6f452c;text-shadow:0 1px 0 rgba(255,255,255,.18),0 -1px 0 rgba(0,0,0,.35)}
.paperspine{background:var(--soft);box-shadow:inset 0 0 24px rgba(0,0,0,.12),0 10px 24px rgba(0,0,0,.2)}
table{border-collapse:collapse;width:100%}td{vertical-align:top;padding:16px 12px;border-top:1px solid var(--line)}
td:first-child{width:160px;font-weight:600}td:nth-child(2){width:180px;font:600 13px -apple-system,Helvetica;color:var(--accent)}
.sk{display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:22px}
.sk figure{margin:0}.sk img{width:100%;border:1px solid var(--line);border-radius:8px;background:#fff}
.sk figcaption{font:13px/1.4 -apple-system,Helvetica;color:var(--muted);margin-top:6px}
.cut3{display:flex;gap:40px;align-items:flex-end;flex-wrap:wrap}
svg,canvas,img{max-width:100%}.hero svg{height:auto}
@media (max-width:760px){.hero{grid-template-columns:minmax(0,1fr)!important}.hero>div{padding:32px 16px;min-width:0}.shelf{padding:20px}.cover{width:100%;max-width:320px}.hero{grid-template-columns:1fr}.phone{width:100%}.wrap{padding:0 16px}}
</style></head><body>
<div class="hero">
  <div>${sym(dMain, C.ink, 300)}<div style="width:420px;max-width:100%">${rd('lockup-horizontal.svg')}</div><div class="k">Kept note, on paper</div></div>
  <div class="night">${sym(dMain, C.inkDark, 300)}<div style="width:420px;max-width:100%">${rd('png/lockup-horizontal-reversed.svg')}</div><div class="k" style="color:${C.inkMutedDark}">At night</div></div>
</div>
<div class="wrap">
<section>
  <div class="k">For a parent</div>
  <h2>The note that was kept</h2>
  <p class="lead">When you were small, you folded a piece of paper, cut half a heart along the fold, and opened it to find a whole one. Our mark is that note: folded once, opened just a little, with the heart showing through where it was kept. Everything you say to your child is kept the same way, exactly as you said it, until the day they open it.</p>
</section>
<section>
  <div class="k">Three drawings, one mark</div>
  <h2>Main, small and favicon cuts</h2>
  <div class="cut3">
    <div class="cell">${sym(dMain, C.ink, 220)}<div class="cap">Main, 60 px and up</div></div>
    <div class="cell">${sym(dSmall, C.ink, 220)}<div class="cap">Small cut, 29 to 40 px: wider crease, bigger heart</div></div>
    <div class="cell">${sym(dFav, C.ink, 220)}<div class="cap">Favicon cut, 16 px: the fold lives in the silhouette</div></div>
  </div>
</section>
<section>
  <div class="k">Sizes</div>
  <h2>From browser tab to App Store</h2>
  <div class="row">
    <div class="cell">${sym(dFav, C.ink, 16)}<div class="cap">16</div></div>
    <div class="cell">${sym(dSmall, C.ink, 29)}<div class="cap">29</div></div>
    <div class="cell">${icon({ ...paperIcon, d: dSmall }, 29)}<div class="cap">29 icon</div></div>
    <div class="cell">${icon({ ...paperIcon, d: dSmall }, 40)}<div class="cap">40 icon</div></div>
    <div class="cell">${icon({ ...paperIcon }, 60)}<div class="cap">60 icon</div></div>
    <div class="cell">${icon({ ...paperIcon }, 180)}<div class="cap">180</div></div>
    <div class="cell">${pix(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="${sq(dFav, 0.02)}"><rect x="-9999" y="-9999" width="99999" height="99999" fill="${C.paper}"/><path fill="${C.ink}" d="${dFav}"/></svg>`, 16)}<div class="cap">16 px, 8x</div></div>
    <div class="cell">${pix(iconSVG({ ...paperIcon, d: dSmall, size: 1024, markH: 0.62 }), 29)}<div class="cap">29 px icon, 8x</div></div>
  </div>
  <div class="row panel night" style="margin-top:26px">
    <div class="cell">${sym(dFav, C.accentDark, 16)}<div class="cap" style="color:${C.inkMutedDark}">16</div></div>
    <div class="cell">${sym(dSmall, C.inkDark, 29)}<div class="cap" style="color:${C.inkMutedDark}">29</div></div>
    <div class="cell">${icon({ bg: C.paperDark, fg: C.accentDark, d: dSmall }, 40)}<div class="cap" style="color:${C.inkMutedDark}">40 dark icon</div></div>
    <div class="cell">${icon({ bg: C.paperDark, fg: C.accentDark }, 60)}<div class="cap" style="color:${C.inkMutedDark}">60 dark icon</div></div>
    <div class="cell">${icon({ bg: C.paperDark, fg: C.accentDark }, 180)}<div class="cap" style="color:${C.inkMutedDark}">180 dark icon</div></div>
    <div class="cell">${pix(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="${sq(dFav, 0.02)}"><rect x="-9999" y="-9999" width="99999" height="99999" fill="${C.paperDark}"/><path fill="${C.accentDark}" d="${dFav}"/></svg>`, 16)}<div class="cap" style="color:${C.inkMutedDark}">16 px dark, 8x</div></div>
  </div>
</section>
<section>
  <div class="k">App icon</div>
  <h2>On the home screen</h2>
  <div class="row" style="margin-bottom:30px">
    <div class="cell">${icon(paperIcon, 160)}<div class="cap">Primary: paper on sepia</div></div>
    <div class="cell"><div style="box-shadow:0 0 0 1px ${C.line};border-radius:36px">${icon({ bg: C.paper, fg: C.accent }, 160)}</div><div class="cap">Alternate: sepia on paper</div></div>
    <div class="cell">${icon({ bg: C.paperDark, fg: C.accentDark }, 160)}<div class="cap">iOS dark appearance</div></div>
  </div>
  <div class="phones">${phone(false)}${phone(true)}</div>
  <p class="cap" style="text-align:left">Mock, not iOS. Neighbouring icons are plain stand-ins in system-like colours.</p>
</section>
<section>
  <div class="k">Email</div>
  <h2>In the inbox, 28 px tall</h2>
  <div class="row">
    <div class="mail"><div class="hd"><div style="height:28px">${rd('lockup-horizontal.svg').replace('<svg ', '<svg height="28" ')}</div></div><div class="bd"><b>Here is your sign-in link</b><br>Tap the button on this phone to sign in.<br><br><span class="btn">Sign in</span><br><br><i>With care, Early Letters</i></div></div>
    <div class="mail" style="background:${C.paperRaisedDark};border-color:${C.lineDark}"><div class="hd" style="border-color:${C.lineDark}"><div style="height:28px">${rd('png/lockup-horizontal-reversed.svg').replace('<svg ', '<svg height="28" ')}</div></div><div class="bd" style="color:${C.inkDark}"><b>Here is your sign-in link</b><br>Tap the button on this phone to sign in.<br><br><span class="btn" style="background:${C.accentDark};color:${C.paperDark}">Sign in</span><br><br><i>With care, Early Letters</i></div></div>
  </div>
</section>
<section>
  <div class="k">Print</div>
  <h2>Spine and cloth cover, single-colour deboss</h2>
  <svg width="0" height="0" style="position:absolute"><filter id="deboss" x="-10%" y="-10%" width="120%" height="120%"><feOffset dx="0" dy="2" in="SourceAlpha" result="o"/><feComposite in="SourceAlpha" in2="o" operator="out" result="edge"/><feFlood flood-color="#000" flood-opacity=".45"/><feComposite in2="edge" operator="in" result="shadowTop"/><feOffset dx="0" dy="-1.5" in="SourceAlpha" result="o2"/><feComposite in="SourceAlpha" in2="o2" operator="out" result="edge2"/><feFlood flood-color="#fff" flood-opacity=".22"/><feComposite in2="edge2" operator="in" result="hl"/><feMerge><feMergeNode in="SourceGraphic"/><feMergeNode in="shadowTop"/><feMergeNode in="hl"/></feMerge></filter></svg>
  <div class="shelf">
    <div class="spine cloth"><div class="t">Early Letters</div>${sym(dSmall, '#76492f', 34, 'style="filter:url(#deboss)"')}</div>
    <div class="spine paperspine"><div class="t" style="color:${C.inkMuted};text-shadow:none">Early Letters: Year Two</div>${sym(dSmall, C.accent, 34)}</div>
    <div class="cover cloth">${sym(dMain, '#76492f', 150, 'style="filter:url(#deboss)"')}<div class="yr">YEAR ONE</div></div>
  </div>
  <p class="cap" style="text-align:left">The mark is one closed shape per leaf with no hairlines under 2% of its height, so it debosses cleanly in one colour. On cloth the crease is 1.9 mm wide on a 70 mm tall mark; the spine uses the small cut.</p>
</section>
<section>
  <div class="k">Six tests</div>
  <h2>Honest results</h2>
  <table>${tests.map(([a, b, c]) => `<tr><td>${a}</td><td>${b}</td><td>${c}</td></tr>`).join('')}</table>
</section>
<section>
  <div class="k">Sketches</div>
  <h2>What was tried and why it was left behind</h2>
  <div class="sk">${sketches.map(([f, t]) => `<figure><img src="sketches/${f}.png" alt=""><figcaption>${t}</figcaption></figure>`).join('')}</div>
  <p class="cap" style="text-align:left;margin-top:20px">Refinement rounds 1 to 8 of the chosen idea are in sketches/refinement-round-*.png: crease shown both sides, one side, or not at all; symmetric versus turning leaves; note proportion; heart size, height and curve; small-size cuts.</p>
</section>
<section style="font:12px -apple-system,Helvetica;color:var(--muted)">Built from source: node packages/brand/assets/logo/r2/kept-note/source/build.mjs, then source/present.mjs. Wordmark reused from direction A (outlined Literata 500, joined tt). Colours from packages/brand/index.ts only.</section>
</div>
<script>
for (const cv of document.querySelectorAll('canvas.pix')) {
  const s = +cv.dataset.s, img = new Image();
  img.onload = () => { const t = document.createElement('canvas'); t.width = s; t.height = s; t.getContext('2d').drawImage(img, 0, 0, s, s);
    const c = cv.getContext('2d'); c.imageSmoothingEnabled = false; c.drawImage(t, 0, 0, cv.width, cv.height); };
  img.src = 'data:image/svg+xml,' + cv.dataset.src;
}
</script>
</body></html>`;
const f = write('presentation.html', html);
if (!process.argv.includes('--no-shot')) {
  await render([
    { file: f, out: path.join(OUT, 'png/presentation-full.png'), width: 1280, height: 900, fullPage: true, wait: 600 },
    { file: f, out: path.join(OUT, 'png/presentation-mobile.png'), width: 390, height: 844, fullPage: true, wait: 600 },
  ]);
}
console.log('presentation written');
