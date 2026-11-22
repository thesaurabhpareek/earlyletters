/**
 * [BL-414] App code only contacts allowlisted hosts (D-065, LEGAL-REQ-017).
 * [BL-1477] Hardened: URLs are parsed with `new URL` and the parsed hostname
 * is compared (never a prefix or a split on `@`).
 *
 * Every hostname written as a URL in app source must be on the list below.
 * Adding a host here is a privacy decision: it must also be in the privacy
 * policy processor list and the data inventory
 * (docs/legal/DATA_CLASSIFICATION.md 4.8), so the change goes to `privacy`
 * and `legal` first. Device network capture stays with BL-239.
 *
 * What is read (and why the rest is not):
 * - src (ts, tsx, js, mjs), app.config.ts, modules and shims (all text types:
 *   Swift, Kotlin, Java, podspec, gradle, plist, xml, json), because this is
 *   what ships in the app.
 * - Not read: `*.test.*` files and `__tests__` (never shipped), `generated`
 *   (licence texts of third parties, not requests), node_modules, Pods, build.
 * - Not read: scripts, e2e, e2e-web, web-preview, storekit and
 *   store.config.json (build-time, test or store metadata; none runs on the
 *   phone). A host used only there is not a phone request.
 * Hosts built at run time (the Supabase project URL, the brand origin) come
 * from env or packages/brand and are covered by their own tests. A URL built
 * from pieces in app code must be listed in BUILT_URL_FILES below.
 */
/// <reference types="node" />
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { describe, expect, it } from 'vitest';

const ROOT = join(__dirname, '..');

/** Hosts the app may contact, each with the reason. */
export const CONTACTED_HOSTS: Record<string, string> = {
  // BL-1477 entry 11: the literal appears only in comments. The real request
  // host is the brand origin built at run time from packages/brand (domain).
  // The entry stays because that origin is contacted; the test "brand origin"
  // below proves the host is the one packages/brand builds.
  'earlyletters.com': 'our own site (sign-in and invite links, support pages); built at run time from packages/brand, named in app source only in comments',
  'packs.earlyletters.app': 'our model and pack host (D-097)',
  'huggingface.co': 'pinned upstream speech models until mirrored (D-065)',
  'us.i.posthog.com': 'analytics, loaded only after opt-in consent (BRIEF decision 12)',
  'apps.apple.com': 'Apple: subscription management and review links',
  'reportaproblem.apple.com': 'Apple: report a purchase problem',
  'support.apple.com': 'Apple: help article links',
};

/** URL-shaped text that is never requested: namespace identifiers, metadata and placeholders. */
export const NEVER_CONTACTED: Record<string, string> = {
  'json-schema.org': 'JSON Schema $schema identifier in the export format',
  'ns.adobe.com': 'XMP marker looked for when stripping photo metadata',
  'example.com': 'podspec homepage metadata in the native modules',
  host: 'placeholder in a URL parser comment',
};

/**
 * Hosts that library code calls with nobody writing them in app source,
 * with the package that owns each. Listed so a reviewer sees them; they are
 * not literals, so the scan never matches them. Confirmed by capture in BL-239.
 */
export const SDK_DEFAULT_HOSTS: Record<string, { pkg: string; why: string }> = {
  'appleid.apple.com': { pkg: 'expo-apple-authentication', why: 'Apple sign-in, called by the system sheet' },
  'accounts.google.com': { pkg: '@react-native-google-signin/google-signin', why: 'Google sign-in' },
  'oauth2.googleapis.com': { pkg: '@react-native-google-signin/google-signin', why: 'Google token exchange' },
  '<supabase project host>': { pkg: '@supabase/supabase-js', why: 'our backend; the URL comes from env at run time' },
};

/** Files that may build a URL from pieces (the host is not a literal there), each with the reason. */
export const BUILT_URL_FILES: Record<string, string> = {
  'src/lib/backup/tus.ts': 'rebuilds an https origin from the configured backup server URL it just parsed',
};

const SOURCE_EXT = /\.(ts|tsx|js|mjs|swift|kt|java|m|mm|podspec|gradle|plist|xml|json)$/;
const SKIP_DIR = /(^|\/)(node_modules|__tests__|generated|Pods|build)(\/|$)/;
const SKIP_FILE = /\.(test|spec)\.(ts|tsx)$/;
const BUILT = '<built-url>';

export type Found = { scheme: string; host: string };

