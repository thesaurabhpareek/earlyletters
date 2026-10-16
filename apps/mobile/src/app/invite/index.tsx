// android: same
/**
 * "I was invited" (PRD A F7, PRD B F5, A-REQ-028, -029; F11 6.2 B). Co-parent
 * only at launch (BRIEF decision 5).
 *
 * An invite asks before it joins and never switches the open book by itself
 * (BL-322 app part, security review H2, F11-REQ-006). The flow is the pure
 * reducer in lib/family/join.logic.ts; this screen renders its phase and runs
 * the one call the phase asks for:
 *
 * 1. The token is already in the Keychain when the link opened the app
 *    (+native-intent); without a link, the person pastes it (read only from
 *    what they paste; the clipboard is never read on its own).
 * 2. Not signed in: sign in. Consent missing: finish it (AccountGate).
 * 3. peek_invite(token): the inviter's sign-off name and nothing about the
 *    child. Then "Join this book as a parent? Invited by {signsAs}" with Join
 *    and Not now, nothing chosen.
 * 4. Join tapped: accept_child_invite(token), with one idempotency key for
 *    the tap and its retries (G-07). Final errors (expired, used, cancelled,
 *    not found, already a member, two parents already) clear the token; a
 *    network error keeps it for Try again. Not now clears it too.
 * 5. Joined: the sync agent brings the book to this phone. The open book
 *    changes only when the person taps Open the book.
 */
import { brand } from '@scribe/brand';
import { router } from 'expo-router';
import { useEffect, useReducer, useState } from 'react';
import { TextInput, View } from 'react-native';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { InviteComingSoon } from '@/components/family/invite-coming-soon';
import { JoinAsk } from '@/components/family/join-ask';
import { useAuth } from '@/lib/auth/session-provider';
import { serverFeaturesEnabled } from '@/lib/capabilities';
import { inviteDestination } from '@/lib/family/entry.logic';
import { AccountGate, Busy, ErrorLine, QuietButton, SheetBody, SheetFrame, SheetTitle, useCloseSheet, useColors } from '@/lib/auth/ui';
import { fill } from '@/lib/copy';
import { familyCopy } from '@/lib/family/copy';
import { inviteErrorKind, trackedInviteReason } from '@/lib/family/invite-errors.logic';
import { parseInviteInput } from '@/lib/family/invite-link.logic';
import { acceptInvite, bookName, peekInvite } from '@/lib/family/invites';
import { failedAction, JOIN_START, joinEffect, joinReducer } from '@/lib/family/join.logic';
import { track } from '@/lib/analytics/track';
import { clearPendingInvite, readPendingInvite, savePendingInvite } from '@/lib/family/pending-invite';
import { haptic } from '@/lib/haptics';
import { getChild, setActiveChildId, subscribe } from '@/lib/store';

/** v1.0: server features are off, so this entry shows co-parent sharing as coming soon (lib/family/entry.logic.ts). */
export default function JoinBookRoute() {
  return inviteDestination('invite_join', serverFeaturesEnabled()) === 'flow' ? <JoinBook /> : <InviteComingSoon />;
}

