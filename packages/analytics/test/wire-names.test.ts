/**
 * BL-1255 step 1 (CR-212): the wire-name mapping table. Every key of EVENTS and REGISTRY has exactly one row, no two
 * names collide, every name fits the 2.2 grammar, the tier column is today's tier, and WIRE-NAMES.md is the render.
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { basicsEvents, catalogShape, EVENTS, REGISTRY, tierOf } from '../src';
import { allKeys, expandPattern, LEGACY_EVENT_NAMES, legacyNameOf, renderWireNames, RETIRED_ROWS, WIRE_NAME_MAX, WIRE_NAME_RE, WIRE_NAMES_PATH, WIRE_ROWS, wireNameOf, type RowKind } from '../src/wire-names';

const doc = readFileSync(resolve(__dirname, '../../..', WIRE_NAMES_PATH), 'utf8');
const keys = allKeys();
const rows = Object.entries(WIRE_ROWS);

/** Every name a row could put on the wire: its single name, or a pattern's expansion. Merged and dropped rows own none; options of a pending ruling are not names. */
function names(r: RowKind): string[] {
  return r.status === 'ruled' || r.status === 'named' ? [r.wire] : r.status === 'pattern' ? expandPattern(r) : [];
}

describe('every key has exactly one row', () => {
  it('covers the union of EVENTS and REGISTRY, and holds no row for a key that does not exist', () => {
    // A row is keyed by the key it had before the rename (BL-2176), so a renamed key is looked up by what it was.
    const union = [...new Set([...Object.keys(EVENTS), ...Object.keys(REGISTRY)])].sort();
    expect(Object.keys(WIRE_ROWS).sort()).toEqual(union.map(legacyNameOf).sort());
    expect(keys.map((k) => k.key).sort()).toEqual(union);
  });

  it('a ruled or named row has one wire name; merged and dropped rows have none; a NEEDS RULING row has an option', () => {
    for (const [key, r] of rows) {
      if (r.status === 'needs_ruling') {
        expect(r.options.length, key).toBeGreaterThanOrEqual(1);
        expect(r.why.length, key).toBeGreaterThan(10);
      } else if (r.status === 'merged' || r.status === 'dropped') expect(names(r), key).toEqual([]);
      else expect(names(r).length === 1 || r.status === 'pattern', key).toBe(true);
    }
  });

  it('the document holds exactly one table row per key', () => {
    for (const k of keys) expect(doc.split('\n').filter((l) => l.startsWith(`| \`${k.key}\` |`)).length, k.key).toBe(1);
  });
});

/** The 24 Nov 2026 rulings (BL-1255 step 1b), restated so an edit to the table cannot pass silently. */
const NAMED: Record<string, string> = {
  auth_deferred: 'onboarding:sign_in_dismiss', signed_out: 'me:session_end', child_added: 'onboarding:book_create', child_switched: 'capture:child_update',
  capture_discarded: 'capture:take_cancel', review_action: 'capture:review_update', machine_edit_reverted: 'capture:edit_restore',
  machine_edit_rejected: 'capture:edit_decline', pack_download: 'system:pack_download_update', reminder_prime_shown: 'notifications:reminder_prime_view',
  reminder_prime_result: 'notifications:reminder_prime_submit', notification_opened: 'notifications:notification_open', export_started: 'keeping:export_start',
  keep_gate_shown: 'plus:keep_gate_view', plus_started_from_gate: 'plus:keep_gate_plan_start', moments_card_impressed: 'book:moments_card_view',
  moments_card_tapped: 'book:moments_card_open',
};
const MERGED: Record<string, string> = {
  app_cold_start: 'system:cold_start_measure', auth_sheet_shown: 'onboarding:sign_in_screen_view', book_opened: 'book:book_screen_view',
  letter_opened: 'book:letter_detail_screen_view',
};
const DROPPED = [
  'app_backgrounded', 'auth_method_selected', 'auth_email_sent', 'local_merge_choice', 'child_setting_changed', 'make_it_yours_card', 'goals_set',
  'dictionary_term_added', 'family_letter_reviewed', 'member_removed', 'member_left', 'reminder_sent', 'moment_shown', 'resurface_shown',
  'resurface_opened', 'export_shared', 'account_deletion', 'letter_deleted',
];
const retired = Object.entries(RETIRED_ROWS);

