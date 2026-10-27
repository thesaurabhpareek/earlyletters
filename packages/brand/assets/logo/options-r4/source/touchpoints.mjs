// Touchpoint assets for logo options B, C and D: share previews, video end cards, social plates and covers,
// notification glyphs, Android launcher layers, avatars. Same recipes and proportions as
// packages/brand/scripts/build-touchpoints.mjs, so adopting an option means swapping files, not redesigning.
// Run: node packages/brand/assets/logo/options-r4/source/touchpoints.mjs   (after build.mjs)
// Needs sharp and opentype.js (devDependencies of @scribe/brand). Set SHARP_FROM to a package.json that resolves them.
import fs from 'node:fs';
import path from 'node:path';
import { C, SYM, SYM_SMALL, lockupSvg, symbolSvg, tileSvg, OPTIONS, png, write, ROOT, read, sharp, createRequire, markGroup } from './build.mjs';

const deps = createRequire(process.env.SHARP_FROM || path.resolve(ROOT, '../../../package.json'));
const opentype = deps('opentype.js');
const TAGLINE = fs.readFileSync(path.resolve(ROOT, '../../../index.ts'), 'utf8').match(/\btagline:\s*'([^']*)'/)[1];
const MUTED = { light: C.inkMuted, dark: '#B3AA9E' };
const GROUND = { light: C.paper, dark: C.paperDark };

// ---- tagline outlines (Literata 400 italic, as in the approved OG image)
function outlineText(fontFile, text, size) {
  const buf = fs.readFileSync(fontFile);
  const font = opentype.parse(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.length));
  const k = size / font.unitsPerEm;
  const glyphs = text.split('').map((ch) => font.charToGlyph(ch));
  const f2 = (n) => (Math.round(n * 100) / 100).toString();
  const parts = [];
  let x = 0, minX = Infinity, maxX = -Infinity;
  glyphs.forEach((g, i) => {
    const X = (v) => { const r = x + v * k; minX = Math.min(minX, r); maxX = Math.max(maxX, r); return f2(r); };
    const Y = (v) => f2(-v * k);
    for (const c of g.path.commands) {
      if (c.type === 'M' || c.type === 'L') parts.push(`${c.type}${X(c.x)} ${Y(c.y)}`);
      else if (c.type === 'Q') parts.push(`Q${X(c.x1)} ${Y(c.y1)} ${X(c.x)} ${Y(c.y)}`);
      else if (c.type === 'C') parts.push(`C${X(c.x1)} ${Y(c.y1)} ${X(c.x2)} ${Y(c.y2)} ${X(c.x)} ${Y(c.y)}`);
      else if (c.type === 'Z') parts.push('Z');
    }
    const kern = i < glyphs.length - 1 ? font.getKerningValue(g, glyphs[i + 1]) : 0;
    x += (g.advanceWidth + (Number.isFinite(kern) ? kern : 0)) * k;
  });
  const d = parts.join('');
  if (/NaN/.test(d)) throw new Error('outlineText: NaN in path');
  return { d, x0: minX, w: maxX - minX };
}
const ITALIC = deps.resolve('@fontsource/literata/files/literata-latin-400-italic.woff');

