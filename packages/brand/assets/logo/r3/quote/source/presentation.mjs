// presentation.html for the round 3 quotation mark. Straight quotes only, no dashes, no emoji.
export const SKETCHES = [
  ['glyph-00-reference-study', 'Study, not a candidate: the opening double quote of EB Garamond, Literata, Newsreader, Source Serif and Baskerville. Garamond 800 sets the proportions (ball about 0.6 of the height, tail curling right).'],
  ['glyph-01-first-pass-vs-garamond', 'First pass over the Garamond outline (blue dashes): a font glyph with a pinched terminal. Too close to the font, and the curvature combs show a spike at the tip.'],
  ['glyph-02-kidney-shoulder', 'Kidney: the ball has a knee where it meets the crook, so the mark reads as a bean with a hook.'],
  ['glyph-03-sack-ball', 'At 2000 px the ball sags like a sack: a long straight left side and a flat bottom. Led to the true circle.'],
  ['glyph-04-flat-shoulder', 'One outer curve, round ball, but a long flat diagonal from the crook down to the ball.'],
  ['glyph-05-solver-beak', 'The circle carried up to the crook, but the curvature solver traded the terminal for a beak. Fixed by a crook node and a relative G2 cost.'],
  ['glyph-06-small-cut-light', 'Small cut with only the gap widened: at 16 px the child tail is under one pixel. The shipped small cut is fuller.'],
  ['rel-a-shared-baseline', 'Shared baseline, upright, far apart: the clearest "66", but it reads as a typed quote with a typo, not a relationship.'],
  ['rel-b-nestled', 'Nestled upright: one unit, but stiff. Kept the distance, added the lean.'],
  ['rel-c-leaning-in', 'Leaning in 12 degrees: tender, but the child tips over and the tail starts to point at the parent like a beak.'],
  ['rel-d-tucked-under-arch', 'Tucked under the terminal at 0.45: a footnote, not a child. A short blunt tail has no arch to shelter under.'],
  ['rel-e-raised-centre', 'Child on the parent optical centre: floats, no ground, reads as an exponent.'],
  ['rel-f-stepped-down', 'Child below the baseline: unstable, the pair falls to the right.'],
  ['rel-g-held-in-crook', 'Child held in the crook: fuses into one strange glyph; at 29 px a blob with a dot.'],
  ['rel-h-overlap-knockout', 'Overlapping with a paper gap: a cut-out sticker; the gap is a hairline at 29 px and gone at 16 px.'],
  ['rel-i-lean-6', 'Nestled, leaning in 6 degrees: the chosen relationship (shipped at ratio 0.618).'],
  ['tail-1-calm-drop', 'Calm teardrop terminal: chosen. No corners to sparkle at small sizes, safe on cloth, and the same family as the Garamond wordmark.'],
  ['tail-2-flat-cut', 'Flat cut square to the tail: crisp and modern, but two corners and a colder, sign-like voice.'],
  ['tail-3-oblique-pen', 'Oblique pen cut (Literata): bookish, but the upper corner points like a beak.'],
  ['tail-4-taper', 'Tapered point: the round 2 tail that read as a tadpole. Shown so the difference is visible.'],
  ['tail-5-stubby', 'Very short tail: blunt, but it stops being a quotation mark and becomes a bean or a seed.'],
  ['ratio-0.50', 'Ratio 0.5: the child is a footnote.'],
  ['ratio-0.58', 'Ratio 0.58: close, the pair starts to read as two equal voices.'],
  ['ratio-0.618', 'Ratio 0.618 (golden section): clearly smaller, still a voice of its own. Chosen.'],
  ['ratio-0.667', 'Ratio 0.667: siblings, not parent and child.'],
  ['ratio-0.618-gap60', 'Gap 60: the pair drifts apart.'],
  ['ratio-0.618-lean9', 'Lean 9 degrees: starts to fall. 6 reads as leaning in.'],
  ['wm-01-word-space', 'W4 word space at x1, x1.15 (the brief), x1.5 (shipped) and x1.8, plus W1. x1.15 is invisible at every size.'],
  ['wm-02-lockup-layouts', 'Lockup layouts: centred, baseline (shipped), hanging at cap height (too small), floating.'],
];

