/// <reference types="node" />
/**
 * Launch recovery, Try again and the lines the screen says (P6c critics' pass, 30 Oct 2026, S1 and S2; fix round on #394).
 *
 * S1: when the open failed and Try again failed too, the hook set the status to 'recovery' again, which is the status it
 * already had, so React drew nothing and the person saw no answer. The screen now keeps a view of its own (RecoveryView);
 * the first describe pins its pure steps and the second the rule that the newest answer, from either button, is the line.
 * The third runs the real sequencing (the guard against a second tap, the beat, the open, the check that the screen is
 * still here, the result) with injected dependencies and fake timers, because vitest here has no React renderer and a
 * source scan cannot see a deleted guard. The fourth is the hook's decision, and the last of the S1 tests is a source scan
 * that the component and the hook are wired to those functions. S2: the launch body no longer says the letters are safe
 * (the claims inventory marks that unverified); it says what Export does, and the guards at the end pin the parts of that
 * which the code has to keep true.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { en } from '@scribe/content';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  attemptOpen,
  createRecoveryActions,
  exportResult,
  exportTapped,
  openForLaunch,
  RECOVERY_START,
  RETRY_BEAT_MS,
  retryResult,
  retryTapped,
  type ExportOutcome,
  type LaunchStatus,
  type RecoveryDeps,
  type RecoveryLine,
  type RecoveryView,
} from '../src/lib/resilience/launch.logic';

const SRC = join(__dirname, '..', 'src');
const read = (rel: string) => readFileSync(join(SRC, rel), 'utf8');
const code = (t: string) => t.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');

/** One tap, as the screen does it: busy first, then what the open found. */
function tap(view: RecoveryView, found: LaunchStatus): { busy: RecoveryView; after: RecoveryView } {
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
    const first = tap(RECOVERY_START, 'recovery').after;
    const second = tap(first, 'recovery').after;
    expect(first).toMatchObject({ trying: false, line: 'stillClosed' });
    expect(second).toMatchObject({ trying: false, line: 'stillClosed' });
    expect(second).not.toEqual(first);
    expect(second.round).not.toBe(first.round);
    const third = tap(second, 'recovery').after;
    expect(new Set([first.round, second.round, third.round]).size).toBe(3);
  });

  it('each tap is visible at once: busy, with the last answer gone, before the open runs', () => {
    const first = tap(RECOVERY_START, 'recovery').after;
    const { busy } = tap(first, 'recovery');
    expect(busy).toEqual({ trying: true, exporting: false, line: 'none', round: first.round });
    expect(busy).not.toEqual(first);
    // So the line is new on every tap: it goes, then comes back under a new key.
    expect(retryResult(busy, 'recovery').line).toBe('stillClosed');
  });

  it('a success leaves no line and no busy button, whatever came before', () => {
    const failed = tap(tap(RECOVERY_START, 'recovery').after, 'recovery').after;
    expect(tap(failed, 'ok').after).toMatchObject({ trying: false, line: 'none' });
    expect(attemptOpen(() => ({ ok: true, newer: false, error: null }))).toBe('ok');
  });

  it('shows no count: the line has no digits, and the round only ever keys the line', () => {
    expect(en.errors.launch.stillClosed).not.toMatch(/\d|\btimes\b|\battempts?\b|\btries\b|again and again/i);
    expect(en.errors.launch.tryingAgainButton).not.toMatch(/\d/);
    const src = code(read('components/resilience/launch-recovery.tsx'));
    expect([...src.matchAll(/\bview\.round\b/g)]).toHaveLength(1);
    expect(src).toMatch(/noteKey=\{view\.round\}/);
  });

  it('the beat is short enough to feel like an answer and long enough to read', () => {
    expect(RETRY_BEAT_MS).toBeGreaterThanOrEqual(300);
    expect(RETRY_BEAT_MS).toBeLessThanOrEqual(800);
  });

  it('a note with the same words but a new key is announced again, and a new line to VoiceOver', () => {
    const src = code(read('components/resilience/plain-screen.tsx'));
    expect(src).toMatch(/\}, \[note, noteKey\]\);/);
    expect(src).toMatch(/<Text key=\{noteKey\} accessibilityLiveRegion="polite"/);
  });
});