/** Every URL in the text, parsed with `new URL`; a URL that cannot be parsed or has no literal host is returned as a marker host. */
export function urlsIn(raw: string): Found[] {
  const text = raw.replace(/\\\//g, '/'); // https:\/\/host (escaped slashes)
  const out: Found[] = [];
  const add = (scheme: string, rest: string, whole: string, next = '') => {
    if (rest === '' && /[<{]/.test(next)) return; // placeholder such as https://<brand host>
    if (rest === '' || rest.startsWith('${')) return out.push({ scheme, host: BUILT }); // built by concatenation or template
    if (/^[/([$]/.test(rest) && !rest.startsWith('[:') && !/^\[[0-9a-f:.]+\]/i.test(rest)) return; // regex source, not a URL
    try {
      out.push({ scheme, host: new URL(whole.replace(/[.,;:!?*]+$/, '')).hostname.replace(/\.$/, '') });
    } catch {
      out.push({ scheme, host: `<unparseable:${whole}>` });
    }
  };
  for (const m of text.matchAll(/\b(https?|wss?|ftp):\/\/([^\s'"`<>)\\]*)(.?)/gi)) {
    add(m[1].toLowerCase(), m[2], m[0].slice(0, m[0].length - m[3].length), m[3]);
  }
  for (const m of text.matchAll(/(['"`])\/\/([^\s'"`\\]*)/g)) {
    if (m[2] === '') continue; // a bare '//' string (for example startsWith('//')) names no host
    add('https', m[2], `https://${m[2]}`); // protocol-relative: the page scheme, so treat as https
  }
  return out;
}

export function hostsIn(text: string): string[] {
  return urlsIn(text).map((u) => u.host);
}

export function violations(text: string, allowed: Iterable<string>): string[] {
  const ok = new Set(allowed);
  return hostsIn(text).filter((h) => !ok.has(h));
}

/** Cleartext (not https or wss) URLs whose host is not a known namespace or placeholder. */
export function cleartext(text: string, never: Record<string, string>): string[] {
  return urlsIn(text)
    .filter((u) => u.scheme === 'http' || u.scheme === 'ws' || u.scheme === 'ftp')
    .map((u) => u.host)
    .filter((h) => !Object.hasOwn(never, h));
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

const appFiles = [
  ...walk(join(ROOT, 'src')),
  join(ROOT, 'app.config.ts'),
  ...walk(join(ROOT, 'modules')),
  ...walk(join(ROOT, 'shims')),
];
const ALL = [...Object.keys(CONTACTED_HOSTS), ...Object.keys(NEVER_CONTACTED)];
const rel = (f: string) => relative(ROOT, f).split('\\').join('/');

describe('[BL-414] app source only names allowlisted hosts', () => {
  it('finds the source files (the scan is not empty) and reads native files', () => {
    expect(appFiles.length).toBeGreaterThan(100);
    expect(appFiles.some((f) => f.endsWith('.swift'))).toBe(true);
    expect(appFiles.some((f) => f.endsWith('.kt'))).toBe(true);
    expect(appFiles.some((f) => f.endsWith('.podspec'))).toBe(true);
  });

  it('every host in app source is on the allowlist', () => {
    const bad: string[] = [];
    for (const f of appFiles) {
      for (const h of violations(readFileSync(f, 'utf8'), ALL)) {
        if (h === BUILT && Object.hasOwn(BUILT_URL_FILES, rel(f))) continue;
        bad.push(`${rel(f)}: ${h}`);
      }
    }
    expect(bad, 'host not on the allowlist: ask privacy and legal before adding it').toEqual([]);
  });

  it('no allowlist entry is stale (each one is still used)', () => {
    const seen = new Set<string>();
    for (const f of appFiles) for (const h of hostsIn(readFileSync(f, 'utf8'))) seen.add(h);
    expect(ALL.filter((h) => !seen.has(h))).toEqual([]);
  });

  it('no BUILT_URL_FILES entry is stale (the file still builds a URL)', () => {
    for (const f of Object.keys(BUILT_URL_FILES)) {
      expect(hostsIn(readFileSync(join(ROOT, f), 'utf8')), f).toContain(BUILT);
    }
  });

  it('the analytics host appears only inside src/lib/analytics (consent gate lives there)', () => {
    const where = appFiles.filter((f) => hostsIn(readFileSync(f, 'utf8')).includes('us.i.posthog.com')).map(rel);
    expect(where).toEqual(['src/lib/analytics/index.ts']);
  });

  it('no cleartext http:// host is contacted (only namespace identifiers)', () => {
    const clear: string[] = [];
    for (const f of appFiles) for (const h of cleartext(readFileSync(f, 'utf8'), NEVER_CONTACTED)) clear.push(`${rel(f)}: ${h}`);
    expect(clear).toEqual([]);
  });

  it('[BL-1477 entry 11] brand origin: earlyletters.com is the domain packages/brand builds the origin from', () => {
    const brand = readFileSync(join(ROOT, '..', '..', 'packages', 'brand', 'index.ts'), 'utf8');
    expect(brand).toMatch(/const domain = 'earlyletters\.com'/);
    expect(brand).toMatch(/const origin = `https:\/\/\$\{domain\}`/);
    // and no app source names it as a code literal other than in comments
    const codeLines = appFiles.flatMap((f) =>
      readFileSync(f, 'utf8').split('\n').filter((l) => hostsIn(l).includes('earlyletters.com') && !/^\s*(\*|\/\/|\/\*)/.test(l)),
    );
    expect(codeLines).toEqual([]);
  });

  it('[BL-1477 entry 10] SDK default hosts are listed with an owner that is installed, and are not also literals', () => {
    const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8')).dependencies as Record<string, string>;
    for (const [host, { pkg: owner }] of Object.entries(SDK_DEFAULT_HOSTS)) {
      expect(pkg, `${host} owner ${owner}`).toHaveProperty([owner]);
      expect(ALL, host).not.toContain(host);
    }
  });
});

describe('[BL-1477] the guard reads URLs the old pattern missed (each fixture fails the guard, plus one that passes)', () => {
  const bad = (src: string) => violations(src, ALL);

  it('[case 1] a URL built by template or concatenation is flagged', () => {
    expect(bad('fetch(`https://${host}/x`)')).toEqual([BUILT]);
    expect(bad(`fetch('https://' + host + '/x')`)).toEqual([BUILT]);
    expect(bad('`https://huggingface.co/${repo}/resolve`')).toEqual([]);
  });

  it('[case 2] userinfo: the host after @ is the host, never the text before it', () => {
    expect(bad(`'https://earlyletters.com@evil.example/x'`)).toEqual(['evil.example']);
    expect(bad(`'https://earlyletters.com:pw@evil.example'`)).toEqual(['evil.example']);
    expect(bad(`'https://evil.example\\@earlyletters.com/'`)).toEqual(['evil.example']);
    expect(bad(`'https://user@earlyletters.com/x'`)).toEqual([]);
  });

  it('[case 3] uppercase scheme and host are read', () => {
    expect(bad(`'HTTPS://TRACKER.EXAMPLE.NET/x'`)).toEqual(['tracker.example.net']);
    expect(bad(`'HTTPS://EarlyLetters.COM/x'`)).toEqual([]);
  });

  it('[case 4] protocol-relative //host is read', () => {
    expect(bad(`const u = '//cdn.example.net/a.js'`)).toEqual(['cdn.example.net']);
    expect(bad('// a comment about earlyletters')).toEqual([]);
    expect(bad(`s.startsWith('//')`)).toEqual([]);
    expect(bad(`'//earlyletters.com/x'`)).toEqual([]);
  });

  it('[case 5] an IPv6 literal is read as a host and is not allowlisted', () => {
    expect(bad(`'http://[::1]:8080/x'`)).toEqual(['[::1]']);
    expect(bad(`'https://[2001:db8::1]/x'`)).toEqual(['[2001:db8::1]']);
  });

  it('[case 6] escaped slashes are read', () => {
    expect(bad(String.raw`"https:\/\/tracker.example.net\/x"`)).toEqual(['tracker.example.net']);
    expect(bad(String.raw`"https:\/\/apps.apple.com\/x"`)).toEqual([]);
  });

  it('[case 7] the http://host placeholder form is read and is cleartext', () => {
    expect(bad('see http://host/path')).toEqual([]); // on NEVER_CONTACTED
    expect(bad('see http://other-host/path')).toEqual(['other-host']);
    expect(cleartext('http://other-host/path', NEVER_CONTACTED)).toEqual(['other-host']);
    expect(cleartext('http://host/path', NEVER_CONTACTED)).toEqual([]);
  });

  it('[case 8] a host named like an object prototype member is not "known"', () => {
    expect(cleartext('http://constructor/x', NEVER_CONTACTED)).toEqual(['constructor']);
    expect(cleartext('ws://__proto__/x', NEVER_CONTACTED)).toEqual(['__proto__']);
    expect(Object.hasOwn(NEVER_CONTACTED, 'constructor')).toBe(false);
  });

  it('[case 9] the scan reads native and metadata files (stated list, not only TypeScript)', () => {
    expect(SOURCE_EXT.test('Module.swift')).toBe(true);
    expect(SOURCE_EXT.test('Module.kt')).toBe(true);
    expect(SOURCE_EXT.test('Info.plist')).toBe(true);
    expect(SOURCE_EXT.test('Thing.podspec')).toBe(true);
    expect(bad(`s.homepage = 'https://tracker.example.net'`)).toEqual(['tracker.example.net']);
  });

  it('old allowlisted look-alikes still fail (suffix and prefix tricks)', () => {
    expect(bad(`'https://packs.earlyletters.app.evil.example/a'`)).toEqual(['packs.earlyletters.app.evil.example']);
    expect(bad(`'https://evilearlyletters.com/a'`)).toEqual(['evilearlyletters.com']);
    expect(bad(`fetch('https://tracker.example.net/x')`)).toEqual(['tracker.example.net']);
    expect(bad(`fetch("wss://sock.example.net")`)).toEqual(['sock.example.net']);
  });
});
