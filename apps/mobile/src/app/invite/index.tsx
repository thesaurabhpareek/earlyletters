// android: same
/**
 * Joining a book: "I was invited", or an invite link (EXPERIENCE_PASS_2026-10 S59; PRD V2 F11 6.2 B; PRD A F7;
 * A-REQ-028, A-REQ-029; BL-322, security review H2). Co-parent only at v1.0 (B1).
 *
 * 1. The token is already in the Keychain when a link opened the app (+native-intent); without a
 *    link, the person pastes it (read only from what they paste; the clipboard is never read on
 *    its own, A-REQ-029). Build 2 invites are links only: a typed code is not read, and gets the
 *    not-recognised line (components/family/join-sheet.logic.ts).
 * 2. Not signed in: a generic line, Sign in and Not now. Nothing about the invite is known or shown
 *    yet: no cover, no names.
 * 3. Signed in: peek_invite ("Opening the invite") shows who invited them (the inviter's sign-off
 *    only, set as a letter's signature, never the child's name), and nothing happens until they tap
 *    Join. "Not now" forgets the link.
 * 4. Join: consent and sync first if missing (accept needs them, SCCON), then
 *    accept_child_invite, once. Final errors (expired, used, cancelled, not found, already a
 *    member, two parents already) clear the token; any other (offline, a server that did not
 *    answer, a pause) keeps it for Try again.
 * 5. Joined: the book cover appears for the first time, with the child's name, and opens to the
 *    flyleaf; "Your letters and Mama's sit side by side, each signed."; while sync brings the book,
 *    a line and a thin bar with no count. The person sets what the child calls them in this book
 *    (prefilled with the inviter's suggestion, F11-REQ-024). The open book changes only when they
 *    tap "Open the book", which lands on the Book with its light rising once (5.8 row 12).
 *
 * Views replace each other in place inside the one sheet (the frame's own cross-fade), never a push.
 * Which step shows, and which call runs next, is lib/family/join-flow.logic.ts (tested in Node);
 * what each step says is components/family/join-sheet.logic.ts.
 *
 * While `killSwitches.invites` is on (lib/family/invites-switch.ts), the look and the join say
 * invites are paused and send nothing. `paused` is not a final error, so the token stays in the
 * Keychain and Try again goes on once the switch lifts.
 */
import { brand } from '@scribe/brand';
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import { InviteComingSoon } from '@/components/family/invite-coming-soon';
import { JoinAsk, JoinedCover, WaitingBar } from '@/components/family/join-ask';
import { JOINED_LANDING, joinedBody, joinFailure, joinTitle, readPasted } from '@/components/family/join-sheet.logic';
import { Button } from '@/components/ui/button';
import { Chip, ChipGroup } from '@/components/ui/choice-group';
import { Text } from '@/components/ui/text';
import { TextField } from '@/components/ui/text-field';
import { authUserId } from '@/lib/auth/machine.logic';
import { useAuth } from '@/lib/auth/session-provider';
import { serverFeaturesEnabled } from '@/lib/capabilities';
import { copy, fill } from '@/lib/copy';
import { inviteDestination } from '@/lib/family/entry.logic';
import { AccountGate, Busy, ErrorLine, QuietButton, SheetFrame, SheetTitle, useCloseSheet } from '@/lib/auth/ui';
import { familyCopy } from '@/lib/family/copy';
import { FINAL_INVITE_ERRORS, inviteErrorKind, trackedInviteReason, type InviteErrorKind } from '@/lib/family/invite-errors.logic';
import type { InvitePreview } from '@/lib/family/invite-preview.logic';
import { acceptInvite, bookName, peekInvite } from '@/lib/family/invites';
import { joinedView, joinPlan } from '@/lib/family/join-flow.logic';
import { track } from '@/lib/analytics/track';
import { clearPendingInvite, readPendingInvite, savePendingInvite } from '@/lib/family/pending-invite';
import { haptic } from '@/lib/haptics';
import { getChild, setActiveChildId, subscribe, updateChild } from '@/lib/store';

