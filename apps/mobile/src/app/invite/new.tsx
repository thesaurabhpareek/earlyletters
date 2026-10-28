// android: same
/**
 * Invite a co-parent (EXPERIENCE_PASS_2026-10 S58; PRD V2 F11 6.2 A; B-REQ-007, F11-REQ-001, F11-REQ-004; co-parent
 * only at v1.0, B1). `/invite/new?childId=<id>` from the Family tab or a child's settings.
 *
 * The sheet is about this book: its cover (132 x 176, closed, the child's name) centred at the top, the title, the
 * body, then what the child calls the other parent in the letter face with S06's chips under it, so the cover's foot
 * line reads "From Papa" as it is typed (after each 300 ms pause; a chip at once). `oneBook` and `linkNote` in
 * footnote. "Share invite link" opens the iOS share sheet: the person sends the link themselves, to someone they
 * chose. No contact picker, and the app sends nothing on its own. Signed out, the first step is sign-in (the
 * sign-in sheet's own `invite_create` body); consent or sync missing, the step that finishes it (AccountGate).
 *
 * The phone makes the invite (lib/family/invite-draft.logic.ts, F11 D5): an id, a 32-byte token and its hash. Only
 * the hash goes to the server; the link https://<brand host>/j#t=<token> carries no child name (BL-348, #165), goes
 * straight to the share sheet and is never stored, shown again, logged or tracked. One draft per sheet and
 * signature, so a retry or a second tap is one invite (F11-U15, G-07). Typed codes are not made: build 2 invites
 * are links only (the coordinator's ruling on F11-REQ-001 and -002, 28 Oct 2026).
 *
 * When the share sheet closes after the link was sent, this sheet closes too, and the Family tab says "The invite
 * waits on the Family tab until they join." as its toast (components/family/family-notice.ts), with the pending row
 * entering there. When it was dismissed without sending, this sheet stays at Share with the same draft (afterShare).
 *
 * A book that already has two parents (D-069) shows "{child}'s book has two parents." instead of Share, from the
 * last pull or from the server's SCCAP (F11-REQ-004, F11-REQ-026).
 *
 * While `killSwitches.invites` is on (lib/family/invites-switch.ts), Share says invites are paused and sends
 * nothing; the draft is kept, so the next tap after the switch lifts is the same invite.
 */
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import { authCopy } from '@scribe/content';
import { BookCover } from '@/components/book/book-cover';
import { familyNotice } from '@/components/family/family-notice';
import { afterShare, inviteSheetView } from '@/components/family/invite-sheet.logic';
import { InviteComingSoon } from '@/components/family/invite-coming-soon';
import { Button } from '@/components/ui/button';
import { Chip, ChipGroup } from '@/components/ui/choice-group';
import { Text } from '@/components/ui/text';
import { TextField } from '@/components/ui/text-field';
import { useAuth } from '@/lib/auth/session-provider';
import { serverFeaturesEnabled } from '@/lib/capabilities';
import { inviteDestination } from '@/lib/family/entry.logic';
import { AccountGate, ErrorLine, QuietButton, SheetBody, SheetFrame, SheetTitle, useCloseSheet } from '@/lib/auth/ui';
import { copy, fill } from '@/lib/copy';
import { familyCopy } from '@/lib/family/copy';
import { childIndexOf, track, trackInviteCreated } from '@/lib/analytics/track';
import { makeInviteDraft } from '@/lib/family/device-invite';
import type { InviteDraft } from '@/lib/family/invite-draft.logic';
import { inviteErrorKind, NEW_DRAFT_ERRORS, trackedInviteReason, type InviteErrorKind } from '@/lib/family/invite-errors.logic';
import { createCoParentInvite } from '@/lib/family/invites';
import { familyTabState } from '@/lib/family/members.logic';
import { shareInviteLink } from '@/lib/family/share';
import { haptic } from '@/lib/haptics';
import { getChild, listMembers } from '@/lib/store';

/** The cover's foot line follows the field after a typing pause, as on S05 and S06. */
const COVER_PAUSE_MS = 300;
/** A sign-off is at most 30 characters (lib/family/invites.ts). */
const SIGNS_AS_MAX = 30;

function useSettled<T>(value: T, ms: number): T {
  const [settled, setSettled] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setSettled(value), ms);
    return () => clearTimeout(id);
  }, [value, ms]);
  return settled;
}

/** Fixed per build (lib/capabilities.ts). Off: co-parent sharing is coming soon. */
export default function InviteCoParentRoute() {
  return inviteDestination('invite_new', serverFeaturesEnabled()) === 'flow' ? <InviteCoParent /> : <InviteComingSoon />;
}

