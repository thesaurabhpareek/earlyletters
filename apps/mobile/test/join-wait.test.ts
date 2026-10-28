/// <reference types="node" />
/**
 * Critics' pass S2 on P8b: Close on the joined sheet before the book arrives no longer leaves a fresh phone at
 * "Begin the book" (components/family/join-wait.logic.ts, the hook components/family/join-wait.tsx, read by P2's
 * app/onboarding.tsx). While the book is on its way the welcome says so and hides "Begin the book"; with no dead end:
 * if it does not come within JOIN_WAIT_MS, or sync cannot bring it (not running, or unable to reach the server), the
 * welcome says it has not reached this phone yet, offers Try again while sync can run, and brings "Begin the book"
 * back. The lenses' second pass on #375: no engine reads as stalled, Try again restarts only a sync that ran, the
 * join starts the wait (over the welcome only) and leaving the welcome or signing out ends it. Fictional family Asha.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { familyCopy } from '@scribe/content';
import {
  createJoinWaitStore,
  JOIN_WAIT_MS,
  joinWaitEnds,
  joinWaitLine,
  retryRestartsWait,
  welcomeJoinView,
  type JoinWait,
} from '../src/components/family/join-wait.logic';

const code = (p: string) => readFileSync(join(__dirname, '..', 'src', p), 'utf8').replace(/\/\*[\s\S]*?\*\/|\{\/\*[\s\S]*?\*\/\}|\/\/.*$/gm, '');
const WAIT: JoinWait = { childId: 'book-asha', name: 'Asha', since: 1_000 };
/** The welcome showing, sync running, the book not here yet. */
const ON = { onWelcome: true, bookHere: false, syncOn: true } as const;
const WAITING = { line: "Asha's book is on its way to this phone.", begin: false, retry: false };
const STALLED = { line: "Asha's book has not reached this phone yet.", begin: true, retry: true };
const NONE = { line: null, begin: true, retry: false };

describe('[S2] the welcome while a joined book is on its way', () => {
  it('no wait, the book is here, or the welcome is not the step showing: the welcome as always', () => {
    expect(welcomeJoinView({ ...ON, wait: null, phase: 'idle', now: 2_000 })).toEqual(NONE);
    expect(welcomeJoinView({ ...ON, wait: WAIT, bookHere: true, phase: 'syncing', now: 2_000 })).toEqual(NONE);
    expect(welcomeJoinView({ ...ON, wait: WAIT, onWelcome: false, phase: 'syncing', now: 2_000 })).toEqual(NONE);
  });

  it('on its way: one line, and "Begin the book" hidden, so no second book is started by mistake', () => {
    for (const phase of ['idle', 'syncing', null] as const) {
      expect(welcomeJoinView({ ...ON, wait: WAIT, phase, now: WAIT.since + JOIN_WAIT_MS - 1 }), String(phase)).toEqual(WAITING);
    }
    expect(familyCopy.accept.joinedWaiting).toBe("{child}'s book is on its way to this phone.");
  });

  it('no dead end: after JOIN_WAIT_MS, or when sync cannot reach the server, Try again and "Begin the book" are back', () => {
    expect(welcomeJoinView({ ...ON, wait: WAIT, phase: 'idle', now: WAIT.since + JOIN_WAIT_MS })).toEqual(STALLED);
    for (const phase of ['offline', 'auth', 'account_mismatch', 'paused_server', 'paused_consent'] as const) {
      expect(welcomeJoinView({ ...ON, wait: WAIT, phase, now: WAIT.since + 1 }), phase).toEqual(STALLED);
    }
    expect(JOIN_WAIT_MS).toBe(30_000);
  });

  it('no sync on this phone (signed out, or sync not allowed: the status reads "idle"): never "on its way"; "Begin the book" is back and Try again, which could do nothing, is not offered', () => {
    for (const phase of ['idle', 'syncing', null] as const) {
      expect(welcomeJoinView({ ...ON, wait: WAIT, syncOn: false, phase, now: WAIT.since + 1 }), String(phase)).toEqual({ ...STALLED, retry: false });
    }
  });

  it('a name that could not be read: the same two lines about "The book"', () => {
    const unnamed = { ...WAIT, name: null };
    expect(welcomeJoinView({ ...ON, wait: unnamed, phase: 'idle', now: WAIT.since + 1 }).line).toBe('The book is on its way to this phone.');
    expect(welcomeJoinView({ ...ON, wait: unnamed, phase: 'offline', now: WAIT.since + 1 }).line).toBe('The book has not reached this phone yet.');
    expect(joinWaitLine('Asha', 'waiting')).toBe(WAITING.line);
    expect(joinWaitLine('Asha', 'notYet')).toBe(STALLED.line);
  });

  it('the wait ends when the book is here, when the welcome is no longer the step showing, and at sign-out', () => {
    expect(joinWaitEnds({ onWelcome: true, signedIn: true, bookHere: false })).toBe(false);
    expect(joinWaitEnds({ onWelcome: true, signedIn: true, bookHere: true })).toBe(true);
    expect(joinWaitEnds({ onWelcome: false, signedIn: true, bookHere: false })).toBe(true);
    expect(joinWaitEnds({ onWelcome: true, signedIn: false, bookHere: false })).toBe(true);
  });

  it('Try again starts the quiet wait over only when a sync ran (syncNow resolves null when none is running)', () => {
    expect(retryRestartsWait(null)).toBe(false);
    expect(retryRestartsWait(undefined)).toBe(false);
    expect(retryRestartsWait({ pushed: 0 })).toBe(true);
  });

  it('the store: one wait at a time, the name given later to that wait only, Try again starts it over, and it clears', () => {
    const store = createJoinWaitStore();
    let heard = 0;
    store.subscribe(() => (heard += 1));
    store.named('book-asha', 'Asha');
    expect(store.get(), 'a name never starts a wait').toBeNull();
    store.start('book-asha', null, 5);
    expect(store.get()).toEqual({ childId: 'book-asha', name: null, since: 5 });
    store.start('book-asha', 'Asha', 99);
    expect(store.get()?.since, 'the same book again keeps its time').toBe(5);
    store.named('book-other', 'Ravi');
    expect(store.get()?.name, 'another book\'s name is not this wait\'s').toBeNull();
    store.named('book-asha', 'Asha');
    expect(store.get()).toEqual({ childId: 'book-asha', name: 'Asha', since: 5 });
    store.named('book-asha', null);
    expect(store.get()?.name).toBe('Asha');
    store.restart(77);
    expect(store.get()?.since).toBe(77);
    store.clear();
    expect(store.get()).toBeNull();
    store.restart(80);
    expect(store.get(), 'Try again never starts a wait').toBeNull();
    expect(heard).toBe(4);
  });
});

