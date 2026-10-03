// android: same
/**
 * Invite a co-parent (PRD B F5, B-REQ-007; BRIEF decision 5: co-parent only
 * at launch). `/invite/new?childId=<id>` from the Family tab.
 *
 * create_child_invite(child, 'parent', signs_as) returns the token once; the
 * link https://earlyletters.com/i/<token> goes straight to the share sheet
 * and is never stored or shown again. "Share again" on the Family tab makes a
 * new link and cancels the old one.
 */
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { TextInput, View } from 'react-native';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { useAuth } from '@/lib/auth/session-provider';
import { AccountGate, Busy, ErrorLine, QuietButton, SheetBody, SheetFrame, SheetTitle, useCloseSheet, useColors } from '@/lib/auth/ui';
import { fill } from '@/lib/copy';
import { familyCopy } from '@/lib/family/copy';
import { inviteErrorKind, type InviteErrorKind } from '@/lib/family/invite-errors.logic';
import { createCoParentInvite } from '@/lib/family/invites';
import { shareInviteLink } from '@/lib/family/share';
import { haptic } from '@/lib/haptics';
import { getChild } from '@/lib/store';

export default function InviteCoParent() {
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

  if (!book) {
    // No book on this phone (stale link to this screen): nothing to invite to.
    return (
      <SheetFrame footer={<QuietButton label={familyCopy.accept.close} onPress={close} />}>
        <ErrorLine message={familyCopy.errors.book_deleted} />
      </SheetFrame>
    );
  }
  const child = book.name;

  const share = async () => {
    if (!auth.client) return;
    setBusy(true);
    setError(null);
    try {
      const invite = await createCoParentInvite(auth.client, book.id, signsAs);
      await shareInviteLink(invite.url, child, signsAs.trim() || null);
      haptic('success');
      setDone(true);
    } catch (e) {
      setError(inviteErrorKind(e));
    } finally {
      setBusy(false);
    }
  };

  if (done) {
    return (
      <SheetFrame
        footer={
          <Button size="lg" onPress={close}>
            <Text>{familyCopy.accept.close}</Text>
          </Button>
        }>
        <SheetTitle>{fill(k.title, { child })}</SheetTitle>
        <SheetBody>{k.done}</SheetBody>
      </SheetFrame>
    );
  }

  return (
    <SheetFrame footer={<QuietButton label={familyCopy.accept.close} onPress={close} disabled={busy} />}>
      <SheetTitle>{fill(k.title, { child })}</SheetTitle>
      <SheetBody muted>{fill(k.body, { child })}</SheetBody>
      <AccountGate trigger="invite_create" signInBody={familyCopy.card.signedOutNote}>
        <View className="gap-5">
          <View className="gap-2">
            <Text className="text-base font-medium text-muted-foreground">{fill(k.signsAsLabel, { child })}</Text>
            <TextInput
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
            <Button size="lg" onPress={() => void share()}>
              <Text>{k.share}</Text>
            </Button>
          )}
        </View>
      </AccountGate>
    </SheetFrame>
  );
}
