/**
 * Drift guard between the held catalogue (`catalog.ts` HELD_EVENTS) and the send list (`registry.ts` REGISTRY).
 * Only REGISTRY names are sent (validate.ts `isKnownEvent`); HELD_EVENTS are typed and held. Every sendable event is
 * defined once, in the registry, and `EVENTS` is the two joined, so the two sets must stay disjoint: an event added to
 * both, or to neither side's pin, fails here. The shared value sets (ROUTE and the rest) are defined once, in
 * values.ts, and catalog.ts only re-exports them (CODE-R13). Fictional family Asha only; no data.
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import * as barrel from '../src';
import * as catalog from '../src/catalog';
import * as values from '../src/values';
import { EVENTS, HELD_EVENTS, REGISTRY } from '../src';

/*
 * Promotion rule. Moving an event off this list takes three things together: a row in REGISTRY
 * (packages/analytics/src/registry.ts, deleting the row from HELD_EVENTS), a row in docs/analytics/TRACKING_PLAN.md
 * section 3.1, and a look from the privacy agent. Until all three are in, the event stays held. Production analytics
 * stay off until the D-163 gate clears (D-170, docs/DECISIONS.md), so a held event is not sent from a production build.
 */
const HELD = [
  'onboarding:sign_in_dismiss', 'onboarding:sign_in_fail', 'child_switched', 'keeping:export_complete', 'keeping:export_fail', 'keeping:export_start',
  'family:invite_fail', 'family:invite_open', 'me:language_update', 'machine_edit_rejected', 'machine_edit_reverted',
  'notifications:notification_open', 'plus:code_submit', 'notifications:permission_submit', 'system:pack_download_update', 'book:playback_start',
  'book:read_together_end', 'book:read_together_start', 'notifications:reminder_prime_submit', 'notifications:reminder_prime_view',
  'notifications:schedule_update', 'notifications:reminder_cancel', 'plus:restore_complete', 'review_action', 'me:setting_update',
  'me:session_end', 'system:sync_fail',
];

describe('[PRD-REQ-016] the held catalogue and the send registry cannot drift apart unnoticed', () => {
  it('the held rows are exactly the pinned list, and none is also a registry row', () => {
    expect(Object.keys(HELD_EVENTS).sort()).toEqual([...HELD].sort());
    expect(Object.keys(HELD_EVENTS).filter((n) => n in REGISTRY)).toEqual([]);
  });

  it('EVENTS is the held rows plus every registry row, each registry row read from the registry itself', () => {
    expect(Object.keys(EVENTS).sort()).toEqual([...Object.keys(HELD_EVENTS), ...Object.keys(REGISTRY)].sort());
    for (const n of Object.keys(REGISTRY)) {
      expect((EVENTS as Record<string, unknown>)[n], n).toBe((REGISTRY as Record<string, unknown>)[n]);
    }
  });
});

describe('[CODE-R13] each shared value set is defined once, in values.ts', () => {
  const names = Object.keys(values);

  it('catalog.ts and the barrel hand out the very same objects as values.ts', () => {
    expect(names).toContain('ROUTE');
    for (const n of names) {
      expect((catalog as Record<string, unknown>)[n], `catalog.${n}`).toBe((values as Record<string, unknown>)[n]);
      expect((barrel as Record<string, unknown>)[n], `barrel.${n}`).toBe((values as Record<string, unknown>)[n]);
    }
  });

  it('catalog.ts source does not declare any of those names again', () => {
    const src = readFileSync(resolve(__dirname, '../src/catalog.ts'), 'utf8');
    for (const n of names) expect(src, n).not.toMatch(new RegExp(`(?:const|let|var|function|type)\\s+${n}\\b`));
  });
});