describe('[S2] the screens', () => {
  it('the join starts the wait the moment it goes through, only over the welcome step, and names it once the name is read', () => {
    const sheet = code('app/invite/index.tsx');
    expect(sheet).toMatch(/const leavesWait = landing\(\) === 'welcome';\s*setBusy\('accept'\);/);
    expect(sheet).toMatch(/const childId = await acceptInvite\(auth\.client, t\);\s*const here = getChild\(childId\);\s*if \(leavesWait && !here\) joinWait\.start\(childId, null\);/);
    expect(sheet).toMatch(/const name = here\?\.name \?\? \(await bookName\(auth\.client, childId\)\.catch\(\(\) => null\)\);\s*joinWait\.named\(childId, name\);/);
    // One place starts it: the joined view no longer does.
    expect(sheet.match(/joinWait\.start\(/g)).toHaveLength(1);
  });

  it('the welcome passes which step shows and whether it is in front, and draws the line, "Begin the book" and Try again from the hook', () => {
    const first = code('app/onboarding.tsx');
    expect(first).toMatch(/const joining = useWelcomeJoinWait\(\{ onWelcome: step === 'welcome', inFront: pathname === '\/onboarding' \}\);\s*const joinLine = joining\.line;\s*const showContinue = joining\.begin;/);
    expect(first).toMatch(/\{showContinue \? \(\s*<View>\s*<Button size="lg" fullWidth disabled=\{disabled\} label=\{cta\}/);
    expect(first).toMatch(/\{joining\.retry \? <Button variant="quiet" size="sm" label=\{familyCopy\.accept\.tryAgain\} onPress=\{joining\.onRetry\}/);
    // #374's controls: the line sits between the reason line and Continue, in the one controls block.
    expect(first.match(/const controls = \(/g)).toHaveLength(1);
    expect(first).toMatch(/const controls = \(\s*<>\s*\{block \? <ReasonLine[\s\S]*?\{joinLine \? \([\s\S]*?\{showContinue \? \(/);
  });

  it('the hook: the wait ends with the book, the welcome or the account, and when first run leaves; sync on is read from the account', () => {
    const hook = code('components/family/join-wait.tsx');
    expect(hook).toMatch(/const signedIn = authUserId\(auth\) !== null;\s*const syncOn = wait \? syncAllowed\(\) : false;/);
    expect(hook).toMatch(/const ends = joinWaitEnds\(\{ onWelcome, signedIn, bookHere \}\);\s*useEffect\(\(\) => \{\s*if \(wait && ends\) joinWait\.clear\(\);\s*\}, \[wait, ends\]\);/);
    expect(hook).toMatch(/useEffect\(\(\) => \(\) => joinWait\.clear\(\), \[\]\);/);
    expect(hook).toMatch(/const readBookHere = \(\) => \(wait \? getChild\(wait\.childId\) !== null : false\);/);
    expect(hook).toMatch(/const view = welcomeJoinView\(\{ wait, onWelcome, bookHere, syncOn, phase, now \}\);/);
  });

  it('VoiceOver: the welcome speaks its line when it appears in front and when it changes (a live region is Android\'s only)', () => {
    const hook = code('components/family/join-wait.tsx');
    expect(hook).toMatch(/const spoken = inFront \? view\.line : null;\s*useEffect\(\(\) => \{\s*if \(spoken\) announce\(spoken, \{ queue: true \}\);\s*\}, \[spoken\]\);/);
  });

  it('Try again runs a sync, and starts the quiet wait over only if one ran; the timer wakes the welcome when the wait runs out', () => {
    const hook = code('components/family/join-wait.tsx');
    expect(hook).toMatch(/void syncNow\(\)\s*\.then\(\(report\) => \{\s*if \(retryRestartsWait\(report\)\) joinWait\.restart\(\);\s*\}\)/);
    expect(hook).toMatch(/const left = wait\.since \+ JOIN_WAIT_MS - Date\.now\(\);/);
    // One wake just after the wait runs out, cleared when the wait changes (Try again) or the welcome goes. J21j on the
    // web proves the wake itself; this pins its time and its cleanup, which the web cannot see.
    expect(hook).toMatch(/const id = setTimeout\(\(\) => setNow\(Date\.now\(\)\), left \+ 50\);\s*return \(\) => clearTimeout\(id\);\s*\}, \[wait\]\);/);
  });
});
