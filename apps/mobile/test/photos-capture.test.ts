// NS-01 photo with a letter in Node, no phone: the strip and the metadata guard, backing out, the words rule, a second
// picture with its confirm and Undo, changes that never touch the words or the recording, the quiet day, the parent's own
// words and place, and failed picks. The real store, the caps against its CHECK and the erase paths run in
// photos-device, photos-phone and erase-all.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { newQuietMark } from '../src/components/book/quiet-day.logic';
import { carriesMetadata, stripJpeg } from '../src/lib/photos/strip';
import { addPhotoToLetter, removePhotoFromLetter, settlePhotoChange, undoPhotoChange } from '../src/lib/photos/attach';
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
    const planted = Uint8Array.from([0xff, 0xd8, 0xff, 0xf0, 0, exif.length + 2, ...exif, ...makeJpeg({ seed: 5 }).slice(2)]);
    const { d, files } = deps();
    expect((await commitPhoto(d, { ...ONE, bytes: planted })).status).toBe('failed');
    expect(files.disk.size).toBe(0);
  });
});

describe('[NS-01-R4][NX-39-R14] backing out writes nothing', () => {
  it('[NS-01-R4][NX-39-R14] a picked picture that is let go writes 0 rows and 0 files', () => {
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

describe('[NS-01-R5] a picture without words cannot be kept', () => {
  it('[NS-01-R5] no words: Keep is off and commit writes nothing; words: it works', async () => {
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

describe('[NS-01-R8] picture changes never touch words or recording', () => {
  it('[NS-01-R8] add, replace and remove leave the letter byte-identical (the functions are given no letter fields)', async () => {
    // A letter whose every field throws on write, held beside the picture calls: the photo module is never given it.
    const letter = Object.freeze({ id: 'e1', finalText: 'She laughed.', rawTranscript: 'she laughed um', machineEdits: Object.freeze([]), audioSha256: 'abc' });
    const before = JSON.stringify(letter);
    const { d } = deps();
    await addPhotoToLetter(d, { entryId: letter.id, finalText: letter.finalText, bytes: makeJpeg({ seed: 1 }), text: null });
    await addPhotoToLetter(d, { entryId: letter.id, finalText: letter.finalText, bytes: makeJpeg({ seed: 2 }), text: null }, true);
    removePhotoFromLetter(d, letter.id);
    expect(JSON.stringify(letter)).toBe(before);
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
    expect(page).toMatch(/return own && words \?/);
  });
});

describe('[NS-01-R9][NS-01-R21] the picture has the parent\'s words or a fixed label', () => {
  it('[NS-01-R9] no typed words: the label is "Photo with this letter"', () => {
    expect(photoA11yLabel(null)).toBe('Photo with this letter');
    expect(photoA11yLabel('   ')).toBe('Photo with this letter');
  });
  it('[NS-01-R21] photo text is the parent\'s, optional and 140 characters', async () => {
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
  it('[NS-01-R21] the typed place is optional, at most 60 characters, the parent\'s only, and kept in its own field', async () => {
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

describe('[NS-01-R17][NX-39-R12][NX-39-R13][NX-39-R14] failed picks leave nothing; iCloud and Live Photo behave', () => {
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
  it('[NS-01-R17] a cancel and a decode failure write 0 files', async () => {
    for (const o of ['cancelled', 'failed', 'throws'] as const) {
      const { p } = picker(o);
      const r = await runPick(p).done;
      expect(r.status).toBe(o === 'throws' ? 'failed' : o);
    }
    const { d, files, store } = deps();
    expect((await commitPhoto(d, { ...ONE, bytes: Uint8Array.of(0, 1, 2, 3) })).status).toBe('unreadable');
    expect(files.disk.size + store.all().length).toBe(0);
  });
  it('[NS-01-R17] a full phone writes 0 files and the letter is not touched', async () => {
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
  it('[NS-01-R17] a write that fails halfway leaves 0 files and 0 rows', async () => {
    const { d, files, store } = deps({ files: memoryFiles({ failWrite: true }) });
    expect((await commitPhoto(d, { ...ONE, bytes: makeJpeg() })).status).toBe('failed');
    expect(files.disk.size + store.all().length).toBe(0);
  });
  it('[NS-01-R17][NX-39-R13] an iCloud-only picture reports progress and Cancel reaches the picker', async () => {
    const seen: number[] = [];
    const { p, calls } = picker('cancelled', { progress: [0.2, 0.7] });
    const run = runPick(p, (f) => seen.push(f));
    run.cancel();
    expect(seen).toEqual([0.2, 0.7]);
    expect(calls.cancel).toBe(1);
    expect((await run.done).status).toBe('cancelled');
  });
  it('[NS-01-R17][NX-39-R12] a Live Photo stores its still only, 1 file', async () => {
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
