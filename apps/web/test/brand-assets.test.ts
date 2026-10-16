/**
 * The website's brand files are the approved registry masters, byte for byte (scripts/web/sync-brand-assets.mjs).
 *
 * Always: every copy in apps/web matches the hash, size and dimensions recorded in src/lib/brand/web-assets.json,
 * the old generated icons are gone, the routes and the welcome email use those files, and the header lockup's
 * generated paths rebuild the master SVG.
 * Where the masters exist (packages/brand/registry.json, on develop): each master hashes to the lock, and the sync
 * script's --check passes. On a branch without them (main today) that part is skipped and says why.
 */
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { brand } from '@scribe/brand';
import AppleIcon, { size as appleSize } from '../src/app/apple-icon';
import OpenGraphImage, { alt as ogAlt, size as ogSize } from '../src/app/opengraph-image';
import { LOCKUP_HEIGHT, Lockup } from '../src/components/brand/Lockup';
import { lockupHorizontal } from '../src/components/brand/lockup.generated';
import lock from '../src/lib/brand/web-assets.json';
import { webAssets, type WebAssetId } from '../src/lib/brand/web-assets';
import { renderWelcomeEmail } from '../src/lib/notify/welcome-email';

const WEB = resolve(import.meta.dirname, '..');
const ROOT = resolve(WEB, '../..');
const SCRIPT = join(ROOT, 'scripts/web/sync-brand-assets.mjs');
const REGISTRY = join(ROOT, 'packages/brand/registry.json');
const mastersPresent = existsSync(REGISTRY);
const ids = Object.keys(webAssets) as WebAssetId[];

const sha256 = (b: Uint8Array) => createHash('sha256').update(b).digest('hex');
function pngSize(b: Buffer) {
  expect(b.subarray(1, 4).toString('latin1')).toBe('PNG');
  return { width: b.readUInt32BE(16), height: b.readUInt32BE(20) };
}
function viewBox(svg: string) {
  const [, , width, height] = (/viewBox="([^"]+)"/.exec(svg)?.[1] ?? '').trim().split(/[\s,]+/).map(Number);
  return { width, height };
}

describe('brand files in apps/web match the lock', () => {
  it('names the five web and email contexts and every asset they use', () => {
    expect(new Set(ids.map((id) => webAssets[id].context))).toEqual(
      new Set(['web.favicon', 'web.apple-touch', 'web.og-image', 'email.header.light', 'email.header.dark']),
    );
    expect([...ids].sort()).toEqual(
      [
        'email.logo.dark@1x',
        'email.logo.dark@2x',
        'email.logo.light@1x',
        'email.logo.light@2x',
        'favicon.apple-touch',
        'favicon.icon192',
        'favicon.icon512',
        'favicon.manifest',
        'favicon.png32',
        'favicon.svg',
        'og.image',
      ].sort(),
    );
  });

  for (const id of ids) {
    it(`${id}: every copy has the recorded hash, size and dimensions, and the first is served at its url`, () => {
      const a = webAssets[id];
      expect(a.copies[0]).toBe(`apps/web/public${a.url}`);
      for (const copy of a.copies) {
        const file = join(ROOT, copy);
        expect(existsSync(file), copy).toBe(true);
        const bytes = readFileSync(file);
        expect({ copy, bytes: bytes.length, sha256: sha256(bytes) }).toEqual({ copy, bytes: a.bytes, sha256: a.sha256 });
        if (a.format === 'png') expect(pngSize(bytes), copy).toEqual({ width: a.dimensions?.width, height: a.dimensions?.height });
        if (a.format === 'svg') expect(viewBox(bytes.toString('utf8')), copy).toEqual({ width: a.dimensions?.width, height: a.dimensions?.height });
      }
    });
  }

  it('the asset folders under public hold nothing but registry copies', () => {
    const named = new Set(ids.map((id) => webAssets[id].copies[0]));
    for (const dir of ['favicon', 'og', 'email']) {
      for (const name of readdirSync(join(WEB, 'public', dir))) expect(named.has(`apps/web/public/${dir}/${name}`), `${dir}/${name}`).toBe(true);
    }
  });

  it('the manifest lists exactly the registry 192 and 512 icons', () => {
    const manifest = JSON.parse(readFileSync(join(WEB, 'public', webAssets['favicon.manifest'].url), 'utf8'));
    expect(manifest.icons.map((i: { src: string }) => i.src)).toEqual([webAssets['favicon.icon192'].url, webAssets['favicon.icon512'].url]);
    expect(manifest.icons.map((i: { sizes: string }) => i.sizes)).toEqual(['192x192', '512x512']);
  });
});

describe('the old envelope mark and its generators are gone', () => {
  it('no icon, Apple icon or share image is drawn in code any more', () => {
    for (const gone of ['apple-icon.tsx', 'opengraph-image.tsx', 'twitter-image.tsx', 'icon.tsx', '_fonts']) {
      expect(existsSync(join(WEB, 'src/app', gone)), gone).toBe(false);
    }
    for (const file of ['apple-icon.ts', 'opengraph-image.ts']) {
      expect(readFileSync(join(WEB, 'src/app', file), 'utf8'), file).not.toMatch(/ImageResponse|next\/og/);
    }
  });

  it('src/app/icon.svg is the approved favicon, not the envelope', () => {
    const svg = readFileSync(join(WEB, 'src/app/icon.svg'), 'utf8');
    expect(svg).not.toContain('M512 330 C470 262'); // the envelope's body path in the old icon.svg
    expect(sha256(Buffer.from(svg))).toBe(webAssets['favicon.svg'].sha256);
  });
});

