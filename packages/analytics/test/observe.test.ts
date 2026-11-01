import { describe, expect, it } from 'vitest';
import {
  createAnalytics,
  createAuthObserver,
  createLanguageObserver,
  createPackObserver,
  createPlanObserver,
  createReminderObserver,
  notificationOpenedEvent,
  recordingProvider,
  type AuthLike,
} from '../src';

async function granted() {
  const provider = recordingProvider();
  const analytics = createAnalytics({ provider, randomId: () => '00000000-0000-4000-8000-0000000000aa', flushIntervalMs: 0 });
  await analytics.init();
  await analytics.grant();
  return {
    analytics,
    sent: async () => {
      await analytics.flush();
      return provider.captured().map((e) => [e.event, Object.fromEntries(Object.entries(e.properties).filter(([k]) => k !== 'schema_version'))]);
    },
  };
}

describe('auth observer', () => {
  it('reports method, email sends, failures, success and sign-out from state changes', async () => {
    const { analytics, sent } = await granted();
    const under18: string[] = [];
    const see = createAuthObserver(analytics, { hasLocalLetters: () => true, onUnder18: () => under18.push('x') });
    const states: AuthLike[] = [
      { status: 'signedOut' },
      { status: 'signingIn', method: 'email' },
      { status: 'awaitingCode', sentAt: 1 },
      { status: 'awaitingCode', sentAt: 1, error: 'wrong_code' },
      { status: 'awaitingCode', sentAt: 2 },
      { status: 'checkingConsent', method: 'email' },
      { status: 'ready' },
      { status: 'signingOut', reason: 'user' },
      { status: 'signedOut' },
      { status: 'signingIn', method: 'apple' },
      { status: 'signedOut' }, // cancelled
      { status: 'signingIn', method: 'google' },
      { status: 'signedOut', error: 'network' },
      { status: 'checkingConsent', method: null }, // restored at launch: not a new sign-in
      { status: 'ready' },
      { status: 'signedOut', error: 'session_expired' },
    ];
    for (const s of states) see(s);
    expect(await sent()).toEqual([
      ['auth_method_selected', { method: 'email' }],
      ['auth_email_sent', { attempt: 1 }],
      ['auth_failed', { method: 'email', reason: 'wrong_code' }],
      ['auth_email_sent', { attempt: 2 }],
      ['auth_succeeded', { method: 'email', had_local_data: true }],
      ['signed_out', { reason: 'user' }],
      ['auth_method_selected', { method: 'apple' }],
      ['auth_failed', { method: 'apple', reason: 'cancelled' }],
      ['auth_method_selected', { method: 'google' }],
      ['auth_failed', { method: 'google', reason: 'network' }],
      ['signed_out', { reason: 'session_lost' }],
    ]);
    expect(under18).toEqual([]);
  });

  it('never sends an under-18 answer, and asks the app to stop analytics', async () => {
    const { analytics, sent } = await granted();
    const under18: string[] = [];
    const see = createAuthObserver(analytics, { hasLocalLetters: () => false, onUnder18: () => under18.push('stop') });
    see({ status: 'needsConsent', method: 'apple' });
    see({ status: 'signedOut', error: 'under_18' });
    expect(await sent()).toEqual([]);
    expect(under18).toEqual(['stop']);
  });
});

describe('language observer', () => {
  it('baseline first, then one event per language change', async () => {
    const { analytics, sent } = await granted();
    const see = createLanguageObserver(analytics);
    see(['en']);
    see(['en', 'hi']);
    see(['hi', 'en']);
    see(['hi', 'ta']); // ta is not a v1.0 language: its add is not sent
    expect(await sent()).toEqual([
      ['language_set', { lang: 'hi', action: 'added' }],
      ['language_set', { lang: 'hi', action: 'made_primary' }],
      ['language_set', { lang: 'en', action: 'removed' }],
    ]);
  });
});

describe('pack observer', () => {
  it('started once per job, then completed or failed, never progress ticks', async () => {
    const { analytics, sent } = await granted();
    const see = createPackObserver(analytics, () => 'wifi');
    see({ id: 'text-rules.pt', version: null, phase: 'queued' });
    see({ id: 'text-rules.pt', version: 4, phase: 'downloading' });
    see({ id: 'text-rules.pt', version: 4, phase: 'downloading' });
    see({ id: 'text-rules.pt', version: 4, phase: 'verifying' });
    see({ id: 'text-rules.pt', version: 4, phase: 'installed' });
    see({ id: 'speech-model.whisper-hindi-small-q5_1', version: 2, phase: 'downloading' });
    see({ id: 'speech-model.whisper-hindi-small-q5_1', version: null, phase: 'failed', failure: 'no_space' });
    see({ id: 'speech-model.whisper-small-q5_1', version: null, phase: 'cancelled' });
    see({ id: 'text-rules.pt', version: null, phase: 'removed' });
    expect(await sent()).toEqual([
      ['pack_download', { pack: 'rules_pt', lang: 'pt', pack_version: 4, stage: 'started', network: 'wifi' }],
      ['pack_download', { pack: 'rules_pt', lang: 'pt', pack_version: 4, stage: 'completed', network: 'wifi' }],
      ['pack_download', { pack: 'model_hindi_small', lang: 'hi', pack_version: 2, stage: 'started', network: 'wifi' }],
      ['pack_download', { pack: 'model_hindi_small', lang: 'hi', pack_version: 2, stage: 'failed', failure: 'no_space', network: 'wifi' }],
      ['pack_download', { pack: 'model_small', pack_version: 1, stage: 'failed', failure: 'cancelled', network: 'wifi' }],
      ['pack_download', { pack: 'rules_pt', lang: 'pt', pack_version: 1, stage: 'removed', network: 'wifi' }],
    ]);
  });
});

describe('plan observer', () => {
  it('reports production state changes only, after a baseline read', async () => {
    const { analytics, sent } = await granted();
    const see = createPlanObserver(analytics);
    const p = (state: 'none' | 'trial' | 'active', environment: 'production' | 'sandbox' = 'production') =>
      ({ state, period: state === 'none' ? null : 'year', ownership: state === 'none' ? null : 'familyShared', environment, checked: true }) as const;
    see({ ...p('none'), checked: false });
    see(p('none'));
    see(p('trial'));
    see(p('trial'));
    see(p('active', 'sandbox'));
    expect(await sent()).toEqual([['plan_changed', { from_state: 'none', to_state: 'trial', period: 'year', ownership: 'family_shared' }]]);
  });
});

describe('reminder observer', () => {
  it('baseline, then one event per meaningful change', async () => {
    const { analytics, sent } = await granted();
    const see = createReminderObserver(analytics);
    const base = { enabled: true, paused: false, cadence: 'fewTimes' as const, time: { hour: 20, minute: 30 } };
    see(base);
    see({ ...base, time: { hour: 20, minute: 45 } }); // same part of day: nothing
    see({ ...base, paused: true });
    expect(await sent()).toEqual([['reminder_schedule_set', { cadence: 'few_times', hour_bucket: 'evening', paused: true }]]);
  });
});

describe('notification opened', () => {
  it('reports evening reminders only; month-age and birthday notes never', () => {
    expect(notificationOpenedEvent({ source: 'reminders', kind: 'evening', variant: 3 })).toEqual({ type: 'letter_reminder', variant_id: 3 });
    expect(notificationOpenedEvent({ source: 'reminders', kind: 'evening' })).toEqual({ type: 'letter_reminder' });
    expect(notificationOpenedEvent({ source: 'reminders', kind: 'monthAge' })).toBeNull();
    expect(notificationOpenedEvent({ source: 'reminders', kind: 'birthday' })).toBeNull();
    expect(notificationOpenedEvent(null)).toBeNull();
  });
});
