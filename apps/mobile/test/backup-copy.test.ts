/// <reference types="node" />
/**
 * Backup copy says only what the system does (D-102, M16; F08 6.7;
 * F08-REQ-014, F08-REQ-026). The general content rules (dashes, quotes, fear,
 * AI claims) run on these strings in packages/content's rules test, because
 * `features.backup` is registered there; this file holds the backup-specific
 * claims. If it fails, fix the copy, not the test.
 */
import { describe, expect, it } from 'vitest';
import { backupCopy, features } from '@scribe/content';

const lines = Object.entries(backupCopy).map(([k, v]) => ({ k, v: v as string }));
const offenders = (re: RegExp) => lines.filter((l) => re.test(l.v)).map((l) => `${l.k}: ${l.v}`);

describe('[F08-REQ-014] backup copy claims only what is provable', () => {
  it('is registered with the feature copy, so the content rules check it', () => {
    expect(features.backup).toBe(backupCopy);
  });

  it('the turn-on sheet says encrypted, a recovery key, our recovery service that logs and emails, never listened to, sold or used to train', () => {
    const b = backupCopy.sheetBody;
    expect(b).toMatch(/encrypted on this phone before they leave it/);
    expect(b).toMatch(/We keep a recovery key/);
    expect(b).toMatch(/only through our recovery service, which logs every use and emails you each time/);
    expect(b).toMatch(/never listen to your recordings, sell them or use them to train models/);
  });

  it('never claims what escrow makes untrue (D-102)', () => {
    expect(offenders(/only you can (play|hear|open)|only your family|end[- ]to[- ]end|nobody (else )?can|no one (else )?can|we can'?t (open|hear|listen)/i)).toEqual([]);
  });

  it('never an unscoped "every use is logged" or "every access is logged" (R8 R2A-01)', () => {
    expect(offenders(/every (use|access) is logged/i)).toEqual([]);
  });

  it('[F08-REQ-026] never promises that family members can hear recordings', () => {
    expect(offenders(/(family|co-?parent|partner)[^.]*\bcan hear\b/i)).toEqual([]);
    expect(backupCopy.sheetNotIncluded).toMatch(/can't hear your recordings yet/);
  });

  it('no loss words, no urgency, no counting of what is left (VOICE.md)', () => {
    expect(offenders(/\b(lost|lose|only copy|forever|hurry|before it'?s|don'?t risk|at risk|\d+ (of|left|remaining))\b/i)).toEqual([]);
    expect(offenders(/\{count\}|\{n\}|\{left\}/)).toEqual([]);
  });
});
