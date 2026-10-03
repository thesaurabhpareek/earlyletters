// Writes ../presentation.html and a full-page preview PNG. node pres.mjs (after build.mjs)
import fs from 'node:fs'; import path from 'node:path'; import { fileURLToPath } from 'node:url';
import { mark, bounds } from './mark.mjs'; import { MAIN, SMALL } from './build.mjs'; import { shoot } from './shoot.mjs';
const HERE = path.dirname(fileURLToPath(import.meta.url)), OUT = path.resolve(HERE, '..');
const C = { ink: '#2B2722', inkMuted: '#6B645B', paper: '#FBF8F3', accent: '#8A5A3B', accentSoft: '#F1E6DC', line: '#E6DED3', inkDark: '#F2ECE4', inkMutedDark: '#B3AA9E', paperDark: '#161412', paperRaisedDark: '#201D1A', accentDark: '#D9A47E', lineDark: '#33302C' };
const read = (f) => fs.readFileSync(path.join(OUT, f), 'utf8');
const bb = (p) => { const b = bounds(p); return `${b.x} ${b.y} ${b.w} ${b.h}`; };
const sym = (fill, p = MAIN, cls = '') => `<svg class="${cls}" viewBox="${bb(p)}" aria-hidden="true"><path fill="${fill}" d="${mark(p).d}"/></svg>`;
const icon = (bg, fg, p = MAIN, frac = 0.6) => { const [x, y, w, h] = bb(p).split(' ').map(Number); const s = 100 * frac / w; return `<svg viewBox="0 0 100 100" aria-hidden="true"><rect width="100" height="100" fill="${bg}"/><path fill="${fg}" transform="translate(${(100 - 100 * frac) / 2} ${50 - h * s / 2 - 1}) scale(${s}) translate(${-x} ${-y})" d="${mark(p).d}"/></svg>`; };
const lockH = read('lockup-horizontal.svg').replace(/<title>.*?<\/title>/, '');
const lockHrev = fs.readFileSync(path.join(HERE, 'gen/lockup-horizontal-reversed.svg'), 'utf8').replace(/<title>.*?<\/title>/, '');
const lockS = read('lockup-stacked.svg').replace(/<title>.*?<\/title>/, '');
const wmOnly = fs.readFileSync(path.resolve(OUT, '../../a/wordmark.svg'), 'utf8').match(/ d="([^"]+)"/)[1];

// neighbouring icons: generic stand-ins drawn here (not copies of anyone's artwork)
const N = {
  Photos: `<div class="ni" style="background:#fff"><i style="position:absolute;inset:22%;border-radius:50%;background:conic-gradient(#f5b400,#f06a35,#d93a7a,#8a52d6,#3b8cf5,#2fbf71,#f5b400)"></i></div>`,
  Messages: `<div class="ni" style="background:linear-gradient(#6fe06b,#2fbf3a)"><i style="position:absolute;left:20%;right:20%;top:26%;bottom:30%;border-radius:50%;background:#fff"></i></div>`,
  Calendar: `<div class="ni" style="background:#fff;color:#111;font:600 9px system-ui;text-align:center"><div style="color:#e33;padding-top:6px">SAT</div><div style="font:300 26px system-ui;line-height:24px">3</div></div>`,
  Notes: `<div class="ni" style="background:linear-gradient(#fff 0 28%,#fbe08a 28%)"></div>`,
  Books: `<div class="ni" style="background:linear-gradient(#ffaa3b,#ff7a00)"><svg viewBox="0 0 100 100" style="position:absolute;inset:0"><path fill="#fff" d="M50 72 C40 66 28 64 18 66 L18 34 C30 32 42 34 50 40 Z M50 72 C60 66 72 64 82 66 L82 34 C70 32 58 34 50 40 Z"/></svg></div>`,
  Calm: `<div class="ni" style="background:linear-gradient(135deg,#5aa0f0,#2d5fc2)"><i style="position:absolute;left:24%;top:26%;width:52%;height:48%;border-radius:50%;border:3px solid #fff;box-sizing:border-box"></i></div>`,
  Journal: `<div class="ni" style="background:linear-gradient(#3fa9f5,#1d7fd6)"><i style="position:absolute;left:36%;top:22%;width:28%;height:54%;background:#fff;clip-path:polygon(0 0,100% 0,100% 100%,50% 78%,0 100%)"></i></div>`,
  Camera: `<div class="ni" style="background:linear-gradient(#d8d8dc,#a9a9ae)"><i style="position:absolute;inset:30%;border-radius:50%;background:#333;box-shadow:0 0 0 4px #eee"></i></div>`,
  Weather: `<div class="ni" style="background:linear-gradient(#4aa3ff,#1a66d6)"><i style="position:absolute;left:24%;top:24%;width:30%;height:30%;border-radius:50%;background:#ffd23f"></i></div>`,
  Maps: `<div class="ni" style="background:linear-gradient(135deg,#bfe5a8 0 45%,#f4efe4 45% 55%,#9fd3f7 55%)"></div>`,
  Clock: `<div class="ni" style="background:#111"><i style="position:absolute;inset:14%;border-radius:50%;background:#fff"></i></div>`,
  Settings: `<div class="ni" style="background:linear-gradient(#a3a3a8,#77777c)"><i style="position:absolute;inset:26%;border-radius:50%;border:6px dotted #ddd;box-sizing:border-box"></i></div>`,
};
const ours = (dark) => `<div class="ni ours">${dark ? icon(C.paperDark, C.accentDark) : icon(C.accent, C.paper)}</div>`;
const grid = (dark) => { const names = ['Photos', 'Messages', 'Calendar', 'Notes', 'Camera', 'Books', 'EL', 'Calm', 'Journal', 'Weather', 'Maps', 'Clock', 'Settings']; return names.map((n) => `<div class="app">${n === 'EL' ? ours(dark) : N[n]}<span>${n === 'EL' ? 'Early Letters' : n}</span></div>`).join(''); };

