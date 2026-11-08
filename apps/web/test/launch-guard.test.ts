/**
 * The launch gate (src/lib/launch-guard.ts): the build stops, loudly, if the flip is on without what it needs.
 * Owner: E3 (release).
 */
import { describe, expect, it } from 'vitest';
import { EMPTY_STORE_QR } from '../src/lib/qr/build';
import { REHEARSAL_MARKER, checkLaunchGate, launchGateMessage } from '../src/lib/launch-guard';

const URL_OK = 'https://apps.apple.com/us/app/early-letters-memory-book/id1234567890';
const QR_HREF = `${URL_OK}?pt=123456&ct=web-qr`;
const QR_OK = { url: QR_HREF, dim: 49, path: 'M4 4h7v1h-7z' };
// A believable stand-in for Apple's file: an SVG of about the right size. It is not Apple's artwork.
const BIG_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 40"><path d="${'M0 0h1v1z'.repeat(250)}"/></svg>`;
const READY = { LAUNCH_STRICT: '1', NEXT_PUBLIC_APP_STORE_URL: URL_OK, NEXT_PUBLIC_APP_STORE_BADGE: '1', SITE_MODE: 'film', NEXT_PUBLIC_APPLE_PROVIDER_TOKEN: '123456' };

const gate = (env: Record<string, string | undefined>, badgeFile: string | null = BIG_SVG, qr = QR_OK) =>
  checkLaunchGate({ env, badgeFile, qr, qrHref: QR_HREF });

describe('flip off: nothing is demanded', () => {
  it('passes with the link unset, empty or invalid, even with no badge file and no QR', () => {
    for (const NEXT_PUBLIC_APP_STORE_URL of [undefined, '', '  ', 'https://testflight.apple.com/join/abc', 'not a url']) {
      expect(gate({ NEXT_PUBLIC_APP_STORE_URL }, null, EMPTY_STORE_QR)).toEqual({ launch: false, rehearsal: false, strict: false, problems: [], notes: [] });
    }
  });

  it('does not care about the badge flag or the site mode while the link is unset', () => {
    expect(gate({ NEXT_PUBLIC_APP_STORE_BADGE: '1', SITE_MODE: 'coming-soon' }, 'x').problems).toEqual([]);
  });
});

describe('flip on', () => {
  it('passes with the badge file, the badge flag, the film and the committed QR', () => {
    const r = gate(READY);
    expect(r.launch).toBe(true);
    expect(r.problems).toEqual([]);
    expect(r.notes).toEqual([]);
  });

  it('fails when the badge file is missing', () => {
    expect(gate(READY, null).problems.join('\n')).toContain('public/brand/app-store-badge.svg is missing');
  });

  it('fails when the badge flag is not 1', () => {
    for (const NEXT_PUBLIC_APP_STORE_BADGE of [undefined, '', '0', 'true']) {
      expect(gate({ ...READY, NEXT_PUBLIC_APP_STORE_BADGE }).problems.join('\n')).toContain('NEXT_PUBLIC_APP_STORE_BADGE must be 1');
    }
  });

  it('fails on a file that is not the artwork: not an SVG, too small, the rehearsal stand-in, or with script', () => {
    const cases: [string, RegExp][] = [
      ['<html></html>'.repeat(300), /not an SVG/],
      ['<svg></svg>', /stand-in/],
      [`${BIG_SVG}<!-- ${REHEARSAL_MARKER} -->`, /rehearsal stand-in/],
      [BIG_SVG.replace('</svg>', '<script>1</script></svg>'), /contains script/],
      [BIG_SVG.replace('<path', '<path onload="x()"'), /contains script/],
    ];
    for (const [file, message] of cases) expect(gate(READY, file).problems.join('\n')).toMatch(message);
  });

  it('fails when the committed QR is empty or opens another link', () => {
    for (const qr of [EMPTY_STORE_QR, { ...QR_OK, url: `${URL_OK}?pt=999&ct=web-qr` }]) {
      expect(gate(READY, BIG_SVG, qr).problems.join('\n')).toContain('npm run qr:generate');
    }
  });

  it('fails on the holding page: only the film has the download action', () => {
    for (const env of [{ ...READY, SITE_MODE: 'coming-soon' }, { ...READY, SITE_MODE: undefined, VERCEL_ENV: 'production' }]) {
      expect(gate(env).problems.join('\n')).toContain('SITE_MODE=film');
    }
    // Off production an unset SITE_MODE is the film, so that is fine.
    expect(gate({ ...READY, SITE_MODE: undefined }).problems).toEqual([]);
  });

  it('lists every problem at once', () => {
    const r = gate({ NEXT_PUBLIC_APP_STORE_URL: URL_OK, SITE_MODE: 'coming-soon' }, null, EMPTY_STORE_QR);
    expect(r.problems).toHaveLength(4);
    const message = launchGateMessage(r.problems);
    expect(message).toContain('[launch]');
    expect(message).toContain('docs/web/launch-flip.md');
    for (const p of r.problems) expect(message).toContain(p);
  });

  it('only notes a missing provider token: the site still works', () => {
    const { NEXT_PUBLIC_APPLE_PROVIDER_TOKEN: _drop, ...env } = READY;
    void _drop;
    const r = gate(env);
    expect(r.problems).toEqual([]);
    expect(r.notes.join('\n')).toContain('provider token');
    expect(gate({ ...env, NEXT_PUBLIC_APP_STORE_URL: `${URL_OK}?pt=555` }).notes).toEqual([]);
  });
});

describe('strict or not', () => {
  it('is strict on a Vercel production build or with LAUNCH_STRICT=1, and only warns elsewhere', () => {
    expect(gate(READY).strict).toBe(true);
    expect(gate({ NEXT_PUBLIC_APP_STORE_URL: URL_OK, VERCEL_ENV: 'production' }).strict).toBe(true);
    const ci = gate({ NEXT_PUBLIC_APP_STORE_URL: URL_OK }, null, EMPTY_STORE_QR);
    expect(ci.strict).toBe(false);
    expect(ci.problems.length).toBeGreaterThan(0); // still reported, so the build log shows them
  });
});

describe('rehearsal', () => {
  it('skips the badge file check but never on production', () => {
    const env = { ...READY, LAUNCH_REHEARSAL: '1' };
    const r = gate(env, null);
    expect(r.rehearsal).toBe(true);
    expect(r.problems).toEqual([]);
    expect(gate({ ...env, VERCEL_ENV: 'production' }, null).problems.join('\n')).toContain('LAUNCH_REHEARSAL=1 is set on a production build');
  });

  it('still demands the badge flag, the film and the QR', () => {
    const r = gate({ NEXT_PUBLIC_APP_STORE_URL: URL_OK, LAUNCH_REHEARSAL: '1', SITE_MODE: 'coming-soon' }, null, EMPTY_STORE_QR);
    expect(r.problems).toHaveLength(3);
  });
});
