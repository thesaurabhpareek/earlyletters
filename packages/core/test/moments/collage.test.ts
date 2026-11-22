/**
 * Day collage: tile choice and layout (NS-53-R41, R44, R46; MT-P6-R14 to R18).
 * Inputs are capture time, session, heart, attached and kind. Nothing else.
 * Asha fixture: a Saturday in October 2026, phone in America/Los_Angeles.
 */
import { describe, expect, it } from 'vitest';
import { chooseTiles, collageLayout, toTileCandidate, type TileCandidate } from '../../src/moments/collage';
import { MOMENTS_RULES } from '../../src/moments';

const H = 3_600_000;
const T0 = Date.UTC(2026, 9, 24, 16, 0, 0); // 09:00 local on the day
let n = 0;
function pic(id: string, hours: number, session: number, extra: Partial<TileCandidate> = {}): TileCandidate {
  n += 1;
  return {
    id,
    startMs: T0 + hours * H,
    endMs: T0 + hours * H,
    kind: 'image',
    session,
    favourite: false,
    attached: false,
    panorama: false,
    ...extra,
  };
}
const ids = (xs: readonly { id: string }[]) => xs.map((x) => x.id);
function shuffled<T>(xs: readonly T[], seed: number): T[] {
  const a = [...xs];
  let s = seed >>> 0;
  for (let i = a.length - 1; i > 0; i--) {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    const j = s % (i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
const OPTS = { tiles: 4 };

describe('collage layout', () => {
  it('[MT-P6-R16] 1, 2, 3 and 4 or more tiles give the four fixed layouts', () => {
    expect(collageLayout(0)).toBe('none');
    expect(collageLayout(1)).toBe('single-4x3');
    expect(collageLayout(2)).toBe('two-squares');
    expect(collageLayout(3)).toBe('tall-plus-two');
    expect(collageLayout(4)).toBe('two-by-two');
    expect(collageLayout(9)).toBe('two-by-two');
  });

  it('[MT-P6-R16] the result carries no count, "more" or "+N" field', () => {
    const c = chooseTiles([pic('a', 0, 0), pic('b', 1, 0)], OPTS);
    expect(Object.keys(c).sort()).toEqual(['fallbacks', 'layout', 'tiles']);
  });
});

describe('tile choice', () => {
  it('[NS-53-R41] a day with no candidates gives no tiles and no layout', () => {
    const c = chooseTiles([], OPTS);
    expect(c.tiles).toEqual([]);
    expect(c.layout).toBe('none');
  });

  it('[MT-P6-R14] pictures attached to a letter come first, then hearts, then the rest', () => {
    const c = chooseTiles(
      [
        pic('rest1', 0, 0),
        pic('heart1', 1, 0, { favourite: true }),
        pic('att1', 2, 0, { attached: true }),
        pic('rest2', 3, 0),
      ],
      { tiles: 2 },
    );
    expect(c.tiles[0]).toBe('att1');
    expect(c.tiles).toContain('heart1');
    expect(c.tiles).toHaveLength(2);
  });

  it('[NS-53-R41] a hearted picture is the lead tile when nothing is attached', () => {
    const c = chooseTiles(
      [pic('a', 0, 0), pic('b', 1, 0), pic('c', 2, 0, { favourite: true }), pic('d', 3, 0)],
      OPTS,
    );
    expect(c.tiles[0]).toBe('c');
  });

  it('[MT-P6-R14] hearts are taken by capture time and capped at the tile count', () => {
    const hearts = ['h1', 'h2', 'h3', 'h4', 'h5'].map((id, i) => pic(id, i, 0, { favourite: true }));
    const c = chooseTiles([...hearts, pic('plain', 6, 0)], OPTS);
    expect(c.tiles.slice().sort()).toEqual(['h1', 'h2', 'h3', 'h4']);
    expect(c.tiles[0]).toBe('h1');
  });

  it('[NS-53-R44] with no heart, tile 1 is the candidate nearest the middle of the middle session, never the first picture', () => {
    // sessions: 0 (hours 0..1), 1 (hours 6..8, the middle one of three), 2 (hours 12..13)
    const cs = [
      pic('s0a', 0, 0), pic('s0b', 1, 0),
      pic('s1a', 6, 1), pic('s1b', 7, 1), pic('s1c', 8, 1),
      pic('s2a', 12, 2), pic('s2b', 13, 2),
    ];
    const c = chooseTiles(cs, OPTS);
    expect(c.tiles[0]).toBe('s1b');
    expect(c.tiles[0]).not.toBe('s0a');
  });

  it('[NS-53-R44] an even number of sessions takes the earlier of the two middle sessions', () => {
    const cs = [pic('a', 0, 0), pic('b', 5, 1), pic('c', 10, 2), pic('d', 15, 3)];
    expect(chooseTiles(cs, OPTS).tiles[0]).toBe('b');
  });

  it('[MT-P6-R15] after tile 1, each session without a tile gets one, in time order', () => {
    const cs = [
      pic('a1', 0, 0), pic('a2', 0.5, 0),
      pic('b1', 6, 1), pic('b2', 7, 1), pic('b3', 8, 1),
      pic('c1', 12, 2), pic('c2', 12.5, 2),
      pic('d1', 20, 3),
    ];
    const c = chooseTiles(cs, { tiles: 4 });
    const sessionOf = (id: string) => cs.find((x) => x.id === id)!.session;
    expect(c.tiles.map(sessionOf).sort()).toEqual([0, 1, 2, 3]);
  });

  it('[MT-P6-R15] with all sessions covered, the next tile is at the middle of the longest remaining gap', () => {
    // one session, candidates at 0, 1, 2, 3, 10, 11, 12 hours; tile 1 is the one nearest the session middle (6h): 3 or 10 -> 3 (tie: earlier)
    const cs = [0, 1, 2, 3, 10, 11, 12].map((h) => pic(`p${h}`, h, 0));
    const c = chooseTiles(cs, { tiles: 3 });
    expect(c.tiles).toContain('p3');
    // longest gap after p3 is 3h..12h (or edge 0..3); the candidate nearest 7.5h is p10 (2.5 away) vs p3 (chosen)
    expect(c.tiles.slice().sort()).toContain('p10');
  });

  it('[MT-P6-R15] ties go to the earlier time, then the lower identifier', () => {
    const a = pic('b-id', 5, 0);
    const b = pic('a-id', 5, 0);
    const c = chooseTiles([a, b], { tiles: 1 });
    expect(c.tiles).toEqual(['a-id']);
  });

  it('[NS-53-R41] at most one video tile, and a panorama is never a tile', () => {
    const cs = [
      pic('v1', 0, 0, { kind: 'video' }),
      pic('v2', 1, 0, { kind: 'video', favourite: true }),
      pic('pano', 2, 0, { panorama: true, favourite: true }),
      pic('i1', 3, 0),
      pic('i2', 4, 0),
      pic('i3', 5, 0),
    ];
    const c = chooseTiles(cs, OPTS);
    const kinds = c.tiles.map((id) => cs.find((x) => x.id === id)!.kind);
    expect(kinds.filter((k) => k === 'video')).toHaveLength(1);
    expect(c.tiles).not.toContain('pano');
    expect(c.fallbacks).not.toContain('pano');
    expect([...c.tiles, ...c.fallbacks].filter((id) => id.startsWith('v'))).toHaveLength(1);
  });

  it('[NS-53-R41] two hearted videos still give one video tile', () => {
    const cs = [
      pic('v1', 0, 0, { kind: 'video', favourite: true }),
      pic('v2', 1, 0, { kind: 'video', favourite: true }),
      pic('i1', 2, 0),
    ];
    const c = chooseTiles(cs, OPTS);
    expect(c.tiles).toEqual(['v1', 'i1']);
    expect(c.fallbacks).toEqual([]);
  });

  it('[MT-P6-R15] a session that already holds a hearted tile does not get a second one before others', () => {
    const cs = [
      pic('h', 0, 0, { favourite: true }), pic('x1', 5, 0), pic('x2', 6, 0), pic('x3', 7, 0),
      pic('y', 20, 1),
    ];
    expect(chooseTiles(cs, { tiles: 2 }).tiles.slice().sort()).toEqual(['h', 'y']);
  });

  it('[MT-P6-R17] fallbacks continue the same order so an iCloud-only tile can take the next candidate', () => {
    const cs = [0, 1, 2, 3, 4, 5].map((h) => pic(`p${h}`, h, 0));
    const c = chooseTiles(cs, { tiles: 4 });
    expect(c.tiles).toHaveLength(4);
    expect(c.fallbacks).toHaveLength(2);
    expect(new Set([...c.tiles, ...c.fallbacks]).size).toBe(6);
  });

  it('[NS-53-R44] fewer candidates than tiles gives only those candidates', () => {
    const c = chooseTiles([pic('a', 0, 0), pic('b', 1, 0)], OPTS);
    expect(c.tiles).toHaveLength(2);
    expect(c.layout).toBe('two-squares');
  });

  it('[NS-53-R44] the lead tile is first and the others follow in time order', () => {
    const cs = [pic('a', 0, 0), pic('b', 1, 0), pic('c', 2, 0, { favourite: true }), pic('d', 3, 0)];
    const c = chooseTiles(cs, OPTS);
    expect(c.tiles[0]).toBe('c');
    expect(c.tiles.slice(1)).toEqual(['a', 'b', 'd']);
  });

  it('[MT-P6-R14] a candidate spanning a burst uses the middle of its range for distance', () => {
    const burst = pic('burst', 0, 0, { endMs: T0 + 2 * H }); // middle at 1h
    const far = pic('far', 10, 0);
    const near = pic('near', 5.2, 0);
    // session middle is 5h; near (5.2) wins over burst (1) and far (10)
    expect(chooseTiles([burst, far, near], { tiles: 1 }).tiles).toEqual(['near']);
  });
});

describe('order independence and hearts', () => {
  const lib: TileCandidate[] = [
    pic('a', 0, 0), pic('b', 0.3, 0), pic('c', 1, 0, { favourite: true }),
    pic('d', 6, 1), pic('e', 7, 1), pic('f', 8, 1, { kind: 'video' }),
    pic('g', 12, 2), pic('h', 12.4, 2), pic('i', 13, 2, { favourite: true }),
    pic('j', 20, 3),
  ];

  it('[NS-53-R59] the same tiles come out of 100 seeded input orders', () => {
    const base = chooseTiles(lib, OPTS);
    for (let s = 1; s <= 100; s++) {
      expect(chooseTiles(shuffled(lib, s), OPTS)).toEqual(base);
    }
  });

  it('[NS-53-R59] extra excluded or panorama candidates do not change the tiles', () => {
    const base = chooseTiles(lib, OPTS);
    const withPano = chooseTiles([...lib, pic('pano', 6.5, 1, { panorama: true })], OPTS);
    expect(withPano.tiles).toEqual(base.tiles);
  });

  it('[MT-P6-R18] every heart (up to the tile count) is a tile, and removing one heart keeps the others', () => {
    const base = chooseTiles(lib, OPTS);
    expect(base.tiles).toContain('c');
    expect(base.tiles).toContain('i');
    const without = chooseTiles(
      lib.map((x) => (x.id === 'c' ? { ...x, favourite: false } : x)),
      OPTS,
    );
    expect(without.tiles).toContain('i');
    expect(without.tiles[0]).toBe('i');
  });

  it('[MT-P6-R18] adding a heart makes that picture the lead and leaves other hearts in', () => {
    const plain = lib.map((x) => ({ ...x, favourite: false }));
    for (const target of ['a', 'd', 'g', 'j']) {
      const c = chooseTiles(
        plain.map((x) => (x.id === target ? { ...x, favourite: true } : x)),
        OPTS,
      );
      expect(c.tiles[0]).toBe(target);
      expect(new Set(c.tiles).size).toBe(c.tiles.length);
    }
  });

  it('[NS-53-R44] tiles are always distinct, from the input, and at most the tile count (property)', () => {
    for (let s = 1; s <= 50; s++) {
      const size = 1 + (s % 12);
      const cs = Array.from({ length: size }, (_, i) =>
        pic(`x${i}`, ((i * 7 + s) % 23) / 2, (i * 3 + s) % 4, { favourite: (i + s) % 5 === 0 }),
      );
      const c = chooseTiles(cs, OPTS);
      expect(new Set(c.tiles).size).toBe(c.tiles.length);
      expect(c.tiles.length).toBeLessThanOrEqual(4);
      expect(c.tiles.length).toBe(Math.min(4, size));
      for (const id of [...c.tiles, ...c.fallbacks]) expect(ids(cs)).toContain(id);
    }
  });

  it('[NS-53-R44] does not mutate its input', () => {
    const copy = JSON.stringify(lib);
    chooseTiles(lib, OPTS);
    expect(JSON.stringify(lib)).toBe(copy);
  });
});

describe('[CPO-19] [CPO-20] [CPO-21] [CPO-22] council rulings, goldens', () => {
  it('[CPO-19] four sessions: the earlier middle session leads, and inside it the candidate nearest its middle', () => {
    const cs = [pic('a', 0, 0), pic('b1', 5, 1), pic('b2', 5.9, 1), pic('b3', 6.2, 1), pic('c', 10, 2), pic('d', 15, 3)];
    // sessions 0..3, n=4: index floor((4-1)/2)=1 is the earlier middle. Session 1 spans 5..6.2, middle 5.6: b2 (0.3) beats b1 (0.6) and b3 (0.6).
    expect(chooseTiles(cs, OPTS).tiles[0]).toBe('b2');
  });

  it('[CPO-20] never two videos: two videos in two sessions give one video among tiles and fallbacks together', () => {
    const cs = [
      pic('v1', 0, 0, { kind: 'video' }), pic('i1', 1, 0),
      pic('v2', 8, 1, { kind: 'video' }), pic('i2', 9, 1),
      pic('i3', 16, 2), pic('i4', 17, 2), pic('i5', 18, 2),
    ];
    for (const tiles of [1, 2, 3, 4]) {
      const c = chooseTiles(cs, { tiles });
      expect([...c.tiles, ...c.fallbacks].filter((id) => id.startsWith('v'))).toHaveLength(1);
    }
  });

  it('[CPO-20] only videos left: the card has fewer tiles, never a second video', () => {
    const c = chooseTiles([pic('v1', 0, 0, { kind: 'video' }), pic('v2', 1, 0, { kind: 'video' }), pic('v3', 2, 1, { kind: 'video' })], OPTS);
    expect(c.tiles).toEqual(['v1']);
    expect(c.fallbacks).toEqual([]);
  });

  it('[CPO-21] golden: the longest gap is an edge (the day end), so a far last picture is a tile', () => {
    // one session 0..12h; tile 1 nearest 6h is p3. Gaps: 0..3 (3h, start edge) and 3..12 (9h, end edge). The end edge is longest.
    const cs = [0, 1, 2, 3, 12].map((h) => pic(`p${h}`, h, 0));
    expect(chooseTiles(cs, { tiles: 2 }).tiles).toEqual(['p3', 'p12']);
  });

  it('[CPO-21] golden: the longest gap is the start edge, and the first picture of the day is a tile', () => {
    const cs = [0, 9, 10, 11, 12].map((h) => pic(`p${h}`, h, 0));
    // tile 1 nearest 6h is p9. Gaps: 0..9 (9h, start edge), 9..12 (3h).
    expect(chooseTiles(cs, { tiles: 2 }).tiles).toEqual(['p9', 'p0']);
  });

  it('[CPO-21] the edge gap measures from the day start, not midnight: the pick is the one nearest that gap middle', () => {
    const cs = [0, 3, 6, 11, 12].map((h) => pic(`p${h}`, h, 0));
    // session middle 6h: p6. Gaps: 0..6 (start edge) and 6..12. Equal, earlier first: nearest 3h is p3.
    expect(chooseTiles(cs, { tiles: 2 }).tiles).toEqual(['p6', 'p3']);
    // the same day shifted far from midnight still picks p3 (distances are from the first candidate, not 0)
    const late = [0, 3, 6, 11, 12].map((h) => pic(`q${h}`, h + 40, 0));
    expect(chooseTiles(late, { tiles: 2 }).tiles).toEqual(['q6', 'q3']);
  });

  it('[CPO-21] golden: two equal gaps, the earlier gap is taken first (then the lower id)', () => {
    const cs = [0, 1, 3, 4, 5, 7, 8].map((h) => pic(`p${h}`, h, 0));
    // tile 1: nearest 4h is p4. Gaps 0..4 and 4..8 are equal. Earlier gap: middle 2h, p1 and p3 tie, earlier is p1.
    expect(chooseTiles(cs, { tiles: 2 }).tiles).toEqual(['p4', 'p1']);
  });

  it('[CPO-22] an attached picture leads over a hearted one, whatever the times', () => {
    const cs = [pic('heartEarly', 0, 0, { favourite: true }), pic('attLate', 9, 0, { attached: true }), pic('x', 4, 0)];
    expect(chooseTiles(cs, OPTS).tiles).toEqual(['attLate', 'heartEarly', 'x']);
  });

  it('[CPO-25] tiles and ROTATE_K are PROPOSED rules fields; the collage reads tiles when no option is given', () => {
    expect(MOMENTS_RULES.tiles).toBe(4);
    const cs = [0, 1, 2, 3, 4, 5].map((h) => pic(`p${h}`, h, 0));
    expect(chooseTiles(cs).tiles).toHaveLength(MOMENTS_RULES.tiles);
    expect(chooseTiles(cs, { tiles: Number.NaN }).tiles).toHaveLength(MOMENTS_RULES.tiles);
    expect(chooseTiles(cs, { tiles: 2 }).tiles).toHaveLength(2);
  });

  it('toTileCandidate maps a PR 2 candidate: kind from video, heart from favourite, id from its first frame', () => {
    const base = { ids: ['x', 'y'], startMs: 1, endMs: 5, favourite: true };
    expect(toTileCandidate({ ...base, video: false }, 2, true)).toEqual({
      id: 'x', startMs: 1, endMs: 5, kind: 'image', session: 2, favourite: true, attached: true,
    });
    expect(toTileCandidate({ ...base, video: true }, 0, false).kind).toBe('video');
  });
});
