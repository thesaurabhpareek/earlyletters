// NS-01-R37a to R37c, ruling T3 (BL-953): the stored copy is at most 4,032 px on the long side, a smaller picture keeps
// its own size, and every re-encode is an upright JPEG at quality 0.85. The native step cannot run in Node, so the
// re-encode is a stand-in that records what it was asked and hands back the size ImageIO would give: the long side
// capped at 4,032 and never enlarged (the Swift side is pinned as source text in photos-device.test.ts).
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { stripJpeg } from '../src/lib/photos/strip';
import { commitPhoto, STORED_LONG_SIDE_MAX } from '../src/lib/photos/session';
import type { OrientationBaker } from '../src/lib/photos/types';
import { deps, makeJpeg } from './photos-helpers';

const ONE = { entryId: 'e1', finalText: 'She laughed at the dog today.', text: null as string | null, sourceUri: 'file:///c/ImagePicker/p.jpg' };

/** A stand-in for the native re-encode: scales the long side to at most `cap`, keeps the aspect ratio, never enlarges. */
function standInBaker(cap = STORED_LONG_SIDE_MAX) {
  const calls: { width: number; height: number }[] = [];
  const baker: OrientationBaker = {
    async bake(original) {
      const s = stripJpeg(original);
      if (!s.ok || s.width === null || s.height === null) return null;
      calls.push({ width: s.width, height: s.height });
      const scale = Math.min(1, cap / Math.max(s.width, s.height));
      return makeJpeg({ width: Math.round(s.width * scale), height: Math.round(s.height * scale), seed: 9 });
    },
  };
  return { baker, calls };
}

describe('[NS-01-R37a] the stored copy is at most 4,032 px', () => {
  it('[NS-01-R37a] a 6,000 px picture is stored at exactly 4,032 px on the long side, aspect ratio unchanged', async () => {
    const { d, store } = deps();
    const { baker, calls } = standInBaker();
    const r = await commitPhoto({ ...d, orientation: baker }, { ...ONE, bytes: makeJpeg({ width: 6000, height: 4000 }) });
    expect(r.status).toBe('stored');
    expect(calls).toEqual([{ width: 6000, height: 4000 }]);
    const kept = store.get('e1');
    expect(kept && Math.max(kept.width ?? 0, kept.height ?? 0)).toBe(4032);
    expect(kept?.width).toBe(4032);
    expect(kept?.height).toBe(2688); // 6000:4000 is 3:2, and 4032 * 2 / 3 = 2688
  });

  it('[NS-01-R37a] a tall picture is capped on its long side too', async () => {
    const { d, store } = deps();
    const { baker } = standInBaker();
    expect((await commitPhoto({ ...d, orientation: baker }, { ...ONE, bytes: makeJpeg({ width: 3000, height: 8000 }) })).status).toBe('stored');
    expect(store.get('e1')?.height).toBe(4032);
  });

  it('[NS-01-R37a] without the native re-encode, an over-cap picture is not stored and the letter is untouched', async () => {
    const { d, files } = deps();
    const r = await commitPhoto(d, { ...ONE, bytes: makeJpeg({ width: 6000, height: 4000 }) });
    expect(r).toEqual({ status: 'unreadable', reason: 'too_large' });
    expect(files.disk.size).toBe(0);
  });

  it('[NS-01-R37a] a re-encode that comes back over the cap is never stored', async () => {
    const { d, files } = deps();
    const { baker } = standInBaker(4096); // the old native limit
    const r = await commitPhoto({ ...d, orientation: baker }, { ...ONE, bytes: makeJpeg({ width: 6000, height: 4000 }) });
    expect(r).toEqual({ status: 'unreadable', reason: 'too_large' });
    expect(files.disk.size).toBe(0);
  });
});

