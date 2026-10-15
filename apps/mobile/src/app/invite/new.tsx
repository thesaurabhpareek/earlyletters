// android: same
/**
 * Invite a co-parent (PRD V2 F11 6.2 A; B-REQ-007, F11-REQ-001, F11-REQ-004; co-parent only at
 * v1.0, B1). `/invite/new?childId=<id>` from the Family tab or a child's settings.
 *
 * The phone makes the invite (lib/family/invite-draft.logic.ts, F11 D5): an id, a 32-byte token
 * and its hash. Only the hash goes to the server; the link https://<brand host>/i/<token> goes
 * straight to the share sheet and is never stored, shown again, logged or tracked. One draft per
 * sheet and signature, so a retry or a second tap is one invite (F11-U15, G-07).
 *
 * A book that already has two parents (D-069) shows "{child}'s book has two parents." instead of
 * Share, from the last pull or from the server's SCCAP (F11-REQ-004, F11-REQ-026).
 */
import { router, useLocalSearchParams } from 'expo-router';
import { useRef, useState } from 'react';
import { TextInput, View } from 'react-native';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { InviteComingSoon } from '@/components/family/invite-coming-soon';
import { useAuth } from '@/lib/auth/session-provider';
import { serverFeaturesEnabled } from '@/lib/capabilities';
import { inviteDestination } from '@/lib/family/entry.logic';
import { AccountGate, Busy, ErrorLine, QuietButton, SheetBody, SheetFrame, SheetTitle, useCloseSheet, useColors } from '@/lib/auth/ui';
import { fill } from '@/lib/copy';
import { familyCopy } from '@/lib/family/copy';
import { childIndexOf, track, trackInviteCreated } from '@/lib/analytics/track';
import { makeInviteDraft } from '@/lib/family/device-invite';
import type { InviteDraft } from '@/lib/family/invite-draft.logic';
import { inviteErrorKind, trackedInviteReason, type InviteErrorKind } from '@/lib/family/invite-errors.logic';
import { createCoParentInvite } from '@/lib/family/invites';
import { familyTabState } from '@/lib/family/members.logic';
import { shareInviteLink } from '@/lib/family/share';
import { haptic } from '@/lib/haptics';
import { getChild, listMembers } from '@/lib/store';

/** Fixed per build (lib/capabilities.ts). Off: co-parent sharing is coming soon. */
export default function InviteCoParentRoute() {
  return inviteDestination('invite_new', serverFeaturesEnabled()) === 'flow' ? <InviteCoParent /> : <InviteComingSoon />;
}

function InviteCoParent() {
  const auth = useAuth();
  const c = useColors();
  const close = useCloseSheet();
  const { childId } = useLocalSearchParams<{ childId?: string }>();
  const book = childId ? getChild(childId) : null;
  const k = familyCopy.create;
  const [signsAs, setSignsAs] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<InviteErrorKind | null>(null);
  const [done, setDone] = useState(false);
  const draft = useRef<{ signsAs: string; draft: InviteDraft } | null>(null);

  if (!book) {
    // No book on this phone (stale link to this screen): nothing to invite to.
    return (
      <SheetFrame closeLabel={familyCopy.accept.close}>
        <ErrorLine message={familyCopy.errors.book_deleted} />
      </SheetFrame>
    );
  }
  const child = book.name;
  const full = error === 'book_full' || familyTabState({ role: book.role, members: listMembers(book.id), openInvites: 0 }).full;

  /** The same draft while the signature is unchanged; a fresh one when it changes or the server asks. */
  const draftFor = async (s: string, fresh: boolean): Promise<InviteDraft> => {
    if (!fresh && draft.current && draft.current.signsAs === s) return draft.current.draft;
    const d = await makeInviteDraft();
    draft.current = { signsAs: s, draft: d };
    return d;
  };

  const share = async () => {
    if (!auth.client) return;
    setBusy(true);
    setError(null);
    const s = signsAs.trim();
    try {
      let invite;
      try {
        invite = await createCoParentInvite(auth.client, book.id, s || null, await draftFor(s, false));
      } catch (e) {
        // An id or token collision is the phone's to fix: one more try with a new draft.
        if (inviteErrorKind(e) !== 'retry_new_invite') throw e;
        invite = await createCoParentInvite(auth.client, book.id, s || null, await draftFor(s, true));
      }
      const shared = await shareInviteLink(invite.url, child, s || null);
      trackInviteCreated({ role: 'parent', channel: 'share_sheet', shared: shared === 'shared', childIndex: childIndexOf(book.id) });
      haptic('success');
      draft.current = null; // the next invite from this sheet is a new one
      setDone(true);
    } catch (e) {
      const kind = inviteErrorKind(e);
      track('invite_failed', { stage: 'create', reason: trackedInviteReason(kind) });
      setError(kind);
    } finally {
      setBusy(false);
    }
  };

  if (done) {
    return (
      <SheetFrame
        footer={
          <Button testID="inviteNew.close" size="lg" onPress={close}>
            <Text>{familyCopy.accept.close}</Text>
          </Button>
        }>
        <SheetTitle>{fill(k.title, { child })}</SheetTitle>
        <SheetBody>{k.done}</SheetBody>
      </SheetFrame>
    );
  }

  return (
    <SheetFrame closeLabel={familyCopy.accept.close} closeDisabled={busy}>
      <View testID="inviteNew.screen" className="gap-5">
        <SheetTitle>{fill(k.title, { child })}</SheetTitle>
        {full ? (
          // F11-REQ-004: two parents already; nothing to share (D-069).
          <SheetBody>{fill(k.full, { child })}</SheetBody>
        ) : (
          <>
            <SheetBody muted>{fill(k.body, { child })}</SheetBody>
            <AccountGate trigger="invite_create" signInBody={familyCopy.card.signedOutNote}>
              <View className="gap-5">
                <View className="gap-2">
                  <Text className="text-base font-medium text-muted-foreground">{fill(k.signsAsLabel, { child })}</Text>
                  <TextInput
                    testID="inviteNew.signsAs"
                    className="min-h-14 rounded-2xl border border-border bg-card px-4 text-lg text-foreground"
                    value={signsAs}
                    onChangeText={setSignsAs}
                    placeholder={k.signsAsPlaceholder}
                    placeholderTextColor={c.textMuted}
                    maxLength={30}
                    autoCapitalize="words"
                    autoCorrect={false}
                    returnKeyType="done"
                    editable={!busy}
                    accessibilityLabel={fill(k.signsAsLabel, { child })}
                    accessibilityHint={k.signsAsHelp}
                  />
                  <Text className="text-sm text-muted-foreground">{k.signsAsHelp}</Text>
                </View>
                <View className="gap-1">
                  <Text className="text-base leading-6 text-muted-foreground">{fill(k.oneBook, { child })}</Text>
                  <Text className="text-base leading-6 text-muted-foreground">{k.linkNote}</Text>
                </View>
                <ErrorLine message={error ? fill(familyCopy.errors[error], { child }) : null} />
                {error === 'consent_needed' ? (
                  <QuietButton label={familyCopy.card.finishSetup} onPress={() => router.push('/sign-in/consent')} />
                ) : null}
                {busy ? (
                  <Busy label={k.working} />
                ) : (
                  <Button testID="inviteNew.share" size="lg" onPress={() => void share()}>
                    <Text>{k.share}</Text>
                  </Button>
                )}
              </View>
            </AccountGate>
          </>
        )}
      </View>
    </SheetFrame>
  );
}
