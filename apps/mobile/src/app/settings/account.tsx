// android: same (passkeys need Android setup first)
/**
 * Settings > Account (PRD A F6, A-REQ-019 partly, TDD 04 3.2.3).
 *
 * Signed out: one line and "Sign in". Signed in: how you signed in and the
 * address, sync status (and a way to finish setup or turn sync back on),
 * passkeys when this build enables them, "Sign out of other devices", and
 * "Sign out", which never discards unsynced letters (PRD A F6.4).
 * Account deletion lives with the data screens (PRD C), not here.
 */
import { Redirect, Stack, router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Alert, ScrollView, View } from 'react-native';
import { Row, Section } from '@/components/settings/settings-ui';
import { capabilities } from '@/lib/capabilities';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { authCopy } from '@/lib/auth/copy';
import { authErrorKind } from '@/lib/auth/errors.logic';
import { authErrorMessage } from '@/lib/auth/messages';
import { deletePasskey, listPasskeys, passkeysAvailable, registerPasskey, type PasskeyInfo } from '@/lib/auth/passkey';
import { useAuth } from '@/lib/auth/session-provider';
import { ErrorLine } from '@/lib/auth/ui';
import { copy } from '@/lib/copy';
import { longDate } from '@/lib/dates';
import { haptic } from '@/lib/haptics';

/** v1.0 has no account (lib/capabilities.ts): Settings offers no row, and a stale route goes back to Settings. */
export default function AccountSettingsRoute() {
  return capabilities.signIn ? <AccountSettings /> : <Redirect href="/settings" />;
}

function AccountSettings() {
  const auth = useAuth();
  const a = authCopy.account;
  const [passkeys, setPasskeys] = useState<PasskeyInfo[]>([]);
  const [note, setNote] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const s = auth.state;
  const showPasskeys = auth.signedIn && passkeysAvailable();
  const client = auth.client;

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

  const say = (message: string | null, err: string | null = null) => {
    setNote(message);
    setError(err);
  };

  if (!auth.signedIn) {
    return (
      <ScrollView contentContainerClassName="gap-6 px-5 pb-12 pt-4" contentInsetAdjustmentBehavior="automatic">
        <Stack.Screen options={{ title: a.title }} />
        <Section title={a.title}>
          <Row first title={a.signedOutTitle} />
        </Section>
        <Text className="text-base leading-6 text-muted-foreground">{a.signedOutBody}</Text>
        {s.status === 'signedOut' && s.error === 'session_expired' ? <ErrorLine message={authCopy.errors.session_expired} /> : null}
        {auth.configured ? (
          <Button size="lg" onPress={() => router.push({ pathname: '/sign-in', params: { trigger: 'settings' } })}>
            <Text>{a.signIn}</Text>
          </Button>
        ) : (
          <ErrorLine message={authCopy.sheet.notConfigured} />
        )}
      </ScrollView>
    );
  }

  const provider = auth.account.provider ?? 'other';
  const syncLabel =
    s.status === 'needsConsent'
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

  const signOut = () => {
    Alert.alert(a.signOutTitle, a.signOutBody, [
      { text: a.cancel, style: 'cancel' },
      {
        text: a.signOut,
        style: 'destructive',
        onPress: async () => {
          const r = await auth.signOut();
          if (r === 'waiting') say(a.signOutWaiting);
        },
      },
    ]);
  };

  const waitingToSignOut = s.status === 'signingOut' && s.waitingForUploads;

  return (
    <ScrollView contentContainerClassName="gap-7 px-5 pb-12 pt-4" contentInsetAdjustmentBehavior="automatic">
      <Stack.Screen options={{ title: a.title }} />

      <Section title={a.title}>
        <Row first title={a.signedInWith[provider]} subtitle={auth.account.email ?? undefined} />
      </Section>

      <Section title={a.syncTitle}>
        <Row first title={a.syncLabel} value={syncLabel} />
        {s.status === 'needsConsent' && <Row title={a.finishSetup} onPress={() => router.push('/sign-in/consent')} />}
        {s.status === 'ready' && s.sync === 'off' && (
          <Row
            title={copy.sensitiveConsent.agreeButton}
            onPress={async () => {
              const r = await auth.turnOnSync();
              if (!r.ok) say(null, authErrorMessage(r.error));
            }}
          />
        )}
      </Section>

      {showPasskeys && (
        <Section title={a.passkeysTitle} footer={a.passkeysHelp}>
          {passkeys.map((p, i) => (
            <Row
              key={p.id}
              first={i === 0}
              title={p.name ?? a.passkeyFallbackName}
              subtitle={longDate(p.createdAt.slice(0, 10))}
              value={a.removePasskey}
              onPress={() => removePasskey(p)}
            />
          ))}
          <Row first={passkeys.length === 0} title={a.addPasskey} onPress={() => void addPasskey()} disabled={busy} />
        </Section>
      )}

      <Section title={a.devicesTitle} footer={a.signOutOthersHelp}>
        <Row first title={a.signOutOthers} onPress={() => void signOutOthers()} disabled={busy} />
      </Section>

      <View className="gap-3">
        <ErrorLine message={error} />
        {note ? <Text className="text-base leading-6 text-muted-foreground">{note}</Text> : null}
        {waitingToSignOut ? <Text className="text-base leading-6 text-muted-foreground">{a.signOutWaiting}</Text> : null}
        <Section>
          <Row first title={a.signOut} destructive onPress={signOut} disabled={waitingToSignOut} />
        </Section>
      </View>
    </ScrollView>
  );
}
