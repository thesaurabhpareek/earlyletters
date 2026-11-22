/// <reference types="node" />
// NS-53-R88 (PR 18a, BL-1473): every route into a letter ends in one AttachRequest and one stripper per media type.
// Pure TypeScript: no Swift, no PhotoKit, no scribe-picker file. Fictional family Asha only.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  ATTACH_PLAIN_NAME,
  checkAttachRequest,
  stripperFor,
  type AttachRequest,
  type AttachStripper,
} from '../src/lib/moments/attach-request';

const item = (name: string, source: 'picked' | 'library' = 'picked') => ({ source, name, kind: 'image' as const });
const req = (names: string[], day: string | null = null): AttachRequest => ({ items: names.map((n) => item(n)), day });
const imageStripper: AttachStripper = { kind: 'image', strip: async (name) => ({ name: `s-${name}` }) };

describe('checkAttachRequest (R88)', () => {
  it('accepts plain names from either producer and a day chip or none', () => {
    expect(checkAttachRequest(req(['a1.jpg', 'b-2.heic']), { limit: 6 })).toEqual({ ok: true });
    expect(checkAttachRequest({ items: [item('a1.jpg', 'library')], day: '2026-03-14' }, { limit: 6 })).toEqual({ ok: true });
  });
  it('refuses an empty request', () => {
    expect(checkAttachRequest(req([]), { limit: 6 })).toEqual({ ok: false, code: 'attach_empty' });
  });
  it('enforces the limit it is given', () => {
    expect(checkAttachRequest(req(['a.jpg', 'b.jpg']), { limit: 1 })).toEqual({ ok: false, code: 'attach_limit' });
  });
  it.each(['../a.jpg', 'dir/a.jpg', '/abs/a.jpg', 'file:///a.jpg', 'a b.jpg', 'a.jpg?x=1', 'noext', '', 'a..jpg', `${'x'.repeat(65)}.jpg`])(
    'refuses a name that is not a plain name: %s',
    (name) => {
      expect(checkAttachRequest(req([name]), { limit: 6 })).toEqual({ ok: false, code: 'attach_bad_name' });
    },
  );
  it('refuses a repeated name', () => {
    expect(checkAttachRequest(req(['a.jpg', 'a.jpg']), { limit: 6 })).toEqual({ ok: false, code: 'attach_duplicate' });
  });
  it.each(['2026-3-14', '2026-02-30', '2026-13-01', '2026-03-14T10:00:00Z', 'yesterday'])('refuses a day that is not a real YYYY-MM-DD: %s', (day) => {
    expect(checkAttachRequest(req(['a.jpg'], day), { limit: 6 })).toEqual({ ok: false, code: 'attach_bad_day' });
  });
  it('refuses video until a video stripper ships', () => {
    const v: AttachRequest = { items: [{ source: 'picked', name: 'v.mov', kind: 'video' }], day: null };
    expect(checkAttachRequest(v, { limit: 6 })).toEqual({ ok: false, code: 'attach_kind_unsupported' });
    expect(checkAttachRequest(v, { limit: 6, kinds: ['image', 'video'] })).toEqual({ ok: true });
  });
  it('carries no words, id, path or coordinate: item keys are exactly source, name, kind', () => {
    const src = readFileSync(join(__dirname, '../src/lib/moments/attach-request.ts'), 'utf8');
    expect(src).not.toMatch(/\b(latitude|longitude|coordinate|localIdentifier|assetId|uri|text|caption)\s*[:?]/);
  });
});

describe('stripperFor: one stripper per media type (R88)', () => {
  it('returns the stripper registered for the kind', () => {
    expect(stripperFor('image', [imageStripper])).toBe(imageStripper);
  });
  it('throws when none is registered, so a video never skips the strip', () => {
    expect(() => stripperFor('video', [imageStripper])).toThrow('attach_no_stripper');
  });
  it('throws when two are registered for one kind', () => {
    expect(() => stripperFor('image', [imageStripper, { ...imageStripper }])).toThrow('attach_two_strippers');
  });
  it('the stripper takes and returns plain names only', async () => {
    const out = await stripperFor('image', [imageStripper]).strip('a1.jpg');
    expect(out).toEqual({ name: 's-a1.jpg' });
  });
});

describe('scope (R271, R296)', () => {
  it('uses the same plain-name rule as lib/photos/files.ts', () => {
    const files = readFileSync(join(__dirname, '../src/lib/photos/files.ts'), 'utf8');
    expect(files).toContain(`const PLAIN_NAME = ${ATTACH_PLAIN_NAME.toString()};`);
  });
  it('names no Swift, PhotoKit or scribe-picker file and imports nothing native', () => {
    const src = readFileSync(join(__dirname, '../src/lib/moments/attach-request.ts'), 'utf8');
    expect(src).not.toMatch(/^import /m);
  });
});
