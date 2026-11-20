/**
 * Validator rules V1 to V16 (docs/analytics/instrumentation/00-event-standard.md section 10) as one pure,
 * unit-tested module. Each rule takes its input explicitly so a test can feed it a bad registry and watch it fail
 * (every rule has a positive and a negative self-test: test/registry-rules.test.ts).
 *
 * V1 to V10 and V16 are static (registry versus code versus docs). V11 to V15 run on every payload and fail closed;
 * they live where the payload is handled: validate.ts (V11 unknown event, V12 property rules, V13 PII-like values),
 * client.ts (V15 nothing before consent) and test/registry-canary.test.ts (V14 canary).
 *
 * Naming grammar note: the standard's three-segment dotted names (`capture.letter.saved`) are NOT applied yet. The
 * founder ruling of 20 Nov 2026 builds with the current registry shape; the PostHog-convention rename is a separate
 * PR that changes `NAME_RULES` below and the names in registry.ts, nothing else.
 */
import type { PropSpec } from './schema';
import type { RegistryRow, Stage } from './registry';

export type RuleId = 'V1' | 'V2' | 'V3' | 'V4' | 'V5' | 'V6' | 'V7' | 'V8' | 'V9' | 'V10' | 'V16';
export interface RuleFailure {
  rule: RuleId;
  subject: string;
  detail: string;
}

/** What the rules read. Tests build their own. */
export interface RegistryInput {
  registry: Readonly<Record<string, RegistryRow & { status?: 'built' | 'deprecated' }>>;
  /** Constant name to wire name (`EV`). */
  ev: Readonly<Record<string, string>>;
  /** Constant name to wire property name (`PROP`). */
  prop: Readonly<Record<string, string>>;
  funnels: Readonly<Record<string, readonly string[]>>;
  /** Id-ref enums: property name to the registry kind (screen route, control, surface, metric). */
  idRefProps: Readonly<Record<string, string>>;
  /** Source files to scan for V3: path to text. */
  sources?: Readonly<Record<string, string>>;
}

/** The current naming shape: lowercase snake_case, at most 40 characters. The coming rename changes this one object. */
export const NAME_RULES = {
  grammar: /^[a-z][a-z0-9]*(?:_[a-z0-9]+)*$/,
  maxLength: 40,
  /** Closed list of last words (past-tense verbs and the basics). */
  actions: [
    'viewed', 'tapped', 'impressed', 'measured', 'opened', 'closed', 'started', 'discarded', 'completed', 'saved',
    'added', 'created', 'accepted', 'shown', 'held', 'reached', 'changed', 'succeeded', 'sent', 'redeemed',
  ] as readonly string[],
  /** Names that predate the list; each is renamed by the PostHog-convention PR, then removed from here. */
  grandfathered: ['screen_view', 'analytics_opted_in', 'error_shown', 'plus_started_from_gate', 'free_allowance_reached'] as readonly string[],
  /** First words reserved for the SDK. */
  reserved: ['$'] as readonly string[],
};

const STAGES: readonly Stage[] = ['basics', 'activation', 'capture', 'keep', 'return', 'plus'];
const PROP_GRAMMAR = /^[a-z][a-z0-9]*(?:_[a-z0-9]+)*$/;
const ENUM_SHAPE = /^[a-z0-9]+(?:_[a-z0-9]+)*$/;
const BANNED_TOKENS = ['name', 'email', 'text', 'transcript', 'query', 'title', 'caption', 'note', 'dob', 'birth', 'birthday', 'due', 'phone', 'address', 'token', 'path', 'file', 'url', 'media'];
const BANNED_BEFORE_ID = ['letter', 'child', 'user', 'person', 'book', 'device', 'entry'];
export const MAX_ID_REGISTRY = 300;
export const MAX_PLAIN_ENUM = 64;

const fail = (rule: RuleId, subject: string, detail: string): RuleFailure => ({ rule, subject, detail });

/** V1: every name matches the grammar. */
export function ruleV1(names: readonly string[]): RuleFailure[] {
  return names.flatMap((n) =>
    NAME_RULES.grammar.test(n) && n.length <= NAME_RULES.maxLength && !NAME_RULES.reserved.some((r) => n.startsWith(r))
      ? []
      : [fail('V1', n, 'name breaks the grammar (lowercase snake_case, no $, at most 40 characters)')],
  );
}

