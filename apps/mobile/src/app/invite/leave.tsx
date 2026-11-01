// android: same
/**
 * Leave a shared book (EXPERIENCE_PASS_2026-10 S60; PRD V2 F11 6.2 D; F11-REQ-011, F11-REQ-027, F11-REQ-028;
 * B-REQ-010; DATA-REQ-016). `/invite/leave?childId=<id>`, only when the book has a co-parent: a sole parent cannot
 * leave (SCLPG) and deletes the book instead.
 *
 * Not offered in build 2 (D-113, lib/family/entry.logic.ts LEAVE_BOOK_OFFERED): no screen links here, and the route
 * shows a plain coming-soon line (LeaveLater), because a book this phone leaves is not listed anywhere yet. The sheet
 * below is built to S60 for when left books are listed (BL-444, before build 3).
 *
 * One sheet: the title, two equal choice cards with nothing chosen (R4 PT-14; components/family/leave-sheet.tsx),
 * each saying what follows, and what cannot be taken back under them (R4 PT-15). "Leave the book" is in the outline
 * style and cannot be tapped until a choice is made, then in the quiet destructive style, with `warning` once on
 * the tap; "Stay" is the sheet's one filled button and closes. Then `leave_child(child, keep_in_book)` and a sync,
 * so this phone drops the other parent's letters and keeps this person's own (lib/sync/merge.ts closeBook); the
 * sheet closes and the Family tab says `leave.done` as its toast. The only parent of a book sees `last_parent`
 * and no Leave.
 *
 * Not reachable from an outside link: only `/` and `/invite` are (lib/family/entry.logic.ts).
 */
import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';
import { familyNotice } from '@/components/family/family-notice';
import { LeaveChoices } from '@/components/family/leave-sheet';
import { leaveButton, leaveChoices, leaveSheetView, type LeaveChoice } from '@/components/family/leave-sheet.logic';
import { InviteComingSoon } from '@/components/family/invite-coming-soon';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { track } from '@/lib/analytics/track';
import { useAuth } from '@/lib/auth/session-provider';
import { AccountGate, ErrorLine, SheetBody, SheetFrame, SheetTitle, useCloseSheet } from '@/lib/auth/ui';
import { serverFeaturesEnabled } from '@/lib/capabilities';
import { fill } from '@/lib/copy';
import { familyCopy } from '@/lib/family/copy';
import { inviteDestination } from '@/lib/family/entry.logic';
import { inviteErrorKind, type InviteErrorKind } from '@/lib/family/invite-errors.logic';
import { leaveBook } from '@/lib/family/invites';
import { familyTabState } from '@/lib/family/members.logic';
import { haptic } from '@/lib/haptics';
import { getChild, listMembers } from '@/lib/store';
import { syncNow } from '@/lib/sync';

/** Fixed per build (lib/capabilities.ts, and D-113 for build 2). Off: there is no shared book to leave. */
export default function LeaveBookRoute() {
  return inviteDestination('invite_leave', serverFeaturesEnabled()) === 'flow' ? <LeaveBook /> : serverFeaturesEnabled() ? <LeaveLater /> : <InviteComingSoon />;
}

/**
 * Sharing is on but Leave waits for D-113 to lift: one plain coming-soon line. The co-parent
 * teaser (InviteComingSoon) is for builds without sharing; here it would say letters stay on
 * this phone, which is not true once a book is shared.
 */
function LeaveLater() {
  return (
    <SheetFrame closeLabel={familyCopy.accept.close}>
      <View testID="leave.later" className="gap-5">
        <SheetTitle>{familyCopy.soon.status}</SheetTitle>
        <SheetBody>{familyCopy.leave.later}</SheetBody>
      </View>
    </SheetFrame>
  );
}

function LeaveBook() {
  const auth = useAuth();
  const close = useCloseSheet();
  const l = familyCopy.leave;
  const { childId } = useLocalSearchParams<{ childId?: string }>();
  const book = childId ? getChild(childId) : null;
  const [choice, setChoice] = useState<LeaveChoice | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<InviteErrorKind | null>(null);

  const state = book ? familyTabState({ role: book.role, members: listMembers(book.id), openInvites: 0 }) : null;
  const view = leaveSheetView({ hasBook: !!book, canLeave: !!state?.canLeave, left: false });

  if (!book || !state || view === 'missing') {
    return (
      <SheetFrame closeLabel={familyCopy.accept.close}>
        <ErrorLine message={familyCopy.errors.book_deleted} />
      </SheetFrame>
    );
  }
  const child = book.name;

  if (view === 'lastParent') {
    // A sole parent (or a book only on this phone): nothing to leave. The book stays theirs, and no Leave shows.
    return (
      <SheetFrame closeLabel={familyCopy.accept.close}>
        <View testID="leave.lastParent">
          <SheetBody>{fill(familyCopy.errors.last_parent, { child })}</SheetBody>
        </View>
      </SheetFrame>
    );
  }

  const coParent = state.coParents[0]?.signsAs.trim() || l.coParentFallback;
  const leave = leaveButton(choice, busy);

  const confirm = async () => {
    if (!auth.client || choice === null) return;
    haptic('warning');
    setBusy(true);
    setError(null);
    try {
      await leaveBook(auth.client, book.id, choice === 'keep');
      track('member_left', { role: 'parent', letters: choice });
      void syncNow(); // the other parent's letters leave this phone within one sync (F11-REQ-011)
      familyNotice.leave(fill(l.done, { child }));
      close();
    } catch (e) {
      setError(inviteErrorKind(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <SheetFrame
      footer={
        <AccountGate trigger="invite" signInBody={familyCopy.accept.signInBody}>
          <Button
            testID="leave.confirm"
            variant={leave.variant}
            size="lg"
            disabled={!leave.enabled}
            loading={busy}
            label={busy ? l.leaving : l.confirm}
            onPress={() => void confirm()}
          />
          <Button testID="leave.stay" size="lg" label={l.cancel} onPress={close} disabled={busy} />
        </AccountGate>
      }>
      <View testID="leave.screen" className="gap-5">
        <SheetTitle>{fill(l.title, { child })}</SheetTitle>
        <LeaveChoices label={fill(l.title, { child })} options={leaveChoices(coParent)} value={choice} onChange={setChoice} disabled={busy} />
        <Text variant="footnote">{fill(l.cantTakeBack, { coParent })}</Text>
        <ErrorLine message={error ? fill(familyCopy.errors[error], { child }) : null} />
      </View>
    </SheetFrame>
  );
}
