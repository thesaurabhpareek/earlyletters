import { describe, expect, it } from 'vitest';
import { EVENTS } from '../src';

/** The events and properties the ROI measurements M1 to M7 read (docs/roadmap/next/06-roi.md), by name. */
const ROI: Record<string, string[]> = {
  analytics_opted_in: ['time_to_first_letter'],
  capture_started: [],
  capture_discarded: ['stage'],
  letter_saved: ['from_notification_2h'],
  error_shown: ['code'],
  sync_failed: ['reason'],
  pack_download: ['stage', 'failure', 'network'],
  free_allowance_reached: ['allowance'],
  keep_gate_shown: ['letters_kept', 'allowance', 'lapsed'],
  letter_held: [],
  app_opened: ['days_since_last_open'],
  reminder_sent: ['type'],
  notification_opened: ['type'],
  reminder_suppressed: ['reason'],
  settings_changed: ['key'],
  coparent_soon_opened: ['surface'],
  coparent_soon_notify: [],
  invite_created: ['channel'],
  invite_accepted: ['role'],
  plus_offer_viewed: ['trigger'],
  plus_started_from_gate: [],
  plan_changed: ['from_state', 'to_state', 'period', 'ownership'],
  offer_code_redeemed: [],
  restore_result: [],
};

describe('ROI measurements M1 to M7 are all covered by the catalogue, with no free text', () => {
  for (const [event, props] of Object.entries(ROI)) {
    it(`${event} exists and carries ${props.join(', ') || 'no extra property'}`, () => {
      const spec = (EVENTS as Record<string, { props: Record<string, { type: string }> }>)[event];
      expect(spec, event).toBeDefined();
      for (const p of props) expect(Object.keys(spec.props), `${event}.${p}`).toContain(p);
      for (const [name, s] of Object.entries(spec.props)) expect(['enum', 'bool', 'int'], `${event}.${name}`).toContain(s.type);
    });
  }
});
