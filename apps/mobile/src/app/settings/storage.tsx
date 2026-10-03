import { Stack } from 'expo-router';
import { useState } from 'react';
import { Alert, ScrollView, View } from 'react-native';
import { Button, ListRow, ListSection, Text, ToggleRow } from '@/components/ui';
import { fill } from '@/lib/copy';
import {
  allowCellular,
  cancelPack,
  ensurePack,
  removePack,
  setAllowCellular,
  storageBytes,
  usePacks,
  type InstalledPack,
  type PackProgress,
} from '@/lib/packs';
import { formatBytes, packsCopy as t } from '@/lib/packs/copy';
import { getPackManifest } from '@/lib/remote';

/**
 * Settings > Storage (founder decision 15): what is downloaded, how big, and
 * a way to remove it. Downloads in progress show their state with Stop and
 * Try again. Letters and recordings never appear here and are never touched
 * (they live in Documents, not in the packs folder).
 *
 * Reached from a Settings row (the coordinator adds it to settings/index.tsx).
 */

const ACTIVE: PackProgress['phase'][] = ['queued', 'waiting_for_wifi', 'downloading', 'verifying', 'installing', 'cancelled', 'failed'];

function packName(p: { kind: string; language: string }): string {
  const language = t.languages[p.language] ?? p.language;
  const kind = (t.kinds as Record<string, string>)[p.kind] ?? p.kind;
  return `${language}, ${kind}`;
}

function nameFor(id: string): string {
  const entry = getPackManifest()?.packs.find((e) => e.id === id);
  return entry ? packName(entry) : id;
}

function progressLine(p: PackProgress): string {
  const phase = (t.phases as Record<string, string>)[p.phase] ?? t.phases.downloading;
  if (p.phase === 'failed' || p.phase === 'cancelled') return p.failure ? (t.failures[p.failure] ?? t.failures.generic) : phase;
  if (p.phase === 'downloading' && p.bytesTotal > 0) return `${phase}, ${fill(t.sizeOf, { n: formatBytes(p.bytesDone), count: formatBytes(p.bytesTotal) })}`;
  return phase;
}

function ProgressBar({ done, total }: { done: number; total: number }) {
  const pct = total > 0 ? Math.min(100, Math.round((done / total) * 100)) : 0;
  return (
    <View
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 100, now: pct }}
      className="h-1.5 overflow-hidden rounded-full bg-secondary">
      <View className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
    </View>
  );
}

export default function Storage() {
  const { installed, progress } = usePacks();
  const [cellular, setCellular] = useState(allowCellular);
  const used = storageBytes();
  const installedIds = new Set(installed.map((p) => p.id));
  // A failed or stopped background update of an installed pack is not shown: the installed version keeps working.
  const inFlight = Object.values(progress).filter(
    (p) => ACTIVE.includes(p.phase) && !(installedIds.has(p.id) && (p.phase === 'failed' || p.phase === 'cancelled')),
  );

  const confirmRemove = (pack: InstalledPack) => {
    Alert.alert(t.confirmTitle, t.confirmBody, [
      { text: t.confirmKeepButton, style: 'cancel' },
      { text: t.confirmRemoveButton, style: 'destructive', onPress: () => void removePack(pack.id) },
    ]);
  };

  return (
    <ScrollView contentContainerClassName="gap-7 px-5 pb-12 pt-4" contentInsetAdjustmentBehavior="automatic">
      <Stack.Screen options={{ title: t.title }} />
      <Text variant="subhead" tone="muted">
        {t.intro}
      </Text>

      {inFlight.length > 0 && (
        <ListSection title={t.inProgressTitle}>
          {inFlight.map((p) => (
            <View key={p.id} className="gap-2 px-4 py-3">
              <Text variant="body">{nameFor(p.id)}</Text>
              <Text variant="footnote" accessibilityLiveRegion="polite">
                {progressLine(p)}
              </Text>
              {p.phase === 'downloading' && <ProgressBar done={p.bytesDone} total={p.bytesTotal} />}
              <View className="flex-row gap-2">
                {p.phase === 'downloading' || p.phase === 'queued' || p.phase === 'waiting_for_wifi' ? (
                  <Button variant="quiet" size="sm" onPress={() => cancelPack(p.id)}>
                    <Text>{t.stopButton}</Text>
                  </Button>
                ) : (
                  <Button variant="quiet" size="sm" onPress={() => void ensurePack(p.id, { requireLatest: true, allowCellularOnce: true })}>
                    <Text>{t.retryButton}</Text>
                  </Button>
                )}
              </View>
            </View>
          ))}
        </ListSection>
      )}

      <ListSection title={t.downloadedTitle} footer={t.keepNote}>
        {installed.length === 0 ? (
          <ListRow title={t.empty} />
        ) : (
          [
            <ListRow key="total" title={t.totalLabel} trailing={formatBytes(used.installed + used.partial)} />,
            ...installed.map((p) => (
              <View key={p.id} className="flex-row items-center gap-3 pr-2">
                <View className="flex-1">
                  <ListRow title={packName(p)} subtitle={formatBytes(p.bytes)} />
                </View>
                <Button variant="destructive" size="sm" accessibilityLabel={fill(t.removeA11y, { name: packName(p) })} onPress={() => confirmRemove(p)}>
                  <Text>{t.removeButton}</Text>
                </Button>
              </View>
            )),
          ]
        )}
      </ListSection>

      <ListSection footer={t.cellularHelp}>
        <ToggleRow
          title={t.cellularTitle}
          value={cellular}
          onValueChange={(v) => {
            setCellular(v);
            setAllowCellular(v);
          }}
        />
      </ListSection>
    </ScrollView>
  );
}
