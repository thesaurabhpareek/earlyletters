// Generates ../presentation.html (self-contained except PNGs in ../png and ../sketches).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { normalised, wordmark, MASTER, SMALL, C } from './build.mjs';
const OUT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const M = normalised(MASTER), S = normalised(SMALL), W = wordmark();
const mark = (fill, h, s = M, extra = '') => `<svg ${extra} height="${h}" viewBox="-10 -10 ${s.w + 20} ${s.h + 20}" style="display:block"><path fill="${fill}" d="${s.d}"/></svg>`;
const H = 820, GAP = 330;
const hl = normalised(MASTER, H);
const lockH = (fill, h) => `<svg height="${h}" viewBox="-20 ${-H - 20} ${hl.w + GAP + 6048 + 20} ${H + 300}" style="display:block"><path fill="${fill}" transform="translate(0 ${-H})" d="${hl.d}"/><path fill="${fill}" transform="translate(${hl.w + GAP - 58} 0)" d="${W.d}"/></svg>`;
const wordOnly = (fill, h) => `<svg height="${h}" viewBox="50 -774 6048 1012" style="display:block"><path fill="${fill}" d="${W.d}"/></svg>`;
const ico = (src, n, r = 0.225) => `<img src="${src}" width="${n}" height="${n}" style="border-radius:${n * r}px;display:block">`;
// Stand-in neighbour icons (generic, drawn in CSS, not real brand artwork).
const N = {
  Calendar: `background:#fff;color:#e33;font:600 11px system-ui;display:grid;place-items:center`,
  Photos: `background:conic-gradient(#f5b400,#f06a2a,#e63a7a,#8a4fd8,#2f8cf0,#2ec27e,#f5b400)`,
  Messages: `background:linear-gradient(#5ff777,#1fc73f)`,
  Mail: `background:linear-gradient(#1f9bff,#0a6cf0)`,
  Clock: `background:#111;box-shadow:inset 0 0 0 6px #111,inset 0 0 0 30px #fff`,
  Notes: `background:linear-gradient(#ffd84d 26%,#fff 26%)`,
  Maps: `background:linear-gradient(135deg,#bfe8a9 40%,#f4f0e6 40% 55%,#9fd3f7 55%)`,
  Weather: `background:linear-gradient(#3a8ff0,#7fc1ff)`,
  Camera: `background:linear-gradient(#ddd,#999)`,
  Books: `background:linear-gradient(#ff9f2e,#ff7b00)`,
  Settings: `background:linear-gradient(#aaa,#777)`,
  Health: `background:#fff`,
  Podcasts: `background:linear-gradient(#c56cf0,#8a2be2)`,
  Music: `background:linear-gradient(#ff5f6d,#fa233b)`,
  Files: `background:linear-gradient(#fff,#e9eef5)`,
};
const glyph = { Mail: `<svg viewBox="0 0 60 60"><rect x="12" y="18" width="36" height="24" rx="4" fill="#fff"/><path d="M13 20l17 13 17-13" stroke="#1f7ef5" stroke-width="2.5" fill="none"/></svg>`, Calendar: '<div style="text-align:center;line-height:1.05">SAT<br><b style="color:#111;font-size:24px">3</b></div>', Messages: `<svg viewBox="0 0 60 60"><ellipse cx="30" cy="29" rx="18" ry="14" fill="#fff"/></svg>` };
function home(dark) {
  const names = ['Calendar', 'Photos', 'Mail', 'Clock', 'Notes', 'Maps', 'Weather', 'Camera', 'Books', 'EARLY', 'Messages', 'Podcasts', 'Settings', 'Health', 'Music', 'Files'];
  const wall = dark ? 'linear-gradient(160deg,#1b2233,#0b0d12 60%,#1a1410)' : 'linear-gradient(160deg,#cfd9e6,#e9dfd2 55%,#d7c3ad)';
  const lab = dark ? '#eee' : '#222';
  const cells = names.map((n) => {
    const tile = n === 'EARLY' ? ico(dark ? 'png/app-icon-dark-1024.png' : 'png/icon-180.png', 60) : `<div style="width:60px;height:60px;border-radius:13.5px;overflow:hidden;${N[n]}${dark ? ';filter:brightness(.82)' : ''}">${glyph[n] || ''}</div>`;
    return `<div style="display:flex;flex-direction:column;align-items:center;gap:5px;width:74px">${tile}<span style="font:11px system-ui;color:${lab}">${n === 'EARLY' ? 'Early Letters' : n}</span></div>`;
  }).join('');
  return `<div style="width:340px;height:520px;border-radius:44px;padding:64px 12px 0;box-sizing:border-box;background:${wall};box-shadow:0 0 0 10px #111,0 20px 40px rgba(0,0,0,.25)"><div style="display:grid;grid-template-columns:repeat(4,74px);gap:18px 6px;justify-content:center">${cells}</div></div>`;
}
const px = (src, n, z) => `<figure><img src="${src}" style="width:${n * z}px;height:${n * z}px;image-rendering:pixelated;display:block;border:1px solid var(--line)"><figcaption>${n}px at ${z}x</figcaption></figure>`;
const tests = [
  ['2am test', 'Pass', 'A soft paper moon settling into an open letter on warm brown. The one-second feeling is "quiet, for the night, for someone". It does not shout and has no alarm colour. Risk: the moon alone could pull it toward the sleep-app shelf.'],
  ['Caption test', 'Partial', 'Letters (envelope) and bedtime (moon) read without words; "a letter at bedtime" is what most people say. Voice does not read at all, and "child" only arrives through bedtime. Keeping reads weakly: an envelope is something you keep, but it also says "send".'],
  ['Recall test', 'Pass', '"A crescent moon resting in an open envelope." Seven words. Drawable in five seconds: a rectangle with a V cut, a crescent sitting in the V.'],
  ['Scale test', 'Pass', 'The optical cut (wider gap, fuller moon, rounder corners) keeps the moon separate from the envelope at 16 and 29px; see the magnified rasters. At 16px the horns become single pixels but the silhouette (V plus round) still holds.'],
  ['Misread test', 'Notes', 'Generic "mail" or "inbox" icon (closest risk; it sits two cells from a Mail-style icon in the mock and is distinguishable, but the category is crowded). iOS Focus / Do Not Disturb moon. Sleep apps. A ball in a cup or a scoop in a cone at a glance. A moon "setting" into a valley could suggest an ending; the moon is drawn waxing (the evening moon that grows), but few people will know that. Crescent without a star is low risk for religious or political readings; tilted and with no star it avoids flag configurations. No body-part readings found.'],
  ['Elite test', 'Partial', 'Calm, warm and well drawn, at home next to Apple Books. It is still a combination of two familiar pictograms, so it is closer to a very good icon than to an Aesop-level abstraction or a Bélo you could own outright.'],
];
const sketches = [
  ['flap-crescent', 'Closed envelope whose flap line curves into a crescent. Rejected: it reads as a smile, and as an Amazon-style swoosh.'],
  ['cradle', 'A crescent, horns up, cradling a small letter. Rejected: reads as a boat; the letter vanishes below 40px.'],
  ['tuck-in', 'A small letter tucked into the hollow of a crescent. Rejected: the object-in-crescent configuration echoes crescent-and-star flags, and the letter disappears at 16px.'],
  ['sealed-moon', 'A closed envelope with a tiny moon at the flap tip. Rejected: reads as a wax seal (banned) and a generic mail icon.'],
  ['flap-arch', 'Open flap drawn as an arch above the envelope. Rejected: reads as a handbag or basket.'],
  ['page-fold', 'A page whose folded corner is a crescent. Rejected: reads as a generic file icon; the moon is invisible at small sizes.'],
  ['moon-letter-fused', 'A big moon behind a small envelope. Rejected: two objects side by side, a "night mode mail" icon.'],
  ['waning-moon', 'First version with a waning moon (lit on the left, the usual "night mode" moon). Rejected: identical in stance to the iOS Focus moon, and the waning moon is the one you see before dawn, not at bedtime.'],
  ['sliced-moon', 'Moon sunk into the V and clipped by the envelope edge. Rejected: at 1024 the moon looks sliced, and a cut-away form contradicts "nothing removed".'],
  ['arc-mouth', 'Envelope mouth cut as a curve that cradles the moon. Rejected: reads as a bowl or a sunset; the envelope disappears.'],
  ['fused-silhouette', 'Moon and envelope merged into one silhouette, no gap. Rejected: lumpy, reads as a bat wing or a broken shape, and loses both objects at 16px.'],
  ['open-moon', 'Moon inside an envelope with the flap up. Rejected: too many parts; the flap and moon tangle at 29px.'],
];
const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Moon Letter</title>
<style>
:root{--ink:${C.ink};--paper:${C.paper};--muted:#6B645B;--line:#E6DED3;--acc:${C.accent};--soft:${C.accentSoft}}
*{box-sizing:border-box}body{margin:0;background:var(--paper);color:var(--ink);font:15px/1.55 Georgia,serif}
section{padding:56px 6vw;border-top:1px solid var(--line)}h1,h2{font-weight:500;margin:0 0 18px}h2{font-size:22px}
.k{font:600 11px/1 system-ui;letter-spacing:.12em;text-transform:uppercase;color:var(--muted);margin-bottom:10px}
.row{display:flex;flex-wrap:wrap;gap:28px;align-items:flex-end}figure{margin:0}figcaption{font:12px system-ui;color:var(--muted);margin-top:8px}
.hero{display:grid;grid-template-columns:1fr 1fr;min-height:520px}.hero>div{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:48px;padding:40px}
table{border-collapse:collapse;width:100%;max-width:1000px}td{border-top:1px solid var(--line);padding:12px 10px;vertical-align:top}td:first-child{white-space:nowrap;font-weight:600}
.pass{font:600 12px system-ui;color:#2f6b3a}.partial,.notes{font:600 12px system-ui;color:#8A5A3B}
.cloth{background:repeating-linear-gradient(0deg,rgba(255,255,255,.04) 0 1px,transparent 1px 3px),repeating-linear-gradient(90deg,rgba(0,0,0,.05) 0 1px,transparent 1px 3px),#7c5136}
.emb path{fill:#7c5136}.emb{filter:drop-shadow(-1.5px -1.5px 0 rgba(0,0,0,.35)) drop-shadow(1.5px 1.5px 0 rgba(255,235,210,.28))}
.sk{display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:22px}.sk img{width:100%;border:1px solid var(--line)}
@media (max-width:720px){.hero{grid-template-columns:1fr}}
</style></head><body>
<div class="hero"><div>${mark(C.ink, 300)}${lockH(C.ink, 54)}</div><div style="background:${C.paperDark}">${mark(C.inkDark, 300)}${lockH(C.inkDark, 54)}</div></div>
<section><div class="k">Direction D1, moon-letter</div><h1>A moon resting in an open letter</h1>
<p style="max-width:680px;font-size:18px">When the day goes quiet, you open a letter to your child and say what today was like. The moon in this envelope is the evening moon, the one that grows a little every night, just like the person you are writing to. Nothing in it is cut away or changed, the way your words are kept exactly as you said them.</p></section>
<section><div class="k">Sizes</div><h2>16, 29, 60, 180</h2><div class="row">
<figure><img src="png/favicon-16.png" width="16"><figcaption>16 favicon</figcaption></figure>
<figure>${ico('png/icon-29.png', 29)}<figcaption>29 Settings</figcaption></figure>
<figure>${ico('png/icon-40.png', 40)}<figcaption>40 Spotlight</figcaption></figure>
<figure>${ico('png/icon-60.png', 60)}<figcaption>60 Home</figcaption></figure>
<figure>${ico('png/icon-180.png', 180)}<figcaption>180</figcaption></figure>
${px('png/favicon-16.png', 16, 8)}${px('png/icon-29.png', 29, 8)}</div>
<p style="font:13px system-ui;color:var(--muted)">29 and 40 use symbol-small (wider gap, fuller moon, rounder corners). 60 and up use the master.</p>
<div class="row" style="margin-top:24px"><figure>${ico('app-icon-1024.png', 220)}<figcaption>App Store 1024, primary</figcaption></figure><figure>${ico('png/app-icon-dark-1024.png', 220)}<figcaption>iOS dark appearance</figcaption></figure>
<figure><div style="width:220px;height:220px;border-radius:50px;background:#1c1c1e;display:grid;place-items:center">${mark('#9a9a9e', 120)}</div><figcaption>iOS tinted (grey mask)</figcaption></figure></div></section>
<section><div class="k">Home screen</div><h2>Among the neighbours, light and dark</h2><div class="row" style="gap:48px">${home(false)}${home(true)}</div>
<p style="font:13px system-ui;color:var(--muted)">Neighbour icons are generic CSS stand-ins, not real artwork. A Mail-style envelope is placed in the grid on purpose to test confusion.</p></section>
<section><div class="k">Email</div><h2>Header at 28px</h2><div class="row">
<div style="width:520px;background:#fff;border:1px solid var(--line);border-radius:10px;padding:22px 26px">${lockH(C.ink, 28)}<p style="font:15px system-ui;margin:22px 0 0">Here is your sign-in link.</p></div>
<div style="width:520px;background:${C.paperRaisedDark || '#201D1A'};border-radius:10px;padding:22px 26px">${lockH(C.inkDark, 28)}<p style="font:15px system-ui;margin:22px 0 0;color:#F2ECE4">Here is your sign-in link.</p></div></div></section>
<section><div class="k">Print</div><h2>Spine and cloth cover, single-colour emboss</h2><div class="row" style="align-items:stretch">
<div class="cloth" style="width:46px;height:420px;border-radius:3px;display:flex;flex-direction:column;align-items:center;justify-content:space-between;padding:22px 0">
<div style="transform:rotate(90deg);transform-origin:center;width:22px;height:200px;display:grid;place-items:center"><div style="transform:translateX(0)">${wordOnly('#e9d9c6', 16)}</div></div>${mark('#e9d9c6', 22)}</div>
<div class="cloth" style="width:320px;height:420px;border-radius:3px 8px 8px 3px;display:grid;place-items:center;box-shadow:inset 6px 0 10px rgba(0,0,0,.25)"><div class="emb">${mark('#7c5136', 120)}</div></div>
<div style="width:320px;height:420px;background:var(--soft);border-radius:3px 8px 8px 3px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:26px">${mark(C.accent, 90)}${wordOnly(C.accent, 30)}<span style="font:11px system-ui;letter-spacing:.2em;color:var(--acc)">YEAR ONE</span></div></div></section>
<section><div class="k">Lockups</div><div class="row" style="gap:40px"><img src="lockup-horizontal.svg" height="70"><img src="lockup-stacked.svg" height="220"><img src="symbol-accent.svg" height="120"><div style="background:${C.paperDark};padding:16px"><img src="symbol-reversed.svg" height="120"></div><img src="favicon.svg" height="48"></div></section>
<section><div class="k">Tests</div><h2>The six tests, honestly</h2><table>${tests.map(([a, b, c]) => `<tr><td>${a}</td><td class="${b.toLowerCase()}">${b}</td><td>${c}</td></tr>`).join('')}</table>
<p style="max-width:900px;font:14px system-ui;color:var(--muted);margin-top:18px">Near matches found: stock icon packs pair envelopes and moons for "good night" messages (Icons8, Flaticon); a DesignCrowd brief for "CartaLuna" greeting cards asked for a crescent with an envelope; "Magic Moon Mail" is an astrology mail club. None verified as a registered mark of this exact shape; a professional clearance search is still needed. The pairing itself is not ownable; only this drawing is.</p></section>
<section><div class="k">Sketches</div><h2>What was tried and why it was left behind</h2><div class="sk">${sketches.map(([f, t]) => `<figure><img src="sketches/${f}.png"><figcaption>${t}</figcaption></figure>`).join('')}</div></section>
<section style="font:12px system-ui;color:var(--muted)">Built from source/build.mjs (geometry in source/mark.mjs, exact arc booleans in source/bool.mjs). Filled paths only. Wordmark reused from logo/a.</section>
</body></html>`;
fs.writeFileSync(path.join(OUT, 'presentation.html'), html);
console.log('presentation written');
