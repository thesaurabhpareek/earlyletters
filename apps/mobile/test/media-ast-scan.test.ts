/// <reference types="node" />
/**
 * [NX-39-R9] media code reads only allowlisted fields, calls no analysis or network API, and the scanner fails on
 * every banned fixture (BL-845; SEC-ML-1, SEC-ML-2).
 *
 * The scanner (support/media-scan.ts) is a TypeScript-AST check. It must pass on the real tree and fail on every
 * fixture in test/fixtures/media-scan: a scan that passes only because there is nothing to find proves nothing, so
 * each banned call has a fixture the scanner has to flag, and the clean fixtures have to come back empty so it cannot
 * pass by flagging everything. Fixtures are text files (not compiled) for the fictional family "Asha".
 *
 * Not covered, said plainly: native code inside a dependency (BL-878), and any call hidden behind data the scanner
 * cannot read (a name taken from user input). The allowlists are provisional until a package is installed.
 */
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { RULES, scanCatches, scanSource, scanTree, touchesMedia, tokensOf, nameProblem, type Rule } from './support/media-scan';
import { ALLOWED_LIBRARY_CALLS, ASSET_RECORD_FIELDS, BANNED_TOKENS, FIELD_READ_EXCEPTIONS, MEDIA_FOLDERS, NAME_EXCEPTIONS } from './support/media-scan-allowlist';

const FIXTURES = join(__dirname, 'fixtures', 'media-scan');

type Fixture = { name: string; path: string; expect: Rule[] | 'none'; text: string };

