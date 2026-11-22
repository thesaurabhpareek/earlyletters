/**
 * [BL-414] App code only contacts allowlisted hosts (D-065, LEGAL-REQ-017).
 *
 * Every hostname written as a literal URL in app source (src, app.config.ts,
 * native modules) must be on the list below. Adding a host here is a privacy
 * decision: it must also be in the privacy policy processor list and the data
 * inventory (docs/legal/DATA_CLASSIFICATION.md 4.8), so the change goes to
 * `privacy` and `legal` first. Device network capture stays with BL-239.
 * Hosts built at run time (the Supabase project URL, the brand origin) come
 * from env or packages/brand and are not literals; they are covered by
 * their own tests.
 */
/// <reference types="node" />
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { describe, expect, it } from 'vitest';

const ROOT = join(__dirname, '..');

/** Hosts the app may contact, each with the reason. */
export const CONTACTED_HOSTS: Record<string, string> = {
  'earlyletters.com': 'our own site: sign-in and invite links, support pages',
  'packs.earlyletters.app': 'our model and pack host (D-097)',
  'huggingface.co': 'pinned upstream speech models until mirrored (D-065)',
  'us.i.posthog.com': 'analytics, loaded only after opt-in consent (BRIEF decision 12)',
  'apps.apple.com': 'Apple: subscription management and review links',
  'reportaproblem.apple.com': 'Apple: report a purchase problem',
  'support.apple.com': 'Apple: help article links',
};

/** URL-shaped text that is never requested: XML or schema namespace identifiers and placeholders. */
export const NEVER_CONTACTED: Record<string, string> = {
  'json-schema.org': 'JSON Schema $schema identifier in the export format',
  'ns.adobe.com': 'XMP marker looked for when stripping photo metadata',
  host: 'placeholder in a URL parser comment',
};

const URL_HOST = /\b(?:https?|wss?|ftp):\/\/(?!\$\{)([A-Za-z0-9][A-Za-z0-9.-]*)/g;
const SOURCE_EXT = /\.(ts|tsx|js|mjs|swift|kt|java|m|mm)$/;
const SKIP_DIR = /(^|\/)(node_modules|__tests__|generated|Pods|build)(\/|$)/;
const SKIP_FILE = /\.(test|spec)\.(ts|tsx)$/;

export function hostsIn(text: string): string[] {
  return [...text.matchAll(URL_HOST)].map((m) => m[1].toLowerCase().replace(/\.$/, ''));
}

export function violations(text: string, allowed: Iterable<string>): string[] {
  const ok = new Set(allowed);
  return hostsIn(text).filter((h) => !ok.has(h));
}

function walk(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    const rel = relative(ROOT, p);
    if (SKIP_DIR.test(rel)) continue;
    if (statSync(p).isDirectory()) walk(p, out);
    else if (SOURCE_EXT.test(name) && !SKIP_FILE.test(name)) out.push(p);
  }
  return out;
}

const appFiles = [...walk(join(ROOT, 'src')), join(ROOT, 'app.config.ts'), ...walk(join(ROOT, 'modules'))];
const ALL = [...Object.keys(CONTACTED_HOSTS), ...Object.keys(NEVER_CONTACTED)];

describe('[BL-414] app source only names allowlisted hosts', () => {
  it('finds the source files (the scan is not empty)', () => {
    expect(appFiles.length).toBeGreaterThan(100);
  });

  it('every literal host in app source is on the allowlist', () => {
    const bad: string[] = [];
    for (const f of appFiles) for (const h of violations(readFileSync(f, 'utf8'), ALL)) bad.push(`${relative(ROOT, f)}: ${h}`);
    expect(bad, 'host not on the allowlist: ask privacy and legal before adding it').toEqual([]);
  });

  it('no allowlist entry is stale (each one is still used)', () => {
    const seen = new Set<string>();
    for (const f of appFiles) for (const h of hostsIn(readFileSync(f, 'utf8'))) seen.add(h);
    expect(ALL.filter((h) => !seen.has(h))).toEqual([]);
  });

  it('the analytics host appears only inside src/lib/analytics (consent gate lives there)', () => {
    const where = appFiles.filter((f) => hostsIn(readFileSync(f, 'utf8')).includes('us.i.posthog.com')).map((f) => relative(ROOT, f));
    expect(where).toEqual(['src/lib/analytics/index.ts']);
  });

  it('no cleartext http:// host is contacted (only namespace identifiers)', () => {
    const clear: string[] = [];
    for (const f of appFiles) {
      for (const m of readFileSync(f, 'utf8').matchAll(/\bhttp:\/\/([A-Za-z0-9.-]+)/g)) {
        if (!(m[1] in NEVER_CONTACTED)) clear.push(`${relative(ROOT, f)}: ${m[1]}`);
      }
    }
    expect(clear).toEqual([]);
  });

  it('a host that is not on the list fails the check (mutant guard)', () => {
    expect(violations(`fetch('https://tracker.example.net/x')`, ALL)).toEqual(['tracker.example.net']);
    expect(violations(`fetch("wss://sock.example.net")`, ALL)).toEqual(['sock.example.net']);
    expect(violations(`const u = 'https://packs.earlyletters.app.evil.example/a'`, ALL)).toEqual(['packs.earlyletters.app.evil.example']);
    expect(violations(`'https://earlyletters.com/x' 'https://apps.apple.com/y'`, ALL)).toEqual([]);
  });
});