// ---- stacked lockup (symbol above wordmark), recoloured per option
function colors(kind, mode) {
  const dark = mode === 'reversed';
  const word = dark ? C.inkDark : C.ink;
  if (kind === 'B') return { word, big: dark ? C.inkDark : C.ink, small: dark ? C.accentDark : C.accent };
  if (kind === 'D') return { word, big: dark ? C.accentDark : C.accentDeep, small: dark ? C.accentDark : C.accentDeep };
  return { word, big: word, small: word };
}
function stackedSvg(kind, mode) {
  const s = read(mode === 'reversed' ? 'lockup-stacked-reversed.svg' : 'lockup-stacked.svg');
  const vb = s.match(/viewBox="([^"]+)"/)[1];
  const p = [...s.matchAll(/<path ([^>]*?) d="([^"]+)"\/>/g)];
  const [a, b] = p[0][2].split('ZM');
  const c = colors(kind, mode);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb}"><path fill="${c.big}" d="${a}Z"/><path fill="${c.small}" d="M${b}"/><path fill="${c.word}" ${p[1][1].replace(/fill="[^"]+"\s*/, '')} d="${p[1][2]}"/></svg>`;
}
const vbOf = (svg) => svg.match(/viewBox="([^"]+)"/)[1].split(/\s+/).map(Number);
const inner = (svg) => svg.replace(/<\/?svg[^>]*>/g, '').replace(/<title>[\s\S]*?<\/title>/, '');

/** Lockup (and optionally the tagline under it) centred on a ground. */
function block({ W, H, mode, lock, LH, tag = true, cy = H / 2, x = null }) {
  const [lx, ly, lw, lh] = vbOf(lock);
  const LW = (LH * lw) / lh;
  const em = (LH * 1000) / lh;
  const t = outlineText(ITALIC, TAGLINE, 0.5 * em);
  const total = LH + (tag ? 0.68 * em : 0);
  const top = cy - total / 2;
  const left = x ?? (W - LW) / 2;
  let out = `<rect width="${W}" height="${H}" fill="${GROUND[mode]}"/><svg x="${left.toFixed(2)}" y="${top.toFixed(2)}" width="${LW.toFixed(2)}" height="${LH}" viewBox="${lx} ${ly} ${lw} ${lh}">${inner(lock)}</svg>`;
  if (tag) out += `<path fill="${MUTED[mode]}" transform="translate(${((W - t.w) / 2 - t.x0).toFixed(2)} ${(top + LH + 0.68 * em).toFixed(2)})" d="${t.d}"/>`;
  return out;
}
const frame = (W, H, body) => `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${body}</svg>`;

// ---- per option
async function build(kind, dir) {
  const stacked = kind !== 'C';
  const lockFor = (mode) => (stacked ? stackedSvg(kind, mode === 'dark' ? 'reversed' : 'ink') : lockupSvg('C', mode === 'dark' ? 'reversed' : 'ink'));
  const LH = stacked ? { og: 270, sq: 520, wide: 420, tall: 460 } : { og: 140, sq: 150, wide: 200, tall: 150 };
  const T = path.join(dir, 'touchpoints');
  // Share previews: Open Graph / X / iMessage / Slack (1200x630), square for WhatsApp, Instagram and LinkedIn (1200x1200).
  await png(frame(1200, 630, block({ W: 1200, H: 630, mode: 'light', lock: lockFor('light'), LH: LH.og })), path.join(T, 'og', 'og-image-1200x630.png'));
  await png(frame(1200, 1200, block({ W: 1200, H: 1200, mode: 'light', lock: lockFor('light'), LH: LH.sq })), path.join(T, 'og', 'og-image-square-1200x1200.png'));
  // Video end cards.
  await png(frame(1920, 1080, block({ W: 1920, H: 1080, mode: 'light', lock: lockFor('light'), LH: LH.wide })), path.join(T, 'video', 'end-card-1920x1080.png'));
  await png(frame(1080, 1920, block({ W: 1080, H: 1920, mode: 'light', lock: lockFor('light'), LH: LH.tall })), path.join(T, 'video', 'end-card-1080x1920.png'));
  // Social post plate 4:5: opening mark top left, small lockup at the foot, quote area empty.
  {
    const W = 1080, H = 1350, M = 96;
    const symK = kind === 'B' ? { big: C.ink, small: C.accent } : { big: kind === 'D' ? C.accentDeep : C.accent };
    const sym = symbolSvg(SYM, symK);
    const [sx, sy, sw, sh] = vbOf(sym);
    const SH = 88, SW = (SH * sw) / sh;
    const lk = lockupSvg(kind, 'ink');
    const [lx, ly, lw, lh] = vbOf(lk);
    const LHs = 44, LWs = (LHs * lw) / lh;
    const body = `<rect width="${W}" height="${H}" fill="${C.paper}"/><svg x="${M}" y="${M + 24}" width="${SW.toFixed(2)}" height="${SH}" viewBox="${sx} ${sy} ${sw} ${sh}">${inner(sym)}</svg><svg x="${M - LHs * 0.15}" y="${H - M - LHs}" width="${LWs.toFixed(2)}" height="${LHs}" viewBox="${lx} ${ly} ${lw} ${lh}">${inner(lk)}</svg>`;
    await png(frame(W, H, body), path.join(T, 'social', 'post-template-1080x1350.png'));
  }
  // Profile covers: lockup centred inside each platform's safe area, no tagline.
  const covers = { 'x-header-1500x500': [1500, 500], 'linkedin-banner-1584x396': [1584, 396], 'facebook-cover-1640x624': [1640, 624], 'youtube-banner-2560x1440': [2560, 1440] };
  const horizontal = lockupSvg(kind, 'ink');
  const [, , hw, hh] = vbOf(horizontal);
  for (const [name, [W, H]] of Object.entries(covers)) {
    const h = Math.round(Math.min(0.3 * H, (0.5 * W) / (hw / hh)));
    await png(frame(W, H, block({ W, H, mode: 'light', lock: horizontal, LH: h, tag: false })), path.join(T, 'social', `${name}.png`));
  }
  if (kind === 'C') return; // icon-derived files below are identical to the approved mark (option C changes lockups only)
  const o = OPTIONS[kind];
  // Avatars: email sender and social (circle-safe).
  fs.mkdirSync(path.join(T, 'email'), { recursive: true });
  fs.copyFileSync(path.join(dir, 'app', 'app-icon-1024.png'), path.join(T, 'email', 'avatar-1024.png'));
  fs.mkdirSync(path.join(T, 'social'), { recursive: true });
  fs.copyFileSync(path.join(ROOT, 'profile', `earlyletters-profile-${o.name}-1024.png`), path.join(T, 'social', 'avatar-circle-safe-1024.png'));
  // Notification glyph: small-cut silhouette, white on transparent, 20 px live area on a 24 px canvas.
  {
    const m = 44.65, vbw = SYM_SMALL.bw + 2 * m, vbh = SYM_SMALL.bh + 2 * m;
    const s = 20 / Math.max(vbw, vbh);
    const tx = 12 - (-m + vbw / 2) * s, ty = 12 - (-m + vbh / 2) * s;
    const g = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24"><title>Early Letters</title><g transform="translate(${tx.toFixed(3)} ${ty.toFixed(3)}) scale(${s.toFixed(6)})" fill="#FFFFFF"><path d="${SYM_SMALL.big}"/><path d="${SYM_SMALL.small}"/></g></svg>\n`;
    write(path.join(T, 'notification', 'glyph.svg'), g);
    for (const px of [24, 36, 48, 72, 96]) {
      await sharp(Buffer.from(g), { density: 72 * (px / 24) }).resize(px, px).png({ compressionLevel: 9 }).toFile(await ensure(path.join(T, 'notification', `glyph-${px}.png`)));
    }
  }
  await android(o, T);
}