const tests = [
  ['2am test', 'Partial pass', 'A soft open book with something small resting in it reads as calm and keepsake-like, and the warm brown tile is quiet at night. What it does not deliver is a jolt of tenderness: the first feeling is "a book app", the second is "something precious is kept in it".'],
  ['Caption test', 'Partial pass', 'Without words, people will say "a book" and "a note or photo tucked in it", so keeping and letters come through. The child comes through only by scale, and only if you are told; voice does not come through at all.'],
  ['Recall test', 'Pass', '"An open book with a card tucked in." Six words. The page tops rising into a cradle and the card leaning on the right page are the two details people will remember; the exact curves they will not.'],
  ['Scale test', 'Weak pass', 'At 60 and 180px it is clear. At 29px it holds as a book with a light dot at upper right. At 16px it is a dark crown or "M" with a notch; the card becomes a dot and the idea is gone, only the silhouette survives. A favicon-only cut without the card would be more honest and is offered for v2.'],
  ['Misread test', 'Risks noted', 'Seen: an "M" or "W" letterform (book-as-M is a common stock logo trope); bat wings or a crown at 16px; a cup with a falling sugar cube, or two hills with a box tumbling into the valley, at large sizes. Killed during the rounds: a figure with raised arms and a head (card centred over the gutter), a chalice, a flower on a stem, bull horns, a shirt collar with tie. No death, religious or political reading found in the final cut. Not checked by a native reviewer.'],
  ['Elite test', 'Partial pass', 'The drawing is restrained and sits well with the Literata wordmark, but an open book is category wallpaper: next to Apple Books (an open book on an orange tile) it looks like a cousin, not a stranger. It is calmer than most edtech book marks; it is not yet as ownable as the benchmark marks.'],
];
const rejected = [
  ['s1-cradle-dot.png', 'Cradle and dot: a person with raised arms, or a smiley.'],
  ['s2-shelter-arcs.png', 'Big arc over small arc: rainbow, sunrise, Wi-Fi, insurance. No book.'],
  ['s3-dogear-pocket.png', 'Dog-ear pocket: a document icon, not an embrace.'],
  ['s4-parentheses.png', 'Two leaves round a page: parentheses, code.'],
  ['s5-big-leaf-small-leaf.png', 'Big page over small page: a sprout.'],
  ['s6-book-holds-letter.png', 'Book holds a letter, flat: the seed of the final idea, too generic as drawn.'],
  ['s7-heart-gutter.png', 'Heart in the gutter: the stock "book pages folded into a heart" picture.'],
  ['s8-cradle-page.png', 'Cradle round a page: horseshoe or magnet holding a card.'],
  ['s9-fanned-pages.png', 'Fanned pages: a fan, a lotus, a crown at 29px.'],
  ['s10-page-turns-over.png', 'Turning page: an ear, a wave, a snail.'],
  ['s11-leaning-spines.png', 'Small book leans on a tall one: a bar chart or pause button.'],
  ['s12-cradle-tapered.png', 'Tapered cradle: still a U holding a card.'],
  ['s14-end-on-leaves.png', 'End-on pages, big over small: every version read as a plant.'],
  ['s15-top-view-books.png', 'Top-view books: legible, but generic book or bookmark-ribbon readings.'],
  ['s16-book-cradles-letter.png', 'Letter standing in the gutter: a book with a flag.'],
  ['s17-rising-leaves.png', 'Pages rising as arms: flame, lotus or candle in a book.'],
  ['round-01.png', 'Round 1, pointed arms: bull horns.'],
  ['round-02.png', 'Round 2, cut tips: pincers.'],
  ['round-03.png', 'Round 3, smooth cradle: keyhole and Omega.'],
  ['round-04.png', 'Round 4, pages hugging the letter: a shirt collar and tie.'],
  ['round-05.png', 'Round 5, heavier cradles: Viking helmet.'],
  ['round-06.png', 'Round 6, concave page tops: the direction that worked.'],
  ['round-07.png', 'Round 7, S-curve tops: better, but the card collided with the pages.'],
  ['round-09.png', 'Round 9, clearance solved: the card floated above the book.'],
  ['round-10.png', 'Round 10, U hollow: the card finally sits inside.'],
  ['round-11.png', 'Round 11, joined pages: lost the book; split kept.'],
  ['round-12.png', 'Round 12, centred card over the gutter read as a head on a body: moved off-centre.'],
  ['round-13.png', 'Round 13, rounder tips and card size.'],
  ['round-14.png', 'Round 14, card leaning on the right page: chosen for v1.'],
];

