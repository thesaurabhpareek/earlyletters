// web: same | android: same
/**
 * The leave sheet's two choices (EXPERIENCE_PASS_2026-10 S60): two equal cards in one radio group, `surfaceRaised`
 * with a 1 pt `controlBorder` edge; chosen: `accentSoft` fill, a 1.5 pt `accent` edge and a check, never colour
 * alone. Nothing is chosen on arrival (R4 PT-14). Each card carries the line that says what follows (R4 PT-15).
 * A change of choice gives the `tap` selection tick (MOTION 6), as ChoiceGroup does.
 */
import { CheckIcon } from 'phosphor-react-native/src/icons/Check';
import { Platform, View } from 'react-native';
import { tokens } from '@scribe/design-tokens';
import { AnimatedPressable, usePressScale } from '@/components/motion/press';
import { Text } from '@/components/ui/text';
import { useTheme } from '@/lib/a11y';
import { haptic } from '@/lib/haptics';
import { cn } from '@/lib/utils';
import type { LeaveChoice } from './leave-sheet.logic';

export function LeaveChoices({
  label,
  options,
  value,
  onChange,
  disabled,
}: {
  label: string;
  options: { value: LeaveChoice; label: string; help: string }[];
  value: LeaveChoice | null;
  onChange: (v: LeaveChoice) => void;
  disabled?: boolean;
}) {
  return (
    <View accessibilityRole="radiogroup" accessibilityLabel={label} testID="leave.choice" className="gap-3">
      {options.map((o) => (
        <ChoiceCard
          key={o.value}
          option={o}
          checked={o.value === value}
          disabled={disabled}
          onPress={() => {
            if (o.value === value) return;
            haptic('tap');
            onChange(o.value);
          }}
        />
      ))}
    </View>
  );
}

function ChoiceCard({ option, checked, disabled, onPress }: { option: { value: LeaveChoice; label: string; help: string }; checked: boolean; disabled?: boolean; onPress: () => void }) {
  const { c } = useTheme();
  const press = usePressScale('card', !disabled);
  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={press.onPressIn}
      onPressOut={press.onPressOut}
      disabled={disabled}
      testID={`leave.choice.${option.value}`}
      accessibilityRole="radio"
      accessibilityState={{ checked, disabled: !!disabled }}
      accessibilityLabel={option.label}
      accessibilityHint={option.help}
      className={cn('min-h-14 flex-row items-start gap-3 rounded-md p-4', checked ? 'bg-secondary' : 'bg-card', Platform.select({ web: 'outline-none focus-visible:ring-2 focus-visible:ring-ring' }))}
      style={[{ borderWidth: checked ? tokens.stroke.selected : tokens.stroke.control, borderColor: checked ? c.accent : c.controlBorder }, press.animatedStyle]}>
      <View className="flex-1 gap-1">
        <Text variant="headline">{option.label}</Text>
        <Text variant="footnote">{option.help}</Text>
      </View>
      <View style={{ width: 24, alignItems: 'center' }}>{checked ? <CheckIcon size={22} color={c.accent} weight="bold" /> : null}</View>
    </AnimatedPressable>
  );
}
