import { describe, expect, it } from 'vitest';
import {
  PLAN_DEFAULTS,
  chunkSampleCount,
  chunkTimeToSourceMs,
  joinAtBoundaries,
  msToSamples,
  normalizeSpans,
  planChunks,
  vadWindows,
  type Chunk,
  type SpeechSpan,
} from '../src/lib/transcribe-plan';

const s = (startMs: number, endMs: number): SpeechSpan => ({ startMs, endMs });
const MAX = PLAN_DEFAULTS.maxChunkMs;

/** Small seeded PRNG (mulberry32) so the property checks are repeatable. */
function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function randomSpans(seed: number, durationMs: number): SpeechSpan[] {
  const r = rng(seed);
  const out: SpeechSpan[] = [];
  let t = Math.floor(r() * 3000);
  while (t < durationMs) {
    const speech = 300 + Math.floor(r() * (r() < 0.1 ? 45_000 : 9000)); // now and then a long run with no pause
    const pause = 100 + Math.floor(r() * (r() < 0.2 ? 8000 : 1200));
    out.push(s(t, Math.min(durationMs, t + speech)));
    t += speech + pause;
  }
  return out;
}

describe('chunk planner (TDD 03 3.5.3)', () => {
  it('[TDD 03 3.5.7 rule 1] no speech means no chunks, so Whisper never runs on silence', () => {
    expect(planChunks([], 60_000)).toEqual([]);
    expect(planChunks([s(5000, 5000)], 60_000)).toEqual([]);
  });

  it('keeps one short letter in one chunk with its pauses as recorded', () => {
    const chunks = planChunks([s(1000, 4000), s(4800, 9000), s(10_200, 12_000)], 15_000);
    expect(chunks).toHaveLength(1);
    expect(chunks[0].pieces).toEqual([{ srcStartMs: 1000, srcEndMs: 12_000, silenceBeforeMs: 0 }]);
    expect(chunks[0].audioMs).toBe(11_000);
    expect(chunks[0].speechMs).toBe(3000 + 4200 + 1800);
    expect(chunks[0].ownStartMs).toBe(-Infinity);
    expect(chunks[0].ownEndMs).toBe(Infinity);
  });

  it('shortens a long pause to digital silence instead of sending it (nothing to invent words from)', () => {
    const [c] = planChunks([s(0, 3000), s(9000, 11_000)], 12_000);
    expect(c.pieces).toEqual([
      { srcStartMs: 0, srcEndMs: 3000, silenceBeforeMs: 0 },
      { srcStartMs: 9000, srcEndMs: 11_000, silenceBeforeMs: PLAN_DEFAULTS.shortenedPauseMs },
    ]);
    expect(c.audioMs).toBe(3000 + PLAN_DEFAULTS.shortenedPauseMs + 2000);
  });

  it('cuts a long letter in its longest pause in the second half of a chunk', () => {
    // 6 s of speech each, 1 s pauses except one 1.4 s pause after the 3rd span (in the second half).
    const spans = [s(0, 6000), s(7000, 13_000), s(14_000, 20_000), s(21_400, 27_400), s(28_400, 34_400)];
    const chunks = planChunks(spans, 40_000);
    expect(chunks).toHaveLength(2);
    expect(chunks[0].pieces[chunks[0].pieces.length - 1].srcEndMs).toBe(20_000);
    expect(chunks[1].pieces[0].srcStartMs).toBe(21_400);
    for (const c of chunks) expect(c.audioMs).toBeLessThanOrEqual(MAX);
  });

  it('splits continuous speech longer than a chunk evenly, with overlap that is owned exactly once', () => {
    const chunks = planChunks([s(2000, 72_000)], 80_000);
    expect(chunks).toHaveLength(3); // ceil(70 s / (28 s - 2 x 0.5 s))
    expect(chunks[0].ownStartMs).toBe(-Infinity);
    expect(chunks[2].ownEndMs).toBe(Infinity);
    expect(chunks[0].ownEndMs).toBe(chunks[1].ownStartMs);
    expect(chunks[1].ownEndMs).toBe(chunks[2].ownStartMs);
    // Shared audio on each side of an interior cut.
    expect(chunks[0].pieces[0].srcEndMs - chunks[0].ownEndMs).toBe(PLAN_DEFAULTS.overlapMs);
    expect(chunks[1].ownStartMs - chunks[1].pieces[0].srcStartMs).toBe(PLAN_DEFAULTS.overlapMs);
    for (const c of chunks) expect(c.audioMs).toBeLessThanOrEqual(MAX);
  });

  it('is deterministic: the same speech always gives the same chunks', () => {
    const spans = randomSpans(7, 600_000);
    expect(planChunks(spans, 600_000)).toEqual(planChunks(spans.map((x) => ({ ...x })), 600_000));
  });

  it('property: every chunk fits Whisper, chunks are in order, and all speech is sent (20 random letters)', () => {
    for (let seed = 1; seed <= 20; seed++) {
      const duration = 30_000 + Math.floor(rng(seed)() * 900_000);
      const spans = randomSpans(seed, duration);
      const chunks = planChunks(spans, duration);
      let lastEnd = -1;
      for (const c of chunks) {
        expect(c.audioMs).toBeLessThanOrEqual(MAX);
        for (const p of c.pieces) {
          expect(p.srcStartMs).toBeGreaterThanOrEqual(0);
          expect(p.srcEndMs).toBeLessThanOrEqual(duration);
          expect(p.srcEndMs).toBeGreaterThan(p.srcStartMs);
        }
        const first = c.pieces[0].srcStartMs;
        if (!Number.isFinite(c.ownStartMs)) expect(first).toBeGreaterThanOrEqual(lastEnd);
        lastEnd = c.pieces[c.pieces.length - 1].srcEndMs;
      }
      for (const span of normalizeSpans(spans, duration)) {
        const covered = (t: number) => chunks.some((c) => c.pieces.some((p) => p.srcStartMs <= t && t < p.srcEndMs));
        expect(covered(span.startMs), `seed ${seed} start ${span.startMs}`).toBe(true);
        expect(covered(Math.max(span.startMs, span.endMs - 1)), `seed ${seed} end ${span.endMs}`).toBe(true);
      }
    }
  });

  it('refuses options that leave no room for speech between overlaps', () => {
    expect(() => planChunks([s(0, 1000)], 1000, { maxChunkMs: 1500, overlapMs: 500 })).toThrow('plan_options_invalid');
  });
});