describe('[S51] the newest answer is the line, whichever button gave it (fix round, lens A)', () => {
  type Event = 'tryTap' | 'tryFails' | 'tryWorks' | 'exportTap' | 'exportNothing' | 'exportFailed' | 'exportShared';
  const EVENTS: Event[] = ['tryTap', 'tryFails', 'tryWorks', 'exportTap', 'exportNothing', 'exportFailed', 'exportShared'];
  const step = (view: RecoveryView, event: Event): RecoveryView => {
    switch (event) {
      case 'tryTap': return retryTapped(view);
      case 'tryFails': return retryResult(view, 'recovery');
      case 'tryWorks': return retryResult(view, 'ok');
      case 'exportTap': return exportTapped(view);
      case 'exportNothing': return exportResult(view, 'nothing');
      case 'exportFailed': return exportResult(view, 'failed');
      case 'exportShared': return exportResult(view, 'shared');
    }
  };
  /** What the line must be after this event, whatever came before it. */
  const LINE_AFTER: Record<Event, RecoveryLine> = {
    tryTap: 'none',
    tryFails: 'stillClosed',
    tryWorks: 'none',
    exportTap: 'none',
    exportNothing: 'exportNothing',
    exportFailed: 'exportFailed',
    exportShared: 'none',
  };

  it('the export finishing replaces an "it did not open" that arrived while it worked', () => {
    let view = exportTapped(RECOVERY_START);
    view = retryResult(retryTapped(view), 'recovery'); // Try again, tapped and answered while Export reads
    expect(view).toMatchObject({ line: 'stillClosed', exporting: true });
    expect(exportResult(view, 'failed').line).toBe('exportFailed');
    expect(exportResult(view, 'nothing').line).toBe('exportNothing');
    expect(exportResult(view, 'shared').line).toBe('none');
    expect(exportResult(view, 'failed').exporting).toBe(false);
  });

  it('the other way round: Try again answering after the export has said its result puts its own line in front', () => {
    let view = retryTapped(RECOVERY_START);
    view = exportResult(exportTapped(view), 'failed'); // Export, tapped and answered during the beat
    expect(view).toMatchObject({ line: 'exportFailed', trying: true });
    expect(retryResult(view, 'recovery')).toMatchObject({ line: 'stillClosed', trying: false });
    expect(retryResult(view, 'ok').line).toBe('none');
  });

  it('the export tap does not forget the round, so the next failed open is still a new one', () => {
    const failed = tap(RECOVERY_START, 'recovery').after;
    const taken = exportTapped(failed);
    expect(taken).toMatchObject({ line: 'none', round: failed.round });
    expect(tap(exportResult(taken, 'shared'), 'recovery').after.round).toBeGreaterThan(failed.round);
  });

  it('every order of up to five events: the line depends on the last event only, and a busy button stays busy until its own answer', () => {
    let checked = 0;
    const walk = (view: RecoveryView, depth: number, last: Event | null, trace: Event[]) => {
      if (last) {
        expect(view.line, trace.join(' > ')).toBe(LINE_AFTER[last]);
        checked += 1;
      }
      if (depth === 0) return;
      for (const event of EVENTS) {
        const next = step(view, event);
        // Only its own answer ends a button's busy state.
        if (event !== 'tryFails' && event !== 'tryWorks') expect(next.trying, trace.concat(event).join(' > ')).toBe(view.trying || event === 'tryTap');
        if (event !== 'exportNothing' && event !== 'exportFailed' && event !== 'exportShared') expect(next.exporting, trace.concat(event).join(' > ')).toBe(view.exporting || event === 'exportTap');
        walk(next, depth - 1, event, trace.concat(event));
      }
    };
    walk(RECOVERY_START, 5, null, []);
    expect(checked).toBe(EVENTS.length + EVENTS.length ** 2 + EVENTS.length ** 3 + EVENTS.length ** 4 + EVENTS.length ** 5);
  });

  it('the round only ever goes up, and only a failed open raises it', () => {
    const walk = (view: RecoveryView, depth: number) => {
      if (depth === 0) return;
      for (const event of EVENTS) {
        const next = step(view, event);
        expect(next.round).toBe(view.round + (event === 'tryFails' ? 1 : 0));
        walk(next, depth - 1);
      }
    };
    walk(RECOVERY_START, 4);
  });
});

