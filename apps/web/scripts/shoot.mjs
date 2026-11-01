#!/usr/bin/env node
/**
 * Owner: E6 (visual QA). Shared camera for the team: renders a page at given scroll
 * positions and sizes, so everyone reviews real renders, not guesses.
 *
 * Usage (from apps/web, with a dev or prod server running):
 *   node scripts/shoot.mjs --url http://localhost:3101/lab/s03 --out /tmp/shots/s03 \
 *     [--points 0,0.2,0.4,0.6,0.8,1] [--sizes 390x844,1440x900] [--reduced] [--video] [--fps 30] [--seconds 8]
 *
 * --points  fractions of the page's scrollable height (0 = top, 1 = bottom).
 *           On a /lab page the scene's own progress 0..1 maps to points ~0.33..0.67
 *           because of the one-screen lead-in and lead-out; use --scene to map
 *           points to the scene's own progress instead.
 * --scene   treat points as the first <section> scene's progress (0 = pinned start, 1 = pinned end).
 * --video   also records a smooth scroll-through to <out>/<size>.mp4 (ffmpeg), at --fps for --seconds.
 * --reduced emulates prefers-reduced-motion: reduce.
 *
 * Browsers: playwright-core uses PLAYWRIGHT_BROWSERS_PATH (/opt/pw-browsers here).
 */
import { chromium } from 'playwright-core';
import { mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';

const args = Object.fromEntries(
  process.argv.slice(2).reduce((acc, a, i, all) => {
    if (a.startsWith('--')) {
      const next = all[i + 1];
      acc.push([a.slice(2), next && !next.startsWith('--') ? next : true]);
    }
    return acc;
  }, []),
);

const url = args.url;
if (!url) {
  console.error('missing --url');
  process.exit(2);
}
const out = args.out || '/tmp/shots';
const points = String(args.points || '0,0.25,0.5,0.75,1').split(',').map(Number);
const sizes = String(args.sizes || '390x844,1440x900').split(',').map((s) => s.split('x').map(Number));
const reduced = Boolean(args.reduced);
const sceneMode = Boolean(args.scene);
const fps = Number(args.fps || 30);
const seconds = Number(args.seconds || 8);
mkdirSync(out, { recursive: true });

const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const report = [];

for (const [w, h] of sizes) {
  const isMobile = w < 600;
  const context = await browser.newContext({
    viewport: { width: w, height: h },
    deviceScaleFactor: isMobile ? 3 : 2,
    isMobile,
    hasTouch: isMobile,
    reducedMotion: reduced ? 'reduce' : 'no-preference',
  });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);

  const range = await page.evaluate((scene) => {
    const max = document.documentElement.scrollHeight - innerHeight;
    if (!scene) return { start: 0, end: max };
    const s = document.querySelector('main section, section');
    if (!s) return { start: 0, end: max };
    const top = s.getBoundingClientRect().top + scrollY;
    return { start: top, end: top + s.offsetHeight - innerHeight };
  }, sceneMode);

  for (const p of points) {
    const y = Math.round(range.start + (range.end - range.start) * p);
    await page.evaluate((yy) => window.scrollTo(0, yy), y);
    await page.waitForTimeout(450);
    const file = join(out, `${w}x${h}${reduced ? '-reduced' : ''}-p${String(p).replace('.', '_')}.png`);
    await page.screenshot({ path: file });
    report.push(file);
  }

  if (args.video) {
    const dir = join(out, `.frames-${w}x${h}`);
    rmSync(dir, { recursive: true, force: true });
    mkdirSync(dir, { recursive: true });
    const frames = Math.round(fps * seconds);
    for (let i = 0; i <= frames; i++) {
      const t = i / frames;
      const eased = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
      const y = Math.round(range.start + (range.end - range.start) * eased);
      await page.evaluate((yy) => window.scrollTo(0, yy), y);
      await page.waitForTimeout(1000 / fps);
      await page.screenshot({ path: join(dir, `${String(i).padStart(5, '0')}.png`), scale: 'css' });
    }
    const mp4 = join(out, `${w}x${h}${reduced ? '-reduced' : ''}.mp4`);
    execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-framerate', String(fps), '-i', join(dir, '%05d.png'), '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-vf', 'scale=trunc(iw/2)*2:trunc(ih/2)*2', mp4]);
    rmSync(dir, { recursive: true, force: true });
    report.push(mp4);
  }

  if (errors.length) writeFileSync(join(out, `${w}x${h}-errors.txt`), errors.join('\n'));
  await context.close();
}

await browser.close();
console.log(report.join('\n'));