/** V2: the last word is on the closed action list (or the name is grandfathered until the rename PR). */
export function ruleV2(names: readonly string[]): RuleFailure[] {
  return names.flatMap((n) => {
    const last = n.split('_').pop() ?? '';
    return NAME_RULES.actions.includes(last) || NAME_RULES.grandfathered.includes(n) ? [] : [fail('V2', n, `last word "${last}" is not on the action list`)];
  });
}

/** V3: a name is a literal in the registry, and no source builds one from a variable. */
export function ruleV3(input: RegistryInput): RuleFailure[] {
  const out: RuleFailure[] = [];
  const keys = new Set(Object.keys(input.registry));
  for (const [k, v] of Object.entries(input.ev)) if (!keys.has(v)) out.push(fail('V3', k, `EV.${k} names "${v}", which is not a registry row`));
  const wired = new Set(Object.values(input.ev));
  for (const k of keys) if (!wired.has(k)) out.push(fail('V3', k, 'registry row has no EV constant'));
  for (const [path, text] of Object.entries(input.sources ?? {})) {
    const code = text.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
    // track( `${x}`, track( a + b, track(someVariable,  : a name must be EV.something or a literal
    const re = /\.track\(\s*([^,)]+)/g;
    for (let m = re.exec(code); m; m = re.exec(code)) {
      const arg = m[1].trim();
      if (!/^EV\.[a-zA-Z0-9]+$/.test(arg) && !/^name$/.test(arg)) out.push(fail('V3', path, `track() is called with "${arg.slice(0, 40)}", not an EV constant`));
    }
    // A registered name written as a string literal outside the registry is a call-site name.
    for (const n of keys) {
      if (new RegExp(`['"\`]${n}['"\`]`).test(code)) out.push(fail('V3', path, `registered name "${n}" is written as a literal; use EV`));
    }
  }
  return out;
}

/** V4: ids (controls, surfaces, metrics, routes) are registered snake slugs, unique, within the cap. */
export function ruleV4(idLists: Readonly<Record<string, readonly string[]>>): RuleFailure[] {
  const out: RuleFailure[] = [];
  for (const [kind, ids] of Object.entries(idLists)) {
    if (new Set(ids).size !== ids.length) out.push(fail('V4', kind, 'duplicate id'));
    for (const id of ids) if (!ENUM_SHAPE.test(id) || id.length > 40) out.push(fail('V4', `${kind}:${id}`, 'id is not a snake_case slug of 40 characters or fewer'));
  }
  return out;
}

/** V5: every row has every field, a stage, a requirement and one decision. */
export function ruleV5(registry: RegistryInput['registry']): RuleFailure[] {
  const out: RuleFailure[] = [];
  for (const [n, r] of Object.entries(registry)) {
    if (!r.decision || r.decision.trim().length < 20) out.push(fail('V5', n, 'no decision named: an event that informs no decision is not added'));
    else if (/\b(and|or)\b.*\b(and also|as well as)\b/.test(r.decision)) out.push(fail('V5', n, 'names more than one decision'));
    if (!STAGES.includes(r.stage)) out.push(fail('V5', n, 'stage is not one of the six'));
    if (!r.when?.trim()) out.push(fail('V5', n, 'no trigger line'));
    if (!r.area?.trim()) out.push(fail('V5', n, 'no area'));
    if (!Array.isArray(r.reqs) || r.reqs.length === 0) out.push(fail('V5', n, 'no requirement id'));
    if (r.level !== 'L1' && r.level !== 'L2') out.push(fail('V5', n, 'level must be L1 or L2'));
  }
  return out;
}

function specProblem(spec: PropSpec): string | null {
  if (spec.type === 'enum') {
    if (spec.values.length === 0) return 'enum has no values';
    for (const v of spec.values) if (!ENUM_SHAPE.test(v) || v.length > 40) return `enum value "${v}" is not snake_case of 40 characters or fewer`;
    return null;
  }
  if (spec.type === 'int') return Number.isInteger(spec.min) && Number.isInteger(spec.max) && spec.min <= spec.max ? null : 'int has no integer bounds';
  if (spec.type === 'bool') return null;
  return 'unknown property type (only enum, bool and bounded int exist)';
}

