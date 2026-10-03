// presentation.html for the "two voices" mark. Every word here is straight-quoted, no dashes.
export const SKETCHES = [
  ['01-bend', 'Two separate leaning marks: just a quote glyph, no relationship between them.'],
  ['02-shelter-hairline', 'Hairline tail: an even thin line that vanishes at 29px and reads as a whip.'],
  ['03-meet', 'Small tail hooks upward like a sprout: reads as "6b" or a music note.'],
  ['04-cradle-cross', 'Tail crosses the small mark: the overlap looks like one tadpole swallowing another.'],
  ['05-mirror-heart', 'Closing marks mirrored for a heart: reads as "db" and as two water drops, heart never appears.'],
  ['06-stack', 'Parallel tails: the testimonial-widget icon every website already has.'],
  ['07-pair-lean', 'Leaning toward each other only by rotation: too subtle, still a quote icon.'],
  ['08-nestle', 'Heavy and close: a blot at 16px, and the pair reads as "66".'],
  ['09-first-canopy', 'First canopy: right idea, tail too thin and the small mark floats away from it.'],
  ['10-lean-in-sprout', 'Upright small mark with a sprout tail: reads as a garlic bulb.'],
  ['11-literata-glyph', 'Faithful Literata glyph: nothing ownable, a font character.'],
  ['12-held-pressed', 'Small mark pressed into the big one: fish or tadpole pair, the banned reading.'],
  ['13-plain-66-control', 'Control: two equal marks. Every blog and review site.'],
  ['14-big-small-upright', 'Size difference alone: looks like a typo, not a relationship.'],
  ['15-tuck', 'Small mark too small with a long tail: sperm-like, rejected on sight.'],
  ['16-round-cap-hook', 'Round cap on the arch: reads as a walking cane or a hand puppet.'],
  ['17-flat-arch', 'Flat arch: headphone band.'],
  ['18-tapered-terminals', 'Sharp tapered tips: elegant large, gone below 60px.'],
  ['19-heavy-arch', 'Heavy arch: the parent swallows the child, no air under the arm.'],
  ['20-gaze-beak', 'Arch tip turned down to meet the small tip: a swan with a cygnet, the quote reading is lost.'],
  ['21-tilted-parent', 'Whole mark tilted: the big mark looks like it is falling over.'],
  ['22-final-candidate-a', 'Near-final: arch tip a touch too fine at 29px; the small mark a touch too small to hold its own.'],
  ['23-tighter-arch', 'Tighter arch: the small mark loses its shelter.'],
];

