// android: same
/**
 * "I was invited" (PRD V2 F11 6.2 B; PRD A F7; A-REQ-028, A-REQ-029; BL-322, security review H2).
 * Co-parent only at v1.0 (B1).
 *
 * 1. The token is already in the Keychain when a link opened the app (+native-intent); without a
 *    link, the person pastes it (read only from what they paste; the clipboard is never read on
 *    its own, A-REQ-029).
 * 2. Not signed in: a generic line and Sign in. Nothing about the invite is known or shown yet.
 * 3. Signed in: peek_invite shows who invited them (the inviter's sign-off only, never the
 *    child's name), and nothing happens until they tap Join. "Not now" forgets the link.
 * 4. Join: consent and sync first if missing (accept needs them, SCCON), then
 *    accept_child_invite, once. Final errors (expired, used, cancelled, not found, already a
 *    member, two parents already) clear the token; a network error keeps it for another try.
 * 5. Joined: sync brings the book to this phone. The person sets what the child calls them in
 *    this book (prefilled with the inviter's suggestion, F11-REQ-024). The open book changes only
 *    when they tap "Open the book".
 *
 * Which step shows, and which call runs next, is lib/family/join-flow.logic.ts (tested in Node).
 */
import { brand } from '@scribe/brand';
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { TextInput, View } from 'react-native';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { InviteComingSoon } from '@/components/family/invite-coming-soon';
import { authUserId } from '@/lib/auth/machine.logic';
import { useAuth } from '@/lib/auth/session-provider';
import { serverFeaturesEnabled } from '@/lib/capabilities';
import { inviteDestination } from '@/lib/family/entry.logic';
import { AccountGate, Busy, ErrorLine, QuietButton, SheetBody, SheetFrame, SheetTitle, useCloseSheet, useColors } from '@/lib/auth/ui';
import { fill } from '@/lib/copy';
import { familyCopy } from '@/lib/family/copy';
import { FINAL_INVITE_ERRORS, inviteErrorKind, trackedInviteReason, type InviteErrorKind } from '@/lib/family/invite-errors.logic';
import { parseInviteInput } from '@/lib/family/invite-link.logic';
import type { InvitePreview } from '@/lib/family/invite-preview.logic';
import { acceptInvite, bookName, peekInvite } from '@/lib/family/invites';
import { joinedView, joinErrorLine, joinPlan } from '@/lib/family/join-flow.logic';
import { track } from '@/lib/analytics/track';
import { clearPendingInvite, readPendingInvite, savePendingInvite } from '@/lib/family/pending-invite';
import { haptic } from '@/lib/haptics';
import { getChild, setActiveChildId, subscribe, updateChild } from '@/lib/store';

/** Fixed per build (lib/capabilities.ts). Off: co-parent sharing is coming soon, and no token is kept. */
export default function JoinBookRoute() {
  return inviteDestination('invite_join', serverFeaturesEnabled()) === 'flow' ? <JoinBook /> : <InviteComingSoon />;
}

function JoinBook() {
  const auth = useAuth();
  const c = useColors();
  const close = useCloseSheet();
  const a = familyCopy.accept;
  const [loaded, setLoaded] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [pasted, setPasted] = useState('');
  const [pasteError, setPasteError] = useState(false);
  const [preview, setPreview] = useState<InvitePreview | null>(null);
  const [busy, setBusy] = useState<'peek' | 'accept' | null>(null);
  const [wantsJoin, setWantsJoin] = useState(false);
  const [failedAt, setFailedAt] = useState<'peek' | 'accept'>('peek');
  const [error, setError] = useState<InviteErrorKind | null>(null);
  const [joined, setJoined] = useState<{ childId: string; name: string | null } | null>(null);
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
    // The catalogue knows create and accept; a peek is the first half of accepting.
    track('invite_failed', { stage: 'accept', reason: trackedInviteReason(kind) });
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
      setJoined({ childId, name });
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
    const t = parseInviteInput(pasted, brand.web.origin);
    if (!t) {
      setPasteError(true);
      return;
    }
    await savePendingInvite(t);
    track('invite_opened', { via: 'paste', signed_in: auth.signedIn });
    started.current = null;
    setPreview(null);
    setWantsJoin(false);
    setPasteError(false);
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
        <Busy label={a.title} />
      </SheetFrame>
    );
  }

  if (plan.view === 'paste') {
    return (
      <SheetFrame closeLabel={a.close}>
        <View testID="invite.screen" className="gap-5">
          <SheetTitle>{a.title}</SheetTitle>
          <SheetBody muted>{a.pasteHelp}</SheetBody>
          <View className="gap-2">
            <Text className="text-base font-medium text-muted-foreground">{a.pasteLabel}</Text>
            <TextInput
              testID="invite.paste.input"
              className="min-h-14 rounded-2xl border border-border bg-card px-4 text-base text-foreground"
              value={pasted}
              onChangeText={(v) => {
                setPasted(v);
                setPasteError(false);
              }}
              placeholder={a.pastePlaceholder}
              placeholderTextColor={c.textMuted}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
              multiline
              accessibilityLabel={a.pasteLabel}
            />
          </View>
          <ErrorLine message={pasteError ? a.notRecognised : null} />
          <Button testID="invite.paste.continue" size="lg" onPress={() => void submitPaste()} disabled={pasted.trim().length === 0}>
            <Text>{a.continue}</Text>
          </Button>
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
              onPress={() => {
                haptic('tap');
                setWantsJoin(true);
              }}>
              <Text>{a.join}</Text>
            </Button>
            <QuietButton label={a.notNow} onPress={() => void notNow()} />
          </>
        }>
        <View testID="invite.ask" className="gap-5">
          <SheetTitle>{a.askTitle}</SheetTitle>
          <SheetBody>{preview.inviter ? fill(a.invitedBy, { inviter: preview.inviter }) : a.invitedByUnknown}</SheetBody>
          <SheetBody muted>{a.askBody}</SheetBody>
        </View>
      </SheetFrame>
    );
  }

  if (plan.view === 'joined' && joined) {
    return <Joined childId={joined.childId} fallbackName={joined.name} />;
  }

  return (
    <SheetFrame closeLabel={a.close}>
      <View testID="invite.screen" className="gap-5">
        <SheetTitle>{plan.view === 'signIn' ? a.invitedTitle : a.title}</SheetTitle>
        {plan.view === 'signIn' || plan.view === 'account' ? (
          // Sign in, finish consent, or turn sync back on; the sheet goes on by itself once it can.
          <AccountGate trigger="invite" signInBody={a.signInBody}>
            <Busy label={a.joining} />
          </AccountGate>
        ) : null}
        {plan.view === 'peeking' ? <Busy label={a.title} /> : null}
        {plan.view === 'joining' ? (
          <View testID="invite.joining">
            <Busy label={a.joining} />
          </View>
        ) : null}
        {plan.view === 'failed' && error ? (
          <View testID="invite.error" className="gap-3">
            <ErrorLine message={errorLine(error)} />
            {FINAL_INVITE_ERRORS.includes(error) ? (
              <QuietButton label={a.pasteAnother} onPress={pasteAnother} />
            ) : (
              <Button size="lg" onPress={retry}>
                <Text>{a.tryAgain}</Text>
              </Button>
            )}
          </View>
        ) : null}
      </View>
    </SheetFrame>
  );
}

