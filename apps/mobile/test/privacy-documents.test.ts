/// <reference types="node" />
/**
 * Settings, Privacy links only to documents the website serves (P6b critics' pass M1, 28 Oct). #169 took
 * /health-privacy, /subprocessors and /delete-account off the site, and their content moved into /privacy. The list
 * below mirrors `REMOVED_ROUTES` in apps/web/e2e/support/legal.ts on `main`, where the website's own tests check that
 * those routes answer 404. If the website brings a page back, take it off this list in the same change.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { brand } from '@scribe/brand';
import { en } from '@scribe/content';

const WEBSITE_REMOVED_ROUTES = ['/health-privacy', '/subprocessors', '/delete-account'];

const SRC = join(__dirname, '..', 'src');
const code = (rel: string) =>
  readFileSync(join(SRC, rel), 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/(^|[^:])\/\/.*$/gm, '$1');

describe('[S44] Privacy links only to pages the website serves', () => {
  const screen = code('app/settings/privacy.tsx');
  const web = brand.web as Record<string, unknown>;
  const opened = [...screen.matchAll(/open\(brand\.web\.(\w+)\)/g)].map((m) => m[1]);

  it('no document row opens a route the website removed', () => {
    expect(opened.length).toBeGreaterThan(0);
    for (const key of opened) {
      const url = web[key];
      expect(typeof url, key).toBe('string');
      const path = new URL(url as string).pathname;
      expect(WEBSITE_REMOVED_ROUTES, `${key} opens ${path}`).not.toContain(path);
    }
  });

  it('keeps the Privacy Policy and the Terms, and drops the two dead rows', () => {
    expect(opened).toEqual(['privacy', 'terms']);
    expect(screen).toMatch(/title=\{p\.privacyPolicyLink\} trailing="chevron" onPress=\{open\(brand\.web\.privacy\)\}/);
    expect(screen).toMatch(/title=\{p\.termsLink\} trailing="chevron" onPress=\{open\(brand\.web\.terms\)\}/);
    expect(screen).not.toMatch(/healthPrivacyLink|subprocessorsLink|brand\.web\.(healthPrivacy|subprocessors|deleteAccount)/);
    // The content keys stay for S14 and #163 to retire with the notice document.
    expect(en.settings.privacy.healthPrivacyLink.length).toBeGreaterThan(0);
    expect(en.settings.privacy.subprocessorsLink.length).toBeGreaterThan(0);
  });
});
