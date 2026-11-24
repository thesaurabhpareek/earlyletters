/**
 * ER-A03 (BL-1238): the policy-aware gate. Fictional family Asha only; events carry route names, never content.
 * The first block is the old "nothing before a yes" behaviour, kept as the `ask_first` case (the existing cases in
 * analytics.test.ts, which run with the default policy, stay as they were).
 * The tier of an event comes from `tierOf`: here `screen_view` stands in for a basics row and `letter_saved` for a
 * consented one, test-only, so this file needs no registry.
 */
import { describe, expect, it } from 'vitest';
import { createAnalytics, createGate, memoryStorage, recordingProvider, STORAGE_KEYS, type AnalyticsOptions, type EventTier } from '../src';

const tierOf: AnalyticsOptions['tierOf'] = (name): EventTier => (name === 'screen_view' ? 'basics' : 'consented');
const letter = {
  mode: 'spoken', destination: 'book', child_ordinal: 'first', member_role: 'parent', prompt_kind: 'opening', audio_bucket: '1_2m',
  words_bucket: '100_299', machine_edit_count: 4, edits_reverted_count: 0, engine: 'on_device', from_notification_2h: false,
} as const;

function setup(basicsPolicy: AnalyticsOptions['basicsPolicy']) {
  let n = 0;
  const provider = recordingProvider();
  const storage = memoryStorage();
  const analytics = createAnalytics({ provider, storage, basicsPolicy, tierOf, randomId: () => `00000000-0000-4000-8000-${String(++n).padStart(12, '0')}`, flushIntervalMs: 0 });
  return { analytics, provider, storage };
}

describe('ask_first (the default): nothing before a yes', () => {
  const policies: AnalyticsOptions['basicsPolicy'][] = [undefined, 'ask_first', 'garbage' as never];
  for (const policy of policies) {
    it(`policy ${String(policy)}: zero capture, zero id written, nothing queued, no SDK call`, async () => {
      const { analytics, provider, storage } = setup(policy);
      await analytics.init();
      await analytics.recordDisclosureShown();
      expect(analytics.track('screen_view', { route: 'family' })).toBe('dropped_no_consent');
      expect(analytics.track('capture:letter_save', letter)).toBe('dropped_no_consent');
      await analytics.flush();
      expect(provider.captured()).toHaveLength(0);
      expect(analytics.queueLength()).toBe(0);
      expect(storage.dump()[STORAGE_KEYS.id]).toBeUndefined();
      expect(analytics.analyticsIds()).toEqual([]);
      expect(provider.calls.map((c) => c.method)).not.toContain('identify');
      expect(provider.calls.map((c) => c.method)).not.toContain('optIn');
      expect(analytics.dropCounts()).toEqual({ dropped_no_consent: 2 });
    });
  }

  it('a yes lets both tiers through; an off stops them again', async () => {
    const { analytics, provider } = setup('ask_first');
    await analytics.init();
    await analytics.grant();
    expect(analytics.track('screen_view', { route: 'family' })).toBe('queued');
    expect(analytics.track('capture:letter_save', letter)).toBe('queued');
    await analytics.flush();
    expect(provider.captured()).toHaveLength(2);
    await analytics.revoke();
    expect(analytics.track('screen_view', { route: 'family' })).toBe('dropped_no_consent');
  });
});

