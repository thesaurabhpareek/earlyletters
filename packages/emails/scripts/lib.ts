/**
 * Template discovery, rendering and the preview gallery. Used by
 * scripts/render.ts (CLI) and by the tests, so both see exactly the same HTML.
 */
import { copyFile, mkdir, readdir, writeFile } from 'node:fs/promises';
import { basename, extname, join, relative, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { createElement, type ComponentType } from 'react';
import { renderEmail, renderEmailText } from '../src/components/render';
import { assetFor } from '@scribe/brand';
import { ASSET_BASE, ASSET_ORIGIN, dark, fonts, light } from '../src/tokens';

export const PACKAGE_ROOT = resolve(import.meta.dirname, '..');
export const TEMPLATES_DIR = join(PACKAGE_ROOT, 'src', 'templates');
export const FIXTURES_DIR = join(PACKAGE_ROOT, 'test', 'fixtures');
export const OUT_DIR = join(PACKAGE_ROOT, 'out');
/** B3's email assets; copied next to the gallery so previews work before the site is live. */
export const BRAND_EMAIL_ASSETS = resolve(PACKAGE_ROOT, '..', 'brand', 'assets', 'email');
/** Gallery copies of the header logos (registry contexts email.header.*): source file and its name under /email/. */
const REPO_ROOT = resolve(PACKAGE_ROOT, '..', '..');
const GALLERY_ASSETS = (['email.header.light', 'email.header.dark'] as const).map((c) => {
  const a = assetFor(c)[0];
  return { src: join(REPO_ROOT, a.path!), name: a.url!.replace(/^\/email\//, '') };
});

/** Gallery copies of the web fonts (registry context email.type), served from out/fonts/. */
const GALLERY_FONTS = assetFor('email.type').map((a) => ({ src: join(REPO_ROOT, a.path!), name: a.url!.replace(/^\/fonts\//, '') }));

/**
 * Gallery variants load images from out/email/ and fonts from out/fonts/ instead of the live site, so previews
 * look right before the site serves them. Shipped HTML is untouched.
 */
const localAssets = (html: string) => html.split(`${ASSET_BASE}/`).join('../email/').split(`${ASSET_ORIGIN}/fonts/`).join('../fonts/');

export type TemplateModule = {
  default: ComponentType<any>;
  PreviewProps: Record<string, unknown>;
  /** Optional, shown in the gallery. */
  subject?: string;
};

export type Discovered = { name: string; file: string; mod: TemplateModule };

export type Rendered = Discovered & {
  html: string;
  text: string;
  /** Gallery-only variants with the theme forced. */
  htmlLight: string;
  htmlDark: string;
};

async function walk(dir: string): Promise<string[]> {
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return [];
  }
  const out: string[] = [];
  for (const e of entries) {
    const p = join(dir, e.name);
    if (e.isDirectory()) out.push(...(await walk(p)));
    else if (/\.(tsx|ts)$/.test(e.name) && !/\.(test|spec|d)\.tsx?$/.test(e.name)) out.push(p);
  }
  return out.sort();
}

/**
 * A template is any module under the directories that exports a default
 * component AND `PreviewProps`. Helpers (no PreviewProps) are skipped.
 * The output name is the file's base name, which must be unique.
 */
export async function discoverTemplates(dirs: string[]): Promise<Discovered[]> {
  const found: Discovered[] = [];
  const seen = new Map<string, string>();
  for (const dir of dirs) {
    for (const file of await walk(dir)) {
      const mod = (await import(pathToFileURL(file).href)) as Partial<TemplateModule>;
      if (typeof mod.default !== 'function' || !mod.PreviewProps || typeof mod.PreviewProps !== 'object') continue;
      const name = basename(file, extname(file));
      const prev = seen.get(name);
      if (prev) throw new Error(`Two templates named "${name}": ${prev} and ${file}`);
      seen.set(name, file);
      found.push({ name, file, mod: mod as TemplateModule });
    }
  }
  return found;
}

export async function renderTemplate(t: Discovered): Promise<Rendered> {
  const el = () => createElement(t.mod.default, t.mod.PreviewProps);
  const [html, text, htmlLight, htmlDark] = await Promise.all([
    renderEmail(el()),
    renderEmailText(el()),
    renderEmail(el(), { theme: 'light' }),
    renderEmail(el(), { theme: 'dark' }),
  ]);
  return { ...t, html, text, htmlLight, htmlDark };
}

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const kb = (s: string) => (Buffer.byteLength(s, 'utf8') / 1024).toFixed(1);

/** Gallery page: each email at 375px, light and forced-dark side by side. */
export function galleryHtml(items: Rendered[]): string {
  const rows = items
    .map(
      (r) => `
  <section class="email" id="${esc(r.name)}">
    <header>
      <h2>${esc(r.name)}</h2>
      <p>${r.mod.subject ? `${esc(r.mod.subject)} &middot; ` : ''}${kb(r.html)} KB &middot;
        <a href="${esc(r.name)}.html">shipped HTML</a> &middot; <a href="${esc(r.name)}.txt">plain text</a></p>
    </header>
    <div class="frames">
      <figure><iframe title="${esc(r.name)} light" src="gallery/${esc(r.name)}.light.html" loading="lazy"></iframe><figcaption>Light</figcaption></figure>
      <figure><iframe title="${esc(r.name)} dark" src="gallery/${esc(r.name)}.dark.html" loading="lazy"></iframe><figcaption>Dark (forced)</figcaption></figure>
    </div>
  </section>`,
    )
    .join('\n');

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light dark">
<title>Email gallery</title>
<style>
:root{--bg:${light.desk};--ink:${light.ink};--muted:${light.inkMuted};--line:${light.line};--accent:${light.accent};}
@media (prefers-color-scheme: dark){:root{--bg:${dark.desk};--ink:${dark.ink};--muted:${dark.inkMuted};--line:${dark.line};--accent:${dark.accent};}}
*{box-sizing:border-box}
body{margin:0;background:var(--bg);color:var(--ink);font-family:${fonts.sans};}
main{max-width:860px;margin:0 auto;padding:40px 16px 80px}
h1{font-family:${fonts.serif};font-weight:500;font-size:30px;margin:0 0 6px}
.lede{color:var(--muted);margin:0 0 24px}
nav{display:flex;flex-wrap:wrap;gap:8px 16px;margin:0 0 40px;font-size:14px}
a{color:var(--accent)}
.email{border-top:1px solid var(--line);padding:32px 0}
.email h2{font-family:${fonts.serif};font-weight:500;font-size:22px;margin:0 0 4px}
.email header p{color:var(--muted);font-size:14px;margin:0 0 20px}
.frames{display:flex;flex-wrap:wrap;gap:24px}
figure{margin:0}
iframe{width:375px;max-width:calc(100vw - 32px);height:780px;border:1px solid var(--line);border-radius:28px;background:#888}
figcaption{color:var(--muted);font-size:13px;margin-top:8px;text-align:center}
</style>
</head>
<body>
<main>
<h1>Email gallery</h1>
<p class="lede">${items.length} email${items.length === 1 ? '' : 's'}, 375px frames. Left: light. Right: dark styles forced on, as Apple Mail and Outlook apps show them.</p>
<nav>${items.map((r) => `<a href="#${esc(r.name)}">${esc(r.name)}</a>`).join('')}</nav>
${rows}
</main>
</body>
</html>
`;
}

export async function buildAll(opts: { dirs: string[]; outDir: string }): Promise<Rendered[]> {
  const templates = await discoverTemplates(opts.dirs);
  const rendered: Rendered[] = [];
  for (const t of templates) rendered.push(await renderTemplate(t));
  await mkdir(join(opts.outDir, 'gallery'), { recursive: true });
  await mkdir(join(opts.outDir, 'email'), { recursive: true });
  await mkdir(join(opts.outDir, 'fonts'), { recursive: true });
  for (const f of GALLERY_FONTS) await copyFile(f.src, join(opts.outDir, 'fonts', f.name));
  for (const f of GALLERY_ASSETS) {
    await copyFile(f.src, join(opts.outDir, 'email', f.name)).catch(() => {
      console.warn(`Gallery: ${f.src} not found; previews will show alt text.`);
    });
  }
  await Promise.all(
    rendered.flatMap((r) => [
      writeFile(join(opts.outDir, `${r.name}.html`), r.html),
      writeFile(join(opts.outDir, `${r.name}.txt`), r.text),
      writeFile(join(opts.outDir, 'gallery', `${r.name}.light.html`), localAssets(r.htmlLight)),
      writeFile(join(opts.outDir, 'gallery', `${r.name}.dark.html`), localAssets(r.htmlDark)),
    ]),
  );
  await writeFile(join(opts.outDir, 'index.html'), galleryHtml(rendered));
  return rendered;
}

export const rel = (p: string) => relative(PACKAGE_ROOT, p);
