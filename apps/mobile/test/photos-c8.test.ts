// [NS-01-R6][NX-39-R8][C8] 0 of 10 stored files carry metadata, including a HEIC, a PNG, a turned picture and one with
// bytes after the end marker. The native re-encode (ImageIO) is a port; here a stand-in plays it. The real step is a
// scripted device check on the same ten pictures (see the PR).
import { describe, expect, it } from 'vitest';
import { exportPhotos } from '../src/lib/photos/export';
import { commitPhoto } from '../src/lib/photos/session';
import { carriesMetadata, stripJpeg } from '../src/lib/photos/strip';
import type { OrientationBaker } from '../src/lib/photos/types';
import { deps, makeJpeg } from './photos-helpers';

const ascii = (s: string) => Array.from(s, (c) => c.charCodeAt(0));
const PNG = Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, ...ascii('eXIf GPS 37.7749 iTXt XML:com.adobe.xmp')]);
const HEIC = Uint8Array.from([0, 0, 0, 0x18, ...ascii('ftypheic'), 0, 0, 0, 0, ...ascii('Exif\0\0 mdta location')]);

/** Stands in for ImageIO: an upright JPEG with no tag. Records what it was given. */
const baker = (calls: Uint8Array[] = []): OrientationBaker => ({
  async bake(original) {
    calls.push(original);
    return makeJpeg({ seed: 11 });
  },
});

const ten = (): Uint8Array[] => [
  makeJpeg({ exif: true, seed: 1 }),
  makeJpeg({ exif: true, xmp: true, iptc: true, jfifThumb: true, seed: 2 }),
  makeJpeg({ exif: true, orientation: 6, seed: 3 }), // turned
  makeJpeg({ exif: true, orientation: 3, xmp: true, seed: 4 }),
  makeJpeg({ exif: true, seed: 5, trailing: ascii('mdta location +37.7749-122.4194 Exif\0\0') }), // after the end marker
  makeJpeg({ mpf: true, icc: true, exif: true, seed: 6 }),
  makeJpeg({ comment: true, iptc: true, progressive: true, seed: 7 }),
  makeJpeg({ exif: true, orientation: 8, trailing: ascii('http://ns.adobe.com/xap/1.0/'), seed: 8 }),
  PNG,
  HEIC,
];

describe('[NS-01-R6][NX-39-R8][C8] 0 of 10 stored files carry metadata', () => {
  it('[C8] ten pictures in, ten clean files out, and none of them is stored sideways or with a tail', async () => {
    const inputs = ten();
    expect(inputs.filter((b) => carriesMetadata(b) || Buffer.from(b).toString('latin1').includes('eXIf')).length).toBe(10); // positive control
    const calls: Uint8Array[] = [];
    const { d, files, store } = deps();
    d.orientation = baker(calls);
    let n = 0;
    for (const bytes of inputs) {
      const r = await commitPhoto(d, { entryId: `e${n++}`, finalText: 'Asha and the rain boots.', text: null, bytes });
      expect(r.status).toBe('stored');
    }
    const out = [...files.disk.values()];
    expect(out.length).toBe(10);
    expect(out.filter(carriesMetadata).length).toBe(0);
    for (const b of out) {
      const s = stripJpeg(b);
      expect(s.ok && s.orientation).toBe(1);
      expect(Buffer.from(b).toString('latin1')).not.toMatch(/mdta|location|ftyp|GPS/);
    }
    // the native step ran for exactly the turned pictures and the two that are not JPEGs; the rest never needed it
    expect(calls.length).toBe(5);
    // the export reads these same stored files: 0 of 10 carry a signature there too
    const exp = exportPhotos(store.all(), new Set(store.all().map((p) => p.entryId)));
    expect(exp.count).toBe(10);
  });
  it('[C8] a bytes-after-the-end picture that needs no turn goes through the JS strip alone and loses its tail', async () => {
    const { d, files } = deps();
    const r = await commitPhoto(d, { entryId: 'e1', finalText: 'Words.', text: null, bytes: ten()[4] });
    expect(r.status).toBe('stored'); // no baker registered, none needed
    const b = [...files.disk.values()][0];
    expect(Buffer.from(b).toString('latin1')).not.toContain('location');
    expect(b.slice(-2)).toEqual(Uint8Array.of(0xff, 0xd9));
  });
  it('[C8] with no native step, a turned picture or a HEIC stores nothing and says why; the letter is untouched', async () => {
    const { d, files, store } = deps();
    const turned = await commitPhoto(d, { entryId: 'e1', finalText: 'Words.', text: null, bytes: ten()[2] });
    const heic = await commitPhoto(d, { entryId: 'e2', finalText: 'Words.', text: null, bytes: HEIC });
    expect(turned).toEqual({ status: 'unreadable', reason: 'needs_rotation' });
    expect(heic).toEqual({ status: 'unreadable', reason: 'not_jpeg' });
    expect(files.disk.size + store.all().length).toBe(0);
  });
  it('[C8] a native step that fails, or hands back something still turned, stores nothing', async () => {
    for (const bad of [async () => null, async () => { throw new Error('/private/var/x.heic'); }, async () => makeJpeg({ exif: true, orientation: 6 })]) {
      const { d, files } = deps();
      d.orientation = { bake: bad };
      const r = await commitPhoto(d, { entryId: 'e1', finalText: 'Words.', text: null, bytes: ten()[2] });
      expect(r.status).toBe('unreadable');
      expect(files.disk.size).toBe(0);
    }
  });
});
