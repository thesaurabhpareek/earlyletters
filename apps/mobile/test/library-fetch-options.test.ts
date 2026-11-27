/// <reference types="node" />
/**
 * [NS-53-R38][NS-53-R37] The library fetch never asks for hidden assets and always names the user library as its only
 * source (BL-1527; CPrivO-13; spec 28 section 7.1 erratum and section 10 step 1).
 *
 * R38 (with its BL-1527 text, PROPOSED) says hidden and non-user-library assets are excluded by the fetch options, not by core, and that a test fails the
 * build if the fetch ever sets `includeHiddenAssets` or leaves out the explicit source option `includeAssetSourceTypes`.
 * The library fetch (the `scribe-library` module, spec 28 step 1) is not built yet, so this scan is written first: it
 * reads every native and TypeScript file of the app today, and the day a fetch lands it holds it to these rules.
 *
 * - No file sets `includeHiddenAssets`, to any value (the default is false; the only reason to name it is to turn it on).
 * - Every file that makes a `PHFetchOptions` sets `includeAssetSourceTypes`, and every value it sets is the user library
 *   only (`.typeUserLibrary`): an iCloud Shared Album (`.typeCloudShared`) or a synced-from-computer source
 *   (`.typeiTunesSynced`) fails.
 * - No `PHAsset.fetchAssets` call passes `options: nil` (that fetch would use the defaults, which are not stated).
 *
 * Positive controls: each rule has a fixture the scan must flag, and the clean fixture must come back empty, so the
 * scan cannot pass by finding nothing or by flagging everything.
 *
 * Not proved here: what PhotoKit returns with these options (UNVERIFIED until G1a-L on a device), and a fetch whose
 * options are built in another file than the one that makes them. BL-1527 stays open until the fetch PR lands with
 * this test green against its code.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

type Rule = 'hidden-assets' | 'no-source-option' | 'source-not-user-library' | 'nil-options';

/** Comments say what a rule is about without breaking it, so they are blanked before the scan (Swift, ObjC and TS share these forms). */
function stripComments(src: string): string {
  return src.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/\/\/[^\n]*/g, ' ');
}

const USER_LIBRARY_ONLY = /^\[?\s*(?:PHAssetSourceType)?\.typeUserLibrary\s*\]?$/;

export function scanFetchOptions(src: string): Rule[] {
  const code = stripComments(src);
  const found = new Set<Rule>();
  if (/\bincludeHiddenAssets\b/.test(code)) found.add('hidden-assets');
  const makesOptions = /\bPHFetchOptions\s*\(\s*\)|\[\s*PHFetchOptions\s+(?:new|alloc)\b/.test(code);
  const sources = [...code.matchAll(/\bincludeAssetSourceTypes\s*=\s*([^\n;]+)/g)].map((m) => m[1].trim());
  if (makesOptions && sources.length === 0) found.add('no-source-option');
  for (const v of sources) if (!USER_LIBRARY_ONLY.test(v)) found.add('source-not-user-library');
  if (/\bfetchAssets\s*\([^)]*options\s*:\s*nil\b/.test(code)) found.add('nil-options');
  return [...found].sort();
}

const APP = resolve(__dirname, '..');
const SCANNED = /\.(swift|m|mm|ts|tsx)$/;

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((f) => {
    if (f === 'node_modules' || f === 'build' || f === 'Pods') return [];
    const p = join(dir, f);
    return statSync(p).isDirectory() ? walk(p) : SCANNED.test(f) ? [p] : [];
  });
}

const FIXTURES: readonly { name: string; src: string; expect: Rule[] }[] = [
  {
    name: 'clean: user library only, hidden never named',
    src: [
      'import Photos',
      '// includeHiddenAssets is never set (R38); a comment may name it.',
      'func window(from: Date, to: Date) -> PHFetchResult<PHAsset> {',
      '  let o = PHFetchOptions()',
      '  o.includeAssetSourceTypes = [.typeUserLibrary]',
      '  o.predicate = NSPredicate(format: "creationDate >= %@ AND creationDate < %@", from as NSDate, to as NSDate)',
      '  return PHAsset.fetchAssets(with: o)',
      '}',
    ].join('\n'),
    expect: [],
  },
  {
    name: 'hidden assets turned on',
    src: 'let o = PHFetchOptions()\no.includeAssetSourceTypes = .typeUserLibrary\no.includeHiddenAssets = true\n',
    expect: ['hidden-assets'],
  },
  {
    name: 'hidden assets named even as false',
    src: 'let o = PHFetchOptions()\no.includeAssetSourceTypes = .typeUserLibrary\no.includeHiddenAssets = false\n',
    expect: ['hidden-assets'],
  },
  { name: 'no source option', src: 'let o = PHFetchOptions()\no.fetchLimit = 500\nPHAsset.fetchAssets(with: o)\n', expect: ['no-source-option'] },
  {
    name: 'iCloud Shared Album pictures, which are other people\'s',
    src: 'let o = PHFetchOptions()\no.includeAssetSourceTypes = [.typeUserLibrary, .typeCloudShared]\n',
    expect: ['source-not-user-library'],
  },
  { name: 'synced from a computer', src: 'let o = PHFetchOptions()\no.includeAssetSourceTypes = .typeiTunesSynced\n', expect: ['source-not-user-library'] },
  { name: 'every source', src: 'let o = PHFetchOptions()\no.includeAssetSourceTypes = PHAssetSourceType(rawValue: 7)\n', expect: ['source-not-user-library'] },
  { name: 'Objective-C, no source option', src: 'PHFetchOptions *o = [PHFetchOptions new];\no.fetchLimit = 10;\n', expect: ['no-source-option'] },
  { name: 'fetch with the defaults', src: 'let r = PHAsset.fetchAssets(with: .image, options: nil)\n', expect: ['nil-options'] },
];

describe('[NS-53-R38] the scan flags every banned fixture and passes the clean one (positive controls)', () => {
  it('has a fixture for each rule, and one clean fixture', () => {
    const rules = new Set(FIXTURES.flatMap((f) => f.expect));
    expect([...rules].sort()).toEqual(['hidden-assets', 'nil-options', 'no-source-option', 'source-not-user-library']);
    expect(FIXTURES.filter((f) => f.expect.length === 0)).toHaveLength(1);
  });
  for (const fx of FIXTURES) {
    it(fx.name, () => {
      expect(scanFetchOptions(fx.src)).toEqual([...fx.expect].sort());
    });
  }
});

describe('[NS-53-R38][NS-53-R37] no file of the app breaks the fetch rules (BL-1527)', () => {
  const files = [...walk(join(APP, 'modules')), ...walk(join(APP, 'src'))];

  it('reads the native modules and the app source (not vacuous)', () => {
    const swift = files.filter((f) => f.endsWith('.swift'));
    expect(swift.length).toBeGreaterThanOrEqual(5);
    expect(swift.map((f) => relative(APP, f))).toContain('modules/scribe-photo/ios/ScribePhotoModule.swift');
    expect(files.length).toBeGreaterThan(100);
  });

  it('no file sets includeHiddenAssets, every PHFetchOptions names the user library only, and no fetch uses the defaults', () => {
    const problems = files
      .map((f) => ({ file: relative(APP, f), rules: scanFetchOptions(readFileSync(f, 'utf8')) }))
      .filter((p) => p.rules.length > 0);
    expect(problems).toEqual([]);
  });
});
