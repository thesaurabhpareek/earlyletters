import { readdirSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  checkRegistry,
  CONTROL,
  EV,
  FORBIDDEN_EVENT_PATTERNS,
  FUNNELS,
  GLOBAL_PROPS,
  HELD_EVENTS,
  MS_BUCKET,
  NAME_RULES,
  PERF_METRIC,
  PLAN_BEGIN,
  PLAN_END,
  PROP,
  REGISTRY,
  ROUTE,
  ruleV1,
  ruleV10,
  ruleV16,
  ruleV2,
  ruleV3,
  ruleV4,
  ruleV5,
  ruleV6,
  ruleV7,
  ruleV8,
  ruleV9,
  SURFACE,
  type RegistryInput,
  type RegistryRow,
} from '../src';

const ROOT = resolve(__dirname, '../../..');
const read = (p: string) => readFileSync(join(ROOT, p), 'utf8');

/** Source files that may name events: the package and the app's analytics folder, without tests and the registry itself. */
function sources(): Record<string, string> {
  const out: Record<string, string> = {};
  const walk = (dir: string, skip: (f: string) => boolean) => {
    let entries: import('node:fs').Dirent[] = [];
    try {
      entries = readdirSync(join(ROOT, dir), { withFileTypes: true });
    } catch {
      return; // the app folder is absent in a package-only checkout
    }
    for (const e of entries) {
      const rel = `${dir}/${e.name}`;
      if (e.isDirectory()) walk(rel, skip);
      else if (/\.tsx?$/.test(e.name) && !/\.test\.tsx?$/.test(e.name) && !skip(rel)) out[rel] = read(rel);
    }
  };
  walk('packages/analytics/src', (f) => /\/(registry|catalog|values|registry-rules|plan-doc)\.ts$/.test(f) || f.includes('/insights/'));
  walk('apps/mobile/src/lib/analytics', () => false);
  return out;
}

function planNames(): string[] {
  const plan = read('docs/analytics/TRACKING_PLAN.md');
  const block = plan.slice(plan.indexOf(PLAN_BEGIN), plan.indexOf(PLAN_END));
  const sendable = block.slice(0, block.indexOf('Held, not sendable'));
  return [...sendable.matchAll(/^\| `([a-z_0-9]+)` \|/gm)].map((m) => m[1]);
}

const input = (): RegistryInput => ({
  registry: REGISTRY as unknown as RegistryInput['registry'],
  ev: EV,
  prop: PROP,
  funnels: FUNNELS,
  idRefProps: { control: 'control', surface: 'surface', metric: 'metric', route: 'screen' },
  sources: sources(),
  heldNames: Object.keys(HELD_EVENTS),
});
const idLists = () => ({ control: CONTROL.values, surface: SURFACE.values, metric: PERF_METRIC.values, route: ROUTE.values, ms_bucket: MS_BUCKET.values });

const row = (over: Partial<RegistryRow> = {}): RegistryRow => ({
  stage: 'capture',
  decision: 'Whether families finish a letter, so we decide what to fix first.',
  area: 'capture',
  when: 'A letter is saved',
  reqs: ['PRD-REQ-016'],
  level: 'L2',
  props: {},
  ...over,
});

