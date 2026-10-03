/**
 * Every email the package renders: src/templates (lane D2) plus the pipeline
 * fixture. If a check fails for a template, fix the template or its copy,
 * not the check.
 */
import { mkdtemp, readFile, rm, stat } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { FIXTURES_DIR, TEMPLATES_DIR, buildAll, type Rendered } from '../scripts/lib';
import { ASSET_ORIGIN } from '../src/tokens';

/** Gmail clips messages over about 102KB (industry-documented; see README). */
const GMAIL_CLIP_BYTES = 102 * 1024;
/** Gmail ignores a <style> block over 16KB (caniemail.com, html-style). */
const GMAIL_STYLE_BYTES = 16 * 1024;
/**
 * Link destinations on other hosts that are allowed, and why. Resources
 * (images, fonts, CSS) are never allowed from anywhere but earlyletters.com.
 */
const LINK_HOST_ALLOWLIST = new Map<string, string>([
  ['apps.apple.com', "Apple's own subscription management page (billing emails)"],
]);
const BANNED = /[\u2014\u2013\u2018\u2019\u201C\u201D\u2026]/; // em/en dash, curly quotes, ellipsis

let outDir: string;
let all: Rendered[] = [];

beforeAll(async () => {
  outDir = await mkdtemp(join(tmpdir(), 'scribe-emails-'));
  all = await buildAll({ dirs: [TEMPLATES_DIR, FIXTURES_DIR], outDir });
}, 120_000);

afterAll(async () => {
  if (outDir) await rm(outDir, { recursive: true, force: true });
});

const attrs = (html: string, name: string) =>
  [...html.matchAll(new RegExp(`\\s${name}="([^"]*)"`, 'gi'))].map((m) => m[1]!.replace(/&amp;/g, '&'));
const cssUrls = (html: string) => [...html.matchAll(/url\(\s*['"]?([^'")]+)['"]?\s*\)/gi)].map((m) => m[1]!);
const isPlaceholder = (u: string) => /^\{[a-zA-Z][a-zA-Z0-9]*\}$/.test(u);
const host = (u: string) => {
  try {
    return new URL(u).host;
  } catch {
    return '(unparseable)';
  }
};

