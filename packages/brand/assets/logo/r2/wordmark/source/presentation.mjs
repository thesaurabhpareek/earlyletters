// presentation.html for the wordmark routes. UI text is live Mukta (the product's UI face);
// every wordmark on the page is one of the built SVG files, loaded with <img>.
import { C } from './lib.mjs';

const FONTS = '../../../../../../node_modules/@fontsource';

export function presentation({ ROUTES, metrics, extra = '' }) {
  const routes = Object.values(ROUTES);
  const img = (slug, file, h, alt = 'Early Letters') => {
    const a = metrics[slug + '/' + file.replace(/-(reversed|accent)$/, '')].aspect;
    return `<img src="${slug}/${file}.svg" width="${Math.round(h * a)}" height="${h}" style="max-width:100%;height:auto" alt="${alt}">`;
  };
  const sizeRow = (r, rev) => {
    const s = rev ? '-reversed' : '';
    return `
      <div class="sizes">
        <figure>${img(r.slug, 'wordmark' + s, 160)}<figcaption>160 px, master</figcaption></figure>
        <figure>${img(r.slug, 'wordmark' + s, 64)}<figcaption>64 px, master</figcaption></figure>
        <div class="pair">
          <figure>${img(r.slug, 'wordmark-small' + s, 28)}<figcaption>28 px, small cut</figcaption></figure>
          <figure>${img(r.slug, 'wordmark-small' + s, 14)}<figcaption>14 px, small cut</figcaption></figure>
        </div>
      </div>`;
  };
  const pix = (r) => `
    <div class="pix">
      ${['master', 'small'].map((c) => `
        <div><p class="k">${c === 'master' ? 'Master cut' : 'Small cut'}, real pixels at 28 and 14 px, shown 4x</p>
          <img class="px" src="png/${r.slug}-${c}-28-paper.png" style="height:${36 * 4}px">
          <img class="px" src="png/${r.slug}-${c}-14-paper.png" style="height:${22 * 4}px">
          <img class="px" src="png/${r.slug}-${c}-14-night.png" style="height:${22 * 4}px">
        </div>`).join('')}
    </div>`;
  const sections = routes.map((r) => `
  <section id="${r.slug}">
    <header><h2>${r.name}</h2><p>${r.line}</p><p class="k">${metrics[r.slug + '/wordmark'].nodes} nodes in the master, ${metrics[r.slug + '/wordmark-small'].nodes} in the small cut</p></header>
    <div class="ground paper">${sizeRow(r, false)}</div>
    <div class="ground night">${sizeRow(r, true)}</div>
    ${pix(r)}
  </section>`).join('');
  const email = routes.map((r) => `
    <div class="email"><div class="bar">${img(r.slug, 'wordmark-small', 28)}</div>
      <div class="body"><p class="eh">A letter is waiting for Asha</p><p>Nani recorded a letter for Asha this evening. It is kept exactly as she said it.</p></div>
      <p class="k">${r.name}</p></div>`).join('');
  const compare = routes.map((r) => `<div class="cmp"><span class="k">${r.name}</span>${img(r.slug, 'wordmark', 72)}</div>`).join('');
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Wordmark round 2</title>
<style>
@font-face{font-family:Mukta;font-weight:400;src:url(${FONTS}/mukta/files/mukta-latin-400-normal.woff2) format('woff2')}
@font-face{font-family:Mukta;font-weight:600;src:url(${FONTS}/mukta/files/mukta-latin-600-normal.woff2) format('woff2')}
:root{--ink:${C.ink};--muted:${C.inkMuted};--paper:${C.paper};--line:${C.line};--accent:${C.accent};--night:${C.paperDark};--inkd:${C.inkDark}}
*{box-sizing:border-box}
body{margin:0;background:var(--paper);color:var(--ink);font:16px/1.5 Mukta,system-ui,sans-serif}
main{max-width:1240px;margin:0 auto;padding:40px 24px 80px}
h1{font-size:28px;font-weight:600;margin:0 0 4px} h2{font-size:22px;font-weight:600;margin:0}
section{margin:56px 0;border-top:1px solid var(--line);padding-top:24px}
header p{margin:2px 0;color:var(--muted)} .k{font-size:13px;color:var(--muted);margin:4px 0}
.ground{border-radius:20px;padding:36px 40px;margin-top:16px;overflow:hidden}
.paper{background:#fff;border:1px solid var(--line)} .night{background:var(--night);color:var(--inkd)}
.night figcaption{color:${C.inkMutedDark}}
.sizes{display:flex;flex-direction:column;gap:22px}
.pair{display:flex;gap:56px;align-items:flex-end}
figure{margin:0} figure img{display:block} figcaption{font-size:12px;color:var(--muted);margin-top:6px}
.pix{display:grid;grid-template-columns:1fr 1fr;gap:24px;margin-top:16px}
.px{image-rendering:pixelated;display:block;margin:8px 0;max-width:100%;object-fit:contain;object-position:left}
.cmps{display:flex;flex-direction:column;gap:18px;background:#fff;border:1px solid var(--line);border-radius:20px;padding:32px 40px;margin-top:16px}
.cmp{display:flex;flex-direction:column;gap:6px}
.emails{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:16px;margin-top:16px}
.email{background:#fff;border:1px solid var(--line);border-radius:14px;overflow:hidden}
.email .bar{padding:20px 22px;border-bottom:1px solid var(--line)} .email .bar img{display:block}
.email .body{padding:16px 22px 4px;font-size:15px} .email .eh{font-weight:600;margin:0 0 6px} .email .k{padding:0 22px 14px}
.note{max-width:760px}
@media (max-width:700px){.pix{grid-template-columns:1fr}.ground{padding:24px 18px}.sizes img{max-width:100%;height:auto!important}}
</style></head>
<body><main>
<h1>Early Letters wordmark, round 2</h1>
<p class="k">Typographer T1 (wordmark). Four routes, each with a master cut (above 32 px) and a small cut (32 px and below). All shapes are outlined, hand-edited paths from OFL fonts. Sizes are the full height of the drawing, cap top to descender.</p>
${extra}
<section><h2>The four routes at one size</h2><div class="cmps">${compare}</div></section>
${sections}
<section><h2>Email header, 28 px tall</h2><p class="k">The small cut of each route, as it would sit at the top of a family email.</p><div class="emails">${email}</div></section>
</main></body></html>
`;
}
