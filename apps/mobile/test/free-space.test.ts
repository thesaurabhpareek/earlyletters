/// <reference types="node" />
/**
 * Room to record (EXPERIENCE_PASS_2026-10 S13, package P4): Listen checks free space before beginTake, so a full
 * phone says "This phone is full" instead of "The microphone is off". Pure (lib/capture/free-space.ts).
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { MIN_FREE_BYTES_TO_RECORD, freeBytesFrom, roomToRecord } from '../src/lib/capture/free-space';

describe('the 50 MB threshold (S13)', () => {
  it('is 50 MB', () => {
    expect(MIN_FREE_BYTES_TO_RECORD).toBe(50_000_000);
  });

  it('starts a take at or above it, and not below it', () => {
    expect(roomToRecord(50_000_000)).toBe(true);
    expect(roomToRecord(50_000_001)).toBe(true);
    expect(roomToRecord(2_000_000_000)).toBe(true);
    expect(roomToRecord(49_999_999)).toBe(false);
    expect(roomToRecord(1)).toBe(false);
  });

  it('never blocks on an unknown reading', () => {
    expect(roomToRecord(null)).toBe(true);
  });
});

describe('reading free space', () => {
  it('passes a real reading through', () => {
    expect(freeBytesFrom(() => 123_456_789)).toBe(123_456_789);
  });

  it('treats a negative or non-number reading as unknown', () => {
    for (const n of [-1, Number.NaN, Number.POSITIVE_INFINITY]) expect(freeBytesFrom(() => n), String(n)).toBeNull();
  });

  it('[review A L3] a phone that reports 0 free bytes is full, not unknown (the web preview is never asked)', () => {
    expect(freeBytesFrom(() => 0)).toBe(0);
    expect(roomToRecord(freeBytesFrom(() => 0))).toBe(false);
  });

  it('never throws: a reader that throws is unknown', () => {
    expect(
      freeBytesFrom(() => {
        throw new Error('no file system');
      }),
    ).toBeNull();
  });
});

describe('where it is used (source)', () => {
  const src = (p: string) => readFileSync(join(__dirname, '..', 'src', p), 'utf8');

  it('Listen reads Paths.availableDiskSpace through it, before beginTake, and never on web', () => {
    const listen = src('app/listen.tsx');
    expect(listen).toMatch(/freeBytesFrom\(\(\) => Paths\.availableDiskSpace\)/);
    // The reading reaches the blocker (review A L4: a `freeBytes: null` mutant survived).
    expect(listen).toMatch(/startBlocker\(\{ granted: perm\.granted, freeBytes: freeBytesNow\(\) \}\)/);
    expect(listen).toMatch(/Platform\.OS === 'web' \? null/);
    const start = listen.slice(listen.indexOf('const start = async'), listen.indexOf('const grantedNow'));
    expect(start.indexOf('startBlocker(')).toBeGreaterThan(-1);
    expect(start.indexOf('startBlocker(')).toBeLessThan(start.indexOf('beginTake('));
  });

  it('the module stays pure: no React Native or expo import, so it runs here', () => {
    expect(src('lib/capture/free-space.ts')).not.toMatch(/from '(react-native|expo-[a-z-]+)'/);
  });
});
