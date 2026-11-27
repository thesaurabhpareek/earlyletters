/// <reference types="node" />
/**
 * [NS-53-R38] [NS-53-R37, proof duty only] The library fetch never asks for hidden assets and always names the user
 * library as its only source (BL-1527; CPrivO-13; E-4-6; spec 28 section 7.1 erratum and section 10.1 step 1).
 *
 * R38 (with its BL-1527 text, PROPOSED) says hidden and non-user-library assets are excluded by the fetch options, not by
 * core, and that a test fails the build if the fetch ever sets `includeHiddenAssets` or leaves out the explicit source
 * option `includeAssetSourceTypes`. The library fetch (the `scribe-library` module, section 10.1 step 1) is not built
 * yet, so this scan is written first: it reads the Swift, Objective-C and TypeScript files under `apps/mobile/modules`
 * and `apps/mobile/src` today, and the day a fetch lands it holds that code to these rules, file by file.
 *
 * Rules (comments are blanked first; string literals are kept, so a key-value string such as "includeHiddenAssets" is
 * still caught):
 * - `hidden-assets`: a file names `includeHiddenAssets` (any case, any value, including the Objective-C setter). The
 *   reason to name it is to turn it on; what PhotoKit does by default is UNVERIFIED (G1a-L).
 * - `no-source-option`: a file makes more `PHFetchOptions` than it has source assignments, so at least one options
 *   object never names a source. Counted forms: `PHFetchOptions()`, `PHFetchOptions.init()`, `: PHFetchOptions =
 *   .init()`, Objective-C `[PHFetchOptions new]`, `[PHFetchOptions alloc]` and `PHFetchOptions.new`.
 * - `source-not-user-library`: a source assignment whose value is not the user library alone (an iCloud Shared Album
 *   or synced source, a raw value, a variable), or any mention of `includeAssetSourceTypes` (any case) that is not a
 *   plain assignment or the Objective-C setter: a later `insert`, `formUnion`, `|=`, a key-value write, a key path, an
 *   `inout` call or an object key. A value is read to the end of its line (or the first `;` or `]`), a `[ ... ]` value
 *   to its closing bracket and on to the end of that line, and lines that go on with `.` or `|` are read as part of
 *   it, stepping over blank and comment lines between.
 * - `nil-options`: an asset fetch (`fetchAssets`, `fetchKeyAssets`, and the Objective-C `fetchAssets...:` forms, read
 *   to the next `;`, even one inside a string) that passes the literal `nil` as `options:` or `with:`. Swift arguments
 *   are read to the matching parenthesis, skipping string literals. This also flags an identifier fetch with `options:
 *   nil`, which the library PR should know.
 *
 * Positive controls: each rule has fixtures the scan must flag, and the clean fixtures must come back empty, so the
 * scan cannot pass by finding nothing or by flagging everything.
 *
 * Not proved here:
 * - what PhotoKit returns with these options (UNVERIFIED until G1a-L on a device);
 * - which options object reaches which fetch: the count rule is per file, so a file with two options objects and two
 *   source assignments on the same one passes;
 * - options built in one file and passed in from another, or a variable that holds nil at run time (no data flow);
 * - C and C++ headers other than `.h`, and any file outside the two folders;
 * - comment and string forms the stripper does not know, any of which can blank code: a TypeScript or Swift regex
 *   literal that holds `//` or a quote, a template literal over several lines, JSX text holding `//` or `/*`, a Swift
 *   raw string (`#"..."#`) and a nested block comment;
 * - a value that goes on with `+` or `^` on the next line, or past an `#if` line, and a key built by joining strings;
 * - a fetch function passed around unapplied and later called with nil;
 * - nil written another way (`.none`, `Optional.none`, `(nil)`), and a `PHFetchOptions` made by a form not listed
 *   above (a typealias, `[PHFetchOptions.alloc init]`, or `o = .init()` after a separate declaration).
 * BL-1527 stays open until the fetch PR lands with this test green against its code.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

type Rule = 'hidden-assets' | 'no-source-option' | 'source-not-user-library' | 'nil-options';

/**
 * Blank `//` and block comments, but not text inside string literals, so a URL in a string cannot hide the code after
 * it. Handles "..." with escapes, Swift `"""` blocks, and TypeScript '...' and `...`.
 */
