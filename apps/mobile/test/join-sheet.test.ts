/// <reference types="node" />
/**
 * EXPERIENCE_PASS_2026-10 S59, Joining a book (package P8b): its four acceptance boxes, on the sheet's words
 * (components/family/join-sheet.logic.ts), S04's plan (lib/family/join-flow.logic.ts) and the screens' source,
 * read as text, plus the honest failures: a typed code (build 2 invites are links only, the coordinator's ruling
 * of 28 Oct 2026) and a server that does not answer.
 *  - Before sign-in, neither the child's name nor the inviter is shown (BL-322).
 *  - Nothing joins until "Join the book"; the open book changes only on "Open the book".
 *  - The child's name first appears on the opening cover.
 *  - "Open the book" lands on the Book with the light rising once.
 * Fictional family Asha only.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { brand } from '@scribe/brand';
import { familyCopy } from '@scribe/content';
import { tokens } from '@scribe/design-tokens';
import { BEFORE_JOIN, invitedByLine, JOINED_LANDING, joinedBody, joinFailure, joinTitle, readPasted } from '../src/components/family/join-sheet.logic';
import { planLampMount } from '../src/components/ui/lamp.logic';
import { FINAL_INVITE_ERRORS, inviteErrorKind } from '../src/lib/family/invite-errors.logic';
import { joinPlan, type JoinInputs } from '../src/lib/family/join-flow.logic';

const src = (p: string) => readFileSync(join(__dirname, '..', 'src', p), 'utf8');
const code = (p: string) => src(p).replace(/\/\*[\s\S]*?\*\/|\{\/\*[\s\S]*?\*\/\}|\/\/.*$/gm, '');
const SHEET = 'app/invite/index.tsx';
const ORIGIN = brand.web.origin;
const TOKEN = 'q8Zr0_Yc-3Jk9LmN2pQ4sT6vW8xZ1aB3cD5eF7gH9iJ';
const BASE: JoinInputs = { loaded: true, token: TOKEN, signedIn: false, canSync: false, preview: null, busy: null, wantsJoin: false, joinedChildId: null, error: null };
const MAMA = { inviter: 'Mama', role: 'parent' as const, joined: false, known: true };

describe('[S59] before sign-in, neither the child\'s name nor the inviter is shown (BL-322)', () => {
  it('signed out with a link: the generic view, and nothing is asked of the server', () => {
    expect(joinPlan(BASE)).toEqual({ view: 'signIn', next: 'none' });
    expect(joinTitle('signIn', 'Asha')).toBe('You were invited to a book');
    expect(familyCopy.accept.signInBody).toBe('You each write from your own phone, in the same book.');
  });

  it('no view before the join returns takes the child\'s name, whatever is known', () => {
    for (const v of BEFORE_JOIN) expect(joinTitle(v, 'Asha'), v).not.toContain('Asha');
    expect(joinTitle('joined', 'Asha')).toBe("You're in Asha's book");
  });

  it('only the ask shows the inviter, as a signature, and never the child', () => {
    expect(invitedByLine('Mama')).toEqual({ text: 'Invited by Mama', signature: true });
    expect(invitedByLine('  ')).toEqual({ text: familyCopy.accept.invitedByUnknown, signature: false });
    const file = code('components/family/join-ask.tsx');
    const ask = file.slice(file.indexOf('export function JoinAsk'), file.indexOf('export function JoinedCover'));
    expect(ask).toMatch(/variant=\{by\.signature \? 'signature' : 'body'\}/);
    expect(ask).not.toMatch(/\bchild\b/i);
    // The sheet hands the inviter to the ask and the joined view only.
    const sheet = code(SHEET);
    expect(sheet.match(/preview\.inviter|preview\?\.inviter/g)).toHaveLength(2);
    expect(sheet).toMatch(/<JoinAsk inviter=\{preview\.inviter\} \/>/);
  });

  it('peeking says "Opening the invite", and the signed-out view has no cover and no names', () => {
    expect(familyCopy.accept.peeking).toBe('Opening the invite');
    const sheet = code(SHEET);
    expect(sheet).toMatch(/plan\.view === 'peeking' \? <Busy label=\{a\.peeking\} \/>/);
    const generic = sheet.slice(sheet.indexOf('const failure ='), sheet.indexOf('function Joined'));
    expect(generic).not.toMatch(/BookCover|JoinedCover|inviter|\{ child \}/);
  });
});

describe('[S59] nothing joins until "Join the book"; the open book changes only on "Open the book"', () => {
  it('signed in, the sheet looks first and asks; it accepts only after the tap', () => {
    const signedIn = { ...BASE, signedIn: true, canSync: true };
    expect(joinPlan(signedIn)).toEqual({ view: 'peeking', next: 'peek' });
    expect(joinPlan({ ...signedIn, preview: MAMA })).toEqual({ view: 'ask', next: 'none' });
    expect(joinPlan({ ...signedIn, preview: MAMA, wantsJoin: true })).toEqual({ view: 'joining', next: 'accept' });
    const sheet = code(SHEET);
    expect(sheet.match(/acceptInvite\(/g)).toHaveLength(1);
    expect(sheet).toMatch(/testID="invite\.join"[\s\S]{0,200}setWantsJoin\(true\)/);
  });

  it('the one place the open book changes is "Open the book"', () => {
    const sheet = code(SHEET);
    expect(sheet.match(/setActiveChildId\(/g)).toHaveLength(1);
    expect(sheet).toMatch(/const open = \(\) => \{[\s\S]*?setActiveChildId\(childId\);[\s\S]*?router\.dismissTo\(JOINED_LANDING\);/);
  });
});

describe('[S59] the child\'s name first appears on the opening cover', () => {
  it('the joined view draws the cover, 132 by 176, with the name, opening on mount, before the title', () => {
    const cover = code('components/family/join-ask.tsx');
    expect(cover).toMatch(/<BookCover name=\{child\} signsAs=\{inviter\?\.trim\(\) \|\| undefined\} size="md" state="open" openOnMount \/>/);
    expect(cover).toMatch(/entering=\{COVER_IN\}/);
    expect(tokens.motion.cover.holdMs).toBe(300);
    const joined = code(SHEET).slice(code(SHEET).indexOf('function Joined'));
    expect(joined.indexOf('<JoinedCover')).toBeGreaterThan(-1);
    expect(joined.indexOf('<JoinedCover')).toBeLessThan(joined.indexOf('a.joinedTitle'));
  });

  it('the line under it is the flyleaf in words, with the inviter\'s sign-off or without one', () => {
    expect(joinedBody('Mama')).toBe("Your letters and Mama's sit side by side, each signed.");
    expect(joinedBody(null)).toBe('Your letters and theirs sit side by side, each signed.');
  });

  it('while the book comes down: the line and a thin bar with no count, still under Reduce Motion', () => {
    const bar = code('components/family/join-ask.tsx');
    expect(bar).toMatch(/if \(reduced \|\| width === 0\) \{\s*cancelAnimation\(x\);\s*x\.value = 0;/);
    expect(bar).not.toMatch(/percent|%|\{count\}/);
    expect(code(SHEET)).toMatch(/fill\(a\.joinedWaiting, \{ child \}\)[\s\S]{0,80}<WaitingBar \/>/);
  });
});

describe('[S59] "Open the book" lands on the Book with the light rising once (5.8 row 12)', () => {
  it('lands on the Book with the joined mark', () => {
    expect(JOINED_LANDING).toEqual({ pathname: '/book', params: { joined: '1' } });
  });

  it('the Book reads the mark once: its lamp comes up from unlit over arriveMs, then the mark is cleared', () => {
    const book = code('app/(tabs)/book.tsx');
    expect(book).toMatch(/if \(joined !== '1'\) return;\s*setJoinedAt\(Date\.now\(\)\);\s*router\.setParams\(\{ joined: undefined \}\);/);
    expect(book).toMatch(/\{joinedAt \? <Lamp key=\{joinedAt\} scene="book" arrive \/> : <Lamp scene="book" persistKey="tabs" \/>\}/);
    // A lamp with no memory that is asked to arrive rises from 0 to the Book's 0.6 over arriveMs.
    const light = { anchor: 'top' as const, core: 'gold' as const, tail: 'amber' as const, intensity: 0.6, breathe: false };
    expect(planLampMount(undefined, light, false, { arrive: true, firstOfSession: false })).toEqual([{ light: { anchor: 'top', core: 'gold', tail: 'amber' }, from: 0, to: 0.6, ms: tokens.motion.lamp.arriveMs }]);
    expect(tokens.motion.lamp.arriveMs).toBe(1200);
    // Reduce Motion: the Book lit at once.
    expect(planLampMount(undefined, light, true, { arrive: true })).toEqual([{ light: { anchor: 'top', core: 'gold', tail: 'amber' }, from: 0.6, to: 0.6, ms: 0 }]);
  });
});

describe('[S59 Motion] views replace each other in place, never a push (5.8 row 10)', () => {
  it('every later view fades in over the last (200 ms); the view the sheet opens on adds no entrance', () => {
    expect(tokens.motion.fadeMs).toBe(200);
    const sheet = code(SHEET);
    expect(sheet).toMatch(/if \(plan\.view !== 'loading'\) setSteps\(\(n\) => n \+ 1\);/);
    expect(sheet).toMatch(/const fade = steps > 0;/);
    expect(sheet).toMatch(/<JoinStep key=\{plan\.view\} fade=\{fade\}>/);
    expect(sheet).not.toMatch(/router\.push\(/);
    expect(code('components/family/join-ask.tsx')).toMatch(/<Animated\.View entering=\{fade \? COVER_IN : undefined\}>/);
  });
});

describe('[S59] failures are said plainly, and the person can always go on', () => {
  it('a typed 8-character code is not read: the not-recognised line, nothing sent, and the field stays', () => {
    for (const typed of ['7K3M-9QXZ', '7k3m9qxz', '7K3M 9QXZ']) expect(readPasted(typed, ORIGIN)).toEqual({ error: familyCopy.accept.notRecognised });
    expect(readPasted(`https://earlyletters.com/j#t=${TOKEN}`, ORIGIN)).toEqual({ token: TOKEN });
    expect(readPasted(`Hi, it's Mama. Join me: https://earlyletters.com/j#t=${TOKEN}.`, ORIGIN)).toEqual({ token: TOKEN });
    const sheet = code(SHEET);
    expect(sheet).toMatch(/if \('error' in read\) \{\s*setPasteError\(read\.error\);\s*return;\s*\}/);
    // Build 2 has no typed-code path: the phone never calls invite-redeem.
    expect(sheet).not.toMatch(/invite-redeem|functions\/v1|normaliseInviteCode|isInviteCode/);
  });

  it('a server that does not answer (a 503, no SQLSTATE) is not final: "That did not work this time. Try again." and the link is kept', () => {
    const unavailable = { message: 'Service Unavailable', code: '', details: null, hint: null, status: 503 };
    expect(inviteErrorKind(unavailable)).toBe('unknown');
    expect(FINAL_INVITE_ERRORS).not.toContain('unknown');
    expect(joinFailure('unknown')).toEqual({ line: 'That did not work this time. Try again.', action: 'tryAgain' });
    expect(joinPlan({ ...BASE, signedIn: true, error: 'unknown' })).toEqual({ view: 'failed', next: 'none' });
  });

  it('offline keeps the link with Try again; a link that can never work drops it with "Paste another link"', () => {
    expect(joinFailure('network')).toEqual({ line: 'This phone is offline. Try again once it is back online.', action: 'tryAgain' });
    expect(joinFailure('paused').action).toBe('tryAgain');
    for (const k of ['expired', 'used', 'revoked', 'not_found', 'already_member', 'book_full'] as const) expect(joinFailure(k).action, k).toBe('pasteAnother');
    expect(joinFailure('not_found').line).toBe('That link does not open an invite. Check it and try again.');
    expect(joinFailure('consent_needed').line).toBe('To join, turn on sync and sharing in Settings, Privacy.');
    expect(code(SHEET)).toMatch(/failure\.action === 'pasteAnother' \? \(\s*<QuietButton label=\{a\.pasteAnother\} onPress=\{pasteAnother\} \/>/);
  });

  it('no failure line names the child', () => {
    for (const k of ['expired', 'used', 'revoked', 'not_found', 'already_member', 'book_full', 'network', 'unknown', 'paused', 'rate_limited', 'consent_needed'] as const) {
      expect(joinFailure(k).line, k).not.toMatch(/\{child\}|Asha/);
    }
  });
});