describe('the registry as shipped', () => {
  it('passes every static rule, V1 to V10 and V16', () => {
    expect(checkRegistry(input(), planNames(), idLists())).toEqual([]);
  });

  it('is about 25 events and every one names a decision', () => {
    const rows = Object.entries(REGISTRY);
    expect(rows.length).toBeGreaterThanOrEqual(20);
    expect(rows.length).toBeLessThanOrEqual(30);
    for (const [name, r] of rows) {
      expect(r.decision.trim().length, name).toBeGreaterThanOrEqual(20);
      expect(r.decision, name).toMatch(/\bso we\b/);
    }
    expect(new Set(rows.map(([, r]) => r.decision)).size).toBe(rows.length);
  });

  it('covers the basics and the five funnel stages behind weekly making families (FR-DAT-21)', () => {
    const stages = new Set(Object.values(REGISTRY).map((r) => r.stage));
    expect([...stages].sort()).toEqual(['activation', 'basics', 'capture', 'keep', 'plus', 'return']);
    expect(PERF_METRIC.values.length).toBeGreaterThanOrEqual(4);
    expect(PERF_METRIC.values.length).toBeLessThanOrEqual(6);
  });

  it('has no event for the birthday-week Save a copy slip, Days notes, or email opens and clicks (FR-DAT-27)', () => {
    for (const name of Object.keys(REGISTRY)) {
      for (const re of FORBIDDEN_EVENT_PATTERNS) expect(name, `${name} matches ${re}`).not.toMatch(re);
    }
    for (const id of [...CONTROL.values, ...SURFACE.values]) {
      expect(id).not.toMatch(/save_a_copy|days|email|birthday/);
    }
  });

  it('keeps the constants and the rows in step, in both directions', () => {
    expect(Object.values(EV).sort()).toEqual(Object.keys(REGISTRY).sort());
    const used = new Set([...Object.values(REGISTRY).flatMap((r) => Object.keys(r.props)), ...Object.keys(GLOBAL_PROPS)]);
    expect(Object.values(PROP).sort()).toEqual([...used].sort());
  });

  it('no call site writes a registered event name as a literal or builds a name from a variable (V3 over the sources)', () => {
    const src = sources();
    expect(Object.keys(src).length).toBeGreaterThan(5);
    expect(ruleV3({ ...input(), sources: src })).toEqual([]);
  });

  it('puts every property of every registry row at L2 and nothing on the never list', () => {
    for (const [n, r] of Object.entries(REGISTRY)) {
      for (const [p, s] of Object.entries(r.props)) {
        expect(s.level, `${n}.${p}`).toBe('L2');
        expect(p, `${n}.${p}`).not.toMatch(/religion|region|background|ethnic|birth|dob|due|child_name|transcript|audio_url|photo|entry|text/);
      }
    }
  });
});

describe('V1 and V2: names', () => {
  it('V1 accepts the grammar and rejects anything else', () => {
    expect(ruleV1(['letter_saved', 'perf_measured'])).toEqual([]);
    for (const bad of ['Letter_saved', 'letter-saved', 'letter saved', '$exception', 'letter_saved_', '1letter', 'a'.repeat(41), '']) {
      expect(ruleV1([bad]), bad).toHaveLength(1);
    }
  });
  it('V2 wants a listed last word, except names waiting for the rename PR', () => {
    expect(ruleV2(['letter_saved', 'control_tapped', 'screen_view'])).toEqual([]);
    expect(ruleV2(['letter_saving'])).toHaveLength(1);
    expect(NAME_RULES.grandfathered.every((n) => n in REGISTRY)).toBe(true);
  });
});

describe('V3: names are literals in the registry', () => {
  it('flags a missing constant, a missing row, a variable name and a literal at a call site', () => {
    const base = input();
    expect(ruleV3({ ...base, ev: { ...base.ev, ghost: 'ghost_event' }, sources: {} })).toHaveLength(1);
    const { letterSaved: _x, ...rest } = base.ev;
    void _x;
    expect(ruleV3({ ...base, ev: rest, sources: {} })).toHaveLength(1);
    expect(ruleV3({ ...base, sources: { 'a.ts': 'analytics.track(`${area}_saved`, {})' } })).toHaveLength(1);
    expect(ruleV3({ ...base, sources: { 'a.ts': "analytics.track('letter_' + 'saved', {})" } })).toHaveLength(1);
    expect(ruleV3({ ...base, sources: { 'a.ts': "analytics.track('letter_saved', {})" } }).length).toBeGreaterThanOrEqual(1);
    expect(ruleV3({ ...base, sources: { 'a.ts': 'analytics.track(EV.letterSaved, {})' } })).toEqual([]);
    expect(ruleV3({ ...base, sources: { 'a.ts': "// analytics.track('letter_saved') in a comment" } })).toEqual([]);
  });
});

describe('V4: ids', () => {
  it('accepts slugs and flags duplicates and bad shapes', () => {
    expect(ruleV4({ control: ['a_b', 'c'] })).toEqual([]);
    expect(ruleV4({ control: ['a', 'a'] })).toHaveLength(1);
    expect(ruleV4({ control: ['Not Snake'] })).toHaveLength(1);
  });
});

