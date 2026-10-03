// android: same
/**
 * "I was invited" (PRD A F7, PRD B F5, A-REQ-028, -029). Co-parent only at
 * launch (BRIEF decision 5).
 *
 * 1. The token is already in the Keychain when the link opened the app
 *    (+native-intent); without a link, the person pastes it (read only from
 *    what they paste; the clipboard is never read on its own).
 * 2. Not signed in: sign in. Consent missing: finish it (accept needs it,
 *    SCCON).
 * 3. accept_child_invite(token), once. Final errors (expired, used,
 *    cancelled, not found, already a member) clear the token; a network
 *    error keeps it for another try.
 * 4. Joined: the sync agent brings the book to this phone (onInviteAccepted);
 *    this screen waits for it and then opens it.
 */
import { brand } from '@scribe/brand';
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
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
import { inviteErrorKind, type InviteErrorKind } from '@/lib/family/invite-errors.logic';
import { parseInviteInput } from '@/lib/family/invite-link.logic';
import { acceptInvite, bookName } from '@/lib/family/invites';
import { clearPendingInvite, readPendingInvite, savePendingInvite } from '@/lib/family/pending-invite';
import { haptic } from '@/lib/haptics';
import { getChild, setActiveChildId, subscribe } from '@/lib/store';

const FINAL: readonly InviteErrorKind[] = ['expired', 'used', 'revoked', 'not_found', 'already_member', 'book_deleted'];

type Phase = 'loading' | 'paste' | 'ready' | 'joining' | 'joined' | 'failed';

/** v1.0: server features are off, so this entry shows co-parent sharing as coming soon (lib/family/entry.logic.ts). */
export default function JoinBookRoute() {
  return inviteDestination('invite_join', serverFeaturesEnabled()) === 'flow' ? <JoinBook /> : <InviteComingSoon />;
}

function JoinBook() {
  const auth = useAuth();
  const c = useColors();
  const close = useCloseSheet();
  const a = familyCopy.accept;
  const [phase, setPhase] = useState<Phase>('loading');
  const [pasted, setPasted] = useState('');
  const [pasteError, setPasteError] = useState(false);
  const [error, setError] = useState<InviteErrorKind | null>(null);
  const [joined, setJoined] = useState<{ childId: string; name: string | null; local: boolean } | null>(null);
  const token = useRef<string | null>(null);
  const attempted = useRef(false);

  useEffect(() => {
    void readPendingInvite().then((p) => {
      token.current = p?.token ?? null;
      setPhase(p ? 'ready' : 'paste');
    });
  }, []);

  const accept = async () => {
    const t = token.current;
    if (!t || !auth.client) return;
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
      const kind = inviteErrorKind(e);
      if (FINAL.includes(kind)) await clearPendingInvite();
      setError(kind);
      setPhase('failed');
    }
  };

  // Accept once, as soon as the account can (signed in, consent done).
  useEffect(() => {
    if (phase === 'ready' && auth.canSync && !attempted.current) {
      attempted.current = true;
      void accept();
    }
    // accept reads refs and the current client; re-running on its identity would retry in a loop.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, auth.canSync]);

  // Joined: wait for the sync agent to bring the book onto this phone, then make it the open book.
  const joinedId = joined?.childId ?? null;
  useEffect(() => {
    if (!joinedId) return;
    const check = () => {
      if (getChild(joinedId)) {
        setActiveChildId(joinedId);
        setJoined((j) => (j ? { ...j, local: true } : j));
      }
    };
    check();
    return subscribe(check);
  }, [joinedId]);

  const submitPaste = async () => {
    const t = parseInviteInput(pasted, brand.web.origin);
    if (!t) {
      setPasteError(true);
      return;
    }
    await savePendingInvite(t);
    token.current = t;
    attempted.current = false;
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

  if (phase === 'joined' && joined) {
    const child = joined.name ?? '';
    return (
      <SheetFrame
        footer={
          <Button size="lg" onPress={() => (joined.local ? router.dismissTo('/') : close())}>
            <Text>{joined.local ? a.open : a.close}</Text>
          </Button>
        }>
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
        {phase === 'joining' ? <Busy label={a.joining} /> : null}
        {phase === 'failed' && error ? (
          <View className="gap-3">
            <ErrorLine message={fill(familyCopy.errors[error], { child: '' })} />
            {FINAL.includes(error) ? (
              <QuietButton
                label={a.continue}
                onPress={() => {
                  setPasted('');
                  setPhase('paste');
                }}
              />
            ) : (
              <Button
                size="lg"
                onPress={() => {
                  attempted.current = true;
                  void accept();
                }}>
                <Text>{a.tryAgain}</Text>
              </Button>
            )}
          </View>
        ) : null}
      </AccountGate>
    </SheetFrame>
  );
}
