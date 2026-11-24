/**
 * BL-1255 step 1 (CR-212): the wire-name mapping table. Every key of EVENTS and REGISTRY has exactly one row, no two
 * names collide, every name fits the 2.2 grammar, the tier column is today's tier, and WIRE-NAMES.md is the render.
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { basicsEvents, EVENTS, REGISTRY, tierOf } from '../src';
import { allKeys, expandPattern, renderWireNames, WIRE_NAME_MAX, WIRE_NAME_RE, WIRE_NAMES_PATH, WIRE_ROWS, type RowKind } from '../src/wire-names';

const doc = readFileSync(resolve(__dirname, '../../..', WIRE_NAMES_PATH), 'utf8');
const keys = allKeys();
const rows = Object.entries(WIRE_ROWS);

/** Every name a row could put on the wire: its single name, or a pattern's expansion. Options of a pending ruling are not names. */
function names(r: RowKind): string[] {
  return r.status === 'ruled' ? [r.wire] : r.status === 'pattern' ? expandPattern(r) : [];
}

describe('every key has exactly one row', () => {
  it('covers the union of EVENTS and REGISTRY, and holds no row for a key that does not exist', () => {
    const union = [...new Set([...Object.keys(EVENTS), ...Object.keys(REGISTRY)])].sort();
    expect(Object.keys(WIRE_ROWS).sort()).toEqual(union);
    expect(keys.map((k) => k.key).sort()).toEqual(union);
  });

  it('a ruled row has one wire name; a NEEDS RULING row has none and at least one option', () => {
    for (const [key, r] of rows) {
      if (r.status === 'needs_ruling') {
        expect(r.options.length, key).toBeGreaterThanOrEqual(1);
        expect(r.why.length, key).toBeGreaterThan(10);
      } else expect(names(r).length === 1 || r.status === 'pattern', key).toBe(true);
    }
  });

  it('the document holds exactly one table row per key', () => {
    for (const k of keys) expect(doc.split('\n').filter((l) => l.startsWith(`| \`${k.key}\` |`)).length, k.key).toBe(1);
  });
});

describe('names', () => {
  const all = rows.flatMap(([key, r]) => names(r).map((n) => ({ key, n })));

  it('every wire name matches category:object_action (standard 2.2) and is at most 60 characters', () => {
    expect(all.length).toBeGreaterThan(0);
    for (const { key, n } of all) {
      expect(n, key).toMatch(WIRE_NAME_RE);
      expect(n.length, n).toBeLessThanOrEqual(WIRE_NAME_MAX);
    }
  });

  it('every candidate option that is a name also matches the grammar (so a ruling never picks an invalid one)', () => {
    for (const [key, r] of rows) if (r.status === 'needs_ruling') for (const o of r.options.filter((x) => !x.startsWith('(none)'))) {
      const name = o.split(' ')[0]!;
      expect(name, `${key}: ${o}`).toMatch(WIRE_NAME_RE);
    }
  });

  it('no two names collide, across keys and across generated screen names', () => {
    const seen = new Map<string, string>();
    for (const { key, n } of all) {
      expect(seen.get(n), `${n} used by ${seen.get(n)} and ${key}`).toBeUndefined();
      seen.set(n, key);
    }
  });

  it('no option of a pending ruling equals a name already taken by another key', () => {
    const taken = new Map(all.map(({ key, n }) => [n, key]));
    for (const [key, r] of rows) if (r.status === 'needs_ruling') for (const o of r.options) {
      const owner = taken.get(o.split(' ')[0]!);
      expect(owner === undefined || owner === key, `${key} option ${o} is taken by ${owner}`).toBe(true);
    }
  });

  it('a pattern row only claims the three basics-style names the standard lists, with screen_view the only basics key', () => {
    expect(rows.filter(([, r]) => r.status === 'pattern').map(([k]) => k).sort()).toEqual(['control_tapped', 'perf_measured', 'screen_view', 'surface_impressed']);
  });
});

describe('tier column', () => {
  it("equals today's tier for every key; the basics set is screen_view only; perf stays consented", () => {
    for (const k of keys) {
      expect(k.tier, k.key).toBe(tierOf(k.key) === 'basics' ? 'basics' : 'consented');
      const line = doc.split('\n').find((l) => l.startsWith(`| \`${k.key}\` |`))!;
      expect(line.split('|')[4]!.trim(), k.key).toBe(k.tier);
    }
    expect(basicsEvents()).toEqual(['screen_view']);
    expect(keys.filter((k) => k.tier === 'basics').map((k) => k.key)).toEqual(['screen_view']);
    expect(keys.find((k) => k.key === 'perf_measured')?.tier).toBe('consented');
  });
});

describe('the generated file is current', () => {
  it('WIRE-NAMES.md equals the render (run `npm run wire-names -w @scribe/analytics` to refresh)', () => {
    expect(doc).toBe(renderWireNames());
  });
});
