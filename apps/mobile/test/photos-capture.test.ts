// NS-01 photo with a letter in Node, no phone: the strip and the metadata guard, backing out, the words rule, a second
// picture with its confirm and Undo, changes that never touch the words or the recording, the quiet day, the parent's own
// words and place, and failed picks. The real store, the caps against its CHECK and the erase paths run in
// photos-device, photos-phone and erase-all.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { newQuietMark } from '../src/components/book/quiet-day.logic';
import { carriesMetadata, stripJpeg } from '../src/lib/photos/strip';
import { addPhotoToLetter, editPhotoWords, removePhotoFromLetter, settlePhotoChange, undoPhotoChange } from '../src/lib/photos/attach';
import { cardLabelWithPhoto, photoChapters, photosLens } from '../src/lib/photos/lens';
import { photos } from '../src/lib/photos/copy';
import { canKeepWithPhoto, commitPhoto, PHOTO_FREE_MARGIN_BYTES, PhotoSession, runPick } from '../src/lib/photos/session';
import { normalizePhotoPlace, normalizePhotoText, photoA11yLabel } from '../src/lib/photos/text';
import { photoPath, UNDO_WINDOW_MS, type PhotoPicker } from '../src/lib/photos/types';
import { deps, makeJpeg, memoryFiles, tenFixtures } from './photos-helpers';

const ONE = { entryId: 'e1', finalText: 'She laughed at the dog today.', text: null as string | null };

describe('[NS-01-R6][NX-39-R8] the stored copy carries no metadata', () => {
  it('[NS-01-R6][NX-39-R8] 0 of 10 stored files carry an Exif, XMP or IPTC segment', async () => {
    const inputs = tenFixtures();
    expect(inputs.filter(carriesMetadata).length).toBe(10); // positive control: every fixture really carries some
    const { d, files } = deps();
    let i = 0;
    for (const bytes of inputs) {
      const r = await commitPhoto(d, { ...ONE, entryId: `e${i++}`, bytes });
      expect(r.status).toBe('stored');
    }
    const stored = [...files.disk.values()];
    expect(stored.length).toBe(10);
    expect(stored.filter(carriesMetadata).length).toBe(0);
    // and each is still a whole JPEG
    expect(stored.every((b) => stripJpeg(b).ok)).toBe(true);
  });
  it('[NS-01-R6] keeps the picture data and the colour profile, and drops the JFIF thumbnail', () => {
    const r = stripJpeg(makeJpeg({ exif: true, icc: true, jfifThumb: true, seed: 5 }));
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    const text = Buffer.from(r.bytes).toString('latin1');
    expect(text).toContain('ICC_PROFILE');
    expect(r.bytes.slice(-6)).toEqual(Uint8Array.of(0x15, 0x20, 0x30, 0x40, 0xff, 0xd9));
    expect(r.bytes[0]).toBe(0xff);
    expect(r.bytes[1]).toBe(0xd8);
  });
  it('[NS-01-R6] the JFIF thumbnail is gone: one APP0 left, the bare 16-byte JFIF header with a 0 by 0 thumbnail, and a JFXX thumbnail segment is dropped whole (#836 review B)', () => {
    /** The marker segments before the scan: [marker, the segment's bytes after the marker]. */
    const headers = (b: Uint8Array): [number, Uint8Array][] => {
      const out: [number, Uint8Array][] = [];
      for (let i = 2; i + 4 <= b.length && b[i + 1] !== 0xda; ) {
        const end = i + 2 + ((b[i + 2] << 8) | b[i + 3]);
        out.push([b[i + 1], b.slice(i + 2, end)]);
        i = end;
      }
      return out;
    };
    const base = makeJpeg({ jfifThumb: true, seed: 3 });
    const jfxx = [0xff, 0xe0, 0, 16, ...Array.from('JFXX\0', (c) => c.charCodeAt(0)), 0x10, 1, 2, 3, 4, 5, 6, 7, 8];
    const both = Uint8Array.from([...base.slice(0, 2), ...jfxx, ...base.slice(2)]);
    for (const input of [base, both]) {
      const r = stripJpeg(input);
      expect(r.ok).toBe(true);
      if (!r.ok) return;
      const app0 = headers(r.bytes).filter(([m]) => m === 0xe0);
      expect(app0.length).toBe(1);
      const seg = app0[0][1];
      expect([seg.length, seg[0] << 8 | seg[1], seg[14], seg[15]]).toEqual([16, 16, 0, 0]);
      expect(Buffer.from(r.bytes).toString('latin1')).not.toContain('JFXX');
    }
  });
  it('[NS-01-R6] reports what it cannot strip instead of keeping metadata: not a JPEG, or damaged', () => {
    expect(stripJpeg(Uint8Array.of(0x89, 0x50, 0x4e, 0x47))).toEqual({ ok: false, reason: 'not_jpeg' });
    expect(stripJpeg(makeJpeg().slice(0, 12))).toEqual({ ok: false, reason: 'corrupt' });
    expect(stripJpeg(makeJpeg().slice(0, -2))).toEqual({ ok: false, reason: 'corrupt' }); // no end marker: cut short
  });
  it('[NS-01-R6] a turned picture is not rejected by the strip: it reports its orientation for the native step', () => {
    const r = stripJpeg(makeJpeg({ exif: true, orientation: 6 }));
    expect(r.ok).toBe(true);
    expect(r.ok && r.orientation).toBe(6);
    expect(r.ok && carriesMetadata(r.bytes)).toBe(false);
  });
  it('[NS-01-R6][C8] stops at the first unescaped end marker and drops what follows (F1)', () => {
    const planted = Array.from(Buffer.from('....ftypmp42 mdta location +37.7749-122.4194 Exif\0\0 GPSLatitude', 'latin1'));
    for (const progressive of [false, true]) {
      const plain = stripJpeg(makeJpeg({ seed: 3, progressive }));
      const withTail = stripJpeg(makeJpeg({ seed: 3, progressive, trailing: planted }));
      expect(plain.ok && withTail.ok).toBe(true);
      if (!plain.ok || !withTail.ok) return;
      expect(Buffer.from(withTail.bytes).equals(Buffer.from(plain.bytes))).toBe(true); // byte for byte the same picture
      expect(Buffer.from(withTail.bytes).toString('latin1')).not.toMatch(/ftyp|mdta|location|GPSLatitude/);
      expect(carriesMetadata(withTail.bytes)).toBe(false);
    }
    // the escaped FF00 and the restart marker inside the data do not end it, and the second scan is kept
    const prog = stripJpeg(makeJpeg({ progressive: true, seed: 3 }));
    expect(prog.ok && Buffer.from(prog.bytes).toString('latin1')).toContain('\x31\x41\xff\xd9');
  });
});

