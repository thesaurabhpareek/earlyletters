/**
 * ADR 0027 V3 and V4, the pure half of the Mac kit (adts-parity-lib.ts): the cut and damaged files are what V3
 * names and scan as the app's own scanAdts says they should, the alignment finds a known offset, and the run is
 * planned by the app's own openRecordingForRun exactly as transcribe-whisper.ts calls it. Core Audio is the Mac
 * half (adts-parity.ts, adts-coreaudio.swift) and is not run here. No audio: frames are built in the test.
 */
import { describe, expect, it } from 'vitest';
import { AAC_FRAME_SAMPLES, AAC_PRIMING_SAMPLES, scanAdts } from '../apps/mobile/src/lib/capture/adts';
import {
  FRAME_AT_PCM,
  MAX_PLAUSIBLE_MONO,
  chirpWav,
  crossCorrelate,
  damageLength,
  damageSync,
  frameStarts,
  lengthAgainstFrames,
  pcm16,
  planRun,
  rms,
  truncations,
  zeroRunAtEnd,
} from './adts-parity-lib';

/** One ADTS frame for AAC-LC, 48 kHz, mono, no CRC: the header byte for byte, then filler payload. */
function frame(len: number): Uint8Array {
  const b = new Uint8Array(len);
  b.set([0xff, 0xf1, 0x4c, 0x40 | ((len >> 11) & 3), (len >> 3) & 0xff, ((len & 7) << 5) | 0x1f, 0xfc]);
  for (let i = 7; i < len; i++) b[i] = (i * 7 + len) & 0x7f; // never 0xFF, so no false sync in the filler
  return b;
}
/** A finished take: `n` frames of 150 to 209 bytes, as 64 kbit/s AAC writes them. */
function take(n: number): Uint8Array {
  const frames = Array.from({ length: n }, (_, i) => frame(150 + ((i * 37) % 60)));
  const out = new Uint8Array(frames.reduce((s, f) => s + f.length, 0));
  let o = 0;
  for (const f of frames) {
    out.set(f, o);
    o += f.length;
  }
  return out;
}

describe('[ADR 0027 V3] the files V3 names, from a finished take', () => {
  const t = take(120);

  it('walks the frames scanAdts proved, and refuses bytes that are not ADTS', () => {
    const { starts, scan } = frameStarts(t);
    expect(starts).toHaveLength(120);
    expect(scan).toMatchObject({ frames: 120, tail: 'none', wholeBytes: t.length });
    expect(starts[1]).toBe(150);
    expect(() => frameStarts(new Uint8Array(64))).toThrow('not_adts');
  });

  it('cuts at three offsets a kill can leave (mid-frame, mid-header, right after a header), each a kill cut', () => {
    const cuts = truncations(t);
    expect(cuts.map((c) => c.name)).toEqual(['cut-mid-frame', 'cut-mid-header', 'cut-after-header']);
    expect(cuts.map((c) => scanAdts(c.bytes))).toEqual([
      expect.objectContaining({ frames: 90, tail: 'cut' }),
      expect.objectContaining({ frames: 100, tail: 'cut', tailBytes: 3 }),
      expect.objectContaining({ frames: 110, tail: 'cut', tailBytes: 7 }),
    ]);
    expect(() => truncations(take(20))).toThrow('take_too_short');
  });

  it('damage (a): the sync byte 20 frames from the end zeroed is a break with 19 whole frames after it', () => {
    const d = damageSync(t);
    expect(d.damagedFrame).toBe(100);
    expect(d.bytes[d.damagedAt]).toBe(0);
    expect(scanAdts(d.bytes)).toMatchObject({ frames: 100, tail: 'break', framesAfterBreak: 19 });
    expect(t[d.damagedAt]).toBe(0xff); // the take itself is never changed
  });

  it('damage (b): a frame_length 10 frames from the end set to a possible but wrong value that lands inside the next frame', () => {
    const d = damageLength(t);
    expect(d.claimedLength).toBeGreaterThan(d.trueLength);
    expect(d.claimedLength).toBeLessThanOrEqual(MAX_PLAUSIBLE_MONO);
    const { starts } = frameStarts(t);
    expect(starts).not.toContain(d.damagedAt + d.claimedLength); // inside a frame, not on a header
    const s = scanAdts(d.bytes)!;
    expect(s.frames).toBeLessThanOrEqual(111);
    expect(s.tail).toBe('break');
    expect(s.frames + s.framesAfterBreak).toBeGreaterThanOrEqual(119); // the frames past the damage still count
  });
});