function load(): Fixture[] {
  return readdirSync(FIXTURES)
    .filter((f) => f.endsWith('.fixture.txt'))
    .sort()
    .map((f) => {
      const text = readFileSync(join(FIXTURES, f), 'utf8');
      const as = /^\/\/ as: (.+)$/m.exec(text)?.[1] ?? 'apps/mobile/src/lib/media/fixture.ts';
      const want = /^\/\/ expect: (.+)$/m.exec(text)?.[1] ?? '';
      return { name: f.replace('.fixture.txt', ''), path: as.replace(/^apps\/mobile\//, ''), expect: want.trim() === 'none' ? 'none' : (want.split(',').map((s) => s.trim()) as Rule[]), text };
    });
}

const fixtures = load();
const rulesOf = (fx: Fixture) => [...new Set([...scanSource(fx.path, fx.text, { path: fx.path }), ...scanCatches(fx.path, fx.text)].map((f) => f.rule))];

describe('[NX-39-R9] the scanner flags every banned fixture (positive controls)', () => {
  it('has a fixture for each rule, and at least 40 fixtures', () => {
    expect(fixtures.length).toBeGreaterThanOrEqual(40);
    const covered = new Set(fixtures.flatMap((f) => (f.expect === 'none' ? [] : f.expect)));
    expect([...RULES].filter((r) => !covered.has(r)), 'rules with no fixture that must trip them').toEqual([]);
    for (const fx of fixtures) expect(fx.expect, fx.name).not.toEqual([]);
  });

  it.each(fixtures.filter((f) => f.expect !== 'none').map((f) => [f.name, f] as const))('fails on %s', (_name, fx) => {
    const got = rulesOf(fx);
    for (const rule of fx.expect as Rule[]) expect(got, `${fx.name} should trip ${rule}`).toContain(rule);
  });

  it.each(fixtures.filter((f) => f.expect === 'none').map((f) => [f.name, f] as const))('passes %s (negative control)', (_name, fx) => {
    expect([...scanSource(fx.path, fx.text, { path: fx.path }), ...scanCatches(fx.path, fx.text)]).toEqual([]);
  });

  it('does not lean on a text search: a banned word in a comment or a string of prose is not a finding', () => {
    const text = [
      '// We never call createAssetAsync, fetch, Vision or CLGeocoder. People and places are not read.',
      "/** faces, captions and scenes are never analysed */",
      "export const note = 'We do not look at your photos or where they were taken.';",
      'export const ok = 1;',
    ].join('\n');
    expect(scanSource('apps/mobile/src/lib/media/note.ts', text)).toEqual([]);
  });

  it('judges by the imported name, not the local alias, and by the name inside a string', () => {
    expect(scanSource('x.ts', "import { createAssetAsync as harmless } from 'expo-media-library'; harmless('a');").map((f) => f.rule)).toEqual(
      expect.arrayContaining(['banned-name', 'library-call-not-allowed']),
    );
    expect(scanSource('x.ts', "import { requestPermissionsAsync as ask } from 'expo-media-library'; ask();")).toEqual([]);
  });

  it('knows its words: tokens split names, so lookalikes pass and real names fail', () => {
    expect(tokensOf('VNDetectFaceRectanglesRequest')).toEqual(['vn', 'detect', 'face', 'rectangles', 'request']);
    expect(tokensOf('CLGeocoder')).toEqual(['cl', 'geocoder']);
    expect(nameProblem('interfaceName')).toBeNull();
    expect(nameProblem('surface')).toBeNull();
    expect(nameProblem('detectFaces')).toBe('banned-name');
    expect(nameProblem('prefetchAsha')).toBeNull();
    expect(nameProblem('fetchAssets')).toBeNull();
    expect(nameProblem('fetchWindow')).toBeNull();
    expect(nameProblem('fetch')).toBe('network');
    expect(nameProblem('WebSocket')).toBe('network');
    expect(nameProblem('createAssetAsync')).toBe('banned-name');
    expect(nameProblem('localizedTitle')).toBe('banned-name');
    for (const t of BANNED_TOKENS) expect(t, 'lower case').toBe(t.toLowerCase());
  });
});

describe('[NX-39-R9] the scanner passes on the real tree', () => {
  it('finds nothing in the media code of apps/mobile (src and modules)', () => {
    const { scanned, findings } = scanTree();
    // The Moments folder is a media folder and is in the tree today; the scan is not vacuous.
    expect(scanned).toContain('src/lib/moments/store.logic.ts');
    // The catch at launch.logic.ts:48 reports toNativeErrorCode(e) (CR-206 slice 3), so the real tree is clean.
    expect(findings.map((f) => `${f.file}:${f.line} ${f.rule} ${f.name}`)).toEqual([]);
  });

  it('selects media files by folder and by import, and ignores the rest', () => {
    expect(touchesMedia('src/lib/media/x.ts', '')).toBe(true);
    expect(touchesMedia('src/lib/moments/store.ts', '')).toBe(true);
    expect(touchesMedia('src/app/tonight.tsx', "import { getPermissionsAsync } from 'expo-media-library';")).toBe(true);
    expect(touchesMedia('src/app/tonight.tsx', "const m = require('expo-image-picker');")).toBe(true);
    expect(touchesMedia('src/app/tonight.tsx', "import { x } from '../lib/store';")).toBe(false);
    expect(touchesMedia('src/lib/reminders/planner.ts', "import { en } from '@scribe/content';")).toBe(false);
    expect(MEDIA_FOLDERS.length).toBeGreaterThan(4);
  });

  it('would catch a media file added anywhere in src: a file that imports the library is scanned and fails', () => {
    const bad = "import { createAssetAsync } from 'expo-media-library';\nexport const s = (u: string) => createAssetAsync(u);";
    expect(touchesMedia('src/app/anywhere.tsx', bad)).toBe(true);
    expect(scanSource('src/app/anywhere.tsx', bad, { path: 'src/app/anywhere.tsx' }).length).toBeGreaterThan(0);
  });
});

describe('[NX-39-R9] the allowlists are small, literal and reviewed', () => {
  it('lists no write API, no analysis API and no location API as allowed', () => {
    const allowed = Object.values(ALLOWED_LIBRARY_CALLS).flat();
    expect(allowed.filter((n) => /create|save|delete|add.*album|geocod|classif|caption|face|vision/i.test(n))).toEqual([]);
    // Pinned: growing the list is a change a reviewer must read (the file is proposed for CODEOWNERS: security-architect).
    expect(Object.keys(ALLOWED_LIBRARY_CALLS).sort()).toEqual(['expo-image-picker', 'expo-media-library', 'expo-media-library/next']);
    expect(ASSET_RECORD_FIELDS).toEqual(['opaqueId', 'capturedAt', 'kind', 'durationMs', 'pixelSize', 'cityKey']);
    expect(FIELD_READ_EXCEPTIONS).toEqual({});
  });
});

describe('[NX-39-R9] whole-identifier network names (CR-206)', () => {
  const run = (text: string) => scanSource('apps/mobile/src/lib/moments/library/x.ts', text, { path: 'src/lib/moments/library/x.ts' }).map((f) => f.rule);

  it('passes a method named fetchWindow, which is not the network', () => {
    expect(run('export const source = { fetchWindow: async () => [] };\nexport const w = () => source.fetchWindow();')).toEqual([]);
    expect(run('export interface S { fetchWindow(): Promise<number[]> }')).toEqual([]);
  });

  it('fails fetch(url), window.fetch(url) and new WebSocket(url)', () => {
    expect(run("export const a = (u: string) => fetch(u);")).toContain('network');
    expect(run("export const a = (u: string) => window.fetch(u);")).toContain('network');
    expect(run("export const a = (u: string) => new WebSocket(u);")).toContain('network');
  });

  it('catches a wrapper at its inner call', () => {
    expect(run('export const fetchWindow = (u: string) => fetch(u);')).toContain('network');
  });
});

describe('[NX-39-R9] NAME_EXCEPTIONS: one name in one file (CR-206, D-168)', () => {
  const src = "export const KNOWN = ['hiddenPlaces'];\nexport const x = { hiddenPlaces: [] as string[] };";

  it('pins the exception list: adding to it means editing this test in the same diff', () => {
    expect(NAME_EXCEPTIONS).toEqual({ hiddenPlaces: ['src/lib/moments/store.logic.ts'] });
  });

  it('allows hiddenPlaces in the Moments store file only', () => {
    const own = 'src/lib/moments/store.logic.ts';
    expect(scanSource(own, src, { path: own })).toEqual([]);
  });

  it('still fails the same name in any other file, including a sibling in the same folder', () => {
    for (const other of ['src/lib/moments/launch.logic.ts', 'src/lib/media/x.ts', 'src/lib/moments/library/source.ts', 'src/app/x.ts']) {
      expect(scanSource(other, src, { path: other }).map((f) => f.rule), other).toContain('banned-name');
    }
  });

  it('reads the exception list by own key: names like constructor and toString do not hit Object.prototype', () => {
    expect(() => scanSource('src/lib/media/x.ts', 'class A { constructor() {} toString() { return ""; } }', { path: 'src/lib/media/x.ts' })).not.toThrow();
  });

  it('does not let the exception cover other places-like names in the same file', () => {
    const own = 'src/lib/moments/store.logic.ts';
    expect(scanSource(own, 'export const places = [];', { path: own }).map((f) => f.rule)).toContain('banned-name');
  });
});
