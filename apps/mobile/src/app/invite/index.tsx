// android: same
/**
 * "I was invited" (PRD A F7, PRD B F5, A-REQ-028, -029). Co-parent only at
 * launch (BRIEF decision 5).
 *
 * 1. The token is already in the Keychain when the link opened the app
 *    (+native-intent); without a link, the person pastes it (read only from
 *    what they paste; the clipboard is never read on its own).
 * 2. Not signed in: sign in. Account not confirmed or consent missing: finish
 *    it (accepting needs consent, SCCON).
 * 3. Ask before joining (security review H2, gap G-02): peek_invite shows who
 *    invited them (the inviter's sign-off name only, never the child's name),
 *    and nothing happens until they tap Join. "Not now" forgets the link.
 * 4. accept_child_invite(token), once per tap. Final errors (expired, used,
 *    cancelled, not found, already a member, two parents already) clear the
 *    token; a network error keeps it for another try.
 * 5. Joined: the sync agent brings the book to this phone (onInviteAccepted).
 *    The open book never changes on its own: "Open the book" switches only
 *    when tapped.
 */
import { brand } from '@scribe/brand';
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { TextInput, View } from 'react-native';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { useAuth } from '@/lib/auth/session-provider';
import { AccountGate, Busy, ErrorLine, QuietButton, SheetBody, SheetFrame, SheetTitle, useCloseSheet, useColors } from '@/lib/auth/ui';
import { fill } from '@/lib/copy';
import { familyCopy } from '@/lib/family/copy';
import { FINAL_INVITE_ERRORS, inviteErrorKind, trackedInviteReason, type InviteErrorKind } from '@/lib/family/invite-errors.logic';
import { parseInviteInput } from '@/lib/family/invite-link.logic';
import { acceptInvite, bookName, peekInvite, type InvitePreview } from '@/lib/family/invites';
import { track } from '@/lib/analytics/track';
import { clearPendingInvite, readPendingInvite, savePendingInvite } from '@/lib/family/pending-invite';
import { haptic } from '@/lib/haptics';
import { getChild, setActiveChildId, subscribe } from '@/lib/store';

type Phase = 'loading' | 'paste' | 'ready' | 'peeking' | 'ask' | 'joining' | 'joined' | 'failed';

