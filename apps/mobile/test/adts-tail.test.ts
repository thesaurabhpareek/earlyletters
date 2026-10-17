/// <reference types="node" />
/**
 * Words are never lost from the end of a recording without anyone knowing (ADR 0027; the meaning
 * constitution: raw_transcript is immutable, so a short one could never be fixed). The ADTS frame count
 * is the length the file proves by itself; a decoder that reports less does not plan the run. A take
 * whose last frame a kill cut off is read from a copy of its whole frames, in Caches, and the stored
 * recording is never touched. The length saved at capture is the recorder's clock, not the file, so it
 * never refuses a run, and an M4A plans exactly as on develop. A file that breaks before its end is
 * refused with no copy. Fictional Asha family only; no real audio, frames built in the test.
 */
import { createHash } from 'node:crypto';
import { describe, expect, it, vi } from 'vitest';
import { createDisk, iosContainer, put, recorderDir, type Disk } from './helpers/expo-fs-standin';

const h = vi.hoisted(() => ({ disk: null as unknown as Disk }));
vi.mock('expo-file-system', async () => (await import('./helpers/expo-fs-standin')).expoFileSystem(() => h.disk));

const { AAC_FRAME_SAMPLES, AAC_PRIMING_SAMPLES, ADTS_MAX_FRAME_BYTES, adtsLengthEvidence, breaksInside, scanAdts } = await import('../src/lib/capture/adts');
const { copyKeyOf, removeWholeFrameCopies, removeWholeFrameCopiesOf, scanRecordingFile, wholeFramesCopy } = await import('../src/lib/capture/adts-file');
const { RunInputError, checkedRunDuration, openRecordingForRun, runDurationMs } = await import('../src/lib/transcribe-run');
const { jobFailureOf } = await import('../src/lib/transcription-queue/machine');

/** One ADTS frame: a 7-byte header (9 with CRC) for AAC-LC, then `payload` bytes. */
function adtsFrame(payload: number, o: { sampleRateIndex?: number; channels?: number; crc?: boolean; blocks?: number } = {}): Uint8Array {
  const { sampleRateIndex = 3, channels = 1, crc = false, blocks = 1 } = o;
  const header = crc ? 9 : 7;
  const len = header + payload;
  const b = new Uint8Array(len);
  b[0] = 0xff;
  b[1] = 0xf0 | (crc ? 0 : 1); // MPEG-4, layer 00, protection_absent
  b[2] = (1 << 6) | (sampleRateIndex << 2) | ((channels >> 2) & 1); // profile 1 = AAC-LC
  b[3] = ((channels & 3) << 6) | ((len >> 11) & 3);
  b[4] = (len >> 3) & 0xff;
  b[5] = ((len & 7) << 5) | 0x1f;
  b[6] = 0xfc | ((blocks - 1) & 3);
  for (let i = header; i < len; i++) b[i] = (i * 7 + payload) & 0xff;
  return b;
}
const concat = (...parts: Uint8Array[]) => {
  const out = new Uint8Array(parts.reduce((n, p) => n + p.length, 0));
  let o = 0;
  for (const p of parts) {
    out.set(p, o);
    o += p.length;
  }
  return out;
};
const stream = (frames: number, payload = 170) => concat(...Array.from({ length: frames }, (_, i) => adtsFrame(payload + (i % 5))));
const frameMs = (AAC_FRAME_SAMPLES / 48000) * 1000;
const sha = (b: Uint8Array) => createHash('sha256').update(b).digest('hex');

