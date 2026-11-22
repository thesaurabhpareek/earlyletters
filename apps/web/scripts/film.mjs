#!/usr/bin/env node
/**
 * The whole film, scene by scene: for every <main> section[id], shoots N frames across that scene's
 * own pinned range (progress 0..1), at each size, then writes one contact sheet per size.
 *
 *   node scripts/film.mjs --url http://localhost:3100/ --out <dir> [--frames 8] [--sizes 390x844,1440x900] [--only s03,s04] [--reduced]
 *
 * Sheets: <out>/<size>-sheet.jpg (rows = scenes, columns = progress). Needs ffmpeg-free Python Pillow.
 */
import { chromium } from 'playwright-core';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';

const args = Object.fromEntries(
  process.argv.slice(2).reduce((acc, a, i, all) => {
    if (a.startsWith('--')) acc.push([a.slice(2), all[i + 1] && !all[i + 1].startsWith('--') ? all[i + 1] : true]);
    return acc;
  }, []),
);
const url = args.url ?? 'http://localhost:3100/';
const out = args.out ?? '/tmp/film';
const frames = Number(args.frames ?? 8);
const sizes = String(args.sizes ?? '390x844,1440x900').split(',').map((s) => s.split('x').map(Number));
const only = args.only ? String(args.only).split(',') : null;
mkdirSync(out, { recursive: true });

const SHEET = `
import json, sys
from PIL import Image, ImageDraw
rows = json.load(open(sys.argv[1])); w, h = int(sys.argv[3]), int(sys.argv[4])
tw = 300 if w > 600 else 150; th = round(tw * h / w)
cols = max(len(r['files']) for r in rows)
sheet = Image.new('RGB', (cols * tw + 90, len(rows) * th), 'black'); d = ImageDraw.Draw(sheet)
for ri, r in enumerate(rows):
    d.text((6, ri * th + 6), r['id'][:12], fill='white')
    for ci, f in enumerate(r['files']):
        sheet.paste(Image.open(f).convert('RGB').resize((tw, th)), (90 + ci * tw, ri * th))
sheet.save(sys.argv[2], quality=80)
`;


const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
for (const [w, h] of sizes) {
  const mobile = w < 600;
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: mobile ? 2 : 1, isMobile: mobile, hasTouch: mobile, reducedMotion: args.reduced ? 'reduce' : 'no-preference' });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  const scenes = await page.evaluate(() =>
    [...document.querySelectorAll('main section[id]')].map((s) => {
      const top = s.getBoundingClientRect().top + scrollY;
      return { id: s.id, start: top, end: top + s.offsetHeight - innerHeight };
    }),
  );
  const rows = [];
  for (const [si, s] of scenes.entries()) {
    if (only && !only.some((o) => s.id.startsWith(o) || `s${String(si + 1).padStart(2, '0')}` === o)) continue;
    const row = [];
    for (let k = 0; k < frames; k++) {
      const t = frames === 1 ? 0 : k / (frames - 1);
      await page.evaluate((y) => window.scrollTo(0, y), Math.round(s.start + (s.end - s.start) * t));
      await page.waitForTimeout(380);
      const file = join(out, `${w}x${h}-${String(si + 1).padStart(2, '0')}-${s.id}-${k}.png`);
      await page.screenshot({ path: file });
      row.push(file);
    }
    rows.push({ id: s.id, files: row });
  }
  writeFileSync(join(out, `${w}x${h}-rows.json`), JSON.stringify(rows));
  if (errors.length) writeFileSync(join(out, `${w}x${h}-errors.txt`), errors.join('\n'));
  execFileSync('python3', ['-c', SHEET, join(out, `${w}x${h}-rows.json`), join(out, `${w}x${h}-sheet.jpg`), String(w), String(h)]);
  console.log(join(out, `${w}x${h}-sheet.jpg`), errors.length ? `${errors.length} console errors` : 'no console errors');
  await ctx.close();
}
await browser.close();

