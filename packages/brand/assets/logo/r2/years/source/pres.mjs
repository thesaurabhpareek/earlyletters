// Writes ../presentation.html from the built files, then screenshots it for review.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { shoot, done } from './render.mjs';
const HERE = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.resolve(HERE, '..');
const rd = (f) => fs.readFileSync(path.join(OUT, f), 'utf8');
const sym = rd('symbol.svg').match(/ d="([^"]+)"/)[1];
const symS = rd('symbol-small.svg').match(/ d="([^"]+)"/)[1];
const VB = '9 8 82 82';
const S = (fill, w, d = sym, extra = '') => `<svg viewBox="${VB}" width="${w}" height="${w}" ${extra}><path fill="${fill}" d="${d}"/></svg>`;
const inline = (f, h, fill) => rd(f).replace(/<title>.*?<\/title>/, '').replace('<svg ', `<svg style="height:${h}px;width:auto;display:block" `).replace(/fill="#[0-9A-F]+"/gi, `fill="${fill}"`);
const V = JSON.parse(fs.readFileSync(path.join(HERE, 'version.json'), 'utf8'));
const notes = fs.readFileSync(path.join(OUT, 'sketches/notes.txt'), 'utf8').split('\n').filter((l) => /^\d\d/.test(l)).map((l) => { const m = l.match(/^(\S+)\s+(.*)$/); return { f: m[1], t: m[2] }; });

// generic neighbour icons (stand-ins, not real app artwork)
const nb = {
  Calendar: `<rect width="60" height="60" fill="#fff"/><text x="30" y="17" font-size="9" text-anchor="middle" fill="#E5483B" font-family="-apple-system,Helvetica" font-weight="600">FRI</text><text x="30" y="45" font-size="28" text-anchor="middle" fill="#222" font-family="-apple-system,Helvetica" font-weight="300">3</text>`,
  Photos: `<rect width="60" height="60" fill="#fff"/>${['#F6B02C', '#F07E2D', '#E5483B', '#C64E9E', '#7C5BC9', '#3D8BEB', '#5BC2C0', '#7CCB4F'].map((c, i) => `<ellipse cx="30" cy="18" rx="6" ry="11" fill="${c}" opacity=".85" transform="rotate(${i * 45} 30 30)"/>`).join('')}`,
  Weather: `<defs><linearGradient id="wg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3C8CE7"/><stop offset="1" stop-color="#5FB4F2"/></linearGradient></defs><rect width="60" height="60" fill="url(#wg)"/><circle cx="24" cy="24" r="9" fill="#FFD43B"/><ellipse cx="34" cy="38" rx="14" ry="8" fill="#fff"/>`,
  Messages: `<rect width="60" height="60" fill="#3DC75A"/><ellipse cx="30" cy="29" rx="18" ry="14" fill="#fff"/><path d="M17 40l-3 7 9-4z" fill="#fff"/>`,
  Notes: `<rect width="60" height="60" fill="#fff"/><rect width="60" height="14" fill="#F8CD44"/>${[24, 32, 40, 48].map((y) => `<rect x="9" y="${y}" width="42" height="1.4" fill="#ddd"/>`).join('')}`,
  Camera: `<rect width="60" height="60" fill="#D7D7DB"/><rect x="10" y="20" width="40" height="26" rx="5" fill="#3A3A3C"/><circle cx="30" cy="33" r="8" fill="#9A9AA0"/><circle cx="30" cy="33" r="5" fill="#3A3A3C"/>`,
  Clock: `<rect width="60" height="60" fill="#111"/><circle cx="30" cy="30" r="22" fill="#fff"/><path d="M30 30V15M30 30l9 6" stroke="#111" stroke-width="2.4" stroke-linecap="round"/>`,
  Music: `<defs><linearGradient id="mg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FB5C74"/><stop offset="1" stop-color="#FA233B"/></linearGradient></defs><rect width="60" height="60" fill="url(#mg)"/><path d="M25 18l16-4v24" stroke="#fff" stroke-width="3" fill="none"/><circle cx="21" cy="40" r="5" fill="#fff"/><circle cx="37" cy="37" r="5" fill="#fff"/><path d="M25 18v22" stroke="#fff" stroke-width="3"/>`,
  Books: `<rect width="60" height="60" fill="#F7962E"/><path d="M14 18c6-2 11-1 16 3c5-4 10-5 16-3v24c-6-2-11-1-16 3c-5-4-10-5-16-3z" fill="#fff"/>`,
  Mail: `<defs><linearGradient id="ag" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2E9BFA"/><stop offset="1" stop-color="#1A6FEA"/></linearGradient></defs><rect width="60" height="60" fill="url(#ag)"/><rect x="12" y="19" width="36" height="24" rx="3" fill="#fff"/><path d="M12 21l18 13 18-13" stroke="#1A6FEA" stroke-width="2" fill="none"/>`,
  Settings: `<rect width="60" height="60" fill="#8E8E93"/><circle cx="30" cy="30" r="15" fill="none" stroke="#d1d1d6" stroke-width="7" stroke-dasharray="4 3"/><circle cx="30" cy="30" r="9" fill="#d1d1d6"/><circle cx="30" cy="30" r="4" fill="#8E8E93"/>`,
  Maps: `<rect width="60" height="60" fill="#E9F1E3"/><path d="M0 40L60 22" stroke="#F5C342" stroke-width="7"/><path d="M22 0v60" stroke="#fff" stroke-width="5"/><circle cx="38" cy="26" r="6" fill="#E5483B"/>`,
  Health: `<rect width="60" height="60" fill="#fff"/><path d="M30 46C10 33 14 17 24 17c3 0 5 2 6 4c1-2 3-4 6-4c10 0 14 16-6 29z" fill="#FA3A55"/>`,
  Files: `<rect width="60" height="60" fill="#fff"/><path d="M10 20h16l4 4h20v20H10z" fill="#2C8DF5"/>`,
  Podcasts: `<rect width="60" height="60" fill="#9B5CE3"/><circle cx="30" cy="27" r="6" fill="#fff"/><rect x="27" y="35" width="6" height="14" rx="3" fill="#fff"/>`,
};
const icon = (name, dark) => {
  if (name === 'EL') return `<div class=app><div class=ico style="background:${dark ? '#161412' : '#8A5A3B'};display:flex;align-items:center;justify-content:center">${S(dark ? '#D9A47E' : '#FBF8F3', 34)}</div><span>Early Letters</span></div>`;
  return `<div class=app><svg class=ico viewBox="0 0 60 60" style="${dark ? 'filter:brightness(.82) saturate(.9)' : ''}">${nb[name]}</svg><span>${name}</span></div>`;
};
const grid = ['Calendar', 'Photos', 'Weather', 'Clock', 'Messages', 'Notes', 'EL', 'Camera', 'Books', 'Maps', 'Health', 'Music', 'Files', 'Podcasts', 'Mail', 'Settings'];
const phone = (dark) => `<div class="phone ${dark ? 'dark' : ''}"><div class=status><b>9:41</b><span>&#9679;&#9679;&#9679;</span></div><div class=grid>${grid.map((g) => icon(g, dark)).join('')}</div>
  <div class=dock>${['Messages', 'Mail', 'Music', 'Photos'].map((g) => `<svg class=ico viewBox="0 0 60 60">${nb[g]}</svg>`).join('')}</div></div>`;