describe('[NS-01-R6] the last guard reads marker segments, never the compressed picture', () => {
  it('[NS-01-R6] a clean picture whose compressed data happens to hold "8BIM" and "MPF" is stored; an Exif signature in a segment the strip keeps is still refused, and nothing is written (#836 reviews A N2, B Q5)', async () => {
    let x = 7;
    const noise = Array.from({ length: 4096 }, () => (x = (Math.imul(x, 1103515245) + 12345) >>> 0) >>> 24);
    const sigs = (s: string) => Array.from(s, (c) => c.charCodeAt(0));
    const scan = [...noise.slice(0, 2000), ...sigs('8BIM'), ...noise.slice(2000), ...sigs('MPF\0')].flatMap((v) => (v === 0xff ? [0xff, 0x00] : [v]));
    const base = makeJpeg();
    const sos = base.findIndex((v, i) => v === 0xff && base[i + 1] === 0xda);
    const clean = Uint8Array.from([...base.slice(0, sos + 2 + ((base[sos + 2] << 8) | base[sos + 3])), ...scan, 0xff, 0xd9]);
    expect([stripJpeg(clean).ok, carriesMetadata(clean)]).toEqual([true, false]);
    expect((await commitPhoto(deps().d, { ...ONE, bytes: clean })).status).toBe('stored');
    const exif = sigs('Exif\0\0MM');
    // An Exif signature inside a segment the strip keeps (an ICC profile) is still refused by the last guard.
    const icc = [...sigs('ICC_PROFILE\0'), ...exif];
    const planted = Uint8Array.from([0xff, 0xd8, 0xff, 0xe2, 0, icc.length + 2, ...icc, ...makeJpeg({ seed: 5 }).slice(2)]);
    const { d, files } = deps();
    expect((await commitPhoto(d, { ...ONE, bytes: planted })).status).toBe('failed');
    expect(files.disk.size).toBe(0);
  });
});

