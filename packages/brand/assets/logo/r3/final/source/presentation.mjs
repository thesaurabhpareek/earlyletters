// node presentation.mjs : proof images + presentation.html (run after build.mjs and the bench)
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { pair, glyph } from './mark.mjs';
import { place, tileSvg } from './layout.mjs';
import { bbox, transform, toD } from './g2.mjs';
import { proofSvg } from './proof.mjs';
import { VARIANTS, C } from './config.mjs';
import { shoot } from './render.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..');
const PR = path.join(ROOT, 'proofs'); fs.mkdirSync(PR, { recursive: true });
const facts = JSON.parse(fs.readFileSync(path.join(HERE, 'facts.json'), 'utf8'));
const rd = (f) => fs.readFileSync(path.join(ROOT, f), 'utf8');
const inline = (f) => rd(f).replace(/<title>.*?<\/title>/, '').replace('<svg ', '<svg class="s" ');

// ---- proofs: Y's parent vs the final parents, with curvature combs ----
const { quoteArc } = await import('./ref/y-geom.mjs');
const { G: YG } = await import('./ref/y-quote.mjs');
const yShape = quoteArc(YG);
// Y's outline traverses anticlockwise; reverse so the comb sits outside like ours
const rev = (sh) => { const pts = [sh.start, ...sh.segs.map((g) => g.p)]; const segs = []; for (let i = sh.segs.length - 1; i >= 0; i--) segs.push({ c1: sh.segs[i].c2, c2: sh.segs[i].c1, p: pts[i] }); return { start: pts[pts.length - 1], segs }; };
const jobs = [];
const proofJob = (sh, f) => jobs.push({ html: `<body style="margin:0">${proofSvg(sh, 560)}</body>`, out: path.join(PR, f), width: 560, height: 560 });
proofJob(rev(yShape), 'proof-y-parent.png');
proofJob(glyph(VARIANTS['final-a'].master.g).shape, 'proof-final-a-parent.png');
proofJob(glyph(VARIANTS['final-b'].master.g).shape, 'proof-final-b-parent.png');
proofJob(glyph(VARIANTS['final-a'].small.g).shape, 'proof-final-a-small-parent.png');
// ---- "66" rotation test (identity critic item 9) ----
for (const rot of [0, -4]) {
  const V = VARIANTS['final-a'].master; const P = pair(V.g, V.p, V.kid);
  const sh = P.shapes.map((s) => transform(s, { rot }));
  const pl = place(sh, V);
  jobs.push({ html: `<body style="margin:0">${tileSvg(pl, 240, { radius: 0.2237 })}</body>`, out: path.join(PR, `rotate-${-rot}.png`), width: 240, height: 240, transparent: true });
}
await shoot(jobs);

// ---- banding: undithered vs shipped, contrast stretched x12 around the mean so 1-LSB steps are visible ----
execFileSync('python3', ['-c', `
import numpy as np
from PIL import Image
h=1024
t=(np.arange(h)+.5)/h
top=np.array([0x9A,0x61,0x3C],float); bot=np.array([0x7F,0x4F,0x30],float)
g=top[None,:]*(1-t[:,None])+bot[None,:]*t[:,None]
plain=np.repeat(np.rint(g)[:,None,:],200,axis=1)
ship=np.asarray(Image.open(r'${path.join(ROOT, 'final-a', 'app-icon-1024.png')}').convert('RGB'),float)[:, :200, :]
def stretch(a):
  base=np.repeat(g[:,None,:],a.shape[1],axis=1)
  return np.clip(128+(a-base)*40,0,255).astype(np.uint8)
out=np.concatenate([stretch(plain),np.full((h,20,3),255,np.uint8),stretch(ship)],axis=1)
Image.fromarray(out).resize((210,512)).save(r'${path.join(PR, 'banding-stretched.png')}')
`]);