describe('[S51] the taps, in order: guard, beat, open, still here, result (fix round, lens A)', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  /** The screen's side, as a test can hold it: the views the screen was given, in order, and what each dependency was asked. */
  function rig(over: { found?: () => LaunchStatus; outcome?: () => Promise<ExportOutcome> } = {}) {
    const state = { view: RECOVERY_START as RecoveryView, views: [RECOVERY_START] as RecoveryView[], live: true };
    const calls = { waits: [] as number[], opens: 0, exports: 0 };
    const deps: RecoveryDeps = {
      wait: (ms) => {
        calls.waits.push(ms);
        return new Promise<void>((done) => setTimeout(done, ms));
      },
      open: () => {
        calls.opens += 1;
        return over.found ? over.found() : 'recovery';
      },
      runExport: () => {
        calls.exports += 1;
        return over.outcome ? over.outcome() : Promise.resolve<ExportOutcome>('shared');
      },
      isLive: () => state.live,
      update: (stepFn) => {
        state.view = stepFn(state.view);
        state.views.push(state.view);
      },
    };
    return { actions: createRecoveryActions(deps), state, calls };
  }

  it('a tap is busy at once, the open waits for the whole beat, then the answer shows', async () => {
    const { actions, state, calls } = rig();
    void actions.tryAgain();
    expect(state.view).toMatchObject({ trying: true, line: 'none' }); // before any time has passed
    expect(calls.opens).toBe(0);
    await vi.advanceTimersByTimeAsync(RETRY_BEAT_MS - 1);
    expect(calls.opens).toBe(0);
    expect(state.view.trying).toBe(true);
    await vi.advanceTimersByTimeAsync(1);
    expect(calls.opens).toBe(1);
    expect(state.view).toMatchObject({ trying: false, line: 'stillClosed', round: 1 });
    expect(calls.waits).toEqual([RETRY_BEAT_MS]);
  });

  it('a second tap while the first is working is ignored: one beat, one open, one answer', async () => {
    const { actions, state, calls } = rig();
    void actions.tryAgain();
    void actions.tryAgain(); // inside the same frame, before the busy state is drawn
    await vi.advanceTimersByTimeAsync(RETRY_BEAT_MS / 2);
    void actions.tryAgain(); // and again during the beat
    await vi.advanceTimersByTimeAsync(RETRY_BEAT_MS);
    expect(calls.opens).toBe(1);
    expect(calls.waits).toEqual([RETRY_BEAT_MS]);
    expect(state.views).toEqual([RECOVERY_START, { ...RECOVERY_START, trying: true }, { trying: false, exporting: false, line: 'stillClosed', round: 1 }]);
  });

  it('after the answer a new tap is heard again, and its failure is a new round', async () => {
    const { actions, state, calls } = rig();
    for (let i = 1; i <= 3; i += 1) {
      void actions.tryAgain();
      await vi.advanceTimersByTimeAsync(RETRY_BEAT_MS);
      expect(calls.opens).toBe(i);
      expect(state.view).toMatchObject({ trying: false, line: 'stillClosed', round: i });
    }
  });

  it('a success calls the open once and ends with no busy button and no failure line', async () => {
    const { actions, state, calls } = rig({ found: () => 'ok' });
    void actions.tryAgain();
    await vi.advanceTimersByTimeAsync(RETRY_BEAT_MS);
    expect(calls.opens).toBe(1);
    expect(state.view).toEqual({ trying: false, exporting: false, line: 'none', round: 0 });
  });

  it('a success after failures clears the earlier line', async () => {
    let found: LaunchStatus = 'recovery';
    const { actions, state } = rig({ found: () => found });
    void actions.tryAgain();
    await vi.advanceTimersByTimeAsync(RETRY_BEAT_MS);
    expect(state.view.line).toBe('stillClosed');
    found = 'ok';
    void actions.tryAgain();
    expect(state.view.line).toBe('none'); // the old answer goes the moment the button is tapped
    await vi.advanceTimersByTimeAsync(RETRY_BEAT_MS);
    expect(state.view).toMatchObject({ trying: false, line: 'none' });
  });

  it('a screen that has gone during the beat opens nothing and draws nothing more', async () => {
    const { actions, state, calls } = rig();
    void actions.tryAgain();
    await vi.advanceTimersByTimeAsync(RETRY_BEAT_MS / 2);
    state.live = false;
    const drawn = state.views.length;
    await vi.advanceTimersByTimeAsync(RETRY_BEAT_MS);
    expect(calls.opens).toBe(0);
    expect(state.views).toHaveLength(drawn);
  });

  it('a screen that has gone while the open ran draws no answer', async () => {
    const gone = { now: () => {} };
    const { actions, state, calls } = rig({
      found: () => {
        gone.now(); // 'ok': the app took over and this screen was removed
        return 'ok';
      },
    });
    gone.now = () => {
      state.live = false;
    };
    void actions.tryAgain();
    const drawn = state.views.length;
    await vi.advanceTimersByTimeAsync(RETRY_BEAT_MS);
    expect(calls.opens).toBe(1);
    expect(state.views).toHaveLength(drawn);
  });

  it('an open that throws is a failed open: the line shows, the button is not left busy, the next tap works', async () => {
    let boom = true;
    const { actions, state, calls } = rig({
      found: () => {
        if (boom) throw new Error('anything');
        return 'ok';
      },
    });
    void actions.tryAgain();
    await vi.advanceTimersByTimeAsync(RETRY_BEAT_MS);
    expect(state.view).toMatchObject({ trying: false, line: 'stillClosed', round: 1 });
    boom = false;
    void actions.tryAgain();
    await vi.advanceTimersByTimeAsync(RETRY_BEAT_MS);
    expect(calls.opens).toBe(2);
    expect(state.view).toMatchObject({ trying: false, line: 'none' });
  });

  it('Export: busy at once, a second tap is ignored, then the result is the line', async () => {
    const done: { release: (o: ExportOutcome) => void } = { release: () => {} };
    const { actions, state, calls } = rig({ outcome: () => new Promise<ExportOutcome>((resolve) => { done.release = resolve; }) });
    void actions.exportReadable();
    void actions.exportReadable();
    expect(state.view).toMatchObject({ exporting: true, line: 'none' });
    expect(calls.exports).toBe(1);
    done.release('nothing');
    await vi.advanceTimersByTimeAsync(0);
    expect(state.view).toMatchObject({ exporting: false, line: 'exportNothing' });
    void actions.exportReadable(); // heard again afterwards
    expect(calls.exports).toBe(2);
  });

  it('Export that throws is a failed export and the button is not left busy; a screen that has gone draws nothing', async () => {
    const first = rig({ outcome: () => Promise.reject(new Error('anything')) });
    void first.actions.exportReadable();
    await vi.advanceTimersByTimeAsync(0);
    expect(first.state.view).toMatchObject({ exporting: false, line: 'exportFailed' });

    const gone = rig({ outcome: () => Promise.resolve<ExportOutcome>('failed') });
    void gone.actions.exportReadable();
    gone.state.live = false;
    const drawn = gone.state.views.length;
    await vi.advanceTimersByTimeAsync(0);
    expect(gone.state.views).toHaveLength(drawn);
  });

  it('Export is working, Try again is tapped and fails, then the export fails: the export is what shows (lens A)', async () => {
    const done: { release: (o: ExportOutcome) => void } = { release: () => {} };
    const { actions, state } = rig({ outcome: () => new Promise<ExportOutcome>((resolve) => { done.release = resolve; }) });
    void actions.exportReadable();
    void actions.tryAgain();
    expect(state.view).toMatchObject({ exporting: true, trying: true });
    await vi.advanceTimersByTimeAsync(RETRY_BEAT_MS);
    expect(state.view).toMatchObject({ exporting: true, trying: false, line: 'stillClosed' }); // a recordings ZIP takes seconds
    done.release('failed');
    await vi.advanceTimersByTimeAsync(0);
    expect(state.view).toMatchObject({ exporting: false, trying: false, line: 'exportFailed' });
  });

  it('the other order: Try again is in its beat, the export ends with a note, then the open fails: the open is what shows', async () => {
    const { actions, state } = rig({ outcome: () => Promise.resolve<ExportOutcome>('nothing') });
    void actions.tryAgain();
    void actions.exportReadable();
    await vi.advanceTimersByTimeAsync(0);
    expect(state.view).toMatchObject({ trying: true, exporting: false, line: 'exportNothing' });
    await vi.advanceTimersByTimeAsync(RETRY_BEAT_MS);
    expect(state.view).toMatchObject({ trying: false, exporting: false, line: 'stillClosed' });
  });

  it('the two buttons do not hold each other: a working Export does not stop Try again, and the reverse', async () => {
    const { actions, calls } = rig({ outcome: () => new Promise<ExportOutcome>(() => {}) });
    void actions.exportReadable();
    void actions.tryAgain();
    await vi.advanceTimersByTimeAsync(RETRY_BEAT_MS);
    expect(calls.opens).toBe(1);
    void actions.tryAgain();
    void actions.exportReadable(); // ignored: its own earlier run is still working
    expect(calls.exports).toBe(1);
  });
});

