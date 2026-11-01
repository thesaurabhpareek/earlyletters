// web: same | android: same
/**
 * One person on the Family tab, as a signature (EXPERIENCE_PASS_2026-10 S57; COMPONENTS 2.16 Signature):
 * "From Mama" in the letter's signature face (Literata Italic 17) with "You" or "Co-parent" in `footnote`
 * `textMuted` under it. No avatar, no initials, no email address: people are signatures, not accounts.
 *
 * A pending invite is the same row with its line in `textMuted` ("Your co-parent") and, as `status`, the day its
 * link stops working under it; the row's actions sit below (the screen passes them as children).
 *
 * `wash`: a new value runs the 1.6 s accentSoft wash once behind the row (the first time this phone shows the
 * co-parent). It is a fade either way, so Reduce Motion shows the same still wash, then fades it.
 */
import { useEffect, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { ReduceMotion, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { tokens } from '@scribe/design-tokens';
import { Text } from '@/components/ui/text';
import { useTheme } from '@/lib/a11y';
import { rowLabel, rowLine } from './family-tab.logic';

interface Props {
  /** "From Mama", or the role word when the person set no sign-off. */
  signature: string;
  /** "You" or "Co-parent". */
  role?: string;
  /** A pending invite's line ("Invited, open until October 23"), shown in place of the role. */
  status?: string;
  /** A pending invite: the signature line is muted, because nobody has signed anything yet. */
  pending?: boolean;
  wash?: number;
  testID?: string;
  children?: ReactNode;
}

export function MemberRow({ signature, role, status, pending, wash, testID, children }: Props) {
  const line = status ?? role ?? '';
  const under = rowLine(signature, line);
  return (
    <View testID={testID} className="py-3">
      <Wash run={wash} />
      <View accessible accessibilityLabel={rowLabel(signature, line)} className="gap-0.5">
        <Text variant="signature" tone={pending ? 'muted' : 'default'}>
          {signature}
        </Text>
        {under ? <Text variant="footnote">{under}</Text> : null}
      </View>
      {children}
    </View>
  );
}

function Wash({ run }: { run?: number }) {
  const { c } = useTheme();
  const o = useSharedValue(0);
  useEffect(() => {
    if (!run) return;
    o.value = 1;
    o.value = withTiming(0, { duration: tokens.motion.newMarkMs, reduceMotion: ReduceMotion.Never });
  }, [run, o]);
  const style = useAnimatedStyle(() => ({ opacity: o.value }));
  return (
    <Animated.View
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[StyleSheet.absoluteFill, { left: -12, right: -12, backgroundColor: c.accentSoft, borderRadius: tokens.radius.md }, style]}
    />
  );
}
