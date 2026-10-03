import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { brand } from '../index';
import { ASSETS, CONTEXTS, REGISTRY_VERSION, asset, assetFor, assetForPath, type BrandAsset, type ContextId } from '../registry';

const BRAND = resolve(import.meta.dirname, '..');
const ROOT = resolve(BRAND, '../..');
const all = ASSETS as readonly BrandAsset[];

/** Width and height from a PNG's IHDR chunk. */
function pngSize(file: string) {
  const b = readFileSync(file);
  expect(b.subarray(1, 4).toString('latin1'), file).toBe('PNG');
  return { width: b.readUInt32BE(16), height: b.readUInt32BE(20), colourType: b[25] };
}
function viewBox(file: string) {
  const m = readFileSync(file, 'utf8').match(/viewBox="([^"]+)"/);
  expect(m, `${file} has a viewBox`).toBeTruthy();
  const [, , width, height] = m![1].trim().split(/[\s,]+/).map(Number);
  return { width, height };
}

describe('brand registry: assets', () => {
  it('every id is unique and dot-notation', () => {
    const ids = all.map((a) => a.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) expect(id, id).toMatch(/^[a-z0-9]+(?:[.@-][a-zA-Z0-9]+)*$/);
  });

  it('every path exists', () => {
    const missing = all.filter((a) => a.path && !existsSync(join(ROOT, a.path))).map((a) => `${a.id}: ${a.path}`);
    expect(missing).toEqual([]);
  });

  it('every asset is either a file, a colour or an npm font', () => {
    for (const a of all) {
      if (a.kind === 'color') expect(a.value, a.id).toMatch(/^#[0-9A-F]{6}$/);
      else if (a.format === 'npm') expect(a.package, a.id).toBeTruthy();
      else expect(a.path, a.id).toBeTruthy();
    }
  });

  it('npm fonts resolve from @scribe/brand', () => {
    const req = createRequire(join(BRAND, 'index.ts'));
    for (const a of all.filter((x) => x.format === 'npm')) expect(() => req.resolve(`${a.package}/package.json`), a.id).not.toThrow();
  });

  it('recorded dimensions match the files', () => {
    for (const a of all) {
      if (!a.path || !a.dimensions || a.status !== 'primary') continue;
      const file = join(ROOT, a.path);
      const got = a.format === 'png' ? pngSize(file) : viewBox(file);
      expect({ id: a.id, width: got.width, height: got.height }).toEqual({ id: a.id, width: a.dimensions.width, height: a.dimensions.height });
    }
  });

  it('opaque assets have no alpha channel (App Store and Apple Branded Mail need opaque RGB)', () => {
    for (const id of ['icon.app.default', 'icon.app.dark', 'icon.app.tinted', 'email.avatar', 'og.image', 'video.endcard.landscape', 'video.endcard.portrait', 'social.post.template'] as const) {
      expect(pngSize(join(ROOT, asset(id).path!)).colourType, id).toBe(2);
    }
  });

  it('every primary asset carries a version and an ISO date; deprecated ones point at their replacement', () => {
    for (const a of all) {
      expect(a.version, a.id).toMatch(/^\d+\.\d+\.\d+$/);
      expect(a.date, a.id).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      if (a.status === 'deprecated') {
        expect(a.supersededBy, a.id).toBeTruthy();
        expect(asset(a.supersededBy as never).status, a.id).toBe('primary');
      }
    }
  });

  it('served urls are unique, primary, and point at a file', () => {
    const served = all.filter((a) => a.url);
    expect(new Set(served.map((a) => a.url)).size).toBe(served.length);
    for (const a of served) {
      expect(a.status, a.id).toBe('primary');
      expect(a.url, a.id).toMatch(/^\/(favicon|email|og|fonts)\/[\w.@-]+$/);
      expect(statSync(join(ROOT, a.path!)).isFile(), a.id).toBe(true);
    }
  });

  it('colour values equal packages/brand/index.ts and the mark build config', () => {
    const colors = brand.colors as Record<string, string>;
    for (const a of all.filter((x) => x.kind === 'color')) {
      const key = a.id.replace(/^color\./, '');
      if (key.startsWith('icon.')) expect(a.value, a.id).toBe((brand.icon as Record<string, string>)[key.slice(5)]);
      else expect(a.value, a.id).toBe(colors[key]);
    }
    const cfg = readFileSync(join(BRAND, 'assets/logo/primary/source/config.mjs'), 'utf8');
    for (const [k, v] of Object.entries(cfg.match(/export const C = \{([^}]+)\}/)![1].matchAll(/(\w+): '(#[0-9A-F]{6})'/g)).map((m) => [m[1], m[2]])) {
      expect(v, `config.mjs C.${k}`).toBe(colors[k]);
    }
  });

  it('registry.json is generated from registry.ts and up to date', () => {
    const json = JSON.parse(readFileSync(join(BRAND, 'registry.json'), 'utf8'));
    expect(json.version).toBe(REGISTRY_VERSION);
    expect(json.assets).toEqual(JSON.parse(JSON.stringify(ASSETS)));
    expect(json.contexts).toEqual(JSON.parse(JSON.stringify(CONTEXTS)));
  });
});