describe('[S51] what the hook sets after an open (fix round, lens A)', () => {
  const opens = { ok: () => ({ ok: true, newer: false, error: null }), newer: () => ({ ok: false, newer: true, error: null }), failed: () => ({ ok: false, newer: false, error: new Error('x') }) };

  it('success sets the status that opens the app, and hands the answer back', () => {
    const set = vi.fn();
    expect(openForLaunch(opens.ok, set)).toBe('ok');
    expect(set).toHaveBeenCalledTimes(1);
    expect(set).toHaveBeenCalledWith('ok');
  });

  it('a file from a newer build keeps running the app, as before (MOB-09 is not here yet)', () => {
    const set = vi.fn();
    expect(openForLaunch(opens.newer, set)).toBe('ok');
    expect(set).toHaveBeenCalledWith('ok');
  });

  it('a failed open, and an open that throws, set the recovery status; nothing is thrown', () => {
    const set = vi.fn();
    expect(openForLaunch(opens.failed, set)).toBe('recovery');
    expect(openForLaunch(() => { throw new Error('anything'); }, set)).toBe('recovery');
    expect(set.mock.calls).toEqual([['recovery'], ['recovery']]);
  });

  it('a failed open after a success would still say so, and a success after failures opens the app', () => {
    let status: LaunchStatus | 'pending' = 'pending';
    const set = (next: LaunchStatus) => { status = next; };
    openForLaunch(opens.failed, set);
    expect(status).toBe('recovery');
    openForLaunch(opens.failed, set);
    expect(status).toBe('recovery');
    openForLaunch(opens.ok, set);
    expect(status).toBe('ok');
  });
});

