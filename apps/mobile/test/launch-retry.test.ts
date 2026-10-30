/// <reference types="node" />
/**
 * Launch recovery, Try again and the lines the screen says (P6c critics' pass, 30 Oct 2026, S1 and S2).
 *
 * S1: when the open failed and Try again failed too, the hook set the status to 'recovery' again, which is the status it
 * already had, so React drew nothing and the person saw no answer. The screen now keeps a view of its own (RetryView);
 * these tests pin its pure steps. S2: the launch body no longer says the letters are safe (the claims inventory marks that
 * unverified); it says what Export does, and the guards below pin the parts of that which the code has to keep true.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { en } from '@scribe/content';
import { describe, expect, it } from 'vitest';
import { attemptOpen, RETRY_BEAT_MS, RETRY_START, retryLineTaken, retryResult, retryTapped, type LaunchStatus, type RetryView } from '../src/lib/resilience/launch.logic';

const SRC = join(__dirname, '..', 'src');
const read = (rel: string) => readFileSync(join(SRC, rel), 'utf8');
const code = (t: string) => t.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');

/** One tap, as the screen does it: busy first, then what the open found. */
function tap(view: RetryView, found: LaunchStatus): { busy: RetryView; after: RetryView } {
  const busy = retryTapped(view);
  return { busy, after: retryResult(busy, found) };
}

describe('[S51] Try again is answered every time (S1)', () => {
  it('the root cause: a repeat failure is the same status, so the status alone can never say a tap was heard', () => {
    const fails = () => attemptOpen(() => { throw new Error('x'); });
    expect(fails()).toBe('recovery');
    expect(Object.is(fails(), fails())).toBe(true);
  });

  it('the first tap that fails and the second tap that fails are different states, with different keys', () => {
    const first = tap(RETRY_START, 'recovery').after;
    const second = tap(first, 'recovery').after;
    expect(first).toMatchObject({ trying: false, stillClosed: true });
    expect(second).toMatchObject({ trying: false, stillClosed: true });
    expect(second).not.toEqual(first);
    expect(second.round).not.toBe(first.round);
    const third = tap(second, 'recovery').after;
    expect(new Set([first.round, second.round, third.round]).size).toBe(3);
  });

  it('each tap is visible at once: busy, with the last answer gone, before the open runs', () => {
    const first = tap(RETRY_START, 'recovery').after;
    const { busy } = tap(first, 'recovery');
    expect(busy).toEqual({ trying: true, stillClosed: false, round: first.round });
    expect(busy).not.toEqual(first);
    // So the line is new on every tap: it goes, then comes back under a new key.
    expect(retryResult(busy, 'recovery').stillClosed).toBe(true);
  });

  it('a success still opens the book: no line, not busy, and the status the hook sets is ok', () => {
    const failed = tap(tap(RETRY_START, 'recovery').after, 'recovery').after;
    const ok = tap(failed, 'ok').after;
    expect(ok).toMatchObject({ trying: false, stillClosed: false });
    expect(attemptOpen(() => ({ ok: true, newer: false, error: null }))).toBe('ok');
  });

  it('the export taking the line does not forget the round, so the next failure is still a new one', () => {
    const failed = tap(RETRY_START, 'recovery').after;
    const taken = retryLineTaken(failed);
    expect(taken).toMatchObject({ stillClosed: false, round: failed.round });
    expect(tap(taken, 'recovery').after.round).toBeGreaterThan(failed.round);
  });

  it('shows no count: the line has no digits, and the round only ever keys the line', () => {
    expect(en.errors.launch.stillClosed).not.toMatch(/\d|\btimes\b|\battempts?\b|\btries\b|again and again/i);
    expect(en.errors.launch.tryingAgainButton).not.toMatch(/\d/);
    const src = code(read('components/resilience/launch-recovery.tsx'));
    expect([...src.matchAll(/\bretry\.round\b/g)]).toHaveLength(1);
    expect(src).toMatch(/noteKey=\{retry\.round\}/);
  });

  it('the beat is short enough to feel like an answer and long enough to read', () => {
    expect(RETRY_BEAT_MS).toBeGreaterThanOrEqual(300);
    expect(RETRY_BEAT_MS).toBeLessThanOrEqual(800);
  });

  it('wiring: the hook hands the result back, _layout is untouched, and the screen shows the busy words and the line', () => {
    const hook = code(read('lib/resilience/use-launch.ts'));
    expect(hook).toMatch(/retry: \(\) => LaunchStatus/);
    expect(hook).toMatch(/setStatus\(found\);\s*return found;/);
    expect(code(read('app/_layout.tsx'))).toMatch(/<LaunchRecovery onTryAgain=\{launch\.retry\} \/>/);
    const screen = code(read('components/resilience/launch-recovery.tsx'));
    expect(screen).toMatch(/label: retry\.trying \? e\.tryingAgainButton : e\.tryAgainButton, busy: retry\.trying/);
    expect(screen).toMatch(/retry\.stillClosed \? e\.stillClosed/);
    expect(screen).toMatch(/setRetry\(retryTapped\);\s*await beat\(RETRY_BEAT_MS\);/);
    // The open runs only if the screen is still there, and a success leaves it to the app.
    expect(screen).toMatch(/if \(!live\.current\) return;\s*const status = onTryAgain\(\);/);
  });

  it('a note with the same words but a new key is announced again, and a new line to VoiceOver', () => {
    const src = code(read('components/resilience/plain-screen.tsx'));
    expect(src).toMatch(/\}, \[note, noteKey\]\);/);
    expect(src).toMatch(/<Text key=\{noteKey\} accessibilityLiveRegion="polite"/);
  });
});

