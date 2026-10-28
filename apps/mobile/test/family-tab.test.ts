/// <reference types="node" />
/**
 * EXPERIENCE_PASS_2026-10 S57, the Family tab (package P8b): every acceptance box, on the pure presentation
 * (components/family/family-tab.logic.ts) and on the screen's source, read as text (nothing here loads React
 * Native).
 *  - Nothing is counted, and never more than two parents are shown (D-069).
 *  - People appear as their signatures; no email address or avatar for anyone.
 *  - The privacy line reads "Shared only with the other parent, if you invite them."
 *  - Coming to this tab never re-arrives the lamp; Increase Contrast shows plain paper.
 *  - The three tab titles come from packages/content.
 * Plus the S57 states and motion the logic decides: the invite card with one parent, nothing more with two and
 * no Leave row (D-113), the consent note, and the co-parent's arrival wash, once. Fictional family Asha only.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { en, familyCopy } from '@scribe/content';
import { tokens } from '@scribe/design-tokens';
import {
  arrivedSince,
  inviteCardNote,
  MAX_PARENTS_SHOWN,
  pendingSignature,
  peopleRows,
  rowLabel,
  signatureLine,
} from '../src/components/family/family-tab.logic';
import { lampAllowed, resolveLamp } from '../src/components/ui/lamp.logic';
import { LEAVE_BOOK_OFFERED } from '../src/lib/family/entry.logic';
import { decodeSeen, encodeSeen, familyTabState } from '../src/lib/family/members.logic';

const src = (p: string) => readFileSync(join(__dirname, '..', 'src', p), 'utf8');
/** Source without comments, so a rule is checked against code, not against the words that explain it. */
const code = (p: string) => src(p).replace(/\/\*[\s\S]*?\*\/|\{\/\*[\s\S]*?\*\/\}|\/\/.*$/gm, '');

const TAB = 'app/(tabs)/family.tsx';
const PAPA = { id: 'papa', signsAs: 'Papa', role: 'parent' as const };
const MAMA = { signsAs: 'Mama' };

describe('[S57] people are signatures, and never more than two parents (D-069)', () => {
  it('you and the co-parent read as signatures, with the role under each', () => {
    const rows = peopleRows(MAMA, [PAPA]);
    expect(rows.map((r) => [r.signature, r.role])).toEqual([
      ['From Mama', 'You'],
      ['From Papa', 'Co-parent'],
    ]);
    expect(rows.map((r) => r.label)).toEqual(['From Mama, You', 'From Papa, Co-parent']);
    expect(signatureLine('Mama', 'You')).toBe(en.common.signature.replace('{signsAs}', 'Mama'));
  });

  it('[F11-REQ-023] a co-parent with no sign-off is "Your co-parent"; you with none is "You", read once', () => {
    expect(peopleRows({ signsAs: ' ' }, [{ ...PAPA, signsAs: '  ' }]).map((r) => r.signature)).toEqual(['You', familyCopy.members.invitedName]);
    expect(rowLabel('You', 'You')).toBe('You');
  });

  it('shows at most one co-parent, whatever the pull holds, and never a family contributor', () => {
    expect(MAX_PARENTS_SHOWN).toBe(2);
    const many = [PAPA, { id: 'x', signsAs: 'Baba', role: 'parent' as const }, { id: 'n', signsAs: 'Nani', role: 'contributor' as const }];
    expect(peopleRows(MAMA, many).map((r) => r.signature)).toEqual(['From Mama', 'From Papa']);
    expect(peopleRows(MAMA, [{ id: 'n', signsAs: 'Nani', role: 'contributor' }])).toHaveLength(1);
  });

  it('a pending invite is "Your co-parent", never the sign-off the inviter suggested', () => {
    expect(pendingSignature()).toBe('Your co-parent');
    expect(code(TAB)).toMatch(/<MemberRow testID="family\.pending" pending signature=\{pendingSignature\(\)\}/);
  });

  it('no avatar, no initials and no email address for anyone', () => {
    const row = code('components/family/member-row.tsx');
    expect(row).not.toMatch(/charAt|initial|Avatar|rounded-full|email/i);
    expect(row).toMatch(/variant="signature"/);
    expect(row).toMatch(/variant="footnote"/);
    expect(code(TAB)).not.toMatch(/email|avatar/i);
    expect(code(TAB)).toMatch(/peopleRows\(active, state\.coParents\)/);
  });

  it('counts nothing: no number, plural or count placeholder on the tab', () => {
    const tab = code(TAB);
    expect(tab).not.toMatch(/\bplural\(|\{count\}|\.length\}/);
    const shown = [familyCopy.members, familyCopy.card, familyCopy.pending, familyCopy.left].flatMap((g) => Object.values(g));
    expect(shown.filter((t) => /\{(?:count|n|letters|notes)\}/.test(t))).toEqual([]);
  });
});