describe('[S51] wiring: the screen and the hook use the functions above (a source scan; the runs above are the proof)', () => {
  const hook = code(read('lib/resilience/use-launch.ts'));
  const screen = code(read('components/resilience/launch-recovery.tsx'));

  it('the hook gives the status setter itself to openForLaunch, and returns that open as retry; _layout is untouched', () => {
    expect(hook).toMatch(/retry: \(\) => LaunchStatus/);
    expect(hook).toMatch(/openForLaunch\(\(\) => \{[^}]*return openStore\(\);\s*\}, setStatus\)/);
    expect(hook).toMatch(/return \{ status, retry: open \};/);
    expect(hook).not.toMatch(/setStatus\(found|attemptOpen/);
    expect(code(read('app/_layout.tsx'))).toMatch(/<LaunchRecovery onTryAgain=\{launch\.retry\} \/>/);
  });

  it('the screen builds the actions once, from the real beat, the latest open, the export, the live check and the view setter', () => {
    expect(screen).toMatch(/const \[actions\] = useState\(\(\) =>\s*createRecoveryActions\(\{/);
    expect(screen).toMatch(/wait: \(ms\) => new Promise<void>\(\(done\) => setTimeout\(done, ms\)\),/);
    expect(screen).toMatch(/open: \(\) => open\.current\(\),/);
    expect(screen).toMatch(/open\.current = onTryAgain;/);
    expect(screen).toMatch(/runExport: runRecoveryExport,/);
    expect(screen).toMatch(/isLive: \(\) => live\.current,/);
    expect(screen).toMatch(/update: setView,/);
    expect(screen).toMatch(/\(\) => \(\) => \{\s*live\.current = false;\s*\},\s*\[\]/);
  });

  it('the buttons show the view and hand the tap to the actions; the line is the view\'s one line, every kind of it worded', () => {
    expect(screen).toMatch(/label: view\.trying \? e\.tryingAgainButton : e\.tryAgainButton, busy: view\.trying, onPress: \(\) => void actions\.tryAgain\(\)/);
    expect(screen).toMatch(/label: view\.exporting \? e\.exportingTitle : e\.exportButton, kind: 'quiet', busy: view\.exporting, onPress: \(\) => void actions\.exportReadable\(\)/);
    expect(screen).toMatch(/const words: Record<RecoveryLine, string \| undefined> = \{ none: undefined, stillClosed: e\.stillClosed, exportNothing: e\.exportNothing, exportFailed: e\.exportFailed \};/);
    expect(screen).toMatch(/note=\{words\[view\.line\]\}/);
  });

  it('the screen holds no state of its own about either button, so there is no second answer to go stale', () => {
    expect([...screen.matchAll(/\buseState\(/g)]).toHaveLength(2); // the view, and the actions made once
    expect(screen).not.toMatch(/setNote|setBusy|setRetry|tapped\.current/);
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

  it('no update step drops a table or deletes a letter, a draft, a book or a recording (a cheap scan of the source text)', () => {
    // What the update steps do, read from db/migrations.ts: v1, v4 and v6 only create tables and columns. Five steps write
    // data: v2 (the old single-child family becomes the first book, and its `family` setting is deleted), v3 (the 18+ Yes moves
    // to `ageGate.passed`; the old `ageAttested` and `ageAttestedAt` settings are deleted, and the time is dropped, not moved),
    // v5 (blanks the template sentence of quiet-day marks and queues the change), v7 (moves per-person book choices) and v8
    // (queues waiting letters for upload). No step has a DROP, or a DELETE FROM any table but `settings`.
    //
    // This is the weaker guard. It reads the source text: it catches DROP, TRUNCATE and a DELETE FROM a table other than
    // `settings` (a DELETE split over lines too), and it misses an INSERT OR REPLACE over a row, an UPDATE that rewrites text,
    // and SQL put together from pieces. The stronger one is behavioural: apps/mobile/test/migrations.test.ts lines 247 to 340
    // ("every earlier schema migrates to head with row counts and content hashes unchanged") builds each earlier schema with
    // the Asha family's letters, books, drafts and recordings, migrates it to head and compares a hash of every column. It
    // seeds no legacy settings and no quiet-day sentence, so the settings changes above are covered by the scan only.
    const migrations = code(read('lib/db/migrations.ts'));
    const harmful = /\bDROP\b|\bTRUNCATE\b|\bDELETE\s+FROM\s+(?!settings\b)/i;
    expect('DELETE\n  FROM entries WHERE id = ?').toMatch(harmful); // the scan does see a DELETE split over lines
    expect('DELETE FROM settings WHERE key = ?').not.toMatch(harmful);
    expect(migrations).not.toMatch(harmful);
    const deleted = [...migrations.matchAll(/\bDELETE\s+FROM\s+(\w+)/gi)].map((m) => m[1]);
    expect(deleted).toEqual(['settings', 'settings']);
    // Each step runs in its own transaction, with the version bump: a step that fails leaves the file as it was before that step.
    expect(migrations).toMatch(/db\.transaction\(\(\) => \{\s*m\.up\(db, ctx\);\s*db\.exec\(`PRAGMA user_version = \$\{m\.version\}`\);\s*\}\);/);
  });
});
