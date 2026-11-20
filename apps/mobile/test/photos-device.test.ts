/// <reference types="node" />
// Device-side pieces of Photo with a letter that run in Node: the orientation baker (C7), and the scribe-photo Swift
// module read as source (C8). What only a phone can show is listed as device checks in the PR.
import { mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it, vi } from 'vitest';
import { BAKE_TIMEOUT_MS, createOrientationBaker, type BakedFiles } from '../src/lib/photos/baker';
import { makeJpeg } from './photos-helpers';

/** An in-memory BakedFiles: what the baker may hand over and where the native step writes (the phone's folders are tested below). */
function memoryBaked(): BakedFiles & { disk: Map<string, Uint8Array> } {
  const disk = new Map<string, Uint8Array>();
  let n = 0;
  return {
    disk,
    isPicked: (uri) => /^file:\/\/\/c\/ImagePicker\/[\w-]+\.img$/.test(uri),
    destination: () => `file:///c/ScribePhoto/out${++n}.jpg`,
    async read(uri) {
      const b = disk.get(uri);
      if (!b) throw new Error('gone');
      return b;
    },
    remove: async (uri) => void disk.delete(uri),
  };
}

describe('[NX-39-R53][C7] the native step\'s temporary JPEG is read once and removed', () => {
  const PICKED = 'file:///c/ImagePicker/0194-a.img';
  it('[C7] the baker hands a picked original to the native step with a destination it built, reads that file once and removes it', async () => {
    const files = memoryBaked();
    const seen: [string, string][] = [];
    const baker = createOrientationBaker({ reencodeUpright: async (s: string, d: string) => (seen.push([s, d]), files.disk.set(d, makeJpeg()), d) }, files)!;
    const bytes = await baker.bake(Uint8Array.of(1), { uri: PICKED });
    expect(bytes && bytes.length).toBeGreaterThan(10);
    expect(seen).toEqual([[PICKED, 'file:///c/ScribePhoto/out1.jpg']]);
    expect(files.disk.size).toBe(0); // read once, then removed
    expect(await baker.bake(Uint8Array.of(1))).toBeNull(); // no uri: nothing to re-encode
    expect(createOrientationBaker(null, files)).toBeUndefined(); // no native module: no baker
  });
  it('[C7] only a picked original is handed over, a refused destination name is null, and an answer naming another file is never read (review N4)', async () => {
    const files = memoryBaked();
    const calls: string[] = [];
    const native = { reencodeUpright: async (s: string, d: string) => (calls.push(s), d) };
    const baker = createOrientationBaker(native, files)!;
    const other = 'file:///c/Documents/ExpoAudio/take.m4a';
    for (const uri of [other, 'file:///c/ScribePhoto/0194-a.jpg', 'file:///c/ImagePicker/../x.img', 'u']) expect(await baker.bake(Uint8Array.of(1), { uri }), uri).toBeNull();
    const refused = createOrientationBaker(native, { ...files, destination: () => { throw new Error('photo_temp_name_refused'); } })!;
    expect(await refused.bake(Uint8Array.of(1), { uri: PICKED })).toBeNull();
    expect(calls).toEqual([]);
    files.disk.set(other, Uint8Array.of(1));
    const sneaky = createOrientationBaker({ reencodeUpright: async () => other }, files)!;
    expect(await sneaky.bake(Uint8Array.of(1), { uri: PICKED })).toBeNull();
    expect(files.disk.has(other)).toBe(true);
  });
  it('[C7] a native failure, or a step that never answers, is null within the time bound, and no native text reaches a log (review N7, N9)', async () => {
    const spies = (['error', 'warn', 'log', 'info', 'debug'] as const).map((m) => vi.spyOn(console, m).mockImplementation(() => {}));
    try {
      const bad = createOrientationBaker({ reencodeUpright: async () => { throw new Error('CANARY /private/var/IMG_1.HEIC'); } }, memoryBaked())!;
      expect(await bad.bake(Uint8Array.of(1), { uri: PICKED })).toBeNull();
      const hung = createOrientationBaker({ reencodeUpright: () => new Promise<string>(() => {}) }, memoryBaked(), 20)!;
      const at = Date.now();
      expect(await hung.bake(Uint8Array.of(1), { uri: PICKED })).toBeNull();
      expect(Date.now() - at).toBeLessThan(2_000);
      expect(BAKE_TIMEOUT_MS).toBeLessThanOrEqual(30_000);
      const logged = spies.flatMap((s) => s.mock.calls.map((c) => c.map(String).join(' ')));
      expect(logged.filter((l) => l.includes('CANARY'))).toEqual([]);
    } finally {
      for (const s of spies) s.mockRestore();
    }
  });
});

// ---- the Swift module, read as source: what it may call, and exactly what it writes --------------------------------