export function stripComments(src: string): string {
  let out = '';
  let i = 0;
  const n = src.length;
  while (i < n) {
    const c = src[i];
    const two = src.slice(i, i + 2);
    if (two === '//') {
      while (i < n && src[i] !== '\n') i++;
      out += ' ';
    } else if (two === '/*') {
      const end = src.indexOf('*/', i + 2);
      const stop = end < 0 ? n : end + 2;
      out += src.slice(i, stop).replace(/[^\n]/g, ' ');
      i = stop;
    } else if (src.startsWith('"""', i)) {
      const end = src.indexOf('"""', i + 3);
      const stop = end < 0 ? n : end + 3;
      out += src.slice(i, stop);
      i = stop;
    } else if (c === '"' || c === "'" || c === '`') {
      let j = i + 1;
      while (j < n && src[j] !== c && src[j] !== '\n') j += src[j] === '\\' ? 2 : 1;
      out += src.slice(i, j + 1);
      i = j + 1;
    } else {
      out += c;
      i++;
    }
  }
  return out;
}

/** The text between the bracket at `open` and its match (any of ( [ ), or to the end of the code. */
function balanced(code: string, open: number): string {
  const pairs: Record<string, string> = { '(': ')', '[': ']' };
  const stack: string[] = [];
  for (let i = open; i < code.length; i++) {
    const ch = code[i];
    if (ch === '"') {
      i++;
      while (i < code.length && code[i] !== '"' && code[i] !== '\n') i += code[i] === '\\' ? 2 : 1;
      continue;
    }
    if (ch in pairs) stack.push(pairs[ch]);
    else if (ch === stack[stack.length - 1]) {
      stack.pop();
      if (stack.length === 0) return code.slice(open, i + 1);
    }
  }
  return code.slice(open);
}

const USER_LIBRARY_ONLY = /^\[?\s*(?:(?:PHAssetSourceType)?\.typeUserLibrary|PHAssetSourceTypeUserLibrary)\s*,?\s*\]?$/;

/**
 * The value assigned at each source assignment: to the end of its line (or the first `;` or `]`), or, when it starts
 * with `[`, to the matching bracket and then on to the end of that line, plus any following lines that start with `.`
 * or `|`.
 */
function sourceValues(code: string): string[] {
  const values: string[] = [];
  const re = /includeAssetSourceTypes\s*=(?!=)\s*|setIncludeAssetSourceTypes\s*:\s*/g;
  for (const m of code.matchAll(re)) {
    const at = (m.index ?? 0) + m[0].length;
    let raw = code[at] === '[' ? balanced(code, at) : (/^[^\n;\]]*/.exec(code.slice(at))?.[0] ?? '');
    if (code[at] === '[') raw += /^[^\n;]*/.exec(code.slice(at + raw.length))?.[0] ?? ''; // `[...] as T` or `[...].union(...)`
    // A value may go on over the next lines: a Swift member chain (`.union(...)` on its own line) or an Objective-C
    // `| PHAssetSourceType...`. Blank lines and comment lines (already blanked) between them are stepped over.
    const NEXT = /^[^\S\n]*(?:\n[^\S\n]*)+([.|][^\n;]*)/;
    let rest = code.slice(at + raw.length);
    for (let m2 = NEXT.exec(rest); m2; m2 = NEXT.exec(rest)) {
      raw += ' ' + m2[1];
      rest = rest.slice(m2[0].length);
    }
    values.push(raw.replace(/\s+/g, ' ').trim());
  }
  return values;
}

