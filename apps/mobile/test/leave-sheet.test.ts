/// <reference types="node" />
/**
 * EXPERIENCE_PASS_2026-10 S60, Leave the book (package P8b). Build 2 offers no Leave (D-113): /invite/leave answers
 * coming soon and nothing links to the sheet, so its two acceptance boxes are proved here, on the sheet's pure
 * presentation (components/family/leave-sheet.logic.ts) and its source, read as text.
 *  - Nothing is preselected, and Leave stays disabled until a choice.
 *  - The only parent of a book sees `last_parent` and no Leave.
 * Every `leave.*` key is KEEP. Fictional family Asha only.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { familyCopy } from '@scribe/content';
import { leaveButton, leaveChoices, leaveSheetView } from '../src/components/family/leave-sheet.logic';
import { inviteDestination, LEAVE_BOOK_OFFERED } from '../src/lib/family/entry.logic';
import { familyTabState } from '../src/lib/family/members.logic';

const src = (p: string) => readFileSync(join(__dirname, '..', 'src', p), 'utf8');
const code = (p: string) => src(p).replace(/\/\*[\s\S]*?\*\/|\{\/\*[\s\S]*?\*\/\}|\/\/.*$/gm, '');
const SHEET = 'app/invite/leave.tsx';
const PAPA = { id: 'papa', signsAs: 'Papa', role: 'parent' as const };

describe('[S60] build 2: Leave is held back (D-113)', () => {
  it('/invite/leave shows coming soon with sharing on and off, and no screen links to it', () => {
    expect(LEAVE_BOOK_OFFERED).toBe(false);
    for (const on of [true, false]) expect(inviteDestination('invite_leave', on)).toBe('coming_soon');
    expect(code(SHEET)).toMatch(/serverFeaturesEnabled\(\) \? <LeaveLater \/> : <InviteComingSoon \/>/);
    for (const screen of ['app/(tabs)/family.tsx', 'app/invite/index.tsx', 'app/invite/new.tsx']) expect(code(screen), screen).not.toMatch(/\/invite\/leave/);
  });
});

describe('[S60] nothing is preselected, and Leave stays disabled until a choice', () => {
  it('on arrival nothing is chosen; Leave is in the outline style and cannot be tapped', () => {
    expect(code(SHEET)).toMatch(/useState<LeaveChoice \| null>\(null\)/);
    expect(leaveButton(null, false)).toEqual({ enabled: false, variant: 'outline' });
  });

  it('a choice makes it tappable, in the quiet destructive style; while it runs it cannot be tapped again', () => {
    expect(leaveButton('keep', false)).toEqual({ enabled: true, variant: 'destructive' });
    expect(leaveButton('take_out', false)).toEqual({ enabled: true, variant: 'destructive' });
    expect(leaveButton('keep', true)).toEqual({ enabled: false, variant: 'destructive' });
    expect(code(SHEET)).toMatch(/variant=\{leave\.variant\}[\s\S]{0,40}size="lg"[\s\S]{0,40}disabled=\{!leave\.enabled\}/);
  });

  it('two equal choices, in a radio group, each saying what follows; what cannot be taken back is under them', () => {
    const choices = leaveChoices('Papa');
    expect(choices.map((c) => c.value)).toEqual(['keep', 'take_out']);
    expect(choices[0]).toEqual({ value: 'keep', label: familyCopy.leave.keep, help: 'Anyone Papa invites later can read letters you leave in the book.' });
    expect(choices[1]).toEqual({ value: 'take_out', label: familyCopy.leave.takeOut, help: familyCopy.leave.takeOutHelp });
    const cards = code('components/family/leave-sheet.tsx');
    expect(cards).toMatch(/accessibilityRole="radiogroup"/);
    expect(cards).toMatch(/accessibilityRole="radio"\s+accessibilityState=\{\{ checked, disabled: !!disabled \}\}/);
    expect(cards).toMatch(/checked \? 'bg-secondary' : 'bg-card'/);
    expect(cards).toMatch(/borderWidth: checked \? tokens\.stroke\.selected : tokens\.stroke\.control, borderColor: checked \? c\.accent : c\.controlBorder/);
    expect(cards).toMatch(/checked \? <CheckIcon/);
    expect(code(SHEET)).toMatch(/fill\(l\.cantTakeBack, \{ coParent \}\)/);
  });

  it('Stay is the sheet\'s one filled button and closes; Leave gives one warning, then the tab says leave.done', () => {
    const sheet = code(SHEET);
    expect(sheet).toMatch(/<Button testID="leave\.stay" size="lg" label=\{l\.cancel\} onPress=\{close\}/);
    expect(sheet).toMatch(/haptic\('warning'\);/);
    expect(sheet.match(/haptic\(/g)).toHaveLength(1);
    expect(sheet).toMatch(/familyNotice\.leave\(fill\(l\.done, \{ child \}\)\);\s*close\(\);/);
  });
});

describe('[S60] the only parent of a book sees last_parent and no Leave', () => {
  it('a sole parent, or a book only on this phone, cannot leave', () => {
    const sole = familyTabState({ role: 'parent', members: [], openInvites: 0 });
    const local = familyTabState({ members: [], openInvites: 0 });
    const two = familyTabState({ role: 'parent', members: [PAPA], openInvites: 0 });
    expect(leaveSheetView({ hasBook: true, canLeave: sole.canLeave, left: false })).toBe('lastParent');
    expect(leaveSheetView({ hasBook: true, canLeave: local.canLeave, left: false })).toBe('lastParent');
    expect(leaveSheetView({ hasBook: true, canLeave: two.canLeave, left: false })).toBe('choose');
    expect(leaveSheetView({ hasBook: false, canLeave: true, left: false })).toBe('missing');
  });

  it('the last-parent view is the one line and no Leave button', () => {
    const sheet = code(SHEET);
    const lastParent = /if \(view === 'lastParent'\) \{([\s\S]*?)\n  \}/.exec(sheet)?.[1] ?? '';
    expect(lastParent).toMatch(/fill\(familyCopy\.errors\.last_parent, \{ child \}\)/);
    expect(lastParent).not.toMatch(/leave\.confirm|l\.confirm|Button/);
    expect(familyCopy.errors.last_parent).toBe("You're the only parent of {child}'s book now, so it stays with you.");
  });

  it('keeps develop\'s leave words (every leave.* key is KEEP)', () => {
    expect(familyCopy.leave.title).toBe("Leave {child}'s book?");
    expect(familyCopy.leave.confirm).toBe('Leave the book');
    expect(familyCopy.leave.cancel).toBe('Stay');
    expect(familyCopy.leave.leaving).toBe('Leaving the book');
    expect(familyCopy.leave.later).toBe('Leaving a shared book is coming in a later update.');
  });
});
