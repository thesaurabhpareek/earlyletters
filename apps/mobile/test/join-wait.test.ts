/// <reference types="node" />
/**
 * Critics' pass S2 on P8b: Close on the joined sheet before the book arrives no longer leaves a fresh phone at
 * "Begin the book" (components/family/join-wait.logic.ts, the hook components/family/join-wait.tsx, read by P2's
 * app/onboarding.tsx). While the book is on its way the welcome says so and hides "Begin the book"; with no dead end:
 * if it does not come within JOIN_WAIT_MS, or sync cannot reach the server, the welcome says it has not reached this
 * phone yet, offers Try again, and brings "Begin the book" back. Fictional family Asha only.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { familyCopy } from '@scribe/content';
import { createJoinWaitStore, JOIN_WAIT_MS, welcomeJoinView, type JoinWait } from '../src/components/family/join-wait.logic';

const code = (p: string) => readFileSync(join(__dirname, '..', 'src', p), 'utf8').replace(/\/\*[\s\S]*?\*\/|\{\/\*[\s\S]*?\*\/\}|\/\/.*$/gm, '');
const WAIT: JoinWait = { childId: 'book-asha', name: 'Asha', since: 1_000 };

describe('[S2] the welcome while a joined book is on its way', () => {
  it('no wait, or the book is here: the welcome as always ("Begin the book", no line)', () => {
    expect(welcomeJoinView({ wait: null, bookHere: false, phase: 'idle', now: 2_000 })).toEqual({ line: null, begin: true, retry: false });
    expect(welcomeJoinView({ wait: WAIT, bookHere: true, phase: 'syncing', now: 2_000 })).toEqual({ line: null, begin: true, retry: false });
  });

  it('on its way: one line, and "Begin the book" hidden, so no second book is started by mistake', () => {
    for (const phase of ['idle', 'syncing', null] as const) {
      expect(welcomeJoinView({ wait: WAIT, bookHere: false, phase, now: WAIT.since + JOIN_WAIT_MS - 1 }), String(phase)).toEqual({
        line: "Asha's book is on its way to this phone.",
        begin: false,
        retry: false,
      });
    }
    expect(familyCopy.accept.joinedWaiting).toBe("{child}'s book is on its way to this phone.");
  });

  it('no dead end: after JOIN_WAIT_MS, or when sync cannot reach the server, Try again and "Begin the book" are back', () => {
    const stalled = { line: "Asha's book has not reached this phone yet.", begin: true, retry: true };
    expect(welcomeJoinView({ wait: WAIT, bookHere: false, phase: 'idle', now: WAIT.since + JOIN_WAIT_MS })).toEqual(stalled);
    for (const phase of ['offline', 'auth', 'account_mismatch', 'paused_server', 'paused_consent'] as const) {
      expect(welcomeJoinView({ wait: WAIT, bookHere: false, phase, now: WAIT.since + 1 }), phase).toEqual(stalled);
    }
    expect(JOIN_WAIT_MS).toBe(30_000);
  });

  it('the store: one wait at a time, a name needed for the line, Try again starts the quiet wait over, and it clears', () => {
    const store = createJoinWaitStore();
    let heard = 0;
    store.subscribe(() => (heard += 1));
    store.start('book-asha', null, 5);
    expect(store.get()).toBeNull();
    store.start('book-asha', 'Asha', 5);
    expect(store.get()).toEqual({ childId: 'book-asha', name: 'Asha', since: 5 });
    store.start('book-asha', 'Asha', 99);
    expect(store.get()?.since).toBe(5);
    store.restart(77);
    expect(store.get()?.since).toBe(77);
    store.clear();
    expect(store.get()).toBeNull();
    expect(heard).toBe(3);
  });
});

describe('[S2] the screens', () => {
  it('the joined sheet starts the wait while the book is not here, and ends it once it is', () => {
    expect(code('app/invite/index.tsx')).toMatch(/const bookHere = !!book;\s*useEffect\(\(\) => \{\s*if \(bookHere\) joinWait\.clear\(\);\s*else joinWait\.start\(childId, child \|\| null\);\s*\}, \[bookHere, childId, child\]\);/);
  });

  it('the welcome draws the line, hides "Begin the book" while the book is on its way, and offers Try again when it stalls', () => {
    const first = code('app/onboarding.tsx');
    expect(first).toMatch(/const joining = useWelcomeJoinWait\(\);\s*const joinLine = step === 'welcome' \? joining\.line : null;\s*const showContinue = step !== 'welcome' \|\| joining\.begin;/);
    expect(first).toMatch(/\{showContinue \? \(\s*<View>\s*<Button size="lg" fullWidth disabled=\{disabled\} label=\{cta\}/);
    expect(first).toMatch(/\{joining\.retry \? <Button variant="quiet" size="sm" label=\{familyCopy\.accept\.tryAgain\} onPress=\{joining\.onRetry\}/);
  });

  it('Try again runs a sync and starts the quiet wait over; the book arriving ends the wait', () => {
    const hook = code('components/family/join-wait.tsx');
    expect(hook).toMatch(/const onRetry = useCallback\(\(\) => \{\s*joinWait\.restart\(\);\s*void syncNow\(\);\s*\}, \[\]\);/);
    expect(hook).toMatch(/if \(wait && bookHere\) joinWait\.clear\(\);/);
    expect(hook).toMatch(/const left = wait\.since \+ JOIN_WAIT_MS - Date\.now\(\);/);
  });
});
