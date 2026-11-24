/**
 * Tier of each event (ER-B02, BL-1255). The tier is a field of the catalogue row, so a row cannot be added without
 * one (it does not compile). `tierOf` is what the mobile app passes to `createAnalytics`; under `collect_by_default`
 * only `basics` passes before a yes, so a name that is not in the catalogue is `consented` and never passes.
 *
 * The basics set is closed and pinned by `test/tiers.test.ts`. Adding to it is privacy's to sign (BL-1255), so the
 * pin changes in the same PR, with `privacy` as reviewer.
 */
import { EVENTS, type EventName } from './catalog';
import type { EventTier } from './contracts';
import type { EventSpec } from './schema';

export function tierOf(name: EventName | string): EventTier {
  const row = Object.prototype.hasOwnProperty.call(EVENTS, name) ? (EVENTS as Record<string, EventSpec>)[name] : undefined;
  return row?.tier === 'basics' ? 'basics' : 'consented';
}

/** Every event whose tier is `basics`, in catalogue order. */
export function basicsEvents(): string[] {
  return Object.keys(EVENTS).filter((n) => tierOf(n) === 'basics');
}