describe('collect_by_default', () => {
  it('sends nothing, mints nothing and queues nothing until the disclosure is recorded', async () => {
    const { analytics, provider, storage } = setup('collect_by_default');
    await analytics.init();
    expect(analytics.track('screen_view', { route: 'family' })).toBe('dropped_disclosure_pending');
    expect(analytics.track('capture:letter_save', letter)).toBe('dropped_disclosure_pending');
    await analytics.flush();
    expect(provider.captured()).toHaveLength(0);
    expect(analytics.queueLength()).toBe(0);
    expect(storage.dump()[STORAGE_KEYS.id]).toBeUndefined();
    expect(provider.calls.map((c) => c.method)).not.toContain('optIn');
    expect(analytics.dropCounts()).toEqual({ dropped_disclosure_pending: 2 });
  });

  it('after the disclosure, mints the install id at the first basics event and sends only basics', async () => {
    const { analytics, provider, storage } = setup('collect_by_default');
    await analytics.init();
    await analytics.recordDisclosureShown();
    expect(storage.dump()[STORAGE_KEYS.id]).toBeUndefined();
    expect(analytics.track('screen_view', { route: 'family' })).toBe('queued');
    expect(analytics.track('capture:letter_save', letter)).toBe('dropped_not_basics');
    await analytics.flush();
    const id = storage.dump()[STORAGE_KEYS.id];
    expect(id).toMatch(/^[0-9a-f-]{36}$/);
    expect(provider.captured().map((c) => c.event)).toEqual(['screen_view']);
    expect(analytics.analyticsIds()).toEqual([id]);
    expect(analytics.consent()).toBe('unknown');
    expect(analytics.dropCounts()).toEqual({ dropped_not_basics: 1 });
  });

  it('the disclosure flag survives a restart; Erase everything clears it', async () => {
    const first = setup('collect_by_default');
    await first.analytics.init();
    await first.analytics.recordDisclosureShown();
    const again = createAnalytics({ provider: recordingProvider(), storage: first.storage, basicsPolicy: 'collect_by_default', tierOf, flushIntervalMs: 0 });
    await again.init();
    expect(again.disclosureShown()).toBe(true);
    await again.forgetIds();
    expect(again.disclosureShown()).toBe(false);
    expect(again.track('screen_view', { route: 'family' })).toBe('dropped_disclosure_pending');
  });

  it('the person off switch beats the policy, before and after the disclosure, and drops what was queued', async () => {
    const { analytics, provider } = setup('collect_by_default');
    await analytics.init();
    await analytics.recordDisclosureShown();
    expect(analytics.track('screen_view', { route: 'family' })).toBe('queued');
    await analytics.revoke();
    expect(analytics.queueLength()).toBe(0);
    expect(analytics.track('screen_view', { route: 'family' })).toBe('dropped_user_off');
    await analytics.flush();
    expect(provider.captured()).toHaveLength(0);
    expect(analytics.analyticsIds()).toHaveLength(1);
    expect(analytics.consent()).toBe('denied');
  });

  it('after an off, a later yes sends the consented tier too, under a new id', async () => {
    const { analytics, provider } = setup('collect_by_default');
    await analytics.init();
    await analytics.recordDisclosureShown();
    analytics.track('screen_view', { route: 'family' });
    await analytics.flush();
    await analytics.revoke();
    await analytics.grant();
    expect(analytics.track('capture:letter_save', letter)).toBe('queued');
    await analytics.flush();
    expect(provider.captured().map((c) => c.event)).toEqual(['screen_view', 'capture:letter_save']);
    expect(new Set(analytics.analyticsIds()).size).toBe(2);
  });

  it('without tierOf every event is consented, so nothing passes before a yes', async () => {
    const analytics = createAnalytics({ provider: recordingProvider(), basicsPolicy: 'collect_by_default', flushIntervalMs: 0 });
    await analytics.init();
    await analytics.recordDisclosureShown();
    expect(analytics.track('screen_view', { route: 'family' })).toBe('dropped_not_basics');
  });
});

describe('createGate', () => {
  const gate = (policy: 'ask_first' | 'collect_by_default', status: 'unknown' | 'granted' | 'denied', shown: boolean) =>
    createGate({ policy, status: () => status, disclosureShown: () => shown });

  it('answers every combination with a reason code and nothing else', () => {
    const table: [Parameters<typeof gate>, EventTier, unknown][] = [
      [['ask_first', 'unknown', true], 'basics', { allow: false, reason: 'dropped_no_consent' }],
      [['ask_first', 'denied', true], 'basics', { allow: false, reason: 'dropped_no_consent' }],
      [['ask_first', 'granted', false], 'consented', { allow: true }],
      [['collect_by_default', 'unknown', false], 'basics', { allow: false, reason: 'dropped_disclosure_pending' }],
      [['collect_by_default', 'unknown', true], 'basics', { allow: true }],
      [['collect_by_default', 'unknown', true], 'consented', { allow: false, reason: 'dropped_not_basics' }],
      [['collect_by_default', 'denied', true], 'basics', { allow: false, reason: 'dropped_user_off' }],
      [['collect_by_default', 'denied', false], 'basics', { allow: false, reason: 'dropped_user_off' }],
      [['collect_by_default', 'granted', false], 'consented', { allow: true }],
    ];
    for (const [args, tier, want] of table) expect(gate(...args).decide('screen_view', tier)).toEqual(want);
  });

  it('treats an unrecognised policy as ask_first', () => {
    const g = createGate({ policy: 'collect' as never, status: () => 'unknown', disclosureShown: () => true });
    expect(g.decide('screen_view', 'basics')).toEqual({ allow: false, reason: 'dropped_no_consent' });
  });
});
