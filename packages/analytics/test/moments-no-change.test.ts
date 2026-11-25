/**
 * BL-1452, NS-53 PR 7: the analytics decision for Moments v3 is no change. The picker door, the host sheet, a pick
 * and the library read add no event, property, enum value, wire code or catalogue row; `picker_unavailable` stays a
 * local code. Decision record: docs/analytics/moments-measurement-note.md section 11.
 *
 * This file guards only what the existing tests leave open, so it repeats none of them:
 * - the two card events and their one `slot` property: moments-events.test.ts [NS-53-R251-a] to [NS-53-R251-f];
 * - the `capture:take_start.source` set: allowlist-pins.test.ts [NS-49-R36];
 * - the track call's literal `tonight`: apps/mobile/test/start-capture.test.ts;
 * - `(^|:)moment_` names: FORBIDDEN_EVENT_PATTERNS in registry-data.test.ts.
 * The catalogue key guard in catalog.test.ts does not catch `album`, `asset_id` or `photo_library` (pinned as a known
 * gap by allowlist-guards-narrow.test.ts, FR-DAT-36-g). This file closes that gap for the live allowlist only and
 * leaves the guard in catalog.test.ts as it is, so the `.fails` cases there keep their meaning.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { EVENTS, GLOBAL_PROPS, REGISTRY, type PropSpec } from '../src';
import { expandPattern, WIRE_ROWS } from '../src/wire-names';

type Spec = { props: Record<string, PropSpec> };

/** Every string the allowlist can put on the wire: event names (catalogue, registry, ruled and named wire names), keys, enum values. */
function wireStrings(): { where: string; kind: 'name' | 'key' | 'value'; value: string }[] {
  const out: { where: string; kind: 'name' | 'key' | 'value'; value: string }[] = [];
  const specs = [...Object.entries(EVENTS), ...Object.entries(REGISTRY)] as [string, Spec][];
  for (const [name, spec] of specs) {
    out.push({ where: name, kind: 'name', value: name });
    for (const [key, p] of Object.entries(spec.props)) {
      out.push({ where: `${name}.${key}`, kind: 'key', value: key });
      if (p.type === 'enum') for (const v of p.values) out.push({ where: `${name}.${key}=${v}`, kind: 'value', value: v });
    }
  }
  for (const [key, p] of Object.entries(GLOBAL_PROPS as Record<string, PropSpec>)) {
    out.push({ where: `global.${key}`, kind: 'key', value: key });
    if (p.type === 'enum') for (const v of p.values) out.push({ where: `global.${key}=${v}`, kind: 'value', value: v });
  }
  for (const r of Object.values(WIRE_ROWS)) {
    const names = r.status === 'ruled' || r.status === 'named' ? [r.wire] : r.status === 'pattern' ? expandPattern(r) : [];
    for (const n of names) out.push({ where: `wire ${n}`, kind: 'name', value: n });
  }
  return out;
}

/** Picker and library vocabulary: a name, key or value with one of these says where a picture came from. */
const PICTURE_SOURCE = /picker|librar|album|asset|picture|image|media|attach|thumbnail|exif|icloud|local_?id/;
/** A key that would carry Apple's library answer (R282: nothing may vary by access state). */
const ACCESS_KEY = /permission|authori[sz]|photo/;
/** Apple's Limited state has no other meaning in this product, so any enum holding it is an access-state enum. */
const ACCESS_VALUE = /^limited$/;
/** Values that would say a letter began from Moments, a card or the picker (R87, R227, R284, O-38, O-49). */
const START_ORIGIN = /^(moments?|moment_card|card|picker|library|capture)$/;
/** The local closed failure codes of R282 and spec section 18. */
const LOCAL_CODES = ['picker_unavailable', 'library_unreadable', 'fallback_used'] as const;
const LOCAL_CODE_RE = new RegExp(LOCAL_CODES.join('|'));

function hits(re: RegExp, kinds: readonly ('name' | 'key' | 'value')[]): string[] {
  return wireStrings()
    .filter((s) => kinds.includes(s.kind) && re.test(s.value.toLowerCase()))
    .map((s) => s.where);
}

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((f) => {
    const p = join(dir, f);
    return statSync(p).isDirectory() ? sourceFiles(p) : p.endsWith('.ts') ? [p] : [];
  });
}

