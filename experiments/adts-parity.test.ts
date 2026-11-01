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
  SIGNAL_RMS,
  chirpWav,
  classifyHelperError,
  codeOf,
  crossCorrelate,
  damageReading,
  damageLength,
  damageSync,
  firstHelperFailure,
  frameStarts,
  lengthAgainstFrames,
  pcm16,
  planRun,
  rms,
  truncations,
  zeroRunAtEnd,
  zeroRunWithSignal,
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

  it('the generated take has signal to its very end, so the damage near the end always has audio to compare (review of #282)', () => {
    const src = pcm16(chirpWav(30).wav.subarray(44));
    const rate = 48000;
    expect(src.length).toBe(30 * rate);
    expect(rms(src, src.length - AAC_FRAME_SAMPLES)).toBeGreaterThan(SIGNAL_RMS); // the last frame
    for (let end = src.length; end > src.length - 2 * rate; end -= rate / 10) expect(rms(src, end - rate / 10, end), `100 ms ending at ${end}`).toBeGreaterThan(SIGNAL_RMS);
    // Where the two damage cases fall, 20 and 10 frames from the end, the take holds signal.
    for (const fromEnd of [20, 10]) expect(rms(src, src.length - fromEnd * AAC_FRAME_SAMPLES)).toBeGreaterThan(SIGNAL_RMS);
    expect(src.reduce((m, x) => Math.max(m, Math.abs(x)), 0)).toBeLessThan(32767); // no clipping
  });

  it('cross-correlation says nothing (null) on silence or with no overlap, never a fake lag', () => {
    expect(crossCorrelate(new Int16Array(1000), new Int16Array(1000), { from: 100, length: 500, maxLag: 50 })).toEqual({ lag: null, score: null });
    expect(crossCorrelate(new Int16Array(1000).fill(5), new Int16Array(1000), { from: 100, length: 500, maxLag: 50 })).toEqual({ lag: null, score: null });
    expect(crossCorrelate(new Int16Array(100).fill(5), new Int16Array(10).fill(5), { from: 50, length: 50, maxLag: 5 })).toEqual({ lag: null, score: null });
  });

  it('an error becomes its code, never its message (a helper message can hold a path)', () => {
    expect(codeOf(Object.assign(new Error('Command failed: /Users/me/Library/Developer/x.aac'), { code: 'helper_crashed_SIGTRAP' }))).toBe('helper_crashed_SIGTRAP');
    expect(codeOf(new Error('Command failed: /Users/me/x.aac'))).toBe('error');
    expect(codeOf(Object.assign(new Error('x'), { code: '/Users/me/x.aac' }))).toBe('error');
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

describe('[ADR 0027 V3] reading a damaged file the ADR\'s way', () => {
  const base = { helperFailed: null, probeOk: true, fullLength: true, refused: null, earlyStops: 0, referenceRms: 5000, comparable: true, pastAllZero: false, score: 0.99 };
  it.each([
    ['the helper crashed: an answer to report', { helperFailed: 'helper_crashed_SIGTRAP' }, 'helper-failed', true, true],
    ['short, and the run refused: as the ADR wants', { fullLength: false, refused: 'break_inside' }, 'refused', false, true],
    ['short, and not refused: report it', { fullLength: false }, 'short-not-refused', true, true],
    ['full length with an early stop: silent stop, whatever the audio', { earlyStops: 1, score: 0.99 }, 'stops-silently', true, true],
    ['the undamaged take silent past the damage: cannot tell (review of #282)', { referenceRms: 0, pastAllZero: true, score: null }, 'cannot-tell', false, false],
    ['too short a span to compare: cannot tell', { comparable: false }, 'cannot-tell', false, false],
    ['zeros where the undamaged take has signal: silent stop', { pastAllZero: true, score: null }, 'stops-silently', true, true],
    ['the right audio past the damage: read past', {}, 'read-past', false, true],
    ['other audio past the damage: mismatch', { score: 0.3 }, 'mismatch', true, true],
  ] as const)('%s', (_name, change, reading, failure, decided) => {
    expect(damageReading({ ...base, ...change })).toMatchObject({ reading, failure, decided });
  });
});

describe('[ADR 0027 V3] review of #282, round 2', () => {
  it('Ctrl-C or SIGTERM on the helper is the person stopping the run, never an answer; a timeout and a crash are answers', () => {
    expect(classifyHelperError(Object.assign(new Error('x'), { signal: 'SIGINT', status: null }))).toBe('interrupt');
    expect(classifyHelperError(Object.assign(new Error('x'), { signal: 'SIGTERM', status: null }))).toBe('interrupt');
    // execFileSync's own timeout kills with SIGTERM and says ETIMEDOUT: that is a stall, an answer.
    expect(classifyHelperError(Object.assign(new Error('x'), { code: 'ETIMEDOUT', signal: 'SIGTERM' }))).toBe('helper_timeout');
    expect(classifyHelperError(Object.assign(new Error('x'), { signal: 'SIGTRAP', status: null }))).toBe('helper_crashed_SIGTRAP');
    expect(classifyHelperError(Object.assign(new Error('x'), { signal: null, status: 3 }))).toBe('helper_crashed_exit_3');
    expect(classifyHelperError(new SyntaxError('Unexpected end of JSON input'))).toBe('helper_bad_output');
    expect(classifyHelperError(Object.assign(new Error('Command failed: /Users/me/x.aac'), { signal: '/Users/me' }))).toBe('helper_crashed_exit_unknown');
  });

  it('a helper failure anywhere in a damaged file\'s calls, its planned run included, is the answer for that file', () => {
    expect(firstHelperFailure([undefined, null, 'decoder_short', 'helper_crashed_SIGSEGV', 'helper_timeout'])).toBe('helper_crashed_SIGSEGV');
    expect(firstHelperFailure([undefined, 'break_inside', 'ERR_SCRIBE_AUDIO_DECODE'])).toBeNull();
    const base = { probeOk: true, fullLength: true, refused: null, earlyStops: 0, referenceRms: 5000, comparable: true, pastAllZero: false, score: 0.99 };
    expect(damageReading({ ...base, helperFailed: firstHelperFailure([undefined, undefined, 'helper_crashed_SIGTRAP']) })).toMatchObject({ reading: 'helper-failed', failure: true });
  });

  it('a shift over one frame is named in the reading, so ADR 0027 V3 (3)\'s "within one frame" can be judged from the report', () => {
    const base = { helperFailed: null, probeOk: true, fullLength: true, refused: null, earlyStops: 0, referenceRms: 5000, comparable: true, pastAllZero: false, score: 0.99 };
    expect(damageReading({ ...base, lagFrames: 1 }).text).toBe('full length, the right audio past the damage: read past');
    expect(damageReading({ ...base, lagFrames: 0.4 }).text).toBe('full length, the right audio past the damage: read past');
    const two = damageReading({ ...base, lagFrames: 2 });
    expect(two).toMatchObject({ reading: 'read-past', failure: false });
    expect(two.text).toContain('shifted 2 frames (dropped at the damage; ADR 0027 V3 (3) says within one frame: judge it)');
  });

  it('a frame or more of zeros where the undamaged take has signal reads as a silent stop, though the rest correlates', () => {
    const n = 16000;
    const ref = new Int16Array(n).map((_, i) => Math.round(3000 * Math.sin(i / 7)));
    const dropout = ref.slice();
    dropout.fill(0, 4000, 4000 + 2 * 342); // two frames of zeros: about 4 percent of the span
    expect(zeroRunWithSignal(dropout, ref, { from: 0, length: n, lag: 0 })).toBe(2 * 342);
    // Where the reference is silent too, zeros are not audio the decoder failed to return.
    const quiet = ref.slice();
    quiet.fill(0, 8000, 9000);
    const quietOut = quiet.slice();
    expect(zeroRunWithSignal(quietOut, quiet, { from: 0, length: n, lag: 0 })).toBe(0);
    // Under one frame of zeros is not a dropout.
    const tiny = ref.slice();
    tiny.fill(0, 100, 300);
    expect(zeroRunWithSignal(tiny, ref, { from: 0, length: n, lag: 0 })).toBe(200);
    const base = { helperFailed: null, probeOk: true, fullLength: true, refused: null, earlyStops: 0, referenceRms: 3000, comparable: true, pastAllZero: false, score: 0.97 };
    expect(damageReading({ ...base, zeroRun: 2 * 342 })).toMatchObject({ reading: 'stops-silently', failure: true });
    expect(damageReading({ ...base, zeroRun: 2 * 342 }).text).toContain('A RUN OF 2 FRAMES OF ZEROS PAST THE DAMAGE');
    expect(damageReading({ ...base, zeroRun: 200 })).toMatchObject({ reading: 'read-past' });
  });

  it('a window decode that throws is decided by the planned run: refused is fine, planned is a failure (review of #282, round 3)', () => {
    const base = { helperFailed: null, probeOk: true, fullLength: true, earlyStops: 0, referenceRms: null, comparable: false, pastAllZero: false, score: null };
    expect(damageReading({ ...base, windowError: 'ERR_SCRIBE_AUDIO_DECODE', refused: 'break_inside' })).toMatchObject({ reading: 'refused', failure: false, decided: true });
    const planned = damageReading({ ...base, windowError: 'ERR_SCRIBE_AUDIO_DECODE', refused: null });
    expect(planned).toMatchObject({ reading: 'decode-throws', failure: true, decided: true });
    expect(planned.text).toBe('the window past the damage throws (ERR_SCRIBE_AUDIO_DECODE), and the run was planned: report it');
    // A helper failure still comes first.
    expect(damageReading({ ...base, helperFailed: 'helper_timeout', windowError: 'helper_timeout', refused: null })).toMatchObject({ reading: 'helper-failed' });
  });
});
