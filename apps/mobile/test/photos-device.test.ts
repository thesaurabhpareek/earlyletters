/// <reference types="node" />
// Device-side pieces of Photo with a letter that run in Node: the picker adapter (C5, C6), the temporary originals
// (C7), the entry_media table (ADR 0028 D1) and the housekeeping sweep. The native parts are device checks in the PR.
import { readFileSync } from 'node:fs';
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

/** Every problem the scan finds in ScribePhotoModule.swift; empty when the module is what the reviews accepted. */
export function swiftProblems(swift: string): string[] {
  const code = swift.replace(/\/\/.*$/gm, ''); // code only; the comments name what is absent
  const out: string[] = [];
  const need = (re: RegExp, why: string) => void (re.test(code) || out.push(`missing: ${why}`));
  const never = (re: RegExp, why: string) => void (re.test(code) && out.push(`forbidden: ${why}`));
  const imports = [...code.matchAll(/^import (\w+)/gm)].map((m) => m[1]).sort();
  if (imports.join() !== 'ExpoModulesCore,Foundation,ImageIO,PhotosUI,UIKit,UniformTypeIdentifiers') out.push(`imports: ${imports.join()}`);
  // No permission, camera, library, location, network or logging, anywhere (NS-01-R2, R22; ITMS-90683; review N8).
  never(/requestAuthorization|requestAccess|authorizationStatus|AVCapture|AVFoundation|UIImagePickerController|PHPhotoLibrary|PHAsset|PHImageManager|PHFetch|photoLibrary:|CoreLocation|CLLocation|UsageDescription/, 'a permission, camera, library or location API');
  never(/URLSession|URLRequest|NWConnection|CFNetwork|NSURLConnection|WebKit/, 'a network API');
  never(/\bprint\(|debugPrint|NSLog|os_log|Logger\(/, 'logging');
  // The picker: Apple's out-of-process picker with no library, images only, one, the file as it is.
  if ((code.match(/PHPickerConfiguration\(/g) ?? []).length !== 1 || !/var configuration = PHPickerConfiguration\(\)\n/.test(code)) out.push('the picker configuration is not PHPickerConfiguration() with no library');
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
  const decodeAt = code.indexOf('CGImageSourceCreateThumbnailAtIndex(');
  for (const [re, why] of [[/allowedTypes\.contains\(type\)/, 'the format allowlist'], [/width \* height <= maxPixels/, 'the pixel cap']] as const) {
    const at = code.search(re);
    if (at < 0 || at > decodeAt) out.push(`missing before the decode: ${why}`);
  }
  // Source properties are read for the width and the height only.
  const props = [...code.matchAll(/\bprops\b(\?\[(\w+)\])?/g)];
  const reads = props.filter((m) => m[2]).map((m) => m[2]).sort();
  if (reads.join() !== 'kCGImagePropertyPixelHeight,kCGImagePropertyPixelWidth' || props.length !== 3) out.push(`source properties used beyond width and height: ${props.map((m) => m[0]).join(' ')}`);
  // The decode: from the full image, turned, not cached.
  const decode = /let decode: \[CFString: Any\] = \[([\s\S]*?)\n    \]/.exec(code)?.[1] ?? '';
  if (decode.replace(/\s+/g, ' ').trim() !== 'kCGImageSourceCreateThumbnailFromImageAlways: true, kCGImageSourceCreateThumbnailWithTransform: true, kCGImageSourceShouldCache: false, kCGImageSourceThumbnailMaxPixelSize: min(max(width, height), longestSide),') out.push(`decode options: ${decode.trim()}`);
  // The write: exactly one AddImage, of the decoded pixels, with exactly our three options and nothing else.
  const adds = code.match(/CGImageDestinationAdd\w*\([^)]*\)/g) ?? [];
  if (adds.join() !== 'CGImageDestinationAddImage(dest, image, write as CFDictionary)') out.push(`the image is added as: ${adds.join(' ; ')}`);
  const write = /let write: \[CFString: Any\] = \[([\s\S]*?)\n    \]/.exec(code)?.[1] ?? '';
  if (write.replace(/\s+/g, ' ').trim() !== 'kCGImageDestinationLossyCompressionQuality: quality, kCGImageMetadataShouldExcludeGPS: true, kCGImageMetadataShouldExcludeXMP: true,') out.push(`write options: ${write.trim()}`);
  never(/\bwrite\[|var write\b/, 'a changed write dictionary');
  never(/AddImageAndMetadata|AddImageFromSource|CopyImageSource|CGImageDestinationSetProperties|AuxiliaryData|kCGImageAuxiliary|EmbedThumbnail|PreserveGainMap|MergeMetadata|kCGImageDestinationMetadata|CopyMetadataAtIndex|ShouldCacheImmediately/, 'a metadata, auxiliary-data or thumbnail path');
  never(/kCGImageProperty(?!PixelWidth\]|PixelHeight\])\w+/, 'a source property other than the pixel size');
  // Errors: each exported function maps every failure to its one closed code (N3); the codes are fixed strings.
  const codes = [...code.matchAll(/ScribePhotoException\("([^"]+)"\)/g)].map((m) => m[1]).sort();
  if (codes.join() !== 'photo_pick_failed,photo_reencode_failed') out.push(`codes: ${codes.join()}`);
  need(/final class ScribePhotoException: Exception, @unchecked Sendable \{/, 'a Sendable exception with an explicit code');
  need(/override var code: String \{ codeValue \}/, 'the explicit code');
  never(/localizedDescription|\\\(error|description:/, 'error text in a message');
  const fns = [...code.matchAll(/AsyncFunction\("(\w+)"\) \{[^\n]* in\n/g)];
  if (fns.map((m) => m[1]).join() !== 'pickOne,reencodeUpright') out.push(`functions: ${fns.map((m) => m[1]).join()}`);
  for (const m of fns) {
    const body = code.slice(m.index! + m[0].length, code.indexOf('\n    }\n', m.index!));
    if (!/^ {6}do \{\n[\s\S]*\n {6}\} catch \{\n {8}throw ScribePhotoException\.(pick|reencode)\n {6}\}$/.test(body)) out.push(`${m[1]}: a failure can leave without its closed code`);
  }
  return out;
}

describe('[C8] the Swift module: Apple\'s picker and ImageIO, nothing else', () => {
  const dir = join(__dirname, '..', 'modules', 'scribe-photo');
  const swift = readFileSync(join(dir, 'ios', 'ScribePhotoModule.swift'), 'utf8');
  it('[NS-01-R2][NS-01-R22][C8] the module passes the scan: no permission request, camera, library, network or log; the picker has no library; the write carries only our three options', () => {
    expect(swiftProblems(swift)).toEqual([]);
  });
  it('[C8] positive control: each mutation the reviews tried, and each banned call, makes the scan fail', () => {
    const swap = (a: string, b: string) => {
      expect(swift, a).toContain(a);
      return swift.replace(a, b);
    };
    const writeDict = 'kCGImageMetadataShouldExcludeXMP: true,\n';
    const mutants: Record<string, string> = {
      'source properties into AddImage': swap('CGImageDestinationAddImage(dest, image, write as CFDictionary)', 'CGImageDestinationAddImage(dest, image, props as CFDictionary?)'),
      'Exif in the write options': swap(writeDict, `${writeDict}      kCGImagePropertyExifDictionary: [:],\n`),
      'GPS in the write options': swap(writeDict, `${writeDict}      kCGImagePropertyGPSDictionary: [:],\n`),
      'TIFF in the write options': swap(writeDict, `${writeDict}      kCGImagePropertyTIFFDictionary: [:],\n`),
      'an embedded thumbnail': swap(writeDict, `${writeDict}      kCGImageDestinationEmbedThumbnail: true,\n`),
      'the gain map kept': swap(writeDict, `${writeDict}      kCGImageDestinationPreserveGainMap: true,\n`),
      'auxiliary data': swap('    guard CGImageDestinationFinalize(dest)', '    CGImageDestinationAddAuxiliaryDataInfo(dest, kCGImageAuxiliaryDataTypeDepth, [:] as CFDictionary)\n    guard CGImageDestinationFinalize(dest)'),
      'image and metadata': swap('CGImageDestinationAddImage(dest, image, write as CFDictionary)', 'CGImageDestinationAddImageAndMetadata(dest, image, nil, write as CFDictionary)'),
      'another source property read': swap('    let height = (props?', '    let gps = props?[kCGImagePropertyGPSDictionary]\n    let height = (props?'),
      'image index 0': swap('let index = CGImageSourceGetPrimaryImageIndex(source)', 'let index = 0'),
      'no format allowlist': swap(', allowedTypes.contains(type)', ''),
      'no pixel cap': swap(', width * height <= maxPixels', ''),
      'cached decode': swap('kCGImageSourceShouldCache: false,\n      kCGImageSourceThumbnailMaxPixelSize', 'kCGImageSourceShouldCacheImmediately: true,\n      kCGImageSourceThumbnailMaxPixelSize'),
      'a picker over the photo library': swap('var configuration = PHPickerConfiguration()', 'var configuration = PHPickerConfiguration(photoLibrary: .shared())'),
      'a library authorization': swap('    let picker = PHPickerViewController', '    PHPhotoLibrary.requestAuthorization(for: .readWrite) { _ in }\n    let picker = PHPickerViewController'),
      'a camera request': swap('    let picker = PHPickerViewController', '    AVCaptureDevice.requestAccess(for: .video) { _ in }\n    let picker = PHPickerViewController'),
      'a log line': swap('    let index = CGImageSourceGetPrimaryImageIndex', '    print(sourceUri)\n    let index = CGImageSourceGetPrimaryImageIndex'),
      'a raw error out of reencodeUpright': swap('      } catch {\n        throw ScribePhotoException.reencode\n      }', '      } catch {\n        throw error\n      }'),
      'a third code': swap('ScribePhotoException("photo_pick_failed")', 'ScribePhotoException("photo_pick_cancelled")'),
    };
    for (const [name, text] of Object.entries(mutants)) expect(swiftProblems(text).length, name).toBeGreaterThan(0);
  });
  it('[C8] the pod declares the frameworks the module imports and depends on ExpoModulesCore only; the config names one module', () => {
    const pod = readFileSync(join(dir, 'ios', 'ScribePhoto.podspec'), 'utf8');
    expect([...pod.matchAll(/s\.dependency '([^']+)'/g)].map((m) => m[1])).toEqual(['ExpoModulesCore']);
    expect(/s\.frameworks = (.*)/.exec(pod)?.[1]).toBe("'CoreGraphics', 'ImageIO', 'PhotosUI', 'UIKit', 'UniformTypeIdentifiers'");
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