describe('[NS-01-R6][NX-39-R8] the strip is an allow list (privacy review B on #836)', () => {
  const sigs = (s: string) => Array.from(s, (c) => c.charCodeAt(0));
  const seg = (m: number, payload: number[]) => [0xff, m, (payload.length + 2) >> 8, (payload.length + 2) & 0xff, ...payload];
  const text = (b: Uint8Array) => Array.from(b, (c) => String.fromCharCode(c)).join('');
  it('[NS-01-R6] a synthetic JPEG with real Exif, GPS and XMP (and IPTC, a comment, a thumbnail): the output carries none of the three', () => {
    const src = makeJpeg({ exif: true, xmp: true, iptc: true, comment: true, jfifThumb: true, mpf: true, seed: 3 });
    const out = stripJpeg(src);
    expect(out.ok).toBe(true);
    if (!out.ok) return;
    const t = text(out.bytes);
    for (const needle of ['Exif', 'GPSLatitudeRef', '37.7749', 'iPhone', 'http://ns.adobe.com/xap', 'xmpmeta', 'Photoshop 3.0', '8BIM', 'taken at the park', 'MPF']) expect(t, needle).not.toContain(needle);
    expect(carriesMetadata(out.bytes)).toBe(false);
    expect(carriesMetadata(src)).toBe(true); // the judge is not blind
  });
  it('[NS-01-R6] reserved and unknown markers carrying a payload are dropped, not copied through: C8, DC, DE, DF, F0 to FD, 02, BF', () => {
    const payload = sigs('GPS 37.7749 -122.4194 secret');
    for (const m of [0xc8, 0xdc, 0xde, 0xdf, 0xf0, 0xf5, 0xfd, 0x02, 0xbf]) {
      const base = makeJpeg({ seed: 2 });
      const src = Uint8Array.from([0xff, 0xd8, ...seg(m, payload), ...base.slice(2)]);
      const out = stripJpeg(src);
      expect(out.ok, m.toString(16)).toBe(true);
      if (!out.ok) continue;
      expect(text(out.bytes), m.toString(16)).not.toContain('GPS');
      expect(carriesMetadata(out.bytes), m.toString(16)).toBe(false);
      expect(carriesMetadata(src), `judge ${m.toString(16)}`).toBe(true); // a marker outside the allow list is metadata to the judge
    }
  });
  it('[NS-01-R6] kept on purpose: the colour profile and the Adobe colour flag; an APP2 that is not a profile and an APP14 that is not Adobe are dropped', () => {
    const base = makeJpeg({ seed: 4 });
    const withApps = Uint8Array.from([0xff, 0xd8, ...seg(0xe2, [...sigs('ICC_PROFILE\0'), 1, 1, 9]), ...seg(0xee, sigs('Adobe\x00d\x00\x00\x00\x00\x01')), ...seg(0xee, sigs('Other secret')), ...seg(0xe2, sigs('FPXR secret')), ...base.slice(2)]);
    const out = stripJpeg(withApps);
    expect(out.ok).toBe(true);
    if (!out.ok) return;
    const t = text(out.bytes);
    expect(t).toContain('ICC_PROFILE');
    expect(t).toContain('Adobe');
    expect(t).not.toContain('secret');
  });
});

describe('[NS-01-R4][NX-39-R14] backing out writes nothing', () => {
  it('[NS-01-R4][NX-39-R14] backing out writes nothing', () => {
    const { store, files } = deps();
    const s = new PhotoSession();
    s.pick({ uri: 'picker://one' });
    s.setText('the swing');
    s.discard();
    expect(s.source).toBeNull();
    expect(store.puts + files.writes).toBe(0);
    expect(store.all()).toEqual([]);
  });
});