/** Android adaptive launcher (v1.1): 432 px layers (108 dp at xxxhdpi), mark inside the 66 dp safe zone, plus the Play Store icon. */
async function android(o, T) {
  {
    const px = 432, w = px * 0.4;
    const mk = (cols) => `<svg xmlns="http://www.w3.org/2000/svg" width="${px}" height="${px}" viewBox="0 0 ${px} ${px}">${markGroup(SYM, px / 2, px / 2 + px * 0.02, w, cols)}</svg>`;
    await png(mk(o.cols.light), path.join(T, 'android', 'ic_launcher_foreground-432.png'), false);
    await png(mk({ big: '#FFFFFF' }), path.join(T, 'android', 'ic_launcher_monochrome-432.png'), false);
    const bg = `<svg xmlns="http://www.w3.org/2000/svg" width="${px}" height="${px}"><defs><linearGradient id="t" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${o.tiles.light[0]}"/><stop offset="1" stop-color="${o.tiles.light[1]}"/></linearGradient></defs><rect width="${px}" height="${px}" fill="url(#t)"/></svg>`;
    await png(bg, path.join(T, 'android', 'ic_launcher_background-432.png'));
    await png(tileSvg(512, { tile: o.tiles.light, cols: o.cols.light }), path.join(T, 'android', 'play-store-512.png'));
  }
}
async function ensure(file) { fs.mkdirSync(path.dirname(file), { recursive: true }); return file; }

const only = process.argv[2];
if (!only || only === 'A') await android(OPTIONS.A, path.join(ROOT, 'A-approved', 'touchpoints'));
for (const [k, d] of [['B', OPTIONS.B.name], ['C', 'C-quoted-name'], ['D', OPTIONS.D.name]]) {
  if (!only || only === k) await build(k, path.join(ROOT, d));
}
console.log('touchpoints built');
