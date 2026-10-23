import { Redirect, Stack, router, type Href } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Alert, Linking, ScrollView, View } from 'react-native';
import { supportMailto } from '@scribe/brand';
import { backupCopy } from '@scribe/content';
import { Button, ListRow, ListSection, Text, ToggleRow } from '@/components/ui';
import { loadBackup } from '@/lib/backup/gate';
import { fill, withBrandName } from '@/lib/copy';
import { dayDate, isoOf } from '@/lib/dates';

/**
 * Settings > Storage and backup > Back up my recordings (WP-F08-B5c; F08 6.5 A;
 * F17 Storage and backup row). Only in a build with `capabilities.backup` on;
 * without it this route goes straight back to Settings and loads nothing of
 * backup (lib/backup/gate.ts).
 *
 * Off: the one turn-on sheet (`backup.sheet*`) with one button. Tapping it
 * records the `backup` consent act first (F08-REQ-039); nothing is encrypted
 * or uploaded before the server has it. On: a quiet state line, never a count
 * of what is left; Use cellular data (off by default); Turn off, which keeps what
 * is backed up (Delete the backup is WP-F08-B5d). "Backed up" shows only when
 * every recording of mine is; consent withdrawn reads Off, with the sheet.
 */
const t = withBrandName(backupCopy);
const signIn = () => router.push('/settings/account' as Href);
const writeToUs = () => void Linking.openURL(supportMailto());
const holdTime = (iso: string) => new Date(iso).toLocaleString(undefined, { weekday: 'long', hour: 'numeric', minute: '2-digit' });

type Runtime = NonNullable<ReturnType<typeof loadBackup>>;

export default function BackupSettings() {
  const rt = loadBackup();
  if (!rt) return <Redirect href="/settings" />;
  return <BackupScreen rt={rt} />;
}

function stateLine(view: ReturnType<Runtime['backupView']>): string | null {
  const s = view?.status;
  if (!s) return null;
  switch (s.kind) {
    case 'current':
      return s.lastBackedUpAt ? fill(t.lastBackedUp, { date: dayDate(isoOf(new Date(s.lastBackedUpAt))) }) : t.rowOn;
    case 'backing_up':
      return t.backingUp;
    case 'waiting_wifi':
      return t.waitingWifi;
    case 'paused':
      return t.paused;
    case 'sign_in_again':
      return t.signInAgain;
    case 'waiting_key':
      return fill(t.waitingKey, { date: holdTime(s.holdUntil) });
    case 'key_stopped':
      return t.keyStopped;
    case 'some_kept_here':
      return t.someKeptHere;
    case 'quota':
      return t.quotaReached;
    case 'needs_consent':
      return t.needsConsent;
    default:
      return null;
  }
}

function restoreLine(view: ReturnType<Runtime['backupView']>): string | null {
  const r = view?.restore;
  if (!r) return null;
  if (r.kind === 'waiting_icloud' || r.kind === 'restoring') return t.restoreLooking;
  if (r.kind === 'waiting_hold') return fill(t.restoreWaiting, { date: holdTime(r.holdUntil) });
  if (r.kind === 'unavailable') return t.restoreUnavailable;
  if (r.kind === 'stopped') return t.restoreStopped;
  if (r.kind === 'sign_in_again') return t.restoreSignInAgain;
  return null;
}

