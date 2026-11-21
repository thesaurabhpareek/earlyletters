/**
 * The source registry (NS-53-R36). Each source lists the surfaces it may reach as data, so a later push, email or
 * widget cannot start reading a source by accident. The library (S7) is never push or email in the first release.
 * `assertRegistry` is the build-time check; the tests run it on the shipped table and on deliberately wrong ones.
 */
export type SourceId = 'S1' | 'S2' | 'S3' | 'S4' | 'S5' | 'S6' | 'S7' | 'H';
export type Surface = 'card' | 'push' | 'email' | 'widget';
const SURFACES: readonly Surface[] = ['card', 'push', 'email', 'widget'];

export interface SourceSpec {
  id: SourceId;
  surfaces: readonly Surface[];
  /** May a local reminder be planned from this source (the phone holds every fact it needs). */
  pushSafe: boolean;
  /** Does the server legitimately know the fact (only the date of birth). */
  serverSafe: boolean;
  /** The founder decision that allows email from this source. Absent in the first release. */
  emailDecisionId?: string;
}

const source = (id: SourceId, pushSafe: boolean, serverSafe = false): SourceSpec =>
  Object.freeze({ id, pushSafe, serverSafe, surfaces: Object.freeze(pushSafe ? (['card', 'push'] as const) : (['card'] as const)) });

export const SOURCES: readonly SourceSpec[] = Object.freeze([
  source('S1', true),
  source('S2', true),
  source('S3', true, true),
  source('S4', false),
  source('S5', false),
  source('S6', true),
  source('S7', false),
  source('H', false),
]);

/** Throws a fixed code (never data) when a registry breaks a rule. */
export function assertRegistry(sources: readonly SourceSpec[]): void {
  const bad = (): never => {
    throw new Error('moments_registry_invalid');
  };
  if (new Set(sources.map((s) => s.id)).size !== sources.length) bad();
  for (const s of sources) {
    if (s.surfaces.some((x) => !SURFACES.includes(x))) bad();
    if (s.surfaces.includes('push') && !s.pushSafe) bad();
    if (s.surfaces.includes('email') && (!s.serverSafe || !s.emailDecisionId)) bad();
    if (s.id === 'S7' && (s.pushSafe || s.serverSafe || s.surfaces.some((x) => x !== 'card'))) bad();
  }
}
assertRegistry(SOURCES);