export function presentation({ C, dMain, dSmall, bM, bS, files, extra, icon, iconSmall, nodes, rel }) {
  const f = (w, s = 'normal') => `${rel}/node_modules/@fontsource/literata/files/literata-latin-${w}-${s}.woff2`;
  const m = (w) => `${rel}/node_modules/@fontsource/mukta/files/mukta-latin-${w}-normal.woff2`;
  const vb = (b, p = 0.04) => { const k = Math.max(b.w, b.h) * p; return `${-k} ${-k} ${b.w + 2 * k} ${b.h + 2 * k}`; };
  const sym = (fill, h, d = dMain, b = bM, extraStyle = '') => `<svg viewBox="${vb(b)}" style="height:${h}px;width:auto;display:block;${extraStyle}" aria-hidden="true"><path fill="${fill}" d="${d}"/></svg>`;
  const inline = (s, style) => s.replace('<svg ', `<svg style="${style}" `).replace(/<title>.*?<\/title>/, '');
  const iconCss = (px, src, rad = 0.2237) => `<img src="${src}" width="${px}" height="${px}" style="border-radius:${px * rad}px;display:block">`;

  // generic neighbour icons for the home screen mock (no real brands drawn)
  const nb = [
    ['Calendar', '#FFFFFF', '<div style="font:600 9px/1 system-ui;color:#E5483B;margin-top:7px">FRI</div><div style="font:300 26px/1 system-ui;color:#111">3</div>'],
    ['Photos', '#FFFFFF', '<div style="width:34px;height:34px;margin:12px auto;border-radius:50%;background:conic-gradient(#F5B731,#EE6A2E,#D6336C,#8E44AD,#3478F6,#34C759,#F5B731);mask:radial-gradient(circle,transparent 5px,#000 6px)"></div>'],
    ['Camera', 'linear-gradient(#D9D9DE,#A9A9B0)', '<div style="width:30px;height:22px;margin:18px auto;border-radius:6px;background:#2C2C2E;position:relative"><div style="position:absolute;left:9px;top:5px;width:12px;height:12px;border-radius:50%;background:#7A7A80"></div></div>'],
    ['Weather', 'linear-gradient(#4A90E2,#7DB9F0)', '<div style="width:22px;height:22px;margin:14px auto 0;border-radius:50%;background:#FFD54A"></div>'],
    ['Notes', 'linear-gradient(#FFFFFF 0 30%,#FFF8DC 30%)', '<div style="height:6px;background:#F7C948;margin-top:14px"></div>'],
    ['Clock', '#111111', '<div style="width:44px;height:44px;margin:8px auto;border-radius:50%;background:#FFF;position:relative"><div style="position:absolute;left:21px;top:8px;width:2px;height:15px;background:#111"></div><div style="position:absolute;left:22px;top:21px;width:12px;height:2px;background:#E5483B"></div></div>'],
    ['Podcasts', 'linear-gradient(#B05DE8,#7B2CBF)', '<div style="width:16px;height:16px;margin:20px auto;border-radius:50%;border:4px solid #fff"></div>'],
    ['Books', 'linear-gradient(#FF9F2E,#F56C16)', '<div style="width:30px;height:24px;margin:18px auto;border-bottom:3px solid #fff;border-radius:2px;background:linear-gradient(90deg,#fff 0 46%,transparent 46% 54%,#fff 54%)"></div>'],
    ['Maps', 'linear-gradient(135deg,#D5ECC2,#F3F0E6 50%,#BFDDF6)', '<div style="width:6px;height:60px;margin:0 auto;background:#F5C342;transform:rotate(30deg)"></div>'],
    ['Health', '#FFFFFF', '<div style="width:24px;height:22px;margin:17px auto;background:#FF2D55;border-radius:50% 50% 40% 40%"></div>'],
    ['Messages', 'linear-gradient(#5BE07A,#2FBE4F)', '<div style="width:32px;height:24px;margin:16px auto;border-radius:50%;background:#fff"></div>'],
  ];
  const home = (dark) => {
    const cells = [];
    const our = dark ? 'png/app-icon-dark-1024.png' : 'app-icon-1024.png';
    const order = [0, 1, 2, 3, 4, 5, 'us', 6, 7, 8, 9, 10];
    for (const o of order) {
      if (o === 'us') cells.push(`<div class="app"><img src="${our}" class="ic" alt=""><span>Early Lett...</span></div>`);
      else { const [n, bg, inner] = nb[o]; cells.push(`<div class="app"><div class="ic" style="background:${dark && bg === '#FFFFFF' ? '#1C1C1E' : bg};overflow:hidden;text-align:center;${dark ? 'filter:brightness(.82)' : ''}">${inner}</div><span>${n}</span></div>`); }
    }
    return `<div class="phone ${dark ? 'dark' : ''}"><div class="status">9:41</div><div class="grid">${cells.join('')}</div><div class="dock">${[10, 1, 7, 4].map((i) => `<div class="ic" style="background:${nb[i][1]};overflow:hidden;text-align:center">${nb[i][2]}</div>`).join('')}</div></div>`;
  };

  const tests = [
    ['2am test', 'Pass', 'A large soft shape bending over a small one. In one second most people feel closeness: something big looking after something little. It is warm brown and paper, nothing clinical. Some tired parents will only see "quotation marks", which is still the right neighbourhood (words, someone speaking).'],
    ['Caption test', 'Partial', 'Read cold: "words someone said" is clear to almost everyone, and "a grown-up and a little one" to many but not all. "Letters" and "kept for years" are not in the mark; the name carries those. Honest score: two of four ideas (voice and child), the child one not universal.'],
    ['Recall test', 'Pass', '"A big quote mark sheltering a small one." Seven words. Drawable in two strokes: a fat comma with a long arm over a little comma.'],
    ['Scale test', 'Pass with a cut', `29px holds: the arch and the gap under it survive. At 16px the silhouette holds (a big drop, a small drop, a hook) and the small optical cut keeps a visible gap under the arch, but the "bending" detail is gone. Nodes: ${nodes.main} curves in the master, ${nodes.small} in the small cut.`],
    ['Misread test', 'Watch', 'Generic quote and testimonial icons (the biggest risk, reduced by the size difference and the arch). "66", "Ga" or "6b" if read as letters. Tadpoles or sperm: low with these thick tails, but two tailed drops cannot fully escape it; checked at every size. A swan with a cygnet when the arch tip turns down (avoided, see sketch 20). A cupped hand. Quote marks differ by language: German opens with a low mark and French uses angle quotes, so outside English and Hindi the shape reads as "speech" more than "opening quote". No religious, political or death readings found; the culture critic should check Devanagari glyph lookalikes (the curl is near the digit six).'],
    ['Elite test', 'Partial', 'Drawn like a high-contrast book face, not a UI icon: heavy ink in the bowl, a fine lifting arm. It sits well beside Literata and on cloth. Beside Aesop and Apple Books it holds, but quotation marks are common punctuation, so it earns its place only through the drawing and the relationship, never through the idea alone.'],
  ];

  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Two voices</title>
<style>
@font-face{font-family:Literata;src:url(${f(400)});font-weight:400}
@font-face{font-family:Literata;src:url(${f(500)});font-weight:500}
@font-face{font-family:Literata;src:url(${f(400, 'italic')});font-style:italic}
@font-face{font-family:Mukta;src:url(${m(400)});font-weight:400}
@font-face{font-family:Mukta;src:url(${m(500)});font-weight:500}
:root{--ink:${C.ink};--muted:${C.inkMuted};--paper:${C.paper};--accent:${C.accent};--soft:${C.accentSoft};--line:${C.line};--night:${C.paperDark}}
*{box-sizing:border-box}body{margin:0;overflow-x:hidden;background:var(--paper);color:var(--ink);font:16px/1.55 Mukta,system-ui,sans-serif}
section{padding:72px 64px;border-top:1px solid var(--line)}h2{font:500 30px/1.2 Literata,serif;margin:0 0 8px}
.eyebrow{font:500 12px/1 Mukta;letter-spacing:.12em;text-transform:uppercase;color:var(--muted);margin-bottom:14px}
p{max-width:680px;color:#4a443d}.row{display:flex;gap:28px;flex-wrap:wrap;align-items:flex-end}
.hero{display:grid;grid-template-columns:1fr 1fr;min-height:620px;padding:0;border:0}.hero>div{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:56px}
.hero .night{background:var(--night)}.cap{font:12px Mukta;color:var(--muted);margin-top:8px;text-align:center}
.px{image-rendering:pixelated;display:block}section svg{max-width:100%}.row>div{max-width:100%}
.phone{width:330px;height:560px;border-radius:46px;padding:56px 22px 22px;background:linear-gradient(160deg,#E9DCCB,#C9B49B 60%,#A88E73);position:relative;box-shadow:0 0 0 10px #1b1b1b,0 20px 40px rgba(0,0,0,.25)}
.phone.dark{background:linear-gradient(160deg,#2a2622,#141210 70%)}.status{position:absolute;top:18px;left:38px;font:600 14px system-ui;color:#111}.dark .status{color:#fff}
.grid{display:grid;grid-template-columns:repeat(4,60px);gap:22px 14px;justify-content:center}.app{display:flex;flex-direction:column;align-items:center;gap:5px}
.app span{font:500 11px system-ui;color:#111;white-space:nowrap}.dark .app span{color:#eee}.ic{width:60px;height:60px;border-radius:13.4px;display:block}
.dock{position:absolute;left:16px;right:16px;bottom:16px;height:84px;border-radius:30px;background:rgba(255,255,255,.35);display:flex;justify-content:space-around;align-items:center;backdrop-filter:blur(8px)}.dark .dock{background:rgba(255,255,255,.12)}
.mail{width:560px;border:1px solid var(--line);border-radius:12px;overflow:hidden;background:#fff}.mail.dark{background:#201D1A;border-color:#33302C;color:#F2ECE4}
.mail .hd{height:72px;display:flex;align-items:center;padding:0 32px;border-bottom:1px solid var(--line)}.mail.dark .hd{border-color:#33302C}
.mail .bd{padding:28px 32px 34px;font:16px/1.5 Mukta}.mail h3{font:500 22px Literata,serif;margin:0 0 8px}
.btn{display:inline-block;background:var(--accent);color:#fff;border-radius:10px;padding:10px 18px;font:500 15px Mukta;margin-top:10px}.mail.dark .btn{background:#D9A47E;color:#161412}
.cloth{background-color:#7B5034;background-image:repeating-linear-gradient(0deg,rgba(255,255,255,.035) 0 1px,transparent 1px 3px),repeating-linear-gradient(90deg,rgba(0,0,0,.06) 0 1px,transparent 1px 3px)}
.cover{width:380px;height:500px;border-radius:4px 10px 10px 4px;display:flex;flex-direction:column;align-items:center;justify-content:center;box-shadow:inset 10px 0 18px rgba(0,0,0,.25),0 18px 40px rgba(0,0,0,.25)}
.spine{width:64px;height:500px;border-radius:4px;display:flex;flex-direction:column;align-items:center;padding:28px 0;gap:26px;box-shadow:inset -6px 0 12px rgba(0,0,0,.25),0 18px 40px rgba(0,0,0,.25)}
.deboss path{fill:#6A442C}.deboss{filter:drop-shadow(0 1.2px 0 rgba(255,255,255,.22)) drop-shadow(0 -1px 0 rgba(0,0,0,.45))}
.tests{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:20px;max-width:1100px}.test{border:1px solid var(--line);border-radius:12px;padding:20px 22px;background:#fff}
.test b{font:500 18px Literata,serif}.tag{float:right;font:500 12px Mukta;padding:2px 10px;border-radius:99px;background:var(--soft);color:var(--accent)}
.sk{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:18px}.sk figure{margin:0;border:1px solid var(--line);border-radius:10px;overflow:hidden;background:#fff}.sk img{width:100%;display:block}.sk figcaption{padding:10px 14px;font:14px/1.4 Mukta;color:#4a443d}
.rationale{font:400 24px/1.5 Literata,serif;max-width:820px;color:var(--ink)}
@media (max-width:800px){section{padding:48px 16px}.hero>div{padding:48px 16px}.hero svg{max-width:100%;height:auto!important}.mail{width:100%}.cover{width:min(380px,calc(100vw - 120px));height:440px}.phone{transform:scale(.9);transform-origin:left top}.hero{grid-template-columns:1fr}.tests{grid-template-columns:1fr}}
</style></head><body>

<section class="hero"><div>${sym(C.ink, 300)}${inline(files['lockup-horizontal.svg'], 'height:56px;width:auto')}</div>
<div class="night">${sym(C.inkDark, 300)}${inline(extra.lockupHRev, 'height:56px;width:auto')}</div></section>

<section><div class="eyebrow">Two voices, for a parent</div>
<p class="rationale">A big quotation mark bends over a small one, the way you lean down to talk to your child. Quotation marks mean "these are someone's exact words", and that is what Early Letters keeps: what you said, exactly as you said it. One day the small one will be big enough to read them.</p></section>

<section><div class="eyebrow">Sizes</div><h2>From browser tab to App Store</h2>
<p>True pixels, then 16 and 29 magnified 8 times. 40px and under use the small cut: a thicker arm, a shorter reach and a wider gap under the arch.</p>
<div class="row">${[16, 29, 60, 180].map((p) => `<div><img class="px" src="png/icon-${p}.png" width="${p}" height="${p}"><div class="cap">${p}</div></div>`).join('')}
<div><img class="px" src="png/icon-16.png" width="128" height="128"><div class="cap">16 at 8x</div></div>
<div><img class="px" src="png/icon-29.png" width="232" height="232"><div class="cap">29 at 8x</div></div></div>
<div class="row" style="margin-top:36px">
<div><img class="px" src="png/favicon-16-light.png" width="16"><div class="cap">favicon light</div></div>
<div style="background:#202124;padding:6px"><img class="px" src="png/favicon-16-dark.png" width="16"></div>
<div><img class="px" src="png/favicon-16-light.png" width="128"><div class="cap">favicon 16 at 8x</div></div>
<div><img class="px" src="png/favicon-29-dark.png" width="232"><div class="cap">29 on dark at 8x</div></div>
<div>${iconCss(180, 'png/app-icon-paper-1024.png')}<div class="cap">paper variant</div></div>
<div>${iconCss(180, 'png/app-icon-dark-1024.png')}<div class="cap">iOS dark</div></div>
<div>${iconCss(180, 'png/app-icon-tinted-1024.png')}<div class="cap">iOS tinted source</div></div></div></section>

<section><div class="eyebrow">Home screen</div><h2>Among the neighbours</h2>
<p>Mock, not iOS. Neighbour icons are generic stand-ins drawn in CSS.</p><div class="row" style="gap:60px">${home(false)}${home(true)}</div></section>

<section><div class="eyebrow">Email</div><h2>Header at 28px tall</h2><div class="row">
<div class="mail"><div class="hd">${inline(files['lockup-horizontal.svg'], 'height:28px;width:auto')}</div><div class="bd"><h3>A new letter for Asha</h3>Nani added a letter this evening. It is waiting for you to read and approve.<br><span class="btn">Read it</span></div></div>
<div class="mail dark"><div class="hd">${inline(extra.lockupHRev, 'height:28px;width:auto')}</div><div class="bd"><h3>A new letter for Asha</h3>Nani added a letter this evening. It is waiting for you to read and approve.<br><span class="btn">Read it</span></div></div></div></section>

<section><div class="eyebrow">Print</div><h2>Cloth cover and spine, blind deboss</h2>
<div class="row" style="gap:40px;align-items:center">
<div class="cover cloth"><svg class="deboss" viewBox="${vb(bM)}" style="height:120px"><path d="${dMain}"/></svg><div style="font:500 13px Mukta;letter-spacing:.2em;color:#C9A68A;margin-top:150px;text-shadow:0 -1px 0 rgba(0,0,0,.4)">YEAR ONE</div></div>
<div class="spine cloth"><svg class="deboss" viewBox="${vb(bS)}" style="width:34px"><path d="${dSmall}"/></svg>
<div style="writing-mode:vertical-rl;font:500 20px Literata,serif;color:#D8B79C;letter-spacing:.02em">Early Letters</div><div style="flex:1"></div><div style="writing-mode:vertical-rl;font:500 11px Mukta;letter-spacing:.2em;color:#C9A68A">YEAR ONE</div></div>
<div>${inline(files['lockup-stacked.svg'], 'height:220px;width:auto')}<div class="cap">stacked lockup</div></div></div>
<p>On the spine the wordmark is set as live type for the mock only; production uses the outlined wordmark.</p></section>

<section><div class="eyebrow">The six tests</div><h2>Honest results</h2><div class="tests">
${tests.map(([t, v, n]) => `<div class="test"><span class="tag">${v}</span><b>${t}</b><p style="margin:8px 0 0">${n}</p></div>`).join('')}</div>
<p style="margin-top:28px"><b>Near matches.</b> Quotation-mark logos are common: stock "quote" icons, testimonial widgets, quote apps and some publishing and podcast brands. I found no mark with a large quote arching over a small one, but my image search returned titles, not pictures I could compare, so this is not clearance. A professional search in classes 9, 16 and 42 is still needed.</p></section>

<section><div class="eyebrow">Sketches</div><h2>What did not make it, and why</h2><div class="sk">
${SKETCHES.map(([n, t]) => `<figure><img src="sketches/${n}.png" alt=""><figcaption>${t}</figcaption></figure>`).join('')}</div></section>

<section><div class="eyebrow">Files</div><p style="font:13px/1.8 ui-monospace,monospace">symbol.svg, symbol-reversed.svg, symbol-accent.svg, symbol-small.svg, favicon.svg, lockup-horizontal.svg, lockup-stacked.svg, app-icon-1024.png, png/, sketches/, source/build.mjs</p>
<p>Built from two quotation marks drawn as cubic curves (source/geom.mjs, source/mark.mjs). Wordmark reused from round 1 A (outlined Literata 500, joined tt).</p></section>
</body></html>
`;
}
