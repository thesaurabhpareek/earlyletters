import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import { Stack } from 'expo-router';
import { BookOpenIcon } from 'phosphor-react-native/src/icons/BookOpen';
import { CheckCircleIcon } from 'phosphor-react-native/src/icons/CheckCircle';
import { DatabaseIcon } from 'phosphor-react-native/src/icons/Database';
import { FileTextIcon } from 'phosphor-react-native/src/icons/FileText';
import { LockSimpleIcon } from 'phosphor-react-native/src/icons/LockSimple';
import { MicrophoneIcon } from 'phosphor-react-native/src/icons/Microphone';
import { WarningCircleIcon } from 'phosphor-react-native/src/icons/WarningCircle';
import { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Linking, ScrollView, View } from 'react-native';
import { supportMailto } from '@scribe/brand';
import { BookCover } from '@/components/book/book-cover';
import { exportEmpty, exportFailure, INSIDE } from '@/components/settings/export.logic';
import { ListRow, ListSection } from '@/components/ui/list-row';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { trackExportCompleted, trackExportFailed, trackExportStarted } from '@/lib/analytics/track';
import { copy, fill } from '@/lib/copy';
import {
  cleanupExports,
  ExportCancelledError,
  exportCopy,
  ExportLowSpaceError,
  exportSummary,
  ExportTooLargeError,
  runExport,
  shareExport,
  type ExportProgress,
  type ExportResult,
} from '@/lib/export';
import { haptic } from '@/lib/haptics';
import { dayDate, isoOf } from '@/lib/dates';
import { getActiveChild, getSetting, listChildren, setSetting } from '@/lib/store';

/** Settings key: when a copy of the book was last prepared and handed to the share sheet (D-085). */
const LAST_EXPORT_SETTING = 'lastExportedAt';

function readLastExport(): string | null {
  try {
    return getSetting(LAST_EXPORT_SETTING);
  } catch {
    return null;
  }
}
import { useTheme } from '@/lib/a11y';

type State =
  | { kind: 'idle' }
  | { kind: 'running'; progress: ExportProgress }
  | { kind: 'ready'; result: ExportResult }
  | { kind: 'shared' }
  | { kind: 'cancelled' }
  | { kind: 'failed'; reason: 'tooBig' | 'lowSpace' | 'other' };

const KEEP_AWAKE = 'export';

/**
 * Export everything (C-REQ-017, LEGAL-REQ-034, DATA-REQ-050 to -053, -056; EXPERIENCE_PASS_2026-10 S43, package P6).
 * Free in every plan state, offline, no Plus UI anywhere on this screen.
 * Progress has no animation (Reduce Motion), and nothing is timed.
 *
 * The book's own cover at the top (closed, the thumbnail size), what is inside with a glyph per row, and every failure
 * naming its cause with an action that can work (components/settings/export.logic.ts): too big leads to "Write to us".
 */