describe('[ADR 0027] counting ADTS frames from their headers', () => {
  it('counts every whole frame of a finished take, at 48 kHz mono, with nothing left over', () => {
    const s = scanAdts(stream(47))!;
    expect(s).toMatchObject({ frames: 47, sampleRate: 48000, channels: 1, tailBytes: 0 });
    expect(s.wholeBytes).toBe(s.totalBytes);
  });

  it('is not fooled by an M4A or by nothing', () => {
    const m4a = concat(new Uint8Array([0, 0, 0, 0x20]), new TextEncoder().encode('ftypM4A '), new Uint8Array(40));
    expect(scanAdts(m4a)).toBeNull();
    expect(scanAdts(new Uint8Array(0))).toBeNull();
    expect(scanAdts(new Uint8Array([0xff, 0xf1, 0x50]))).toBeNull(); // shorter than a header
  });

  it.each([
    ['in the middle of a frame', 5],
    ['in the middle of the next header', 3],
    ['right after a header', 7],
  ])('finds the tail of a take a kill cut off %s', (_name, extra) => {
    const whole = stream(20);
    const cut = concat(whole, adtsFrame(170).subarray(0, extra));
    expect(scanAdts(cut)).toMatchObject({ frames: 20, wholeBytes: whole.length, tailBytes: extra });
  });

  it('reads CRC headers and frames with several raw data blocks', () => {
    expect(scanAdts(concat(adtsFrame(100, { crc: true }), adtsFrame(90, { crc: true })))).toMatchObject({ frames: 2, tailBytes: 0 });
    expect(scanAdts(concat(adtsFrame(300, { blocks: 2 }), adtsFrame(300, { blocks: 4 })))!.frames).toBe(6);
  });

  it('stops at bytes that are not this stream\'s next frame', () => {
    const whole = stream(10);
    expect(scanAdts(concat(whole, new Uint8Array(30).fill(0x41)))).toMatchObject({ frames: 10, tailBytes: 30 });
    expect(scanAdts(concat(whole, adtsFrame(170, { sampleRateIndex: 4 })))).toMatchObject({ frames: 10 }); // 44.1 kHz frame
  });

  it('tells a break inside the file (more bytes after the last whole frame than one frame can hold) from a cut-off tail', () => {
    const before = stream(10);
    const after = stream(60); // about 10.6 kB of good frames past the break
    const broken = scanAdts(concat(before, new Uint8Array([0xff, 0x00, 0x12, 0x34, 0x56, 0x78, 0x9a]), after))!;
    expect(broken).toMatchObject({ frames: 10, wholeBytes: before.length });
    expect(broken.tailBytes).toBeGreaterThan(ADTS_MAX_FRAME_BYTES);
    expect(breaksInside(broken)).toBe(true);
    // A kill cuts off at most one frame, which is never more than 8191 bytes.
    expect(breaksInside(scanAdts(concat(before, adtsFrame(170).subarray(0, 100)))!)).toBe(false);
    expect(breaksInside(scanAdts(concat(before, new Uint8Array(ADTS_MAX_FRAME_BYTES).fill(0x41)))!)).toBe(false);
    expect(breaksInside(scanAdts(concat(before, new Uint8Array(ADTS_MAX_FRAME_BYTES + 1).fill(0x41)))!)).toBe(true);
    expect(breaksInside(scanAdts(stream(47))!)).toBe(false);
  });

  it('turns frames into the length the file proves, allowing for the 2112 samples of priming Apple assumes (TN2258) and one frame', () => {
    const e = adtsLengthEvidence(scanAdts(stream(1000))!);
    expect(e.countedMs).toBeCloseTo((1000 * 1024 * 1000) / 48000, 6);
    expect(e.minDecodedMs).toBeCloseTo(((1000 * 1024 - AAC_PRIMING_SAMPLES - AAC_FRAME_SAMPLES) * 1000) / 48000, 6);
    expect(adtsLengthEvidence(scanAdts(stream(2))!).minDecodedMs).toBe(0); // never negative
  });
});

