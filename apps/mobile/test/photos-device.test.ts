/// <reference types="node" />
// Device-side pieces of Photo with a letter that run in Node: the picker adapter (C5, C6), the temporary originals
// (C7), the entry_media table (ADR 0028 D1) and the housekeeping sweep. The native parts are device checks in the PR.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { BAKE_TIMEOUT_MS, createOrientationBaker, type BakedFiles } from '../src/lib/photos/baker';
import { expoBakedFiles, expoPickedFiles, expoPhotoFiles, photosDirectory, withinFolder } from '../src/lib/photos/files';
import { androidContainer, createDisk, iosContainer, put, type Disk } from './helpers/expo-fs-standin';
import { makeJpeg } from './photos-helpers';

const h = vi.hoisted(() => ({ disk: null as unknown as Disk }));
vi.mock('expo-file-system', async () => (await import('./helpers/expo-fs-standin')).expoFileSystem(() => h.disk));

describe('[NX-39-R53][C7] the launch sweep empties Caches/ImagePicker and refuses to touch anything else', () => {
  beforeEach(() => {
    h.disk = createDisk(iosContainer('B81D7E44-NEW0-4A7F-8C21-ASHA00000001'));
  });
  it('[C7] 0 files remain in the picker folder after the sweep; other folders and files are untouched', async () => {
    const cache = h.disk.caches;
    put(h.disk, `${cache}ImagePicker/a.jpg`, 100);
    put(h.disk, `${cache}ImagePicker/b.heic`, 100);
    put(h.disk, `${cache}other/keep.bin`, 10);
    put(h.disk, `${h.disk.documents}ExpoAudio/take.m4a`, 10);
    await expoPickedFiles().sweep();
    expect([...h.disk.files.keys()].filter((u) => u.includes('/ImagePicker/'))).toEqual([]);
    expect([...h.disk.files.keys()].length).toBe(2);
  });
  it('[C9] on a phone with no picture, listing, removing and sweeping make no file and no folder', async () => {
    const files = [...h.disk.files.keys()];
    const dirs = [...h.disk.dirs].sort();
    expect(await expoPhotoFiles().list()).toEqual([]);
    await expoPhotoFiles().remove('m1.jpg');
    await expoPickedFiles().sweep();
    expect([...h.disk.files.keys()]).toEqual(files);
    expect([...h.disk.dirs].sort()).toEqual(dirs);
  });
  it('[C7] remove() only removes a file directly inside the picker folder', async () => {
    const cache = h.disk.caches;
    const inside = put(h.disk, `${cache}ImagePicker/a.jpg`, 10);
    const other = put(h.disk, `${h.disk.documents}ExpoAudio/take.m4a`, 10);
    const traversal = put(h.disk, `${cache}ImagePicker/../x.bin`, 10);
    const f = expoPickedFiles();
    await f.remove(other);
    await f.remove(traversal);
    expect(h.disk.files.has(other)).toBe(true);
    await f.remove(inside);
    expect(h.disk.files.has(inside)).toBe(false);
    await expect(f.read(other)).rejects.toThrow();
    expect(withinFolder(`${cache}ImagePicker/a.jpg`, `${cache}ImagePicker/`)).toBe(true);
    expect(withinFolder(`${cache}ImagePicker/sub/a.jpg`, `${cache}ImagePicker/`)).toBe(false);
    expect(withinFolder(`${cache}ImagePicker/..%2Fx`, `${cache}ImagePicker/`)).toBe(false);
    // judged on the decoded name (review N5): encoded dots and separators, and a malformed escape, never pass
    for (const rest of ['%2E%2E', '.%2E', '%2e%2e', '%2E', 'a%2Fb.img', 'a%5Cb.img', '%E0%A4%A', '.img', 'a.b.img', '']) {
      expect(withinFolder(`${cache}ImagePicker/${rest}`, `${cache}ImagePicker/`), rest).toBe(false);
    }
    expect(withinFolder(`${cache}ImagePicker/0194-ab.img`, `${cache}ImagePicker/`)).toBe(true);
  });
  it('[C9] the stored copy is <media_id>.jpg in Application Support/photos (not Documents): opaque name, refuses any path with a separator', async () => {
    const files = expoPhotoFiles();
    await files.write('0194-abc.jpg', Uint8Array.of(1, 2, 3));
    const support = h.disk.documents.replace(/Documents\/$/, 'Library/Application%20Support/');
    expect([...h.disk.files.keys()]).toEqual([`${support}photos/0194-abc.jpg`]);
    expect([...h.disk.files.keys()].some((u) => u.startsWith(h.disk.documents))).toBe(false);
    expect(await files.list()).toEqual(['0194-abc.jpg']);
    await expect(files.write('../x.jpg', Uint8Array.of(1))).rejects.toThrow();
    await expect(files.write('e1/m1.jpg', Uint8Array.of(1))).rejects.toThrow();
    await files.remove('0194-abc.jpg');
    expect(await files.list()).toEqual([]);
  });
  it('[C9] only the stored shape <id>.jpg is written or removed: ".", "..", ".jpg", a separator or another extension is refused, and the folder and its pictures survive (review M1)', async () => {
    const files = expoPhotoFiles();
    await files.write('0194-abc.jpg', Uint8Array.of(1, 2, 3));
    const folder = photosDirectory();
    // The stand-in joins as expo-file-system 57 does: `.` is the folder itself, and create({ overwrite }) would remove it.
    expect(new (await import('expo-file-system')).File(folder, '.').uri).toBe(folder.uri.replace(/\/$/, ''));
    for (const bad of ['.', '..', '.jpg', 'x.jpg.part', 'x.png', 'x.JPG', 'a/b.jpg', '%2E', '', `${'x'.repeat(65)}.jpg`]) {
      await expect(files.write(bad, Uint8Array.of(9)), bad).rejects.toThrow('photo_path_refused');
      await files.remove(bad);
      expect(folder.exists, bad).toBe(true);
      expect(await files.list(), bad).toEqual(['0194-abc.jpg']);
    }
  });
});


