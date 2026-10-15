/**
 * Plan reminder scheduling against a fake notification centre (BL-342, WP-F14-07). The Expo wiring
 * (plan-reminders.native.ts) is a thin port; what it schedules and cancels is decided here.
 */
import { describe, expect, it } from 'vitest';
import type { NativeEntitlementSnapshot, NativeTransaction } from '../../../modules/scribe-store/types';
import { cardFor, isPlanReminder, PLAN_REMINDER_SOURCE, planReminderDays, replanReminders, requestsFor, type NotificationPort, type PlanReminderRequest, type ScheduledItem } from './plan-reminders';
import { EMPTY_PLAN, planFromSnapshot, type PlanState } from './plan.logic';

const NOW = '2027-06-01T17:00:00.000Z';
const TZ = 'America/Los_Angeles';
const at = (days: number) => new Date(Date.parse(NOW) + days * 86_400_000).toISOString();

function planWith(over: Partial<NativeTransaction> = {}, willAutoRenew = true): PlanState {
  const t: NativeTransaction = { productId: 'plus.annual', expiresAt: at(61), purchasedAt: NOW, ownership: 'purchased', environment: 'production', isTrial: true, isUpgraded: false, ...over };
  const s: NativeEntitlementSnapshot = { entitlements: [t], statuses: [{ ...t, state: 'subscribed', willAutoRenew }], checkedAt: NOW };
  return planFromSnapshot(s);
}

/** A notification centre in memory. A letter reminder is already scheduled by the other scheduler. */
function fakeCentre(allowed = true) {
  const items = new Map<string, ScheduledItem & { request?: PlanReminderRequest }>();
  items.set('el.evening.2027-06-02', { identifier: 'el.evening.2027-06-02', data: { source: 'scribe.reminders', kind: 'evening' } });
  let calls = 0;
  const port: NotificationPort = {
    allowed: async () => allowed,
    scheduled: async () => [...items.values()].map(({ identifier, data }) => ({ identifier, data })),
    cancel: async (id) => {
      calls++;
      items.delete(id);
    },
    schedule: async (r) => {
      calls++;
      items.set(r.identifier, { identifier: r.identifier, data: r.data, request: r });
    },
  };
  const ours = () => [...items.values()].filter((i) => isPlanReminder(i));
  return { port, items, ours, calls: () => calls };
}

describe('scheduling plan reminders', () => {
  it('[F14-REQ-008] an annual trial purchase: 2 trial reminders pending, with their own source marker, at most 4', async () => {
    const c = fakeCentre();
    await replanReminders(c.port, { plan: planWith(), now: NOW, timeZone: TZ });
    const ours = c.ours();
    expect(ours.map((o) => (o.data as { kind: string }).kind)).toEqual(['trial_long', 'trial_final']);
    for (const o of ours) {
      expect(o.data).toEqual({ source: PLAN_REMINDER_SOURCE, kind: expect.any(String) });
      expect(o.identifier.startsWith('plan.')).toBe(true);
    }
    expect(ours.length).toBeLessThanOrEqual(4);
  });

  it('[F13-REQ-015] the letter reminder already scheduled is left alone, and the plan reminder days are exposed for that scheduler', async () => {
    const c = fakeCentre();
    await replanReminders(c.port, { plan: planWith(), now: NOW, timeZone: TZ });
    expect(c.items.has('el.evening.2027-06-02')).toBe(true);
    const days = planReminderDays({ plan: planWith(), now: NOW, timeZone: TZ });
    expect(days).toEqual(c.ours().map((o) => o.request!.at.date));
  });

  it('[F14-REQ-020] after a reinstall (nothing scheduled), the first launch replans the next renewal reminders from StoreKit', async () => {
    const c = fakeCentre();
    c.items.clear();
    const annual = planWith({ isTrial: false, expiresAt: at(200) });
    await replanReminders(c.port, { plan: annual, now: NOW, timeZone: TZ });
    expect(c.ours().map((o) => (o.data as { kind: string }).kind)).toEqual(['annual_renewal_long', 'annual_renewal_short']);
  });

  it('[C-REQ-025] renewal turned off: 0 pending after the next foreground', async () => {
    const c = fakeCentre();
    const sig = await replanReminders(c.port, { plan: planWith(), now: NOW, timeZone: TZ });
    expect(c.ours()).toHaveLength(2);
    await replanReminders(c.port, { plan: planWith({}, false), now: at(3), timeZone: TZ }, sig);
    expect(c.ours()).toEqual([]);
    expect(c.items.has('el.evening.2027-06-02')).toBe(true);
  });

  it('[F14-REQ-016] Plus lapsed or never bought: nothing scheduled', async () => {
    const c = fakeCentre();
    await replanReminders(c.port, { plan: EMPTY_PLAN, now: NOW, timeZone: TZ });
    expect(c.ours()).toEqual([]);
  });

  it('a replan that changes nothing touches nothing', async () => {
    const c = fakeCentre();
    const input = { plan: planWith(), now: NOW, timeZone: TZ };
    const sig = await replanReminders(c.port, input);
    const before = c.calls();
    expect(await replanReminders(c.port, input, sig)).toBe(sig);
    expect(c.calls()).toBe(before);
  });

  it('[F14-REQ-010] notifications not allowed: nothing scheduled, and the card still shows 18 days before the end', async () => {
    const c = fakeCentre(false);
    await replanReminders(c.port, { plan: planWith(), now: NOW, timeZone: TZ });
    expect(c.ours()).toEqual([]);
    expect(cardFor({ plan: planWith(), now: at(61 - 18), timeZone: TZ }, new Set())?.kind).toBe('trial_long');
  });

  it('a failing notification centre never throws', async () => {
    const broken: NotificationPort = { allowed: async () => true, scheduled: async () => { throw new Error('no centre'); }, cancel: async () => {}, schedule: async () => {} };
    await expect(replanReminders(broken, { plan: planWith(), now: NOW, timeZone: TZ })).resolves.toBeNull();
  });

  it('requests carry enums only: no names, no letter text', () => {
    for (const r of requestsFor({ plan: planWith(), now: NOW, timeZone: TZ })) {
      expect(Object.keys(r.data).sort()).toEqual(['kind', 'source']);
      expect(r.body).not.toMatch(/\{child\}|Asha/);
    }
  });
});
