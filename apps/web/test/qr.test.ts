/**
 * The desktop QR (W2): the committed file src/lib/qr/qr.generated.ts and its helpers. Owner: E3 (release).
 *
 * The QR is made by hand at the launch flip with the pinned devDependency qrcode-generator and committed. These tests are
 * the tamper check the CISO asked for: the committed link must be an official App Store link with ct=web-qr, and the
 * committed drawing must be exactly what the pinned library makes from that link. While the file is empty (before launch)
 * only the shape is checked. Nothing here runs in the site or in a browser.
 */
import { readFileSync } from 'node:fs';
import qrcode from 'qrcode-generator';
import { describe, expect, it } from 'vitest';
import { checkAppStoreUrl } from '../src/lib/launch';
import { EMPTY_STORE_QR, generatedFileText, qrPathFromModules, storeQrMatches } from '../src/lib/qr/build';
import { STORE_QR } from '../src/lib/qr/qr.generated';

const LINK = 'https://apps.apple.com/us/app/early-letters-memory-book/id1234567890?pt=123456&ct=web-qr';

function make(url: string) {
  const qr = qrcode(0, 'M');
  qr.addData(url, 'Byte');
  qr.make();
  return qr;
}
function draw(url: string) {
  const qr = make(url);
  return { count: qr.getModuleCount(), ...qrPathFromModules(qr.getModuleCount(), (r, c) => qr.isDark(r, c)) };
}

describe('the committed QR', () => {
  it('is either empty (before launch) or an official App Store link with ct=web-qr', () => {
    if (!STORE_QR.url) {
      expect(STORE_QR).toEqual(EMPTY_STORE_QR);
      return;
    }
    expect(checkAppStoreUrl(STORE_QR.url).ok).toBe(true);
    expect(new URL(STORE_QR.url).searchParams.get('ct')).toBe('web-qr');
  });

  it('is exactly what the pinned library draws for that link (tamper check)', () => {
    if (!STORE_QR.url) return;
    const fresh = draw(STORE_QR.url);
    expect({ url: STORE_QR.url, dim: fresh.dim, path: fresh.path }).toEqual(STORE_QR);
  });

  it('is formatted the way the generator writes it, so a hand edit shows as a diff', () => {
    const text = readFileSync(new URL('../src/lib/qr/qr.generated.ts', import.meta.url), 'utf8');
    expect(text).toBe(generatedFileText(STORE_QR));
  });
});

describe('qrPathFromModules', () => {
  it('covers exactly the dark modules, offset by the quiet zone, using nothing but path commands', () => {
    const { count, dim, path } = draw(LINK);
    expect(dim).toBe(count + 8);
    const painted = new Set<string>();
    for (const r of Array.from(path.matchAll(/M(\d+) (\d+)h(\d+)v1h-\d+z/g))) {
      for (let i = 0; i < Number(r[3]); i++) painted.add(`${Number(r[1]) + i},${r[2]}`);
    }
    const qr = make(LINK);
    const dark = new Set<string>();
    for (let y = 0; y < count; y++) for (let x = 0; x < count; x++) if (qr.isDark(y, x)) dark.add(`${x + 4},${y + 4}`);
    expect(painted).toEqual(dark);
    expect(path).toMatch(/^[Mhvz\d \-]+$/);
    expect(path.length).toBeLessThan(8000);
  });

  it('is version 6 to 8 at level M for a store link with campaign tokens', () => {
    expect([41, 45, 49]).toContain(draw(LINK).count);
  });
});

describe('storeQrMatches (fail closed)', () => {
  const good = { url: LINK, dim: 49, path: 'M4 4h7v1h-7z' };

  it('accepts the QR only when its link is exactly the link of this deployment', () => {
    expect(storeQrMatches(good, LINK)).toBe(true);
  });

  it('refuses a different link, an empty link, an empty drawing, or a path with anything but path commands', () => {
    expect(storeQrMatches(good, `${LINK}&x=1`)).toBe(false);
    expect(storeQrMatches(good, '')).toBe(false);
    expect(storeQrMatches(EMPTY_STORE_QR, '')).toBe(false);
    expect(storeQrMatches({ ...good, path: '' }, LINK)).toBe(false);
    expect(storeQrMatches({ ...good, path: 'M0 0"/><script>' }, LINK)).toBe(false);
    expect(storeQrMatches({ ...good, dim: 0 }, LINK)).toBe(false);
  });
});
