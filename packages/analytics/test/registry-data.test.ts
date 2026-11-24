/**
 * ER-A00 P2: the registry as data. Imports only `registry.ts`, `values.ts` and
 * `schema.ts`, and, from P4, checks that the barrel exports the registry (the send path reads it).
 * The cross-file rules (V1 to V16) land with `registry-rules.ts` in P6, and the
 * shipped-registry canary in P8. Fixtures: the fictional family Asha only.
 */
import { describe, expect, it } from 'vitest';
import { isPiiLike } from '../src/pii';
import * as barrel from '../src';
import {
  CONTROL,
  EV,
  FORBIDDEN_EVENT_PATTERNS,
  FUNNELS,
  MS_BUCKET,
  PERF_METRIC,
  PROP,
  REGISTRY,
  SURFACE,
  type RegistryRow,
} from '../src/registry';
import { expandPattern, WIRE_NAME_RE, WIRE_ROWS } from '../src/wire-names';

const rows = Object.entries(REGISTRY) as [string, RegistryRow][];

/** Every name wire-names.ts gives an event to send: a ruled or named name, or a generated per-id name (screen views today). */
const WIRE_NAMES: string[] = Object.values(WIRE_ROWS).flatMap((r) => (r.status === 'ruled' || r.status === 'named' ? [r.wire] : r.status === 'pattern' ? expandPattern(r) : []));
const SNAKE = /^[a-z0-9]+(?:_[a-z0-9]+)*$/;
/** Properties the client adds to every event (catalog.ts GLOBAL_PROPS, moved in P5). */
const GLOBALS = ['schema_version', 'child_count_bucket', 'sample_pct'];
const NEVER = /religion|region|background|ethnic|birth|dob|due|child_name|name|transcript|audio_url|photo|entry|text|body|note/;

