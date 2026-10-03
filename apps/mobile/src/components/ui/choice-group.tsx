// web: apps/web/components/ui/radio-group.tsx + toggle-group (shadcn) | android: same
/**
 * ChoiceGroup and Chip (COMPONENTS 2.6, 2.9; TDD 09 A11Y-F06).
 *
 * ChoiceGroup: pick one of a few options.
 *   layout "segmented"  equal pills side by side (Birthday / Not here yet); they stack at
 *                       xxxLarge text, so a label never squeezes (Apple Settings pattern).
 *   layout "list"       full-width rows with a trailing check (Reading Size, theme), the
 *                       iOS inset-list pattern; each row may preview its own option.
 * Radio semantics: role radiogroup with a label; each option role radio with
 * accessibilityState.checked (not `selected`, which VoiceOver does not read for radios).
 * Selected is shown by fill + 1.5 pt accent edge + a check, never colour alone.
 *
 * Chip: a 36 pt pill that reaches 44 pt through hitSlop.
 *   suggestion  fills a field ("Mama", "Papa"); selected when it matches
 *   filter      toggles a filter (role button + selected)
 *   tag         read-only label (accentSoft)
 * Haptics: `tap` when a choice changes (a selection tick); none for tags.
 */
import { CheckIcon } from 'phosphor-react-native/src/icons/Check';
import * as React from 'react';
import { Platform, View } from 'react-native';
import type { Icon as PhosphorIcon } from 'phosphor-react-native';
import { tokens } from '@scribe/design-tokens';
import { AnimatedPressable, usePressScale } from '@/components/motion/press';
import { ListDivider } from '@/components/ui/list-row';
import { withDividers } from '@/components/ui/list-row.logic';
import { Text } from '@/components/ui/text';
import { haptic } from '@/lib/haptics';
import { useIsLargeText, useTheme } from '@/lib/a11y';
import { cn } from '@/lib/utils';

export type ChoiceOption<T extends string> = {
  value: T;
  label: string;
  description?: string;
  /** Custom label rendering (e.g. Reading Size shows each option at its own size). */
  render?: (checked: boolean) => React.ReactNode;
};

export type ChoiceGroupProps<T extends string> = {
  /** Read by VoiceOver for the group ("Reading size"). */
  label: string;
  /** Show the label above the group. */
  showLabel?: boolean;
  options: ChoiceOption<T>[];
  value: T;
  onChange: (v: T) => void;
  /** Every tap, including on the current value: for pickers that close once a choice is made (Whose book). */
  onSelect?: (v: T) => void;
  layout?: 'segmented' | 'list';
  className?: string;
};

export function ChoiceGroup<T extends string>({ label, showLabel, options, value, onChange, onSelect, layout = 'segmented', className }: ChoiceGroupProps<T>) {
  const stacked = useIsLargeText();
  const pick = (v: T) => {
    if (v !== value) {
      haptic('tap');
      onChange(v);
    }
    onSelect?.(v);
  };
  return (
    <View className={cn('gap-2', className)}>
      {showLabel && (
        <Text variant="labelSmall" tone="muted">
          {label}
        </Text>
      )}
      <View
        accessibilityRole="radiogroup"
        accessibilityLabel={label}
        className={cn(layout === 'list' ? 'overflow-hidden rounded-lg bg-card' : stacked ? 'flex-col gap-2' : 'flex-row gap-3')}>
        {layout === 'list'
          ? withDividers(options).map((item) =>
              item.type === 'divider' ? (
                <ListDivider key={item.key} />
              ) : (
                <ListChoice key={item.row.value} option={item.row} checked={item.row.value === value} onPress={() => pick(item.row.value)} />
              ),
            )
          : options.map((o) => <SegmentChoice key={o.value} option={o} checked={o.value === value} grow={!stacked} onPress={() => pick(o.value)} />)}
      </View>
    </View>
  );
}

