/// <reference types="node" />
// Device-side pieces of Photo with a letter that run in Node: the picker adapter (C5, C6), the temporary originals
// (C7), the entry_media table (ADR 0028 D1) and the housekeeping sweep. The native parts are device checks in the PR.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createOrientationBaker } from '../src/lib/photos/baker';
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
});

// ---- Application Support folder, the native step's temporary files ------------------------------------------------

describe('[SEC-R15][C9] where the stored copy lives', () => {
  it('[C9] iOS: <container>/Library/Application Support/photos, beside Documents; Android: the files folder', () => {
    h.disk = createDisk(iosContainer('B81D7E44-NEW0-4A7F-8C21-ASHA00000009'));
    expect(photosDirectory().uri).toBe(`${h.disk.documents.replace(/Documents\/$/, '')}Library/Application%20Support/photos/`);
    h.disk = createDisk(androidContainer());
    expect(photosDirectory().uri).toBe(`${h.disk.documents}photos/`);
  });
});

describe('[NX-39-R53][C7] the native step\'s temporary JPEG is read once and removed', () => {
  beforeEach(() => {
    h.disk = createDisk(iosContainer('B81D7E44-NEW0-4A7F-8C21-ASHA00000002'));
  });
  it('[C7] the baker reads the output, removes it, drops native error text, and refuses a missing uri or module', async () => {
    const out = put(h.disk, `${h.disk.caches}ScribePhoto/x.jpg`, makeJpeg());
    const baker = createOrientationBaker({ reencodeUpright: async () => out }, expoBakedFiles())!;
    const bytes = await baker.bake(Uint8Array.of(1), { uri: 'file:///c/ImagePicker/a.jpg' });
    expect(bytes && bytes.length).toBeGreaterThan(10);
    expect(h.disk.files.has(out)).toBe(false);
    expect(await baker.bake(Uint8Array.of(1))).toBeNull(); // no uri: nothing to re-encode
    expect(createOrientationBaker(null, expoBakedFiles())).toBeUndefined();
    const log: string[] = [];
    const bad = createOrientationBaker({ reencodeUpright: async () => { throw new Error('CANARY /private/var/IMG_1.HEIC'); } }, expoBakedFiles())!;
    expect(await bad.bake(Uint8Array.of(1), { uri: 'u' })).toBeNull();
    expect(log.join('')).not.toContain('CANARY');
    // an output outside Caches/ScribePhoto is never read or deleted
    const other = put(h.disk, `${h.disk.documents}ExpoAudio/take.m4a`, 10);
    const sneaky = createOrientationBaker({ reencodeUpright: async () => other }, expoBakedFiles())!;
    expect(await sneaky.bake(Uint8Array.of(1), { uri: 'u' })).toBeNull();
    expect(h.disk.files.has(other)).toBe(true);
  });
  it('[C7] the launch sweep empties Caches/ScribePhoto too', async () => {
    put(h.disk, `${h.disk.caches}ScribePhoto/left.jpg`, 10);
    put(h.disk, `${h.disk.caches}ImagePicker/left.jpg`, 10);
    await expoPickedFiles().sweep();
    expect([...h.disk.files.keys()].filter((u) => /ScribePhoto|ImagePicker/.test(u))).toEqual([]);
  });
});

describe('[NS-01-R6][C8] the Swift module is ImageIO only', () => {
  const dir = join(__dirname, '..', 'modules', 'scribe-photo');
  const swift = readFileSync(join(dir, 'ios', 'ScribePhotoModule.swift'), 'utf8');
  const strip = swift.replace(/\/\/.*$/gm, ''); // code only; the comments name what is absent
  it('[NS-01-R6][C8] no network, library, camera, location or permission API appears; only ImageIO', () => {
    expect(strip).not.toMatch(/URLSession|URLRequest|NWConnection|CFNetwork|Photos|PHPhoto|PHPicker|UIImagePicker|AVCapture|AVFoundation|CoreLocation|CLLocation|requestAuthorization|UsageDescription|NSURLConnection|WebKit|UIKit/);
    expect([...strip.matchAll(/^import (\w+)/gm)].map((m) => m[1]).sort()).toEqual(['ExpoModulesCore', 'Foundation', 'ImageIO', 'UniformTypeIdentifiers']);
  });
  it('[NS-01-R6][C8] it asks ImageIO for the transformed, from-image-always thumbnail, copies no source properties, and never writes an orientation', () => {
    expect(strip).toMatch(/kCGImageSourceCreateThumbnailWithTransform: true/);
    expect(strip).toMatch(/kCGImageSourceCreateThumbnailFromImageAlways: true/);
    expect(strip).toMatch(/kCGImageMetadataShouldExcludeGPS: true/);
    expect(strip).toMatch(/kCGImageMetadataShouldExcludeXMP: true/);
    expect(strip).not.toMatch(/kCGImagePropertyOrientation|kCGImageDestinationMetadata|CGImageDestinationAddImageFromSource|CGImageDestinationCopyImageSource|kCGImagePropertyExif|kCGImagePropertyGPS/);
    expect(strip.match(/CGImageDestinationAddImage\(/g)?.length).toBe(1);
  });
  it('[NS-01-R6][C8] errors are one closed code and the pod depends on ExpoModulesCore only', () => {
    expect(strip).toMatch(/"photo_reencode_failed"/);
    expect(strip).not.toMatch(/localizedDescription|\\\(error|description:/);
    const pod = readFileSync(join(dir, 'ios', 'ScribePhoto.podspec'), 'utf8');
    expect([...pod.matchAll(/s\.dependency '([^']+)'/g)].map((m) => m[1])).toEqual(['ExpoModulesCore']);
    expect(JSON.parse(readFileSync(join(dir, 'expo-module.config.json'), 'utf8')).apple.modules).toEqual(['ScribePhotoModule']);
  });
});