const tests = [
  ['2am test', 'Partial pass', 'In one second: warm, round, quiet; something small resting inside something bigger. It feels safe more than it feels like a letter. Nothing sharp, nothing loud, no alarm.'],
  ['Caption test', 'Fail, honestly', 'With no words, people say rings, a seed, ripples, growing. "A child held inside the years" lands for some; "letters" and "voice" do not appear at all. The product needs the name next to it.'],
  ['Recall test', 'Pass', '"A dot in two rings, sitting at the bottom." (8 words) Drawable in 5 seconds: three circles, each inside the last, touching at the floor.'],
  ['Scale test', 'Pass at 29, marginal at 16', 'At 29px and up the two rings and the seed are clear. At 16px the optical cut keeps two rings and the seed, but the hairlines blur into one soft base; it reads as a ringed dot, which is still the same idea.'],
  ['Misread test', 'Real risks', 'Eye or eyeball looking down (the biggest risk). Target bullseye (offset rings and the counter-turned weights reduce it). Water ripple or drop. The circled-dot sun symbol and the Hindu and Buddhist bindu (respectful, not offensive, but a reading). Onion or shell. Opera browser\'s "O" in silhouette. A nipple at a glance (low, but a bodily reading a culture reviewer should judge). No death, loss, political or flag readings found.'],
  ['Elite test', 'Pass, with a doubt', 'Next to Aesop, Calm and Apple Books it holds: one colour, true circles, no gimmick. The doubt: wellness and finance brands use nested circles a lot, so it is calm but not yet unmistakably ours.'],
];
const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Years: logo direction</title>
<style>
@font-face{font-family:Literata;src:url(../../../../../../node_modules/@fontsource/literata/files/literata-latin-500-normal.woff) format('woff');font-weight:500}
@font-face{font-family:Mukta;src:url(../../../../../../node_modules/@fontsource/mukta/files/mukta-latin-400-normal.woff) format('woff');font-weight:400}
@font-face{font-family:Mukta;src:url(../../../../../../node_modules/@fontsource/mukta/files/mukta-latin-600-normal.woff) format('woff');font-weight:600}
:root{--ink:#2B2722;--muted:#6B645B;--paper:#FBF8F3;--accent:#8A5A3B;--soft:#F1E6DC;--line:#E6DED3;--night:#161412;--night2:#201D1A;--inkD:#F2ECE4;--accD:#D9A47E}
*{box-sizing:border-box}body{margin:0;background:var(--paper);color:var(--ink);font:16px/1.55 Mukta,system-ui,sans-serif}
h1,h2,h3{font-family:Literata,Georgia,serif;font-weight:500;margin:0 0 12px}h2{font-size:28px}.kick{font-size:12px;letter-spacing:.12em;text-transform:uppercase;color:var(--muted);margin-bottom:8px}
section{padding:56px 6vw;border-top:1px solid var(--line)}.wrap{max-width:1180px;margin:0 auto}
.hero{display:grid;grid-template-columns:1fr 1fr;padding:0;border:0}.hero>div{min-height:520px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:40px}
.hero .night{background:var(--night)}.cap{font-size:12px;letter-spacing:.1em;text-transform:uppercase;color:var(--muted)}.night .cap{color:#B3AA9E}
.rat{display:grid;grid-template-columns:260px 1fr;gap:40px;align-items:center}.rat p{font-family:Literata,Georgia,serif;font-size:21px;line-height:1.5;margin:0 0 14px;max-width:640px}
.sizes{display:flex;gap:28px;align-items:flex-end;flex-wrap:wrap}.sizes figure{margin:0;text-align:center;font-size:12px;color:var(--muted)}.sizes img{display:block;margin:0 auto 8px;border-radius:22%}
.px{image-rendering:pixelated;border-radius:0!important;outline:1px solid var(--line)}
.phones{display:flex;gap:32px;flex-wrap:wrap;justify-content:center}
.phone{width:330px;height:640px;border-radius:48px;padding:56px 22px 22px;position:relative;background:linear-gradient(160deg,#E9DCCB,#C9B49A 60%,#A88C70);box-shadow:0 0 0 10px #1c1c1e,0 20px 40px rgba(0,0,0,.2)}
.phone.dark{background:linear-gradient(160deg,#2a2622,#151311)}
.status{position:absolute;top:18px;left:34px;right:34px;display:flex;justify-content:space-between;font:600 14px -apple-system,Helvetica,sans-serif;color:#111}.dark .status{color:#fff}
.grid{display:grid;grid-template-columns:repeat(4,1fr);gap:22px 12px}.app{display:flex;flex-direction:column;align-items:center;gap:5px}
.ico{width:60px;height:60px;border-radius:14px;overflow:hidden;display:block}.app span{font:11px -apple-system,Helvetica,sans-serif;color:#111;white-space:nowrap;max-width:70px;overflow:hidden;text-overflow:ellipsis}.dark .app span{color:#fff}
.dock{position:absolute;left:14px;right:14px;bottom:14px;height:86px;border-radius:30px;background:rgba(255,255,255,.35);display:flex;justify-content:space-around;align-items:center}.dark .dock{background:rgba(255,255,255,.12)}
.mails{display:grid;grid-template-columns:1fr 1fr;gap:24px}.mail{border:1px solid var(--line);border-radius:12px;overflow:hidden;background:#fff}.mail.dark{background:var(--night2);border-color:#33302C;color:var(--inkD)}
.mail .hd{height:64px;display:flex;align-items:center;padding:0 28px;border-bottom:1px solid var(--line)}.mail.dark .hd{border-color:#33302C}.mail .bd{padding:24px 28px;font-size:15px}.mail .bd h3{font-size:20px}
.btn{display:inline-block;background:var(--accent);color:#fff;border-radius:999px;padding:8px 18px;font-weight:600;font-size:14px}.mail.dark .btn{background:var(--accD);color:#161412}
.shelf{display:flex;gap:48px;align-items:flex-end;justify-content:center;flex-wrap:wrap;padding:30px;background:linear-gradient(#f6f1ea,#ece4d9)}
.spine{width:64px;height:420px;border-radius:3px;display:flex;flex-direction:column;align-items:center;padding:22px 0;gap:22px;box-shadow:inset -6px 0 10px rgba(0,0,0,.18),inset 4px 0 6px rgba(255,255,255,.08),4px 6px 14px rgba(0,0,0,.15)}
.cloth{background-color:#7d5236;background-image:repeating-linear-gradient(0deg,rgba(255,255,255,.035) 0 1px,transparent 1px 3px),repeating-linear-gradient(90deg,rgba(0,0,0,.05) 0 1px,transparent 1px 3px)}
.cloth.green{background-color:#3f4a3c}.spine .t{writing-mode:vertical-rl;font-family:Literata,serif;font-size:13px;letter-spacing:.06em;color:#E8D9C6;opacity:.9}
.cover{width:300px;height:420px;border-radius:3px 6px 6px 3px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:26px;box-shadow:inset 10px 0 12px rgba(0,0,0,.18),6px 8px 18px rgba(0,0,0,.18)}
.cover .yr{font-family:Literata,serif;font-size:15px;letter-spacing:.14em;text-transform:uppercase;color:#5f3c27;text-shadow:0 1px 0 rgba(255,255,255,.18),0 -1px 0 rgba(0,0,0,.25)}
.emb{position:relative;width:120px;height:120px}.emb svg{position:absolute;inset:0}
.tests{display:grid;grid-template-columns:repeat(3,1fr);gap:18px}.test{background:#fff;border:1px solid var(--line);border-radius:12px;padding:18px}.test b{font-family:Literata,serif;font-weight:500;font-size:18px}.test .v{font-size:13px;font-weight:600;color:var(--accent);margin:2px 0 8px}
.sk{display:grid;grid-template-columns:repeat(auto-fill,minmax(170px,1fr));gap:16px}.sk figure{margin:0;font-size:13px;color:var(--muted)}.sk img{width:100%;background:#fff;border:1px solid var(--line);border-radius:8px}
.cons{display:grid;grid-template-columns:360px 1fr;gap:40px;align-items:center}
.hero svg{max-width:80vw;height:auto}@media (max-width:820px){.phone{zoom:.88}.hero,.rat,.mails,.cons{grid-template-columns:1fr}.tests{grid-template-columns:1fr}.hero>div{min-height:360px}}
</style></head><body>
<div class="hero"><div>${S('#2B2722', 300)}${inline('lockup-horizontal.svg', 44, '#2B2722')}<div class=cap>Years, ${V.v}, on paper</div></div>
<div class="night">${S('#F2ECE4', 300)}${inline('lockup-horizontal.svg', 44, '#F2ECE4')}<div class=cap>At night</div></div></div>

<section><div class="wrap rat"><div>${S('#8A5A3B', 240)}</div><div><div class=kick>For a parent</div>
<p>The small dot is your child at the very beginning, and each ring around it is a year of things you said to them.</p>
<p>Like the rings inside a tree, the first year never goes away; it stays at the centre of everything that grows around it.</p>
<p>Every ring rests on the same ground, the way a child's height is marked from the same floor each birthday, so the book only ever gets fuller.</p></div></div></section>

<section><div class=wrap><div class=kick>Sizes</div><h2>From a browser tab to the App Store</h2>
<div class=sizes>
<figure><img src="png/icon-16.png" width=16 height=16>16</figure>
<figure><img src="png/icon-29.png" width=29 height=29>29</figure>
<figure><img src="png/icon-60.png" width=60 height=60>60</figure>
<figure><img src="png/icon-180.png" width=180 height=180>180</figure>
<figure><img class=px src="png/icon-16.png" width=128 height=128>16px, 8x</figure>
<figure><img class=px src="png/icon-29.png" width=232 height=232>29px, 8x</figure>
<figure><img class=px src="png/favicon-16.png" width=128 height=128>favicon 16, 8x</figure>
<figure><img class=px src="png/favicon-dark-16.png" width=128 height=128>favicon dark, 8x</figure>
</div><p style="color:var(--muted);font-size:14px;margin-top:18px">Sizes 40px and below use symbol-small.svg: thicker hairlines and a larger seed, same drawing. The favicon switches to light ink in dark mode.</p></div></section>

<section><div class=wrap><div class=kick>Home screen</div><h2>Among the apps a parent already has</h2><div class=phones>${phone(false)}${phone(true)}</div>
<p style="color:var(--muted);font-size:14px;text-align:center">Neighbour icons are generic stand-ins. Dark appearance shows the alternate dark icon (accent ink on night).</p></div></section>

<section><div class=wrap><div class=kick>Email</div><h2>The header at 28px tall</h2><div class=mails>
<div class=mail><div class=hd>${inline('lockup-horizontal.svg', 28, '#2B2722')}</div><div class=bd><h3>Here is your sign-in link</h3><p>Tap the button on this phone to sign in. The link works once.</p><span class=btn>Sign in</span></div></div>
<div class="mail dark"><div class=hd>${inline('lockup-horizontal.svg', 28, '#F2ECE4')}</div><div class=bd><h3>Here is your sign-in link</h3><p>Tap the button on this phone to sign in. The link works once.</p><span class=btn>Sign in</span></div></div>
</div></div></section>

<section><div class=wrap><div class=kick>Print</div><h2>Spine and cloth cover, blind deboss</h2><div class=shelf>
<div class="spine cloth">${S('#E8D9C6', 30)}<div class=t>Early Letters &nbsp; Year One</div></div>
<div class="spine cloth green">${S('#E8D9C6', 30)}<div class=t>Early Letters &nbsp; Year Two</div></div>
<div class="cover cloth"><div class=emb>
  ${S('rgba(255,255,255,.16)', 120, sym, 'style="transform:translateY(1.5px)"')}${S('rgba(0,0,0,.45)', 120, sym, 'style="transform:translateY(-1.2px)"')}${S('#6e4730', 120)}</div><div class=yr>Year One</div></div>
</div><p style="color:var(--muted);font-size:14px">Single colour, no foil: the rings are pressed into the cloth. True circles and 3-unit hairlines (at least 0.9 mm at a 30 mm mark) survive a deboss die.</p></div></section>

<section><div class=wrap><div class=kick>Tests</div><h2>The six tests, honestly</h2><div class=tests>${tests.map(([t, v, n]) => `<div class=test><b>${t}</b><div class=v>${v}</div>${n}</div>`).join('')}</div>
<p style="font-size:14px;color:var(--muted);margin-top:18px"><b>Near matches found:</b> Target's bullseye (concentric, centred; ours is offset and weighted, but it lives in the same family). Opera browser's "O". Growth Rings, a UK woodworking brand (same idea, rings around a G). The circled-dot sun sign. Many wellness and fintech "ripple" marks. Needs a professional search in classes 9, 16 and 42.</p></div></section>

<section><div class="wrap cons"><div><svg viewBox="5 4 90 90" width=340><g fill="none" stroke="#C9B9A6" stroke-width=".35"><path d="M5 90H95"/></g><path fill="#2B2722" d="${sym}"/><g fill="none" stroke="#8A5A3B" stroke-width=".4" stroke-dasharray="1.2 1"><circle cx="50" cy="49" r="41"/><circle cx="50" cy="${V.c2}" r="22.5"/></g></svg></div>
<div><div class=kick>Construction</div><h2>Three circles on one floor</h2><p>Every outer edge is a true circle. The rings and the seed nest inside one another and touch at a single point near the ground line. Each ring is heaviest at the top, where a year's growth is widest, and a hairline at the floor. The two rings turn their weight in opposite directions, which keeps the mark from becoming a target and gives it a slow, held turn. ${V.nodes} on-curve points in all; no strokes, no text.</p></div></div></section>

<section><div class=wrap><div class=kick>Sketches</div><h2>What was tried and why it was left</h2><div class=sk>${notes.map((n) => `<figure><img src="sketches/${n.f}">${n.t}</figure>`).join('')}</div></div></section>
</body></html>`;
fs.writeFileSync(path.join(OUT, 'presentation.html'), html);
const SCR = '/tmp/claude-0/-home-claude/0474e45a-2c84-52d9-9895-8ca6c82c5c79/scratchpad/years';
await shoot([{ file: path.join(OUT, 'presentation.html'), out: `${SCR}/pres-${V.v}.png`, width: 1280, height: 900, full: true, wait: 500 },
  { file: path.join(OUT, 'presentation.html'), out: `${SCR}/pres-${V.v}-mobile.png`, width: 390, height: 844, full: true, wait: 500 }]);
await done();
