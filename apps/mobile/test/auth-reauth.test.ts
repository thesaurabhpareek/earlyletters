/** forceReauthEpoch (security review L3, gap G-06): pure rules. */
import { describe, expect, it } from 'vitest';
import { normaliseEpochSeconds, sessionSignedInAt, shouldForceReauth } from '../src/lib/auth/reauth.logic';

const b64url = (o: unknown) => Buffer.from(JSON.stringify(o)).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const jwt = (claims: unknown) => `${b64url({ alg: 'ES256', typ: 'JWT' })}.${b64url(claims)}.sig`;

describe('forceReauthEpoch', () => {
  it('reads the sign-in time from the amr claim, not from iat (refreshes keep amr)', () => {
    const t = jwt({ iat: 1_790_000_000, amr: [{ method: 'otp', timestamp: 1_789_000_000 }] });
    expect(sessionSignedInAt(t)).toBe(1_789_000_000);
    expect(sessionSignedInAt(jwt({ amr: [{ method: 'oauth', timestamp: 10 }, { method: 'passkey', timestamp: 20 }] }))).toBe(20);
  });

  it('returns null for a missing or unreadable token', () => {
    expect(sessionSignedInAt(null)).toBeNull();
    expect(sessionSignedInAt('not.a.jwt.token')).toBeNull();
    expect(sessionSignedInAt(jwt({ iat: 1 }))).toBeNull();
    expect(sessionSignedInAt('a.!!!.c')).toBeNull();
  });

  it('signs out a session that signed in before the epoch, once', () => {
    expect(shouldForceReauth(1_790_000_000, 1_789_000_000)).toBe(true);
    // After signing in again, the new session is newer than the epoch: left alone.
    expect(shouldForceReauth(1_790_000_000, 1_790_000_100)).toBe(false);
    expect(shouldForceReauth(1_790_000_000, 1_790_000_000)).toBe(false);
  });

  it('an epoch of 0 (the default) never signs anyone out', () => {
    expect(shouldForceReauth(0, null)).toBe(false);
    expect(shouldForceReauth(0, 5)).toBe(false);
  });

  it('an unknown sign-in time counts as before a set epoch', () => {
    expect(shouldForceReauth(1_790_000_000, null)).toBe(true);
  });

  it('reads an epoch typed in milliseconds as seconds', () => {
    expect(normaliseEpochSeconds(1_790_000_000_000)).toBe(1_790_000_000);
    expect(shouldForceReauth(1_790_000_000_000, 1_790_000_100)).toBe(false);
    expect(normaliseEpochSeconds(-3)).toBe(0);
    expect(normaliseEpochSeconds(Number.NaN)).toBe(0);
  });
});
