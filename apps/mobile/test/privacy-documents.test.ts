/// <reference types="node" />
/**
 * Settings, Privacy links only to documents the website serves (P6b critics' pass M1, 28 Oct). #169 took
 * /health-privacy, /subprocessors and /delete-account off the site, and their content moved into /privacy. The list
 * below mirrors `REMOVED_ROUTES` in apps/web/e2e/support/legal.ts on `main`, where the website's own tests check that
 * those routes answer 404. If the website brings a page back, take it off this list in the same change.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
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
    // The mirror itself is pinned, so emptying it or dropping a route cannot make this test pass by itself. It mirrors
    // REMOVED_ROUTES in apps/web/e2e/support/legal.ts on main: change both together.
    expect(WEBSITE_REMOVED_ROUTES).toEqual(['/health-privacy', '/subprocessors', '/delete-account']);
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

/** Every file under src, for the app-wide scan below. */
const allFiles = (dir: string): string[] =>
  readdirSync(dir).flatMap((name) => {
    const full = join(dir, name);
    return statSync(full).isDirectory() ? allFiles(full) : /\.(ts|tsx)$/.test(name) ? [full.slice(SRC.length + 1)] : [];
  });

describe('[BL-564] No screen opens a legal page the website removed', () => {
  const web = brand.web as Record<string, unknown>;

  it('the sign-in consent sheet links to the Terms and the Privacy Policy only', () => {
    const sheet = code('app/(auth)/sign-in/consent.tsx');
    const opened = [...sheet.matchAll(/open\(brand\.web\.(\w+)\)/g)].map((m) => m[1]);
    expect(opened).toEqual(['terms', 'privacy']);
  });

  it('no file in the app opens a removed route', () => {
    const offenders: string[] = [];
    for (const rel of allFiles(SRC)) {
      for (const m of code(rel).matchAll(/brand\.web\.(\w+)/g)) {
        const url = web[m[1]];
        if (typeof url !== 'string') continue;
        const path = new URL(url).pathname;
        if (WEBSITE_REMOVED_ROUTES.includes(path)) offenders.push(`${rel}: ${m[1]} -> ${path}`);
      }
    }
    expect(offenders).toEqual([]);
  });
});