/** Every source file the pod compiles (its `source_files` takes every .h, .m and .swift file under ios/), relative to ios/. */
export function compiledSources(iosDir: string): string[] {
  return readdirSync(iosDir, { recursive: true, encoding: 'utf8' }).filter((f) => /\.(h|m|mm|c|cc|cpp|swift)$/.test(f)).sort();
}

/** Lines the module must hold exactly once, each with what it guarantees (reviews N-B1, N-B4, N-B5, N-B7, notes 1-6). */
const PINNED: [string, string][] = [
  ['  private static let longestSide = 4096\n', 'the 4096 px limit'],
  ['  private static let maxPixels = 150_000_000\n', 'the 150 MP cap'],
  ['  private static let allowedTypes: Set<String> = [UTType.jpeg.identifier, UTType.heic.identifier, UTType.heif.identifier, UTType.png.identifier]\n', 'the format allowlist'],
  ['  private static let presentTimeout: TimeInterval = 2.0\n', "the 2 s watchdog (scribe-store's StoreSheet)"],
  ['  static var pick: ScribePhotoException { ScribePhotoException("photo_pick_failed") }\n', 'the pick code'],
  ['  static var reencode: ScribePhotoException { ScribePhotoException("photo_reencode_failed") }\n', 'the re-encode code'],
  // Paths from JavaScript: a plain name directly inside the Caches folder worked out natively, links resolved.
  ['    let caches = try fm.url(for: .cachesDirectory, in: .userDomainMask, appropriateFor: nil, create: true)\n', 'the Caches folder'],
  ['    let file = url.standardizedFileURL\n', 'dot segments resolved'],
  [String.raw`    guard file.lastPathComponent.range(of: "^[0-9A-Za-z-]{1,64}\\.[0-9A-Za-z]{1,8}\\z", options: .regularExpression) != nil,` + '\n', 'a plain file name, to the end of the input'],
  ['          file.deletingLastPathComponent().resolvingSymlinksInPath().path == home.resolvingSymlinksInPath().path else {\n', 'directly inside the folder, links resolved'],
  ['    return file\n', 'the checked file is the one used'],
  ['        let out = try ScribePhotoModule.fileIn("ImagePicker", destination)\n', 'the pick destination inside Caches/ImagePicker'],
  ['        try await ScribePhotoModule.copyPicked(from: provider, to: out)\n', 'the copy goes to the checked destination'],
  ['    let url = try fileIn("ImagePicker", sourceUri)\n    let out = try fileIn("ScribePhoto", destinationUri)\n', 'the re-encode source in Caches/ImagePicker, its destination in Caches/ScribePhoto'],
  // Nothing at the destination but a regular file is ever removed; a folder or a link refuses.
  ['    guard attributes[.type] as? FileAttributeType == .typeRegular else { throw Refused() }\n    try fm.removeItem(at: out)\n', 'only a regular file is made room for'],
  ['    if (try? fm.attributesOfItem(atPath: out.path)[.type] as? FileAttributeType) == .typeRegular { try? fm.removeItem(at: out) }\n', 'only a regular file is cleaned up'],
  ['          try ScribePhotoModule.clear(out)\n          try FileManager.default.copyItem(at: url, to: out)\n', 'the pick copy, never over a folder'],
  ['          ScribePhotoModule.removeIfFile(out)\n          continuation.resume(throwing: ScribePhotoException.pick)\n', 'a partial original removed'],
  ['      try clear(out)\n      guard let dest = CGImageDestinationCreateWithURL(out as CFURL, UTType.jpeg.identifier as CFString, 1, nil) else {\n', 'the JPEG, never over a folder'],
  ['      guard CGImageDestinationFinalize(dest) else {\n        removeIfFile(out)\n', 'a failed JPEG removed'],
  // One picker at a time, inside a sheet of ours, and never stuck: not when UIKit refuses to present it, and not when
  // the app dismisses it by code, which tells no delegate (round 3, review A must-fix, review B N-P1).
  ['    if let open = PickerSession.current, open.shown, open.host?.presentingViewController == nil { open.cancel() }\n', 'a stale session answered as a Cancel'],
  ['    guard PickerSession.current == nil else { throw ScribePhotoException.pick }\n', 'one picker in flight'],
  ['  static var current: PickerSession?\n', 'the session in flight'],
  ['    PickerSession.current = self\n', 'a new session takes the one slot'],
  ['    if PickerSession.current === self { PickerSession.current = nil }\n', 'the session released when it answers'],
  ['    self.continuation = nil\n', 'an answer given once'],
  ['        let host = PickerHost(picker, session)\n        picker.delegate = session\n        session.host = host\n', 'the picker in its sheet, with its delegate'],
  ['        presenter.present(host, animated: true) {\n          session.shown = true\n', 'a presentation of the sheet that reports it happened'],
  ['          if session.answered { host.dismiss(animated: true) }\n', 'a sheet shown after the answer goes away again'],
  ['          try? await Task.sleep(nanoseconds: UInt64(ScribePhotoModule.presentTimeout * 1_000_000_000))\n', 'the watchdog wait'],
  ['          guard let session, PickerSession.current === session, !session.shown, host?.presentingViewController == nil else { return }\n          session.refuse()\n', 'the watchdog'],
  ['    host?.dismiss(animated: true)\n    finish(.success(results.first?.itemProvider))\n', 'a pick or Cancel closes the sheet and answers'],
  ['    finish(.success(nil))\n', 'no picture answers null'],
  ['    finish(.failure(ScribePhotoException.pick))\n', 'a refused picker fails with its code'],
  ['    addChild(picker)\n    picker.view.frame = view.bounds\n    picker.view.autoresizingMask = [.flexibleWidth, .flexibleHeight]\n    view.addSubview(picker.view)\n    picker.didMove(toParent: self)\n', 'the picker embedded in its sheet'],
  ['  override func viewDidDisappear(_ animated: Bool) {\n    super.viewDidDisappear(animated)\n    session.cancel()\n  }\n', 'the sheet going away answers a Cancel'],
  // The re-encode runs on a serial queue of its own, not ExpoModulesCore's shared one (review B N-B5r).
  ['  private static let reencodeQueue = DispatchQueue(label: "scribe.photo.reencode", qos: .userInitiated)\n', 'a serial queue of its own'],
  ['    }.runOnQueue(ScribePhotoModule.reencodeQueue)\n', 'the re-encode on that queue'],
  // The decode: an uncached source, a checked multiply, inside an autorelease pool.
  ['      let noCache = [kCGImageSourceShouldCache: false] as CFDictionary\n', 'the cache flag off'],
  ['      guard let source = CGImageSourceCreateWithURL(url as CFURL, noCache),\n', 'an uncached source'],
  ['      let props = CGImageSourceCopyPropertiesAtIndex(source, index, noCache) as? [CFString: Any]\n', 'uncached properties'],
  ['      let (pixels, overflow) = width.multipliedReportingOverflow(by: height)\n', 'a checked multiply'],
  ['      guard width > 0, height > 0, !overflow, pixels <= maxPixels else { throw ScribePhotoException.reencode }\n', 'the pixel cap'],
  ['    try autoreleasepool {\n', 'an autorelease pool'],
];

