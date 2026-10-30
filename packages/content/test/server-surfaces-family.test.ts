/**
 * Experience pass, October 2026, package P8b: the Family tab, invite, joining and leaving (S57 to S60 in
 * docs/design/EXPERIENCE_PASS_2026-10.md, section 4 chapter 7, and section 6 "P8").
 *
 * Over P8b's one copy file, `familyCopy` (src/features/family.en.ts):
 *  - every CHG and NEW of S57 to S59, word for word (S60 changes no word: every `leave.*` key is KEEP);
 *  - the retired keys P8b stopped showing are gone (P8 deletes its own RETs, section 6);
 *
 * The content rules over this file (no "we" or "our" outside the kill path's `soon.*`, buttons of 22 characters or
 * fewer, the placeholders it may use, no "photos", "only you", "only your family's keys" or "end-to-end", no "stays
 * on this phone" outside the kill path, no child named before joining, US spelling) run in rules.test.ts, from the
 * row for `familyCopy` in test/support/copy-surfaces.ts.
 * S04's coparent-soon.test.ts keeps pinning the kill path itself.
 */
import { describe, expect, it } from 'vitest';
import { en, familyCopy } from '../src';

type Leaf = { path: string; text: string };

function leaves(value: unknown, path: string): Leaf[] {
  if (typeof value === 'string') return [{ path, text: value }];
  if (Array.isArray(value)) return value.flatMap((v, i) => leaves(v, `${path}[${i}]`));
  if (value && typeof value === 'object') return Object.entries(value).flatMap(([k, v]) => leaves(v, `${path}.${k}`));
  return [];
}

/** The value at a path under familyCopy, such as "accept.joinedBody". */
function at(path: string): unknown {
  return path.split('.').reduce<unknown>((node, key) => (node && typeof node === 'object' ? (node as Record<string, unknown>)[key] : undefined), familyCopy);
}

const ALL = leaves(familyCopy, 'familyCopy');
/** The kill path (server features off): the coming-soon presentation, unchanged by this pass (S48, S57). */
const KILL_PATH = (l: Leaf) => l.path.startsWith('familyCopy.soon.');
const LIVE = ALL.filter((l) => !KILL_PATH(l));

/** Section 4 chapter 7, S57 to S59: every CHG and NEW in family.en.ts, as the spec writes it. */
const CHANGED: Record<string, string> = {
  // S57 Family tab
  'card.body': "Invite {child}'s other parent. They write from their own phone, and you both read the whole book.",
  'card.privacy': 'Shared only with the other parent, if you invite them.',
  // S46 (P6 builds the row; the words are P8's)
  'bookRow.label': 'Write this book together',
  // S58 Invite a co-parent
  'create.done': 'The invite waits on the Family tab until they join.',
  'errors.not_found': 'That link does not open an invite. Check it and try again.',
  'errors.network': 'This phone is offline. Try again once it is back online.',
  'errors.unknown': 'That did not work this time. Try again.',
  'errors.retry_new_invite': 'That did not work this time. Try again.',
  // S59 Joining a book
  'accept.title': 'Join a book',
  'accept.signInBody': 'You each write from your own phone, in the same book.',
  'accept.peeking': 'Opening the invite',
  'accept.needsSync': 'To join, turn on sync and sharing in Settings, Privacy.',
  'accept.joinedBody': "Your letters and {inviter}'s sit side by side, each signed.",
  'accept.joinedBodyUnknown': 'Your letters and theirs sit side by side, each signed.',
};

/**
 * Added after the critics' pass on P8b (S2), with the words as built: the welcome's line when a joined book has not
 * come, and both lines for a join whose child's name could not be read (the lenses' second pass on #375).
 */
const ADDED_AFTER_CRITICS: Record<string, string> = {
  'accept.joinedNotYet': "{child}'s book has not reached this phone yet.",
  'accept.joinedWaitingUnknown': 'The book is on its way to this phone.',
  'accept.joinedNotYetUnknown': 'The book has not reached this phone yet.',
};

/**
 * Not in the spec's table, flagged in the P8b PR: `errors.id_taken` is documented as taking the same action and
 * words as `retry_new_invite`, so it follows it.
 */
const FOLLOWS: Record<string, string> = { 'errors.id_taken': 'errors.retry_new_invite' };

/** Words the S57 to S60 acceptance boxes quote. */
const QUOTED: Record<string, string> = {
  'familyTab.membersTitle (strings.en.ts)': 'Who writes to {child}',
  'members.you': 'You',
  'members.coParent': 'Co-parent',
  'members.invitedName': 'Your co-parent',
  'members.openUntil': 'Invited, open until {date}',
  'card.title': 'Write this book together',
  'card.button': 'Invite a co-parent',
  'accept.invitedTitle': 'You were invited to a book',
  'accept.askTitle': 'Join this book as a parent?',
  'accept.invitedBy': 'Invited by {inviter}',
  'accept.join': 'Join the book',
  'accept.open': 'Open the book',
  'leave.confirm': 'Leave the book',
  'leave.cancel': 'Stay',
};

describe('[P8b S57 to S59] familyCopy changes, word for word', () => {
  it('has every CHG and NEW key of S57 to S59 as the spec writes it', () => {
    for (const [key, words] of Object.entries(CHANGED)) expect(at(key), key).toBe(words);
  });

  it('has the lines added after the critics\' pass (S2), as built', () => {
    for (const [key, words] of Object.entries(ADDED_AFTER_CRITICS)) expect(at(key), key).toBe(words);
  });

  it('gives errors.id_taken the words of retry_new_invite, as its comment says', () => {
    for (const [key, of] of Object.entries(FOLLOWS)) expect(at(key), key).toBe(at(of));
  });

  it('keeps the words the acceptance boxes quote', () => {
    for (const [key, words] of Object.entries(QUOTED)) {
      if (key.includes('strings.en.ts')) continue; // P0's file, checked on its own below
      expect(at(key), key).toBe(words);
    }
    // The Family tab's one literary line lives in P0's strings.en.ts (S57 KEEP); the tab reads it.
    expect(en.familyTab.membersTitle).toBe(QUOTED['familyTab.membersTitle (strings.en.ts)']);
  });

  it('says who the book is shared with and never who can read it (S57, review A1)', () => {
    expect(familyCopy.card.privacy).toBe('Shared only with the other parent, if you invite them.');
    expect(LIVE.filter((l) => /\bcan read\b/i.test(l.text) && !l.path.startsWith('familyCopy.leave.')).map((l) => `${l.path}: ${l.text}`)).toEqual([]);
  });
});

describe('[P8b] retired keys are gone with the screens that showed them (section 6: P8 deletes its own RETs)', () => {
  it('card.signedOutNote (S57: the sign-in sheet says it)', () => {
    expect('signedOutNote' in familyCopy.card).toBe(false);
  });
});
