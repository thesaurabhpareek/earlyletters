/** NS-53-R38 (exclude before grouping), R41 and R281(b) (burst and near-duplicate candidates), R107 (synthetic only). */
import { describe, expect, it } from 'vitest';
import { KIND_IMAGE, KIND_VIDEO, SUBTYPE } from '../../src/moments/columns';
import { MEDIA_KINDS } from '../../src/moments';
import { excludeAssets } from '../../src/moments/exclude';
import { mergeNear } from '../../src/moments/near';
import { ASHA_RULES_V1 as R, columns, la, laOffsetAt, type Row } from './asha-lib-v1';

const T0 = la(2026, 11, 14, 10, 0, 0);
const at = (s: number, extra: Partial<Row> = {}): Row => ({ id: `p${Math.round(s * 1000)}-${extra.burst ?? ''}`, ms: T0 + s * 1000, ...extra });
const cands = (rows: Row[]) => mergeNear(excludeAssets(columns(rows)), R, laOffsetAt);

describe('[NS-53-R38] exclude: before grouping, leaving no trace', () => {
  it('drops no-date, screenshot, screen recording and animation assets', () => {
    const bad = [
      { id: 'nodate', ms: 0 },
      { id: 'nan', ms: Number.NaN },
      { id: 'shot', ms: T0, flags: SUBTYPE.SCREENSHOT },
      { id: 'rec', ms: T0, flags: SUBTYPE.SCREEN_RECORDING, kind: KIND_VIDEO },
      { id: 'gif', ms: T0, flags: SUBTYPE.ANIMATED },
    ];
    expect(excludeAssets(columns([...bad, { id: 'keep', ms: T0 }])).map((i) => i.ids)).toEqual([['keep']]);
    // "No trace": a burst whose only frames are excluded leaves nothing, not an empty candidate.
    expect(excludeAssets(columns(bad.map((b) => ({ ...b, burst: 'b' }))))).toEqual([]);
  });

  it('[CDO-21] a missing date arrives as NaN; Infinity, negative and zero dates are dropped too', () => {
    const bad = [Number.NaN, Infinity, -Infinity, -1, -86_400_000, 0].map((ms, i) => ({ id: `bad${i}`, ms }));
    expect(excludeAssets(columns([...bad, { id: 'keep', ms: T0 }])).map((i) => i.ids)).toEqual([['keep']]);
  });

  it('[CPrivO-13] core keeps no HIDDEN or NOT_USER_LIBRARY bit: those are fetch options, not reads', () => {
    expect(Object.keys(SUBTYPE).sort()).toEqual(['ANIMATED', 'LIVE', 'PANORAMA', 'SCREENSHOT', 'SCREEN_RECORDING']);
  });

  it('the kind values come from MEDIA_KINDS, one owner', () => {
    expect(KIND_IMAGE).toBe(MEDIA_KINDS.indexOf('image'));
    expect(KIND_VIDEO).toBe(MEDIA_KINDS.indexOf('video'));
  });

  it('a burstId column shorter than ids does not merge unrelated pictures', () => {
    const w = columns([at(0), at(500), at(1000)]);
    const short = { ...w, burstId: [null] as (string | null)[] };
    expect(excludeAssets(short)).toHaveLength(3);
  });

  it('keeps Live, panorama and favourites as ordinary pictures (they change nothing)', () => {
    const out = excludeAssets(columns([{ id: 'live', ms: T0, flags: SUBTYPE.LIVE }, { id: 'pano', ms: T0 + 1, flags: SUBTYPE.PANORAMA }]));
    expect(out).toHaveLength(2);
  });

  it('is the same in any input order', () => {
    const rows = [at(0), at(5), at(300), at(900, { burst: 'b' }), at(903, { burst: 'b' })];
    const fwd = excludeAssets(columns(rows));
    expect(excludeAssets(columns([...rows].reverse()))).toEqual(fwd);
  });
});

describe('[NS-53-R41] a burst is one candidate with the range first to last frame', () => {
  it('collapses frames sharing a burst id, however far apart, and keeps a heart on any frame', () => {
    const out = excludeAssets(columns([at(0, { burst: 'b' }), at(40, { burst: 'b' }), at(2, { burst: 'b', heart: true }), at(500)]));
    expect(out).toHaveLength(2);
    expect(out[0]).toMatchObject({ startMs: T0, endMs: T0 + 40_000, favourite: true });
    expect(out[0].ids).toHaveLength(3);
    expect(out[1].favourite).toBe(false);
  });
});

describe('[NS-53-R281] near-duplicate rule: gap from the PREVIOUS frame, span capped (7.2a goldens, Asha)', () => {
  it('three frames 4 seconds apart are one candidate', () => {
    expect(cands([at(0), at(4), at(8)])).toHaveLength(1);
  });

  it('two pictures with the same timestamp are one candidate', () => {
    expect(cands([at(0), at(0)])).toHaveLength(1);
  });

  it('a gap of exactly NEAR_SECONDS joins; one second more does not', () => {
    expect(cands([at(0), at(10)])).toHaveLength(1);
    expect(cands([at(0), at(11)])).toHaveLength(2);
  });

  it('40 frames 3 seconds apart (117 seconds) are 2 candidates, not 1, and the cap is inclusive', () => {
    const out = cands(Array.from({ length: 40 }, (_, i) => at(i * 3)));
    expect(out).toHaveLength(2);
    expect(out[0].ids).toHaveLength(21); // 0 to 60 seconds: a span of exactly NEAR_GROUP_MAX still joins
    expect(out[1].ids).toHaveLength(19);
  });

  it('a 6-frame burst plus frames 4 and 9 seconds after its last frame is one; a frame 11 seconds later is a second', () => {
    const burst = Array.from({ length: 6 }, (_, i) => at(i, { burst: 'b' }));
    expect(cands([...burst, at(5 + 4), at(5 + 9)])).toHaveLength(1);
    expect(cands([...burst, at(5 + 4), at(5 + 9), at(5 + 9 + 11)])).toHaveLength(2);
  });

  it('never merges across a local midnight, and a lone burst longer than the cap stays whole', () => {
    const late = la(2026, 11, 14, 23, 59, 58);
    const out = mergeNear(excludeAssets(columns([{ id: 'a', ms: late }, { id: 'b', ms: late + 5000 }])), R, laOffsetAt);
    expect(out).toHaveLength(2);
    const long = excludeAssets(columns([at(0, { burst: 'x' }), at(90, { burst: 'x' })]));
    expect(mergeNear(long, R, laOffsetAt)).toHaveLength(1);
  });

  it('never folds a video into a picture group', () => {
    expect(cands([at(0), at(2, { kind: KIND_VIDEO, durationMs: 5000 })])).toHaveLength(2);
  });

  it('[CPO-24] a burst id on a video is ignored: two videos sharing one are two candidates, a picture of that burst stays alone', () => {
    const out = cands([at(0, { kind: KIND_VIDEO, burst: 'b' }), at(1, { kind: KIND_VIDEO, burst: 'b' }), at(2, { burst: 'b' })]);
    expect(out.map((c) => [c.video, c.ids.length])).toEqual([[true, 1], [true, 1], [false, 1]]);
  });

  it('[CPO-24] a video between two near pictures does not split them, and stays its own candidate', () => {
    const out = cands([at(0), at(4, { kind: KIND_VIDEO, durationMs: 3000 }), at(8)]);
    expect(out.map((c) => [c.video, c.ids.length])).toEqual([[false, 2], [true, 1]]);
  });
});