function SegmentChoice<T extends string>({ option, checked, grow, onPress }: { option: ChoiceOption<T>; checked: boolean; grow: boolean; onPress: () => void }) {
  const { c } = useTheme();
  const press = usePressScale('control');
  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={press.onPressIn}
      onPressOut={press.onPressOut}
      accessibilityRole="radio"
      accessibilityState={{ checked }}
      accessibilityLabel={option.label}
      accessibilityHint={option.description}
      className={cn(
        'min-h-12 flex-row items-center justify-center gap-1.5 rounded-full px-4 py-2',
        grow && 'flex-1',
        checked ? 'bg-secondary' : 'bg-card',
        Platform.select({ web: 'outline-none focus-visible:ring-2 focus-visible:ring-ring' }),
      )}
      style={[{ borderWidth: checked ? tokens.stroke.selected : tokens.stroke.control, borderColor: checked ? c.accent : c.controlBorder }, press.animatedStyle]}>
      {checked && <CheckIcon size={16} color={c.accent} weight="bold" />}
      {option.render ? option.render(checked) : <Text variant="labelSmall" className="text-center">{option.label}</Text>}
    </AnimatedPressable>
  );
}

function ListChoice<T extends string>({ option, checked, onPress }: { option: ChoiceOption<T>; checked: boolean; onPress: () => void }) {
  const { c } = useTheme();
  return (
    <AnimatedPressable
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityState={{ checked }}
      accessibilityLabel={option.label}
      accessibilityHint={option.description}
      className="min-h-14 flex-row items-center gap-3 px-4 py-3 active:bg-secondary">
      <View className="flex-1 gap-0.5">
        {option.render ? option.render(checked) : <Text variant="label">{option.label}</Text>}
        {option.description ? <Text variant="footnote">{option.description}</Text> : null}
      </View>
      <View style={{ width: 24, alignItems: 'center' }}>{checked && <CheckIcon size={22} color={c.accent} weight="bold" />}</View>
    </AnimatedPressable>
  );
}

export type ChipProps = {
  label: string;
  variant?: 'suggestion' | 'filter' | 'tag';
  selected?: boolean;
  icon?: PhosphorIcon;
  onPress?: () => void;
  accessibilityHint?: string;
  className?: string;
};

export function Chip({ label, variant = 'suggestion', selected = false, icon: IconCmp, onPress, accessibilityHint, className }: ChipProps) {
  const { c } = useTheme();
  const press = usePressScale('control', !!onPress);
  const tag = variant === 'tag';
  const iconColor = tag ? c.text : selected ? c.accent : c.textMuted;
  const body = (
    <>
      {IconCmp ? <IconCmp size={14} color={iconColor} weight="bold" /> : selected && !tag ? <CheckIcon size={14} color={c.accent} weight="bold" /> : null}
      <Text variant={tag ? 'caption' : 'labelSmall'} tone="default">
        {label}
      </Text>
    </>
  );
  if (tag || !onPress) {
    return (
      <View className={cn('flex-row items-center gap-1 self-start rounded-full bg-secondary px-2.5 py-1', className)} accessibilityLabel={label}>
        {body}
      </View>
    );
  }
  return (
    <AnimatedPressable
      onPress={() => {
        haptic('tap');
        onPress();
      }}
      onPressIn={press.onPressIn}
      onPressOut={press.onPressOut}
      hitSlop={4}
      role="button"
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ selected }}
      className={cn(
        'min-h-9 flex-row items-center gap-1.5 rounded-full px-4 py-1.5',
        selected ? 'bg-secondary' : 'bg-card',
        Platform.select({ web: 'outline-none focus-visible:ring-2 focus-visible:ring-ring' }),
        className,
      )}
      style={[{ borderWidth: selected ? tokens.stroke.selected : tokens.stroke.control, borderColor: selected ? c.accent : c.controlBorder }, press.animatedStyle]}>
      {body}
    </AnimatedPressable>
  );
}

/** Wrapping row of chips with a group label for VoiceOver ("A few ideas"). */
export function ChipGroup({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <View accessibilityLabel={label} className={cn('flex-row flex-wrap gap-2', className)}>
      {children}
    </View>
  );
}