describe('routes that keep the old addresses serve the registry files', () => {
  it('/apple-icon answers with the approved 180 px touch icon', async () => {
    const body = new Uint8Array(await (await AppleIcon()).arrayBuffer());
    expect(sha256(body)).toBe(webAssets['favicon.apple-touch'].sha256);
    expect(appleSize).toEqual({ width: 180, height: 180 });
  });

  it('/opengraph-image answers with the approved 1200 x 630 share image, described by its alt text', async () => {
    const body = new Uint8Array(await (await OpenGraphImage()).arrayBuffer());
    expect(sha256(body)).toBe(webAssets['og.image'].sha256);
    expect(ogSize).toEqual({ width: 1200, height: 630 });
    expect(ogAlt).toBe(`${brand.name}. ${brand.tagline}`);
  });
});

describe('the welcome email shows the approved mark', () => {
  const { html } = renderWelcomeEmail('https://earlyletters.com', 'https://earlyletters.com/unsubscribe?t=abc.def');
  /** Addresses on the site that serve a registry file, and which one. */
  const served = new Map<string, WebAssetId>([
    ['/apple-icon', 'favicon.apple-touch'],
    ...ids.map((id) => [webAssets[id].url, id] as [string, WebAssetId]),
  ]);

  it('every picture it loads from the site is a registry file', () => {
    const srcs = [...html.matchAll(/<img\b[^>]*\bsrc="https:\/\/earlyletters\.com([^"?]+)[^"]*"/g)].map((m) => m[1]);
    expect(srcs.length).toBeGreaterThan(0);
    for (const path of srcs) expect(served.has(path), `${path} is not a registry file`).toBe(true);
  });
});

describe('the header lockup is the registry master, drawn in currentColor', () => {
  const entry = lock.inline['logo.lockup.horizontal.ink'];

  it('the generated paths rebuild the master SVG byte for byte', () => {
    const L = lockupHorizontal;
    const body = L.paths.map((p) => `<path fill="${L.fill}"${'transform' in p ? ` transform="${p.transform}"` : ''} d="${p.d}"/>`).join('');
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${L.viewBox}" role="img" aria-label="${brand.name}"><title>${brand.name}</title>${body}</svg>\n`;
    expect({ bytes: Buffer.byteLength(svg), sha256: sha256(Buffer.from(svg)) }).toEqual({ bytes: entry.bytes, sha256: entry.sha256 });
    expect({ width: L.width, height: L.height }).toEqual({ width: entry.dimensions.width, height: entry.dimensions.height });
    expect(L.paths).toHaveLength(2); // the symbol, then the wordmark
  });

  it('renders 28 px tall (context web.header) in currentColor, hidden from screen readers inside a labelled link', () => {
    const svg = renderToStaticMarkup(createElement(Lockup));
    expect(svg).toContain(`viewBox="${lockupHorizontal.viewBox}"`);
    expect(svg).toContain('height="28"');
    expect(svg).toContain(`width="${Math.round((lockupHorizontal.width / lockupHorizontal.height) * 28 * 100) / 100}"`);
    expect(svg).toContain('fill="currentColor"');
    expect(svg).toContain('aria-hidden="true"');
    expect(svg).not.toMatch(/#2B2722|<title/);
    expect(svg.match(/<path /g)).toHaveLength(2);
    expect(LOCKUP_HEIGHT).toBeGreaterThanOrEqual(27); // below 27 px the registry asks for the small cut
  });

  it('standing alone, it reads as the brand name', () => {
    expect(renderToStaticMarkup(createElement(Lockup, { label: true }))).toContain(`role="img" aria-label="${brand.name}"`);
  });

  it('the film header draws the lockup, not the typed name', () => {
    const header = readFileSync(join(WEB, 'src/components/cta/Header.tsx'), 'utf8');
    expect(header).toContain('<Lockup />');
    expect(header).not.toContain('<Wordmark');
  });
});

describe.skipIf(!mastersPresent)(
  mastersPresent
    ? 'the web copies match the registry masters by hash'
    : 'the web copies match the registry masters by hash: SKIPPED, packages/brand/registry.json is not on this branch (the masters live on develop; run `node scripts/web/sync-brand-assets.mjs --check --masters=<develop checkout>`)',
  () => {
    it('each master hashes to the lock', () => {
      const masters = [...ids.map((id) => [id, webAssets[id]] as const), ...Object.entries(lock.inline)];
      for (const [id, a] of masters) {
        expect({ id, sha256: sha256(readFileSync(join(ROOT, a.master))) }).toEqual({ id, sha256: a.sha256 });
      }
    });

    it('sync-brand-assets --check finds no difference', () => {
      const run = spawnSync(process.execPath, [SCRIPT, '--check'], { cwd: ROOT, encoding: 'utf8' });
      expect(run.stderr).toBe('');
      expect(run.status, run.stdout).toBe(0);
      expect(run.stdout).toMatch(/^sync-brand-assets: ok:/);
    });
  },
);

describe('sync-brand-assets on a branch without the masters', () => {
  it.skipIf(mastersPresent)('says it skipped and why, changes nothing, and exits 0', () => {
    const run = spawnSync(process.execPath, [SCRIPT, '--check'], { cwd: ROOT, encoding: 'utf8' });
    expect(run.status).toBe(0);
    expect(run.stdout).toMatch(/skipped: .*registry\.json is absent/);
  });
});