describe('brand registry: contexts', () => {
  const required: ContextId[] = [
    'app.icon', 'app.splash', 'app.header', 'app.paywall', 'app.settings.about',
    'web.header', 'web.footer', 'web.og-image', 'web.favicon', 'web.apple-touch',
    'email.header.light', 'email.header.dark', 'email.avatar', 'email.footer',
    'appstore.icon', 'appstore.screenshot-badge', 'book.cover.emboss', 'book.spine',
    'gift.card', 'invite.card', 'social.avatar', 'press.kit',
    'app.notification', 'appstore.screenshot-frame', 'play.feature-graphic', 'video.end-card', 'social.post-template',
    'export.pdf', 'book.page', 'email.type',
  ];

  it('covers every required touchpoint', () => {
    for (const c of required) expect(Object.keys(CONTEXTS), c).toContain(c);
  });

  it('every context resolves to existing assets', () => {
    for (const c of Object.keys(CONTEXTS) as ContextId[]) {
      const got = assetFor(c);
      expect(got.length, c).toBeGreaterThan(0);
      expect(got.map((a) => a.id)).toEqual([...CONTEXTS[c].assets]);
    }
  });

  it('no context references a deprecated asset', () => {
    const bad = (Object.keys(CONTEXTS) as ContextId[]).flatMap((c) => assetFor(c).filter((a) => a.status !== 'primary').map((a) => `${c} -> ${a.id}`));
    expect(bad).toEqual([]);
  });

  it('planned contexts say when they are needed; live contexts point at real artwork', () => {
    for (const [id, c] of Object.entries(CONTEXTS) as [ContextId, (typeof CONTEXTS)[ContextId]][]) {
      if ('status' in c && c.status === 'planned') expect((c as { release?: string }).release, id).toMatch(/^v1\.[01]$/);
      else expect(assetFor(id).some((a) => a.kind !== 'color'), `${id} has no artwork`).toBe(true);
    }
  });

  it('app.notification carries hand-tuned small sizes (small cut at 40 px and below) and the monochrome glyph', () => {
    const got = assetFor('app.notification');
    for (const px of [40, 58, 60, 80, 87, 120]) expect(got.map((a) => a.id), String(px)).toContain(`icon.app.${px}`);
    const glyph = got.filter((a) => a.id.startsWith('icon.notification.') && a.format === 'png');
    expect(glyph.length).toBeGreaterThan(0);
    for (const a of glyph) expect(pngSize(join(ROOT, a.path!)).colourType, a.id).toBe(6); // RGBA: white on transparent
  });

  it('email.type fonts are self-hosted woff2 under /fonts/ with their OFL licence alongside', () => {
    for (const a of assetFor('email.type')) {
      expect(a.format, a.id).toBe('woff2');
      expect(a.url, a.id).toMatch(/^\/fonts\/[\w-]+\.woff2$/);
      expect(readFileSync(join(ROOT, a.path!)).subarray(0, 4).toString('latin1'), a.id).toBe('wOF2');
      expect(existsSync(join(ROOT, a.path!, '..', 'OFL.txt')), a.id).toBe(true);
    }
  });

  it('app.icon has default, dark and tinted 1024 masters', () => {
    expect(assetFor('app.icon').map((a) => [a.surface, a.dimensions?.width])).toEqual([['any', 1024], ['dark', 1024], ['tinted', 1024]]);
  });

  it('throws on unknown ids and contexts', () => {
    expect(() => asset('logo.nope' as never)).toThrow(/unknown asset id/);
    expect(() => assetFor('nope' as never)).toThrow(/unknown context/);
  });
});

describe('brand registry: every shipped file is registered', () => {
  // BRD-15: a brand file nobody can look up is a file somebody will pick by name.
  const shipped = ['assets/email', 'assets/favicon', 'assets/og', 'assets/notification', 'assets/video', 'assets/social', 'assets/logo/primary', 'assets/logo/primary/png'];
  it.each(shipped)('%s', (dir) => {
    const files = readdirSync(join(BRAND, dir)).filter((f) => statSync(join(BRAND, dir, f)).isFile() && !f.startsWith('.'));
    const missing = files.map((f) => `packages/brand/${dir}/${f}`).filter((p) => !assetForPath(p));
    expect(missing).toEqual([]);
  });
});

describe('brand registry: deprecated files', () => {
  it('rounds 1 to 3 and the B3 interim email lockup are deprecated, primary is primary', () => {
    expect(assetForPath('packages/brand/assets/logo/a/lockup-horizontal.svg')?.status).toBe('deprecated');
    expect(assetForPath('packages/brand/assets/logo/r2/icon-craft/bench.mjs')?.status).toBe('deprecated');
    expect(assetForPath('packages/brand/assets/logo/r3/final/final-a/symbol.svg')?.status).toBe('deprecated');
    expect(assetForPath('packages/brand/assets/email/source/wordmark-interim.svg')?.status).toBe('deprecated');
    expect(assetForPath('packages/brand/assets/email/avatar-interim.tiny-ps.svg')?.status).toBe('deprecated');
    expect(assetForPath('packages/brand/assets/logo/primary/symbol.svg')?.id).toBe('logo.symbol.ink');
  });

  it('no app, site or email code points at a deprecated logo folder', () => {
    const roots = ['apps/web/src', 'apps/web/scripts', 'packages/emails/src', 'packages/emails/scripts', 'apps/mobile/app.config.ts'];
    const files: string[] = [];
    const walk = (p: string) => {
      const abs = join(ROOT, p);
      if (!existsSync(abs)) return;
      if (statSync(abs).isFile()) return void files.push(p);
      for (const e of readdirSync(abs)) if (e !== 'node_modules') walk(join(p, e));
    };
    roots.forEach(walk);
    const hits = files.filter((f) => /assets\/logo\/(a|b|r2|r3)\/|assets\/email\/(a|b)\//.test(readFileSync(join(ROOT, f), 'utf8')));
    expect(hits).toEqual([]);
  });
});