// ---- Application Support folder, the native step's temporary files ------------------------------------------------

describe('[C9] where the stored copy lives', () => {
  it('[C9] iOS: <container>/Library/Application Support/photos, beside Documents; Android: the files folder', () => {
    h.disk = createDisk(iosContainer('B81D7E44-NEW0-4A7F-8C21-ASHA00000009'));
    expect(photosDirectory().uri).toBe(`${h.disk.documents.replace(/Documents\/$/, '')}Library/Application%20Support/photos/`);
    h.disk = createDisk(androidContainer());
    expect(photosDirectory().uri).toBe(`${h.disk.documents}photos/`);
  });
  it('[C9] any other container layout fails closed: no picture goes to Documents or anywhere unknown (review N10)', () => {
    h.disk = createDisk({ documents: 'file:///var/mobile/Containers/Data/Application/ASHA/Docs/', caches: 'file:///var/mobile/Containers/Data/Application/ASHA/Library/Caches/', os: 'ios' });
    expect(() => photosDirectory()).toThrow('photos_folder_unknown');
  });
});

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
  beforeEach(() => {
    h.disk = createDisk(iosContainer('B81D7E44-NEW0-4A7F-8C21-ASHA00000002'));
  });
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
  it('[C7] only a picked original is handed over, and an answer naming another file is never read (review N4)', async () => {
    const files = memoryBaked();
    const calls: string[] = [];
    const baker = createOrientationBaker({ reencodeUpright: async (s: string, d: string) => (calls.push(s), d) }, files)!;
    const other = 'file:///c/Documents/ExpoAudio/take.m4a';
    for (const uri of [other, 'file:///c/ScribePhoto/0194-a.jpg', 'file:///c/ImagePicker/../x.img', 'u']) expect(await baker.bake(Uint8Array.of(1), { uri }), uri).toBeNull();
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
  it('[C7] on the phone: only a plain file in Caches/ImagePicker counts as picked; the destination is a new name in Caches/ScribePhoto, the only folder read or emptied', async () => {
    const cache = h.disk.caches;
    const files = expoBakedFiles(() => '0194-out');
    expect(files.isPicked(`${cache}ImagePicker/0194-a.img`)).toBe(true);
    for (const uri of [`${h.disk.documents}ExpoAudio/take.m4a`, `${cache}ImagePicker/../x.img`, `${cache}ImagePicker/%2E%2E`, `${cache}ScribePhoto/0194-a.jpg`, `${cache}ImagePicker/sub/a.img`]) {
      expect(files.isPicked(uri), uri).toBe(false);
    }
    expect(files.destination()).toBe(`${cache}ScribePhoto/0194-out.jpg`);
    const out = put(h.disk, `${cache}ScribePhoto/0194-out.jpg`, makeJpeg());
    const other = put(h.disk, `${h.disk.documents}ExpoAudio/take.m4a`, 10);
    expect((await files.read(out)).length).toBeGreaterThan(10);
    await expect(files.read(other)).rejects.toThrow();
    await files.remove(other);
    await files.remove(out);
    expect([...h.disk.files.keys()]).toEqual([other]);
    expect(() => expoBakedFiles(() => '../x').destination()).toThrow();
  });
  it('[C7] the launch sweep empties Caches/ScribePhoto too', async () => {
    put(h.disk, `${h.disk.caches}ScribePhoto/left.jpg`, 10);
    put(h.disk, `${h.disk.caches}ImagePicker/left.jpg`, 10);
    await expoPickedFiles().sweep();
    expect([...h.disk.files.keys()].filter((u) => /ScribePhoto|ImagePicker/.test(u))).toEqual([]);
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