/** The join sheet's line for an error (lib/family/join-flow.logic.ts joinErrorLine). */
function errorLine(kind: InviteErrorKind): string {
  const a = familyCopy.accept;
  const line = joinErrorLine(kind);
  if (line === 'needsSync') return a.needsSync;
  if (line === 'tryLater') return a.tryLater;
  return fill(familyCopy.errors[line], { child: '' });
}

/**
 * Joined. Waits for sync to bring the book, then asks what the child calls this parent in it
 * (prefilled with the inviter's suggestion) and offers to open it. Open needs a sign-off, and a
 * line says so while the field is empty (lib/family/join-flow.logic.ts joinedView). Nothing
 * switches by itself.
 */
function Joined({ childId, fallbackName }: { childId: string; fallbackName: string | null }) {
  const c = useColors();
  const close = useCloseSheet();
  const a = familyCopy.accept;
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
    const s = signsAs.trim().slice(0, 30);
    if (book && s && s !== book.signsAs) updateChild(childId, { signsAs: s });
  };
  const open = () => {
    saveSignature();
    // The one place the open book changes: the person tapped "Open the book" (BL-322).
    setActiveChildId(childId);
    router.dismissTo('/');
  };

  return (
    <SheetFrame
      footer={
        book ? (
          <>
            <Button testID="invite.open" size="lg" onPress={open} disabled={!view.canOpen}>
              <Text>{a.open}</Text>
            </Button>
            <QuietButton
              label={a.close}
              onPress={() => {
                saveSignature();
                close();
              }}
            />
          </>
        ) : (
          <Button testID="invite.close" size="lg" onPress={close}>
            <Text>{a.close}</Text>
          </Button>
        )
      }>
      <View testID="invite.joined" className="gap-5">
        <SheetTitle>{child ? fill(a.joinedTitle, { child }) : a.title}</SheetTitle>
        <SheetBody>{a.joinedBody}</SheetBody>
        {!book && child ? <SheetBody muted>{fill(a.joinedWaiting, { child })}</SheetBody> : null}
        {book ? (
          <View className="gap-2">
            <Text className="text-base font-medium text-muted-foreground">{fill(a.signsAsLabel, { child })}</Text>
            <TextInput
              testID="invite.signsAs"
              className="min-h-14 rounded-2xl border border-border bg-card px-4 text-lg text-foreground"
              value={signsAs}
              onChangeText={(v) => {
                edited.current = true;
                setSignsAs(v);
              }}
              placeholder={a.signsAsPlaceholder}
              placeholderTextColor={c.textMuted}
              maxLength={30}
              autoCapitalize="words"
              autoCorrect={false}
              returnKeyType="done"
              accessibilityLabel={fill(a.signsAsLabel, { child })}
              accessibilityHint={a.signsAsHelp}
            />
            <Text className="text-sm text-muted-foreground">{a.signsAsHelp}</Text>
            {view.needsSignsAs ? (
              <Text testID="invite.signsAs.needed" accessibilityLiveRegion="polite" className="text-sm text-foreground">
                {fill(a.signsAsNeeded, { child })}
              </Text>
            ) : null}
          </View>
        ) : null}
      </View>
    </SheetFrame>
  );
}
