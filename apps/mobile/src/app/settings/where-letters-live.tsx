import { router, useFocusEffect, type Href } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useCallback, useEffect, useState } from 'react';
import { ScrollView } from 'react-native';
import { APPLE_ICLOUD_BACKUP_HELP, LAST_EXPORT_SETTING, whereLive } from '@/components/settings/where-live.logic';
import { ListRow, ListSection } from '@/components/ui/list-row';
import { Text } from '@/components/ui/text';
import { useSensitiveDataStatus } from '@/lib/analytics/privacy-sources';
import { backupInBuild, loadBackup } from '@/lib/backup/gate';
import { capabilities } from '@/lib/capabilities';
import { copy, fill, plural } from '@/lib/copy';
import { dayDate, isoOf } from '@/lib/dates';
import { countUnrecoverableTakes, getSetting, listOrphanAudio } from '@/lib/store';
import { backupCopy } from '@scribe/content';

/**
 * Settings > Where your letters live (settings-ia.md 4; design.md 2.7; SETTINGS_AND_ACCOUNT.md 7). Replaces the
 * Recordings page: where the book is kept, and what brings it to a new phone, in plain words. Which lines show is
 * whereLive() (components/settings/where-live.logic.ts; CCO-8, CPrivO-4). Language downloads moved to Storage, and
 * the Word for word switch to Your words.
 *
 * - On this phone: one line (build 1), or the synced line while sync is on (build 2).
 * - If you get a new phone: three lines. iPhone backup (a fact and Apple's help page; iCloud Backup's state cannot be
 *   read, so never On or Off), Export your book (the last export, or "Save a copy any time."), and our encrypted
 *   backup ("Not in this version", or in a build with backup the Back up my recordings row).
 * - Recordings without a letter and recordings that may not play, each only above 0 (TDD 01 3.2.4, D-085).
 * - ERASE_ROW: "Erase everything on this phone" (#520) joins at the bottom once it is merged.
 */
export default function WhereLettersLive() {
  const w = copy.whereLive;
  const r = copy.settings.recordings;
  const sensitive = useSensitiveDataStatus();
  const [lastExport, setLastExport] = useState(readLastExport);
  useFocusEffect(useCallback(() => setLastExport(readLastExport()), []));
  const backupValue = useBackupValue();
  const orphans = listOrphanAudio().length;
  const unplayable = countUnrecoverableTakes();
  const page = whereLive({
    sync: capabilities.sync,
    syncStatus: sensitive.status,
    backupInBuild: backupInBuild(),
    lastExport,
    dayDate: (iso) => dayDate(isoOf(new Date(iso))),
  });
  const go = (route: string) => () => router.push(route as Href);

  return (
    <ScrollView contentContainerClassName="gap-7 px-5 pb-12 pt-4" contentInsetAdjustmentBehavior="automatic">
      <ListSection title={w.onPhoneTitle}>
        <ListRow title={page.onPhone} testID="whereLive.onPhone" />
      </ListSection>

      <ListSection title={w.newPhoneTitle} footer={page.footer ?? undefined}>
        <ListRow
          accessibilityRole="link"
          title={w.iphoneBackup.title}
          subtitle={w.iphoneBackup.body}
          value={w.iphoneBackup.howTo}
          trailing="chevron"
          accessibilityHint={w.iphoneBackup.howToHint}
          onPress={() => void WebBrowser.openBrowserAsync(APPLE_ICLOUD_BACKUP_HELP)}
          testID="whereLive.iphoneBackup"
        />
        <ListRow title={copy.settingsHome.exportLabel} subtitle={page.exportLine} trailing="chevron" onPress={go('/settings/export')} testID="whereLive.export" />
        {page.backup === 'row' ? (
          <ListRow title={backupCopy.title} value={backupValue} trailing="chevron" onPress={go('/settings/backup')} testID="whereLive.backup" />
        ) : (
          <ListRow title={w.backupTitle} value={w.backupLater} testID="whereLive.backup" />
        )}
      </ListSection>

      {page.nudge ? (
        <Text variant="footnote" className="-mt-4 px-4">
          {page.nudge}
        </Text>
      ) : null}

      {orphans > 0 && (
        <ListSection title={r.orphansTitle}>
          <ListRow title={plural(orphans, r.orphansOne, fill(r.orphansMany, { count: orphans }))} />
        </ListSection>
      )}

      {unplayable > 0 && (
        <ListSection title={r.unplayableTitle}>
          <ListRow title={plural(unplayable, r.unplayableOne, fill(r.unplayableMany, { count: unplayable }))} />
        </ListSection>
      )}
      {/* ERASE_ROW: "Erase everything on this phone" (#520, design.md 2.7) goes here, a destructive row, once merged. */}
    </ScrollView>
  );
}

function readLastExport(): string | null {
  try {
    return getSetting(LAST_EXPORT_SETTING);
  } catch {
    return null;
  }
}

/** On or Off for Back up my recordings, from backup's own state; undefined until it has one. */
function useBackupValue(): string | undefined {
  const read = () => {
    const s = loadBackup()?.backupView()?.status.kind;
    if (!s || s === 'unavailable') return undefined;
    return s === 'off' || s === 'needs_consent' ? backupCopy.rowOff : backupCopy.rowOn;
  };
  const [value, setValue] = useState<string | undefined>(read);
  useEffect(() => loadBackup()?.subscribeBackup(() => setValue(read())), []); // eslint-disable-line react-hooks/exhaustive-deps
  return value;
}