describe('[ADR 0027] a decoder shorter than the file does not plan the run', () => {
  const evidence = adtsLengthEvidence(scanAdts(stream(1000))!); // about 21.3 s

  it('an M4A with a sound length plans exactly as before', () => {
    expect(checkedRunDuration(120_000, 90_000, null)).toEqual({ durationMs: runDurationMs(120_000, 90_000), decoderShort: false });
    expect(checkedRunDuration(Number.NaN, 90_000, null)).toEqual({ durationMs: 90_000, decoderShort: false });
  });

  it('M4A plans exactly as on develop, whatever the length stored at capture: checkedRunDuration is runDurationMs', () => {
    const lengths = [57_500, 60_000, 1, 0, -5, Number.NaN, Number.POSITIVE_INFINITY, null, undefined, 4 * 60 * 60_000 + 1];
    for (const probed of lengths) {
      for (const stored of lengths) {
        let develop: number | 'refused';
        try {
          develop = runDurationMs(probed, stored);
        } catch (e) {
          expect(e).toBeInstanceOf(RunInputError);
          develop = 'refused';
        }
        if (develop === 'refused') expect(() => checkedRunDuration(probed, stored, null), `${probed} ${stored}`).toThrow(RunInputError);
        else expect(checkedRunDuration(probed, stored, null), `${probed} ${stored}`).toEqual({ durationMs: develop, decoderShort: false });
      }
    }
  });

  it('[review Y repro 2] a finished M4A whose decoder reads 2.5 s short of the recorder\'s clock transcribes, as on develop', () => {
    expect(checkedRunDuration(57_500, 60_000, null)).toEqual({ durationMs: 57_500, decoderShort: false });
  });

  it('[review Y repro 1] the length saved at capture never refuses: 57.49 s of frames against a 60 s progress mark plans over the frames', () => {
    // A take killed after 2,695 whole frames keeps its last 5 s progress mark (listen.tsx, drafts.ts COALESCE).
    const killed = adtsLengthEvidence(scanAdts(stream(2695))!);
    expect(killed.countedMs).toBeCloseTo(57_493.33, 1);
    const trimmed = killed.countedMs - (AAC_PRIMING_SAMPLES / 48000) * 1000; // a correct decoder, priming trimmed
    expect(checkedRunDuration(trimmed, 60_000, killed)).toEqual({ durationMs: killed.countedMs, decoderShort: false });
    expect(checkedRunDuration(killed.countedMs, 60_000, killed)).toEqual({ durationMs: killed.countedMs, decoderShort: false });
    // Only the file decides: a decoder short of the frames is still not trusted, whatever was stored.
    expect(checkedRunDuration(killed.minDecodedMs - 1, 60_000, killed)).toEqual({ durationMs: killed.countedMs, decoderShort: true });
    expect(checkedRunDuration(killed.minDecodedMs - 1, 50_000, killed).decoderShort).toBe(true);
  });

  it('ADTS: a decoder that trims the priming, or does not, is trusted, and the plan covers every counted frame', () => {
    const trimmed = evidence.countedMs - (AAC_PRIMING_SAMPLES / 48000) * 1000;
    expect(checkedRunDuration(trimmed, null, evidence)).toEqual({ durationMs: evidence.countedMs, decoderShort: false });
    expect(checkedRunDuration(evidence.countedMs, null, evidence)).toEqual({ durationMs: evidence.countedMs, decoderShort: false });
    expect(checkedRunDuration(evidence.countedMs + 500, null, evidence)).toEqual({ durationMs: evidence.countedMs + 500, decoderShort: false });
  });

  it('ADTS: a decoder more than one frame short of that, or with no length at all, is not trusted', () => {
    expect(checkedRunDuration(evidence.minDecodedMs - 1, null, evidence)).toEqual({ durationMs: evidence.countedMs, decoderShort: true });
    expect(checkedRunDuration(evidence.countedMs - 10 * frameMs, 21_000, evidence).decoderShort).toBe(true);
    expect(checkedRunDuration(Number.NaN, null, evidence)).toEqual({ durationMs: evidence.countedMs, decoderShort: true });
  });

  it('an absurd length is still refused', () => {
    expect(() => checkedRunDuration(1000, null, { countedMs: 5 * 60 * 60_000, minDecodedMs: 5 * 60 * 60_000 - 100 })).toThrow(RunInputError);
  });

  it('a refused run is a visible failure (Try again, or type), never stored words', () => {
    expect(jobFailureOf(new RunInputError('decoder_short'))).toBe('decode_failed');
  });
});