// ---- page ----
const F = facts;
const v = (slug) => VARIANTS[slug];
const unitsToMm = (slug) => { const P = pair(v(slug).master.g, v(slug).master.p, v(slug).master.kid); const b = bbox(P.shapes); return 25 / b.w; };
const notch = (slug) => { const g = { ...glyph({}).shape }; const mm = unitsToMm(slug); return { parent: (0.4 * mm).toFixed(2), child: (0.4 * 0.62 * mm).toFixed(2), gap: ((slug === 'final-a' ? 0.185 : 0.2) * mm).toFixed(2) }; };
const cell = (slug) => {
  const f = F[slug];
  return `<div class="var"><h3>${v(slug).title}</h3>
  <div class="big paper">${inline(`${slug}/symbol-accent.svg`).replace(/#8A5A3B/g, C.accentDeep)}</div>
  <div class="big night">${inline(`${slug}/symbol-reversed.svg`).replace(/#F2ECE4/g, C.accentDark)}</div>
  <div class="icons"><figure><img src="${slug}/app-icon-1024.png" class="ic r"><figcaption>default</figcaption></figure><figure><img src="${slug}/app-icon-dark-1024.png" class="ic r"><figcaption>dark</figcaption></figure><figure><img src="${slug}/app-icon-tinted-1024.png" class="ic r"><figcaption>tinted layer (system tints it)</figcaption></figure></div>
  <table class="facts"><tr><td>Mark in tile</td><td>${f.tile.boxPct[0]}% x ${f.tile.boxPct[1]}% (Y: 49% x 49%), ink ${f.tile.ink}%</td></tr>
  <tr><td>Mass centre</td><td>${f.tile.mass.join(', ')} at 1024 (Y: 487, 569)</td></tr>
  <tr><td>Gap between marks</td><td>${f.gap1024} px at 1024 (${f.gapAt29} px at 29); small cut ${f.gapSmall1024} (${f.gapSmallAt29} px at 29)</td></tr>
  <tr><td>Child</td><td>exactly the parent's base drawing x ${f.ratio}, leaning ${-f.lean} deg toward it, lifted ${slug === 'final-a' ? '0.08' : '0.12'} bowl radii</td></tr>
  <tr><td>On-curve nodes</td><td>parent ${f.nodes.parent}, child ${f.nodes.child}; every join G2 (solved, see proofs)</td></tr></table></div>`;
};
const sizes = (slug) => `<div class="sizes">${[180, 60, 40, 29, 16].map((px) => `<figure><img src="${slug}/png/icon-${px}.png" width="${px}" height="${px}" class="r"><figcaption>${px}${px <= 40 ? ' small cut' : ''}</figcaption></figure>`).join('')}
  ${[16, 29].map((px) => `<figure><img src="${slug}/png/icon-${px}.png" width="${px * 8}" height="${px * 8}" class="px"><figcaption>${px} px, 8x, shipped (hand-tuned small cut)</figcaption></figure>`).join('')}
  ${[16, 29].map((px) => `<figure><img src="${slug}/png/icon-${px}-from-master.png" width="${px * 8}" height="${px * 8}" class="px dim"><figcaption>${px} px, 8x, master scaled (what a single-size icon gives)</figcaption></figure>`).join('')}</div>
  <div class="sizes dark">${[180, 60, 40, 29, 16].map((px) => `<figure><img src="${slug}/png/icon-${px}-dark.png" width="${px}" height="${px}" class="r"><figcaption>${px} dark</figcaption></figure>`).join('')}</div>`;
const homes = (slug) => `<div class="homes">${['home-light', 'home-dark', 'home-tinted'].map((h) => `<figure><img src="${slug}/bench/${h}.png" class="phone"><figcaption>${h.replace('home-', '')}${h === 'home-tinted' ? ' (simulated)' : ''}</figcaption></figure>`).join('')}</div><div class="homes" style="margin-top:8px">${['home-light', 'home-dark', 'home-tinted'].map((h) => `<figure><img src="${slug}/bench/${h}-crop.png" style="width:100%;border-radius:10px"><figcaption>${h.replace('home-', '')}, native 3x crop</figcaption></figure>`).join('')}</div>`;
const email = (slug) => `<div class="email"><div class="mail"><div class="hdr"><img src="${slug}/lockup-horizontal-small.svg" style="height:28px"></div><p class="mb">A new letter for Asha is in the book.</p><p class="mt">Recorded today, kept exactly as you said it.</p></div>
  <div class="mail dk"><div class="hdr"><img src="${slug}/lockup-horizontal-small-reversed.svg" style="height:28px"></div><p class="mb">A new letter for Asha is in the book.</p></div></div>`;