const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Held: logo round 2</title>
<link rel="icon" href="favicon.svg">
<style>
:root{--ink:${C.ink};--muted:${C.inkMuted};--paper:${C.paper};--accent:${C.accent};--soft:${C.accentSoft};--line:${C.line}}
*{box-sizing:border-box}body{margin:0;background:var(--paper);color:var(--ink);font:16px/1.55 Literata,Georgia,serif}
.wrap{max-width:1120px;margin:0 auto;padding:0 32px}
section{padding:56px 0;border-bottom:1px solid var(--line)}
h1{font-weight:500;font-size:40px;margin:0 0 8px}h2{font-weight:500;font-size:26px;margin:0 0 20px}
.k{font:600 11px/1 system-ui;letter-spacing:.12em;text-transform:uppercase;color:var(--muted);margin-bottom:14px}
.hero{display:grid;grid-template-columns:1fr 1fr}
.hero>div{height:520px;display:flex;align-items:center;justify-content:center;flex-direction:column;gap:40px}
.hero svg{width:330px}.hero .lk svg{width:340px;height:auto}
.sizes{display:flex;gap:36px;align-items:flex-end;flex-wrap:wrap}.sizes figure{margin:0;text-align:center;font:12px system-ui;color:var(--muted)}
.tile{border-radius:22.37%;overflow:hidden;display:block}.tile svg{display:block;width:100%;height:100%}
.px{image-rendering:pixelated;display:block}
.phone{width:330px;border-radius:44px;padding:54px 22px 30px;position:relative;box-shadow:0 0 0 10px #1b1b1b,0 20px 40px rgba(0,0,0,.2)}
.phones{display:flex;gap:56px;justify-content:center;flex-wrap:wrap}
.home{display:grid;grid-template-columns:repeat(4,1fr);gap:22px 16px}
.app{display:flex;flex-direction:column;align-items:center;gap:5px;font:11px system-ui}.app span{white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:68px}
.ni{width:62px;height:62px;border-radius:14px;position:relative;overflow:hidden}.ni svg{display:block;width:100%;height:100%}
.mail{border:1px solid var(--line);border-radius:12px;overflow:hidden;max-width:560px}
.mail .bar{height:64px;display:flex;align-items:center;padding:0 28px;border-bottom:1px solid var(--line)}
.mail .bar svg{height:28px;width:auto}
.mail .body{padding:28px;font-size:15px}
.shelf{display:flex;gap:40px;align-items:flex-end;justify-content:center;padding:30px;background:linear-gradient(#efe7dc,#e3d7c7);border-radius:12px}
.spine{width:58px;height:400px;border-radius:3px;display:flex;flex-direction:column;align-items:center;justify-content:space-between;padding:26px 0}
.spine .t{writing-mode:vertical-rl;font-size:18px}
.cover{width:300px;height:400px;border-radius:3px 8px 8px 3px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:26px;position:relative}
.cloth{background:#8A5A3B;background-image:repeating-linear-gradient(45deg,rgba(255,255,255,.035) 0 2px,transparent 2px 4px),repeating-linear-gradient(-45deg,rgba(0,0,0,.05) 0 2px,transparent 2px 4px)}
.emboss path{fill:#7c5034}.emboss{filter:drop-shadow(-1px -1px 0 rgba(0,0,0,.35)) drop-shadow(1px 1px 0 rgba(255,255,255,.18))}
table{border-collapse:collapse;width:100%}td,th{border-top:1px solid var(--line);padding:14px 12px;vertical-align:top;text-align:left;font-size:15px}th{font:600 12px system-ui;letter-spacing:.06em;text-transform:uppercase;color:var(--muted)}
td:nth-child(2){white-space:nowrap;font-weight:600}
.sk{display:grid;grid-template-columns:repeat(3,1fr);gap:20px}.sk figure{margin:0}.sk img{width:100%;border:1px solid var(--line);border-radius:6px;background:#fff}.sk figcaption{font-size:13px;color:var(--muted)}
.rat{font-size:21px;line-height:1.6;max-width:760px}
@media (max-width:760px){.hero{grid-template-columns:1fr}.sk{grid-template-columns:1fr}}
</style></head><body>
<header class="wrap" style="padding-top:56px"><div class="k">Logo round 2 · D3 · held · v1</div><h1>The book that holds</h1><p style="color:var(--muted);max-width:700px;margin:0">An open book whose pages rise around a small card that rests against one page, as if someone tucked a note in for later. Parent and child by scale only.</p></header>
<section class="hero" style="padding:40px 0 0;border:0">
 <div style="background:${C.paper}">${sym(C.ink)}<div class="lk">${lockH}</div></div>
 <div style="background:${C.paperDark}">${sym(C.accentDark)}<div class="lk">${lockHrev}</div></div>
</section>
<div class="wrap">
<section><div class="k">For a parent</div><h2>Why this mark</h2><p class="rat">It is your book, open, with a small note resting in its pages, the way you would tuck a letter into a book for someone to find years from now. The pages rise around it like arms, big around small. Everything you say goes in there and stays exactly as you said it, kept safe until your child is old enough to read it.</p></section>

<section><div class="k">Sizes</div><h2>From browser tab to App Store</h2>
<div class="sizes">
 ${[16, 29, 60, 180].map((s) => `<figure><img class="px" src="png/icon-${s}.png" width="${s}" height="${s}" style="border-radius:${s * 0.2237}px"><figcaption>${s}px</figcaption></figure>`).join('')}
 <figure><img class="px" src="png/icon-16.png" width="128" height="128"><figcaption>16px, 8x</figcaption></figure>
 <figure><img class="px" src="png/icon-29.png" width="232" height="232"><figcaption>29px, 8x</figcaption></figure>
</div>
<div class="sizes" style="margin-top:28px">
 <figure><img class="px" src="png/favicon-16.png" width="128"><figcaption>favicon 16, light, 8x</figcaption></figure>
 <figure><img class="px" src="png/favicon-dark-16.png" width="128"><figcaption>favicon 16, dark, 8x</figcaption></figure>
 <figure><img class="px" src="png/icon-dark-29.png" width="232"><figcaption>29px dark icon, 8x</figcaption></figure>
 <figure><span class="tile" style="width:180px;height:180px">${icon(C.paperDark, C.accentDark)}</span><figcaption>180px dark</figcaption></figure>
</div>
<p style="color:var(--muted);font-size:14px;max-width:760px">At 40px and below the small cut is used: wider gutter, larger card, wider gaps (5.6 units against 3.5). At 16px the card is a dot and only the silhouette survives.</p>
</section>

<section><div class="k">Home screen</div><h2>Among the neighbours, light and dark</h2>
<div class="phones">
 <div class="phone" style="background:linear-gradient(160deg,#e9dccb,#cdb8a0);color:#2a2018"><div class="home">${grid(false)}</div></div>
 <div class="phone" style="background:linear-gradient(160deg,#25211d,#0f0d0b);color:#eee"><div class="home">${grid(true)}</div></div>
</div>
<p style="color:var(--muted);font-size:14px;max-width:760px;margin:22px auto 0">Neighbour icons are rough stand-ins, drawn here. "Books" is a deliberately close stand-in for Apple Books (white open book on orange) so the risk is visible: at a glance the two are cousins.</p>
</section>

<section><div class="k">Email</div><h2>Header at 28px</h2>
<div style="display:flex;gap:32px;flex-wrap:wrap">
 <div class="mail" style="background:#fff"><div class="bar">${lockH}</div><div class="body"><b>Here is your sign-in link</b><p style="color:var(--muted)">Tap the button on this phone to sign in.</p></div></div>
 <div class="mail" style="background:${C.paperRaisedDark};color:${C.inkDark};border-color:${C.lineDark}"><div class="bar" style="border-color:${C.lineDark}">${lockHrev}</div><div class="body"><b>Here is your sign-in link</b><p style="color:${C.inkMutedDark}">Tap the button on this phone to sign in.</p></div></div>
</div></section>

<section><div class="k">Print</div><h2>Spine and cloth cover, single-colour emboss</h2>
<div class="shelf">
 <div class="spine cloth" style="color:#e9dccb">${sym('#e9dccb', MAIN, '').replace('<svg', '<svg style="width:36px"')}<span class="t">Early Letters: Year One</span><span style="font-size:11px">I</span></div>
 <div class="spine" style="background:${C.paper};color:${C.ink};box-shadow:inset 0 0 0 1px #d8cdbd">${sym(C.accent).replace('<svg', '<svg style="width:36px"')}<span class="t">Early Letters: Year Two</span><span style="font-size:11px">II</span></div>
 <div class="cover cloth"><span class="emboss">${sym('#7c5034').replace('<svg', '<svg style="width:120px"')}</span><span class="emboss" style="width:170px">${`<svg viewBox="50 -774 6048 1012" style="width:170px;display:block"><path d="${wmOnly}"/></svg>`}</span><span style="position:absolute;bottom:26px;font:11px system-ui;letter-spacing:.18em;color:#d9c3ad">YEAR ONE</span></div>
</div>
<p style="color:var(--muted);font-size:14px">Blind emboss is simulated with two hairline shadows. The mark has no lines thinner than the gutter (2.8 units at 100), which holds in a 0.4mm emboss at 30mm wide.</p>
</section>

<section><div class="k">Lockups</div><h2>Horizontal and stacked</h2>
<div style="display:flex;gap:60px;align-items:center;flex-wrap:wrap"><div style="width:420px">${lockH}</div><div style="width:240px">${lockS}</div></div></section>

<section><div class="k">The six tests</div><h2>Honest results</h2>
<table><tr><th>Test</th><th>Result</th><th>Notes</th></tr>${tests.map((t) => `<tr><td>${t[0]}</td><td>${t[1]}</td><td>${t[2]}</td></tr>`).join('')}</table>
<p style="font-size:14px;color:var(--muted);margin-top:18px">Near matches found: the generic "book shaped as an M" stock logo (scalebranding.com "Iconic Book M"), countless open-book education marks, and Apple Books (open book on a warm tile). No exact copy found in a quick web search; a professional search is still needed.</p>
</section>

<section><div class="k">Rejected</div><h2>Sketches and rounds</h2><div class="sk">${rejected.map(([f, w]) => `<figure><img src="sketches/${f}"><figcaption>${w}</figcaption></figure>`).join('')}</div></section>
<p style="font-size:12px;color:var(--muted);padding:30px 0">Built from source/build.mjs (geometry in source/mark.mjs). Filled paths only. Wordmark reused from direction A.</p>
</div></body></html>`;
fs.writeFileSync(path.join(OUT, 'presentation.html'), html);
fs.writeFileSync(path.join(OUT, 'sketches/README.txt'), rejected.map(([f, w]) => `${f}: ${w}`).join('\n') + '\n');
await shoot([{ file: path.join(OUT, 'presentation.html'), out: path.join(OUT, 'png/presentation-preview.png'), width: 1200, height: 900, fullPage: true }]);
console.log('presentation written');
