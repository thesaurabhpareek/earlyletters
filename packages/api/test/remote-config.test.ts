import { describe, expect, it } from 'vitest';
import { BUNDLED_READ_TOGETHER_FREE_SESSIONS, DEFAULT_REMOTE_CONFIG, effectiveFreeSessions, isKilled, KILL_SWITCH_KEYS, parseRemoteConfig } from '../src';

const base = { schemaVersion: 1, version: 5, generatedAt: '2026-10-03T12:00:00.000Z' };

describe('parseRemoteConfig', () => {
  it('fills every missing key from the bundled defaults', () => {
    const r = parseRemoteConfig(base);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect({ ...r.value, version: 0, generatedAt: DEFAULT_REMOTE_CONFIG.generatedAt }).toEqual(DEFAULT_REMOTE_CONFIG);
  });

  it('[TDD01-3.9] a bad value falls back for that key only', () => {
    const r = parseRemoteConfig({
      ...base,
      readTogetherFreeSessions: 'lots',
      minSupportedVersion: 'v2',
      flags: { introVariant: 'seven', lockScreenNamesDefault: true },
      killSwitches: { sync: 'yes', invites: true },
    });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.value.readTogetherFreeSessions).toBe(BUNDLED_READ_TOGETHER_FREE_SESSIONS);
    expect(r.value.minSupportedVersion).toBe('0.0.0');
    expect(r.value.flags).toEqual({ introVariant: 'four', lockScreenNamesDefault: true });
    expect(r.value.killSwitches.sync).toBe(false);
    expect(r.value.killSwitches.invites).toBe(true);
  });

  it('ignores keys it does not know (newer server, older app)', () => {
    const r = parseRemoteConfig({ ...base, somethingNew: { a: 1 }, killSwitches: { recording: true } });
    expect(r.ok && 'somethingNew' in r.value).toBe(false);
    expect(r.ok && 'recording' in r.value.killSwitches).toBe(false);
  });

  it('[LEGAL-REQ-040] has no kill switch for recording, reading, playback or export', () => {
    for (const forbidden of ['recording', 'record', 'typing', 'save', 'read', 'playback', 'export', 'analytics', 'paywall']) {
      expect(KILL_SWITCH_KEYS as readonly string[]).not.toContain(forbidden);
    }
  });

  it('rejects a document without its identity fields', () => {
    expect(parseRemoteConfig({ ...base, schemaVersion: 2 }).ok).toBe(false);
    expect(parseRemoteConfig({ ...base, version: -1 }).ok).toBe(false);
    expect(parseRemoteConfig({ ...base, generatedAt: 'yesterday' }).ok).toBe(false);
  });
});

describe('effectiveFreeSessions', () => {
  it('[DECISION-16] remote config can raise the free Read together allowance but never lower it below what App Review saw', () => {
    expect(effectiveFreeSessions({ readTogetherFreeSessions: 0 })).toBe(BUNDLED_READ_TOGETHER_FREE_SESSIONS);
    expect(effectiveFreeSessions({ readTogetherFreeSessions: 1 })).toBe(BUNDLED_READ_TOGETHER_FREE_SESSIONS);
    expect(effectiveFreeSessions({ readTogetherFreeSessions: 10 })).toBe(10);
    expect(effectiveFreeSessions({ readTogetherFreeSessions: 1000 })).toBe(50);
  });
  it('reads kill switches', () => {
    expect(isKilled(DEFAULT_REMOTE_CONFIG, 'sync')).toBe(false);
    expect(isKilled({ killSwitches: { ...DEFAULT_REMOTE_CONFIG.killSwitches, sync: true } }, 'sync')).toBe(true);
  });
});