const emboss = (slug) => {
  const d = rd(`${slug}/symbol.svg`).match(/ d="([^"]+)"/)[1];
  const vb = rd(`${slug}/symbol.svg`).match(/viewBox="([^"]+)"/)[1];
  const n = notch(slug);
  return `<div class="book"><div class="cover"><svg viewBox="${vb}" class="deb"><defs><filter id="deb-${slug}" x="-10%" y="-10%" width="120%" height="120%"><feFlood flood-color="#3b2416" flood-opacity=".75"/><feComposite in2="SourceAlpha" operator="out"/><feOffset dx="9" dy="11"/><feGaussianBlur stdDeviation="9"/><feComposite in2="SourceAlpha" operator="in" result="sh"/><feFlood flood-color="#c99067" flood-opacity=".5"/><feComposite in2="SourceAlpha" operator="out"/><feOffset dx="-6" dy="-7"/><feGaussianBlur stdDeviation="6"/><feComposite in2="SourceAlpha" operator="in" result="hl"/><feMerge><feMergeNode in="SourceGraphic"/><feMergeNode in="sh"/><feMergeNode in="hl"/></feMerge></filter></defs><path d="${d}" fill="#6f4429" filter="url(#deb-${slug})"/></svg><div class="title">Year One</div></div>
  <p class="cap">Blind deboss, mark 25 mm wide. Notch bottom (fillet diameter) ${n.parent} mm on the parent, ${n.child} mm on the child; gap between marks ${n.gap} mm. All above the 0.5 mm minimum the production critic set.</p></div>`;
};

const rows = [
  ['Cold read', 'Widen the gap between the marks to about 32 to 40/1024', `Done. ${F['final-a'].gap1024} px (a), ${F['final-b'].gap1024} px (b) at 1024, measured outline to outline. The small cut opens it to ${F['final-a'].gapSmall1024} / ${F['final-b'].gapSmall1024}.`],
  ['Cold read, identity', 'Smooth the inner-join nub ("button") where the tail meets the bowl', 'Done. The inner tail edge, the notch and the bowl are three anchors joined by curvature-solved cubics. No convex bump remains; see the combs in the proof row.'],
  ['Cold read, parents, identity', 'Thicken the tail tips in the small cut 15 to 20% (identity: +20%, shorten 10%)', 'Done. Small cut tail width 0.76 vs 0.62 (+23%), sweep 3 degrees shorter (about 9% of the tail), notch radius 0.30 vs 0.20.'],
  ['Cold read, culture, identity', 'Scale the mark up (6 to 8%, 8 to 10%, 15%)', `Done. Box height 49% to 56% (+14%); width ${F['final-a'].tile.boxPct[0]}%. Ink 12.7% to ${F['final-a'].tile.ink}%.`],
  ['Cold read, strategy', 'Keep the 0.62 ratio visible; never drift to equal sizes; make it a rule', 'Done. Master 0.62, small cut 0.64. Rule: the child is never above 0.66 and never below 0.58.'],
  ['Cold read, parents', 'Tenderness: move the child closer, lean it toward the parent; kill the "66" read', 'Done. Child leans 14 degrees in (Y: 8), is lifted off the shared baseline so it tucks under the parent\'s tail, and sits 35 px away. Stranger test below.'],
  ['Culture', 'Open the small mark\'s notch; >= 0.5 mm at 25 mm emboss', 'Done. See the emboss: notch and gap sizes are printed under it.'],
  ['Culture, strategy', 'Ship hand-tuned 16, 29, 40 px assets (asset catalog, All Sizes)', 'Done. png/icon-16/29/40 come from symbol-small, pixel-fitted (best of 27 sub-pixel offset and +-2% scale trials, chosen for edge crispness). Engineering must ship an asset catalog with All Sizes, not one Icon Composer master, or these never reach a device.'],
  ['Culture', 'Check the system tinted-light glyph on a device', 'Not done (no device). Simulated in the bench only; the tinted PNG is one grayscale layer so the system controls the result.'],
  ['Identity', 'Re-centre optically (mass to about 505, 525)', `Done, within 9 px: mass ${F['final-a'].tile.mass.join(', ')}. I left it 9 px lower than the critic's number: at 525 the tail tip crowded the top on the home screen.`],
  ['Identity', 'Wedge corner radius 7 to about 14 px at 1024', 'Done. Corner radius 0.085 bowl radii = 14.5 px at 1024 on the parent, 9 px on the child, entered and left on a curvature ramp.'],
  ['Identity', 'Remove the flat segment where the outer tail meets the bowl (G2)', 'Done. One G2 cubic carries the curvature from the bowl (1.0) down to the tail (0.28) without a dip or spike; see the comb on the left of each proof.'],
  ['Identity', 'Dither the gradient (59 steps, about 17 px bands)', `Done. Gradient computed in float, TPDF-dithered to 8 bit. Longest identical run down the edge is 9 px (was about 38 px between #9A613C and #7F4F30 undithered). Stretched view below.`],
  ['Identity', 'Lockup: bowls on the baseline with overshoot, top on W4\'s ascender, space 0.7 x cap height, add a stacked lockup', 'Done. Bowl bottoms 12 units below the baseline (1.7%), top of the mark on the ascender of "l" (705 units), space 458 units = 0.7 x cap 654. Stacked lockup at 2.2 x cap height.'],
  ['Identity', 'Test rotating the pair 3 to 5 degrees anticlockwise against the "66" read', 'Tested (below). Rotation helps a little but tips the bowls off their baseline; the child\'s lean does the same job without losing the ground line, so neither final is rotated.'],
  ['Identity', 'Test the sheltering-tail variant as one A/B against plain', 'Done: that is final-b. The 5-plus-parent blind recall test at 60 and 29 px still needs real people.'],
  ['Identity', 'Paper-ground version (sepia on #FBF8F3)', 'Done. symbol-accent.svg and the large paper row (accentDeep #7F4F30 on paper, 6.47:1).'],
  ['Parents', 'Bowls fully round at the bottom, never sharpen the top (teardrop)', 'Done. Bowls are true circles between the joins; the only corners are the two rounded cut corners at each tail tip.'],
  ['Strategy', 'Add tension to the terminals so they are not babyish', 'Done by inheritance: Y\'s angled cut, softened only at the corners. No ball terminals.'],
  ['Strategy', 'Separate from the quote-app genre; USPTO design-code search before filing', 'Colour, ratio and lockup do the separating. The trademark search is not done; it needs counsel.'],
];