/** V6: property names and types. No string type exists. */
export function ruleV6(registry: RegistryInput['registry']): RuleFailure[] {
  const out: RuleFailure[] = [];
  for (const [n, r] of Object.entries(registry)) {
    for (const [p, spec] of Object.entries(r.props)) {
      if (!PROP_GRAMMAR.test(p) || p.length > 30 || p.startsWith('$')) out.push(fail('V6', `${n}.${p}`, 'property name breaks the grammar (snake_case, at most 30 characters, no $)'));
      const problem = specProblem(spec);
      if (problem) out.push(fail('V6', `${n}.${p}`, problem));
    }
  }
  return out;
}

/** V7: no banned token in a property NAME (whole tokens split on "_"; some only when followed by id or ids). */
export function ruleV7(propNames: readonly string[]): RuleFailure[] {
  return propNames.flatMap((p) => {
    const tokens = p.split('_');
    const hit = tokens.find((t, i) => BANNED_TOKENS.includes(t) || (BANNED_BEFORE_ID.includes(t) && (tokens[i + 1] === 'id' || tokens[i + 1] === 'ids')));
    return hit ? [fail('V7', p, `banned token "${hit}"`)] : [];
  });
}

/** V8: the registry, the EV and PROP constants, and the tracking-plan table list the same events and properties. */
export function ruleV8(input: RegistryInput, planEventNames: readonly string[]): RuleFailure[] {
  const out: RuleFailure[] = [];
  const reg = new Set(Object.keys(input.registry));
  const plan = new Set(planEventNames);
  for (const n of reg) if (!plan.has(n)) out.push(fail('V8', n, 'in the registry, not in docs/analytics/TRACKING_PLAN.md'));
  for (const n of plan) if (!reg.has(n)) out.push(fail('V8', n, 'in docs/analytics/TRACKING_PLAN.md, not in the registry'));
  const used = new Set(Object.values(input.registry).flatMap((r) => Object.keys(r.props)));
  const wired = new Set(Object.values(input.prop));
  for (const p of used) if (!wired.has(p)) out.push(fail('V8', p, 'property has no PROP constant'));
  return out;
}

/** V9: every funnel step is a registered event; funnel ids match f_<area>_<goal>. */
export function ruleV9(input: RegistryInput): RuleFailure[] {
  const out: RuleFailure[] = [];
  for (const [id, steps] of Object.entries(input.funnels)) {
    if (!/^f_[a-z]+_[a-z0-9_]+$/.test(id) || id.length > 40) out.push(fail('V9', id, 'funnel id is not f_<area>_<goal>'));
    if (steps.length < 2 || steps.length > 8) out.push(fail('V9', id, 'a funnel has 2 to 8 steps'));
    for (const s of steps) if (!Object.prototype.hasOwnProperty.call(input.registry, s)) out.push(fail('V9', id, `step "${s}" is not a registered event`));
  }
  return out;
}

/** V10: a deprecated row is not emitted: it may not have an EV constant. */
export function ruleV10(input: RegistryInput): RuleFailure[] {
  const wired = new Set(Object.values(input.ev));
  return Object.entries(input.registry).flatMap(([n, r]) => (r.status === 'deprecated' && wired.has(n) ? [fail('V10', n, 'deprecated row still has an EV constant')] : []));
}

/** V16: id registries hold at most 300 ids; every other enum at most 64 values. */
export function ruleV16(input: RegistryInput): RuleFailure[] {
  const out: RuleFailure[] = [];
  for (const [n, r] of Object.entries(input.registry)) {
    for (const [p, spec] of Object.entries(r.props)) {
      if (spec.type !== 'enum') continue;
      const cap = input.idRefProps[p] ? MAX_ID_REGISTRY : MAX_PLAIN_ENUM;
      if (spec.values.length > cap) out.push(fail('V16', `${n}.${p}`, `${spec.values.length} values exceeds the cap of ${cap}`));
    }
  }
  return out;
}

/** Runs every static rule. An empty list means the registry is valid. */
export function checkRegistry(input: RegistryInput, planEventNames: readonly string[], idLists: Readonly<Record<string, readonly string[]>>): RuleFailure[] {
  const names = Object.keys(input.registry);
  const props = [...new Set(Object.values(input.registry).flatMap((r) => Object.keys(r.props)))];
  return [
    ...ruleV1(names), ...ruleV2(names), ...ruleV3(input), ...ruleV4(idLists), ...ruleV5(input.registry), ...ruleV6(input.registry),
    ...ruleV7(props), ...ruleV8(input, planEventNames), ...ruleV9(input), ...ruleV10(input), ...ruleV16(input),
  ];
}