describe('chunk timing helpers', () => {
  const chunk: Chunk = {
    index: 0,
    pieces: [
      { srcStartMs: 1000, srcEndMs: 3000, silenceBeforeMs: 0 },
      { srcStartMs: 9000, srcEndMs: 10_000, silenceBeforeMs: 600 },
    ],
    ownStartMs: -Infinity,
    ownEndMs: Infinity,
    audioMs: 3600,
    speechMs: 3000,
  };

  it('maps chunk time back to the recording, skipping inserted silence', () => {
    expect(chunkTimeToSourceMs(chunk, 0)).toBe(1000);
    expect(chunkTimeToSourceMs(chunk, 1500)).toBe(2500);
    expect(chunkTimeToSourceMs(chunk, 2300)).toBe(9000); // inside the inserted silence
    expect(chunkTimeToSourceMs(chunk, 2700)).toBe(9100);
    expect(chunkTimeToSourceMs(chunk, 99_999)).toBe(10_000);
  });

  it('[LEGAL-REQ-018] sample count matches what the native decoder allocates (16 kHz, rounded per piece)', () => {
    expect(msToSamples(1000)).toBe(16_000);
    expect(msToSamples(0.03)).toBe(0);
    expect(msToSamples(0.04)).toBe(1);
    expect(chunkSampleCount(chunk)).toBe(32_000 + 9600 + 16_000);
  });

  it('runs voice detection in 5-minute windows and joins speech cut by a window edge', () => {
    expect(vadWindows(12 * 60_000)).toEqual([
      { startMs: 0, endMs: 300_000 },
      { startMs: 300_000, endMs: 600_000 },
      { startMs: 600_000, endMs: 720_000 },
    ]);
    expect(vadWindows(0)).toEqual([]);
    const joined = joinAtBoundaries([s(290_000, 300_000), s(300_000, 305_000), s(306_000, 307_000)], [300_000]);
    expect(joined).toEqual([s(290_000, 305_000), s(306_000, 307_000)]);
    // Touching spans away from a window edge stay separate (a real, very short pause).
    expect(joinAtBoundaries([s(0, 1000), s(1000, 2000)], [300_000])).toHaveLength(2);
  });

  it('normalizes spans: clamps to the recording, sorts, merges overlaps, drops empty ones', () => {
    expect(normalizeSpans([s(5000, 7000), s(-200, 1000), s(900, 1500), s(8000, 8000), s(9000, 99_000)], 10_000)).toEqual([
      s(0, 1500),
      s(5000, 7000),
      s(9000, 10_000),
    ]);
  });
});