function BackupScreen({ rt }: { rt: Runtime }) {
  const [view, setView] = useState(rt.backupView);
  const [signedIn, setSignedIn] = useState<boolean | null>(null);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  const [cellular, setCellular] = useState(rt.backupCellular);

  const read = useCallback(() => {
    setView(rt.backupView());
    setCellular(rt.backupCellular());
  }, [rt]);

  useEffect(() => {
    const off = rt.subscribeBackup(read);
    void rt.signedIn().then(setSignedIn);
    void rt.refreshBackup().then(read);
    return off;
  }, [rt, read]);

  const turnOn = async () => {
    setBusy(true);
    setFailed(false);
    try {
      await rt.turnOnBackup();
    } catch {
      // The consent act did not reach the server: nothing was turned on. The button stays, and says so.
      setFailed(true);
    } finally {
      setBusy(false);
      read();
    }
  };

  const confirmOff = () => {
    Alert.alert(t.offTitle, t.offBody, [
      { text: t.keepOn, style: 'cancel' },
      { text: t.offKeep, onPress: () => void rt.turnOffBackupKeep().then(read) },
    ]);
  };

  const status = view?.status.kind;
  // Consent withdrawn is Off: the sheet and its button come back, with the line that says so.
  const on = status !== undefined && status !== 'off' && status !== 'unavailable' && status !== 'needs_consent';
  const line = stateLine(view);
  const restore = restoreLine(view);
  const tryAgain = view?.restore?.kind === 'stopped' || status === 'key_stopped';

  return (
    <ScrollView contentContainerClassName="gap-7 px-5 pb-12 pt-4" contentInsetAdjustmentBehavior="automatic">
      <Stack.Screen options={{ title: t.title }} />

      {restore ? (
        <ListSection>
          {view?.restore?.kind === 'sign_in_again' ? (
            // Where to go is part of the line: Settings > Account, then back here.
            <ListRow title={restore} trailing="chevron" onPress={signIn} />
          ) : (
            <View className="gap-3 px-4 py-3">
              <Text variant="subhead" accessibilityLiveRegion="polite">
                {restore}
              </Text>
              {view?.restore?.kind === 'stopped' ? (
                <Button variant="quiet" size="sm" onPress={rt.tryRestoreAgain}>
                  <Text>{t.restoreTryAgain}</Text>
                </Button>
              ) : null}
            </View>
          )}
        </ListSection>
      ) : null}

      {signedIn === false ? (
        <Text variant="subhead" tone="muted">
          {t.signInFirst}
        </Text>
      ) : status === 'unavailable' ? (
        <Text variant="subhead" tone="muted">
          {t.unavailable}
        </Text>
      ) : on ? (
        <>
          <ListSection>
            <ListRow title={t.title} trailing={t.rowOn} />
            {line ? <ListRow title={line} {...(status === 'sign_in_again' ? { trailing: 'chevron' as const, onPress: signIn } : {})} /> : null}
            {status === 'quota' ? <ListRow title={t.writeToUs} trailing="chevron" onPress={writeToUs} /> : null}
            {tryAgain && !restore ? <ListRow title={t.restoreTryAgain} trailing="chevron" onPress={rt.tryRestoreAgain} /> : null}
          </ListSection>
          <ListSection footer={t.cellularHelp}>
            <ToggleRow
              title={t.cellularTitle}
              value={cellular}
              onValueChange={(v) => {
                setCellular(v);
                rt.setBackupCellular(v);
              }}
            />
          </ListSection>
          <ListSection>
            <ListRow title={t.offButton} trailing="chevron" onPress={confirmOff} />
          </ListSection>
        </>
      ) : signedIn ? (
        <View accessible={false} className="gap-4">
          {status === 'needs_consent' ? <Text variant="subhead">{t.needsConsent}</Text> : null}
          <Text variant="title2" asHeading>
            {t.sheetTitle}
          </Text>
          {view?.hasBackup ? <Text variant="body">{t.sheetReturning}</Text> : null}
          <Text variant="body">{t.sheetBody}</Text>
          <Text variant="subhead" tone="muted">
            {t.sheetNotIncluded}
          </Text>
          {failed ? (
            <Text variant="subhead" accessibilityLiveRegion="polite">
              {t.turnOnFailed}
            </Text>
          ) : null}
          <Button disabled={busy} onPress={() => void turnOn()}>
            <Text>{t.turnOnButton}</Text>
          </Button>
        </View>
      ) : null}
    </ScrollView>
  );
}
