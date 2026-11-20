/**
 * AgreementRow (COMPONENTS 2.25, PR #596): an unticked clickwrap box with one sentence, for Before you begin
 * (founder decision F2; LEGAL-REQ-002 unchanged, CCO-6).
 *
 * Look: a 24 pt square box, radius.sm, 1 pt controlBorder edge; ticked, an accent fill with a Phosphor Check Bold
 * 16 in onAccent. The sentence in `body`, wrapping beside the box, which stays top-aligned. The whole row is the
 * target, at least 44 pt.
 * Links are never inside the label: a link inside a checkbox label cannot be reached with VoiceOver, so the screen
 * puts Terms and Privacy below the row as their own targets.
 * A11y: role checkbox, checked state, label = the sentence. `invalid` moves VoiceOver focus to the row; the screen's
 * reason line carries the words (never a status colour here).
 * Haptics: `tap` on change. Motion: the fill and check cross-fade on `snappy`; Reduce Motion, a `fadeMs` fade.
 */
import { CheckIcon } from 'phosphor-react-native/src/icons/Check';
import { useEffect, useRef } from 'react';
import { AccessibilityInfo, Platform, View } from 'react-native';
import Animated, { ReduceMotion, useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import { tokens } from '@scribe/design-tokens';
import { AnimatedPressable, usePressScale } from '@/components/motion/press';
import { Text } from '@/components/ui/text';
import { useTheme } from '@/lib/a11y';
import { haptic } from '@/lib/haptics';
import { useMotion } from '@/lib/motion';
import { cn } from '@/lib/utils';

export type AgreementRowProps = { label: string; checked: boolean; onChange: (v: boolean) => void; invalid?: boolean; testID?: string };

const BOX = 24;
const S = tokens.motion.snappy;

export function AgreementRow({ label, checked, onChange, invalid = false, testID }: AgreementRowProps) {
  const { c } = useTheme();
  const motion = useMotion();
  const press = usePressScale('control');
  const row = useRef<View>(null);
  const fill = useSharedValue(checked ? 1 : 0);

  useEffect(() => {
    const to = checked ? 1 : 0;
    fill.value = motion.reduced
      ? withTiming(to, { duration: tokens.motion.fadeMs, reduceMotion: ReduceMotion.Never })
      : withSpring(to, { stiffness: S.stiffness, damping: S.damping, mass: S.mass, reduceMotion: ReduceMotion.Never });
  }, [checked, motion.reduced, fill]);

  // The screen asked for the tick: VoiceOver goes to the box, and the reason line is announced by the screen.
  useEffect(() => {
    if (!invalid) return;
    const id = setTimeout(() => {
      const node = row.current as Parameters<typeof AccessibilityInfo.sendAccessibilityEvent>[0] | null;
      if (node) {
        try {
          AccessibilityInfo.sendAccessibilityEvent(node, 'focus');
        } catch {}
      }
    }, 100);
    return () => clearTimeout(id);
  }, [invalid]);

  const filled = useAnimatedStyle(() => ({ opacity: fill.value }));

  return (
    <AnimatedPressable
      ref={row}
      onPress={() => {
        haptic('tap');
        onChange(!checked);
      }}
      onPressIn={press.onPressIn}
      onPressOut={press.onPressOut}
      role="checkbox"
      accessibilityRole="checkbox"
      // aria-checked: one prop that VoiceOver (accessibilityState on iOS) and the web build both read.
      aria-checked={checked}
      accessibilityState={{ checked }}
      accessibilityLabel={label}
      testID={testID}
      className={cn('flex-row items-start gap-3 py-2.5', Platform.select({ web: 'outline-none focus-visible:ring-2 focus-visible:ring-ring' }))}
      style={[{ minHeight: tokens.target.min }, press.animatedStyle]}>
      <View
        style={{ width: BOX, height: BOX, marginTop: 1, borderRadius: tokens.radius.sm, borderWidth: tokens.stroke.control, borderColor: checked ? c.accent : c.controlBorder, overflow: 'hidden' }}>
        <Animated.View style={[{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: c.accent }, filled]}>
          <CheckIcon size={16} color={c.onAccent} weight="bold" />
        </Animated.View>
      </View>
      <Text variant="body" className="flex-1">
        {label}
      </Text>
    </AnimatedPressable>
  );
}
