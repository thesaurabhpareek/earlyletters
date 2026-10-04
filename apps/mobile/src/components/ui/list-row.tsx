// web: apps/web/components/ui/list-row.tsx (later) | android: same; chevron hidden on Android when it ships
/**
 * ListSection, ListRow, ToggleRow (COMPONENTS 2.10, 2.11): the iOS inset-grouped list
 * (Settings, Apple Journal settings, Day One settings), drawn in paper tones.
 *
 * ListRow variants by trailing: 'chevron' (navigation), a value string, a node, or none.
 * Destructive rows use the destructive role and say the action in words.
 *
 * Accessibility contract
 * - One element per row; role button (pressable) or text. Min height 44, grows with type.
 * - At AX sizes the trailing value moves under the title (TDD 09 2.3); nothing truncates.
 * - ToggleRow: the switch (platform/toggle) carries label and description; the visible
 *   text is hidden from VoiceOver so it is read once, as "Label, switch, on".
 * Haptics: none (navigation is not a haptic moment; the native switch has its own).
 */
import { CaretRightIcon } from 'phosphor-react-native/src/icons/CaretRight';
import * as React from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import { Toggle } from '@/components/platform/toggle';
import { Text } from '@/components/ui/text';
import { useIsAccessibilitySize, useTheme } from '@/lib/a11y';
import { cn } from '@/lib/utils';
import { DIVIDER_INSET, withDividers } from './list-row.logic';

export function ListSection({ title, footer, children, className }: { title?: string; footer?: string; children: React.ReactNode; className?: string }) {
  // Fragments count as one row; pass rows directly (arrays and conditionals are fine).
  const rows = React.Children.toArray(children).filter(Boolean);
  return (
    <View className={cn('gap-2', className)}>
      {title ? (
        <Text variant="footnote" caps asHeading className="px-4" style={{ letterSpacing: 0.6 }}>
          {title}
        </Text>
      ) : null}
      <View className="overflow-hidden rounded-lg bg-card dark:border dark:border-border">
        {withDividers(rows, rowHasLeading).map((item) =>
          item.type === 'divider' ? <ListDivider key={item.key} inset={item.inset} /> : <React.Fragment key={item.key}>{item.row}</React.Fragment>,
        )}
      </View>
      {footer ? (
        <Text variant="footnote" className="px-4">
          {footer}
        </Text>
      ) : null}
    </View>
  );
}

/** A ListRow with a leading icon: its divider lines up with the row's text, not the icon. */
function rowHasLeading(row: React.ReactNode): boolean {
  return React.isValidElement<{ leading?: unknown }>(row) && row.type === ListRow && !!row.props.leading;
}

/** The hairline between two rows: inset from the leading edge, never the row itself (list-row.logic.ts). */
export function ListDivider({ inset = DIVIDER_INSET }: { inset?: number }) {
  return <View accessible={false} importantForAccessibility="no" className="bg-border" style={{ height: StyleSheet.hairlineWidth, marginLeft: inset }} />;
}

export type ListRowProps = {
  title: string;
  subtitle?: string;
  leading?: React.ReactNode;
  trailing?: 'chevron' | 'none' | string | React.ReactNode;
  variant?: 'default' | 'destructive';
  /** A value shown before the chevron (Apple Settings "Reminders  Few times a week  >"). With a string `trailing`, that string wins. */
  value?: string;
  onPress?: () => void;
  disabled?: boolean;
  accessibilityHint?: string;
  /** 'link' for rows that open a web page (Privacy Policy, Terms). */
  accessibilityRole?: 'button' | 'link';
};

export function ListRow({ title, subtitle, leading, trailing = 'none', value: valueProp, variant = 'default', onPress, disabled, accessibilityHint, accessibilityRole = 'button' }: ListRowProps) {
  const { c } = useTheme();
  const ax = useIsAccessibilitySize();
  const value = typeof trailing === 'string' && trailing !== 'chevron' && trailing !== 'none' ? trailing : (valueProp ?? null);
  const node = trailing !== 'chevron' && trailing !== 'none' && typeof trailing !== 'string' ? trailing : null;
  const label = [title, subtitle, value].filter(Boolean).join(', ');

  const body = (
    <>
      {leading ? <View className="w-7 items-center">{leading}</View> : null}
      <View className={cn('flex-1', ax ? 'gap-1' : 'flex-row items-center gap-3')}>
        <View className={cn(!ax && 'flex-1', 'gap-0.5')}>
          <Text variant="body" tone={variant === 'destructive' ? 'destructive' : disabled ? 'muted' : 'default'}>
            {title}
          </Text>
          {subtitle ? <Text variant="footnote">{subtitle}</Text> : null}
        </View>
        {value ? (
          <Text variant="body" tone="muted" className={ax ? undefined : 'max-w-[50%] text-right'}>
            {value}
          </Text>
        ) : null}
      </View>
      {node}
      {trailing === 'chevron' && !disabled && Platform.OS !== 'android' ? <CaretRightIcon size={16} color={c.textMuted} weight="bold" /> : null}
    </>
  );

  const rowClass = 'min-h-11 flex-row items-center gap-3 px-4 py-3';
  if (!onPress) {
    return (
      <View className={rowClass} accessible accessibilityLabel={label} accessibilityState={disabled ? { disabled: true } : undefined}>
        {body}
      </View>
    );
  }
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      role={accessibilityRole}
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: !!disabled }}
      className={cn(rowClass, 'active:bg-secondary', Platform.select({ web: 'outline-none focus-visible:bg-secondary' }))}>
      {body}
    </Pressable>
  );
}

export function ToggleRow({ title, description, value, onValueChange, disabled }: { title: string; description?: string; value: boolean; onValueChange: (v: boolean) => void; disabled?: boolean }) {
  const ax = useIsAccessibilitySize();
  return (
    <View className={cn('min-h-11 px-4 py-3', ax ? 'gap-3' : 'flex-row items-center gap-3')}>
      <View className={cn(!ax && 'flex-1', 'gap-0.5')} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        <Text variant="body" tone={disabled ? 'muted' : 'default'}>
          {title}
        </Text>
        {description ? <Text variant="footnote">{description}</Text> : null}
      </View>
      <Toggle label={title} description={description} value={value} onValueChange={onValueChange} disabled={disabled} />
    </View>
  );
}