describe('[ADR 0027] opening a recording for a run', () => {
  const ORIGINAL = 'file:///Documents/ExpoAudio/recording-asha.aac';
  const COPY = 'file:///Caches/whole-frames-1.aac';
  const evidence = { countedMs: 10_000, minDecodedMs: 9_900 };

  /** A fake decoder: lengths and failures per uri, and a log of what was read and copied. */
  function io(lengths: Record<string, number | Error>, decodeFails: string[] = []) {
    const log: string[] = [];
    let removed = 0;
    return {
      log,
      removed: () => removed,
      reader: {
        probeMs: async (uri: string) => {
          log.push(`probe ${uri}`);
          const v = lengths[uri];
          if (v instanceof Error) throw v;
          return v ?? null;
        },
        decode: async (uri: string) => {
          log.push(`decode ${uri}`);
          if (decodeFails.includes(uri)) throw Object.assign(new Error('x'), { code: 'ERR_SCRIBE_AUDIO_DECODE' });
          return new ArrayBuffer(2);
        },
      },
      makeCopy: async () => {
        log.push('copy');
        return { uri: COPY, remove: () => void (removed += 1) };
      },
    };
  }
  const piece = [{ srcStartMs: 0, srcEndMs: 1000, silenceBeforeMs: 0 }];

  it('a sound recording is read where it is; no copy is made', async () => {
    const f = io({ [ORIGINAL]: 10_000 });
    const run = await openRecordingForRun(f.reader, ORIGINAL, null, { evidence, tailBytes: 0, breakInside: false }, f.makeCopy);
    expect(run.durationMs).toBe(10_000);
    await run.decode(piece);
    run.close();
    expect(f.log).toEqual([`probe ${ORIGINAL}`, `decode ${ORIGINAL}`]);
    expect(f.removed()).toBe(0);
  });

  it('a cut-off take the decoder cannot open is read from a copy of its whole frames, removed at the end', async () => {
    const f = io({ [ORIGINAL]: Object.assign(new Error('x'), { code: 'ERR_SCRIBE_AUDIO_DECODE' }), [COPY]: 9_950 });
    const run = await openRecordingForRun(f.reader, ORIGINAL, null, { evidence, tailBytes: 5, breakInside: false }, f.makeCopy);
    await run.decode(piece);
    run.close();
    expect(f.log).toEqual([`probe ${ORIGINAL}`, 'copy', `probe ${COPY}`, `decode ${COPY}`]);
    expect(f.removed()).toBe(1);
  });

  it('a cut-off take the decoder reads short is tried again from the copy, and opens when that is whole', async () => {
    const f = io({ [ORIGINAL]: 6_000, [COPY]: 10_000 });
    const run = await openRecordingForRun(f.reader, ORIGINAL, null, { evidence, tailBytes: 5, breakInside: false }, f.makeCopy);
    expect(run.durationMs).toBe(10_000);
    run.close();
    expect(f.removed()).toBe(1);
  });

  it('when even the copy is short, the run is refused and the copy removed: no words without their end', async () => {
    const f = io({ [ORIGINAL]: 6_000, [COPY]: 6_000 });
    await expect(openRecordingForRun(f.reader, ORIGINAL, null, { evidence, tailBytes: 5, breakInside: false }, f.makeCopy)).rejects.toMatchObject({ reason: 'decoder_short' });
    expect(f.removed()).toBe(1);
  });

  it('a short decoder on a take with no cut-off frame is refused without a copy', async () => {
    const f = io({ [ORIGINAL]: 6_000 });
    await expect(openRecordingForRun(f.reader, ORIGINAL, null, { evidence, tailBytes: 0, breakInside: false }, f.makeCopy)).rejects.toBeInstanceOf(RunInputError);
    expect(f.log).not.toContain('copy');
  });

  it('a decode that throws mid-run switches to the copy once; a second failure is the job\'s', async () => {
    const f = io({ [ORIGINAL]: 10_000, [COPY]: 10_000 }, [ORIGINAL]);
    const run = await openRecordingForRun(f.reader, ORIGINAL, null, { evidence, tailBytes: 5, breakInside: false }, f.makeCopy);
    await run.decode(piece);
    expect(f.log.slice(-3)).toEqual([`decode ${ORIGINAL}`, 'copy', `decode ${COPY}`]);
    const g = io({ [ORIGINAL]: 10_000, [COPY]: 10_000 }, [ORIGINAL, COPY]);
    const run2 = await openRecordingForRun(g.reader, ORIGINAL, null, { evidence, tailBytes: 5, breakInside: false }, g.makeCopy);
    await expect(run2.decode(piece)).rejects.toMatchObject({ code: 'ERR_SCRIBE_AUDIO_DECODE' });
    run.close();
    run2.close();
  });

  it('a file with a break inside is refused before anything is read, and no copy is made', async () => {
    const f = io({ [ORIGINAL]: 10_000, [COPY]: 10_000 });
    const broken = { evidence, tailBytes: 9_000, breakInside: true };
    await expect(openRecordingForRun(f.reader, ORIGINAL, 60_000, broken, f.makeCopy)).rejects.toMatchObject({ reason: 'break_inside' });
    expect(f.log).toEqual([]);
    expect(jobFailureOf(new RunInputError('break_inside'))).toBe('decode_failed');
  });

  it('[review Y repro 1] a killed take whose decoder fails on the cut-off frame plans the copy over its frames, never the stored mark', async () => {
    const killed = { countedMs: 57_493.33, minDecodedMs: 57_428 };
    const f = io({ [ORIGINAL]: Object.assign(new Error('x'), { code: 'ERR_SCRIBE_AUDIO_DECODE' }), [COPY]: 57_449.33 });
    const run = await openRecordingForRun(f.reader, ORIGINAL, 60_000, { evidence: killed, tailBytes: 5, breakInside: false }, f.makeCopy);
    expect(run.durationMs).toBe(57_493.33);
    run.close();
  });

  it('an M4A that will not decode fails as before: no copy, no guess', async () => {
    const f = io({ [ORIGINAL]: 10_000 }, [ORIGINAL]);
    const run = await openRecordingForRun(f.reader, ORIGINAL, 10_000, null, f.makeCopy);
    await expect(run.decode(piece)).rejects.toMatchObject({ code: 'ERR_SCRIBE_AUDIO_DECODE' });
    expect(f.log).not.toContain('copy');
  });
});

