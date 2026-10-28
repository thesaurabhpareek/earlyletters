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
 * outbox to drain (S01 with S03's lib/sync), and while it waits the Sign out row says so, with a
 * small spinner, then the page fades to signed out over `fadeMs`. Sign out is a row in `text`, not
 * red, and its native confirm is not destructive either: nothing is deleted.
 * An iOS Settings page: native push, no lamp, no haptic for an account.
 */
import { Redirect, Stack, router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, View } from 'react-native';
import Animated, { FadeIn, ReduceMotion } from 'react-native-reanimated';
import { tokens } from '@scribe/design-tokens';
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

/** Signed in and signed out replace each other with one fade (opacity only, also under Reduce Motion). */
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
  const waitingToSignOut = s.status === 'signingOut' && s.waitingForUploads;

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
        <Animated.View key="signedOut" entering={PAGE_IN} style={{ gap: tokens.space[4] }}>
          {expired ? <ErrorLine message={authCopy.errors.session_expired} /> : null}
          {active ? <BookCover name={active.name} size="sm" animate={false} /> : null}
          <Text variant="title2" asHeading>
            {a.signedOutTitle}
          </Text>
          <Text variant="body" tone="muted">
            {fill(a.signedOutBody, { child: active?.name ?? authCopy.consent.childFallback })}
          </Text>
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
  // BL-347: signed in and consented, but the claim screen was never answered: nothing syncs yet.
  const claiming = s.status === 'ready' && s.sync === 'on' && auth.claimPending;
  const syncLabel =
    s.status === 'needsConsent' || claiming
      ? a.sync.waiting
      : s.status === 'ready'
        ? a.sync[s.sync === 'on' ? 'on' : s.sync === 'off' ? 'off' : 'unknown']
        : s.status === 'signingOut' && s.waitingForUploads
          ? a.sync.on
          : a.sync.unknown;

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
      <Animated.View key="signedIn" entering={PAGE_IN} style={{ gap: PAGE.gap }}>
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
          <ListRow title={a.syncLabel} trailing={syncLabel} />
          {(s.status === 'needsConsent' || claiming) && <ListRow title={a.finishSetup} trailing="chevron" onPress={() => router.push('/sign-in/consent')} />}
          {s.status === 'ready' && s.sync === 'off' && (
            <ListRow
              title={copy.sensitiveConsent.agreeButton}
              onPress={async () => {
                const r = await auth.turnOnSync();
                if (!r.ok) say(null, authErrorMessage(r.error));
              }}
            />
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
          <ListRow title={a.signOutOthers} onPress={() => void signOutOthers()} disabled={busy || waitingToSignOut} />
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
            ) : (
              <ListRow title={a.signOut} onPress={signOut} disabled={s.status === 'signingOut'} />
            )}
          </ListSection>
        </View>
      </Animated.View>
    </ScrollView>
  );
}
