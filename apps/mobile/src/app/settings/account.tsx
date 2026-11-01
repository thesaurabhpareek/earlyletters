// android: same (passkeys need Android setup first)
/**
 * Settings > Account (PRD A F6, A-REQ-019 partly, TDD 04 3.2.3; EXPERIENCE_PASS S56).
 *
 * Signed out: the small closed cover, "Not signed in", the sign-in sheet's own body, and "Sign in".
 * Signed in: a header on paper with the way the person signed in (its mark at 28 pt, "Signed in with
 * email" in `headline`, the address in `footnote`), then Sync (its value, or "Finish setting up"),
 * passkeys when this build enables them, Devices ("Sign out of other devices"), and "Sign out".
 * Account deletion is on Settings home (S64), not here.
 *
 * Sign out never drops a queued letter (PRD A F6.4, A-REQ-033, F16): the provider waits for the
 * outbox to drain (S01 with S03's lib/sync). While it waits, the Sign out row is replaced by the waiting
 * row, with a small spinner, and for a sign-out the person asked for "Stay signed in" sits under it
 * (cancelSignOutWait, BL-451); then the page fades to signed out over `fadeMs`. If the wait ended before
 * the newest letters were sent (sync turned off, or the session lost), the signed-out page says they are
 * kept on this phone, between the body and "Sign in", and announces it once (BL-451; only while this page
 * is open). Sign out is a row in `text`, not red, and its native confirm is not destructive either:
 * nothing is deleted.
 * "Agree and sync" (for a person who chose "Keep on this phone") opens the sensitive-data step with its
 * words (S55, LEGAL-REQ-006); consent is never recorded in one tap from here.
 * Which row says what is components/auth/account-view.logic.ts (pure, tested).
 * An iOS Settings page: native push, no lamp, no haptic for an account. Nothing enters on a visit
 * (MOTION principle 2); the one fade is signing out while the page is open.
 */
import { Redirect, Stack, router } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, View } from 'react-native';
import Animated, { FadeIn, ReduceMotion } from 'react-native-reanimated';
import { tokens } from '@scribe/design-tokens';
import { accountView, nextEndedEarly } from '@/components/auth/account-view.logic';
import { BookCover } from '@/components/book/book-cover';
import { useChildren } from '@/components/child/use-children';
import { Button } from '@/components/ui/button';
import { ListRow, ListSection } from '@/components/ui/list-row';
import { Text } from '@/components/ui/text';
import { announce, useTheme } from '@/lib/a11y';
import { authCopy } from '@/lib/auth/copy';
import { authErrorKind } from '@/lib/auth/errors.logic';
import { authErrorMessage } from '@/lib/auth/messages';
import { deletePasskey, listPasskeys, passkeysAvailable, registerPasskey, type PasskeyInfo } from '@/lib/auth/passkey';
import { useAuth } from '@/lib/auth/session-provider';
import { ErrorLine, ProviderMark } from '@/lib/auth/ui';
import { capabilities } from '@/lib/capabilities';
import { copy, fill } from '@/lib/copy';
import { longDate } from '@/lib/dates';
import { haptic } from '@/lib/haptics';

/** Signing out while the page is open: the signed-out page fades in (opacity only, which is also the Reduce Motion form, 5.8 rule 6). */
const PAGE_IN = FadeIn.duration(tokens.motion.fadeMs).reduceMotion(ReduceMotion.Never);
const PAGE = { gap: tokens.space[7], gutter: tokens.space[5], top: tokens.space[4], bottom: tokens.space[10] } as const;

/** v1.0 has no account (lib/capabilities.ts): Settings offers no row, and a stale route goes back to Settings. */
export default function AccountSettingsRoute() {
  return capabilities.signIn ? <AccountSettings /> : <Redirect href="/settings" />;
}

