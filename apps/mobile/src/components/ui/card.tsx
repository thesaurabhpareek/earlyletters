// web: apps/web/components/ui/card.tsx (shadcn Card) | android: same (boxShadow, never animated)
/**
 * Card (COMPONENTS 2.4): a grouped surface.
 *   raised    surfaceRaised + elevation 1 in light; a 1 pt `line` edge in dark (DESIGN_LANGUAGE 6)
 *   flat      surface tone, no shadow (grouped settings, trays)
 *   outlined  hairline `line` edge (decorative: the content identifies the card)
 *   tinted    accentSoft wash (the one warm card on a screen: a prompt, "This month")
 *
 * Pressable cards (onPress) are one VoiceOver element with one label (required), press
 * scale 0.98 on `snappy` (Airbnb listing card, Things 3 "objects, not rows").
 */
import * as React from 'react';
import { Platform, View, type PressableProps, type ViewProps } from 'react-native';
import { tokens } from '@scribe/design-tokens';
import { AnimatedPressable, usePressScale } from '@/components/motion/press';
import { Text, TextClassContext } from '@/components/ui/text';
import { useTheme } from '@/lib/a11y';
import { cn } from '@/lib/utils';

type Variant = 'raised' | 'flat' | 'outlined' | 'tinted';
type Padding = 0 | 3 | 4 | 5 | 6;

const PAD: Record<Padding, string> = { 0: 'p-0', 3: 'p-3', 4: 'p-4', 5: 'p-5', 6: 'p-6' };
const VARIANT: Record<Variant, string> = {
  raised: 'bg-card dark:border dark:border-border',
  flat: 'bg-muted',
  outlined: 'border border-border bg-card',
  tinted: 'bg-secondary',
};

type CommonProps = {
  variant?: Variant;
  padding?: Padding;
  /** Corner radius from the ladder: md 14 (letter cards), lg 20 (feature cards, default). */
  radius?: 'md' | 'lg' | 'xl';
  className?: string;
  children?: React.ReactNode;
};

export type CardProps = CommonProps &
  Omit<ViewProps, 'children'> & {
    onPress?: PressableProps['onPress'];
    onLongPress?: PressableProps['onLongPress'];
    /** Required with onPress: the whole card is one button. */
    accessibilityLabel?: string;
    accessibilityHint?: string;
  };

function useElevation(variant: Variant) {
  const { scheme } = useTheme();
  if (variant !== 'raised' || scheme === 'dark') return undefined;
  const e = tokens.elevation[1];
  return Platform.OS === 'web'
    ? { boxShadow: e.web }
    : { shadowColor: e.shadowColor, shadowOpacity: e.shadowOpacity, shadowRadius: e.shadowRadius, shadowOffset: e.shadowOffset, elevation: e.elevation };
}

function Card({ variant = 'raised', padding = 5, radius = 'lg', className, style, onPress, onLongPress, children, accessibilityLabel, accessibilityHint, ...props }: CardProps) {
  const shadow = useElevation(variant);
  const press = usePressScale('card', !!onPress);
  const classes = cn('flex flex-col gap-3', radius === 'md' ? 'rounded-md' : radius === 'xl' ? 'rounded-xl' : 'rounded-lg', VARIANT[variant], PAD[padding], className);

  return (
    <TextClassContext.Provider value="text-card-foreground">
      {onPress || onLongPress ? (
        <AnimatedPressable
          className={classes}
          style={[shadow, press.animatedStyle, style]}
          onPress={onPress}
          onLongPress={onLongPress}
          onPressIn={press.onPressIn}
          onPressOut={press.onPressOut}
          role="button"
          accessible
          accessibilityLabel={accessibilityLabel}
          accessibilityHint={accessibilityHint}
          {...(props as Omit<PressableProps, 'children' | 'style'>)}>
          {children}
        </AnimatedPressable>
      ) : (
        <View className={classes} style={[shadow, style]} accessibilityLabel={accessibilityLabel} accessibilityHint={accessibilityHint} {...props}>
          {children}
        </View>
      )}
    </TextClassContext.Provider>
  );
}

function CardHeader({ className, ...props }: React.ComponentProps<typeof View>) {
  return <View className={cn('flex flex-col gap-1.5', className)} {...props} />;
}

function CardTitle({ className, ...props }: React.ComponentProps<typeof Text>) {
  return <Text variant="headline" asHeading={3} className={className} {...props} />;
}

function CardDescription({ className, ...props }: React.ComponentProps<typeof Text>) {
  return <Text variant="subhead" tone="muted" className={className} {...props} />;
}

function CardContent({ className, ...props }: React.ComponentProps<typeof View>) {
  return <View className={cn('gap-2', className)} {...props} />;
}

function CardFooter({ className, ...props }: React.ComponentProps<typeof View>) {
  return <View className={cn('flex flex-row items-center gap-3', className)} {...props} />;
}

export { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle };
