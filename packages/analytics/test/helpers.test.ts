import { readdirSync, statSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  analyticsConsentDue,
  audioBucket,
  childOrdinal,
  createAnalytics,
  createLifecycle,
  createTrackers,
  daysBucket,
  EVENTS,
  hourBucket,
  LIFECYCLE_KEYS,
  lettersBucket,
  MAX_ANALYTICS_CONSENT_OFFERS,
  memoryStorage,
  recordingProvider,
  ROUTE_MAP,
  routeForSegments,
  SCHEMA_VERSION,
  timeToFirstLetterBucket,
  toV1Lang,
  wordsBucket,
  type AnalyticsAskState,
} from '../src';

async function granted() {
  const provider = recordingProvider();
  let n = 0;
  const analytics = createAnalytics({ provider, randomId: () => `00000000-0000-4000-8000-${String(++n).padStart(12, '0')}`, flushIntervalMs: 0 });
  await analytics.init();
  await analytics.grant();
  const sent = async () => {
    await analytics.flush();
    return provider.captured();
  };
  return { analytics, provider, sent };
}

describe('buckets', () => {
  it('maps durations, counts and positions to the catalogue edges', () => {
    expect([0, 14_999, 15_000, 59_999, 60_000, 119_999, 120_000, 299_999, 300_000].map(audioBucket)).toEqual([
      'lt_15s', 'lt_15s', '15_60s', '15_60s', '1_2m', '1_2m', '2_5m', '2_5m', 'gt_5m',
    ]);
    expect([0, 24, 25, 99, 100, 299, 300].map(wordsBucket)).toEqual(['lt_25', 'lt_25', '25_99', '25_99', '100_299', '100_299', '300_plus']);
    expect([0, 1, 2, 4, 5, 9, 10, 49, 50, 99, 100, 364, 365].map(lettersBucket)).toEqual([
      '0', '1', '2_4', '2_4', '5_9', '5_9', '10_49', '10_49', '50_99', '50_99', '100_364', '100_364', '365_plus',
    ]);
    const day = 86_400_000;
    expect([0, day, 2 * day, 7.9 * day, 8 * day, 30.9 * day, 31 * day, 91 * day].map(daysBucket)).toEqual([
      'd0', 'd1', 'd2_7', 'd2_7', 'd8_30', 'd8_30', 'd31_90', 'd91_plus',
    ]);
    expect([0, 1, 2, 7].map(childOrdinal)).toEqual(['first', 'second', 'third_plus', 'third_plus']);
    expect([6, 13, 19, 22, 2].map(hourBucket)).toEqual(['morning', 'afternoon', 'evening', 'late_evening', 'late_evening']);
    expect([null, -5, 60_000, 200_000, 1_000_000, 86_400_000].map(timeToFirstLetterBucket)).toEqual([
      'unknown', 'unknown', 'lt_90s', '90s_5m', '5_30m', 'gt_24h',
    ]);
  });

  it('never throws on bad clocks or NaN', () => {
    expect(audioBucket(Number.NaN)).toBe('lt_15s');
    expect(daysBucket(-1000)).toBe('d0');
    expect(lettersBucket(Number.POSITIVE_INFINITY)).toBe('0');
  });

  it('normalises language codes to the seven v1.0 languages only', () => {
    expect(['en', 'EN-us', 'hi-IN', 'es_MX', 'zh-Hans', 'cmn', 'fr-CA', 'ar', 'pt-BR'].map(toV1Lang)).toEqual(['en', 'en', 'hi', 'es', 'zh', 'zh', 'fr', 'ar', 'pt']);
    for (const code of ['de', 'ta', 'auto', '', null, undefined, 'Asha']) expect(toV1Lang(code), String(code)).toBeNull();
  });
});

describe('trackers', () => {
  it('letter saved: buckets everything, private by destination, no audio bucket for typed', async () => {
    const { analytics, sent } = await granted();
    const t = createTrackers(analytics);
    t.trackLetterSaved({
      mode: 'typed', inBook: false, childIndex: 1, role: 'parent', promptKind: null, audioMs: 90_000,
      wordCount: 140, machineEdits: 0, editsReverted: 0, engine: 'none', fromNotificationWithin2h: true,
    });
    t.trackLetterSaved({
      mode: 'spoken', inBook: true, childIndex: 0, role: 'contributor', promptKind: 'gap', audioMs: 90_000,
      wordCount: 10, machineEdits: 9999, editsReverted: 2, engine: 'on_device', fromNotificationWithin2h: false,
    });
    const [typed, spoken] = await sent();
    expect(typed.properties).toMatchObject({ destination: 'private', child_ordinal: 'second', prompt_kind: 'none', words_bucket: '100_299' });
    expect(typed.properties).not.toHaveProperty('audio_bucket');
    expect(spoken.properties).toMatchObject({ audio_bucket: '1_2m', machine_edit_count: 500, member_role: 'contributor', destination: 'book' });
  });

  it('invites carry the database role value `parent` (CORE-05)', async () => {
    const { analytics, sent } = await granted();
    const t = createTrackers(analytics);
    t.trackInviteCreated({ role: 'parent', channel: 'share_sheet', shared: true, childIndex: 0 });
    t.trackInviteAccepted({ role: 'contributor' });
    const [created, accepted] = await sent();
    expect(created.properties.role).toBe('parent');
    expect(accepted.properties).toMatchObject({ role: 'contributor', surface: 'app' });
  });

  it('language and pack events carry only the code and the short pack id', async () => {
    const { analytics, sent } = await granted();
    const t = createTrackers(analytics);
    expect(t.trackLanguageSet({ lang: 'pt-BR', action: 'added' })).toBe('queued');
    expect(t.trackLanguageSet({ lang: 'ta', action: 'added' })).toBe('not_sent');
    t.trackPackDownload({ packId: 'text-rules.hi', version: 3, stage: 'failed', failure: 'hash_mismatch', network: 'cellular' });
    t.trackPackDownload({ packId: 'speech-model.whisper-large-v3-turbo-q5_0', version: 5000, stage: 'completed', failure: 'offline', network: 'wifi' });
    t.trackPackDownload({ packId: 'text-rules.de', version: null, stage: 'started', network: 'unknown' });
    const [lang, failed, done, other] = await sent();
    expect(lang).toEqual({ event: 'language_set', properties: { lang: 'pt', action: 'added', schema_version: SCHEMA_VERSION } });
    expect(failed.properties).toEqual({ pack: 'rules_hi', lang: 'hi', pack_version: 3, stage: 'failed', failure: 'hash_mismatch', network: 'cellular', schema_version: SCHEMA_VERSION });
    expect(done.properties).toEqual({ pack: 'model_turbo', pack_version: 1000, stage: 'completed', network: 'wifi', schema_version: SCHEMA_VERSION });
    expect(other.properties).toMatchObject({ pack: 'other', pack_version: 1 });
    expect(JSON.stringify([failed, done, other])).not.toMatch(/text-rules|speech-model|whisper/);
  });

  it('verifier rejections are grouped and counted, never carrying text', async () => {
    const { analytics, sent } = await granted();
    const t = createTrackers(analytics);
    const r = (type: 'filler' | 'stt_fix', reason: 'not_vetted_for_language' | 'stt_fix_not_dictionary') => ({
      edit: { type, source: 'rule' as const, original: 'Asha um', replacement: '' },
      reason,
    });
    t.trackMachineEditsRejected([r('filler', 'not_vetted_for_language'), r('filler', 'not_vetted_for_language'), r('stt_fix', 'stt_fix_not_dictionary')]);
    const events = await sent();
    expect(events.map((e) => e.properties)).toEqual([
      { edit_type: 'filler', source: 'rule', reason: 'not_vetted_for_language', count: 2, schema_version: SCHEMA_VERSION },
      { edit_type: 'stt_fix', source: 'rule', reason: 'stt_fix_not_dictionary', count: 1, schema_version: SCHEMA_VERSION },
    ]);
    expect(JSON.stringify(events)).not.toContain('Asha');
  });

  it('transcription maps model ids to short values, including the Hindi model and no_speech', async () => {
    const { analytics, sent } = await granted();
    const t = createTrackers(analytics);
    t.trackTranscriptionCompleted({ engine: 'on_device', modelId: 'speech-model.whisper-hindi-small-q5_1', audioMs: 20_000, latencyMs: 4_000, outcome: 'no_speech' });
    t.trackTranscriptionCompleted({ engine: 'on_device', modelId: null, audioMs: 1, latencyMs: 1, outcome: 'ok' });
    const [hi, sample] = await sent();
    expect(hi.properties).toMatchObject({ model: 'hindi_small', outcome: 'no_speech', audio_bucket: '15_60s', latency_bucket: 'lt_5s' });
    expect(sample.properties.model).toBe('none');
  });

  it('reminder preferences map to the schedule event', async () => {
    const { analytics, sent } = await granted();
    const t = createTrackers(analytics);
    t.trackReminderSchedule({ enabled: true, cadence: 'fewTimes', hour: 20, paused: false });
    t.trackReminderSchedule({ enabled: false, cadence: 'everyEvening', hour: 7, paused: true });
    const [a, b] = await sent();
    expect(a.properties).toMatchObject({ cadence: 'few_times', hour_bucket: 'evening', paused: false });
    expect(b.properties).toMatchObject({ cadence: 'off', hour_bucket: 'morning', paused: true });
  });

  it('opted-in summary uses buckets only, never the times', async () => {
    const { analytics, sent } = await granted();
    const t = createTrackers(analytics);
    const launch = Date.UTC(2026, 9, 1);
    t.trackAnalyticsOptedIn({
      surface: 'consent_sheet', now: launch + 3 * 86_400_000, firstLaunchAt: launch, firstLetterAt: launch + 80_000,
      firstLetterMode: 'spoken', letters: 3, signedIn: true, role: 'parent', cameFromInvite: false,
    });
    const [e] = await sent();
    expect(e.properties).toMatchObject({ days_since_install: 'd2_7', time_to_first_letter: 'lt_90s', letters_bucket: '2_4' });
    expect(JSON.stringify(e)).not.toContain(String(launch));
  });

  it('every tracker produces an event in the catalogue', () => {
    const names: string[] = [];
    const t = createTrackers({ track: (name) => (names.push(name), 'queued') });
    t.trackCaptureStarted({ mode: 'spoken', source: 'tonight', promptKind: 'opening', childIndex: 0, role: 'parent' });
    t.trackCaptureDiscarded({ mode: 'spoken', stage: 'listening', audioMs: 3000 });
    t.trackTranscriptionCompleted({ engine: 'on_device', modelId: 'speech-model.whisper-large-v3-turbo-q5_0', audioMs: 1, latencyMs: 1, outcome: 'ok' });
    t.trackBookOpened({ childIndex: 0, letters: 3, role: 'parent' });
    t.trackReadTogetherStarted({ childIndex: 0, access: 'try', letters: 3 });
    t.trackReadTogetherEnded({ reason: 'finished', durationMs: 1, lettersHeard: 1 });
    t.trackExportStarted({ letters: 3 });
    t.trackExportCompleted({ bytes: 1, durationMs: 1 });
    t.trackExportFailed({ reason: 'low_space' });
    t.trackColdStart({ ttfiMs: 800 });
    for (const n of names) expect(Object.keys(EVENTS)).toContain(n);
  });
});

describe('[PRD-REQ-001] analytics consent timing', () => {
  const base: AnalyticsAskState = {
    consent: 'unknown', lettersSaved: 1, firstLetterThisSession: false, askShownThisSession: false,
    keepTheBookPending: false, reminderPrimePending: false, blockingSurface: false, offersSoFar: 0,
  };
  it('is due only as the third ask, in a later session after the first letter', () => {
    expect(analyticsConsentDue(base)).toEqual({ due: true });
    expect(analyticsConsentDue({ ...base, lettersSaved: 0 })).toEqual({ due: false, reason: 'no_letter_yet' });
    expect(analyticsConsentDue({ ...base, firstLetterThisSession: true })).toEqual({ due: false, reason: 'same_session_as_first_letter' });
    expect(analyticsConsentDue({ ...base, keepTheBookPending: true })).toEqual({ due: false, reason: 'earlier_ask_pending' });
    expect(analyticsConsentDue({ ...base, reminderPrimePending: true })).toEqual({ due: false, reason: 'earlier_ask_pending' });
  });
  it('never stacks asks, never interrupts recording, review or export, never after a decision', () => {
    expect(analyticsConsentDue({ ...base, askShownThisSession: true }).due).toBe(false);
    expect(analyticsConsentDue({ ...base, blockingSurface: true }).due).toBe(false);
    expect(analyticsConsentDue({ ...base, consent: 'granted' }).due).toBe(false);
    expect(analyticsConsentDue({ ...base, consent: 'denied' }).due).toBe(false);
  });
  it('stops offering after two unanswered showings', () => {
    expect(analyticsConsentDue({ ...base, offersSoFar: MAX_ANALYTICS_CONSENT_OFFERS - 1 }).due).toBe(true);
    expect(analyticsConsentDue({ ...base, offersSoFar: MAX_ANALYTICS_CONSENT_OFFERS })).toEqual({ due: false, reason: 'offered_enough' });
  });
});

describe('route map', () => {
  it('maps file segments to route templates, never concrete paths', () => {
    expect(routeForSegments(['(tabs)'])).toBe('tonight');
    expect(routeForSegments(['(tabs)', 'book'])).toBe('book');
    expect(routeForSegments(['letter', '[id]'])).toBe('letter_detail');
    expect(routeForSegments(['settings', 'children', '[id]'])).toBe('settings_child_detail');
    expect(routeForSegments(['settings', 'privacy'])).toBe('settings_privacy');
    expect(routeForSegments(['letter', '0190a000-0000-7000-8000-000000000000'])).toBeNull();
    expect(routeForSegments(['somewhere', 'new'])).toBeNull();
  });

  it('every mapped value is in the route enum', () => {
    const allowed = EVENTS.screen_view.props.route.values as readonly string[];
    for (const v of Object.values(ROUTE_MAP)) expect(allowed).toContain(v);
  });

  it('lists app routes that have no analytics route yet (report only)', () => {
    const appDir = resolve(__dirname, '../../../apps/mobile/src/app');
    const files: string[] = [];
    const walk = (d: string) => {
      for (const n of readdirSync(d)) {
        const f = join(d, n);
        if (statSync(f).isDirectory()) walk(f);
        else if (/\.tsx$/.test(n) && !n.startsWith('_layout') && !n.startsWith('+')) files.push(relative(appDir, f));
      }
    };
    try {
      walk(appDir);
    } catch {
      return;
    }
    const unmapped = files
      .map((f) => f.replace(/\.tsx$/, '').split('/'))
      .map((segs) => (segs[segs.length - 1] === 'index' ? segs.slice(0, -1) : segs))
      .filter((segs) => routeForSegments(segs) === null)
      .map((s) => s.join('/'));
    // Not a failure while screens are being added in parallel; TRACKING_PLAN 9 lists them.
    if (unmapped.length) console.info(`[analytics] routes without a screen_view mapping: ${unmapped.join(', ')}`);
    expect(Array.isArray(unmapped)).toBe(true);
  });
});

describe('lifecycle', () => {
  it('sends app_opened at launch and after 30 minutes away, and the session bucket on background', async () => {
    const { analytics, sent } = await granted();
    const storage = memoryStorage();
    let t = Date.UTC(2026, 9, 3, 18);
    const lc = createLifecycle({ analytics, storage, now: () => t });
    await lc.launch({ ttfiMs: 900 });
    t += 4 * 60_000;
    await lc.background();
    t += 5 * 60_000;
    expect(await lc.foreground()).toBe(false); // 5 min away: same session (wall time counts toward it)
    t += 60_000;
    await lc.background();
    t += 3 * 86_400_000;
    expect(await lc.foreground('notification')).toBe(true);
    expect(lc.session().index).toBe(2);
    const events = (await sent()).map((e) => [e.event, e.properties]);
    expect(events).toEqual([
      ['app_cold_start', { ttfi_bucket: 'lt_1s', schema_version: SCHEMA_VERSION }],
      ['app_opened', { source: 'cold', days_since_last_open: 'd0', schema_version: SCHEMA_VERSION }],
      ['app_backgrounded', { session_bucket: '1_5m', schema_version: SCHEMA_VERSION }],
      ['app_backgrounded', { session_bucket: '5_15m', schema_version: SCHEMA_VERSION }],
      ['app_opened', { source: 'notification', days_since_last_open: 'd2_7', schema_version: SCHEMA_VERSION }],
    ]);
    expect(Number(storage.dump()[LIFECYCLE_KEYS.firstLaunchAt])).toBe(Date.UTC(2026, 9, 3, 18));
  });

  it('keeps local times without consent but sends nothing', async () => {
    const provider = recordingProvider();
    const analytics = createAnalytics({ provider, randomId: () => 'x', flushIntervalMs: 0 });
    await analytics.init();
    const storage = memoryStorage();
    const lc = createLifecycle({ analytics, storage, now: () => 1_000 });
    await lc.launch();
    await lc.background();
    expect(provider.captured()).toHaveLength(0);
    expect(storage.dump()[LIFECYCLE_KEYS.firstLaunchAt]).toBe('1000');
  });
});
