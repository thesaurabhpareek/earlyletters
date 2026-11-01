/** The melody is data and rules, so it is tested without any audio. See src/film/sound/raga.ts. */
import { describe, expect, it } from 'vitest';
import { BEAT_SECONDS, BHOOPALI, MELODY_SA_HZ, PHRASES, describe as contour, hzOf, noteName, perform, pickPhrase, type Stage } from '../src/film/sound/raga';
import { TONE_REGISTER } from '../src/film/sound/ambient-map';

function seeded(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const tellings = PHRASES.flatMap((p) => [
  { id: p.id, which: 'main' as const, notes: p.notes },
  ...(p.alt ? [{ id: p.id, which: 'alt' as const, notes: p.alt }] : []),
]);
const inScale = (semis: number) => (BHOOPALI as readonly number[]).includes(((semis % 12) + 12) % 12);

describe('the melody (raga Bhoopali, original)', () => {
  it('has four to six phrases, each of five to nine notes', () => {
    expect(PHRASES.length).toBeGreaterThanOrEqual(4);
    expect(PHRASES.length).toBeLessThanOrEqual(6);
    for (const t of tellings) {
      expect(t.notes.length).toBeGreaterThanOrEqual(5);
      expect(t.notes.length).toBeLessThanOrEqual(9);
    }
  });

  it('uses only the five notes of the raga (no Ma, no Ni), so nothing can form a tritone or a flat second with the drone', () => {
    for (const t of tellings)
      for (const n of t.notes) for (const p of [n.p, n.to, n.kan]) if (p !== undefined) expect(inScale(p), `${t.id}/${t.which} has ${p}`).toBe(true);
  });

  it('moves by steps and small leaps: nothing wider than a fourth, and a fourth only rarely', () => {
    let fourths = 0;
    for (const t of tellings) {
      const d = contour({ ...PHRASES.find((p) => p.id === t.id)! }, t.which);
      expect(d.largestLeap, `${t.id}/${t.which}`).toBeLessThanOrEqual(5);
      fourths += d.largestLeap === 5 ? 1 : 0;
    }
    expect(fourths).toBeLessThanOrEqual(2);
  });

  it('is slow: nothing shorter than three quarters of a beat, mostly a beat or more, and long notes carry the peaks and the ends', () => {
    for (const t of tellings) {
      const durs = t.notes.map((n) => n.d);
      expect(Math.min(...durs)).toBeGreaterThanOrEqual(0.75);
      expect(durs.filter((d) => d >= 1).length).toBeGreaterThanOrEqual(durs.length - 1);
      expect(Math.max(...durs)).toBeGreaterThanOrEqual(3); // somewhere to rest
      expect(durs[durs.length - 1]).toBeGreaterThanOrEqual(3); // it ends on a held note, then silence
      const peak = Math.max(...t.notes.map((n) => Math.max(n.p, n.to ?? -99)));
      const peakNote = t.notes.find((n) => Math.max(n.p, n.to ?? -99) === peak)!;
      expect(peakNote.d, `${t.id}/${t.which} peak is stretched`).toBeGreaterThanOrEqual(2);
    }
  });

  it('lets each phrase do its job: question stays open, answers and homes settle on Sa, the warm one rests on Pa or Sa', () => {
    const last = (id: string, which: 'main' | 'alt') => {
      const t = tellings.find((x) => x.id === id && x.which === which)!;
      const n = t.notes[t.notes.length - 1];
      return (((n.to ?? n.p) % 12) + 12) % 12;
    };
    for (const which of ['main', 'alt'] as const) {
      expect(last('sigh', which)).toBe(0);
      expect(last('lull', which)).toBe(0);
      expect([0, 7]).toContain(last('warmth', which));
    }
    expect(last('rest', 'main')).toBe(0);
    expect(last('ask', 'main')).not.toBe(0); // a question: it does not close
    expect(last('ask', 'alt')).not.toBe(0);
  });

  it('has the larger arc: a low home, a reach to upper Sa or Re, and one higher warm peak', () => {
    const top = (id: string) => Math.max(...PHRASES.find((p) => p.id === id)!.notes.map((n) => Math.max(n.p, n.to ?? -99)));
    expect(top('lull')).toBeLessThanOrEqual(4);
    expect(top('ask')).toBeLessThanOrEqual(7);
    expect(top('reach')).toBeGreaterThanOrEqual(12);
    expect(top('warmth')).toBeGreaterThan(top('reach'));
  });

  it('stays where a phone speaker can play it: nothing below Dha at about 247 Hz or above about 750 Hz', () => {
    for (const t of tellings)
      for (const n of t.notes)
        for (const p of [n.p, n.to ?? n.p, n.kan ?? n.p]) {
          expect(hzOf(p)).toBeGreaterThanOrEqual(245);
          expect(hzOf(p)).toBeLessThanOrEqual(750);
        }
    expect(hzOf(0)).toBeCloseTo(MELODY_SA_HZ);
    expect(hzOf(12)).toBeCloseTo(2 * MELODY_SA_HZ);
  });

  it('names notes', () => {
    expect(noteName(0)).toBe('Sa');
    expect(noteName(7)).toBe('Pa');
    expect(noteName(14)).toBe("Re'");
    expect(noteName(-3)).toBe('Dha,');
  });
});

describe('choosing and performing phrases', () => {
  const run = (tone: 'night' | 'dusk' | 'paper', n: number, seed: number, progress = 0.5) => {
    const rand = seeded(seed);
    let hist: string[] = [];
    let prev: Stage | null = null;
    const out: { id: string; stage: Stage }[] = [];
    for (let i = 0; i < n; i++) {
      const { phrase, stage } = pickPhrase(hist, prev, tone, progress, TONE_REGISTER[tone], rand);
      perform(phrase, rand);
      hist = [...hist, phrase.id].slice(-4);
      prev = stage;
      out.push({ id: phrase.id, stage });
    }
    return out;
  };

  it('never plays the same phrase twice in a row, and always answers a question', () => {
    for (const tone of ['night', 'dusk', 'paper'] as const) {
      const seq = run(tone, 400, 5);
      for (let i = 1; i < seq.length; i++) {
        expect(seq[i].id).not.toBe(seq[i - 1].id);
        if (seq[i - 1].stage === 'open') expect(seq[i].stage).toBe('answer');
      }
    }
  });

  it('starts with an opening phrase and uses all the phrases over time', () => {
    for (const tone of ['night', 'dusk'] as const) {
      const seq = run(tone, 400, 9);
      expect(seq[0].stage).toBe('open');
      expect(new Set(seq.map((s) => s.id)).size).toBeGreaterThanOrEqual(5);
    }
    expect(new Set(run('paper', 400, 9).map((s) => s.id)).size).toBe(PHRASES.length);
  });

  it('keeps the bright last word for paper (or the end of the film)', () => {
    expect(run('night', 400, 3).some((s) => s.id === 'rest')).toBe(false);
    expect(run('dusk', 400, 3).some((s) => s.id === 'rest')).toBe(false);
    expect(run('dusk', 400, 3, 0.97).some((s) => s.id === 'rest')).toBe(true);
    expect(run('paper', 400, 3).some((s) => s.id === 'rest')).toBe(true);
  });

  it('leans low at night and high on paper', () => {
    const mean = (tone: 'night' | 'paper') => {
      const seq = run(tone, 600, 21);
      return seq.reduce((a, s) => a + PHRASES.find((p) => p.id === s.id)!.register, 0) / seq.length;
    };
    expect(mean('night')).toBeLessThan(mean('paper') - 0.1);
  });

  it('does not repeat long stretches of the sequence (no loop): no run of 25 phrases repeats within 600', () => {
    for (const tone of ['night', 'dusk', 'paper'] as const) {
      const ids = run(tone, 600, 77).map((s) => s.id);
      let longest = 0;
      for (let i = 0; i < ids.length; i += 3)
        for (let j = i + 1; j < ids.length; j += 3) {
          let k = 0;
          while (j + k < ids.length && ids[i + k] === ids[j + k]) k++;
          longest = Math.max(longest, k);
        }
      expect(longest).toBeLessThan(25);
    }
  });

  it('never plays a phrase the same way twice: timing, strength and pitch differ, and the length stays within 15 % of nominal', () => {
    const rand = seeded(1);
    for (const phrase of PHRASES) {
      const a = perform(phrase, rand);
      const b = perform(phrase, rand);
      expect(a.notes.map((n) => n.at.toFixed(3)).join()).not.toBe(b.notes.map((n) => n.at.toFixed(3)).join());
      expect(a.notes.map((n) => n.vel.toFixed(3)).join()).not.toBe(b.notes.map((n) => n.vel.toFixed(3)).join());
      for (const x of [a, b]) {
        for (let i = 1; i < x.notes.length; i++) expect(x.notes[i].at).toBeGreaterThan(x.notes[i - 1].at);
        for (const n of x.notes) {
          expect(Math.abs(n.cents)).toBeLessThanOrEqual(4);
          expect(n.vel).toBeGreaterThan(0.5);
          expect(n.vel).toBeLessThan(1.4);
        }
        const nominal = (x.alt ? phrase.alt! : phrase.notes).reduce((s, n) => s + n.d, 0) * BEAT_SECONDS;
        expect(x.seconds).toBeGreaterThan(nominal * 0.85);
        expect(x.seconds).toBeLessThan(nominal * 1.15);
      }
    }
  });
});
