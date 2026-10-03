// presentation.html for the quote-letter round. Images are referenced relative to the folder.
export function presentation({ C, TILE, dMain, dSmall, bM, bS, files, extra, icon, iconSmall, G, PAIR, SMALL, nodes, wmD }) {
  const vb = (b, p = 0.08) => { const m = Math.max(b.w, b.h) * p; return `${b.x0 - m} ${b.y0 - m} ${b.w + 2 * m} ${b.h + 2 * m}`; };
  const mark = (fill, px, d = dMain, b = bM) => `<svg width="${px}" height="${px}" viewBox="${vb(b)}"><path fill="${fill}" d="${d}"/></svg>`;
  const inline = (s, h) => s.replace('<svg ', `<svg style="height:${h}px;width:auto;display:block" `);
  const sk = (f, cap) => `<figure><img src="sketches/${f}" loading="lazy"><figcaption>${cap}</figcaption></figure>`;
  const cloth = (bg, id) => `<filter id="${id}"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="4"/><feColorMatrix values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.18 0"/><feComposite in2="SourceGraphic" operator="in"/><feBlend in="SourceGraphic" mode="multiply"/></filter>`;
  const emboss = `<filter id="deb" x="-10%" y="-10%" width="120%" height="120%"><feOffset dx="0" dy="6" in="SourceAlpha" result="o"/><feComposite in="SourceAlpha" in2="o" operator="out" result="edge"/><feFlood flood-color="#000" flood-opacity="0.35"/><feComposite in2="edge" operator="in" result="sh"/><feOffset dx="0" dy="-4" in="SourceAlpha" result="o2"/><feComposite in="SourceAlpha" in2="o2" operator="out" result="e2"/><feFlood flood-color="#fff" flood-opacity="0.18"/><feComposite in2="e2" operator="in" result="hi"/><feMerge><feMergeNode in="SourceGraphic"/><feMergeNode in="sh"/><feMergeNode in="hi"/></feMerge></filter>`;
  const s = Math.round(PAIR.ratio * 100);
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Quote and Letter</title>
<style>
:root{--paper:${C.paper};--ink:${C.ink};--muted:${C.inkMuted};--accent:${C.accent};--line:${C.line};--soft:${C.accentSoft}}
@media (prefers-color-scheme:dark){:root:not([data-theme="light"]){--paper:${C.paperDark};--ink:${C.inkDark};--muted:#B7AEA3;--line:#2E2925;--soft:#2A231E}}
:root[data-theme="dark"]{--paper:${C.paperDark};--ink:${C.inkDark};--muted:#B7AEA3;--line:#2E2925;--soft:#2A231E}
*{box-sizing:border-box}body{margin:0;background:var(--paper);color:var(--ink);font:16px/1.55 Georgia,'Iowan Old Style',serif}
main{max-width:1120px;margin:0 auto;padding:40px 16px 80px}h1{font-size:34px;font-weight:500;margin:0 0 6px}h2{font-size:22px;font-weight:500;margin:56px 0 12px;padding-top:18px;border-top:1px solid var(--line)}
p,li{max-width:74ch}.muted{color:var(--muted)}.row{display:flex;flex-wrap:wrap;gap:18px;align-items:flex-end}.card{border-radius:14px;padding:22px;display:flex;align-items:center;justify-content:center}
img{max-width:100%;height:auto;border-radius:8px}figure{margin:0 0 18px}figcaption{font-size:14px;color:var(--muted);margin-top:4px}
table{border-collapse:collapse;width:100%;font-size:15px}td,th{border-top:1px solid var(--line);padding:8px 10px;text-align:left;vertical-align:top}th{font-weight:600}
.px{image-rendering:pixelated}.verdict{font-size:19px;background:var(--soft);padding:16px 18px;border-radius:12px}
.grid2{display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:18px}
</style></head><body><main>
<h1>Quote and letter</h1>
<p class="muted">Logo round 3, slug <code>quote-letter</code>. Question tested: does adding a letter (sheet, envelope, page) to the large and small opening quotation marks make the mark communicate more without losing simplicity and elegance?</p>
<p class="verdict"><b>Honest answer: no. The letter adds clutter, and the pure pair wins.</b> Five integrations were drawn and refined; four read as a document, mail or printer icon, and the fifth (the whole tile is a page) is the only one that keeps the pair at full size, but its turned corner crowds the small mark at 29 px, disappears in dark, tinted and clear modes, and turns the tile white beside Calendar and Notes. The name under the icon already says "Letters". The page idea survives as a print and web device, not as the app icon.</p>
<div class="row">${icon(260, { radius: 0.2237 })}${icon(260, { bg: TILE.dark, fg: C.accentDark, radius: 0.2237 })}<div class="card" style="background:${C.paper};border:1px solid ${C.line}">${mark(C.ink, 216)}</div><div class="card" style="background:${C.paperDark}">${mark(C.accentDark, 216)}</div></div>

<h2>For a parent (3 sentences)</h2>
<p>Two opening quotation marks, one big and one small, like a parent and a child starting to speak. They promise what the app does: every word is kept exactly as you said it, ready for your child to read one day. The small one is the same mark as the big one, only younger.</p>

<h2>The five letter integrations, and what happened</h2>
<div class="grid2">
${sk('03-integrations-first.png', 'First drawings of all five plus the control. 1 sheet with turned corner and 1b quotes at the top left read as a file or document icon (Google Docs, Files). 2 envelope with a V pocket reads as Mail. 4 cut-out reads as a quote card. 5 the turned corner as the small mark failed: the big mark alone reads as a "6".')}
${sk('04-integrations-second.png', 'Second, best-effort drawings. 1c lifting corner: a sticky note. 2b and 2c pocket without a V (to dodge Mail and any Eid-card read, no crescent anywhere): it stops reading as an envelope and becomes a printer or an inbox tray. 4b: a framed pair, smaller than the pure pair for no gain. 5b: the corner mark reads as a separate "6" sticker.')}
${sk('05-page-tile.png', 'Concept 3, the tile is the page, with a physically correct dog-ear (the corner beyond the fold is reflected across it). The only integration that keeps the pair at full size. P3 (top right) failed in drawing; P4 (sepia page) reads as leather, not paper.')}
${sk('11-page-vs-pure.png', 'Final comparison with the finished pair: three sepia tiles against three page folds (f300, f340, f380).')}
</div>
<div class="grid2">
<figure><img src="bench/page/home-light-crop.png"><figcaption>Bench, page tile at true home-screen scale. The page reads instantly. It also reads as a peeling sticker, and the tile goes white like Calendar, Notes and Photos.</figcaption></figure>
<figure><img src="bench/final/home-light-crop.png"><figcaption>Bench, the winner at true scale: the pair on the sepia gradient tile.</figcaption></figure>
</div>
${sk('../bench/page/sizes.png', 'Why the page loses: at 29 and 40 px the turned corner becomes a third blob that touches the small mark, which is exactly where the child lives. In the dark row the page has gone (backgrounds are replaced in dark, tinted and clear), so the letter is not a stable feature of the icon. Apple asks that core features stay the same in every appearance.')}
<table><tr><th>Integration</th><th>Communicates "letter"</th><th>Cost</th><th>Verdict</th></tr>
<tr><td>1 sheet, softly turned corner, quotes printed</td><td>As a document, not a letter</td><td>Pair shrinks to about 30 percent of the tile; file-icon cliché</td><td>Rejected</td></tr>
<tr><td>2 open envelope, quotes as content</td><td>Yes, but as mail</td><td>Mail app read with a V; printer or tray read without one</td><td>Rejected</td></tr>
<tr><td>3 the tile is the page</td><td>Yes, at 60 pt and above</td><td>Corner crowds the child at 29 px; lost in dark, tinted, clear; white tile</td><td>Runner-up, kept for print and web</td></tr>
<tr><td>4 pair cut out of a sheet</td><td>Weakly (a card)</td><td>Frame eats size; reads as a quote card</td><td>Rejected</td></tr>
<tr><td>5 folded letter, fold forms the small mark</td><td>No</td><td>Small mark becomes a sticker; the big mark alone reads as "6"</td><td>Rejected</td></tr>
<tr><td><b>0 the pure pair</b></td><td>Through the name and the tagline</td><td>None</td><td><b>Chosen</b></td></tr></table>

<h2>The mark</h2>
<div class="row"><div class="card" style="background:${C.paper};border:1px solid ${C.line}">${mark(C.ink, 420)}</div><div class="card" style="background:${C.paperDark}">${mark(C.inkDark, 420)}</div></div>
<ul>
<li><b>One drawing.</b> The child is the parent scaled to <b>${PAIR.ratio}</b> (close to 1 / golden ratio), the same outline, not a second drawing. Both balls sit on one baseline. The clear space between the balls is ${PAIR.gap} of the parent's ball radius. The child leans ${Math.abs(PAIR.lean)} degrees toward the parent.</li>
<li><b>Built like type.</b> A round ball and a constant-width tail cut from an annulus whose outer circle is tangent to the ball, so the outer edge flows out of the ball with no seam (tangent continuous). The counter under the tail is a real fillet (radius ${G.rf} of the ball), so there is no notch and no hairline cusp. The tail ends in a calm cut perpendicular to the stroke, its corners softened (cap ${G.cap}), studied from Literata 500, whose quote glyph has the same anatomy (see <code>sketches/00-reference-literata.png</code>). The tail is short and thick (${G.w} of the ball radius), never a curl.</li>
<li><b>Few nodes.</b> ${nodes.main / 2} segments per mark, ${nodes.main} in the master, all cubic, filled paths only.</li>
<li><b>Small cut (16 to 40 px).</b> Tail ${SMALL.g.w} instead of ${G.w}, fillet ${SMALL.g.rf}, child at ${SMALL.p.ratio} and gap ${SMALL.p.gap}, drawn larger in the tile (560 instead of 500 of 1024). Within the cut the child is still the exact scale of the parent; the ratio itself is an optical correction so the child's counter stays open at 29 px.</li>
<li><b>Tile.</b> Sepia gradient ${TILE.top} to ${TILE.bottom} (both stops in the sepia family; tested against flat #8A5A3B and deep #7F4F30 in <code>sketches/11-page-vs-pure.png</code>). It reads as leather rather than parcel brown. In Icon Composer this is the background gradient; it is not exported as art. Dark: ${C.accentDark} on ${TILE.dark}. Light sepia is never used on paper.</li>
</ul>

<h2>Sizes</h2>
<div class="row">${[16, 29, 60, 180].map((p) => `<figure><img class="px" src="png/icon-${p}.png" width="${p}" height="${p}"><figcaption>${p}px</figcaption></figure>`).join('')}</div>
<div class="row"><figure><img class="px" src="png/icon-16.png" width="128" height="128"><figcaption>16px small cut, 8x</figcaption></figure><figure><img class="px" src="png/icon-16-master.png" width="128" height="128"><figcaption>16px master, 8x</figcaption></figure><figure><img class="px" src="png/icon-29.png" width="232" height="232"><figcaption>29px small cut, 8x</figcaption></figure><figure><img class="px" src="png/icon-29-master.png" width="232" height="232"><figcaption>29px master, 8x</figcaption></figure></div>
<div class="row"><figure><img class="px" src="png/favicon-16-light.png" width="128"><figcaption>favicon 16, light, 8x</figcaption></figure><figure><img class="px" src="png/favicon-16-dark.png" width="128"><figcaption>favicon 16, dark, 8x</figcaption></figure></div>
${sk('../bench/final/sizes.png', 'Icon bench sizes sheet (settings, spotlight, home screen at 1x, 2x, 3x; 16, 29, 40 magnified; the small cut is supplied).')}

<h2>Home screen and appearances (icon bench)</h2>
<div class="grid2"><figure><img src="bench/final/sheet-home.png"><figcaption>Light, dark, tinted, clear.</figcaption></figure><figure><img src="bench/final/home-dark-crop.png"><figcaption>Dark, true scale.</figcaption></figure></div>
${sk('../bench/final/appearances.png', 'All six appearances hold, because the mark is a pure silhouette. Tinted-light produces a paper tile with a sepia pair on its own: the "page" idea, for free.')}
<div class="grid2"><figure><img src="bench/final/notification.png"><figcaption>Notification.</figcaption></figure><figure><img src="bench/final/settings-spotlight.png"><figcaption>Settings and Spotlight.</figcaption></figure></div>

<h2>Wordmark: W4 (EB Garamond) with the pair</h2>
<p>W4 copied from <code>r2/wordmark/d-garamond</code> into <code>wordmark/</code>, with the space between "Early" and "Letters" opened by 40 units (master) and 45 (small cut), about 15 percent of a Garamond word space. The small cut is used below 20 px cap height (email header, nav bars). In the horizontal lockup the pair stands where an opening quotation mark would: before the name, balls on the baseline, the parent's tail just above the capitals.</p>
<div class="card" style="background:${C.paper};border:1px solid ${C.line};justify-content:flex-start">${inline(files['lockup-horizontal.svg'], 96)}</div><br>
<div class="card" style="background:${C.paperDark};justify-content:flex-start">${inline(extra.lockupHRev, 96)}</div><br>
<div class="row"><div class="card" style="background:${C.paper};border:1px solid ${C.line}">${inline(files['lockup-stacked.svg'], 220)}</div><div class="card" style="background:${C.paperDark}">${inline(extra.lockupSRev, 220)}</div></div>
<h3>Email header, 28 px tall</h3>
<div class="row"><img src="png/email-header-28.png" width="360"><img src="png/email-header-28-dark.png" width="360"></div>

<h2>Book spine and cloth cover</h2>
<div class="row">
<svg width="520" height="380" viewBox="0 0 520 380"><defs>${cloth('#5E3D28', 'cl')}${emboss}</defs>
<rect x="0" y="0" width="520" height="380" rx="8" fill="#6B4630" filter="url(#cl)"/>
<g transform="translate(200 110) scale(0.12)" filter="url(#deb)"><path fill="#5E3D28" d="${dMain}"/></g>
</svg>
<svg width="120" height="380" viewBox="0 0 120 380"><defs>${cloth('#2B2722', 'cl2')}</defs><rect width="120" height="380" rx="6" fill="#3A332D" filter="url(#cl2)"/><g transform="translate(36 40) scale(0.048)"><path fill="${C.accentDark}" d="${dMain}"/></g>
<g transform="translate(44 120) rotate(90) scale(0.048)"><path fill="${C.accentDark}" d="${wmD}"/></g></svg>
</div>
<p class="muted">Left: blind deboss on sepia cloth. Right: foil on a dark spine. The pair is a single silhouette, so it embosses cleanly at any size.</p>

<h2>Tests</h2>
<table>
<tr><th>Test</th><th>Result</th><th>Notes</th></tr>
<tr><td>2am</td><td>Pass</td><td>A warm leather tile with two soft marks; calm, not clinical, not babyish. Feeling: someone is about to say something to you.</td></tr>
<tr><td>Caption</td><td>Partial</td><td>Without words: "quotes, someone speaking, words kept", and big-and-small suggests parent and child on a second look (my judgement, not tested with parents). "Letters" and "baby" are carried by the name and the tagline, not the icon. Adding a letter did not fix this without costing the mark (see above).</td></tr>
<tr><td>Recall</td><td>Pass</td><td>"Big and small quotation marks." Five words; drawable from memory as "66" with the second one smaller.</td></tr>
<tr><td>Scale</td><td>Pass</td><td>60 px and above: clear. 29 px: both counters open with the small cut. 16 px: two marks, the child's tail is 1 px; still "66". The master alone at 16 px closes the child's counter, so ship the small cut through an asset catalog if possible.</td></tr>
<tr><td>Misread</td><td>Pass with notes</td><td>Tadpoles, sperm and cherries are gone: short, thick, cut tails with a fillet, no curl. Remaining reads: a generic quote glyph (quote and reviews apps), "66" for a moment before the scale difference registers. No religious or political symbol found; no crescent. In RTL contexts it reads as a shape, not punctuation.</td></tr>
<tr><td>Elite</td><td>Pass</td><td>Typographic in origin, two shapes, one colour. Sits next to Aesop, Calm and Apple Books without looking like a stock glyph, because of the scaled pair.</td></tr>
<tr><td>Show a stranger</td><td>Honest description</td><td>"A brown square with two white quotation marks, a big one and a little one." That is the right sentence: it is about speech, and about a big and a little one.</td></tr>
<tr><td>Icon bench</td><td>Pass</td><td>Holds in all six appearances (pure silhouette); contrast against paper 4.95:1 at the top of the gradient, 6.56:1 at the bottom (5.50:1 on flat sepia); dark 7.79:1.</td></tr>
</table>

<h2>Weaknesses, said plainly</h2>
<ul>
<li>Near matches: two web searches today (quote-mark logos; memory-book app marks) surfaced generic quote icons and no big-and-small quote pair in the memory or journal category. That is a quick search, not a trademark clearance.</li>
<li>The quotation-mark concept is not ownable; only this drawing is. A single closing quote is used by the "Motivation" quotes app; many review and messaging brands use quote glyphs.</li>
<li>The icon alone does not say "baby" or "letters". That is a trade made on purpose: every letter-carrying version said "document" or "mail" louder than it said "letter".</li>
<li>The small cut only reaches a device through a legacy asset catalog; an Icon Composer file ships the master at all sizes.</li>
<li>Bench renders of Liquid Glass, tinted and clear are simulations; sign off in Icon Composer on a device.</li>
</ul>

<h2>Sketches</h2>
<p class="muted">Every round, in order. One line on each in <code>sketches/NOTES.txt</code>.</p>
<div class="grid2">
${sk('00-reference-literata.png', 'Reference: the opening quote in EB Garamond (failed to render from the variable font), Literata 500 and 700.')}
${sk('01-glyph-drop.png', 'Round 1: first drawing; the tail leaves the ball at the side, so the mark reads as a drop or flame, not a 6.')}
${sk('02-glyph-hook.png', 'Round 2: a real hook makes an unmistakable "66".')}
${sk('06-glyph-nodes-cusp.png', 'Round 6: nodes shown. The hook made a hairline cusp in the counter.')}
${sk('07-glyph-fillet-shallow.png', 'Round 7: a fillet node removed the cusp but made the counter shallow and the tail wobble.')}
${sk('08-glyph-constructed-short.png', 'Round 8: constructed tail (annulus tangent to the ball): clean, but too short and flat.')}
${sk('09-glyph-constructed.png', 'Round 9: steeper, longer annulus; f was chosen and thickened to 0.64.')}
${sk('10-pair-relationship.png', 'Round 10: ratio 0.5 to 0.7, gap, lean. Chosen: 0.62, gap 0.12, lean 8 degrees toward the parent.')}
${sk('12-small-cut.png', 'Round 12: small cut B chosen (tail 0.76, child 0.66, gap 0.22).')}
</div>
</main></body></html>`;
}
