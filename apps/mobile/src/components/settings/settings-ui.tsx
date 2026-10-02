// web: apps/web/components/settings (not yet) | android: same
import { CaretRightIcon, CheckIcon } from 'phosphor-react-native';
import type { ReactNode } from 'react';
import { Pressable, Switch, View, useColorScheme } from 'react-native';
import { tokens } from '@scribe/design-tokens';
import { Text } from '@/components/ui/text';
import { haptic } from '@/lib/haptics';
import { cn } from '@/lib/utils';

const useC = () => tokens[useColorScheme() === 'dark' ? 'dark' : 'light'];

/** Grouped section: muted header, rounded card, optional footer help. */
export function Section({ title, footer, children }: { title?: string; footer?: string; children: ReactNode }) {
  return (
    <View className="gap-2">
      {title && (
        <Text role="heading" maxFontSizeMultiplier={1.5} className="px-1 text-xs font-medium tracking-[1.2px] text-muted-foreground">
          {title.toUpperCase()}
        </Text>
      )}
      <View className="overflow-hidden rounded-[14px] border border-border bg-card">{children}</View>
      {footer && <Text className="px-1 text-sm leading-5 text-muted-foreground">{footer}</Text>}
    </View>
  );
}

interface RowProps {
  title: string;
  subtitle?: string;
  value?: string;
  onPress?: () => void;
  disabled?: boolean;
  destructive?: boolean;
  first?: boolean;
  accessibilityHint?: string;
  role?: 'button' | 'link';
}

/** COMPONENTS.md 2.11 ListRow: min 44pt, grows with type; one VoiceOver element reading label and value. */
export function Row({ title, subtitle, value, onPress, disabled, destructive, first, accessibilityHint, role = 'button' }: RowProps) {
  const c = useC();
  const body = (
    <>
      <View className="flex-1 gap-0.5">
        <Text className={cn('text-base', destructive ? 'text-caution' : 'text-foreground')}>{title}</Text>
        {subtitle && <Text className="text-sm leading-5 text-muted-foreground">{subtitle}</Text>}
      </View>
      {value && <Text className="max-w-[50%] text-right text-base text-muted-foreground">{value}</Text>}
      {onPress && !disabled && <CaretRightIcon size={16} color={c.textMuted} weight="bold" />}
    </>
  );
  const className = cn('min-h-12 flex-row items-center gap-3 px-4 py-3', !first && 'border-t border-border', disabled && 'opacity-60');
  const label = [title, value, subtitle].filter(Boolean).join(', ');
  if (!onPress) {
    return (
      <View accessible accessibilityLabel={label} accessibilityState={{ disabled }} className={className}>
        {body}
      </View>
    );
  }
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole={role}
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled }}
      className={cn(className, 'active:bg-secondary')}>
      {body}
    </Pressable>
  );
}

export function ToggleRow({
  title,
  subtitle,
  value,
  onChange,
  disabled,
  first,
}: {
  title: string;
  subtitle?: string;
  value: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
  first?: boolean;
}) {
  const c = useC();
  return (
    <View className={cn('min-h-12 flex-row items-center gap-3 px-4 py-3', !first && 'border-t border-border')}>
      <View className="flex-1 gap-0.5">
        <Text className={cn('text-base text-foreground', disabled && 'opacity-60')}>{title}</Text>
        {subtitle && <Text className="text-sm leading-5 text-muted-foreground">{subtitle}</Text>}
      </View>
      <Switch
        value={value}
        disabled={disabled}
        onValueChange={(v) => {
          haptic('tap');
          onChange(v);
        }}
        trackColor={{ true: c.accent, false: c.line }}
        accessibilityLabel={title}
        accessibilityHint={subtitle}
      />
    </View>
  );
}

/** Single-choice list (radio group) for theme, reading size and cadence. */
export function Choices<T extends string>({ options, value, onChange }: { options: { value: T; label: string }[]; value: T; onChange: (v: T) => void }) {
  const c = useC();
  return (
    <View accessibilityRole="radiogroup">
      {options.map((o, i) => {
        const selected = o.value === value;
        return (
          <Pressable
            key={o.value}
            onPress={() => {
              haptic('tap');
              onChange(o.value);
            }}
            accessibilityRole="radio"
            accessibilityState={{ selected }}
            accessibilityLabel={o.label}
            className={cn('min-h-12 flex-row items-center gap-3 px-4 py-3 active:bg-secondary', i > 0 && 'border-t border-border')}>
            <Text className="flex-1 text-base text-foreground">{o.label}</Text>
            {selected && <CheckIcon size={18} color={c.accent} weight="bold" />}
          </Pressable>
        );
      })}
    </View>
  );
}
