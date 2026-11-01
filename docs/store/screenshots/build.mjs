// Builds the store screenshots from the real web app-ui screens (apps/web/src/components/app-ui).
// Run from the repo root:  node docs/store/screenshots/build.mjs
// Needs: esbuild and playwright-core (both already in the workspace), chromium (PW_CHROMIUM or /opt/pw-browsers).
import { build } from '../../../node_modules/esbuild/lib/main.js';
import { chromium } from '../../../node_modules/playwright-core/index.mjs';
import { mkdirSync, writeFileSync, readFileSync, existsSync, readdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '../../..');
const web = join(root, 'apps/web');
const work = join(tmpdir(), 'el-store-shots');
mkdirSync(work, { recursive: true });

await build({
  entryPoints: [join(here, 'src/entry.tsx')],
  bundle: true, format: 'iife', outfile: join(work, 'bundle.js'), jsx: 'automatic', minify: true,
  alias: { '@': join(web, 'src') },
  nodePaths: [join(web, 'node_modules'), join(root, 'node_modules')],
  define: { 'process.env.NODE_ENV': '"production"' },
  loader: { '.json': 'json' },
});

const font = (p) => pathToFileURL(join(root, 'node_modules', p)).href;
const css = readFileSync(join(web, 'src/app/globals.css'), 'utf8');
const faces = `
@font-face{font-family:'Literata Variable';font-weight:200 900;font-style:normal;src:url(${font('@fontsource-variable/literata/files/literata-latin-wght-normal.woff2')})}
@font-face{font-family:'Literata Variable';font-weight:200 900;font-style:italic;src:url(${font('@fontsource-variable/literata/files/literata-latin-wght-italic.woff2')})}
${[400, 500, 600].map((w) => `@font-face{font-family:'Mukta';font-weight:${w};src:url(${font(`@fontsource/mukta/files/mukta-latin-${w}-normal.woff2`)})}`).join('\n')}`;
writeFileSync(join(work, 'index.html'), `<!doctype html><meta charset="utf-8"><style>${faces}\n${css}\nhtml,body{margin:0;background:transparent}</style><div id="root"></div><script src="bundle.js"></script>`);

const captions = JSON.parse(readFileSync(join(here, 'captions.json'), 'utf8'));
const sets = [
  { dir: 'ios-6.9in', w: 1320, h: 2868 },
  { dir: 'ios-6.5in', w: 1284, h: 2778 },
  { dir: 'play-1080x1920', w: 1080, h: 1920 },
  { dir: 'play-1440x2560', w: 1440, h: 2560 },
];
const exe = process.env.PW_CHROMIUM || (() => {
  const base = '/opt/pw-browsers';
  const d = existsSync(base) ? readdirSync(base).filter((n) => /^chromium-\d+$/.test(n)).sort().pop() : null;
  return d ? join(base, d, 'chrome-linux64/chrome') : undefined;
})();
const browser = await chromium.launch({ executablePath: exe });
for (const s of sets) {
  mkdirSync(join(here, s.dir), { recursive: true });
  const page = await browser.newPage({ viewport: { width: s.w, height: s.h }, deviceScaleFactor: 1 });
  for (const c of captions) {
    await page.goto(`${pathToFileURL(join(work, 'index.html')).href}?id=${c.id}&w=${s.w}&h=${s.h}`);
    await page.waitForFunction('window.__ready === true');
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({ path: join(here, s.dir, `${c.id}.png`), omitBackground: false });
    console.log(s.dir, c.id);
  }
  await page.close();
}
await browser.close();