/** A sign-off is at most 30 characters (lib/family/invites.ts). */
const SIGNS_AS_MAX = 30;

/** Fixed per build (lib/capabilities.ts). Off: co-parent sharing is coming soon, and no token is kept. */
export default function JoinBookRoute() {
  return inviteDestination('invite_join', serverFeaturesEnabled()) === 'flow' ? <JoinBook /> : <InviteComingSoon />;
}

function JoinBook() {
  const auth = useAuth();
  const close = useCloseSheet();
  const a = familyCopy.accept;
  const [loaded, setLoaded] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [pasted, setPasted] = useState('');
  const [pasteError, setPasteError] = useState<string | null>(null);
  const [preview, setPreview] = useState<InvitePreview | null>(null);
  const [busy, setBusy] = useState<'peek' | 'accept' | null>(null);
  const [wantsJoin, setWantsJoin] = useState(false);
  const [failedAt, setFailedAt] = useState<'peek' | 'accept'>('peek');
  const [error, setError] = useState<InviteErrorKind | null>(null);
  const [joined, setJoined] = useState<{ childId: string; name: string | null; inviter: string | null } | null>(null);
  const started = useRef<'peek' | 'accept' | null>(null);

  useEffect(() => {
    void readPendingInvite().then((p) => {
      if (p) track('invite_opened', { via: 'link', signed_in: auth.signedIn });
      setToken(p?.token ?? null);
      setLoaded(true);
    });
    // Runs once: the token is read when the sheet opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // What an invite said, and a tap on Join, belong to the account that saw them: a different account
  // (sign-out, then someone else signs in on this phone) looks again and is asked again.
  const userId = authUserId(auth.state);
  useEffect(() => {
    started.current = null;
    setPreview(null);
    setWantsJoin(false);
  }, [userId]);

  const plan = joinPlan({
    loaded,
    token,
    signedIn: auth.signedIn && !!auth.client,
    canSync: auth.canSync,
    preview,
    busy,
    wantsJoin,
    joinedChildId: joined?.childId ?? null,
    error,
  });

  const fail = async (e: unknown, stage: 'peek' | 'accept', t: string) => {
    const kind = inviteErrorKind(e);
    // The catalogue knows create and accept; a peek is the first half of accepting. A pause sent nothing.
    if (kind !== 'paused') track('invite_failed', { stage: 'accept', reason: trackedInviteReason(kind) });
    if (FINAL_INVITE_ERRORS.includes(kind)) await clearPendingInvite(t);
    setFailedAt(stage);
    setError(kind);
  };

  // Look first. Never joins.
  const peek = async (t: string) => {
    if (!auth.client) return;
    setBusy('peek');
    try {
      const p = await peekInvite(auth.client, t);
      if (p.role !== 'parent') {
        // v1.0 has no family-member path (B1, D4): this build cannot use the invite.
        await clearPendingInvite(t);
        setFailedAt('peek');
        setError('not_found');
      } else {
        setPreview(p);
      }
    } catch (e) {
      await fail(e, 'peek', t);
    } finally {
      setBusy(null);
    }
  };

  // Only after a tap on Join (or for an invite this person already accepted).
  const accept = async (t: string) => {
    if (!auth.client) return;
    setBusy('accept');
    try {
      const childId = await acceptInvite(auth.client, t);
      await clearPendingInvite(t);
      const name = getChild(childId)?.name ?? (await bookName(auth.client, childId).catch(() => null));
      haptic('success');
      setJoined({ childId, name, inviter: preview?.inviter ?? null });
    } catch (e) {
      await fail(e, 'accept', t);
    } finally {
      setBusy(null);
    }
  };

  // Run the one call the plan asks for, once per step.
  useEffect(() => {
    if (!token || plan.next === 'none' || started.current === plan.next) return;
    started.current = plan.next;
    void (plan.next === 'peek' ? peek(token) : accept(token));
    // peek and accept read the current client; re-running on their identity would call twice.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [plan.next, token]);

  const retry = () => {
    started.current = null;
    setError(null);
    if (failedAt === 'peek') setPreview(null);
  };

  const submitPaste = async () => {
    const read = readPasted(pasted, brand.web.origin);
    if ('error' in read) {
      // Nothing is sent: the field stays, with the line that says what to paste.
      setPasteError(read.error);
      return;
    }
    const t = read.token;
    await savePendingInvite(t);
    track('invite_opened', { via: 'paste', signed_in: auth.signedIn });
    started.current = null;
    setPreview(null);
    setWantsJoin(false);
    setPasteError(null);
    setToken(t);
  };

  const pasteAnother = () => {
    started.current = null;
    setError(null);
    setPreview(null);
    setWantsJoin(false);
    setPasted('');
    setToken(null);
  };

  const notNow = async () => {
    if (token) await clearPendingInvite(token);
    close();
  };

  if (plan.view === 'loading') {
    return (
      <SheetFrame>
        <SheetTitle>{a.title}</SheetTitle>
      </SheetFrame>
    );
  }

  if (plan.view === 'paste') {
    return (
      <SheetFrame
        closeLabel={a.close}
        footer={<Button testID="invite.paste.continue" size="lg" label={a.continue} onPress={() => void submitPaste()} disabled={pasted.trim().length === 0} />}>
        <View testID="invite.screen" className="gap-5">
          <SheetTitle>{joinTitle('paste', null)}</SheetTitle>
          <TextField
            testID="invite.paste.input"
            label={a.pasteLabel}
            helper={a.pasteHelp}
            error={pasteError}
            value={pasted}
            onChangeText={(v) => {
              setPasted(v);
              setPasteError(null);
            }}
            placeholder={a.pastePlaceholder}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
            textContentType="URL"
            multiline
          />
        </View>
      </SheetFrame>
    );
  }

  if (plan.view === 'ask' && preview) {
    return (
      <SheetFrame
        footer={
          <>
            <Button
              testID="invite.join"
              size="lg"
              label={a.join}
              onPress={() => {
                haptic('tap');
                setWantsJoin(true);
              }}
            />
            <QuietButton label={a.notNow} onPress={() => void notNow()} />
          </>
        }>
        <JoinAsk inviter={preview.inviter} />
      </SheetFrame>
    );
  }

  if (plan.view === 'joined' && joined) {
    return <Joined childId={joined.childId} fallbackName={joined.name} inviter={joined.inviter} />;
  }

  const failure = plan.view === 'failed' && error ? joinFailure(error) : null;
  return (
    <SheetFrame closeLabel={a.close}>
      <View testID="invite.screen" className="gap-5">
        <SheetTitle>{joinTitle(plan.view, null)}</SheetTitle>
        {plan.view === 'signIn' || plan.view === 'account' ? (
          // Sign in, finish consent, or turn sync back on; the sheet goes on by itself once it can.
          <AccountGate trigger="invite" signInBody={a.signInBody}>
            <Busy label={a.joining} />
          </AccountGate>
        ) : null}
        {plan.view === 'signIn' ? <QuietButton label={a.notNow} onPress={() => void notNow()} /> : null}
        {plan.view === 'peeking' ? <Busy label={a.peeking} /> : null}
        {plan.view === 'joining' ? (
          <View testID="invite.joining">
            <Busy label={a.joining} />
          </View>
        ) : null}
        {failure ? (
          <View testID="invite.error" className="gap-3">
            <ErrorLine message={failure.line} />
            {failure.action === 'pasteAnother' ? (
              <QuietButton label={a.pasteAnother} onPress={pasteAnother} />
            ) : (
              <Button size="lg" label={a.tryAgain} onPress={retry} />
            )}
          </View>
        ) : null}
      </View>
    </SheetFrame>
  );
}

/**
 * Joined. The cover appears for the first time with the child's name and opens; the line under the title says
 * whose letters sit together. While sync brings the book it waits (a line and a thin bar with no count); then it
 * asks what the child calls this parent in it (prefilled with the inviter's suggestion) and offers to open it.
 * Open needs a sign-off, and a line says so while the field is empty (lib/family/join-flow.logic.ts joinedView).
 * Nothing switches by itself.
 */
function Joined({ childId, fallbackName, inviter }: { childId: string; fallbackName: string | null; inviter: string | null }) {
  const close = useCloseSheet();
  const a = familyCopy.accept;
  const ideas = copy.onboarding.signsAs;
  const [book, setBook] = useState(() => getChild(childId));
  const [signsAs, setSignsAs] = useState(() => book?.signsAs ?? '');
  const edited = useRef(false);

  useEffect(
    () =>
      subscribe(() => {
        const b = getChild(childId);
        setBook(b);
        // Fill in the suggestion once it arrives, unless the person already typed.
        if (b && !edited.current) setSignsAs(b.signsAs);
      }),
    [childId],
  );

  const child = book?.name ?? fallbackName ?? '';
  const view = joinedView(book, signsAs);
  const saveSignature = () => {
    const s = signsAs.trim().slice(0, SIGNS_AS_MAX);
    if (book && s && s !== book.signsAs) updateChild(childId, { signsAs: s });
  };
  const type = (v: string) => {
    edited.current = true;
    setSignsAs(v.slice(0, SIGNS_AS_MAX));
  };
  const open = () => {
    saveSignature();
    // The one place the open book changes: the person tapped "Open the book" (BL-322).
    setActiveChildId(childId);
    // The Book on this book, whose light rises once for the second parent's first evening in it (5.8 row 12).
    router.dismissTo(JOINED_LANDING);
  };

  return (
    <SheetFrame
      footer={
        book ? (
          <>
            <Button testID="invite.open" size="lg" onPress={open} disabled={!view.canOpen} label={a.open} />
            <QuietButton
              label={a.close}
              onPress={() => {
                saveSignature();
                close();
              }}
            />
          </>
        ) : (
          <Button testID="invite.close" size="lg" label={a.close} onPress={close} />
        )
      }>
      <View testID="invite.joined" className="gap-5">
        {/* The child's name appears here first, on the cover that opens (BL-322). */}
        {child ? <JoinedCover child={child} inviter={inviter} /> : null}
        <Text variant="title1" asHeading={1}>
          {child ? fill(a.joinedTitle, { child }) : a.title}
        </Text>
        <Text variant="body">{joinedBody(inviter)}</Text>
        {!book && child ? (
          <View className="gap-2">
            <Text variant="footnote" accessibilityLiveRegion="polite">
              {fill(a.joinedWaiting, { child })}
            </Text>
            <WaitingBar />
          </View>
        ) : null}
        {book ? (
          <View className="gap-3">
            <TextField
              testID="invite.signsAs"
              label={fill(a.signsAsLabel, { child })}
              face="serif"
              helper={a.signsAsHelp}
              value={signsAs}
              onChangeText={type}
              placeholder={a.signsAsPlaceholder}
              maxLength={SIGNS_AS_MAX}
              autoCapitalize="words"
              autoCorrect={false}
              returnKeyType="done"
            />
            <ChipGroup label={ideas.examplesLabel}>
              {ideas.examples.map((ex) => (
                <Chip key={ex} label={ex} selected={signsAs === ex} onPress={() => type(ex)} />
              ))}
            </ChipGroup>
            {view.needsSignsAs ? (
              <Text testID="invite.signsAs.needed" variant="footnote" tone="default" accessibilityLiveRegion="polite">
                {fill(a.signsAsNeeded, { child })}
              </Text>
            ) : null}
          </View>
        ) : null}
      </View>
    </SheetFrame>
  );
}
