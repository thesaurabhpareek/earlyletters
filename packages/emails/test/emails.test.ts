/**
 * Every email the package renders: src/templates (lane D2) plus the pipeline
 * fixture. If a check fails for a template, fix the template or its copy,
 * not the check.
 */
import { readFileSync } from 'node:fs';
import { mkdtemp, readFile, rm, stat } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createElement } from 'react';
import { FIXTURES_DIR, TEMPLATES_DIR, buildAll, type Rendered } from '../scripts/lib';
import { buildSupabaseExport } from '../scripts/export-supabase';
import { renderEmail } from '../src/components/render';
import { logoAttachments, renderForResend, toResendApi } from '../src/send';
import { previewValues, templates, templatesById } from '../src/templates';
import { ASSET_ORIGIN } from '../src/tokens';

/** Gmail clips messages over about 102KB (industry-documented; see README). */
const GMAIL_CLIP_BYTES = 102 * 1024;
/** Gmail ignores a <style> block over 16KB (caniemail.com, html-style). */
const GMAIL_STYLE_BYTES = 16 * 1024;
/**
 * Link destinations on other hosts that are allowed, and why. Resources (images, fonts, CSS) are never loaded
 * from any server: the only image is the logo, attached inline (cid:).
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

/** Minimal XML well-formedness check for a markup fragment: tags balance and nest, attributes are quoted. */
function wellFormed(xml: string): boolean {
  const stack: string[] = [];
  for (const m of xml.matchAll(/<(\/?)([A-Za-z][\w:.-]*)((?:\s+[\w:.-]+="[^"<]*")*)\s*(\/?)>|<[^>]*>/g)) {
    if (!m[2]) return false; // a tag the strict pattern could not read
    if (m[1]) {
      if (stack.pop() !== m[2]) return false;
    } else if (!m[4]) stack.push(m[2]);
  }
  return stack.length === 0;
}

describe('components', () => {
  it('KeyFacts reads as "Label: value" in plain text and as label/value rows in HTML', () => {
    const r = all.find((x) => x.name === 'pipeline-sample')!;
    expect(r.text).toContain('Works for: {expiresIn}\nSent to: {email}');
    expect(r.html).toMatch(/<table[^>]*class="el-facts"/);
  });

  it('Letter puts the action before the sign-off by default', () => {
    const r = all.find((x) => x.name === 'letter-sample')!;
    expect(r.html.indexOf('el-btn-text')).toBeGreaterThan(0);
    expect(r.html.indexOf('el-btn-text')).toBeLessThan(r.html.indexOf('Warmly,'));
  });

  it('plain text prints the action URL once (the fallback block is skipped) and keeps the safety note', () => {
    const r = all.find((x) => x.name === 'pipeline-sample')!;
    const url = 'https://earlyletters.com/auth/callback?token_hash=fixture-not-a-real-token&type=email';
    expect(r.text.split(url).length - 1).toBe(1);
    expect(r.text).not.toContain('Button not working?');
    expect(r.text).toContain('Did not ask for this?');
  });

  it('fallback URLs break at path boundaries, never mid-word', () => {
    const r = all.find((x) => x.name === 'pipeline-sample')!;
    expect(r.html).toContain('https:/<wbr/>/<wbr/>earlyletters.com/<wbr/>auth/');
    expect(r.html).not.toContain('break-all');
  });
});

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

  // Develop's rule, kept: nothing in an email loads from a server. The logo rides along as an inline attachment
  // (cid:), there are no web fonts, no CSS url(), no stylesheets, scripts or frames (docs/emails/README.md).
  it(
    'loads nothing from a server: images only by Content-ID, no CSS urls, stylesheets, scripts or frames',
    each((r) => {
      const resources = [...attrs(r.html, 'src'), ...attrs(r.html, 'background'), ...attrs(r.html, 'srcset'), ...cssUrls(r.html)];
      const bad = resources.filter((u) => !/^cid:el-logo-(light|dark)$/.test(u));
      expect(bad, r.name).toEqual([]);
      expect(cssUrls(r.html), r.name).toEqual([]);
      expect(r.html, r.name).not.toMatch(/<link\s|@import|<script|<iframe|<object|<embed/i);
      expect(r.html, r.name).not.toContain(`${ASSET_ORIGIN}/email/`);
    }),
  );

  it(
    'uses no web fonts (a font loaded from our server would work like a pixel)',
    each((r) => {
      expect(r.html, r.name).not.toMatch(/@font-face/i);
      expect(r.html, r.name).not.toContain(`${ASSET_ORIGIN}/fonts/`);
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
        expect(img, r.name).toMatch(/src="cid:el-logo-(light|dark)"/);
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
    'balances its Outlook conditional comments',
    each((r) => {
      const opens = (r.html.match(/<!--\[if /g) ?? []).length;
      const closes = (r.html.match(/<!\[endif\]-->/g) ?? []).length;
      expect(closes, r.name).toBe(opens);
    }),
  );

  it(
    'gives classic Outlook a well-formed VML pill for every button, and hides the HTML button from it',
    each((r) => {
      const htmlButtons = [...r.html.matchAll(/<a[^>]*class="el-btn el-btn-text"[^>]*href="([^"]*)"|<a[^>]*href="([^"]*)"[^>]*class="el-btn el-btn-text"/g)].map((m) => (m[1] ?? m[2])!);
      const vml = [...r.html.matchAll(/<!--\[if mso\]>(<v:roundrect[\s\S]*?)<!\[endif\]-->/g)].map((m) => m[1]!);
      expect(vml.length, r.name).toBe(htmlButtons.length);
      if (htmlButtons.length === 0) return;
      expect(r.html, r.name).toMatch(/<html[^>]*xmlns:v="urn:schemas-microsoft-com:vml"/);
      vml.forEach((v, i) => {
        expect(wellFormed(v), `${r.name}: ${v}`).toBe(true);
        expect(v, r.name).toMatch(/arcsize="50%"/);
        expect(v, r.name).toMatch(/style="height:48px;v-text-anchor:middle;width:\d+px;"/);
        expect(v, r.name).toContain(`href="${htmlButtons[i]}"`);
        const label = v.match(/<center[^>]*>([^<]+)<\/center>/)![1]!;
        expect(r.html, r.name).toContain(`>${label}</`);
      });
      // Every HTML button sits inside <!--[if !mso]><!--> ... <!--<![endif]-->.
      for (const m of r.html.matchAll(/class="el-btn el-btn-text"/g)) {
        const before = r.html.slice(0, m.index);
        expect(before.lastIndexOf('<!--[if !mso]><!-->'), r.name).toBeGreaterThan(before.lastIndexOf('<!--<![endif]-->'));
      }
    }),
  );

  it(
    'keeps the light logo on a paper plate Gmail does not invert, removed by every dark rule',
    each((r) => {
      const plate = r.html.match(/<table[^>]*class="el-logo-plate"[^>]*>[\s\S]*?<\/table>/);
      expect(plate, r.name).not.toBeNull();
      expect(plate![0], r.name).toMatch(/background-image:linear-gradient\(#FBF8F3,\s*#FBF8F3\)/);
      expect(plate![0], r.name).toContain('el-logo-light');
      expect(r.html, r.name).toMatch(/\.el-logo-plate\{background-image:none !important;background-color:transparent !important;\}[\s\S]*@media|@media \(prefers-color-scheme: dark\)\{[\s\S]*\.el-logo-plate\{background-image:none/);
      expect(r.html, r.name).toContain('[data-ogsb] .el-logo-plate{background-image:none !important');
      // The dark logo never reaches classic Outlook.
      expect(r.html, r.name).toMatch(/<!--\[if !mso\]><!--><div class="el-logo-dark"/);
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

describe('templates', () => {
  it('ports every email develop had: sign-in, welcome, co-parent invite, deletion receipts, export', () => {
    for (const id of ['sign-in-link', 'welcome', 'coparent-invite', 'account-deletion-scheduled', 'account-deletion-cancelled', 'account-deleted', 'export-ready']) {
      expect(templatesById[id], id).toBeDefined();
    }
  });

  it('fills every placeholder from the preview values and carries the action link in both parts', () => {
    const names = new Set(templates.map((t) => t.id));
    const mine = all.filter((r) => names.has(r.name));
    expect(mine.length).toBe(templates.length);
    for (const r of mine) {
      expect(r.html, r.name).not.toMatch(/\{[a-zA-Z][a-zA-Z0-9]*\}/);
      expect(r.text, r.name).not.toMatch(/\{[a-zA-Z][a-zA-Z0-9]*\}/);
      const urlVar = templatesById[r.name]!.copy.cta?.urlVar.replace(/[{}]/g, '');
      const url = urlVar ? previewValues[urlVar] : undefined;
      if (url) {
        expect(r.html, r.name).toContain(url.replaceAll('&', '&amp;'));
        expect(r.text, r.name).toContain(url);
      }
    }
  });

  it('tells an invitee why they got the email (no account of their own yet)', () => {
    const r = all.find((x) => x.name === 'coparent-invite')!;
    expect(r.text).toContain('because Mumma entered your address');
    expect(r.text).not.toContain('it is about your');
  });
});

describe('sending through Resend', () => {
  const el = () => createElement(templatesById['welcome']!.Component, { values: previewValues });

  it('returns the inline logo attachments the HTML points at, as PNGs', async () => {
    const mail = await renderForResend(el());
    const cids = [...mail.html.matchAll(/src="cid:([^"]+)"/g)].map((m) => m[1]!);
    expect(new Set(cids)).toEqual(new Set(mail.attachments.map((a) => a.contentId)));
    for (const a of mail.attachments) {
      expect(a.contentId.length).toBeLessThan(128);
      expect(a.contentType).toBe('image/png');
      expect(a.filename).toMatch(/\.png$/);
      expect(Buffer.from(a.content, 'base64').subarray(0, 8)).toEqual(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
    }
    expect(mail.text.length).toBeGreaterThan(100);
    expect(toResendApi(mail.attachments[0]!)).toEqual({
      filename: mail.attachments[0]!.filename,
      content: mail.attachments[0]!.content,
      content_type: 'image/png',
      content_id: mail.attachments[0]!.contentId,
    });
    expect(logoAttachments()).toHaveLength(2);
  });

  it('sends no image at all in text mode', async () => {
    const mail = await renderForResend(el(), { logo: 'text' });
    expect(mail.html).not.toMatch(/<img/i);
    expect(mail.attachments).toEqual([]);
  });

  it('loads the logo from earlyletters.com only when the remote fallback is asked for (off by default)', async () => {
    const off = await renderEmail(el());
    expect(off).not.toContain(`${ASSET_ORIGIN}/email/`);
    const on = await renderEmail(el(), { assets: { logo: 'remote' } });
    const srcs = attrs(on, 'src');
    expect(srcs.length).toBeGreaterThan(0);
    for (const u of srcs) expect(u).toMatch(new RegExp(`^${ASSET_ORIGIN.replace(/\./g, '\\.')}/email/logo-(light|dark)\\.png$`));
    expect(on).not.toMatch(/@font-face/);
  });
});

describe('Supabase Auth templates (supabase/templates)', () => {
  it('match the committed files (run: cd packages/emails && npx tsx scripts/export-supabase.ts)', async () => {
    const files = await buildSupabaseExport();
    expect(files.size).toBeGreaterThan(0);
    for (const [file, content] of files) expect(readFileSync(file, 'utf8'), file).toBe(content);
  });

  it('load nothing from a server: text wordmark, no images, no fonts', async () => {
    const files = await buildSupabaseExport();
    for (const [file, content] of files) {
      if (!file.endsWith('.html')) continue;
      expect(content, file).not.toMatch(/<img|cid:|@font-face|url\(|<link\s|@import/i);
      expect(content, file).toContain('{{ .');
    }
  });
});
