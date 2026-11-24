// android: same
/**
 * Leave a shared book (EXPERIENCE_PASS_2026-10 S60; PRD V2 F11 6.2 D; F11-REQ-011, F11-REQ-027, F11-REQ-028;
 * B-REQ-010; DATA-REQ-016). `/invite/leave?childId=<id>`, only when the book has a co-parent: a sole parent cannot
 * leave (SCLPG) and deletes the book instead.
 *
 * Offered again (BL-1961, lib/family/entry.logic.ts LEAVE_BOOK_OFFERED): a book this phone leaves is listed under
 * "Letters to {child}" (BL-444), where each letter can be read, exported and deleted. The Family tab's Leave row opens this sheet.
 *
 * One sheet: the title, two equal choice cards with nothing chosen (R4 PT-14; components/family/leave-sheet.tsx),
 * each saying what follows, and what cannot be taken back under them (R4 PT-15). "Leave the book" is in the outline
 * style and cannot be tapped until a choice is made, then in the quiet destructive style, with `warning` once on
 * the tap; "Stay" is the sheet's one filled button and closes. Then `leave_child(child, keep_in_book)` and a sync,
 * so this phone drops the other parent's letters and keeps this person's own (lib/sync/merge.ts closeBook); the
 * sheet closes and the Family tab says `leave.done` as its toast. The only parent of a book sees `last_parent`
 * and no Leave. The sheet's header Close sits outside the sign-in gate, so a person who is not signed in can still
 * close in the sheet when the gate replaces the two buttons (BL-469); it waits while a leave is in flight.
 *
 * Not reachable from an outside link: only `/` and `/invite` are (lib/family/entry.logic.ts).
 */
import { Redirect, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';
import { familyNotice, noticeOwner } from '@/components/family/family-notice';
import { LeaveChoices } from '@/components/family/leave-sheet';
import { leaveButton, leaveChoices, leaveSheetView, type LeaveChoice } from '@/components/family/leave-sheet.logic';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { useAuth } from '@/lib/auth/session-provider';
import { AccountGate, ErrorLine, SheetBody, SheetFrame, SheetTitle, useCloseSheet } from '@/lib/auth/ui';
import { PLUS_ALPHA } from '@/lib/billing/alpha';
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

/** Fixed per build (lib/capabilities.ts, and LEAVE_BOOK_OFFERED). Off: there is no shared book to leave. */
export default function LeaveBookRoute() {
  return inviteDestination('invite_leave', serverFeaturesEnabled(), PLUS_ALPHA) === 'flow' ? <LeaveBook /> : <Redirect href="/" />;
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
    const owner = noticeOwner(); // before the await: who left
    try {
      await leaveBook(auth.client, book.id, choice === 'keep');
      void syncNow(); // the other parent's letters leave this phone within one sync (F11-REQ-011)
      familyNotice.leave(fill(l.done, { child }), owner);
      close();
    } catch (e) {
      setError(inviteErrorKind(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <SheetFrame
      closeLabel={familyCopy.accept.close}
      closeDisabled={busy}
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