describe('registry.ts (P2, data only)', () => {
  it('is exported from the barrel from P4 (the send path reads it), and the barrel copy is the same object', () => {
    expect(barrel.REGISTRY).toBe(REGISTRY);
    expect(barrel.EV).toBe(EV);
    expect(barrel.PROP).toBe(PROP);
  });

  it('holds about 25 events, every name snake_case or a wire name', () => {
    expect(rows.length).toBeGreaterThanOrEqual(20);
    expect(rows.length).toBeLessThanOrEqual(30);
    // Bare snake_case until the rename reaches a row (BL-2176), then the wire name `<area>:<object>_<verb>`.
    for (const [name] of rows) expect(name.includes(':') ? WIRE_NAME_RE.test(name) : SNAKE.test(name), name).toBe(true);
  });

  it('names one decision per event, and no two rows share it', () => {
    for (const [name, r] of rows) {
      expect(r.decision.trim().length, name).toBeGreaterThanOrEqual(20);
      expect(r.decision, name).toMatch(/\bso we\b/);
    }
    expect(new Set(rows.map(([, r]) => r.decision)).size).toBe(rows.length);
  });

  it('covers the basics and the five funnel stages', () => {
    expect([...new Set(rows.map(([, r]) => r.stage))].sort()).toEqual(['activation', 'basics', 'capture', 'keep', 'plus', 'return']);
  });

  it('carries only closed value shapes at L2: enum, bool or bounded int, no free text', () => {
    for (const [n, r] of rows) {
      expect(r.level, n).toBe('L2');
      for (const [p, s] of Object.entries(r.props)) {
        expect(['enum', 'bool', 'int'], `${n}.${p}`).toContain(s.type);
        expect(s.level, `${n}.${p}`).toBe('L2');
        expect(p, `${n}.${p}`).toMatch(SNAKE);
        expect(p, `${n}.${p}`).not.toMatch(NEVER);
        if (s.type === 'enum') {
          expect(s.values.length, `${n}.${p}`).toBeGreaterThan(0);
          for (const v of s.values) {
            expect(v, `${n}.${p}=${v}`).toMatch(SNAKE);
            expect(isPiiLike(v), `${n}.${p}=${v}`).toBe(false);
            expect(v, `${n}.${p}=${v}`).not.toMatch(/asha/i);
          }
        }
        if (s.type === 'int') expect(s.min, `${n}.${p}`).toBeLessThan(s.max);
      }
    }
  });

  it('keeps EV and PROP in step with the rows, in both directions', () => {
    expect(Object.values(EV).sort()).toEqual(Object.keys(REGISTRY).sort());
    const used = new Set([...rows.flatMap(([, r]) => Object.keys(r.props)), ...GLOBALS]);
    expect(Object.values(PROP).sort()).toEqual([...used].sort());
  });

  it('has an id list for every control, surface and timed step, with nothing that names content', () => {
    expect(CONTROL.values.length).toBeGreaterThan(0);
    expect(SURFACE.values.length).toBeGreaterThan(0);
    expect(PERF_METRIC.values.length).toBeGreaterThanOrEqual(4);
    expect(PERF_METRIC.values.length).toBeLessThanOrEqual(6);
    expect(MS_BUCKET.values.length).toBeGreaterThan(1);
    for (const id of [...CONTROL.values, ...SURFACE.values, ...PERF_METRIC.values]) {
      expect(id).toMatch(SNAKE);
      expect(id).not.toMatch(/save_a_copy|days|email|birthday|asha/);
    }
  });

  it('names only registered events or wire names in every funnel, with at least two steps (V9)', () => {
    for (const [id, steps] of Object.entries(FUNNELS)) {
      expect(id).toMatch(/^f_[a-z]+_[a-z_]+$/);
      expect(steps.length, id).toBeGreaterThanOrEqual(2);
      for (const s of steps as readonly string[]) {
        const known = s.includes(':') ? WIRE_NAMES : Object.keys(REGISTRY);
        expect(known, `${id}: ${s}`).toContain(s);
      }
    }
  });

  it('the return funnel reads the generated screen views, not events of their own (BL-2175)', () => {
    expect(FUNNELS.f_return_book_read).toEqual(['system:app_open', 'book:book_screen_view', 'book:letter_detail_screen_view']);
  });

  it('has no event for the Save a copy slip, Days notes, email opens, or anything a birthday or due date sets (FR-DAT-27)', () => {
    for (const [name] of rows) {
      for (const re of FORBIDDEN_EVENT_PATTERNS) expect(name, `${name} matches ${re}`).not.toMatch(re);
    }
  });

  it('the forbidden patterns do catch the names they exist for', () => {
    const caught = (n: string) => FORBIDDEN_EVENT_PATTERNS.some((re) => re.test(n));
    for (const n of ['save_a_copy_shown', 'export_shared', 'days_note_added', 'moment_shown', 'email_opened', 'birthday_week_seen', 'reminder_sent']) {
      expect(caught(n), n).toBe(true);
    }
    expect(caught('capture:letter_save')).toBe(false);
  });

  it('the patterns also catch the wire names of events that were dropped, and the names the retired deletion flows would have had (CR-213, CR-225)', () => {
    const caught = (n: string) => FORBIDDEN_EVENT_PATTERNS.some((re) => re.test(n));
    for (const n of [
      'keeping:export_share_end', 'notifications:reminder_send', 'book:moment_view', 'book:resurface_view', 'book:resurface_open',
      'keeping:letter_delete', 'keeping:letter_restore', 'keeping:account_delete', 'keeping:account_deletion_start', 'keeping:account_deletion_restore',
      'keeping:phone_delete', 'keeping:take_delete', 'keeping:version_remove', 'keeping:version_restore', 'keeping:deletion_start', 'keeping:deletion_restore',
      'keeping:save_a_copy_view', 'family:days_note_open', 'notifications:email_open',
    ]) {
      expect(caught(n), n).toBe(true);
    }
  });

  it('no name that may be sent is caught: the three export names, the Moments card names, and every ruled, named and generated wire name', () => {
    const caught = (n: string) => FORBIDDEN_EVENT_PATTERNS.filter((re) => re.test(n));
    const allowed = [...WIRE_NAMES, ...Object.keys(REGISTRY)];
    expect(allowed.length).toBeGreaterThan(60);
    for (const n of ['keeping:export_start', 'keeping:export_complete', 'keeping:export_fail', 'book:moments_card_view', 'book:moments_card_open', 'capture:edit_restore', 'book:letter_detail_screen_view']) {
      expect(allowed, n).toContain(n);
    }
    for (const n of allowed) expect(caught(n), `${n} is caught by ${caught(n).join(' ')}`).toEqual([]);
  });
});