export function scanFetchOptions(src: string): Rule[] {
  const code = stripComments(src);
  const found = new Set<Rule>();
  if (/includeHiddenAssets/i.test(code)) found.add('hidden-assets');

  const made = (
    code.match(
      /\bPHFetchOptions\s*(?:\.\s*init\s*)?\(|:\s*PHFetchOptions\s*[!?]?\s*=\s*\.init\s*\(|\[\s*PHFetchOptions\s+(?:new|alloc)\b|\bPHFetchOptions\s*\.\s*new\b/g,
    ) ?? []
  ).length;
  const sources = sourceValues(code);
  if (made > sources.length) found.add('no-source-option');
  for (const v of sources) if (!USER_LIBRARY_ONLY.test(v)) found.add('source-not-user-library');
  if (/includeAssetSourceTypes\s*(?:\??\.\s*(?:insert|formUnion|union|update|remove|subtract|formSymmetricDifference|formIntersection)\b|[|&^+-]=)/.test(code)) {
    found.add('source-not-user-library');
  }
  // Any other mention of the source (a key-value write, a key path, an `inout` call, an object key) is a write the
  // scan cannot read, so it fails too.
  const mentions = (code.match(/includeAssetSourceTypes/gi) ?? []).length;
  if (mentions > sources.length) found.add('source-not-user-library');

  for (const m of code.matchAll(/\bfetch(?:Key)?Assets\s*\(/g)) {
    const args = balanced(code, (m.index ?? 0) + m[0].length - 1);
    if (/(?:\boptions|\bwith)\s*:\s*nil\b/.test(args)) found.add('nil-options');
  }
  if (/\bfetch(?:Key)?Assets\w*:[^;]*?(?:[Oo]ptions|[Ww]ith)\s*:\s*nil\b/.test(code)) found.add('nil-options');
  if (/\bfetch(?:Key)?Assets\w*Options\s*:\s*nil\b/.test(code)) found.add('nil-options');
  return [...found].sort();
}

const APP = resolve(__dirname, '..');
const SCANNED = /\.(swift|m|mm|h|ts|tsx)$/;

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
      '/* nor here: o.includeHiddenAssets = true */',
      'func window(from: Date, to: Date) -> PHFetchResult<PHAsset> {',
      '  let help = "https://example.invalid/photos" // a URL in a string',
      '  let o = PHFetchOptions()',
      '  o.includeAssetSourceTypes = [.typeUserLibrary]',
      '  o.predicate = NSPredicate(format: "creationDate >= %@ AND creationDate < %@", from as NSDate, to as NSDate)',
      '  return PHAsset.fetchAssets(with: o)',
      '}',
    ].join('\n'),
    expect: [],
  },
  {
    name: 'clean: two options objects, each naming the user library, one multi-line, one by .init()',
    src: [
      'let a = PHFetchOptions()',
      'a.includeAssetSourceTypes = [',
      '  .typeUserLibrary,',
      ']',
      'let b = PHFetchOptions.init()',
      'b.includeAssetSourceTypes = PHAssetSourceType.typeUserLibrary',
      'let r = PHAsset.fetchAssets(withLocalIdentifiers: Array(ids), options: b)',
    ].join('\n'),
    expect: [],
  },
  {
    name: 'clean: Objective-C, user library only',
    src: 'PHFetchOptions *o = [[PHFetchOptions alloc] init];\no.includeAssetSourceTypes = PHAssetSourceTypeUserLibrary;\nPHFetchResult *r = [PHAsset fetchAssetsWithOptions:o];\n',
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
  {
    name: 'hidden assets after a URL string on the same line (the comment stripper keeps strings)',
    src: 'let o = PHFetchOptions()\no.includeAssetSourceTypes = .typeUserLibrary\nlet u = "https://x.invalid"; o.includeHiddenAssets = true\n',
    expect: ['hidden-assets'],
  },
  {
    name: 'hidden assets by key-value string',
    src: 'let o = PHFetchOptions()\no.includeAssetSourceTypes = .typeUserLibrary\no.setValue(true, forKey: "includeHiddenAssets")\n',
    expect: ['hidden-assets'],
  },
  {
    name: 'Objective-C hidden setter',
    src: 'PHFetchOptions *o = [PHFetchOptions new];\no.includeAssetSourceTypes = PHAssetSourceTypeUserLibrary;\n[o setIncludeHiddenAssets:YES];\n',
    expect: ['hidden-assets'],
  },
  { name: 'no source option', src: 'let o = PHFetchOptions()\no.fetchLimit = 500\nPHAsset.fetchAssets(with: o)\n', expect: ['no-source-option'] },
  { name: 'no source option, made by .init()', src: 'let o = PHFetchOptions.init()\nPHAsset.fetchAssets(with: o)\n', expect: ['no-source-option'] },
  {
    name: 'two options objects, the source set on one only',
    src: 'let a = PHFetchOptions()\nlet b = PHFetchOptions()\na.includeAssetSourceTypes = .typeUserLibrary\nPHAsset.fetchAssets(with: a)\nPHAsset.fetchAssets(with: b)\n',
    expect: ['no-source-option'],
  },
  { name: 'no source option, made by a typed .init()', src: 'let o: PHFetchOptions = .init()\nPHAsset.fetchAssets(with: o)\n', expect: ['no-source-option'] },
  { name: 'Objective-C, no source option, made by .new', src: 'PHFetchOptions *o = PHFetchOptions.new;\no.fetchLimit = 10;\n', expect: ['no-source-option'] },
  { name: 'Objective-C, no source option', src: 'PHFetchOptions *o = [PHFetchOptions new];\no.fetchLimit = 10;\n', expect: ['no-source-option'] },
  {
    name: "iCloud Shared Album pictures, which are other people's",
    src: 'let o = PHFetchOptions()\no.includeAssetSourceTypes = [.typeUserLibrary, .typeCloudShared]\n',
    expect: ['source-not-user-library'],
  },
  {
    name: 'a multi-line source list with a shared album',
    src: 'let o = PHFetchOptions()\no.includeAssetSourceTypes = [\n  .typeUserLibrary,\n  .typeCloudShared,\n]\n',
    expect: ['source-not-user-library'],
  },
  { name: 'synced from a computer', src: 'let o = PHFetchOptions()\no.includeAssetSourceTypes = .typeiTunesSynced\n', expect: ['source-not-user-library'] },
  { name: 'every source', src: 'let o = PHFetchOptions()\no.includeAssetSourceTypes = PHAssetSourceType(rawValue: 7)\n', expect: ['source-not-user-library'] },
  {
    name: 'a shared album inserted after a clean assignment',
    src: 'let o = PHFetchOptions()\no.includeAssetSourceTypes = .typeUserLibrary\no.includeAssetSourceTypes.insert(.typeCloudShared)\n',
    expect: ['source-not-user-library'],
  },
  {
    name: 'a source set widened by formUnion',
    src: 'let o = PHFetchOptions()\no.includeAssetSourceTypes = .typeUserLibrary\no.includeAssetSourceTypes.formUnion([.typeiTunesSynced])\n',
    expect: ['source-not-user-library'],
  },
  {
    name: 'a source widened by a member chain on the next line',
    src: 'let o = PHFetchOptions()\no.includeAssetSourceTypes = .typeUserLibrary\n  .union(.typeCloudShared)\n',
    expect: ['source-not-user-library'],
  },
  {
    name: 'a member chain on a later line, after a comment line and a blank line',
    src: 'let o = PHFetchOptions()\no.includeAssetSourceTypes = .typeUserLibrary\n  // shared albums too\n\n  .union(.typeCloudShared)\n',
    expect: ['source-not-user-library'],
  },
  {
    name: 'a bracketed value with a cast, widened on the next line',
    src: 'let o = PHFetchOptions()\no.includeAssetSourceTypes = [.typeUserLibrary] as PHAssetSourceType\n  .union(.typeCloudShared)\n',
    expect: ['source-not-user-library'],
  },
  {
    name: 'a bracketed value widened on the same line',
    src: 'let o = PHFetchOptions()\no.includeAssetSourceTypes = [.typeUserLibrary].union(.typeiTunesSynced)\n',
    expect: ['source-not-user-library'],
  },
  {
    name: 'Objective-C source widened with | on the next line',
    src: 'PHFetchOptions *o = [PHFetchOptions new];\no.includeAssetSourceTypes = PHAssetSourceTypeUserLibrary\n  | PHAssetSourceTypeCloudShared;\n',
    expect: ['source-not-user-library'],
  },
  {
    name: 'a source written through a key path',
    src: 'let o = PHFetchOptions()\no.includeAssetSourceTypes = .typeUserLibrary\no[keyPath: \\.includeAssetSourceTypes] = [.typeCloudShared]\n',
    expect: ['source-not-user-library'],
  },
  {
    name: 'a source written by #keyPath',
    src: 'let o = PHFetchOptions()\no.includeAssetSourceTypes = .typeUserLibrary\no.setValue(7, forKey: #keyPath(PHFetchOptions.includeAssetSourceTypes))\n',
    expect: ['source-not-user-library'],
  },
  {
    name: 'a source widened by a key-value write',
    src: 'let o = PHFetchOptions()\no.includeAssetSourceTypes = .typeUserLibrary\no.setValue(7, forKey: "includeAssetSourceTypes")\n',
    expect: ['source-not-user-library'],
  },
  {
    name: 'Objective-C source widened with |=',
    src: 'PHFetchOptions *o = [PHFetchOptions new];\no.includeAssetSourceTypes = PHAssetSourceTypeUserLibrary;\no.includeAssetSourceTypes |= PHAssetSourceTypeCloudShared;\n',
    expect: ['source-not-user-library'],
  },
  { name: 'fetch with the defaults', src: 'let r = PHAsset.fetchAssets(with: .image, options: nil)\n', expect: ['nil-options'] },
  { name: 'fetch with nil options and nothing else', src: 'let r = PHAsset.fetchAssets(with: nil)\n', expect: ['nil-options'] },
  {
    name: 'fetch with nil options after nested parentheses',
    src: 'let r = PHAsset.fetchAssets(withLocalIdentifiers: Array(ids), options: nil)\n',
    expect: ['nil-options'],
  },
  { name: 'key assets with nil options', src: 'let r = PHAsset.fetchKeyAssets(in: album, options: nil)\n', expect: ['nil-options'] },
  {
    name: 'fetch with nil options after a string holding a parenthesis',
    src: 'let r = PHAsset.fetchAssets(withLocalIdentifiers: [")"], options: nil)\n',
    expect: ['nil-options'],
  },
  {
    name: 'Objective-C fetch with nil options after a bracketed argument',
    src: 'PHFetchResult *r = [PHAsset fetchAssetsWithLocalIdentifiers:@[localId] options:nil];\n',
    expect: ['nil-options'],
  },
  { name: 'Objective-C fetch with nil options', src: 'PHFetchResult *r = [PHAsset fetchAssetsWithOptions:nil];\n', expect: ['nil-options'] },
];

describe('[NS-53-R38] the scan flags every banned fixture and passes the clean ones (positive controls)', () => {
  it('has a fixture for each rule, and clean fixtures', () => {
    const rules = new Set(FIXTURES.flatMap((f) => f.expect));
    expect([...rules].sort()).toEqual(['hidden-assets', 'nil-options', 'no-source-option', 'source-not-user-library']);
    expect(FIXTURES.filter((f) => f.expect.length === 0).length).toBeGreaterThanOrEqual(3);
  });
  for (const fx of FIXTURES) {
    it(fx.name, () => {
      expect(scanFetchOptions(fx.src)).toEqual([...fx.expect].sort());
    });
  }
});

describe('[NS-53-R38] no file of the app breaks the fetch rules, file by file (BL-1527)', () => {
  const files = [...walk(join(APP, 'modules')), ...walk(join(APP, 'src'))];

  it('reads the native modules and the app source (not vacuous)', () => {
    const swift = files.filter((f) => f.endsWith('.swift'));
    expect(swift.length).toBeGreaterThanOrEqual(5);
    expect(swift.map((f) => relative(APP, f))).toContain('modules/scribe-photo/ios/ScribePhotoModule.swift');
    expect(files.length).toBeGreaterThan(100);
  });

  it('no file names includeHiddenAssets, no file makes more PHFetchOptions than it names sources for, every source is the user library alone, and no asset fetch passes nil options', () => {
    const problems = files
      .map((f) => ({ file: relative(APP, f), rules: scanFetchOptions(readFileSync(f, 'utf8')) }))
      .filter((p) => p.rules.length > 0);
    expect(problems).toEqual([]);
  });
});
