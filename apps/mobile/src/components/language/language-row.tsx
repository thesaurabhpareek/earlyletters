// web: apps/web/components/language/language-row.tsx (later) | android: same code
/**
 * One chosen language in Settings, Spoken language: its own name (in its
 * own script and direction), its English name, and its text-rules pack
 * status ("On this phone, 7 KB", "Downloading, 40%"). The primary row opens
 * the picker; other rows have a visible Remove button that is its own
 * VoiceOver element (a ListRow would merge it into the row's label), and
 * both offer Remove and Try again as accessibility actions too.
 */
import { CaretRightIcon } from 'phosphor-react-native/src/icons/CaretRight';
import { Platform, Pressable, View, type AccessibilityActionEvent } from 'react-native';
import { languageInfo, type LanguageCode } from '@scribe/core';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { useTheme } from '@/lib/a11y';
import { fill } from '@/lib/copy';
import { formatBytes } from '@/lib/language/spoken-language.logic';
import type { TextRulesStatus } from '@/lib/language/packs';
import { cn } from '@/lib/utils';
import { languageCopy } from './copy';

/** Status line for a language's text-rules pack. Pure; exported for the screen's footer logic. */
export function statusText(status: TextRulesStatus | undefined): string {
  const s = languageCopy.status;
  if (!status) return '';
  switch (status.state) {
    case 'bundled':
      return s.bundled;
    case 'installed':
      return fill(s.installed, { size: formatBytes(status.bytes) });
    case 'downloading':
      return fill(s.downloading, { percent: status.bytesTotal > 0 ? Math.min(99, Math.floor((status.bytesDone / status.bytesTotal) * 100)) : 0 });
    case 'absent':
      return status.bytes ? fill(s.absent, { size: formatBytes(status.bytes) }) : s.absentNoSize;
    case 'waiting': {
      const size = status.bytes ? formatBytes(status.bytes) : '';
      switch (status.reason) {
        case 'waiting_for_wifi':
          return fill(s.waitingForWifi, { size });
        case 'offline':
          return s.offline;
        case 'no_space':
          return fill(s.noSpace, { size });
        case 'needs_app_update':
          return s.needsUpdate;
        case 'downloads_paused':
          return s.paused;
        default:
          return s.retry;
      }
    }
  }
}

/** Failures the person can act on by tapping: try again, or download on mobile data once. */
export function canRetry(status: TextRulesStatus | undefined): boolean {
  return status?.state === 'waiting' && !['needs_app_update', 'downloads_paused', 'offline'].includes(status.reason);
}

export interface LanguageRowProps {
  code: LanguageCode;
  status: TextRulesStatus | undefined;
  first?: boolean;
  /** Primary row: opens the picker. */
  onChange?: () => void;
  /** Other rows: removes the language. */
  onRemove?: () => void;
  /** Shown when a download did not finish or waits for Wi-Fi. */
  onRetry?: () => void;
}

export function LanguageRow({ code, status, first, onChange, onRemove, onRetry }: LanguageRowProps) {
  const { c } = useTheme();
  const info = languageInfo(code);
  const line = statusText(status);
  const sameName = info.native === info.english;
  const retry = canRetry(status) && onRetry ? onRetry : undefined;
  const press = onChange ?? retry;
  const actions = [
    ...(onRemove ? [{ name: 'remove', label: languageCopy.remove }] : []),
    ...(retry ? [{ name: 'retry', label: languageCopy.status.retry }] : []),
  ];
  const onAction = (e: AccessibilityActionEvent) => {
    if (e.nativeEvent.actionName === 'remove') onRemove?.();
    if (e.nativeEvent.actionName === 'retry') retry?.();
  };

  return (
    <View className={cn('min-h-14 flex-row items-center gap-2 ps-4 pe-2', !first && 'border-t border-border')}>
      <Pressable
        onPress={press}
        disabled={!press}
        role={press ? 'button' : undefined}
        accessible
        accessibilityLabel={[info.english, sameName ? null : info.native, line].filter(Boolean).join(', ')}
        accessibilityHint={onChange ? languageCopy.change : undefined}
        accessibilityActions={actions}
        onAccessibilityAction={onAction}
        className={cn('flex-1 flex-row items-center gap-3 py-3', press && 'active:opacity-70')}>
        <View className="flex-1 gap-0.5">
          <Text variant="body" accessibilityLanguage={info.bcp47} style={{ writingDirection: info.script.direction }}>
            {info.native}
          </Text>
          <Text variant="footnote" tone="muted">
            {[sameName ? null : info.english, line].filter(Boolean).join(', ')}
          </Text>
        </View>
        {onChange && Platform.OS !== 'android' ? <CaretRightIcon size={16} color={c.textMuted} weight="bold" /> : null}
      </Pressable>
      {onRemove ? (
        <Button variant="quiet" size="sm" label={languageCopy.remove} accessibilityLabel={fill(languageCopy.removeA11y, { name: info.english })} onPress={onRemove} />
      ) : null}
    </View>
  );
}
