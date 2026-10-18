/// <reference types="node" />
/**
 * Words are never lost from the end of a recording without anyone knowing (ADR 0027; the meaning
 * constitution: raw_transcript is immutable, so a short one could never be fixed). The ADTS frame count
 * is the length the file proves by itself; a decoder that reports less does not plan the run. A take
 * whose last frame a kill cut off is read from a copy of its whole frames, in Caches, and the stored
 * recording is never touched. The length saved at capture is the recorder's clock, not the file, so it
 * never refuses a run, and an M4A plans exactly as on develop. Only a tail exactly as a kill leaves it
 * is read from the copy; any other tail (damage, a trailer) is refused when the decoder cannot read the
 * file as it is, and a break past one frame's bytes is refused before anything is read. Fictional Asha
 * family only; no real audio: frames are built in the test, some on the framing of a real encoder.
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
    expect(s).toMatchObject({ frames: 47, sampleRate: 48000, channels: 1, tailBytes: 0, tail: 'none' });
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
    expect(scanAdts(cut)).toMatchObject({ frames: 20, wholeBytes: whole.length, tailBytes: extra, tail: 'cut' });
  });

  it('reads CRC headers and frames with several raw data blocks', () => {
    expect(scanAdts(concat(adtsFrame(100, { crc: true }), adtsFrame(90, { crc: true })))).toMatchObject({ frames: 2, tailBytes: 0 });
    expect(scanAdts(concat(adtsFrame(300, { blocks: 2 }), adtsFrame(300, { blocks: 4 })))!.frames).toBe(6);
  });

  it('stops at bytes that are not this stream\'s next frame', () => {
    const whole = stream(10);
    expect(scanAdts(concat(whole, new Uint8Array(30).fill(0x41)))).toMatchObject({ frames: 10, tailBytes: 30, tail: 'break' });
    expect(scanAdts(concat(whole, adtsFrame(170, { sampleRateIndex: 4 })))).toMatchObject({ frames: 10, tail: 'break' }); // 44.1 kHz frame
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
    const run = await openRecordingForRun(f.reader, ORIGINAL, null, { evidence, tail: 'none', breakInside: false }, f.makeCopy);
    expect(run.durationMs).toBe(10_000);
    await run.decode(piece);
    run.close();
    expect(f.log).toEqual([`probe ${ORIGINAL}`, `decode ${ORIGINAL}`]);
    expect(f.removed()).toBe(0);
  });

  it('a cut-off take the decoder cannot open is read from a copy of its whole frames, removed at the end', async () => {
    const f = io({ [ORIGINAL]: Object.assign(new Error('x'), { code: 'ERR_SCRIBE_AUDIO_DECODE' }), [COPY]: 9_950 });
    const run = await openRecordingForRun(f.reader, ORIGINAL, null, { evidence, tail: 'cut', breakInside: false }, f.makeCopy);
    await run.decode(piece);
    run.close();
    expect(f.log).toEqual([`probe ${ORIGINAL}`, 'copy', `probe ${COPY}`, `decode ${COPY}`]);
    expect(f.removed()).toBe(1);
  });

  it('a cut-off take the decoder reads short is tried again from the copy, and opens when that is whole', async () => {
    const f = io({ [ORIGINAL]: 6_000, [COPY]: 10_000 });
    const run = await openRecordingForRun(f.reader, ORIGINAL, null, { evidence, tail: 'cut', breakInside: false }, f.makeCopy);
    expect(run.durationMs).toBe(10_000);
    run.close();
    expect(f.removed()).toBe(1);
  });

  it('when even the copy is short, the run is refused and the copy removed: no words without their end', async () => {
    const f = io({ [ORIGINAL]: 6_000, [COPY]: 6_000 });
    await expect(openRecordingForRun(f.reader, ORIGINAL, null, { evidence, tail: 'cut', breakInside: false }, f.makeCopy)).rejects.toMatchObject({ reason: 'decoder_short' });
    expect(f.removed()).toBe(1);
  });

  it('a short decoder on a take with no cut-off frame is refused without a copy', async () => {
    const f = io({ [ORIGINAL]: 6_000 });
    await expect(openRecordingForRun(f.reader, ORIGINAL, null, { evidence, tail: 'none', breakInside: false }, f.makeCopy)).rejects.toBeInstanceOf(RunInputError);
    expect(f.log).not.toContain('copy');
  });

  it('a decode that throws mid-run switches to the copy once; a second failure is the job\'s', async () => {
    const f = io({ [ORIGINAL]: 10_000, [COPY]: 10_000 }, [ORIGINAL]);
    const run = await openRecordingForRun(f.reader, ORIGINAL, null, { evidence, tail: 'cut', breakInside: false }, f.makeCopy);
    await run.decode(piece);
    expect(f.log.slice(-3)).toEqual([`decode ${ORIGINAL}`, 'copy', `decode ${COPY}`]);
    const g = io({ [ORIGINAL]: 10_000, [COPY]: 10_000 }, [ORIGINAL, COPY]);
    const run2 = await openRecordingForRun(g.reader, ORIGINAL, null, { evidence, tail: 'cut', breakInside: false }, g.makeCopy);
    await expect(run2.decode(piece)).rejects.toMatchObject({ code: 'ERR_SCRIBE_AUDIO_DECODE' });
    run.close();
    run2.close();
  });

  it('a file with a break inside is refused before anything is read, and no copy is made', async () => {
    const f = io({ [ORIGINAL]: 10_000, [COPY]: 10_000 });
    const broken = { evidence, tail: 'break', breakInside: true } as const;
    await expect(openRecordingForRun(f.reader, ORIGINAL, 60_000, broken, f.makeCopy)).rejects.toMatchObject({ reason: 'break_inside' });
    expect(f.log).toEqual([]);
    expect(jobFailureOf(new RunInputError('break_inside'))).toBe('decode_failed');
  });

  it('[review Y repro 1] a killed take whose decoder fails on the cut-off frame plans the copy over its frames, never the stored mark', async () => {
    const killed = { countedMs: 57_493.33, minDecodedMs: 57_428 };
    const f = io({ [ORIGINAL]: Object.assign(new Error('x'), { code: 'ERR_SCRIBE_AUDIO_DECODE' }), [COPY]: 57_449.33 });
    const run = await openRecordingForRun(f.reader, ORIGINAL, 60_000, { evidence: killed, tail: 'cut', breakInside: false }, f.makeCopy);
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

/**
 * The framing of a real encoder's ADTS: every frame length, in order, of ffmpeg 6.1's native AAC encoder
 * (6 s of a 330 Hz tone with pink noise, 48 kHz, mono, 64 kbit/s; 283 frames, 50,565 bytes). Its headers are
 * `FF F1 4C 40 .. .. FC` with the length bits set, which adtsFrame builds byte for byte; the payload is filler,
 * since the scanner reads only headers. No audio is committed (.gitignore: never commit recordings).
 */