export function presentation({ C, TILE, dMain, dSmall, bM, bS, files, extra, facts, constructionSvg, rel }) {
  const f = (w, s = 'normal') => `${rel}/node_modules/@fontsource/literata/files/literata-latin-${w}-${s}.woff2`;
  const m = (w) => `${rel}/node_modules/@fontsource/mukta/files/mukta-latin-${w}-normal.woff2`;
  const vb = (b, p = 0.04) => { const k = Math.max(b.w, b.h) * p; return `${b.x0 - k} ${b.y0 - k} ${b.w + 2 * k} ${b.h + 2 * k}`; };
  const sym = (fill, h, d = dMain, b = bM) => `<svg viewBox="${vb(b)}" style="height:${h}px;width:auto;max-width:100%;display:block" aria-hidden="true"><path fill="${fill}" d="${d}"/></svg>`;
  const inline = (s, style) => s.replace('<svg ', `<svg style="${style}" `).replace(/<title>.*?<\/title>/, '');
  const img = (src, w, extraCss = '') => `<img src="${src}" width="${w}" style="display:block;max-width:100%;height:auto;${extraCss}" alt="">`;
  const tile = (src, px, label) => `<div><img src="${src}" width="${px}" height="${px}" style="border-radius:${px * 0.2237}px;display:block;box-shadow:0 0 0 1px ${C.line}"><div class="cap">${label}</div></div>`;

  const tests = [
    ['2am test', 'Pass', 'Warm sepia, a big rounded shape and a small one beside it, leaning in. In one second it says "someone is talking" and "a big one and a little one". Nothing sharp, nothing clinical. In dark mode (light sepia on warm black) it is the calmest icon on the screen.'],
    ['Caption test', 'Partial', 'Cold, people will say "quotation marks", so "words, exactly as said" lands. "A grown-up and a child" lands for many through the size and the lean, not for all. "Letters" and "kept for years" are not in the mark; the name and the tagline carry them. Two of four ideas, honestly.'],
    ['Recall test', 'Pass', '"A big quote mark and a little one." Eight words. Anyone who can write a "6" can draw it.'],
    ['Scale test', 'Pass', `29 px: two clean "6" shapes with both crooks open (bench sizes.png). 16 px: still two quote marks with a visible gap; the child crook is about one pixel, so at 16 px it is "a big blob and a small blob with notches". The small cut (fuller terminal, gap ${facts.gapSmall} instead of ${facts.gap}) helps 16 and 29. Thinnest essential part on the 1024 master: the parent terminal is about 100 px thick, the child terminal about 65 px, both above the bench's 56 px rule.`],
    ['Misread test', 'Watch', 'Wanted: an opening quotation mark, "66". Unwanted and checked: tadpoles or sperm (heads with thin whipping tails): the tails are now as thick as a third of the ball and end blunt, and I no longer see it at any size, but a stranger test is still needed. Cherries: gone, there is no stem. A "6" or a "9": the pair reads "66", never "69", because both share one orientation. Commas: a closing quote or comma points down; these curl up. Generic quote and testimonial icons: the biggest risk, reduced by the scale pair and the drawing. Paper tile: brown blobs on cream can read as beans or worse; sepia tile chosen. Quote marks are Latin-script: in Arabic or Chinese contexts it reads as "speech", not as an opening quote.'],
    ['Elite test', 'Pass with a caveat', 'A true circle, one sweep, a teardrop terminal, eight nodes per mark, every join curvature-continuous: it sits next to Aesop and Apple Books without looking like an icon-font glyph. The caveat is ownership: quotation marks are common punctuation, so the drawing and the parent and child relationship are what make it ours.'],
    ['Show a stranger', 'Self-test', 'Describing it as if new: "two quotation marks, a big one and a small one, both fat and round, the small one a little tilted toward the big one." I did not say tadpole, cherry or bean. This is my own eye, not a stranger; a 5-second test with real parents is still owed.'],
  ];

  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Quote mark, round 3</title>
<style>
@font-face{font-family:Literata;src:url(${f(400)});font-weight:400}
@font-face{font-family:Literata;src:url(${f(500)});font-weight:500}
@font-face{font-family:Mukta;src:url(${m(400)});font-weight:400}
@font-face{font-family:Mukta;src:url(${m(500)});font-weight:500}
:root{--ink:${C.ink};--muted:${C.inkMuted};--paper:${C.paper};--accent:${C.accent};--soft:${C.accentSoft};--line:${C.line};--night:${C.paperDark}}
*{box-sizing:border-box}body{margin:0;overflow-x:hidden;background:var(--paper);color:var(--ink);font:16px/1.55 Mukta,system-ui,sans-serif}
section{padding:72px 64px;border-top:1px solid var(--line)}h2{font:500 30px/1.2 Literata,serif;margin:0 0 8px}
.eyebrow{font:500 12px/1 Mukta;letter-spacing:.12em;text-transform:uppercase;color:var(--muted);margin-bottom:14px}
p{max-width:720px;color:#4a443d}.row{display:flex;gap:28px;flex-wrap:wrap;align-items:flex-end}.row>div{max-width:100%}
.hero{display:grid;grid-template-columns:1fr 1fr;min-height:640px;padding:0;border:0}.hero>div{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:64px;padding:48px}
.hero .night{background:var(--night)}.cap{font:12px Mukta;color:var(--muted);margin-top:8px;text-align:center}
.px{image-rendering:pixelated;display:block}
.facts{display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:14px;max-width:1000px}.fact{border:1px solid var(--line);border-radius:10px;padding:14px 16px;background:#fff}.fact b{display:block;font:500 22px Literata,serif}
.mail{width:560px;max-width:100%;border:1px solid var(--line);border-radius:12px;overflow:hidden;background:#fff}.mail.dark{background:#201D1A;border-color:#33302C;color:#F2ECE4}
.mail .hd{height:72px;display:flex;align-items:center;padding:0 32px;border-bottom:1px solid var(--line)}.mail.dark .hd{border-color:#33302C}
.mail .bd{padding:28px 32px 34px}.mail h3{font:500 22px Literata,serif;margin:0 0 8px}
.btn{display:inline-block;background:var(--accent);color:#fff;border-radius:10px;padding:10px 18px;font:500 15px Mukta;margin-top:10px}.mail.dark .btn{background:#D9A47E;color:#161412}
.cloth{background-color:#7B5034;background-image:repeating-linear-gradient(0deg,rgba(255,255,255,.035) 0 1px,transparent 1px 3px),repeating-linear-gradient(90deg,rgba(0,0,0,.06) 0 1px,transparent 1px 3px)}
.cover{width:380px;max-width:100%;height:500px;border-radius:4px 10px 10px 4px;display:flex;flex-direction:column;align-items:center;justify-content:center;box-shadow:inset 10px 0 18px rgba(0,0,0,.25),0 18px 40px rgba(0,0,0,.25)}
.spine{width:64px;height:500px;border-radius:4px;display:flex;flex-direction:column;align-items:center;padding:28px 0;gap:26px;box-shadow:inset -6px 0 12px rgba(0,0,0,.25),0 18px 40px rgba(0,0,0,.25)}
.deboss path{fill:#6A442C}.deboss{filter:drop-shadow(0 1.2px 0 rgba(255,255,255,.22)) drop-shadow(0 -1px 0 rgba(0,0,0,.45))}
.tests{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:20px;max-width:1100px}.test{border:1px solid var(--line);border-radius:12px;padding:20px 22px;background:#fff}
.test b{font:500 18px Literata,serif}.tag{float:right;font:500 12px Mukta;padding:2px 10px;border-radius:99px;background:var(--soft);color:var(--accent)}
.sk{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:18px}.sk figure{margin:0;border:1px solid var(--line);border-radius:10px;overflow:hidden;background:#fff}.sk img{width:100%;display:block}.sk figcaption{padding:10px 14px;font:14px/1.4 Mukta;color:#4a443d}
.rationale{font:400 24px/1.5 Literata,serif;max-width:820px;color:var(--ink)}
.wide img{width:100%;height:auto;display:block;border-radius:10px}
@media (max-width:800px){section{padding:48px 16px}.hero{grid-template-columns:1fr}.hero>div{padding:48px 16px}.tests{grid-template-columns:1fr}.spine{height:440px}.cover{height:440px}}
</style></head><body>

<section class="hero"><div>${sym(C.ink, 300)}${inline(files['lockup-horizontal.svg'], 'height:60px;width:auto;max-width:100%')}</div>
<div class="night">${sym(C.inkDark, 300)}${inline(files['lockup-horizontal-reversed.svg'], 'height:60px;width:auto;max-width:100%')}</div></section>

<section><div class="eyebrow">For a parent</div>
<p class="rationale">Quotation marks mean "these are someone's exact words", and Early Letters keeps your words exactly as you said them. Here a big quotation mark and a small one stand on the same line, the small one leaning in, the way a child leans against you while you talk. One day the small one will be old enough to read what the big one said.</p></section>

<section><div class="eyebrow">Construction</div><h2>One drawing, twice</h2>
<p>The child is the parent drawing scaled by ${facts.ratio} (the golden section), leaned in ${Math.abs(facts.lean)} degrees, standing on the same baseline, ${facts.gap} units apart at the closest point (the parent is 1000 units tall). The ball is a true circle (dashed) from its left side, under the bottom and up the right to the crook. ${facts.nodesPerGlyph} nodes per mark, all at extrema or inflections. Handle lengths are solved so curvature is continuous at every node (G2): the largest curvature jump in the master and the small cut is ${(facts.g2 * 100).toFixed(2)} percent.</p>
<div class="row" style="align-items:center;gap:48px">${constructionSvg}
<div class="facts">
<div class="fact"><b>${facts.ratio}</b>child to parent, by height</div>
<div class="fact"><b>${Math.abs(facts.lean)} deg</b>child leans toward the parent</div>
<div class="fact"><b>${facts.gap} / ${facts.gapSmall}</b>gap, master / small cut (per 1000)</div>
<div class="fact"><b>${facts.nodes.main}</b>nodes in the whole mark</div>
<div class="fact"><b>${facts.bbox.w} x ${facts.bbox.h}</b>drawn box of the pair</div>
<div class="fact"><b>${(facts.space - 1) * 100} percent</b>wider W4 word space</div>
</div></div>
<div class="wide" style="margin-top:36px">${img('png/mark-2000-paper.png', 2000)}<div class="cap">The master at 2000 px wide. Look at the joins: the crook flows into the circle, the tail lands in a round terminal.</div></div></section>

<section><div class="eyebrow">Why this relationship, this tail</div><h2>Choices, with reasons</h2>
<p><b>Relationship: nestled, leaning in, shared baseline.</b> Of nine relationships (sketches below) this is the only one that still reads as punctuation first ("66") and as a relationship second. Sharing the baseline says "same sentence, same line". The 6 degree lean is the whole emotion: at 12 the child falls, at 0 they are two strangers in a queue. Tucking, holding and overlapping all fused the two marks into one odd glyph at 29 px.</p>
<p><b>Tail: short, thick, calm teardrop.</b> The tail is about a third of the ball wide where it leaves it and ends in a round terminal about 0.18 of the height thick. No point, no hairline, no corner: nothing for a 29 px render to lose, nothing for a cloth deboss to fill, and no swimming whip. The flat cut was the runner up; it is crisper but colder and its corners sparkle at small sizes.</p>
<p><b>Ratio 0.618.</b> At 0.5 the child is a footnote, at 0.667 a sibling. 0.618 is clearly smaller and still a voice.</p></section>

<section><div class="eyebrow">Sizes</div><h2>From browser tab to App Store</h2>
<p>True pixels, then 16 and 29 magnified 8 times. 40 px and under use the small cut: same drawing for both marks, a fuller terminal and a gap of ${facts.gapSmall} instead of ${facts.gap}.</p>
<div class="row">${[16, 29, 40, 60, 180].map((p) => `<div><img class="px" src="png/icon-${p}.png" width="${p}" height="${p}"><div class="cap">${p}</div></div>`).join('')}
<div><img class="px" src="png/icon-16.png" width="128" height="128"><div class="cap">16 small cut, 8x</div></div>
<div><img class="px" src="png/icon-16-master.png" width="128" height="128"><div class="cap">16 master, 8x</div></div>
<div><img class="px" src="png/icon-29.png" width="232" height="232"><div class="cap">29 small cut, 8x</div></div>
<div><img class="px" src="png/icon-29-master.png" width="232" height="232"><div class="cap">29 master, 8x</div></div></div>
<div class="row" style="margin-top:36px">
<div><img class="px" src="png/favicon-16-light.png" width="16"><div class="cap">favicon</div></div>
<div style="background:#202124;padding:6px"><img class="px" src="png/favicon-16-dark.png" width="16"></div>
<div><img class="px" src="png/favicon-16-light.png" width="128"><div class="cap">favicon 16, 8x</div></div>
<div><img class="px" src="png/favicon-29-dark.png" width="232"><div class="cap">favicon 29 on dark, 8x</div></div></div>
<div class="wide" style="margin-top:36px">${img('bench/sizes.png', 1400)}<div class="cap">Icon bench, sizes.png: 29, 40, 60 pt at 1x to 3x, light and dark, then 8x pixels from the master and from the small cut.</div></div></section>

<section><div class="eyebrow">Tile</div><h2>Which ground</h2>
<p>Tested as the critics asked. <b>Chosen: the subtle vertical gradient ${TILE.gradTop} to ${TILE.gradBottom}</b>; it lifts the flat sepia without leaving the family, and the paper mark stays at 5.5:1 on it. The deeper flat ${TILE.deep} turns orange-brown and muddier. The paper tile is beautiful in print, but on a phone a brown pair of round blobs on cream risks a bean reading, so it stays a print and web variant, not the app icon. Dark: light sepia on warm near-black, the best state, as in round 2.</p>
<div class="row">${tile('app-icon-1024.png', 180, 'gradient (shipped)')}${tile('png/app-icon-flat-1024.png', 180, 'flat ' + TILE.flat)}${tile('png/app-icon-deep-1024.png', 180, 'deep ' + TILE.deep)}${tile('png/app-icon-paper-1024.png', 180, 'paper tile')}${tile('png/app-icon-dark-1024.png', 180, 'dark')}${tile('png/app-icon-tinted-1024.png', 180, 'tinted source')}</div></section>

<section><div class="eyebrow">Home screen (icon bench)</div><h2>Among the neighbours</h2>
<p>From the shared icon bench at true device scale: light, dark, tinted and clear. Simulated Liquid Glass; sign off in Icon Composer. It sits two rows from the speech-bubble apps (Messages, Chat), which is the right neighbourhood for "someone talking", and it is the only warm brown on the screen.</p>
<div class="wide">${img('bench/sheet-home.png', 1660)}</div>
<div class="wide" style="margin-top:24px">${img('bench/appearances.png', 1320)}</div>
<div class="row" style="margin-top:24px"><div style="width:390px">${img('bench/home-light-crop.png', 390)}<div class="cap">light, native 3x pixels</div></div><div style="width:390px">${img('bench-paper/home-light-crop.png', 390)}<div class="cap">paper tile, rejected for the app icon</div></div></div></section>

<section><div class="eyebrow">Wordmark</div><h2>W4 with air, and W1</h2>
<p>W4 is the EB Garamond route from round 2, outlines untouched, with the word space opened. The brief said about 15 percent; 15 percent of its 120-unit space is 18 units and changes nothing you can see at any size, so I opened it by 50 percent (to 180 units) and ship the literal x1.15 file beside it (wordmark/wordmark-space115.svg). Under 20 px use the W4 small cut. W1 (Literata) stays the fallback for UI and poor renderers. The mark stands on the baseline like the opening quotation mark of the name, 1.25 times the cap height.</p>
<div class="row" style="flex-direction:column;align-items:flex-start;gap:30px">
<div>${inline(files['lockup-horizontal.svg'], 'height:72px;width:auto;max-width:100%')}<div class="cap" style="text-align:left">W4, word space x1.5 (shipped)</div></div>
<div>${inline(files['lockup-horizontal-w1.svg'], 'height:72px;width:auto;max-width:100%')}<div class="cap" style="text-align:left">W1, Literata (fallback)</div></div>
<div class="row" style="align-items:center">${inline(files['lockup-horizontal-small.svg'], 'height:20px;width:auto')}${inline(extra.lockupHW1Small, 'height:20px;width:auto')}<span class="cap">small cuts at 20 px, W4 and W1</span></div>
<div class="row" style="align-items:flex-end;gap:60px">${inline(files['lockup-stacked.svg'], 'height:220px;width:auto;max-width:100%')}${inline(files['lockup-stacked-w1.svg'], 'height:220px;width:auto;max-width:100%')}</div></div></section>

<section><div class="eyebrow">Email</div><h2>Header at 28 px tall</h2><div class="row">
<div class="mail"><div class="hd">${inline(files['lockup-horizontal-small.svg'], 'height:28px;width:auto')}</div><div class="bd"><h3>A new letter for Asha</h3>Nani added a letter this evening. It is waiting for you to read.<br><span class="btn">Read it</span></div></div>
<div class="mail dark"><div class="hd">${inline(extra.lockupHSmallRev, 'height:28px;width:auto')}</div><div class="bd"><h3>A new letter for Asha</h3>Nani added a letter this evening. It is waiting for you to read.<br><span class="btn">Read it</span></div></div></div></section>

<section><div class="eyebrow">Print</div><h2>Cloth cover and spine, blind deboss</h2>
<div class="row" style="gap:40px;align-items:center">
<div class="cover cloth"><svg class="deboss" viewBox="${vb(bM)}" style="height:120px"><path d="${dMain}"/></svg><div style="font:500 13px Mukta;letter-spacing:.2em;color:#C9A68A;margin-top:150px;text-shadow:0 -1px 0 rgba(0,0,0,.4)">YEAR ONE</div></div>
<div class="spine cloth"><svg class="deboss" viewBox="${vb(bS)}" style="width:36px"><path d="${dSmall}"/></svg>
<div style="writing-mode:vertical-rl;font:500 20px Literata,serif;color:#D8B79C">Early Letters</div><div style="flex:1"></div><div style="writing-mode:vertical-rl;font:500 11px Mukta;letter-spacing:.2em;color:#C9A68A">YEAR ONE</div></div></div>
<p>No hairlines anywhere: the thinnest part (the child terminal) is about 11 percent of the mark height, so a 30 mm deboss keeps it at about 3 mm. On the spine the name is live type for the mock only.</p></section>

<section><div class="eyebrow">Tests</div><h2>Honest results</h2><div class="tests">
${tests.map(([t, v, n]) => `<div class="test"><span class="tag">${v}</span><b>${t}</b><p style="margin:8px 0 0">${n}</p></div>`).join('')}</div>
<p style="margin-top:28px"><b>Near matches.</b> Quotation-mark icons are everywhere (testimonial widgets, quote apps, Medium and Quora-style glyphs, a "Motivation" app with a closing quote). I know of no mark built from a large and a small opening quote leaning together, but I did not run an image search this round, so this is not clearance. A professional search is still needed.</p></section>

<section><div class="eyebrow">Sketches</div><h2>What did not make it, and why</h2><div class="sk">
${SKETCHES.map(([n, t]) => `<figure><img src="sketches/${n}.png" alt="" loading="lazy"><figcaption><b>${n}</b>. ${t}</figcaption></figure>`).join('')}</div></section>

<section><div class="eyebrow">Files</div><p style="font:13px/1.8 ui-monospace,monospace">symbol.svg, symbol-reversed.svg, symbol-accent.svg, symbol-small.svg, favicon.svg, lockup-horizontal(-reversed, -small, -w1).svg, lockup-stacked(-reversed, -w1).svg, wordmark/, app-icon-1024.png, png/, bench/, bench-paper/, sketches/, source/</p>
<p>Rebuild: node packages/brand/assets/logo/r3/quote/source/build.mjs. The drawing lives in source/glyph.mjs (nodes and tangents), source/geom.mjs (G2 solver, curvature combs), source/mark.mjs (ratio, lean, gap). The gradient background for Icon Composer is source/icon-background-gradient.svg.</p></section>
</body></html>
`;
}
