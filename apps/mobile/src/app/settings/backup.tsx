import { Redirect, Stack } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Alert, ScrollView, View } from 'react-native';
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
 * of what is left; Use mobile data (off by default); Turn off, which keeps what
 * is backed up (Delete the backup is WP-F08-B5d).
 */
const t = withBrandName(backupCopy);

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
  if (r.kind === 'waiting_icloud') return t.restoreLooking;
  if (r.kind === 'waiting_hold') {
    const time = new Date(r.holdUntil).toLocaleString(undefined, { weekday: 'long', hour: 'numeric', minute: '2-digit' });
    return fill(t.restoreWaiting, { date: time });
  }
  if (r.kind === 'unavailable') return t.restoreUnavailable;
  if (r.kind === 'stopped') return t.restoreStopped;
  if (r.kind === 'sign_in_again') return t.restoreSignInAgain;
  return null;
}

function BackupScreen({ rt }: { rt: Runtime }) {
  const [view, setView] = useState(rt.backupView);
  const [signedIn, setSignedIn] = useState<boolean | null>(null);
  const [busy, setBusy] = useState(false);
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
    try {
      await rt.turnOnBackup();
    } catch {
      // The consent act did not reach the server: nothing was turned on. The button stays.
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
  const on = status !== undefined && status !== 'off' && status !== 'unavailable';
  const line = stateLine(view);
  const restore = restoreLine(view);

  return (
    <ScrollView contentContainerClassName="gap-7 px-5 pb-12 pt-4" contentInsetAdjustmentBehavior="automatic">
      <Stack.Screen options={{ title: t.title }} />

      {restore ? (
        <ListSection>
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
            {line ? <ListRow title={line} /> : null}
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
          <Text variant="title2" asHeading>
            {t.sheetTitle}
          </Text>
          <Text variant="body">{t.sheetBody}</Text>
          <Text variant="subhead" tone="muted">
            {t.sheetNotIncluded}
          </Text>
          <Button disabled={busy} onPress={() => void turnOn()}>
            <Text>{t.turnOnButton}</Text>
          </Button>
        </View>
      ) : null}
    </ScrollView>
  );
}
