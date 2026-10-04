import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import { Stack } from 'expo-router';
import { CheckCircleIcon } from 'phosphor-react-native/src/icons/CheckCircle';
import { LockSimpleIcon } from 'phosphor-react-native/src/icons/LockSimple';
import { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, ScrollView, View, useColorScheme } from 'react-native';
import { tokens } from '@scribe/design-tokens';
import { ListRow, ListSection } from '@/components/ui/list-row';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { trackExportCompleted, trackExportFailed, trackExportStarted } from '@/lib/analytics/track';
import { copy } from '@/lib/copy';
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

type State =
  | { kind: 'idle' }
  | { kind: 'running'; progress: ExportProgress }
  | { kind: 'ready'; result: ExportResult }
  | { kind: 'shared' }
  | { kind: 'cancelled' }
  | { kind: 'failed'; reason: 'tooBig' | 'lowSpace' | 'other' };

const KEEP_AWAKE = 'export';

/**
 * Export everything (C-REQ-017, LEGAL-REQ-034, DATA-REQ-050 to -053, -056).
 * Free in every plan state, offline, no Plus UI anywhere on this screen.
 * Progress has no animation (Reduce Motion), and nothing is timed.
 */
export default function ExportScreen() {
  const c = tokens[useColorScheme() === 'dark' ? 'dark' : 'light'];
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
      await shareExport(result, e.title);
    } finally {
      pending.current = null;
      setState({ kind: 'shared' });
    }
  };

  const running = state.kind === 'running';
  const percent = running ? Math.round(state.progress.fraction * 100) : 0;
  const phaseText = running ? (state.progress.phase === 'checking' ? s.checking : state.progress.fraction < 0.02 ? e.preparing : s.packing) : '';

  return (
    <ScrollView contentContainerClassName="gap-7 px-5 pb-12 pt-4" contentInsetAdjustmentBehavior="automatic">
      <Stack.Screen options={{ title: e.title }} />

      <View className="gap-2">
        <Text className="text-base leading-6 text-foreground">{e.body}</Text>
        <Text className="text-sm leading-5 text-muted-foreground">{s.offlineNote}</Text>
      </View>

      <ListSection title={s.includesTitle}>
        {[s.includesLetters, s.includesRecordings, s.includesBook, s.includesData].map((line) => (
          <ListRow key={line} title={line} />
        ))}
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
          {state.kind === 'failed' && (
            <View accessibilityLiveRegion="polite" className="gap-1 rounded-[14px] bg-secondary p-4">
              <Text role="heading" className="text-base font-medium text-foreground">
                {s.failedTitle}
              </Text>
              <Text className="text-sm leading-5 text-foreground">
                {state.reason === 'tooBig' ? s.tooBigBody : state.reason === 'lowSpace' ? s.lowSpaceBody : s.failedBody}
              </Text>
            </View>
          )}
          <Button size="lg" onPress={() => void start()} disabled={summary !== null && summary.letters === 0}>
            <Text>{state.kind === 'idle' ? e.button : s.againButton}</Text>
          </Button>
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