describe('[S57] the invite card, the privacy line, and what shows with two parents', () => {
  it('one parent and no open invite: the card; two parents: no card, and no Leave row in build 2 (D-113)', () => {
    expect(familyTabState({ role: 'parent', members: [], openInvites: 0 }).showInviteCard).toBe(true);
    expect(familyTabState({ role: 'parent', members: [], openInvites: 1 }).showInviteCard).toBe(false);
    expect(familyTabState({ role: 'parent', members: [PAPA], openInvites: 0 })).toMatchObject({ showInviteCard: false, full: true });
    expect(code(TAB)).toMatch(/\{state\.showInviteCard && <InviteCard /);
    expect(LEAVE_BOOK_OFFERED).toBe(false);
    expect(code(TAB)).not.toMatch(/invite\/leave|leave\.row|LeaveRow/);
  });

  it('the privacy line reads "Shared only with the other parent, if you invite them.", with LockSimple, in the card', () => {
    expect(familyCopy.card.privacy).toBe('Shared only with the other parent, if you invite them.');
    const card = code('components/family/invite-card.tsx');
    expect(card).toMatch(/<LockSimpleIcon size=\{16\}/);
    expect(card).toMatch(/\{k\.privacy\}/);
    expect(card).toMatch(/<BookCover name=\{child\} size="sm"/);
    expect(card).toMatch(/variant="outline"[^>]*icon=\{UserPlusIcon\}[^>]*label=\{k\.button\}/);
  });

  it('signed in with setting up unfinished: the card says so; signed out it adds nothing (signedOutNote is retired)', () => {
    expect(inviteCardNote({ needsConsent: true })).toBe(familyCopy.card.finishSetup);
    expect(inviteCardNote({ needsConsent: false })).toBeNull();
    expect(code(TAB)).not.toMatch(/signedOutNote/);
  });

  it('shows no words P0 retired or the layout left out: the old empty lines and the settings-voice subtitle', () => {
    const tab = code(TAB);
    expect(tab).not.toMatch(/familyTab\.(?:emptyTitle|emptyBody|inviteNeedsSignIn)|copy\.family\.(?:title|subtitle)/);
    expect(tab).toMatch(/fill\(copy\.familyTab\.membersTitle, \{ child \}\)/);
    expect(tab).toMatch(/<Text variant="title1" asHeading=\{1\}>/);
    expect(tab).toMatch(/<Text variant="letterDateline" caps accessibilityLabel=\{dateline\.a11y\}>/);
  });
});

describe('[S57] the room: the lamp, and the tab titles', () => {
  it('the still family scene at 0.4, top, gold into amber, sharing the tabs\' light, never asked to arrive', () => {
    expect(resolveLamp({ scene: 'family' })).toMatchObject({ anchor: 'top', core: 'gold', tail: 'amber', intensity: 0.4, breathe: false });
    expect(tokens.atmosphere.scene.family.breathe).toBe(false);
    expect(code(TAB)).toMatch(/<Lamp scene="family" persistKey="tabs" \/>/);
    expect(code(TAB)).not.toMatch(/\barrive\b/);
  });

  it('Increase Contrast and Reduce Transparency show plain paper', () => {
    expect(lampAllowed({ highContrast: true, reduceTransparency: false })).toBe(false);
    expect(lampAllowed({ highContrast: false, reduceTransparency: true })).toBe(false);
  });

  it('the three tab titles come from packages/content; none is typed in the layout', () => {
    expect(en.tabs).toEqual({ tonight: 'Tonight', book: 'Book', family: 'Family' });
    const layout = code('app/(tabs)/_layout.tsx');
    expect(layout).not.toMatch(/title: '|button\('/);
    for (const k of ['tonight', 'book', 'family']) expect(layout).toMatch(new RegExp(`title: t\\.${k}, [^}]*tabBarButton: button\\(t\\.${k}\\)`));
    expect(layout).toMatch(/const t = copy\.tabs;/);
  });
});

describe('[S57 Motion] the co-parent\'s row arrives once', () => {
  it('a co-parent this phone has not shown before gets the wash; after the seen list is stored, never again', () => {
    expect(arrivedSince([], [PAPA], true)).toEqual(['papa']);
    const seen = decodeSeen(encodeSeen([PAPA]));
    expect(arrivedSince(seen, [PAPA], true)).toEqual([]);
    // A sign-off change is the same person: no second arrival.
    expect(arrivedSince(seen, [{ ...PAPA, signsAs: 'Baba' }], true)).toEqual([]);
  });

  it('never for a book only on this phone, and never for a contributor', () => {
    expect(arrivedSince([], [PAPA], false)).toEqual([]);
    expect(arrivedSince([], [{ id: 'n', signsAs: 'Nani', role: 'contributor' }], true)).toEqual([]);
  });

  it('the wash is the Book\'s 1.6 s accentSoft fade, and a pending row that leaves collapses on the standard spring', () => {
    expect(tokens.motion.newMarkMs).toBe(1600);
    expect(code('components/family/member-row.tsx')).toMatch(/withTiming\(0, \{ duration: tokens\.motion\.newMarkMs/);
    expect(code(TAB)).toMatch(/exiting=\{motion\.exit\(\)\} layout=\{motion\.layout\('standard'\)\}/);
  });

  it('a sheet\'s closing line and "Invite cancelled." show as the tab\'s toast, which VoiceOver hears', () => {
    expect(code(TAB)).toMatch(/const note = familyNotice\.take\(\);\s*if \(note\) toast\.show\(\{ message: note \}\);/);
    expect(code(TAB)).toMatch(/toast\.show\(\{ message: f\.pending\.cancelled \}\)/);
    expect(src('components/ui/toast.tsx')).toMatch(/announce\(action \?/);
  });
});