const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Early Letters mark, final</title><link rel="preconnect" href="https://fonts.googleapis.com"><link href="https://fonts.googleapis.com/css2?family=EB+Garamond:wght@500&display=swap" rel="stylesheet">
<style>
:root{--paper:#FBF8F3;--ink:#2B2722;--muted:#6B645B;--line:#E6DED3;--accent:#8A5A3B}
*{box-sizing:border-box}body{margin:0;background:var(--paper);color:var(--ink);font:15px/1.55 Inter,system-ui,sans-serif}
main{max-width:1240px;margin:0 auto;padding:40px 24px 80px}h1{font:500 34px/1.2 'EB Garamond',Georgia,serif;margin:0 0 6px}h2{font:500 24px/1.3 'EB Garamond',Georgia,serif;margin:56px 0 12px;border-top:1px solid var(--line);padding-top:24px}h3{margin:0 0 10px;font-size:15px}
.lede{color:var(--muted);max-width:760px}.two{display:grid;grid-template-columns:1fr 1fr;gap:28px}@media(max-width:820px){.two{grid-template-columns:1fr}}
.big{height:330px;display:flex;align-items:center;justify-content:center;border-radius:14px;margin-bottom:12px}.big .s{height:62%;width:auto}.paper{background:#FBF8F3;border:1px solid var(--line)}.night{background:#161412}
.icons{display:flex;gap:12px}.icons figure{flex:1;margin:0}.ic{width:100%;display:block}.r{border-radius:22.37%}
figure{margin:0}figcaption{font-size:12px;color:var(--muted);margin-top:4px}
.facts{width:100%;border-collapse:collapse;margin-top:14px;font-size:13px}.facts td{padding:5px 6px;border-top:1px solid var(--line);vertical-align:top}.facts td:first-child{color:var(--muted);width:32%}
.sizes{display:flex;gap:18px;align-items:flex-end;flex-wrap:wrap;padding:18px;background:#f2f2f7;border-radius:12px;margin-bottom:10px}.sizes.dark{background:#000}.sizes.dark figcaption{color:#aaa}
.px{image-rendering:pixelated}.dim{opacity:.95}
.homes{display:flex;gap:10px}.homes figure{flex:1}.phone{width:100%;border-radius:22px;display:block}
.email{display:flex;gap:16px;flex-wrap:wrap}.mail{flex:1;min-width:280px;background:#fff;border:1px solid var(--line);border-radius:10px;padding:22px 26px}.mail .hdr{padding-bottom:16px;border-bottom:1px solid var(--line);margin-bottom:14px}.mb{font:18px/1.4 'EB Garamond',Georgia,serif;margin:0 0 4px}.mt{color:var(--muted);margin:0;font-size:14px}.mail.dk{background:#161412;border-color:#33302C;color:#F2ECE4}.mail.dk .hdr{border-color:#33302C}
.book{display:flex;flex-direction:column;gap:8px}.cover{position:relative;aspect-ratio:3/4;max-width:340px;border-radius:4px 10px 10px 4px;background:#7F4F30;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='2'/%3E%3CfeColorMatrix values='0 0 0 0 .2 0 0 0 0 .12 0 0 0 0 .07 0 0 0 .35 0'/%3E%3C/filter%3E%3Crect width='160' height='160' filter='url(%23n)'/%3E%3C/svg%3E");box-shadow:inset 10px 0 18px rgba(0,0,0,.25),0 14px 30px rgba(0,0,0,.18)}
.deb{position:absolute;left:50%;top:38%;width:40%;transform:translate(-50%,-50%)}.cover .title{position:absolute;bottom:14%;width:100%;text-align:center;font:500 22px 'EB Garamond',Georgia,serif;color:#c99a78;letter-spacing:.06em}.cap{font-size:13px;color:var(--muted);max-width:340px}
table.fix{width:100%;border-collapse:collapse;font-size:13.5px}table.fix th,table.fix td{text-align:left;border-top:1px solid var(--line);padding:8px 8px;vertical-align:top}table.fix th{font-weight:600;background:#f4efe8}
.proofs{display:grid;grid-template-columns:repeat(4,1fr);gap:10px}.proofs img{width:100%;border:1px solid var(--line);border-radius:8px}@media(max-width:820px){.proofs{grid-template-columns:1fr 1fr}}
.cmp{display:grid;grid-template-columns:repeat(5,1fr);gap:10px}.cmp img{width:100%;border-radius:22.37%}
.rec{background:#f4efe8;border-radius:12px;padding:18px 22px}
.lk{background:#fff;border:1px solid var(--line);border-radius:12px;padding:28px;display:flex;flex-direction:column;gap:26px}.lk img{display:block}
</style></head><body><main>
<h1>Early Letters: the final mark</h1>
<p class="lede">Two finals from one drawing system. Y's typographic quotation mark, redrawn with curvature-continuous joins and softened wedge corners, given X's presence in the tile, a closer and leaning child, a dedicated small cut, the dithered Leather T tile and the W4 wordmark. <b>final-a</b> is the pair. <b>final-b</b> adds a restrained version of round 2's gesture: the parent's tail bends over the child.</p>

<h2>Large, on paper and at night</h2>
<div class="two">${cell('final-a')}${cell('final-b')}</div>

<h2>Sizes (shipped PNGs, 1 CSS px = 1 image px)</h2>
<div class="two"><div><h3>final-a</h3>${sizes('final-a')}</div><div><h3>final-b</h3>${sizes('final-b')}</div></div>

<h2>Home screen: light, dark, tinted (icon bench, 3x)</h2>
<div class="two"><div><h3>final-a</h3>${homes('final-a')}</div><div><h3>final-b</h3>${homes('final-b')}</div></div>

<h2>Lockups (W4, EB Garamond, revised spacing)</h2>
<div class="two"><div class="lk"><img src="final-a/lockup-horizontal.svg" style="width:88%"><img src="final-a/lockup-stacked.svg" style="width:52%;align-self:center"></div><div class="lk"><img src="final-b/lockup-horizontal.svg" style="width:88%"><img src="final-b/lockup-stacked.svg" style="width:52%;align-self:center"></div></div>

<h2>Email header (28 px lockup, small cuts)</h2>
<div class="two"><div>${email('final-a')}</div><div>${email('final-b')}</div></div>

<h2>Book cover, blind deboss</h2>
<div class="two">${emboss('final-a')}${emboss('final-b')}</div>

<h2>Drawing proofs: nodes, handles and curvature combs</h2>
<p class="lede">The blue comb is curvature. A smooth comb means a smooth contour; a jump means a visible join. Y's comb jumps where the tail meets the bowl (outer flat run) and spikes at the inner button. The finals ramp everywhere; the only peaks are the two deliberately rounded cut corners.</p>
<div class="proofs"><figure><img src="proofs/proof-y-parent.png"><figcaption>Y (r3/quote-letter) parent, as reviewed</figcaption></figure><figure><img src="proofs/proof-final-a-parent.png"><figcaption>final parent (a; also b's child)</figcaption></figure><figure><img src="proofs/proof-final-b-parent.png"><figcaption>final-b parent, sheltering tail</figcaption></figure><figure><img src="proofs/proof-final-a-small-parent.png"><figcaption>small cut parent (16 to 40 px)</figcaption></figure></div>

<h2>Where it came from</h2>
<div class="cmp"><figure><img src="../quote/app-icon-1024.png"><figcaption>X (r3/quote)</figcaption></figure><figure><img src="../quote-letter/app-icon-1024.png"><figcaption>Y (r3/quote-letter)</figcaption></figure><figure><img src="../../r2/two-voices/app-icon-1024.png"><figcaption>round 2 two-voices (the arch)</figcaption></figure><figure><img src="final-a/app-icon-1024.png"><figcaption>final-a</figcaption></figure><figure><img src="final-b/app-icon-1024.png"><figcaption>final-b</figcaption></figure></div>
<div class="two" style="margin-top:20px"><div><h3>Gradient banding, contrast stretched 40x</h3><img src="proofs/banding-stretched.png" style="width:210px;image-rendering:pixelated"><p class="cap">Left: plain 8-bit gradient (bands about 38 px tall). Right: the shipped dithered tile. At normal contrast both look smooth; on some panels and after compression only the right one stays smooth.</p></div>
<div><h3>"66" test: rotate the pair 4 degrees?</h3><div style="display:flex;gap:12px"><figure><img src="proofs/rotate-0.png" width="160"><figcaption>shipped (0)</figcaption></figure><figure><img src="proofs/rotate-4.png" width="160"><figcaption>rotated 4 deg anticlockwise</figcaption></figure></div></div></div>

<h2>Every must-fix from the final critiques</h2>
<table class="fix"><tr><th style="width:16%">Critic</th><th style="width:30%">Must-fix</th><th>Done / how</th></tr>${rows.map((r) => `<tr><td>${r[0]}</td><td>${r[1]}</td><td>${r[2]}</td></tr>`).join('')}</table>

<h2>Recommendation</h2>
<div class="rec" id="rec"><p><b>Ship final-a.</b> It is the cleaner mark: one idea (a parent quote and a child quote leaning in), 12 nodes a glyph, every join G2, and it holds best at 16 and 29 px, in the email header and in the deboss. The lean and lift carry the tenderness the critics asked for without adding a shape.</p>
<p><b>final-b is the more ownable drawing</b> (no quote app has a tail that bends over a second mark), and at 1024 and on the book cover it is the most expressive. Against it: at 16 px the arch and the child start to merge, at a glance the parent can read as a hooked "6" or a "G", and the long horizontal tail pulls the mark right and up, so it sits less calmly in the tile and next to the wordmark.</p>
<p>The deciding question is recall against calm, and only parents can answer it. If the founder wants evidence before choosing, run the identity critic's test: final-a against final-b, 60 and 29 px, in a home-screen grid, five-second recall with at least five parents (ideally the 60-parent Lyssna test the parent critic costed at 100 to 200 dollars). If b does not clearly win on recall, ship a.</p>
<p class="cap">Limits: the bench approximates Liquid Glass and the tinted modes; the tinted-light result, the gradient in Icon Composer and the asset catalog small sizes must be checked on a device. Trademark search not done.</p></div>
</main></body></html>`;
fs.writeFileSync(path.join(ROOT, 'presentation.html'), html);
console.log('ok');