function JoinBook() {
  const auth = useAuth();
  const c = useColors();
  const close = useCloseSheet();
  const a = familyCopy.accept;
  const [state, dispatch] = useReducer(joinReducer, JOIN_START);
  const [token, setToken] = useState<string | null>(null);
  const [pasted, setPasted] = useState('');
  const [book, setBook] = useState<{ name: string | null; local: boolean } | null>(null);
  const ready = auth.canSync;

  // Signing in or finishing consent moves the flow on; losing the session moves it back.
  useEffect(() => {
    dispatch({ type: 'account', ready });
  }, [ready]);

  // The one call each phase asks for (join.logic.ts joinEffect). Nothing else reaches the server.
  const effect = joinEffect(state);
  useEffect(() => {
    let live = true;
    const client = auth.client;
    switch (effect) {
      case 'read_token':
        void readPendingInvite().then((p) => {
          if (!live) return;
          setToken(p?.token ?? null);
          if (p) track('invite_opened', { via: 'link', signed_in: auth.signedIn });
          dispatch({ type: 'loaded', hasToken: !!p, accountReady: ready });
        });
        break;
      case 'peek':
        if (!client || !token) break;
        peekInvite(client, token).then(
          (peek) => live && dispatch({ type: 'peeked', peek }),
          (e) => {
            const kind = inviteErrorKind(e);
            track('invite_failed', { stage: 'accept', reason: trackedInviteReason(kind) });
            if (live) dispatch({ type: 'peek_failed', error: kind });
          },
        );
        break;
      case 'accept':
        if (!client || !token) break;
        acceptInvite(client, token).then(
          async (childId) => {
            await clearPendingInvite();
            const name = await bookName(client, childId).catch(() => null);
            haptic('success');
            if (!live) return;
            setBook({ name, local: getChild(childId) !== null });
            dispatch({ type: 'accepted', childId });
          },
          (e) => {
            const kind = inviteErrorKind(e);
            track('invite_failed', { stage: 'accept', reason: trackedInviteReason(kind) });
            if (live) dispatch({ type: 'accept_failed', error: kind });
          },
        );
        break;
      case 'clear_token':
        void clearPendingInvite();
        break;
    }
    return () => {
      live = false;
    };
    // Runs once per phase: the reducer's state object changes only when the phase or its data does.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  // Joined: note when the book reaches this phone. Never make it the open book here (BL-322).
  const joinedId = state.phase === 'joined' ? state.childId : null;
  useEffect(() => {
    if (!joinedId) return;
    const check = () => {
      if (getChild(joinedId)) setBook((b) => (b && !b.local ? { ...b, local: true } : b));
    };
    check();
    return subscribe(check);
  }, [joinedId]);

  /** The only place the joined book becomes the open book: the person's tap. */
  const openJoinedBook = () => {
    if (!joinedId || !getChild(joinedId)) return;
    setActiveChildId(joinedId);
    router.dismissTo('/');
  };

  const submitPaste = async () => {
    const t = parseInviteInput(pasted, brand.web.origin);
    if (t) {
      await savePendingInvite(t);
      track('invite_opened', { via: 'paste', signed_in: auth.signedIn });
      setToken(t);
    }
    dispatch({ type: 'pasted', ok: !!t, accountReady: ready });
  };

  switch (state.phase) {
    case 'loading':
      return (
        <SheetFrame>
          <SheetTitle>{a.title}</SheetTitle>
          <Busy label={a.title} />
        </SheetFrame>
      );

    case 'paste':
      return (
        <SheetFrame closeLabel={a.close}>
          <SheetTitle>{a.title}</SheetTitle>
          <SheetBody muted>{a.pasteHelp}</SheetBody>
          <View className="gap-2">
            <Text className="text-base font-medium text-muted-foreground">{a.pasteLabel}</Text>
            <TextInput
              className="min-h-14 rounded-2xl border border-border bg-card px-4 text-base text-foreground"
              value={pasted}
              onChangeText={setPasted}
              placeholder={a.pastePlaceholder}
              placeholderTextColor={c.textMuted}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
              multiline
              accessibilityLabel={a.pasteLabel}
            />
          </View>
          <ErrorLine message={state.notRecognised ? a.notRecognised : null} />
          <Button size="lg" onPress={() => void submitPaste()} disabled={pasted.trim().length === 0}>
            <Text>{a.continue}</Text>
          </Button>
        </SheetFrame>
      );

    case 'ask':
      return (
        <SheetFrame>
          <JoinAsk inviter={state.inviter} onJoin={() => dispatch({ type: 'join_tapped' })} onNotNow={() => dispatch({ type: 'not_now_tapped' })} />
        </SheetFrame>
      );

    case 'declined':
      return (
        <SheetFrame
          footer={
            <Button size="lg" onPress={close}>
              <Text>{a.close}</Text>
            </Button>
          }>
          <SheetTitle>{a.declinedTitle}</SheetTitle>
          <SheetBody>{a.declinedBody}</SheetBody>
        </SheetFrame>
      );

    case 'joined': {
      const child = book?.name ?? '';
      const local = !!book?.local;
      return (
        <SheetFrame
          footer={
            <View className="gap-3">
              {local ? (
                <Button size="lg" onPress={openJoinedBook}>
                  <Text>{a.open}</Text>
                </Button>
              ) : null}
              {local ? <QuietButton label={a.close} onPress={close} /> : (
                <Button size="lg" onPress={close}>
                  <Text>{a.close}</Text>
                </Button>
              )}
            </View>
          }>
          <SheetTitle>{child ? fill(a.joinedTitle, { child }) : a.title}</SheetTitle>
          <SheetBody>{a.joinedBody}</SheetBody>
          {!local && child ? <SheetBody muted>{fill(a.joinedWaiting, { child })}</SheetBody> : null}
          {local ? <SheetBody muted>{a.openHint}</SheetBody> : null}
        </SheetFrame>
      );
    }

    default:
      // account, peeking, joining, failed: behind the account gate (sign-in, Terms, consent).
      return (
        <SheetFrame closeLabel={a.close} closeDisabled={state.phase === 'joining'}>
          <SheetTitle>{a.title}</SheetTitle>
          <AccountGate trigger="invite" signInBody={a.signInBody}>
            {state.phase === 'peeking' ? <Busy label={a.checking} /> : null}
            {state.phase === 'joining' ? <Busy label={a.joining} /> : null}
            {state.phase === 'failed' ? (
              <View className="gap-3">
                <ErrorLine message={fill(familyCopy.errors[state.error], { child: '' })} />
                {failedAction(state.error) === 'paste_again' ? (
                  <QuietButton
                    label={a.continue}
                    onPress={() => {
                      setPasted('');
                      setToken(null);
                      dispatch({ type: 'paste_again_tapped' });
                    }}
                  />
                ) : (
                  <Button size="lg" onPress={() => dispatch({ type: 'try_again_tapped' })}>
                    <Text>{a.tryAgain}</Text>
                  </Button>
                )}
              </View>
            ) : null}
          </AccountGate>
        </SheetFrame>
      );
  }
}