export default function JoinBook() {
  const auth = useAuth();
  const c = useColors();
  const close = useCloseSheet();
  const a = familyCopy.accept;
  const [phase, setPhase] = useState<Phase>('loading');
  const [pasted, setPasted] = useState('');
  const [pasteError, setPasteError] = useState(false);
  const [error, setError] = useState<InviteErrorKind | null>(null);
  const [preview, setPreview] = useState<InvitePreview | null>(null);
  const [joined, setJoined] = useState<{ childId: string; name: string | null; local: boolean } | null>(null);
  const token = useRef<string | null>(null);
  const peeked = useRef(false);

  useEffect(() => {
    void readPendingInvite().then((p) => {
      token.current = p?.token ?? null;
      if (p) track('invite_opened', { via: 'link', signed_in: auth.signedIn });
      setPhase(p ? 'ready' : 'paste');
    });
    // Runs once: the token is read when the sheet opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fail = async (e: unknown, stage: 'accept') => {
    const kind = inviteErrorKind(e);
    track('invite_failed', { stage, reason: trackedInviteReason(kind) });
    if (FINAL_INVITE_ERRORS.includes(kind)) await clearPendingInvite();
    setError(kind);
    setPhase('failed');
  };

  // Once the account can use server features, read what the invite says. Never joins.
  const peek = async () => {
    const t = token.current;
    if (!t || !auth.client) return;
    setPhase('peeking');
    setError(null);
    try {
      setPreview(await peekInvite(auth.client, t));
      setPhase('ask');
    } catch (e) {
      await fail(e, 'accept');
    }
  };

  useEffect(() => {
    if (phase === 'ready' && auth.canSync && !peeked.current) {
      peeked.current = true;
      void peek();
    }
    // peek reads refs and the current client; re-running on its identity would loop.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, auth.canSync]);

  // Only after a tap on Join.
  const accept = async () => {
    const t = token.current;
    if (!t || !auth.client) return;
    haptic('tap');
    setPhase('joining');
    setError(null);
    try {
      const childId = await acceptInvite(auth.client, t);
      await clearPendingInvite();
      const name = await bookName(auth.client, childId).catch(() => null);
      haptic('success');
      setJoined({ childId, name, local: getChild(childId) !== null });
      setPhase('joined');
    } catch (e) {
      await fail(e, 'accept');
    }
  };

  // Joined: notice when sync has brought the book to this phone. The open book is not changed here.
  const joinedId = joined?.childId ?? null;
  useEffect(() => {
    if (!joinedId) return;
    const check = () => {
      if (getChild(joinedId)) setJoined((j) => (j && !j.local ? { ...j, local: true } : j));
    };
    check();
    return subscribe(check);
  }, [joinedId]);

  const notNow = async () => {
    await clearPendingInvite();
    close();
  };

  const submitPaste = async () => {
    const t = parseInviteInput(pasted, brand.web.origin);
    if (!t) {
      setPasteError(true);
      return;
    }
    await savePendingInvite(t);
    track('invite_opened', { via: 'paste', signed_in: auth.signedIn });
    token.current = t;
    peeked.current = false;
    setPreview(null);
    setPasteError(false);
    setPhase('ready');
  };

  if (phase === 'loading') {
    return (
      <SheetFrame>
        <SheetTitle>{a.title}</SheetTitle>
        <Busy label={a.title} />
      </SheetFrame>
    );
  }

  if (phase === 'paste') {
    return (
      <SheetFrame footer={<QuietButton label={a.close} onPress={close} />}>
        <SheetTitle>{a.title}</SheetTitle>
        <SheetBody muted>{a.pasteHelp}</SheetBody>
        <View className="gap-2">
          <Text className="text-base font-medium text-muted-foreground">{a.pasteLabel}</Text>
          <TextInput
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
        <Button size="lg" onPress={() => void submitPaste()} disabled={pasted.trim().length === 0}>
          <Text>{a.continue}</Text>
        </Button>
      </SheetFrame>
    );
  }

  if (phase === 'ask' && preview) {
    return (
      <SheetFrame
        footer={
          <>
            <Button size="lg" onPress={() => void accept()}>
              <Text>{a.join}</Text>
            </Button>
            <QuietButton label={a.notNow} onPress={() => void notNow()} />
          </>
        }>
        <SheetTitle>{a.askTitle}</SheetTitle>
        <SheetBody>{preview.inviter ? fill(a.invitedBy, { inviter: preview.inviter }) : a.invitedByUnknown}</SheetBody>
        <SheetBody muted>{a.askBody}</SheetBody>
      </SheetFrame>
    );
  }

  if (phase === 'joined' && joined) {
    const child = joined.name ?? '';
    const open = () => {
      // The one place the open book changes: the person tapped "Open the book".
      setActiveChildId(joined.childId);
      router.dismissTo('/');
    };
    return (
      <SheetFrame footer={joined.local ? (
        <>
          <Button size="lg" onPress={open}>
            <Text>{a.open}</Text>
          </Button>
          <QuietButton label={a.close} onPress={close} />
        </>
      ) : (
        <Button size="lg" onPress={close}>
          <Text>{a.close}</Text>
        </Button>
      )}>
        <SheetTitle>{child ? fill(a.joinedTitle, { child }) : a.title}</SheetTitle>
        <SheetBody>{a.joinedBody}</SheetBody>
        {!joined.local && child ? <SheetBody muted>{fill(a.joinedWaiting, { child })}</SheetBody> : null}
      </SheetFrame>
    );
  }

  return (
    <SheetFrame footer={<QuietButton label={a.close} onPress={close} />}>
      <SheetTitle>{a.title}</SheetTitle>
      <AccountGate trigger="invite" signInBody={a.signInBody}>
        {phase === 'peeking' || phase === 'ready' ? <Busy label={a.title} /> : null}
        {phase === 'joining' ? <Busy label={a.joining} /> : null}
        {phase === 'failed' && error ? (
          <View className="gap-3">
            <ErrorLine message={fill(familyCopy.errors[error], { child: '' })} />
            {FINAL_INVITE_ERRORS.includes(error) ? (
              <QuietButton
                label={a.continue}
                onPress={() => {
                  setPasted('');
                  setPhase('paste');
                }}
              />
            ) : (
              <Button size="lg" onPress={() => void (preview ? accept() : peek())}>
                <Text>{a.tryAgain}</Text>
              </Button>
            )}
          </View>
        ) : null}
      </AccountGate>
    </SheetFrame>
  );
}
