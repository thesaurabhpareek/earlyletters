/**
 * Drift guard between the held catalogue (`catalog.ts` EVENTS) and the send list (`registry.ts` REGISTRY).
 * Only REGISTRY names are sent (validate.ts `isKnownEvent`); the rest of EVENTS is typed and held. The two sets are
 * NOT equal on purpose, so this pins the difference by name: an event added to one file and not decided in the other
 * fails here, and an event in both must agree on its properties, their type and enum values, and level. Fictional family Asha only; no data.
 */
import { describe, expect, it } from 'vitest';
import { EVENTS, REGISTRY } from '../src';

const cat = EVENTS as Record<string, { level: string; props: Record<string, unknown> }>;
const reg = REGISTRY as Record<string, { level: string; props: Record<string, unknown> }>;

/** In REGISTRY only: the generic rows that replaced several catalogue rows (control taps, impressions, timings). */
const REGISTRY_ONLY = ['control_tapped', 'perf_measured', 'surface_impressed'];
/** In EVENTS only: typed and held, never sent until a row is added to the registry (a decision, not a drive-by). */
/*
 * Promotion rule. Moving an event off this list takes three things together: a row in REGISTRY
 * (packages/analytics/src/registry.ts), a row in docs/analytics/TRACKING_PLAN.md section 3.1, and a look from
 * the privacy agent. Until all three are in, the event stays held. Production analytics stay off until the
 * D-163 gate clears (D-170, docs/DECISIONS.md), so a held event is not sent from a production build either way.
 */
const HELD = [
  'account_deletion', 'app_backgrounded', 'app_cold_start', 'auth_deferred', 'auth_email_sent', 'auth_failed',
  'auth_method_selected', 'auth_sheet_shown', 'child_setting_changed', 'child_switched', 'dictionary_term_added',
  'export_completed', 'export_failed', 'export_shared', 'export_started', 'family_letter_reviewed', 'goals_set',
  'invite_failed', 'invite_opened', 'language_set', 'letter_deleted', 'local_merge_choice', 'machine_edit_rejected',
  'machine_edit_reverted', 'make_it_yours_card', 'member_left', 'member_removed', 'moment_shown',
  'notification_opened', 'offer_code_redeemed', 'os_permission_result', 'pack_download', 'playback_started',
  'read_together_ended', 'read_together_started', 'reminder_prime_result', 'reminder_prime_shown', 'reminder_schedule_set',
  'reminder_sent', 'reminder_suppressed', 'restore_result', 'resurface_opened', 'resurface_shown', 'review_action',
  'settings_changed', 'signed_out', 'sync_failed',
];

describe('[PRD-REQ-016] the held catalogue and the send registry cannot drift apart unnoticed', () => {
  it('every registry event is in the catalogue, except the pinned registry-only rows', () => {
    const missing = Object.keys(reg).filter((n) => !(n in cat) && !REGISTRY_ONLY.includes(n));
    expect(missing).toEqual([]);
    expect(Object.keys(reg).filter((n) => REGISTRY_ONLY.includes(n)).sort()).toEqual(REGISTRY_ONLY); // the pin is not stale
  });

  it('every catalogue event is in the registry, except the pinned held rows', () => {
    const unsent = Object.keys(cat).filter((n) => !(n in reg));
    expect(unsent.sort()).toEqual([...HELD].sort());
  });

  it('an event named in both has the same properties and the same level', () => {
    for (const n of Object.keys(reg).filter((k) => k in cat)) {
      expect([n, Object.keys(reg[n].props).sort()]).toEqual([n, Object.keys(cat[n].props).sort()]);
      expect([n, reg[n].level]).toEqual([n, cat[n].level]);
    }
  });

  it('a property named in both has the same type and, for an enum, the same values', () => {
    type Spec = { type: string; values?: readonly string[] };
    for (const n of Object.keys(reg).filter((k) => k in cat)) {
      for (const k of Object.keys(reg[n].props)) {
        const a = reg[n].props[k] as Spec;
        const b = cat[n].props[k] as Spec;
        expect([n, k, a.type]).toEqual([n, k, b.type]);
        expect([n, k, [...(a.values ?? [])].sort()]).toEqual([n, k, [...(b.values ?? [])].sort()]);
      }
    }
  });
});
