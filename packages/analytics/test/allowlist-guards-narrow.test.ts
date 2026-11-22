/**
 * Risk 11 (docs/qa/test-plan-b13/00-MASTER-TEST-PLAN.md, case B04 and C16/C17 in file 04): the catalogue guard in
 * catalog.test.ts is narrower than the promises in TRACKING_PLAN 6.2 and FR-DAT-36. The guard is read from that
 * file, applied to a copy of the catalogue with a picture count and a Photos permission added, and the cases
 * below are `it.fails`: they are green while the gap exists and turn red the day the guard is widened, which is
 * the cue to drop `.fails`. Nothing in src is touched.
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { EVENTS, int, oneOf, type PropSpec } from '../src';

const guardSrc = readFileSync(resolve(__dirname, 'catalog.test.ts'), 'utf8');
const FORBIDDEN_KEY = new RegExp(/const FORBIDDEN_KEY = \/(.+)\/;/.exec(guardSrc)![1]);
const INT_MAX = Number(/expect\(p\.max, `\$\{name\}\.\$\{key\}`\)\.toBeLessThanOrEqual\((\d+)\)/.exec(guardSrc)![1]);

/** What the existing guard rejects for one property of a catalogue copy. */
function guardRejects(key: string, p: PropSpec): boolean {
  return FORBIDDEN_KEY.test(key) || (p.type === 'int' && p.max > INT_MAX);
}

const withMedia: Record<string, Record<string, PropSpec>> = {
  capture_started: { ...EVENTS.capture_started.props, photo_count: int(0, 50), permission: oneOf('full', 'limited', 'denied') },
};

describe('the catalogue guard is as wide as the promise (FR-DAT-36, TP 6.2)', () => {
  it('[FR-DAT-36-ctl] control: the extracted guard rejects a name key and an int above its own limit, and accepts the real catalogue', () => {
    expect(FORBIDDEN_KEY.test('child_name')).toBe(true);
    expect(guardRejects('size_bucket', int(0, INT_MAX + 1))).toBe(true);
    for (const [n, s] of Object.entries(EVENTS)) for (const [k, p] of Object.entries(s.props as Record<string, PropSpec>)) expect(guardRejects(k, p), `${n}.${k}`).toBe(false);
  });

  const words: Record<string, string[]> = {
    'hash words': ['file_hash', 'content_sha', 'digest', 'checksum', 'fingerprint'],
    'file and path words': ['file', 'file_name', 'path', 'url', 'uuid'],
    'size and length words': ['size', 'byte_count', 'duration_ms', 'video_length'],
    'library words': ['album', 'asset_id', 'photo_library'],
  };
  for (const [group, keys] of Object.entries(words)) {
    // FR-DAT-36-g: widen FORBIDDEN_KEY in catalog.test.ts, then remove `.fails`.
    it.fails(`[FR-DAT-36-g1] guard rejects a property key with ${group}`, () => {
      for (const k of keys) expect(guardRejects(k, oneOf('a')), k).toBe(true);
    });
  }

  // FR-DAT-36-g2: a count of pictures is an int far below 1000 and a Photos permission is a plain enum.
  it.fails('[FR-DAT-36-g2] guard rejects photo_count: int(0, 50) added to capture_started', () => {
    expect(guardRejects('photo_count', withMedia.capture_started.photo_count)).toBe(true);
  });
  it.fails('[FR-DAT-36-g3] guard rejects a Photos permission enum (full, limited, denied)', () => {
    expect(guardRejects('permission', withMedia.capture_started.permission)).toBe(true);
  });
  // TP 6.3 "bounded small: no room for timestamps, ids or birth years": 1000 leaves room for ids and a byte-sized count.
  it.fails('[FR-DAT-36-g4] guard limits an int to 100 or less', () => {
    expect(INT_MAX).toBeLessThanOrEqual(100);
  });
});