/** How many times each name may appear in the code, so no second copy, write, removal or path can join (N-B3, note 2). */
const COUNTS: [RegExp, number, string][] = [
  [/CGImageSourceCopyPropertiesAtIndex\(/g, 1, 'one property read'],
  [/\bwrite\b/g, 2, 'one write dictionary, used once'],
  [/\bcopyItem\b/g, 1, 'one copy, of the picked file'],
  [/\bremoveItem\b/g, 2, 'removal only in clear and removeIfFile'],
  [/\bcreateDirectory\b/g, 1, 'only the Caches folder is created'],
  [/\bfileIn\(/g, 4, 'three checked paths'],
  [/\ballowedTypes\b/g, 2, 'the allowlist, unchanged'],
  [/\bmaxPixels\b/g, 2, 'the cap, unchanged'],
  [/\blongestSide\b/g, 2, 'the limit, unchanged'],
  [/\bkCGImageSourceShouldCache\b/g, 2, 'the cache flag'],
  [/\bAsyncFunction\b/g, 2, 'two exports'],
  [/\bpresent\(/g, 1, 'one presentation, of the sheet'],
  [/\.dismiss\(/g, 2, 'the sheet dismissed after an answer only'],
  [/PHPickerViewController\(/g, 1, 'one picker'],
  [/\bPickerHost\(/g, 1, 'one sheet'],
  [/\brunOnQueue\b/g, 1, 'one queue choice'],
  [/\breencodeQueue\b/g, 2, 'the queue, used once'],
];

/** Every problem the scan finds in ScribePhotoModule.swift; empty when the module is what the reviews accepted. */
export function swiftProblems(swift: string): string[] {
  // Only whole-line comments go (they name what is absent); a "//" inside code, as in "file://", hides nothing.
  const code = swift.replace(/^[ \t]*\/\/.*$/gm, '');
  const out: string[] = [];
  const need = (re: RegExp, why: string) => void (re.test(code) || out.push(`missing: ${why}`));
  const never = (re: RegExp, why: string) => void (re.test(code) && out.push(`forbidden: ${why}`));
  for (const [line, why] of PINNED) if (code.split(line).length !== 2) out.push(`not exactly once: ${why}`);
  for (const [re, n, why] of COUNTS) if ((code.match(re) ?? []).length !== n) out.push(`count: ${why}`);
  const imports = [...code.matchAll(/^import (\w+)/gm)].map((m) => m[1]).sort();
  if (imports.join() !== 'ExpoModulesCore,Foundation,ImageIO,PhotosUI,UIKit,UniformTypeIdentifiers') out.push(`imports: ${imports.join()}`);
  // No permission, camera, library, location, network or logging, anywhere (NS-01-R2, R22; ITMS-90683; review N8).
  never(/requestAuthorization|requestAccess|authorizationStatus|AVCapture|AVFoundation|UIImagePickerController|PHPhotoLibrary|PHAsset|PHImageManager|PHFetch|\bphotoLibrary\b|CoreLocation|CLLocation|UsageDescription/, 'a permission, camera, library or location API');
  never(/URLSession|URLRequest|NWConnection|CFNetwork|NSURLConnection|WebKit/, 'a network API');
  never(/\bprint\(|debugPrint|\bdump\(|NSLog|os_log|OSLog|\bLogger\b|\blog\b|os_signpost|fputs|standardError/, 'logging');
  // No other way to copy, write, move or remove a file, and no other image source or destination.
  never(/contentsOf|\.write\(to|write\(toFile|replaceItem|\b(moveItem|linkItem|createSymbolicLink|createFile|trashItem|FileHandle|OutputStream)\b/, 'another file copy, write or removal');
  never(/\b(rename|renameat|renamex_np|link|linkat|symlink|remove|unlink|open|creat|truncate|fopen|fwrite|rmdir|mkdir|clonefile|copyfile|exchangedata)\s*\(/, 'a POSIX file call');
  never(/\bCI[A-Z]\w*|CoreImage|writeJPEGRepresentation|jpegRepresentation|heifRepresentation|pngRepresentation|\bUIImage\b|jpegData|pngData|heicData/, 'another image writer');
  never(/\b(Function|StaticFunction|StaticAsyncFunction|Property|Constant|Constants|Events|View|Prop|Class|OnCreate|OnDestroy|OnStartObserving|OnStopObserving|OnAppEntersForeground|OnAppEntersBackground|OnAppBecomesActive)\s*\(/, 'another export');
  never(/CGImageSourceCreate(WithData|Incremental|ImageAtIndex)|CGImageDestinationCreateWith(Data|DataConsumer)/, 'another image source or destination');
  never(/width \* height|height \* width/, 'an unchecked multiply');
  // The picker: Apple's out-of-process picker with no library, images only, one, the file as it is.
  if ((code.match(/PHPickerConfiguration\s*\(/g) ?? []).length !== 1 || !/var configuration = PHPickerConfiguration\(\)\n/.test(code)) out.push('the picker configuration is not PHPickerConfiguration() with no library');
  need(/configuration\.filter = \.images\n/, 'images only');
  need(/configuration\.selectionLimit = 1\n/, 'one picture');
  need(/configuration\.preferredAssetRepresentationMode = \.current\n/, 'the current representation');
  need(/appContext\?\.utilities\?\.currentViewController\(\)/, "ExpoModulesCore's presenter");
  need(/loadFileRepresentation\(forTypeIdentifier: UTType\.image\.identifier\)/, 'the still image as a file');
  // Before any decode: the primary image (N2), a complete source, an allowed format and a pixel cap (N1).
  need(/let index = CGImageSourceGetPrimaryImageIndex\(source\)\n/, 'the primary image index');
  never(/AtIndex\(source, 0\b/, 'image index 0');
  need(/CGImageSourceGetStatus\(source\) == \.statusComplete/, 'a complete source');
  need(/CGImageSourceGetStatusAtIndex\(source, index\) == \.statusComplete/, 'a complete image');
  // Order: paths checked before any work, one picker before presenting, caps before the decode, all ImageIO in the pool.
  const at = (s: string) => code.indexOf(s);
  const before = (a: string, b: string, why: string) => void ((at(a) < 0 || at(b) < 0 || at(a) > at(b)) && out.push(`order: ${why}`));
  before('ScribePhotoModule.fileIn("ImagePicker", destination)', 'self.presentPicker()', 'the pick destination is checked first');
  before('fileIn("ScribePhoto", destinationUri)', 'CGImageSourceCreateWithURL(', 'the re-encode paths are checked first');
  before('if let open = PickerSession.current', 'guard PickerSession.current == nil', 'a stale session is answered before the busy check');
  before('guard PickerSession.current == nil', 'presenter.present(', 'the busy check comes first');
  before('allowedTypes.contains(type)', 'CGImageSourceCreateThumbnailAtIndex(', 'the format allowlist before the decode');
  before('pixels <= maxPixels', 'CGImageSourceCreateThumbnailAtIndex(', 'the pixel cap before the decode');
  const pool = at('    try autoreleasepool {\n');
  const poolEnd = code.indexOf('\n    }\n', pool);
  for (const call of ['CGImageSourceCreateWithURL(', 'CGImageSourceCreateThumbnailAtIndex(', 'CGImageDestinationAddImage(', 'CGImageDestinationFinalize(']) {
    if (pool < 0 || at(call) < pool || at(call) > poolEnd) out.push(`outside the autorelease pool: ${call}`);
  }
  const copyPicked = code.slice(at('private static func copyPicked('), at('private static func reencode('));
  if (!copyPicked.includes('copyItem(')) out.push('the copy is outside copyPicked');
  // Source properties are read for the width and the height only.
  const props = [...code.matchAll(/\bprops\b(\?\[(\w+)\])?/g)];
  const reads = props.filter((m) => m[2]).map((m) => m[2]).sort();
  if (reads.join() !== 'kCGImagePropertyPixelHeight,kCGImagePropertyPixelWidth' || props.length !== 3) out.push(`source properties used beyond width and height: ${props.map((m) => m[0]).join(' ')}`);
  // The decode: from the full image, turned, not cached.
  const decode = /let decode: \[CFString: Any\] = \[([\s\S]*?)\n\s*\]/.exec(code)?.[1] ?? '';
  if (decode.replace(/\s+/g, ' ').trim() !== 'kCGImageSourceCreateThumbnailFromImageAlways: true, kCGImageSourceCreateThumbnailWithTransform: true, kCGImageSourceShouldCache: false, kCGImageSourceThumbnailMaxPixelSize: min(max(width, height), longestSide),') out.push(`decode options: ${decode.trim()}`);
  // The write: exactly one AddImage, of the decoded pixels, with exactly our three options and nothing else.
  const adds = code.match(/CGImageDestinationAdd\w*\([^)]*\)/g) ?? [];
  if (adds.join() !== 'CGImageDestinationAddImage(dest, image, write as CFDictionary)') out.push(`the image is added as: ${adds.join(' ; ')}`);
  const write = /let write: \[CFString: Any\] = \[([\s\S]*?)\n\s*\]/.exec(code)?.[1] ?? '';
  if (write.replace(/\s+/g, ' ').trim() !== 'kCGImageDestinationLossyCompressionQuality: quality, kCGImageMetadataShouldExcludeGPS: true, kCGImageMetadataShouldExcludeXMP: true,') out.push(`write options: ${write.trim()}`);
  never(/\bwrite\[|var write\b/, 'a changed write dictionary');
  never(/AddImageAndMetadata|AddImageFromSource|CopyImageSource|CGImageDestinationSetProperties|AuxiliaryData|kCGImageAuxiliary|EmbedThumbnail|PreserveGainMap|MergeMetadata|kCGImageDestinationMetadata|CopyMetadataAtIndex|ShouldCacheImmediately/, 'a metadata, auxiliary-data or thumbnail path');
  never(/kCGImageProperty(?!PixelWidth\]|PixelHeight\])\w+/, 'a source property other than the pixel size');
  // Errors: each exported function maps every failure to its own closed code (N3, note 9); the codes are fixed strings.
  const codes = [...code.matchAll(/ScribePhotoException\("([^"]+)"\)/g)].map((m) => m[1]).sort();
  if (codes.join() !== 'photo_pick_failed,photo_reencode_failed') out.push(`codes: ${codes.join()}`);
  need(/final class ScribePhotoException: Exception, @unchecked Sendable \{/, 'a Sendable exception with an explicit code');
  need(/override var code: String \{ codeValue \}/, 'the explicit code');
  never(/localizedDescription|\\\(error|description:/, 'error text in a message');
  const own: Record<string, string> = { pickOne: 'pick', reencodeUpright: 'reencode' };
  const fns = [...code.matchAll(/AsyncFunction\("(\w+)"\) \{[^\n]* in\n/g)];
  if (fns.map((m) => m[1]).join() !== 'pickOne,reencodeUpright') out.push(`functions: ${fns.map((m) => m[1]).join()}`);
  for (const m of fns) {
    const rest = code.slice(m.index! + m[0].length);
    const body = rest.slice(0, rest.search(/\n {4}\}/));
    if (!new RegExp(String.raw`^ {6}do \{\n[\s\S]*\n {6}\} catch \{\n {8}throw ScribePhotoException\.${own[m[1]]}\n {6}\}$`).test(body)) out.push(`${m[1]}: a failure can leave without its own closed code`);
  }
  return out;
}

describe('[C8] the Swift module: Apple\'s picker and ImageIO, nothing else', () => {
  const dir = join(__dirname, '..', 'modules', 'scribe-photo');
  const swift = readFileSync(join(dir, 'ios', 'ScribePhotoModule.swift'), 'utf8');
  it('[NS-01-R2][NS-01-R22][C8] every file the pod compiles passes the scan: no permission request, camera, library, network or log; checked paths; one picker; the write carries only our three options', () => {
    const sources = compiledSources(join(dir, 'ios'));
    expect(sources).toEqual(['ScribePhotoModule.swift']);
    for (const f of sources) expect(swiftProblems(readFileSync(join(dir, 'ios', f), 'utf8')), f).toEqual([]);
  });
  it('[C8] positive control: each mutation the reviews tried, and each banned call, makes the scan fail', () => {
    const swap = (a: string, b: string, text = swift) => {
      expect(text, a).toContain(a);
      return text.replace(a, b);
    };
    const writeDict = 'kCGImageMetadataShouldExcludeXMP: true,\n';
    const pickCatch = '} catch {\n        throw ScribePhotoException.pick\n      }';
    const reencodeCatch = '} catch {\n        throw ScribePhotoException.reencode\n      }';
    const mutants: Record<string, string> = {
      'source properties into AddImage': swap('CGImageDestinationAddImage(dest, image, write as CFDictionary)', 'CGImageDestinationAddImage(dest, image, props as CFDictionary?)'),
      'Exif in the write options': swap(writeDict, `${writeDict}      kCGImagePropertyExifDictionary: [:],\n`),
      'GPS in the write options': swap(writeDict, `${writeDict}      kCGImagePropertyGPSDictionary: [:],\n`),
      'TIFF in the write options': swap(writeDict, `${writeDict}      kCGImagePropertyTIFFDictionary: [:],\n`),
      'an embedded thumbnail': swap(writeDict, `${writeDict}      kCGImageDestinationEmbedThumbnail: true,\n`),
      'the gain map kept': swap(writeDict, `${writeDict}      kCGImageDestinationPreserveGainMap: true,\n`),
      'auxiliary data': swap('      guard CGImageDestinationFinalize(dest)', '      CGImageDestinationAddAuxiliaryDataInfo(dest, kCGImageAuxiliaryDataTypeDepth, [:] as CFDictionary)\n      guard CGImageDestinationFinalize(dest)'),
      'image and metadata': swap('CGImageDestinationAddImage(dest, image, write as CFDictionary)', 'CGImageDestinationAddImageAndMetadata(dest, image, nil, write as CFDictionary)'),
      'another source property read': swap('      let height = (props?', '      let gps = props?[kCGImagePropertyGPSDictionary]\n      let height = (props?'),
      'a second property read shadowing write': swap('      CGImageDestinationAddImage(dest, image, write as CFDictionary)', '      if let write = CGImageSourceCopyPropertiesAtIndex(source, index, nil) { CGImageDestinationAddImage(dest, image, write as CFDictionary) }'),
      'the original copied for an upright JPEG': swap('      try clear(out)\n', '      if type == UTType.jpeg.identifier { try FileManager.default.copyItem(at: url, to: out); return }\n      try clear(out)\n'),
      'the original read and written out': swap('      try clear(out)\n', '      try Data(contentsOf: url).write(to: out)\n      try clear(out)\n'),
      'image index 0': swap('let index = CGImageSourceGetPrimaryImageIndex(source)', 'let index = 0'),
      'no format allowlist': swap(', allowedTypes.contains(type)', ''),
      'PDF in the allowlist': swap('UTType.png.identifier]', 'UTType.png.identifier, UTType.pdf.identifier]'),
      'no pixel cap': swap(', pixels <= maxPixels', ''),
      'the cap raised': swap('maxPixels = 150_000_000', 'maxPixels = Int.max'),
      'the limit raised': swap('longestSide = 4096', 'longestSide = 16384'),
      'an unchecked multiply': swap('let (pixels, overflow) = width.multipliedReportingOverflow(by: height)', 'let (pixels, overflow) = (width * height, false)'),
      'the cache flag on': swap('[kCGImageSourceShouldCache: false] as CFDictionary', '[kCGImageSourceShouldCache: true] as CFDictionary'),
      'cached decode': swap('kCGImageSourceShouldCache: false,\n        kCGImageSourceThumbnailMaxPixelSize', 'kCGImageSourceShouldCacheImmediately: true,\n        kCGImageSourceThumbnailMaxPixelSize'),
      'no autorelease pool': swap('    try autoreleasepool {\n', '    do {\n'),
      'a picker over the photo library': swap('var configuration = PHPickerConfiguration()', 'var configuration = PHPickerConfiguration(photoLibrary: .shared())'),
      'a library authorization': swap('    let picker = PHPickerViewController', '    PHPhotoLibrary.requestAuthorization(for: .readWrite) { _ in }\n    let picker = PHPickerViewController'),
      'a camera request': swap('    let picker = PHPickerViewController', '    AVCaptureDevice.requestAccess(for: .video) { _ in }\n    let picker = PHPickerViewController'),
      'code after "file://" on a line': swap('    let picker = PHPickerViewController', '    let scheme = "file://"; PHPhotoLibrary.requestAuthorization(for: .readWrite) { _ in }\n    let picker = PHPickerViewController'),
      'a log line': swap('      let index = CGImageSourceGetPrimaryImageIndex', '      print(sourceUri)\n      let index = CGImageSourceGetPrimaryImageIndex'),
      "ExpoModulesCore's log": swap('      let index = CGImageSourceGetPrimaryImageIndex', '      log.info(sourceUri)\n      let index = CGImageSourceGetPrimaryImageIndex'),
      'a raw error out of reencodeUpright': swap(reencodeCatch, '} catch {\n        throw error\n      }'),
      'the two codes swapped between functions': swap('<pick>', reencodeCatch, swap(reencodeCatch, pickCatch, swap(pickCatch, '<pick>'))),
      'the two codes swapped in their names': swap('ScribePhotoException("photo_pick_failed") }\n  static var reencode: ScribePhotoException { ScribePhotoException("photo_reencode_failed")', 'ScribePhotoException("photo_reencode_failed") }\n  static var reencode: ScribePhotoException { ScribePhotoException("photo_pick_failed")'),
      'a third code': swap('ScribePhotoException("photo_pick_failed")', 'ScribePhotoException("photo_pick_cancelled")'),
      'a second picker while one is open': swap('    guard PickerSession.current == nil else { throw ScribePhotoException.pick }\n', ''),
      'a session never released': swap('    if PickerSession.current === self { PickerSession.current = nil }\n', ''),
      'no watchdog': swap('          session.refuse()\n', ''),
      'a longer watchdog': swap('presentTimeout: TimeInterval = 2.0', 'presentTimeout: TimeInterval = 60.0'),
      'a watchdog that never fires': swap('!session.shown, host?.presentingViewController == nil', 'false'),
      'a presentation that never reports': swap('          session.shown = true\n', ''),
      'an unchecked pick destination': swap('let out = try ScribePhotoModule.fileIn("ImagePicker", destination)', 'let out = URL(string: destination)!'),
      'an unchecked re-encode source': swap('let url = try fileIn("ImagePicker", sourceUri)', 'let url = URL(string: sourceUri)!'),
      'the JPEG written into the picker folder': swap('fileIn("ScribePhoto", destinationUri)', 'fileIn("ImagePicker", destinationUri)'),
      'any name': swap('[0-9A-Za-z-]{1,64}', '.{1,200}'),
      'a prefix match': swap('file.deletingLastPathComponent().resolvingSymlinksInPath().path == home.resolvingSymlinksInPath().path', 'file.path.hasPrefix(home.path)'),
      'dot segments kept': swap('let file = url.standardizedFileURL', 'let file = url'),
      "a folder made where JavaScript says": swap('    let file = url.standardizedFileURL\n', '    let file = url.standardizedFileURL\n    try fm.createDirectory(at: file.deletingLastPathComponent(), withIntermediateDirectories: true)\n'),
      'whatever is there removed before the copy': swap('          try ScribePhotoModule.clear(out)\n', '          if FileManager.default.fileExists(atPath: out.path) { try FileManager.default.removeItem(at: out) }\n'),
      'a folder made room for': swap('    guard attributes[.type] as? FileAttributeType == .typeRegular else { throw Refused() }\n', ''),
      'whatever is there removed after a failed JPEG': swap('        removeIfFile(out)\n        throw', '        try? FileManager.default.removeItem(at: out)\n        throw'),
      'a partial original kept': swap('          ScribePhotoModule.removeIfFile(out)\n', ''),
      // Round 3: the sheet, the stale session and the lifecycle lines (review A must-fix and note 3, review B N-P1).
      'the picker presented without its sheet': swap('presenter.present(host, animated: true)', 'presenter.present(picker, animated: true)'),
      'a sheet dismissed by code never answers': swap('    super.viewDidDisappear(animated)\n    session.cancel()\n', '    super.viewDidDisappear(animated)\n'),
      'a stale session kept': swap('    if let open = PickerSession.current, open.shown, open.host?.presentingViewController == nil { open.cancel() }\n', ''),
      'a stale session refused, not answered': swap('{ open.cancel() }', '{ open.refuse() }'),
      'a late sheet left up': swap('          if session.answered { host.dismiss(animated: true) }\n', ''),
      'nothing claims the slot': swap('    PickerSession.current = self\n', ''),
      'no picker delegate': swap('        picker.delegate = session\n', ''),
      'a sheet that does not know its session': swap('        session.host = host\n', ''),
      'the picker not embedded': swap('    view.addSubview(picker.view)\n', ''),
      'the sheet left up after a pick': swap('    host?.dismiss(animated: true)\n', ''),
      'a second resume': swap('    self.continuation = nil\n', ''),
      'the copy to an unchecked uri': swap('copyPicked(from: provider, to: out)', 'copyPicked(from: provider, to: URL(string: destination)!)'),
      'the unchecked url used': swap('    return file\n', '    return url\n'),
      'a name with a trailing line break': swap(String.raw`\\z"`, '$"'),
      'the re-encode on the shared queue': swap('    }.runOnQueue(ScribePhotoModule.reencodeQueue)\n', '    }\n'),
      'the re-encode on the main queue': swap('.runOnQueue(ScribePhotoModule.reencodeQueue)', '.runOnQueue(.main)'),
      'the original moved over the JPEG': swap('      CGImageDestinationAddImage(dest, image, write as CFDictionary)\n', '      CGImageDestinationAddImage(dest, image, write as CFDictionary)\n      _ = try? FileManager.default.replaceItemAt(out, withItemAt: url)\n'),
      'POSIX rename': swap('      try clear(out)\n', '      _ = rename(url.path, out.path)\n      try clear(out)\n'),
      'POSIX link': swap('      try clear(out)\n', '      _ = link(url.path, out.path)\n      try clear(out)\n'),
      'a CoreImage write': swap('      try clear(out)\n', '      try CIContext().writeJPEGRepresentation(of: CIImage(cgImageSource: source, index: index), to: out, colorSpace: CGColorSpaceCreateDeviceRGB())\n      try clear(out)\n'),
      'log on a continuation line': swap('      let index = CGImageSourceGetPrimaryImageIndex', '      log\n        .info(sourceUri)\n      let index = CGImageSourceGetPrimaryImageIndex'),
      'log in parentheses': swap('      let index = CGImageSourceGetPrimaryImageIndex', '      (log).info(sourceUri)\n      let index = CGImageSourceGetPrimaryImageIndex'),
      'a third export': swap('    /// The destination file uri once an upright', '    Function("tidy") { (p: String) in _ = Darwin.remove(p) }\n\n    /// The destination file uri once an upright'),
      'a third async export': swap('    /// The destination file uri once an upright', '    AsyncFunction ("tidy") { (p: String) in try FileManager.default.removeItem(atPath: p) }\n\n    /// The destination file uri once an upright'),
      'a library picker written with spaces': swap('    configuration.filter = .images\n', '    configuration = PHPickerConfiguration (photoLibrary : .shared())\n    configuration.filter = .images\n'),
    };
    for (const [name, text] of Object.entries(mutants)) expect(swiftProblems(text).length, name).toBeGreaterThan(0);
    // A second source file in ios/ is compiled by the pod, so the list of scanned files must change.
    const extra = mkdtempSync(join(tmpdir(), 'scribe-photo-ios-'));
    try {
      writeFileSync(join(extra, 'ScribePhotoModule.swift'), swift);
      mkdirSync(join(extra, 'More'));
      writeFileSync(join(extra, 'More', 'Extra.swift'), 'import Photos\n');
      expect(compiledSources(extra)).toEqual(['More/Extra.swift', 'ScribePhotoModule.swift']);
    } finally {
      rmSync(extra, { recursive: true, force: true });
    }
  });
  it('[C8] the pod declares the frameworks the module imports and depends on ExpoModulesCore only; the config names one module', () => {
    const pod = readFileSync(join(dir, 'ios', 'ScribePhoto.podspec'), 'utf8');
    expect([...pod.matchAll(/s\.dependency '([^']+)'/g)].map((m) => m[1])).toEqual(['ExpoModulesCore']);
    expect(/s\.frameworks = (.*)/.exec(pod)?.[1]).toBe("'CoreGraphics', 'ImageIO', 'PhotosUI', 'UIKit', 'UniformTypeIdentifiers'");
    expect([...pod.matchAll(/s\.(\w*source_files|preserve_paths|resources?|resource_bundles) = (.*)/g)].map((m) => `${m[1]} = ${m[2]}`)).toEqual(['source_files = "**/*.{h,m,swift}"']);
    expect(pod).not.toMatch(/Debug|Release|configuration|vendored|xcframework/i); // nothing that differs by build configuration
    expect(JSON.parse(readFileSync(join(dir, 'expo-module.config.json'), 'utf8'))).toEqual({ platforms: ['apple'], apple: { modules: ['ScribePhotoModule'] } });
  });
  it('[NS-01-R22] no picker, camera or media-library package is a dependency: the system picker comes only through this module', () => {
    const app = JSON.parse(readFileSync(join(__dirname, '..', 'package.json'), 'utf8'));
    const lock = readFileSync(join(__dirname, '..', '..', '..', 'package-lock.json'), 'utf8');
    for (const name of ['expo-image-picker', 'expo-image-loader', 'expo-media-library', 'expo-camera', 'react-native-vision-camera', 'react-native-image-picker']) {
      expect(app.dependencies[name], name).toBeUndefined();
      expect(lock, name).not.toContain(`node_modules/${name}"`);
    }
  });
});
