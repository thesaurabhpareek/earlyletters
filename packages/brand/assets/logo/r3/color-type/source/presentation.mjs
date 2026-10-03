// Builds ../presentation.html from colors.json and whatever symbol folders exist in ../png/.
import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
const HERE = dirname(fileURLToPath(import.meta.url)); const ROOT = join(HERE, '..');
const REPO = resolve(HERE, '../../../../../../..');
const NAME = (readFileSync(join(REPO, 'packages/brand/index.ts'), 'utf8').match(/\bname:\s*'([^']+)'/) || [])[1];
const { tiles, tokens } = JSON.parse(readFileSync(join(ROOT, 'colors.json'), 'utf8'));
const tags = readdirSync(join(ROOT, 'png')).filter((d) => existsSync(join(ROOT, 'png', d, 'compare-1024.png')));
const LABEL = { 'b-two-voices': 'Stand-in: r2 two-voices (B)', 'r3-quote': 'r3 quote (redrawn)', 'r3-quote-letter': 'r3 quote-letter (redrawn)' };
const img = (p, cap, cls = '') => existsSync(join(ROOT, p)) ? `<figure class="${cls}"><img src="${p}" alt="${cap}" loading="lazy"><figcaption>${cap}</figcaption></figure>` : '';
const sw = (t) => `<span class="sw" style="background:linear-gradient(180deg,${t.top},${t.bot})"><b style="color:${t.fg}">"</b></span>`;
const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Tile and Wordmark</title><style>
:root{--bg:#FBF8F3;--fg:#2B2722;--mut:#6B645B;--card:#fff;--line:#E6DED3;--acc:#7F4F30}
@media (prefers-color-scheme:dark){:root:not([data-theme=light]){--bg:#161412;--fg:#F2ECE4;--mut:#B3AA9E;--card:#201D1A;--line:#33302C;--acc:#D9A47E}}
:root[data-theme=dark]{--bg:#161412;--fg:#F2ECE4;--mut:#B3AA9E;--card:#201D1A;--line:#33302C;--acc:#D9A47E}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--fg);font:16px/1.55 Mukta,system-ui,sans-serif}
main{max-width:1180px;margin:0 auto;padding:40px 16px 80px}h1,h2,h3{font-family:Literata,Georgia,serif;font-weight:500;line-height:1.2}
h1{font-size:40px;margin:0 0 6px}h2{font-size:28px;margin:56px 0 12px;border-top:1px solid var(--line);padding-top:28px}h3{font-size:20px;margin:28px 0 8px}
.lede{color:var(--mut);max-width:760px}.pick{background:var(--card);border:1px solid var(--line);border-radius:16px;padding:20px 24px;margin:20px 0}
.pick b{color:var(--acc)}table{border-collapse:collapse;width:100%;font-size:14px;margin:12px 0;display:block;overflow-x:auto}td,th{padding:6px 10px;border-bottom:1px solid var(--line);text-align:left;white-space:nowrap}
.sw{display:inline-flex;width:34px;height:34px;border-radius:9px;align-items:center;justify-content:center;font:700 22px Georgia;vertical-align:middle}
figure{margin:16px 0}img{max-width:100%;height:auto;display:block;border-radius:10px;border:1px solid var(--line)}figcaption{color:var(--mut);font-size:13px;margin-top:6px}
.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:16px}.phone img{max-width:402px}
</style></head><body><main>
<h1>${NAME}: tile colour and wordmark</h1>
<p class="lede">Logo round 3, slug color-type. Each tile was judged on a real home screen among colourful neighbours, in light and dark, with every ratio computed. Then W4 and W1 were compared, each locked up with the quote mark.</p>
<div class="pick"><p><b>Default icon:</b> vertical gradient #9A613C to #7F4F30, paper mark (4.78 top / 5.53 mid / 6.47 bottom).<br>
<b>Dark:</b> #2C2926 to #1F1B18, accentDark #D9A47E mark (6.58 to 7.79).<br><b>Tinted:</b> ship the mark as one solid grayscale layer; the system tints it.<br>
<b>Token:</b> add <code>accentDeep #7F4F30</code> plus an <code>icon</code> block (PROPOSED_TOKENS.md).<br>
<b>Wordmark:</b> W4 revised (EB Garamond, word space +15%, a small cut under 20 px). Size it by x-height (1.2 times W1's em). Below 13 px, use the symbol alone. W1 is the fallback.</p></div>
<h2>1. Tile candidates</h2>
<table><tr><th></th><th>Candidate</th><th>Top to bottom</th><th>Mark</th><th>Contrast top / mid / bottom</th><th>OKLCH L / C / h (mid)</th></tr>
${tiles.map((t) => `<tr><td>${sw(t)}</td><td>${t.label}</td><td>${t.top} to ${t.bot}</td><td>${t.fg}</td><td>${t.cTop} / ${t.cMid} / ${t.cBot}</td><td>${t.L} / ${t.C} / ${t.h}</td></tr>`).join('')}</table>
<p class="lede">"Muddy" in numbers: today's flat tile has chroma 0.078 at lightness 0.51. Leather keeps the hue (52) but adds chroma (0.085) and a 0.07 lightness drop from top to bottom. That is what makes it look clean rather than dusty.</p>
${tags.map((tag) => `<h3>${LABEL[tag] || tag}</h3><div class="grid">
${img(`png/${tag}/lineup-light-gradient.png`, 'All candidates on one home screen: light wallpaper', 'phone')}${img(`png/${tag}/lineup-dark-photo.png`, 'Dark photo wallpaper (light-mode icons)', 'phone')}
${img(`png/${tag}/lineup-pale-neutral.png`, 'Pale neutral wallpaper: the paper tile loses its edge', 'phone')}${img(`png/${tag}/lineup-warm-beige.png`, 'Warm beige wallpaper', 'phone')}</div>
${img(`png/${tag}/compare-1024.png`, '1024 masters, unmasked')}${img(`png/${tag}/compare-home-light-crop.png`, 'Bench home screen crops, native 3x')}
${img(`png/${tag}/compare-small-sizes.png`, '29 px and 16 px, magnified')}${img(`png/${tag}/compare-home-dark-crop.png`, 'Dark appearance')}
${img(`png/${tag}/appearances-tints.png`, 'Six appearances with amber and blue user tints (tinted and clear are simulated)')}
${img(`png/${tag}/recommended-sheet-home.png`, 'Recommended tile: light, dark, tinted, clear home screens')}${img(`png/${tag}/recommended-appearances.png`, 'Recommended tile: six appearances')}`).join('')}
<h2>2. Contrast reference</h2><table><tr><th>Pair</th><th>Ratio</th></tr>${tokens.map((t) => `<tr><td>${t.pair}</td><td>${t.ratio}:1</td></tr>`).join('')}</table>
<h2>3. Wordmark: W4 revised vs W1</h2>
<p class="lede">W4 fixes: word white 266.9 to 306.9 units (+15%). Small cut: weight 540, +2.5% tracking. EB Garamond 1.003 is SIL OFL 1.1 with no Reserved Font Name (checked in the font's name table). W4 wins on voice at 28 px and up; W1 is more legible at 14 px.</p>
${tags.map((tag) => `<h3>${LABEL[tag] || tag}</h3>${img(`png/${tag}/wordmark-matrix-1x.png`, 'Lockups at 14 / 28 / 64 / 160 px (font size), paper and night')}
${img(`png/${tag}/wordmark-w4-before-after-14-28.png`, 'W4 before and after, 14 and 28 px, magnified 4x next to actual size')}
${img(`png/${tag}/wordmark-email-header.png`, 'Email header and footer, light and dark')}${img(`png/${tag}/wordmark-splash.png`, 'App splash, light and dark')}`).join('')}
<h2>4. Notes</h2><p class="lede">The bench approximates Liquid Glass and simulates tinted and clear. Final sign-off belongs in Icon Composer and on a device. r2's bench.mjs fails to parse (unescaped backticks in writeIndex), so this study used a patched copy in source/bench-fixed.mjs. Full reasoning is in RECOMMENDATION.md.</p>
</main></body></html>`;
writeFileSync(join(ROOT, 'presentation.html'), html);
console.log('presentation.html with', tags);