describe('the 39 rulings of 24 Nov 2026 and the letter_deleted ruling (CR-225), after step 2a (BL-2175)', () => {
  it('17 keys are named and sync_failed is ruled; none is left to rule', () => {
    expect(Object.keys(NAMED)).toHaveLength(17);
    for (const [k, w] of Object.entries(NAMED)) expect(WIRE_ROWS[k], k).toMatchObject({ status: 'named', wire: w });
    expect(WIRE_ROWS.sync_failed).toMatchObject({ status: 'ruled', wire: 'system:sync_fail' });
    const n = (s: string) => rows.filter(([, r]) => r.status === s).length;
    expect([n('ruled'), n('named'), n('merged'), n('dropped'), n('pattern'), n('needs_ruling')]).toEqual([30, 17, 0, 0, 4, 0]);
    expect(keys).toHaveLength(51);
    expect(rows.flatMap(([, r]) => names(r).length === 1 && r.status !== 'pattern' ? [1] : [])).toHaveLength(47);
    expect(doc).toContain('Counts: 51 keys: 30 ruled by 2.9, 17 named by the 24 Nov rulings, 4 patterns generated per registered id, 0 NEEDS RULING; 47 have a name of their own.');
    expect(doc).toContain('Step 2a (BL-2175) deleted 22 keys: 18 dropped, 4 merged');
  });

  it('22 keys are retired: 18 dropped (letter_deleted is the 18th) and 4 merged, each recorded once with its reason', () => {
    expect(DROPPED).toHaveLength(18);
    expect(Object.keys(MERGED)).toHaveLength(4);
    expect(retired).toHaveLength(22);
    for (const k of DROPPED) expect(RETIRED_ROWS[k]?.status, k).toBe('dropped');
    for (const [k, t] of Object.entries(MERGED)) expect(RETIRED_ROWS[k], k).toMatchObject({ status: 'merged', target: t });
    for (const [k, r] of retired) expect(r.basis.length, k).toBeGreaterThan(20);
  });

  it('a retired key is not a key: it is in no catalogue, registry or table row, and the document lists it once, as retired, under no name', () => {
    for (const [k] of retired) {
      expect(Object.keys(EVENTS), k).not.toContain(k);
      expect(Object.keys(REGISTRY), k).not.toContain(k);
      expect(WIRE_ROWS, k).not.toHaveProperty(k);
      const lines = doc.split('\n').filter((l) => l.startsWith(`| \`${k}\` |`));
      expect(lines, k).toHaveLength(1);
      expect(lines[0], k).toMatch(/^\| `[a-z_]+` \| (dropped|merged) \| (\(none\)|`[a-z_:]+`) \|/);
    }
  });

  it('a merged key has no name of its own: its target is a screen name generated from ids.ts, or a perf metric name', () => {
    const screens = expandPattern(WIRE_ROWS.screen_view as Extract<RowKind, { status: 'pattern' }>);
    for (const [k, r] of retired) if (r.status === 'merged') {
      expect(r.target, k).toMatch(WIRE_NAME_RE);
      if (r.into === 'screen_view') expect(screens, k).toContain(r.target);
      else expect(r.target.endsWith('_measure'), k).toBe(true);
    }
  });

  it('no retired key keeps a wire name: no live row owns a perf target, and a dropped key is not named by any row', () => {
    const owned = new Set(rows.flatMap(([, r]) => names(r)));
    for (const t of Object.values(MERGED).filter((x) => !x.includes('_screen_view'))) expect(owned.has(t), t).toBe(false);
    const olds = ['keeping:letter_delete', 'keeping:letter_restore', 'keeping:export_share_end', 'notifications:reminder_send', 'book:moment_view', 'book:resurface_view'];
    for (const n of olds) expect(owned.has(n), n).toBe(false);
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
      expect(line.split('|')[5]!.trim(), k.key).toBe(k.tier);
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

/** The rename (BL-2176, CR-212 step 2): a key is either still the old key or already its wire name, never both, never neither. */
describe('the rename', () => {
  const owned = rows.flatMap(([key, r]) => (r.status === 'ruled' || r.status === 'named' ? [{ key, wire: r.wire }] : []));
  const live = new Set([...Object.keys(EVENTS), ...Object.keys(REGISTRY)]);

  it('every row that owns a name is held under exactly one of its two names', () => {
    expect(owned).toHaveLength(47);
    for (const { key, wire } of owned) expect([live.has(key), live.has(wire)].filter(Boolean), `${key} / ${wire}`).toHaveLength(1);
  });

  it('the mapping covers all 47 and reads both ways, so an old name still resolves', () => {
    expect(Object.keys(LEGACY_EVENT_NAMES).sort()).toEqual(owned.map((o) => o.key).sort());
    for (const { key, wire } of owned) {
      expect(wireNameOf(key), key).toBe(wire);
      expect(wireNameOf(wire), wire).toBe(wire);
      expect(legacyNameOf(wire), wire).toBe(key);
      expect(legacyNameOf(key), key).toBe(key);
    }
    for (const p of ['screen_view', 'control_tapped', 'surface_impressed', 'perf_measured']) {
      expect(wireNameOf(p), p).toBe(p);
      expect(live.has(p), p).toBe(true);
    }
    expect(wireNameOf('not_an_event')).toBe('not_an_event');
    expect(wireNameOf('constructor')).toBe('constructor');
  });

  it('no property was added or widened, no tier or area changed, no row appeared or went: every pre-rename key still equals its snapshot (test/fixtures/catalog-before-rename.json)', () => {
    const before = JSON.parse(readFileSync(resolve(__dirname, 'fixtures/catalog-before-rename.json'), 'utf8')) as Record<string, Record<string, unknown>>;
    const shape = catalogShape() as { events: [string, string, unknown][] };
    const now = new Map(shape.events.map(([name, level, props]) => {
      const tier = (EVENTS as Record<string, { tier: string; area: string }>)[name]!;
      const reg = (REGISTRY as Record<string, { stage: string; decision: string }>)[name];
      return [legacyNameOf(name), { level, tier: tier.tier, area: tier.area, props, registry: reg ? { stage: reg.stage, decision: reg.decision } : null }];
    }));
    // A row added after the rename is not in the snapshot and is not this test's business; a row that went missing is.
    for (const legacy of Object.keys(before)) expect(now.has(legacy), `${legacy} is gone`).toBe(true);
    for (const [legacy, snap] of Object.entries(before)) expect(JSON.parse(JSON.stringify(now.get(legacy))), legacy).toEqual(snap);
  });

  it('perf stays consented and the basics set stays screen_view, whatever has been renamed', () => {
    expect(tierOf('perf_measured')).toBe('consented');
    expect(basicsEvents()).toEqual(['screen_view']);
  });
});