describe('Moments v3 adds no analytics (BL-1452, NS-53 PR 7)', () => {
  it('[NS-53-R282-a][NS-53-R167] no event name, property key or enum value names the picker, the library, an album, an asset or a picture', () => {
    expect(hits(PICTURE_SOURCE, ['name', 'key', 'value'])).toEqual([]);
  });

  it('[NS-53-R282-b][NS-53-R251] the local failure codes are no enum value and appear nowhere in src: no wire code, no catalogue row', () => {
    expect(hits(LOCAL_CODE_RE, ['value', 'key', 'name'])).toEqual([]);
    const src = resolve(__dirname, '../src');
    const files = sourceFiles(src);
    expect(files.length).toBeGreaterThan(20);
    const named = files.filter((f) => LOCAL_CODE_RE.test(readFileSync(f, 'utf8')));
    expect(named).toEqual([]);
  });

  it('[NS-53-R87][NS-53-R227][NS-53-R284][NS-53-R83] no enum value says a letter began from Moments, a card or the picker', () => {
    expect(hits(START_ORIGIN, ['value'])).toEqual([]);
  });

  it('[NS-53-R282-c][NS-53-R167] no property carries the library access state: no permission or photo key, no Limited value', () => {
    expect(hits(ACCESS_KEY, ['key'])).toEqual([]);
    expect(hits(ACCESS_VALUE, ['value'])).toEqual([]);
  });

  it('[BL-1452-ctl] the matchers catch planted Moments strings and the collector reads the real allowlist', () => {
    const all = wireStrings();
    // Control: the collector sees the catalogue, the registry, the globals and the wire rows.
    for (const w of ['book:moments_card_view.slot=look_back', 'capture:take_start.source=tonight', 'global.schema_version', 'surface_impressed']) {
      expect(all.map((s) => s.where), w).toContain(w);
    }
    for (const n of ['book:picker_open', 'moments_library_read', 'photo_album', 'asset_id', 'picture_count', 'thumbnail_view', 'localId', 'icloud_download', 'image_id', 'media_id', 'image_count', 'attachment_count']) {
      expect(PICTURE_SOURCE.test(n.toLowerCase()), n).toBe(true);
    }
    for (const c of LOCAL_CODES) expect(LOCAL_CODE_RE.test(c), c).toBe(true);
    for (const v of ['moment', 'moments', 'card', 'picker', 'library', 'capture']) expect(START_ORIGIN.test(v), v).toBe(true);
    for (const v of ['tonight', 'book', 'notification', 'make_it_yours', 'resurface', 'photo', 'suggestion', 'invite_card']) {
      expect(START_ORIGIN.test(v), `${v} is a ruled or existing value, not a Moments origin`).toBe(false);
    }
    for (const k of ['permission', 'photo_permission', 'authorization', 'authorisation', 'photo_count']) expect(ACCESS_KEY.test(k), k).toBe(true);
    expect(ACCESS_KEY.test('access'), 'the Plus access key of book:read_together_start is plus | free, not a library answer').toBe(false);
    expect(ACCESS_VALUE.test('limited')).toBe(true);
  });

  it('[BL-1452-doc] the decision note records the no-change decision against every PR 7 row id', () => {
    const note = readFileSync(resolve(__dirname, '../../../docs/analytics/moments-measurement-note.md'), 'utf8');
    const at = note.indexOf('## 11. The PR 7 decision (BL-1452): no change');
    expect(at).toBeGreaterThan(0);
    const section = note.slice(at);
    for (const r of ['R83', 'R87', 'R167', 'R227', 'R251', 'R282', 'R284']) expect(section, r).toMatch(new RegExp(`\\b${r}\\b`));
    expect(section).toMatch(/no analytics event, no property, no enum value, no wire code and no catalog or registry row/);

    // O-49 has no ruling on record (spec section 23 lists it with its default): the note must not say it was decided.
    expect(note).not.toMatch(/O-49 (is|was) (no|answered|decided)|O-49 answered|answered no|closed no|O-49 \(no\)/);
  });
});
