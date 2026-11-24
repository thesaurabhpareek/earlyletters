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

/** Every name a row could put on the wire: its single name, or a pattern's expansion. Merged and dropped rows own none; options of a pending ruling are not names. */
function names(r: RowKind): string[] {
  return r.status === 'ruled' || r.status === 'named' ? [r.wire] : r.status === 'pattern' ? expandPattern(r) : [];
}

describe('every key has exactly one row', () => {
  it('covers the union of EVENTS and REGISTRY, and holds no row for a key that does not exist', () => {
    const union = [...new Set([...Object.keys(EVENTS), ...Object.keys(REGISTRY)])].sort();
    expect(Object.keys(WIRE_ROWS).sort()).toEqual(union);
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

describe('the 39 rulings of 24 Nov 2026 and the letter_deleted ruling (CR-225)', () => {
  it('17 keys are named, 4 merged, 18 dropped (letter_deleted is the 18th), sync_failed is ruled; none is left to rule', () => {
    expect(Object.keys(NAMED)).toHaveLength(17);
    expect(DROPPED).toHaveLength(18);
    for (const [k, w] of Object.entries(NAMED)) expect(WIRE_ROWS[k], k).toMatchObject({ status: 'named', wire: w });
    for (const [k, t] of Object.entries(MERGED)) expect(WIRE_ROWS[k], k).toMatchObject({ status: 'merged', target: t });
    for (const k of DROPPED) expect(WIRE_ROWS[k]?.status, k).toBe('dropped');
    expect(WIRE_ROWS.sync_failed).toMatchObject({ status: 'ruled', wire: 'system:sync_fail' });
    const n = (s: string) => rows.filter(([, r]) => r.status === s).length;
    expect([n('ruled'), n('named'), n('merged'), n('dropped'), n('pattern'), n('needs_ruling')]).toEqual([30, 17, 4, 18, 4, 0]);
    expect(keys).toHaveLength(73);
    expect(doc).toContain('Counts: 73 keys: 30 ruled by 2.9, 17 named by the 24 Nov rulings, 4 merged, 18 dropped, 4 patterns');
  });

  it('a merged row has no name of its own: its target is a screen name generated from ids.ts, or a perf metric name', () => {
    const screens = expandPattern(WIRE_ROWS.screen_view as Extract<RowKind, { status: 'pattern' }>);
    for (const [k, r] of rows) if (r.status === 'merged') {
      expect(r.target, k).toMatch(WIRE_NAME_RE);
      if (r.into === 'screen_view') expect(screens, k).toContain(r.target);
      else expect(r.target.endsWith('_measure'), k).toBe(true);
    }
  });

  it('no dropped or merged key keeps a wire name: it appears nowhere as the name of a row, and its table row says (none)', () => {
    const owned = new Set(rows.flatMap(([, r]) => names(r)));
    for (const k of [...DROPPED, ...Object.keys(MERGED)]) {
      expect(names(WIRE_ROWS[k]!), k).toEqual([]);
      expect(doc.split('\n').find((l) => l.startsWith(`| \`${k}\` |`)), k).toMatch(/\| \(none\)/);
    }
    for (const t of Object.values(MERGED).filter((x) => !x.includes('_screen_view'))) expect(owned.has(t), t).toBe(false);
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