describe('[NS-01-R37b] the stored copy is never upscaled', () => {
  it('[NS-01-R37b] an upright 3,000 px JPEG keeps its own pixel size and skips the re-encode (T3 open item O-1)', async () => {
    const { d, store } = deps();
    const { baker, calls } = standInBaker();
    expect((await commitPhoto({ ...d, orientation: baker }, { ...ONE, bytes: makeJpeg({ width: 3000, height: 2000, exif: true }) })).status).toBe('stored');
    expect(calls).toEqual([]);
    expect([store.get('e1')?.width, store.get('e1')?.height]).toEqual([3000, 2000]);
  });

  it('[NS-01-R37b] a JPEG of exactly 4,032 px is stored as it is', async () => {
    const { d, store } = deps();
    const { baker, calls } = standInBaker();
    expect((await commitPhoto({ ...d, orientation: baker }, { ...ONE, bytes: makeJpeg({ width: 4032, height: 3024 }) })).status).toBe('stored');
    expect(calls).toEqual([]);
    expect(store.get('e1')?.width).toBe(4032);
  });

  it('[NS-01-R37b] a sideways 2,000 px picture is turned but not enlarged', async () => {
    const { d, store } = deps();
    const { baker, calls } = standInBaker();
    expect((await commitPhoto({ ...d, orientation: baker }, { ...ONE, bytes: makeJpeg({ width: 2000, height: 1500, exif: true, orientation: 6 }) })).status).toBe('stored');
    expect(calls).toEqual([{ width: 2000, height: 1500 }]);
    expect(store.get('e1')?.width).toBe(2000);
  });
});

describe('[NS-01-R37c] re-encodes are upright JPEG at 0.85', () => {
  it('[NS-01-R37c] an upright 5,000 px JPEG goes through the re-encode, not stored at full size', async () => {
    const { d, store } = deps();
    const { baker, calls } = standInBaker();
    expect((await commitPhoto({ ...d, orientation: baker }, { ...ONE, bytes: makeJpeg({ width: 5000, height: 3750 }) })).status).toBe('stored');
    expect(calls).toEqual([{ width: 5000, height: 3750 }]);
    expect(store.get('e1')?.width).toBe(4032);
  });

  it('[NS-01-R37c] the native re-encode writes quality 0.85 with a 4,032 px limit (source read)', () => {
    const swift = readFileSync(join(__dirname, '../modules/scribe-photo/ios/ScribePhotoModule.swift'), 'utf8');
    expect(swift).toContain('  private static let quality = 0.85\n');
    expect(swift).toContain('  private static let longestSide = 4032\n');
    expect(swift).toContain('kCGImageDestinationLossyCompressionQuality: quality,');
    expect(swift).toContain('kCGImageSourceThumbnailMaxPixelSize: min(max(width, height), longestSide),');
  });
});

describe('[NS-01-R37a] a picture whose size cannot be read is not stored at that size', () => {
  /** makeJpeg with its frame header removed, so stripJpeg reads no size. */
  const noFrame = () => {
    const b = makeJpeg({ width: 6000, height: 4000 });
    const at = b.findIndex((v, i) => v === 0xff && b[i + 1] === 0xc0);
    const len = (b[at + 2] << 8) | b[at + 3];
    return Uint8Array.from([...b.slice(0, at), ...b.slice(at + 2 + len)]);
  };

  it('[NS-01-R37a] a JPEG with no frame size goes through the re-encode, or is refused without it', async () => {
    expect(stripJpeg(noFrame())).toMatchObject({ ok: true, width: null, height: null });
    const { d, files } = deps();
    expect(await commitPhoto(d, { ...ONE, bytes: noFrame() })).toEqual({ status: 'unreadable', reason: 'too_large' });
    expect(files.disk.size).toBe(0);
  });

  it('[NS-01-R37a] a second frame header cannot hide the first frame size', async () => {
    const big = makeJpeg({ width: 6000, height: 4000 });
    const at = big.findIndex((v, i) => v === 0xff && big[i + 1] === 0xda);
    const small = [0xff, 0xc0, 0, 11, 8, 0, 4, 0, 4, 1, 1, 0x11, 0];
    const two = Uint8Array.from([...big.slice(0, at), ...small, ...big.slice(at)]);
    expect(stripJpeg(two)).toMatchObject({ ok: true, width: 6000, height: 4000 });
    const { d, files } = deps();
    expect(await commitPhoto(d, { ...ONE, bytes: two })).toEqual({ status: 'unreadable', reason: 'too_large' });
    expect(files.disk.size).toBe(0);
  });
});