const INSIDE_ICON = { FileText: FileTextIcon, Microphone: MicrophoneIcon, BookOpen: BookOpenIcon, Database: DatabaseIcon } as const;
export default function ExportScreen() {
  const c = useTheme().c;
  const e = copy.settings.export;
  const s = exportCopy.screen;
  const [state, setState] = useState<State>({ kind: 'idle' });
  const [summary] = useState(() => {
    try {
      return exportSummary();
    } catch {
      return null;
    }
  });
  const [lastExport, setLastExport] = useState(readLastExport);
  // The cover of the book being exported (the active one), with the next book fanned behind it when there are more.
  const [cover] = useState(() => {
    try {
      const active = getActiveChild();
      const other = listChildren().find((ch) => ch.id !== active?.id);
      return active ? { name: active.name, behind: other?.name } : null;
    } catch {
      return null;
    }
  });
  const signal = useRef({ aborted: false });
  const pending = useRef<ExportResult | null>(null);

  useEffect(() => {
    cleanupExports(); // anything left from an earlier visit
    return () => {
      signal.current.aborted = true;
      void deactivateKeepAwake(KEEP_AWAKE).catch(() => {});
      if (pending.current) cleanupExports(); // never leave an unlocked copy behind
    };
  }, []);

  const start = async () => {
    haptic('press');
    const startedAt = Date.now();
    trackExportStarted({ letters: summary?.letters ?? 0 });
    signal.current = { aborted: false };
    setState({ kind: 'running', progress: { phase: 'books', fraction: 0 } });
    void activateKeepAwakeAsync(KEEP_AWAKE).catch(() => {});
    try {
      const result = await runExport({
        signal: signal.current,
        onProgress: (progress) => setState((prev) => (prev.kind === 'running' ? { kind: 'running', progress } : prev)),
      });
      pending.current = result;
      trackExportCompleted({ bytes: result.bytes, durationMs: Date.now() - startedAt });
      haptic('success');
      AccessibilityInfo.announceForAccessibility(e.ready);
      setState({ kind: 'ready', result });
    } catch (err) {
      if (err instanceof ExportCancelledError) {
        trackExportFailed({ reason: 'cancelled' });
        setState({ kind: 'cancelled' });
      } else {
        const reason = err instanceof ExportTooLargeError ? 'tooBig' : err instanceof ExportLowSpaceError ? 'lowSpace' : 'other';
        trackExportFailed({ reason: reason === 'tooBig' ? 'too_large' : reason === 'lowSpace' ? 'low_space' : 'unknown' });
        setState({ kind: 'failed', reason });
      }
    } finally {
      void deactivateKeepAwake(KEEP_AWAKE).catch(() => {});
    }
  };

  const stop = () => {
    signal.current.aborted = true;
    haptic('tap');
  };

  const share = async (result: ExportResult) => {
    try {
      // "Prepared", not "saved": the share result does not say whether the person kept the file.
      const at = new Date().toISOString();
      try {
        setSetting(LAST_EXPORT_SETTING, at);
        setLastExport(at);
      } catch {
        // the date is a courtesy; the export goes ahead
      }
      await shareExport(result, e.title);
    } finally {
      pending.current = null;
      setState({ kind: 'shared' });
    }
  };

  const running = state.kind === 'running';
  const empty = exportEmpty(summary);
  const percent = running ? Math.round(state.progress.fraction * 100) : 0;
  const phaseText = running ? (state.progress.phase === 'checking' ? s.checking : state.progress.fraction < 0.02 ? e.preparing : s.packing) : '';

  return (
    <ScrollView contentContainerClassName="gap-7 px-5 pb-12 pt-4" contentInsetAdjustmentBehavior="automatic">
      <Stack.Screen options={{ title: e.title }} />

      {cover ? (
        <View className="items-center pt-2" testID="export.cover">
          <BookCover name={cover.name} behindName={cover.behind} size="thumb" animate={false} />
        </View>
      ) : null}
      <Text variant="subhead" tone="muted">
        {s.offlineNote}
      </Text>

      <ListSection footer={e.exportNudge}>
        <ListRow title={lastExport ? fill(e.lastExport, { date: dayDate(isoOf(new Date(lastExport))) }) : e.neverExported} />
      </ListSection>

      <ListSection title={s.includesTitle}>
        {INSIDE.map(({ key, icon }) => {
          const Icon = INSIDE_ICON[icon];
          return <ListRow key={key} title={s[key]} leading={<Icon size={20} color={c.textMuted} />} />;
        })}
      </ListSection>

      {(state.kind === 'idle' || state.kind === 'cancelled' || state.kind === 'shared' || state.kind === 'failed') && (
        <View className="gap-3">
          {state.kind === 'cancelled' && (
            <Text accessibilityLiveRegion="polite" className="text-sm text-muted-foreground">
              {s.cancelled}
            </Text>
          )}
          {state.kind === 'shared' && (
            <Text accessibilityLiveRegion="polite" className="text-sm text-muted-foreground">
              {s.afterShare}
            </Text>
          )}
          {state.kind === 'failed' && <FailureCard reason={state.reason} />}
          {empty ? (
            <Text variant="subhead" className="text-center" testID="export.empty">
              {s.emptyNote}
            </Text>
          ) : null}
          {state.kind === 'failed' && exportFailure(state.reason).action === 'writeToUs' ? (
            // Too big: exporting again would fail the same way, so the way on is to write to us (S43).
            <Button size="lg" label={copy.settingsHome.helpValue} onPress={() => void Linking.openURL(supportMailto(copy.settingsHome.helpSubject))} testID="export.writeToUs" />
          ) : (
            <Button size="lg" onPress={() => void start()} disabled={empty} testID="export.start">
              <Text>{state.kind === 'idle' ? e.button : s.againButton}</Text>
            </Button>
          )}
        </View>
      )}

      {running && (
        <View className="gap-3">
          <Text accessibilityLiveRegion="polite" className="text-base text-foreground">
            {phaseText}
          </Text>
          <View
            accessible
            accessibilityRole="progressbar"
            accessibilityLabel={s.progressA11y}
            accessibilityValue={{ min: 0, max: 100, now: percent }}
            className="h-2 overflow-hidden rounded-full"
            style={{ backgroundColor: c.line }}>
            {/* No animation: the width steps with progress, so Reduce Motion needs nothing extra. */}
            <View className="h-full" style={{ width: `${percent}%`, backgroundColor: c.accent }} />
          </View>
          <Button variant="secondary" onPress={stop} className="self-start">
            <Text>{s.cancelButton}</Text>
          </Button>
        </View>
      )}

      {state.kind === 'ready' && (
        <View className="gap-4">
          <View className="flex-row items-center gap-2">
            <CheckCircleIcon size={22} color={c.accent} weight="fill" />
            <Text role="heading" className="text-lg font-medium text-foreground">
              {e.ready}
            </Text>
          </View>
          {state.result.mismatched > 0 && <Text className="text-sm leading-5 text-muted-foreground">{s.integrityNote}</Text>}
          <View className="flex-row gap-2">
            <LockSimpleIcon size={18} color={c.textMuted} />
            <Text className="flex-1 text-sm leading-5 text-muted-foreground">{s.privacyNotice}</Text>
          </View>
          <Button size="lg" onPress={() => void share(state.result)}>
            <Text>{s.shareButton}</Text>
          </Button>
        </View>
      )}
    </ScrollView>
  );
}

/** A failure names its cause (S43): the warning mark in caution, the title, and the line when there is one. */
function FailureCard({ reason }: { reason: 'tooBig' | 'lowSpace' | 'other' }) {
  const { c } = useTheme();
  const f = exportFailure(reason);
  return (
    <View accessible accessibilityLiveRegion="polite" className="gap-1 rounded-[14px] bg-secondary p-4" testID="export.failed">
      <View className="flex-row items-center gap-2">
        <WarningCircleIcon size={20} color={c.caution} weight="bold" />
        <Text variant="headline" asHeading className="shrink">
          {f.title}
        </Text>
      </View>
      {f.body ? <Text variant="subhead">{f.body}</Text> : null}
    </View>
  );
}