describe('[NS-01-R5a] a picture without words cannot be kept', () => {
  it('[NS-01-R5a] no words: Keep is off and commit writes nothing; words: it works', async () => {
    expect(canKeepWithPhoto('')).toBe(false);
    expect(canKeepWithPhoto('  \n ')).toBe(false);
    const { d, store, files } = deps();
    expect((await commitPhoto(d, { ...ONE, finalText: ' ', bytes: makeJpeg() })).status).toBe('needs_words');
    expect(store.puts + files.writes).toBe(0);
    expect(canKeepWithPhoto('She laughed.')).toBe(true);
    expect((await commitPhoto(d, { ...ONE, bytes: makeJpeg() })).status).toBe('stored');
  });
});

describe('[NS-01-R7] a second picture replaces only after confirm, with Undo', () => {
  it('[NS-01-R7] asks first, keeps the first until confirmed, and Undo inside 10 seconds restores it', async () => {
    const { d, store, files, clock } = deps();
    await commitPhoto(d, { ...ONE, bytes: makeJpeg({ seed: 1 }) });
    const first = store.get('e1')!;
    const ask = await addPhotoToLetter(d, { ...ONE, bytes: makeJpeg({ seed: 2 }) });
    expect(ask.status).toBe('needs_confirm');
    expect(store.get('e1')).toEqual(first);
    expect(files.disk.size).toBe(1);

    const done = await addPhotoToLetter(d, { ...ONE, bytes: makeJpeg({ seed: 2 }) }, true);
    expect(done.status).toBe('replaced');
    if (done.status !== 'replaced' || !done.ticket) throw new Error('no ticket');
    expect(store.get('e1')!.mediaId).not.toBe(first.mediaId);
    expect(files.disk.has(photoPath(first))).toBe(true); // the first file waits for the window
    clock.t += UNDO_WINDOW_MS - 1;
    expect(await undoPhotoChange(d, done.ticket)).toBe(true);
    expect(store.get('e1')).toEqual(first);
    expect(files.disk.size).toBe(1);
  });
  it('[NS-01-R7] after 10 seconds Undo is refused and settling removes the first file', async () => {
    const { d, store, files, clock } = deps();
    await commitPhoto(d, { ...ONE, bytes: makeJpeg({ seed: 1 }) });
    const first = store.get('e1')!;
    const done = await addPhotoToLetter(d, { ...ONE, bytes: makeJpeg({ seed: 2 }) }, true);
    if (done.status !== 'replaced' || !done.ticket) throw new Error('no ticket');
    clock.t += UNDO_WINDOW_MS + 1;
    expect(await undoPhotoChange(d, done.ticket)).toBe(false);
    await settlePhotoChange(d, done.ticket);
    expect(files.disk.has(photoPath(first))).toBe(false);
    expect(files.disk.size).toBe(1);
  });
  it('[NS-01-R7] remove is one tap with Undo for 10 seconds', async () => {
    const { d, store, files } = deps();
    await commitPhoto(d, { ...ONE, bytes: makeJpeg() });
    const before = store.get('e1')!;
    const ticket = removePhotoFromLetter(d, 'e1')!;
    expect(store.get('e1')).toBeNull();
    expect(files.disk.size).toBe(1);
    expect(await undoPhotoChange(d, ticket)).toBe(true);
    expect(store.get('e1')).toEqual(before);
  });
  it('[NS-01-R7] a replace that fails leaves the first picture in place', async () => {
    const files = memoryFiles();
    const { d, store } = deps({ files });
    await commitPhoto(d, { ...ONE, bytes: makeJpeg({ seed: 1 }) });
    const first = store.get('e1')!;
    const bad = await addPhotoToLetter(d, { ...ONE, bytes: Uint8Array.of(1, 2, 3) }, true);
    expect(bad.status).toBe('replaced');
    expect(store.get('e1')).toEqual(first);
    expect(files.disk.size).toBe(1);
  });
});