const REAL_FRAME_LENGTHS = [
  191, 216, 167, 162, 178, 184, 174, 171, 172, 184, 186, 187, 171, 178, 174, 172, 189, 170, 162, 184, 185, 176, 189, 188, 186, 184, 173, 175,
  179, 202, 175, 165, 170, 187, 165, 171, 167, 172, 188, 178, 182, 171, 172, 190, 183, 198, 186, 184, 170, 184, 171, 172, 167, 178, 195, 179,
  174, 180, 180, 167, 171, 191, 198, 180, 174, 182, 181, 183, 172, 172, 184, 155, 193, 200, 174, 185, 189, 196, 163, 185, 162, 174, 176, 183,
  177, 178, 172, 176, 185, 197, 182, 173, 174, 173, 178, 181, 171, 165, 178, 172, 192, 181, 179, 176, 188, 170, 168, 189, 166, 171, 190, 176,
  190, 167, 163, 188, 188, 186, 172, 185, 188, 172, 174, 205, 192, 185, 164, 186, 171, 166, 171, 175, 187, 173, 173, 163, 203, 164, 163, 178,
  171, 201, 188, 173, 176, 186, 197, 183, 167, 167, 170, 171, 173, 192, 188, 188, 184, 177, 167, 171, 176, 173, 177, 172, 173, 175, 169, 184,
  177, 183, 197, 186, 183, 189, 167, 172, 176, 169, 180, 173, 202, 192, 179, 180, 168, 182, 175, 175, 174, 199, 166, 167, 177, 169, 191, 171,
  179, 175, 180, 183, 184, 181, 177, 178, 191, 182, 166, 170, 173, 176, 178, 181, 189, 183, 175, 178, 174, 176, 170, 179, 187, 176, 176, 177,
  192, 175, 174, 170, 183, 176, 169, 178, 181, 195, 178, 175, 182, 167, 171, 179, 178, 186, 179, 183, 169, 166, 178, 185, 180, 190, 175, 182,
  177, 173, 178, 177, 180, 178, 185, 170, 189, 170, 169, 180, 186, 176, 172, 183, 178, 176, 181, 176, 183, 177, 174, 172, 174, 183, 180, 179,
  179, 174, 215,
];
const realStream = () => concat(...REAL_FRAME_LENGTHS.map((len) => adtsFrame(len - 7)));

/**
 * A decoder that behaves as Core Audio might at worst (V3 finds out): it reads whole frames exactly, priming
 * trimmed, and fails on any bytes after the last whole frame. `copies` holds what makeCopy wrote.
 */
function strictDecoder(files: Map<string, Uint8Array>) {
  const lengthOf = (uri: string) => {
    const scan = scanAdts(files.get(uri)!);
    if (!scan || scan.tail !== 'none') throw Object.assign(new Error('x'), { code: 'ERR_SCRIBE_AUDIO_DECODE' });
    return ((scan.frames * AAC_FRAME_SAMPLES - AAC_PRIMING_SAMPLES) / 48000) * 1000;
  };
  return {
    probeMs: async (uri: string) => lengthOf(uri),
    decode: async (uri: string) => new ArrayBuffer(lengthOf(uri) > 0 ? 2 : 0),
  };
}
const factsOf = (bytes: Uint8Array) => {
  const scan = scanAdts(bytes)!;
  return { scan, facts: { evidence: adtsLengthEvidence(scan), tail: scan.wholeBytes > 0 ? scan.tail : 'none', breakInside: breaksInside(scan) } as const };
};

