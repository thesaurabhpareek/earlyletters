import { describe, expect, it } from 'vitest';
import {
  BUNDLED_FREE_LETTERS, BUNDLED_READ_TOGETHER_FREE_SESSIONS, effectiveFreeLetters, DEFAULT_REMOTE_CONFIG, effectiveFreeSessions, isKilled,
  KILL_SWITCH_KEYS, KILL_SWITCH_MAX_AGE_MS, killSwitchesStale, M14_KILL_SWITCH_KEYS, parseKillSwitchList, parseRemoteConfig, withFreshKillSwitches,
} from '../src';

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
    expect(r.value.flags).toEqual({ introVariant: 'four', lockScreenNamesDefault: true, familyTeaser: 'coming_soon' });
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

  it('[DECISION-16] the family teaser flag can only pick a reviewed variant, and no key turns server features on', () => {
    const quiet = parseRemoteConfig({ ...base, flags: { familyTeaser: 'quiet' } });
    expect(quiet.ok && quiet.value.flags.familyTeaser).toBe('quiet');
    const bad = parseRemoteConfig({ ...base, flags: { familyTeaser: 'invite_now' } });
    expect(bad.ok && bad.value.flags.familyTeaser).toBe('coming_soon');
    // Sign-in, sync and sharing are a build-time switch (apps/mobile/src/lib/capabilities.ts):
    // a served document that tries to turn them on is ignored key by key.
    const sneaky = parseRemoteConfig({ ...base, serverFeatures: true, flags: { serverFeatures: true, signIn: true, coParent: true }, capabilities: { sync: true } });
    expect(sneaky.ok).toBe(true);
    if (!sneaky.ok) return;
    expect(JSON.stringify(sneaky.value)).not.toMatch(/serverFeatures|signIn|coParent|capabilities/);
  });

  it('rejects a document without its identity fields', () => {
    expect(parseRemoteConfig({ ...base, schemaVersion: 2 }).ok).toBe(false);
    expect(parseRemoteConfig({ ...base, version: -1 }).ok).toBe(false);
    expect(parseRemoteConfig({ ...base, generatedAt: 'yesterday' }).ok).toBe(false);
  });
});

describe('effectiveFreeLetters', () => {
  it('[D-082] remote config can raise the free letters but never lower them below what App Review saw', () => {
    expect(BUNDLED_FREE_LETTERS).toBe(2);
    expect(effectiveFreeLetters({ freeLettersAllowance: 0 })).toBe(2);
    expect(effectiveFreeLetters({ freeLettersAllowance: 1 })).toBe(2);
    expect(effectiveFreeLetters({ freeLettersAllowance: 2 })).toBe(2);
    expect(effectiveFreeLetters({ freeLettersAllowance: 5 })).toBe(5);
    expect(effectiveFreeLetters({ freeLettersAllowance: 1000 })).toBe(100);
  });
  it('a bad value falls back to 2 without rejecting the document', () => {
    const r = parseRemoteConfig({ ...base, freeLettersAllowance: 'lots' });
    expect(r.ok && r.value.freeLettersAllowance).toBe(2);
    const missing = parseRemoteConfig({ ...base, freeLettersAllowance: undefined });
    expect(missing.ok && missing.value.freeLettersAllowance).toBe(2);
  });
});

describe('effectiveFreeSessions (deprecated: Read together has no limit)', () => {
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

describe('[WP-F19-16] kill switches for the M14 features', () => {
  it('[F19-REQ-011] the schema has backupUploads, escrow and statusReport, off by default', () => {
    expect(M14_KILL_SWITCH_KEYS).toEqual(['backupUploads', 'escrow', 'statusReport']);
    for (const k of M14_KILL_SWITCH_KEYS) {
      expect(KILL_SWITCH_KEYS).toContain(k);
      expect(DEFAULT_REMOTE_CONFIG.killSwitches[k]).toBe(false);
    }
  });

  it('an older signed config without them parses with them off; a newer one can set each', () => {
    const old = parseRemoteConfig({ ...base, killSwitches: { sync: false, invites: true } });
    expect(old.ok && old.value.killSwitches).toEqual({ ...DEFAULT_REMOTE_CONFIG.killSwitches, invites: true });
    for (const k of M14_KILL_SWITCH_KEYS) {
      const r = parseRemoteConfig({ ...base, killSwitches: { [k]: true } });
      expect(r.ok && isKilled(r.value, k)).toBe(true);
    }
  });

  it('[F19-REQ-009] the kill-switch vocabulary is closed and matches the F19 6.5 registry', () => {
    expect([...KILL_SWITCH_KEYS].sort()).toEqual(['backupUploads', 'escrow', 'invites', 'packDownloads', 'photos', 'serverContent', 'statusReport', 'sync']);
    expect(Object.keys(DEFAULT_REMOTE_CONFIG.killSwitches).sort()).toEqual([...KILL_SWITCH_KEYS].sort());
  });

  it('server side: KILL_SWITCHES secret parses to known names only', () => {
    expect([...parseKillSwitchList(' invites, statusReport ,recording,,')]).toEqual(['invites', 'statusReport']);
    expect(parseKillSwitchList(undefined).size).toBe(0);
  });
});

describe('[F19-REQ-008] a stale config cannot clear a kill switch', () => {
  const lastGood = { killSwitches: { ...DEFAULT_REMOTE_CONFIG.killSwitches, invites: true } };
  const next = { ...DEFAULT_REMOTE_CONFIG, version: 10, generatedAt: '2026-10-01T00:00:00.000Z', freeLettersAllowance: 5 };

  it('is stale only when generatedAt is more than 7 days before the server Date', () => {
    expect(KILL_SWITCH_MAX_AGE_MS).toBe(7 * 24 * 3600_000);
    expect(killSwitchesStale('2026-10-01T00:00:00.000Z', 'Thu, 08 Oct 2026 00:00:00 GMT')).toBe(false);
    expect(killSwitchesStale('2026-10-01T00:00:00.000Z', 'Thu, 08 Oct 2026 00:00:01 GMT')).toBe(true);
    expect(killSwitchesStale('2026-10-01T00:00:00.000Z', null)).toBe(false);
    expect(killSwitchesStale('2026-10-01T00:00:00.000Z', 'not a date')).toBe(false);
  });

  it('keeps a set switch from being cleared by a stale copy and applies every other key', () => {
    const used = withFreshKillSwitches(next, lastGood, 'Fri, 16 Oct 2026 00:00:00 GMT');
    expect(used.killSwitches.invites).toBe(true);
    expect(used.freeLettersAllowance).toBe(5);
    const fresh = withFreshKillSwitches(next, lastGood, 'Fri, 02 Oct 2026 00:00:00 GMT');
    expect(fresh.killSwitches.invites).toBe(false);
  });

  it('a stale but newer copy may still set a switch (a new install never misses a switch left on)', () => {
    const killed = { ...next, killSwitches: { ...next.killSwitches, statusReport: true } };
    const used = withFreshKillSwitches(killed, DEFAULT_REMOTE_CONFIG, 'Fri, 16 Oct 2026 00:00:00 GMT');
    expect(used.killSwitches.statusReport).toBe(true);
    expect(used.killSwitches.invites).toBe(false);
  });
});