function InviteCoParent() {
  const auth = useAuth();
  const close = useCloseSheet();
  const { childId } = useLocalSearchParams<{ childId?: string }>();
  const book = childId ? getChild(childId) : null;
  const k = familyCopy.create;
  const ideas = copy.onboarding.signsAs;
  const [signsAs, setSignsAs] = useState('');
  const [chosen, setChosen] = useState<string | null>(null);
  const typed = useSettled(signsAs, COVER_PAUSE_MS);
  const coverSignsAs = (chosen === signsAs ? signsAs : typed).trim();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<InviteErrorKind | null>(null);
  const draft = useRef<{ signsAs: string; draft: InviteDraft } | null>(null);

  const full = !!book && (error === 'book_full' || familyTabState({ role: book.role, members: listMembers(book.id), openInvites: 0 }).full);
  const view = inviteSheetView({ hasBook: !!book, full });

  if (!book || view === 'missing') {
    // No book on this phone (stale link to this screen): nothing to invite to.
    return (
      <SheetFrame closeLabel={familyCopy.accept.close}>
        <ErrorLine message={familyCopy.errors.book_deleted} />
      </SheetFrame>
    );
  }
  const child = book.name;

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
        // An id, code or token collision is the phone's to fix: one more try with a new draft.
        if (!NEW_DRAFT_ERRORS.includes(inviteErrorKind(e))) throw e;
        invite = await createCoParentInvite(auth.client, book.id, s || null, await draftFor(s, true));
      }
      const shared = await shareInviteLink(invite.url, child, s || null);
      trackInviteCreated({ role: 'parent', channel: 'share_sheet', shared: shared === 'shared', childIndex: childIndexOf(book.id) });
      // Dismissed without sending: the sheet stays at Share with the same draft, no tick and no toast (afterShare).
      const after = afterShare(shared);
      if (!after.close) return;
      haptic('success');
      draft.current = null; // the next invite from this sheet is a new one
      // The link went out: this sheet closes, and the Family tab says where the invite waits.
      familyNotice.leave(k.done);
      close();
    } catch (e) {
      const kind = inviteErrorKind(e);
      // A pause sent nothing, so there is no failed invite to count.
      if (kind !== 'paused') track('invite_failed', { stage: 'create', reason: trackedInviteReason(kind) });
      setError(kind);
    } finally {
      setBusy(false);
    }
  };

  return (
    <SheetFrame closeLabel={familyCopy.accept.close} closeDisabled={busy}>
      <View testID="inviteNew.screen" className="gap-5">
        {/* The invite is into this book: its cover, closed, with the name the parent gave it. Decorative: the title says it. */}
        <View className="items-center pb-1">
          <BookCover name={child} signsAs={coverSignsAs || undefined} size="md" />
        </View>
        <SheetTitle>{fill(k.title, { child })}</SheetTitle>
        {view === 'full' ? (
          // F11-REQ-004: two parents already; nothing to share (D-069).
          <SheetBody>{fill(k.full, { child })}</SheetBody>
        ) : (
          <>
            <SheetBody muted>{fill(k.body, { child })}</SheetBody>
            <AccountGate trigger="invite_create" signInBody={authCopy.sheet.bodies.invite_create}>
              <View className="gap-5">
                <View className="gap-3">
                  <TextField
                    testID="inviteNew.signsAs"
                    label={fill(k.signsAsLabel, { child })}
                    face="serif"
                    value={signsAs}
                    onChangeText={(v) => setSignsAs(v.slice(0, SIGNS_AS_MAX))}
                    helper={k.signsAsHelp}
                    placeholder={k.signsAsPlaceholder}
                    maxLength={SIGNS_AS_MAX}
                    autoCapitalize="words"
                    autoCorrect={false}
                    returnKeyType="done"
                    editable={!busy}
                  />
                  <ChipGroup label={ideas.examplesLabel}>
                    {ideas.examples.map((ex) => (
                      <Chip
                        key={ex}
                        label={ex}
                        selected={signsAs === ex}
                        onPress={() => {
                          setChosen(ex);
                          setSignsAs(ex);
                        }}
                      />
                    ))}
                  </ChipGroup>
                </View>
                <View className="gap-1">
                  <Text variant="footnote">{fill(k.oneBook, { child })}</Text>
                  <Text variant="footnote">{k.linkNote}</Text>
                </View>
                <ErrorLine message={error ? fill(familyCopy.errors[error], { child }) : null} />
                {error === 'consent_needed' ? (
                  <QuietButton label={familyCopy.card.finishSetup} onPress={() => router.push('/sign-in/consent')} />
                ) : null}
                {/* While the link is made, the primary keeps its size and shows its busy line inside it. */}
                <Button testID="inviteNew.share" size="lg" loading={busy} label={busy ? k.working : k.share} onPress={() => void share()} />
              </View>
            </AccountGate>
          </>
        )}
      </View>
    </SheetFrame>
  );
}