describe('V5: rows', () => {
  it('accepts a full row and flags a missing decision, requirement, trigger or stage', () => {
    expect(ruleV5({ x: row() })).toEqual([]);
    expect(ruleV5({ x: row({ decision: '' }) })).toHaveLength(1);
    expect(ruleV5({ x: row({ decision: 'too short' }) })).toHaveLength(1);
    expect(ruleV5({ x: row({ reqs: [] }) })).toHaveLength(1);
    expect(ruleV5({ x: row({ when: ' ' }) })).toHaveLength(1);
    expect(ruleV5({ x: row({ stage: 'nope' as never }) })).toHaveLength(1);
  });
});

describe('V6: property names and types', () => {
  it('accepts the three shapes and flags a string type, a $ name and an unbounded int', () => {
    const ok = row({ props: { count: { type: 'int', min: 0, max: 5, level: 'L2' }, kind: { type: 'enum', values: ['a_b', '2_4'], level: 'L2' }, flag: { type: 'bool', level: 'L2' } } });
    expect(ruleV6({ x: ok })).toEqual([]);
    expect(ruleV6({ x: row({ props: { $bad: { type: 'bool', level: 'L2' } } }) })).toHaveLength(1);
    expect(ruleV6({ x: row({ props: { s: { type: 'string', level: 'L2' } as never } }) })).toHaveLength(1);
    expect(ruleV6({ x: row({ props: { n: { type: 'int', min: 0.5, max: 9, level: 'L2' } } }) })).toHaveLength(1);
    expect(ruleV6({ x: row({ props: { e: { type: 'enum', values: ['Has Space'], level: 'L2' } } }) })).toHaveLength(1);
  });
});

describe('V7: banned tokens in property names', () => {
  it('matches whole tokens only, and some only before id', () => {
    expect(ruleV7(['profile', 'child_count_bucket', 'child_ordinal', 'words_bucket', 'route'])).toEqual([]);
    for (const bad of ['file_kind', 'child_name', 'email', 'transcript_text', 'dob', 'child_id', 'device_ids', 'media_count', 'birthday', 'query', 'letter_id']) {
      expect(ruleV7([bad]), bad).toHaveLength(1);
    }
  });
});

describe('V8: registry, constants and the tracking plan agree', () => {
  it('flags an event missing from either side and a property without a constant', () => {
    const base = input();
    const names = Object.keys(REGISTRY);
    expect(ruleV8(base, names)).toEqual([]);
    expect(ruleV8(base, names.slice(1))).toHaveLength(1);
    expect(ruleV8(base, [...names, 'ghost_event'])).toHaveLength(1);
    const { route: _r, ...noRoute } = PROP;
    void _r;
    expect(ruleV8({ ...base, prop: noRoute }, names).length).toBeGreaterThanOrEqual(1);
  });
});

describe('V9: funnels', () => {
  it('flags an unregistered step, a bad id and a one-step funnel', () => {
    const base = input();
    expect(ruleV9(base)).toEqual([]);
    expect(ruleV9({ ...base, funnels: { f_capture_x: ['letter_saved', 'ghost_event'] } })).toHaveLength(1);
    expect(ruleV9({ ...base, funnels: { BadId: ['letter_saved', 'capture_started'] } })).toHaveLength(1);
    expect(ruleV9({ ...base, funnels: { f_capture_x: ['letter_saved'] } })).toHaveLength(1);
  });
});

describe('V10: deprecated rows are not emitted', () => {
  it('flags a deprecated row that still has a constant', () => {
    const base = input();
    expect(ruleV10(base)).toEqual([]);
    const reg = { ...base.registry, letter_saved: { ...base.registry.letter_saved, status: 'deprecated' as const } };
    expect(ruleV10({ ...base, registry: reg })).toHaveLength(1);
  });
});

describe('V16: cardinality', () => {
  it('lets an id registry hold 300 and any other enum 64', () => {
    const many = (n: number) => Array.from({ length: n }, (_, i) => `v${i}`);
    const base = input();
    const mk = (n: number, prop: string) => ({ x: row({ props: { [prop]: { type: 'enum', values: many(n), level: 'L2' } } }) });
    expect(ruleV16({ ...base, registry: mk(65, 'kind') })).toHaveLength(1);
    expect(ruleV16({ ...base, registry: mk(64, 'kind') })).toEqual([]);
    expect(ruleV16({ ...base, registry: mk(300, 'route') })).toEqual([]);
    expect(ruleV16({ ...base, registry: mk(301, 'route') })).toHaveLength(1);
  });
});