function AccountSettings() {
  const auth = useAuth();
  const { c } = useTheme();
  const { active } = useChildren();
  const a = authCopy.account;
  const [passkeys, setPasskeys] = useState<PasskeyInfo[]>([]);
  const [note, setNote] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const s = auth.state;
  const showPasskeys = auth.signedIn && passkeysAvailable();
  const client = auth.client;
  const view = accountView(s, auth.claimPending);
  const waitingToSignOut = view.signOut === 'waiting';
  // BL-451: a wait that ended before the newest letters were sent; the signed-out page says where they are. Each
  // state change goes through nextEndedEarly (pure, tested) with the state before it, so `previous` moves on after it.
  // The flag is this page's own: if Account is not open when the wait ends, nothing is said (known).
  const previous = useRef(s);
  const [endedEarly, setEndedEarly] = useState(false);
  useEffect(() => {
    const step = nextEndedEarly(previous.current, s, endedEarly);
    previous.current = s;
    if (step.shown !== endedEarly) setEndedEarly(step.shown);
    if (step.announce) announce(a.signOutEarly);
  }, [s, endedEarly, a.signOutEarly]);
  // Only a sign-out that happens on this page fades; a visit shows the page at once.
  const wasSignedIn = useRef(auth.signedIn);
  const signedOutHere = wasSignedIn.current && !auth.signedIn;
  useEffect(() => {
    wasSignedIn.current = auth.signedIn;
  });

  const loadPasskeys = useCallback(async () => {
    if (!showPasskeys || !client) return;
    try {
      setPasskeys(await listPasskeys(client));
    } catch {
      // Offline: keep the list as it was.
    }
  }, [showPasskeys, client]);

  useEffect(() => {
    void loadPasskeys();
  }, [loadPasskeys]);

  // The wait is said once when it starts, for VoiceOver; the row keeps saying it on screen.
  useEffect(() => {
    if (waitingToSignOut) announce(a.signOutWaiting);
  }, [waitingToSignOut, a.signOutWaiting]);

  const say = (message: string | null, err: string | null = null) => {
    setNote(message);
    setError(err);
  };

  const scroll = { gap: PAGE.gap, paddingHorizontal: PAGE.gutter, paddingTop: PAGE.top, paddingBottom: PAGE.bottom };

  if (!auth.signedIn) {
    const expired = s.status === 'signedOut' && s.error === 'session_expired';
    return (
      <ScrollView contentContainerStyle={scroll} contentInsetAdjustmentBehavior="automatic">
        <Stack.Screen options={{ title: a.title }} />
        <Animated.View key="signedOut" entering={signedOutHere ? PAGE_IN : undefined} style={{ gap: tokens.space[4] }}>
          {expired ? <ErrorLine message={authCopy.errors.session_expired} /> : null}
          {active ? <BookCover name={active.name} size="sm" animate={false} /> : null}
          <Text variant="title2" asHeading>
            {a.signedOutTitle}
          </Text>
          <Text variant="body" tone="muted">
            {fill(a.signedOutBody, { child: active?.name ?? authCopy.consent.childFallback })}
          </Text>
          {endedEarly ? (
            <Text variant="body" testID="account.signOutEarly">
              {a.signOutEarly}
            </Text>
          ) : null}
          {auth.configured ? (
            <Button size="lg" fullWidth label={a.signIn} onPress={() => router.push({ pathname: '/sign-in', params: { trigger: 'settings' } })} />
          ) : (
            <ErrorLine message={authCopy.sheet.notConfigured} />
          )}
        </Animated.View>
      </ScrollView>
    );
  }

  const provider = auth.account.provider ?? 'other';

  const addPasskey = async () => {
    if (!client) return;
    setBusy(true);
    say(null);
    try {
      await registerPasskey(client);
      haptic('success');
      say(a.passkeyAdded);
      await loadPasskeys();
    } catch (e) {
      const kind = authErrorKind(e, 'passkey');
      say(null, authErrorMessage(kind));
    } finally {
      setBusy(false);
    }
  };

  const removePasskey = (p: PasskeyInfo) => {
    if (!client) return;
    Alert.alert(a.removePasskeyTitle, a.removePasskeyBody, [
      { text: a.cancel, style: 'cancel' },
      {
        text: a.removePasskey,
        style: 'destructive',
        onPress: async () => {
          try {
            await deletePasskey(client, p.id);
            await loadPasskeys();
          } catch (e) {
            say(null, authErrorMessage(authErrorKind(e, 'passkey') === 'network' ? 'network' : 'unknown'));
          }
        },
      },
    ]);
  };

  const signOutOthers = async () => {
    setBusy(true);
    say(null);
    const r = await auth.signOutOtherDevices();
    setBusy(false);
    if (r.ok) say(a.signOutOthersDone);
    else say(null, authErrorMessage(r.error));
  };

  // A native confirm. Not destructive: signing out deletes nothing, and the letters stay on this phone.
  const signOut = () => {
    Alert.alert(a.signOutTitle, a.signOutBody, [
      { text: a.cancel, style: 'cancel' },
      {
        text: a.signOut,
        onPress: () => {
          say(null);
          void auth.signOut();
        },
      },
    ]);
  };

  return (
    <ScrollView contentContainerStyle={scroll} contentInsetAdjustmentBehavior="automatic">
      <Stack.Screen options={{ title: a.title }} />
      <View style={{ gap: PAGE.gap }}>
        {/* The way in, on paper: the method's mark, how, and the address (shown here only, never logged). */}
        <View className="flex-row items-center px-1" style={{ gap: tokens.space[3] }}>
          <ProviderMark provider={provider} size={28} />
          <View className="flex-1" style={{ gap: tokens.space[1] }}>
            <Text variant="headline" asHeading>
              {a.signedInWith[provider]}
            </Text>
            {auth.account.email ? (
              <Text variant="footnote" tone="muted" selectable>
                {auth.account.email}
              </Text>
            ) : null}
          </View>
        </View>

        <ListSection title={a.syncTitle}>
          <ListRow title={a.syncLabel} trailing={a.sync[view.sync]} />
          {view.finishSetup && <ListRow title={a.finishSetup} trailing="chevron" onPress={() => router.push('/sign-in/consent')} />}
          {view.offerSync && (
            // The sensitive-data step with its words, then the answer (LEGAL-REQ-006): never a one-tap consent here.
            <ListRow title={copy.sensitiveConsent.agreeButton} trailing="chevron" onPress={() => router.push({ pathname: '/sign-in/consent', params: { step: 'sensitive' } })} />
          )}
        </ListSection>

        {showPasskeys && (
          <ListSection title={a.passkeysTitle} footer={a.passkeysHelp}>
            {passkeys.map((p) => (
              <ListRow
                key={p.id}
                title={p.name ?? a.passkeyFallbackName}
                subtitle={longDate(p.createdAt.slice(0, 10))}
                value={a.removePasskey}
                trailing="chevron"
                onPress={() => removePasskey(p)}
              />
            ))}
            <ListRow title={a.addPasskey} trailing="chevron" onPress={() => void addPasskey()} disabled={busy} />
          </ListSection>
        )}

        <ListSection title={a.devicesTitle} footer={a.signOutOthersHelp}>
          <ListRow title={a.signOutOthers} onPress={() => void signOutOthers()} disabled={busy || view.signOut !== 'ready'} />
        </ListSection>

        <View style={{ gap: tokens.space[3] }}>
          <ErrorLine message={error} />
          {note ? (
            <Text variant="subhead" tone="muted" accessibilityLiveRegion="polite">
              {note}
            </Text>
          ) : null}
          <ListSection>
            {waitingToSignOut ? (
              // The outbox is still sending: the row says so, with a small spinner, until this phone signs out.
              <ListRow title={a.signOutWaiting} leading={<ActivityIndicator color={c.accent} />} />
            ) : null}
            {view.staySignedIn ? (
              // BL-451: only while a sign-out the person asked for waits; never while it is closing.
              <ListRow title={a.staySignedIn} onPress={() => auth.cancelSignOutWait()} />
            ) : null}
            {waitingToSignOut ? null : <ListRow title={a.signOut} onPress={signOut} disabled={view.signOut === 'closing'} />}
          </ListSection>
        </View>
      </View>
    </ScrollView>
  );
}