describe('[NS-01-R25] a quiet day cannot carry a picture', () => {
  it('[NS-01-R25] a "Not much today" mark is refused with 0 files and 0 rows, and its page draws no picture control', async () => {
    const mark = newQuietMark({ id: 'q1', occurredOn: '2026-06-12', capturedAt: '2026-06-12T20:00:00Z' });
    const { d, files, store } = deps();
    const r = await addPhotoToLetter(d, { entryId: mark.id, finalText: mark.finalText, bytes: makeJpeg(), text: null });
    expect(r.status === 'added' && r.result.status).toBe('needs_words');
    expect(files.writes + store.puts).toBe(0);
    // The letter page offers Add only on a letter with words; a mark has none (D-084), so it draws nothing.
    const page = readFileSync(join(__dirname, '..', 'src', 'components', 'photos', 'letter-photo.tsx'), 'utf8');
    expect(page).toMatch(/const words = draft \|\| finalText\.trim\(\)\.length > 0;/);
    expect(page).toMatch(/return controls\.add \? \(/); // author and words, through letterPhotoControls
  });
});

describe('[NS-01-R9a][NS-01-R21a] the picture has the parent\'s words or a fixed label', () => {
  it('[NS-01-R21a][BL-957] the letter page keeps 140 and 60 characters a person sees: no maxLength on its fields (UTF-16 units), and editing caps by characters', async () => {
    const page = readFileSync(join(__dirname, '..', 'src', 'components', 'photos', 'letter-photo.tsx'), 'utf8');
    expect(page).not.toMatch(/maxLength/);
    const { d, store } = deps();
    await commitPhoto(d, { ...ONE, bytes: makeJpeg() });
    const ki = '\u0915\u093F';
    const family = '\u{1F468}\u200D\u{1F469}\u200D\u{1F467}';
    expect(editPhotoWords(d, 'e1', { text: ki.repeat(141), place: family.repeat(61) })).toBe(true);
    expect([store.get('e1')!.text, store.get('e1')!.place]).toEqual([ki.repeat(140), family.repeat(60)]);
  });
  it('[NS-01-R9a] the picture has a fixed label: no typed words, the label is "Photo with this letter"', () => {
    expect(photoA11yLabel(null)).toBe('Photo with this letter');
    expect(photoA11yLabel('   ')).toBe('Photo with this letter');
  });
  it('[NS-01-R21a] photo words and place are optional and capped: photo text is the parent\'s, optional and 140 characters', async () => {
    expect(normalizePhotoText(undefined)).toBeNull();
    expect(normalizePhotoText('x'.repeat(141))!.length).toBe(140);
    expect(normalizePhotoText('  Asha on the swing  ')).toBe('Asha on the swing');
    // counted in characters a person sees, not code units
    expect(normalizePhotoText('\u{1F600}'.repeat(141))!.length).toBe(280);
    expect(photoA11yLabel('Asha on the swing')).toBe('Asha on the swing');
    const { d, store } = deps();
    await commitPhoto(d, { ...ONE, bytes: makeJpeg(), text: null });
    expect(store.get('e1')!.text).toBeNull(); // never filled in or suggested
    await commitPhoto(d, { ...ONE, entryId: 'e2', bytes: makeJpeg(), text: 'y'.repeat(300) });
    expect(store.get('e2')!.text!.length).toBe(140);
  });
  it('[NS-01-R21a] the typed place is optional, at most 60 characters, the parent\'s only, and kept in its own field', async () => {
    expect(normalizePhotoPlace(undefined)).toBeNull();
    expect(normalizePhotoPlace('  ')).toBeNull();
    expect(normalizePhotoPlace('  Grandma\'s garden ')).toBe('Grandma\'s garden');
    expect(normalizePhotoPlace('p'.repeat(61))!.length).toBe(60);
    const { d, store } = deps();
    await commitPhoto(d, { ...ONE, bytes: makeJpeg({ exif: true }), text: 'Asha on the swing' }); // the file's own place is never read
    expect(store.get('e1')!.place).toBeNull();
    expect(store.get('e1')!.text).toBe('Asha on the swing');
    await commitPhoto(d, { ...ONE, entryId: 'e2', bytes: makeJpeg(), text: null, place: 'q'.repeat(90) });
    expect(store.get('e2')!.place!.length).toBe(60);
    expect(store.get('e2')!.text).toBeNull();
    const s = new PhotoSession();
    s.setPlace('  Park ');
    expect(s.place).toBe('Park');
    s.discard();
    expect(s.place).toBeNull();
  });
});

describe('[NS-01-R17a][NS-01-R17b][NS-01-R17c][NX-39-R12][NX-39-R13][NX-39-R14] failed picks leave nothing; iCloud and Live Photo behave', () => {
  const picker = (outcome: 'picked' | 'cancelled' | 'failed' | 'throws', extra: { progress?: number[]; paired?: boolean } = {}) => {
    const calls = { cancel: 0, permission: 0 };
    const p: PhotoPicker & { requestPermission?: () => void } = {
      open: ({ onProgress }) => {
        extra.progress?.forEach((f) => onProgress?.(f));
        return {
          cancel: () => void calls.cancel++,
          done:
            outcome === 'throws'
              ? Promise.reject(new Error('native'))
              : Promise.resolve(outcome === 'picked' ? { status: 'picked' as const, asset: { uri: 'picker://still', pairedVideoUri: extra.paired ? 'picker://clip' : null } } : { status: outcome }),
        };
      },
    };
    p.requestPermission = () => void calls.permission++;
    return { p, calls };
  };
  it('[NS-01-R17a] a cancel and a decode failure write 0 files', async () => {
    for (const o of ['cancelled', 'failed', 'throws'] as const) {
      const { p } = picker(o);
      const r = await runPick(p).done;
      expect(r.status).toBe(o === 'throws' ? 'failed' : o);
    }
    const { d, files, store } = deps();
    expect((await commitPhoto(d, { ...ONE, bytes: Uint8Array.of(0, 1, 2, 3) })).status).toBe('unreadable');
    expect(files.disk.size + store.all().length).toBe(0);
  });
  it('[NS-01-R17a] a full phone writes 0 files and the letter is not touched', async () => {
    const { d, files, store } = deps({ files: memoryFiles({ free: 10 }) });
    expect((await commitPhoto(d, { ...ONE, bytes: makeJpeg() })).status).toBe('no_space');
    expect(files.disk.size + store.all().length).toBe(0);
  });
  it('[NS-01-R45] a picture needs room plus 50 MB', async () => {
    const size = (stripJpeg(makeJpeg()) as { bytes: Uint8Array }).bytes.length;
    const short = deps({ files: memoryFiles({ free: size + PHOTO_FREE_MARGIN_BYTES - 1 }) });
    expect((await commitPhoto(short.d, { ...ONE, bytes: makeJpeg() })).status).toBe('no_space');
    expect(short.files.disk.size + short.store.all().length).toBe(0);
    const enough = deps({ files: memoryFiles({ free: size + PHOTO_FREE_MARGIN_BYTES }) });
    expect((await commitPhoto(enough.d, { ...ONE, bytes: makeJpeg() })).status).toBe('stored');
    expect(PHOTO_FREE_MARGIN_BYTES).toBe(50 * 1024 * 1024);
  });
  it('[NS-01-R17a] a write that fails halfway leaves 0 files and 0 rows', async () => {
    const { d, files, store } = deps({ files: memoryFiles({ failWrite: true }) });
    expect((await commitPhoto(d, { ...ONE, bytes: makeJpeg() })).status).toBe('failed');
    expect(files.disk.size + store.all().length).toBe(0);
  });
  it('[NS-01-R17b][NX-39-R13] an iCloud-only picture reports progress and Cancel reaches the picker', async () => {
    const seen: number[] = [];
    const { p, calls } = picker('cancelled', { progress: [0.2, 0.7] });
    const run = runPick(p, (f) => seen.push(f));
    run.cancel();
    expect(seen).toEqual([0.2, 0.7]);
    expect(calls.cancel).toBe(1);
    expect((await run.done).status).toBe('cancelled');
  });
  it('[NS-01-R17c] only the still of a Live Photo: [NX-39-R12] a Live Photo stores its still only, 1 file', async () => {
    const { p } = picker('picked', { paired: true });
    const r = await runPick(p).done;
    if (r.status !== 'picked') throw new Error('not picked');
    expect(r.asset).toEqual({ uri: 'picker://still' }); // the paired clip is not carried on
    const s = new PhotoSession();
    s.pick({ uri: 'picker://still', pairedVideoUri: 'picker://clip' });
    expect(s.source).toEqual({ uri: 'picker://still' });
    const { d, files } = deps();
    await commitPhoto(d, { ...ONE, bytes: makeJpeg() });
    expect(files.disk.size).toBe(1);
  });
  it('[NS-01-R2][NX-39-R2] the photo start asks no library question', async () => {
    const { p, calls } = picker('picked');
    await runPick(p).done;
    expect(calls.permission).toBe(0);
    expect(Object.keys(p).filter((k) => /permission|authori[sz]/i.test(k))).toEqual(['requestPermission']); // only the spy we added
  });
});

describe('[NS-01-R10a][NS-01-R10b][NS-01-R10c][NS-01-R11][NS-01-R12] the Photos lens', () => {
  const L = (id: string, over: object = {}) => ({ id, inBook: true, ...over });
  const P = (entryId: string, over: object = {}) => ({ entryId, mediaId: `m-${entryId}`, ext: 'jpg' as const, bytes: 1, sha256: 'x', width: 4, height: 4, text: null, place: null, addedAt: '2026-11-11T00:00:00Z', deletedAt: null, ...over });
  const ids = (lens: ReturnType<typeof photosLens>) => [...lens.photos.keys()].sort();

  it('[NS-01-R10a][NS-01-R10c] offered only when a kept, open letter has a picture; no empty state otherwise', () => {
    expect(photosLens([L('a')], [])).toEqual({ visible: false, photos: new Map() });
    expect(photosLens([L('a')], [P('a')]).visible).toBe(true);
    // a picture whose letter is not kept, a quiet day, a closed seal or a letter in Recently deleted does not count
    expect(photosLens([L('a', { inBook: false })], [P('a')]).visible).toBe(false);
    expect(photosLens([L('a', { kind: 'not_much' })], [P('a')]).visible).toBe(false);
    expect(photosLens([L('a')], [P('a')], { isClosedSeal: () => true }).visible).toBe(false);
    expect(photosLens([L('a')], [P('a', { deletedAt: '2026-11-12T00:00:00Z' })]).visible).toBe(false);
  });
  it('[NS-01-R10a] the Photos lens appears with the first picture', () => {
    expect(photosLens([L('a'), L('b')], []).visible).toBe(false);
    expect(photosLens([L('a'), L('b')], [P('a')]).visible).toBe(true); // the first picture of one kept, open letter
  });
  it('[NS-01-R10b] a sealed letter\'s picture waits', () => {
    // Only the closed seal's picture waits; an open letter's picture still counts. (No seal state exists on this phone yet:
    // lib/photos/seal.ts is the one seam, and the hook passes it.)
    const sealed = (id: string) => id === 's';
    const lens = photosLens([L('s'), L('o')], [P('s'), P('o')], { isClosedSeal: sealed });
    expect(ids(lens)).toEqual(['o']);
    expect(photosLens([L('s')], [P('s')], { isClosedSeal: sealed }).visible).toBe(false);
    const hook = readFileSync(join(__dirname, '..', 'src', 'lib', 'photos', 'hooks.ts'), 'utf8');
    expect(hook).toMatch(/photosLens\(letters, photoDeps\(\)\.store\.all\(\), \{ isClosedSeal \}\)/);
    expect(readFileSync(join(__dirname, '..', 'src', 'lib', 'photos', 'seal.ts'), 'utf8')).toMatch(/export const isClosedSeal = \(_entryId: string\): boolean => false;/);
  });
  it('[NS-01-R10c] no lens without a picture', () => {
    for (const letters of [[], [L('a')], [L('a', { inBook: false })]]) expect(photosLens(letters, []).visible).toBe(false);
    const book = readFileSync(join(__dirname, '..', 'src', 'app', '(tabs)', 'book.tsx'), 'utf8');
    expect(book).toMatch(/const lensOn = photoSurfaces\(\{ build: photosBuildEnabled\(\), paused: photosPausedNow\(\) \}\)\.lens && lens\.visible;/);
  });
  it('[NS-01-R11] the lens shows no count and no add control', () => {
    // Mutant "add a count to the header": any size, length or digit in the lens components' rendered strings fails these.
    const lensSrc = readFileSync(join(__dirname, '..', 'src', 'components', 'photos', 'photos-lens.tsx'), 'utf8');
    const book = readFileSync(join(__dirname, '..', 'src', 'app', '(tabs)', 'book.tsx'), 'utf8');
    expect(lensSrc).not.toMatch(/\.size\b|\.length\b|Add a photo|addPhoto|\+ /);
    expect(book).not.toMatch(/lens\.photos\.size|photos\.size\}/);
    expect(book).not.toMatch(/book\.lens[^\n]*(count|total)/i);
    for (const s of [photos.book.lens.label, photos.book.lens.months, photos.book.lens.photos]) expect(s).not.toMatch(/\d|\{count\}|\{n\}/);
    const lens = photosLens([L('a'), L('b'), L('c')], [P('a'), P('b'), P('c')]);
    expect(Object.keys(lens).sort()).toEqual(['photos', 'visible']); // no total anywhere
  });
  it('[review B on #840] the lens hook reads nothing while the switch is off, re-reads on letter changes only, keeps its object when nothing changed; the list resets on a lens switch; the card says one stop; the bar reads the list on screen', () => {
    const hook = readFileSync(join(__dirname, '..', 'src', 'lib', 'photos', 'hooks.ts'), 'utf8');
    const fn = hook.slice(hook.indexOf('export function usePhotosLens'));
    expect(fn.indexOf('if (!on || !childId) return EMPTY_LENS;')).toBeGreaterThan(-1);
    expect(fn.indexOf('if (!on || !childId) return EMPTY_LENS;')).toBeLessThan(fn.indexOf('photoDeps()')); // nothing read with the switch off
    expect(fn).toMatch(/subscribeTo\('entries', update\)/);
    expect(fn).toMatch(/sameLens\(prev, next\) \? prev : next/);
    const book = readFileSync(join(__dirname, '..', 'src', 'app', '(tabs)', 'book.tsx'), 'utf8');
    expect(book).toMatch(/compactMonth\(sections, topKey \?\? sections\[0\]\?\.key \?\? null\)/); // N4: not chapters[0]
    expect(book).not.toMatch(/chapters\[0\]/);
    expect(book).toMatch(/scrollTo\?\.\(\{ y: 0, animated: false \}\)/);
    expect(cardLabelWithPhoto('Tuesday, 3 March. She laughed.', 'Rain boots')).toBe('Tuesday, 3 March. She laughed. Rain boots');
    expect(cardLabelWithPhoto('She laughed', 'Rain boots')).toBe('She laughed. Rain boots');
    expect(cardLabelWithPhoto('She laughed!', 'Rain boots')).not.toMatch(/\.\.|!\./);
  });
  it('[NS-01-R11] lists the Book\'s own chapters, newest first, keeping only letters that have a picture, and keeps no count', () => {
    const lens = photosLens([L('a'), L('b'), L('c'), L('d')], [P('a'), P('b'), P('d')]);
    expect(ids(lens)).toEqual(['a', 'b', 'd']);
    // The Book's chapters, newest first as the Book reads; a chapter whose letters have no picture is dropped.
    const chapters = [
      { key: 'm7', data: [{ id: 'd' }, { id: 'c' }] },
      { key: 'm6', data: [{ id: 'x' }] },
      { key: 'm5', data: [{ id: 'b' }, { id: 'a' }] },
    ];
    expect(photoChapters(chapters, lens.photos).map((c) => [c.key, c.data.map((e) => e.id)])).toEqual([['m7', ['d']], ['m5', ['b', 'a']]]);
    expect(chapters[0].data.length).toBe(2); // the Book's own chapters are not changed
    expect(Object.keys(lens).sort()).toEqual(['photos', 'visible']); // no total anywhere
  });
  it('[NS-01-R12] the lens disappears quietly when the last picture goes', async () => {
    const { d, store } = deps();
    await commitPhoto(d, { ...ONE, bytes: makeJpeg() });
    const letters = [L('e1')];
    expect(photosLens(letters, store.all()).visible).toBe(true);
    removePhotoFromLetter(d, 'e1');
    expect(photosLens(letters, store.all())).toEqual({ visible: false, photos: new Map() });
    await commitPhoto(d, { ...ONE, bytes: makeJpeg() });
    expect(photosLens([], store.all()).visible).toBe(false); // its letter is gone
  });
});