describe('pipeline', () => {
  it('discovers the fixture and writes html, txt and the gallery', async () => {
    const names = all.map((r) => r.name);
    expect(names).toContain('pipeline-sample');
    for (const f of ['pipeline-sample.html', 'pipeline-sample.txt', 'index.html', 'gallery/pipeline-sample.dark.html']) {
      expect((await stat(join(outDir, f))).size, f).toBeGreaterThan(0);
    }
    const gallery = await readFile(join(outDir, 'index.html'), 'utf8');
    expect(gallery).toContain('gallery/pipeline-sample.light.html');
    expect(gallery).toContain('gallery/pipeline-sample.dark.html');
    expect(gallery).toMatch(/iframe\{width:375px/);
  });

  it('skips helper modules that have no PreviewProps', () => {
    expect(all.map((r) => r.name)).not.toContain('CopyEmail');
  });

  it('forces dark styles unconditionally in the dark gallery variant', () => {
    const r = all.find((x) => x.name === 'pipeline-sample')!;
    expect(r.htmlDark).toContain('<meta name="color-scheme" content="dark"');
    expect(r.htmlDark).not.toContain('@media (prefers-color-scheme: dark)');
    expect(r.htmlDark).toMatch(/\.el-sheet\{background-color:#201D1A !important/);
    expect(r.htmlLight).not.toContain('el-sheet{background-color:#201D1A');
  });

  it('renders every component in the fixture', () => {
    const r = all.find((x) => x.name === 'pipeline-sample')!;
    for (const marker of ['el-logo-light', 'el-logo-dark', 'el-btn-text', 'el-soft', 'el-rule', '482913', 'Warmly,']) {
      expect(r.html, marker).toContain(marker);
    }
    expect(r.html).toContain('aria-label="4 8 2 9 1 3"');
  });
});

describe.each(['html', 'text'] as const)('banned characters (%s)', (part) => {
  it('has no em or en dashes, curly quotes or ellipsis characters', () => {
    const bad = all.filter((r) => BANNED.test(r[part])).map((r) => `${r.name}: ${r[part].match(BANNED)![0]}`);
    expect(bad).toEqual([]);
  });
});

describe('every rendered email', () => {
  const each = (fn: (r: Rendered) => void) => () => {
    expect(all.length).toBeGreaterThan(0);
    for (const r of all) fn(r);
  };

  it(
    'declares both colour schemes',
    each((r) => {
      expect(r.html, r.name).toContain('<meta name="color-scheme" content="light dark"');
      expect(r.html, r.name).toContain('<meta name="supported-color-schemes" content="light dark"');
      expect(r.html, r.name).toContain('@media (prefers-color-scheme: dark)');
      expect(r.html, r.name).toContain('[data-ogsc]');
    }),
  );

  it(
    'has a non-empty preheader that stays out of the plain text',
    each((r) => {
      const m = r.html.match(/<div[^>]*class="el-preheader"[^>]*>([^<]*)/);
      expect(m, `${r.name}: no preheader`).not.toBeNull();
      const pre = m![1]!.trim();
      expect(pre.length, r.name).toBeGreaterThan(10);
      expect(r.text, r.name).not.toContain(pre.slice(0, 30));
    }),
  );

  it(
    'loads images, fonts and CSS only from earlyletters.com',
    each((r) => {
      const resources = [...attrs(r.html, 'src'), ...attrs(r.html, 'background'), ...attrs(r.html, 'srcset'), ...cssUrls(r.html)];
      const bad = resources.filter((u) => !u.startsWith(`${ASSET_ORIGIN}/`));
      expect(bad, r.name).toEqual([]);
      expect(r.html, r.name).not.toMatch(/<link[^>]+rel="stylesheet"/i);
      expect(r.html, r.name).not.toMatch(/@import|@font-face/i);
    }),
  );

  it(
    'links only to earlyletters.com, mailto, sender placeholders, or allowlisted hosts',
    each((r) => {
      const bad = attrs(r.html, 'href').filter((u) => {
        if (isPlaceholder(u) || u.startsWith('mailto:')) return false;
        if (u.startsWith(`${ASSET_ORIGIN}/`) || u === ASSET_ORIGIN) return false;
        return !(u.startsWith('https://') && LINK_HOST_ALLOWLIST.has(host(u)));
      });
      expect(bad, r.name).toEqual([]);
    }),
  );

  it(
    'has no tracking pixels or click tracking',
    each((r) => {
      const imgs = [...r.html.matchAll(/<img\b[^>]*>/gi)].map((m) => m[0]);
      for (const img of imgs) {
        expect(img, r.name).not.toMatch(/\s(width|height)="[01]"/);
        expect(img, r.name).not.toMatch(/(width|height):\s*[01]px/);
        expect(img, r.name).toMatch(/src="https:\/\/earlyletters\.com\/email\/logo-(light|dark)\.png"/);
      }
      expect(imgs.length, `${r.name}: only the light and dark logo`).toBeLessThanOrEqual(2);
      expect(r.html, r.name).not.toMatch(/[?&](utm_[a-z]+|mc_eid|_hsenc|trk|click_id)=/i);
      expect(r.html, r.name).not.toMatch(/resend\.(dev|com)\/|\/track\/|\/open\?|\/click\?/i);
    }),
  );

  it(
    'stays under Gmail limits (102KB message, 16KB per style block)',
    each((r) => {
      expect(Buffer.byteLength(r.html, 'utf8'), r.name).toBeLessThan(GMAIL_CLIP_BYTES);
      for (const s of r.html.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/gi)) {
        expect(Buffer.byteLength(s[1]!, 'utf8'), r.name).toBeLessThan(GMAIL_STYLE_BYTES);
      }
    }),
  );

  it(
    'is mobile ready and accessible at the document level',
    each((r) => {
      expect(r.html, r.name).toMatch(/<html[^>]*\slang="en"/);
      expect(r.html, r.name).toContain('name="viewport"');
      expect(r.html, r.name).toMatch(/<table[^>]*role="presentation"/);
      for (const img of r.html.matchAll(/<img\b[^>]*>/gi)) expect(img[0], r.name).toMatch(/\salt="[^"]+"/);
    }),
  );

  it(
    'ships bare Outlook conditionals (no marker spans left)',
    each((r) => {
      expect(r.html, r.name).not.toContain('data-mso');
      expect(r.html, r.name).toContain('<!--[if mso]><table role="presentation" align="center" width="600"');
    }),
  );

  it(
    'has a readable plain-text part',
    each((r) => {
      expect(r.text.trim().length, r.name).toBeGreaterThan(50);
      expect(r.text, r.name).not.toMatch(/<[a-z][^>]*>/i);
    }),
  );
});
