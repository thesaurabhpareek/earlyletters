// android: same
/**
 * Leave a shared book (PRD V2 F11 6.2 D; F11-REQ-011, F11-REQ-027, F11-REQ-028; B-REQ-010;
 * DATA-REQ-016). `/invite/leave?childId=<id>` from the Family tab, only when the book has a
 * co-parent: a sole parent cannot leave (SCLPG) and deletes the book instead.
 *
 * One sheet, two equal choices, nothing preselected (R4 PT-14): leave my letters in the book, or
 * take them out. Each says what follows, and both say what cannot be taken back (R4 PT-15). Leave
 * stays disabled until one is chosen. Then `leave_child(child, keep_in_book)` and a sync, so this
 * phone drops the other parent's letters and keeps this person's own (lib/sync/merge.ts closeBook).
 *
 * Not reachable from an outside link: only `/` and `/invite` are (lib/family/entry.logic.ts).
 */
import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';
import { Button } from '@/components/ui/button';
import { ChoiceGroup } from '@/components/ui/choice-group';
import { Text } from '@/components/ui/text';
import { InviteComingSoon } from '@/components/family/invite-coming-soon';
import { track } from '@/lib/analytics/track';
import { useAuth } from '@/lib/auth/session-provider';
import { AccountGate, Busy, ErrorLine, QuietButton, SheetBody, SheetFrame, SheetTitle, useCloseSheet } from '@/lib/auth/ui';
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

type Choice = 'keep' | 'take_out';

/** Fixed per build (lib/capabilities.ts). Off: there is no shared book to leave. */
export default function LeaveBookRoute() {
  return inviteDestination('invite_leave', serverFeaturesEnabled()) === 'flow' ? <LeaveBook /> : <InviteComingSoon />;
}

function LeaveBook() {
  const auth = useAuth();
  const close = useCloseSheet();
  const l = familyCopy.leave;
  const { childId } = useLocalSearchParams<{ childId?: string }>();
  const book = childId ? getChild(childId) : null;
  const [choice, setChoice] = useState<Choice | 'none'>('none');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<InviteErrorKind | null>(null);
  const [left, setLeft] = useState(false);

  if (!book) {
    return (
      <SheetFrame closeLabel={familyCopy.accept.close}>
        <ErrorLine message={familyCopy.errors.book_deleted} />
      </SheetFrame>
    );
  }
  const child = book.name;
  const state = familyTabState({ role: book.role, members: listMembers(book.id), openInvites: 0 });
  const coParent = state.coParents[0]?.signsAs.trim() || l.coParentFallback;

  if (left) {
    return (
      <SheetFrame
        footer={
          <Button testID="leave.close" size="lg" onPress={close}>
            <Text>{familyCopy.accept.close}</Text>
          </Button>
        }>
        <SheetTitle>{fill(l.title, { child })}</SheetTitle>
        <SheetBody>{fill(l.done, { child })}</SheetBody>
      </SheetFrame>
    );
  }

  if (!state.canLeave) {
    // A sole parent (or a book only on this phone): nothing to leave. The book stays theirs.
    return (
      <SheetFrame closeLabel={familyCopy.accept.close}>
        <ErrorLine message={fill(familyCopy.errors.last_parent, { child })} />
      </SheetFrame>
    );
  }

  const confirm = async () => {
    if (!auth.client || choice === 'none') return;
    setBusy(true);
    setError(null);
    try {
      await leaveBook(auth.client, book.id, choice === 'keep');
      track('member_left', { role: 'parent', letters: choice });
      haptic('success');
      setLeft(true);
      void syncNow(); // the other parent's letters leave this phone within one sync (F11-REQ-011)
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
          {busy ? (
            <Busy label={l.leaving} />
          ) : (
            <>
              <Button testID="leave.confirm" variant="destructive" size="lg" disabled={choice === 'none'} onPress={() => void confirm()}>
                <Text>{l.confirm}</Text>
              </Button>
              <QuietButton label={l.cancel} onPress={close} />
            </>
          )}
        </AccountGate>
      }>
      <View testID="leave.screen" className="gap-5">
        <SheetTitle>{fill(l.title, { child })}</SheetTitle>
        <ChoiceGroup<Choice | 'none'>
          label={fill(l.title, { child })}
          layout="list"
          testID="leave.choice"
          value={choice}
          onChange={(v) => setChoice(v)}
          options={[
            { value: 'keep', label: l.keep, description: fill(l.keepHelp, { coParent }) },
            { value: 'take_out', label: l.takeOut, description: l.takeOutHelp },
          ]}
        />
        <Text className="text-base leading-6 text-muted-foreground">{fill(l.cantTakeBack, { coParent })}</Text>
        <ErrorLine message={error ? fill(familyCopy.errors[error], { child }) : null} />
      </View>
    </SheetFrame>
  );
}
