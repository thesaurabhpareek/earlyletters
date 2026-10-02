/**
 * Property schema primitives for the analytics allowlist.
 *
 * Only three value shapes exist: an enum of fixed snake_case strings, a
 * boolean, or a bounded integer. There is deliberately no free-text string
 * type. If a property cannot be expressed as one of these, it does not belong
 * in analytics (CLAUDE.md privacy rules, ADR 0008, LEGAL-REQ-017).
 */

/**
 * Data classification level (PRD section 7.10). Analytics may only carry L1
 * (public) or L2 (internal, no personal content). L3 and L4 are not
 * representable here on purpose.
 */
export type Level = 'L1' | 'L2';

export interface EnumSpec<V extends string = string> {
  readonly type: 'enum';
  readonly values: readonly V[];
  readonly level: Level;
  readonly optional?: boolean;
}

export interface BoolSpec {
  readonly type: 'bool';
  readonly level: Level;
  readonly optional?: boolean;
}

export interface IntSpec {
  readonly type: 'int';
  readonly min: number;
  readonly max: number;
  readonly level: Level;
  readonly optional?: boolean;
}

export type PropSpec = EnumSpec | BoolSpec | IntSpec;

/** Enum of fixed values. Every analytics property is L2 (PRD 7.10 item 9). */
export function oneOf<const V extends readonly string[]>(...values: V): EnumSpec<V[number]> {
  return { type: 'enum', values, level: 'L2' };
}

export function bool(): BoolSpec {
  return { type: 'bool', level: 'L2' };
}

export function int(min: number, max: number): IntSpec {
  return { type: 'int', min, max, level: 'L2' };
}

/** Marks a property optional in the generated TypeScript types. */
export function opt<S extends PropSpec>(spec: S): S & { readonly optional: true } {
  return { ...spec, optional: true };
}

export type ValueOf<S> = S extends EnumSpec<infer V>
  ? V
  : S extends BoolSpec
    ? boolean
    : S extends IntSpec
      ? number
      : never;

type RequiredKeys<P> = { [K in keyof P]: P[K] extends { optional: true } ? never : K }[keyof P];
type OptionalKeys<P> = { [K in keyof P]: P[K] extends { optional: true } ? K : never }[keyof P];

/** Turns a `{ key: PropSpec }` map into the props object type callers pass. */
export type PropsOf<P> = { [K in RequiredKeys<P>]: ValueOf<P[K]> } & {
  [K in OptionalKeys<P>]?: ValueOf<P[K]>;
};

export interface EventSpec {
  /** Product area, used to group the catalogue in TRACKING_PLAN.md. */
  readonly area: string;
  /** One line: when it fires. Never describes content. */
  readonly when: string;
  /** PRD / legal requirement IDs this event serves. */
  readonly reqs: readonly string[];
  readonly level: Level;
  readonly props: Readonly<Record<string, PropSpec>>;
}