describe('[S51] the launch lines say only what the code can back (S2)', () => {
  const l = en.errors.launch;

  it('the body says what Export does and does not say the letters are safe; S50 keeps its own line', () => {
    expect(l.body).toBe('Export saves a copy of the recordings and book files it can read, exactly as they are.');
    // On screen. (The README inside the ZIP says "somewhere safe" about where to keep the file, not about the letters.)
    const { readme: _readme, ...onScreen } = l;
    expect(JSON.stringify(onScreen)).not.toMatch(/\bsafe\b/i);
    expect(en.errors.crash.body).toBe('Your letters and recordings are safe on this phone.');
  });

  it('no line promises the book will open, a backup, or that nothing changed (review B6: no padding)', () => {
    for (const s of Object.values(l)) {
      expect(s).not.toMatch(/will open|backed up|back up|nothing (?:was|has been|is) (?:changed|deleted|removed)|nothing changed/i);
    }
    expect(l.exportFailed).toBe('That export did not work. Your files are still on this phone.');
  });

  it('the Export empty line says what Export does, with no loss, no gap and no count', () => {
    expect(l.exportNothing).toBe('Export has nothing to put in a file right now.');
    expect(l.exportNothing).not.toMatch(/\bno (?:recordings?|files?|letters?)\b|\blost\b|\bmissing\b|\bgone\b|\bempty\b|\d/i);
  });

  it('the words of the Export claim are true in the code: the originals are read, never written, moved or deleted', () => {
    const exportLogic = code(read('lib/resilience/recovery-export.logic.ts'));
    // Stored, not compressed or re-encoded: the bytes in the ZIP are the bytes on the phone.
    expect(exportLogic).toMatch(/new ZipPassThrough\(path\)/);
    expect(exportLogic).not.toMatch(/ZipDeflate|AsyncZipDeflate|Deflate|gzip/);
    const phone = code(read('lib/resilience/recovery-export.ts'));
    // The only things the export deletes are its own temporary folder and ZIP in the cache.
    const deletes = [...phone.matchAll(/(\w+)\??\.delete\(\)/g)].map((m) => m[1]);
    expect(deletes.sort()).toEqual(['dir', 'file']);
    expect(phone).toMatch(/dir = new Directory\(Paths\.cache, 'recovery-export'\)/);
    expect(phone).toMatch(/function removeQuietly\(file: File \| null\)/);
    expect(phone).toMatch(/removeQuietly\(zip\)/);
    // Opening an original for reading only.
    expect(phone).toMatch(/readFile: \(uri\) => new File\(uri\)\.bytes\(\)/);
    expect(phone).not.toMatch(/\.(move|copy|write|writeBytes)\(\s*(?!chunk)/);
  });

  it('no update step drops a table or deletes a letter, a draft, a book or a recording (the part of the launch path that writes)', () => {
    const migrations = code(read('lib/db/migrations.ts'));
    expect(migrations).not.toMatch(/\bDROP\b|\bTRUNCATE\b|\bDELETE FROM (?!settings\b)/i);
    // The only rows an update step deletes are two old settings, after their values have moved elsewhere.
    const deleted = [...migrations.matchAll(/DELETE FROM (\w+)/gi)].map((m) => m[1]);
    expect(deleted).toEqual(['settings', 'settings']);
    // Each step runs in its own transaction, with the version bump: a step that fails leaves the file as it was before that step.
    expect(migrations).toMatch(/db\.transaction\(\(\) => \{\s*m\.up\(db, ctx\);\s*db\.exec\(`PRAGMA user_version = \$\{m\.version\}`\);\s*\}\);/);
  });
});