describe('[ADR 0027, review Y] only a tail exactly as a kill leaves it is read from the copy', () => {
  it('a kill cut at every byte of the last 4000 of a real encoder\'s stream is judged a kill cut, never a break, and the run reads its whole frames', async () => {
    const full = realStream();
    expect(full.length).toBe(50_565);
    let cuts = 0;
    let boundaries = 0;
    const misjudged: number[] = [];
    for (let end = full.length - 4000; end < full.length; end++) {
      const killed = full.subarray(0, end);
      const { scan, facts } = factsOf(killed);
      if (scan.tailBytes === 0) {
        boundaries += 1;
        continue;
      }
      cuts += 1;
      if (scan.tail !== 'cut' || breaksInside(scan)) {
        misjudged.push(end);
        continue;
      }
      const files = new Map([['orig', killed]]);
      const run = await openRecordingForRun(strictDecoder(files), 'orig', 60_000, facts, async () => {
        files.set('copy', killed.subarray(0, scan.wholeBytes));
        return { uri: 'copy', remove: () => void files.delete('copy') };
      });
      if (run.durationMs !== facts.evidence.countedMs) misjudged.push(end);
      run.close();
      if (files.has('copy')) misjudged.push(end);
    }
    expect(misjudged).toEqual([]);
    expect(boundaries).toBe(22); // the frames that end in the last 4000 bytes
    expect(cuts).toBe(4000 - boundaries);
  });

  it('a kill cut through CRC headers (9 bytes) is a kill cut at every byte too', () => {
    const crc = concat(...Array.from({ length: 12 }, (_, i) => adtsFrame(150 + i, { crc: true })));
    for (let end = 9; end < crc.length; end++) {
      const scan = scanAdts(crc.subarray(0, end))!;
      expect(scan.tail, `cut at ${end}`).toBe(scan.tailBytes === 0 ? 'none' : 'cut');
    }
  });

  it('[review Y] damage inside the last 8 kB (the sync byte of the frame 20 from the end) is a break: with the decoder failing on it, the run is refused and no copy is made', async () => {
    const damaged = realStream();
    const at = REAL_FRAME_LENGTHS.slice(0, -20).reduce((n, len) => n + len, 0);
    damaged[at] = 0x00;
    const { scan, facts } = factsOf(damaged);
    expect(scan).toMatchObject({ frames: REAL_FRAME_LENGTHS.length - 20, tail: 'break' });
    expect(breaksInside(scan)).toBe(false); // inside one frame's bytes: not refused up front
    let copies = 0;
    const makeCopy = async () => {
      copies += 1;
      return { uri: 'copy', remove: () => {} };
    };
    const files = new Map([['orig', damaged]]);
    await expect(openRecordingForRun(strictDecoder(files), 'orig', null, facts, makeCopy)).rejects.toMatchObject({ reason: 'break_inside' });
    // A decoder that opens it but reads short of the frames before the damage: refused the same way.
    const short = { probeMs: async () => facts.evidence.minDecodedMs - 1, decode: async () => new ArrayBuffer(2) };
    await expect(openRecordingForRun(short, 'orig', null, facts, makeCopy)).rejects.toMatchObject({ reason: 'break_inside' });
    // A decoder that opens it and then fails mid-run: refused, never switched to a copy.
    const failsLater = { probeMs: async () => facts.evidence.countedMs, decode: async () => Promise.reject(Object.assign(new Error('x'), { code: 'ERR_SCRIBE_AUDIO_DECODE' })) };
    const run = await openRecordingForRun(failsLater, 'orig', null, facts, makeCopy);
    await expect(run.decode([{ srcStartMs: 0, srcEndMs: 1000, silenceBeforeMs: 0 }])).rejects.toMatchObject({ reason: 'break_inside' });
    run.close();
    expect(copies).toBe(0);
    expect(jobFailureOf(new RunInputError('break_inside'))).toBe('decode_failed');
  });

  it('a trailer a writer might add after a finished take is a break, but one the decoder reads well never refuses the take', async () => {
    const tag = new Uint8Array(128).fill(0x20);
    tag.set(new TextEncoder().encode('TAG'), 0); // an ID3v1 block, for example
    const finished = concat(realStream(), tag);
    const { scan, facts } = factsOf(finished);
    expect(scan).toMatchObject({ frames: REAL_FRAME_LENGTHS.length, tail: 'break', tailBytes: 128 });
    const readsWell = { probeMs: async () => facts.evidence.countedMs - (AAC_PRIMING_SAMPLES / 48000) * 1000, decode: async () => new ArrayBuffer(2) };
    let copies = 0;
    const run = await openRecordingForRun(readsWell, 'orig', null, facts, async () => {
      copies += 1;
      return { uri: 'copy', remove: () => {} };
    });
    expect(run.durationMs).toBe(facts.evidence.countedMs);
    run.close();
    expect(copies).toBe(0);
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