describe('[ADR 0027, LEGAL-REQ-018] the whole-frame copy, on a disk laid out as the phone has it', () => {
  it('holds exactly the whole frames, lives in Caches, leaves the stored recording byte for byte, and goes when removed', async () => {
    h.disk = createDisk(iosContainer('B81D7E44-NEW0-4A7F-8C21-ASHA00000003'));
    const whole = stream(30);
    const stored = put(h.disk, `${recorderDir(h.disk)}/recording-0E0E0E0E-0000-4000-8000-0000000AD757.aac`, concat(whole, adtsFrame(170).subarray(0, 9)));
    const before = sha(h.disk.files.get(stored)!.data);

    const scan = (await scanRecordingFile(stored))!;
    expect(scan).toMatchObject({ frames: 30, tailBytes: 9, wholeBytes: whole.length });
    const copy = await wholeFramesCopy(stored, scan.wholeBytes);
    expect(copy.uri.startsWith(h.disk.caches)).toBe(true);
    expect(copy.uri).not.toContain('recording-'); // the copy's name says nothing about the letter
    expect(sha(h.disk.files.get(copy.uri)!.data)).toBe(sha(whole));
    expect(scanAdts(h.disk.files.get(copy.uri)!.data)).toMatchObject({ frames: 30, tailBytes: 0 });
    expect(sha(h.disk.files.get(stored)!.data)).toBe(before);

    copy.remove();
    expect(h.disk.files.has(copy.uri)).toBe(false);
    expect(sha(h.disk.files.get(stored)!.data)).toBe(before);
  });

  it('erase finds a recording\'s copies by a key of its file name (the same after a container move) and leaves other copies', async () => {
    h.disk = createDisk(iosContainer('B81D7E44-NEW0-4A7F-8C21-ASHA00000005'));
    const take = (n: string) => put(h.disk, `${recorderDir(h.disk)}/recording-0E0E0E0E-0000-4000-8000-0000000AD75${n}.aac`, concat(stream(5), adtsFrame(170).subarray(0, 9)));
    const a = take('A');
    const b = take('B');
    const copyA = await wholeFramesCopy(a, 5);
    const leftoverB = put(h.disk, `${h.disk.caches}whole-frames-${copyKeyOf(b)}-old.aac`, 10);
    expect(copyKeyOf(a)).toMatch(/^[0-9a-f]{8}$/);
    expect(copyKeyOf(a)).toBe(copyKeyOf(a.replace('ASHA00000005', 'ASHA00000006'))); // same name, new container
    expect(copyKeyOf(a)).not.toBe(copyKeyOf(b));
    expect(removeWholeFrameCopiesOf(a)).toBe(1);
    expect(h.disk.files.has(copyA.uri)).toBe(false);
    expect(h.disk.files.has(leftoverB)).toBe(true);
    copyA.remove(); // the run's own clean-up after an erase is a no-op
  });

  it('a recording erased while its copy is being written takes the copy with it', async () => {
    h.disk = createDisk(iosContainer('B81D7E44-NEW0-4A7F-8C21-ASHA00000007'));
    const stored = put(h.disk, `${recorderDir(h.disk)}/recording-0E0E0E0E-0000-4000-8000-0000000AD758.aac`, concat(stream(5), adtsFrame(170).subarray(0, 9)));
    const writing = wholeFramesCopy(stored, 5);
    h.disk.files.delete(stored); // Erase now, between reading the recording and writing the copy
    await expect(writing).rejects.toMatchObject({ code: 'ERR_SCRIBE_AUDIO_FILE_MISSING' });
    expect([...h.disk.files.keys()].filter((u) => u.startsWith(h.disk.caches))).toEqual([]);
  });

  it('an M4A is not scanned as ADTS, and only whole-frame copies are ever removed from Caches', async () => {
    h.disk = createDisk(iosContainer('B81D7E44-NEW0-4A7F-8C21-ASHA00000004'));
    const m4a = put(h.disk, `${recorderDir(h.disk)}/recording-1.m4a`, concat(new Uint8Array([0, 0, 0, 0x20]), new TextEncoder().encode('ftypM4A '), new Uint8Array(40)));
    expect(await scanRecordingFile(m4a)).toBeNull();
    expect(await scanRecordingFile(`${recorderDir(h.disk)}/missing.aac`)).toBeNull();
    const leftover = put(h.disk, `${h.disk.caches}whole-frames-x.aac`, 10);
    const other = put(h.disk, `${h.disk.caches}recovery-export.zip`, 10);
    expect(removeWholeFrameCopies(0)).toBe(1);
    expect(h.disk.files.has(leftover)).toBe(false);
    expect(h.disk.files.has(other)).toBe(true);
    expect(h.disk.files.has(m4a)).toBe(true);
  });
});