describe('[ADR 0027 V3] the numbers V3 asks for', () => {
  it('cross-correlation finds a known offset between two decodes of the same chirps, with a score near 1', () => {
    const { wav, onsetsMs } = chirpWav(4);
    expect(onsetsMs.length).toBeGreaterThan(2);
    const src = pcm16(wav.subarray(44));
    const decim = new Int16Array(Math.floor(src.length / 3)).map((_, i) => src[i * 3]); // 48 to 16 kHz, enough for a check
    const shift = 704; // TN2258's 2112 samples at 16 kHz
    const later = new Int16Array(decim.length + shift);
    later.set(decim, shift);
    const c = crossCorrelate(decim, later, { from: 4000, length: 16000, maxLag: 1000 });
    expect(c.lag).toBe(shift);
    expect(c.score).toBeGreaterThan(0.999);
  });

  it('a decoded length against the counted frames: within one frame, within one frame after priming, or neither', () => {
    expect(lengthAgainstFrames(100 * AAC_FRAME_SAMPLES - 500, 100)).toEqual({ gap: 500, within: 'one-frame' });
    expect(lengthAgainstFrames(100 * AAC_FRAME_SAMPLES - AAC_PRIMING_SAMPLES, 100)).toEqual({ gap: AAC_PRIMING_SAMPLES, within: 'one-frame-after-priming' });
    expect(lengthAgainstFrames(90 * AAC_FRAME_SAMPLES, 100).within).toBe('no');
    expect(FRAME_AT_PCM).toBeCloseTo(341.33, 2);
  });

  it('zeros at the end and loudness', () => {
    expect(zeroRunAtEnd(new Int16Array([5, 0, 3, 0, 0]))).toBe(2);
    expect(rms(new Int16Array([3, -3, 3, -3]))).toBe(3);
  });
});

describe('[ADR 0027 V3] the run is planned by the app\'s own code, as transcribe-whisper.ts calls it', () => {
  const ms = (frames: number) => (frames * AAC_FRAME_SAMPLES * 1000) / 48000;
  const pcmFor = (startMs: number, endMs: number) => new Int16Array(Math.round(((endMs - startMs) * 16000) / 1000)).fill(1).buffer;

  it('a kill-cut take whose decoder fails reads the whole-frame copy and plans over the counted frames', async () => {
    const cut = truncations(take(120))[0].bytes;
    const log: string[] = [];
    const run = await planRun(
      {
        probeMs: async (uri) => {
          log.push(`probe ${uri}`);
          if (uri === 'take') throw Object.assign(new Error('x'), { code: 'ERR_SCRIBE_AUDIO_DECODE' });
          return ms(90) - (AAC_PRIMING_SAMPLES * 1000) / 48000;
        },
        decode: async (_uri, pieces) => pcmFor(pieces[0].srcStartMs, pieces[0].srcEndMs),
      },
      'take',
      cut,
      null,
      async () => ({ uri: 'copy', remove: () => log.push('removed') }),
    );
    expect(run).toMatchObject({ refused: null, usedCopy: true });
    expect(run.durationMs).toBeCloseTo(ms(90), 6);
    expect(run.windows).toHaveLength(1);
    expect(log).toEqual(['probe take', 'probe copy', 'removed']);
  });

  it('a damaged take whose decoder reads short is refused as break_inside, never planned without its end', async () => {
    const d = damageSync(take(120)).bytes;
    const run = await planRun({ probeMs: async () => ms(100), decode: async () => new ArrayBuffer(0) }, 'take', d, null, async () => {
      throw new Error('a break never gets the copy');
    });
    expect(run).toMatchObject({ refused: 'break_inside', usedCopy: false, windows: [] });
  });

  it('a damaged take whose decoder reads its whole length is planned over every counted frame', async () => {
    const d = damageSync(take(120)).bytes;
    const run = await planRun({ probeMs: async () => ms(120), decode: async (_u, p) => pcmFor(p[0].srcStartMs, p[0].srcEndMs) }, 'take', d, null, async () => {
      throw new Error('no copy');
    });
    expect(run.refused).toBeNull();
    expect(run.durationMs).toBeGreaterThanOrEqual(ms(119));
  });
});
