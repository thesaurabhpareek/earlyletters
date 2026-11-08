import { describe, expect, it } from 'vitest';
import { restTopsFor } from '../src/film/rest-tops-map';

const boxes = [
  { top: 0, height: 2000, rest: 0.5 },
  { top: 1000, height: 3000, rest: 0.75 },
  { top: 3000, height: 2500, rest: 0.3 },
];

describe('restTopsFor', () => {
  it('pinned layout: the top plus the rest fraction of the pinned range (height minus one screen)', () => {
    expect(restTopsFor(boxes, 1000, false)).toEqual([500, 2500, 3450]);
  });
  it('never goes above a part that is shorter than a screen', () => {
    expect(restTopsFor([{ top: 700, height: 600, rest: 0.9 }], 1000, false)).toEqual([700]);
  });
  it('reduced motion flows the parts like a page: every rest position is the top of the part, not part way down it', () => {
    expect(restTopsFor(boxes, 1000, true)).toEqual([0, 1000, 3000]);
  });
});
