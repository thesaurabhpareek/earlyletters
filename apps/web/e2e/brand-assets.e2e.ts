/**
 * The site serves the approved r3 mark (two opening quotation marks and the wordmark), not the old envelope:
 * every icon the page declares, /favicon.ico, /apple-icon, the share image, the web manifest and every picture the
 * welcome email loads answer with the registry file byte for byte (hashes in src/lib/brand/web-assets.json, which
 * apps/web/test/brand-assets.test.ts ties to the copies and, where they exist, to the masters).
 */
import { createHash } from 'node:crypto';
import type { APIRequestContext } from '@playwright/test';
import { brand } from '@scribe/brand';
import { webAssets, type WebAssetId } from '../src/lib/brand/web-assets';
import { expect, notifyApi, test } from './support/fixtures';

const sha256 = (b: Buffer) => createHash('sha256').update(b).digest('hex');
/** The site's own absolute addresses (link previews and emails use https://earlyletters.com) as a path on this server. */
const onThisServer = (href: string) => {
  const url = new URL(href, 'https://earlyletters.com');
  return `${url.pathname}${url.search}`;
};
const pngSize = (b: Buffer) => ({ width: b.readUInt32BE(16), height: b.readUInt32BE(20) });

async function expectRegistryFile(request: APIRequestContext, href: string, id: WebAssetId, contentType: RegExp) {
  const res = await request.get(onThisServer(href));
  expect(res.status(), href).toBe(200);
  expect(res.headers()['content-type'], href).toMatch(contentType);
  expect(sha256(await res.body()), `${href} is the registry file ${id}`).toBe(webAssets[id].sha256);
}

test.describe('the approved brand mark', () => {
  test('the page declares the SVG tab icon first, the 32 px PNG fallback, the Apple touch icon and the manifest, each the registry file', async ({ page, request }) => {
    await page.goto('/');
    const links = await page
      .locator('link[rel~="icon"], link[rel="apple-touch-icon"], link[rel="manifest"]')
      .evaluateAll((els) => els.map((l) => ({ rel: l.getAttribute('rel'), href: l.getAttribute('href') ?? '', type: l.getAttribute('type'), sizes: l.getAttribute('sizes') })));
    const icons = links.filter((l) => l.rel === 'icon');
    expect(icons.map((l) => l.type)).toEqual(['image/svg+xml', 'image/png']);
    expect(icons[1].sizes).toBe('32x32');
    await expectRegistryFile(request, icons[0].href, 'favicon.svg', /^image\/svg\+xml/);
    await expectRegistryFile(request, icons[1].href, 'favicon.png32', /^image\/png/);

    const apple = links.find((l) => l.rel === 'apple-touch-icon');
    expect(apple?.sizes).toBe('180x180');
    await expectRegistryFile(request, apple!.href, 'favicon.apple-touch', /^image\/png/);

    const manifest = links.find((l) => l.rel === 'manifest');
    expect(manifest?.href).toBe(webAssets['favicon.manifest'].url);
    await expectRegistryFile(request, manifest!.href, 'favicon.manifest', /manifest\+json|application\/json/);
  });

  test('/favicon.ico leads to the approved SVG favicon', async ({ request }) => {
    await expectRegistryFile(request, '/favicon.ico', 'favicon.svg', /^image\/svg\+xml/);
  });

  test('/apple-icon, the address earlier welcome emails load, answers with the approved touch icon', async ({ request }) => {
    await expectRegistryFile(request, '/apple-icon', 'favicon.apple-touch', /^image\/png/);
  });

  for (const path of ['/', '/privacy']) {
    test(`${path}: og:image and twitter:image are the approved 1200 x 630 share image, with alt text`, async ({ page, request }) => {
      await page.goto(path);
      const meta = (selector: string) => page.locator(selector).first().getAttribute('content');
      const og = (await meta('meta[property="og:image"]')) ?? '';
      expect(og).toMatch(/^https:\/\/earlyletters\.com\//);
      await expectRegistryFile(request, og, 'og.image', /^image\/png/);
      expect(await meta('meta[property="og:image:width"]')).toBe('1200');
      expect(await meta('meta[property="og:image:height"]')).toBe('630');
      expect(await meta('meta[property="og:image:type"]')).toBe('image/png');
      expect(await meta('meta[property="og:image:alt"]')).toBe(`${brand.name}. ${brand.tagline}`);
      const twitter = (await meta('meta[name="twitter:image"]')) ?? '';
      await expectRegistryFile(request, twitter, 'og.image', /^image\/png/);
    });
  }

  test('every registry file is served at its registry url', async ({ request }) => {
    const types: Record<string, RegExp> = { png: /^image\/png/, svg: /^image\/svg\+xml/, webmanifest: /manifest\+json|application\/json/ };
    for (const id of Object.keys(webAssets) as WebAssetId[]) {
      await expectRegistryFile(request, webAssets[id].url, id, types[webAssets[id].format]);
    }
  });

  test('the manifest icons load at the sizes it declares', async ({ request }) => {
    const manifest = await (await request.get(webAssets['favicon.manifest'].url)).json();
    expect(manifest.icons).toHaveLength(2);
    for (const icon of manifest.icons as { src: string; sizes: string }[]) {
      const res = await request.get(icon.src);
      expect(res.status(), icon.src).toBe(200);
      const { width, height } = pngSize(await res.body());
      expect(`${width}x${height}`, icon.src).toBe(icon.sizes);
    }
  });

  test('every picture the welcome email loads from the site is an approved registry file', async ({ request, mock, email, clientIp }) => {
    expect((await notifyApi(request, clientIp, email)).status()).toBe(200);
    const [sent] = await mock.emailsTo(email);
    const srcs = [...sent.html.matchAll(/<img\b[^>]*\bsrc="(https:\/\/earlyletters\.com[^"]+)"/g)].map((m) => m[1]);
    expect(srcs.length).toBeGreaterThan(0);
    const byPath = new Map<string, WebAssetId>([
      ['/apple-icon', 'favicon.apple-touch'],
      ...(Object.keys(webAssets) as WebAssetId[]).map((id) => [webAssets[id].url, id] as [string, WebAssetId]),
    ]);
    for (const src of srcs) {
      const id = byPath.get(new URL(src).pathname);
      expect(id, `${src} is a registry file`).toBeDefined();
      await expectRegistryFile(request, src, id!, /^image\//);
    }
  });
});
