// web: apps/web/components/ui/button.tsx (shadcn Button; default->primary, ghost->quiet) | android: same
/**
 * Button, IconButton, ButtonRow (COMPONENTS 2.1, 2.2).
 *
 * Variants: primary (accent fill), secondary (accentSoft fill), outline (controlBorder
 * edge, 3:1), quiet (no fill, accent label), destructive (no fill, destructive label;
 * the word carries the meaning, so Android's alert ignoring red is fine).
 * Older names still work: default = primary, ghost and link = quiet.
 * Sizes: sm 44 pt, md 48 pt, lg 56 pt (primary actions), capture 64 pt (Speak / Type,
 * icon above label), icon 44 x 44. The minimum is set twice, as a class and as a style
 * (BUTTON_MIN_HEIGHT), so a quiet text link is never under 44 pt on any platform.
 *
 * Accessibility contract
 * - role button; disabled and busy in accessibilityState; label = visible text (2.5.3).
 * - Heights are minimums: at AX sizes the label wraps and the button grows, never clips.
 * - Disabled keeps AA text (textMuted on surface 5.11 / 7.65) instead of 40% opacity.
 * Motion: press scale 0.97 on `snappy`, from press-in (motion/press.ts). Controls never
 * animate in (MOTION principle 2): no entering prop here, ever.
 * Haptics: none by default. Pass `haptic` only where the press is an outcome (Speak,
 * Save, Delete); navigation (Continue, Back, Close) is silent (MOTION 6).
 */
import { cva } from 'class-variance-authority';
import * as React from 'react';
import { ActivityIndicator, Platform, View, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';
import type { Icon as PhosphorIcon } from 'phosphor-react-native';
import { tokens, type TypeToken } from '@scribe/design-tokens';
import { AnimatedPressable, usePressScale } from '@/components/motion/press';
import { Text, TextClassContext, TextVariantContext } from '@/components/ui/text';
import { haptic as playHaptic, type HapticIntent } from '@/lib/haptics';
import { useIsLargeText, useTheme } from '@/lib/a11y';
import { cn } from '@/lib/utils';

type Variant = 'primary' | 'secondary' | 'outline' | 'quiet' | 'destructive';
type LegacyVariant = 'default' | 'ghost' | 'link';
type Size = 'sm' | 'md' | 'lg' | 'capture' | 'icon' | 'default';

const canonical = (v: Variant | LegacyVariant | null | undefined): Variant =>
  v === 'default' || v == null ? 'primary' : v === 'ghost' || v === 'link' ? 'quiet' : v;
const canonicalSize = (s: Size | null | undefined): Exclude<Size, 'default'> => (s == null || s === 'default' ? 'md' : s);

const buttonVariants = cva(
  cn(
    'shrink-0 flex-row items-center justify-center gap-2 rounded-full',
    Platform.select({ web: 'outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background' }),
  ),
  {
    variants: {
      variant: {
        primary: 'bg-primary',
        secondary: 'bg-secondary',
        outline: 'border border-input bg-transparent',
        quiet: 'bg-transparent',
        destructive: 'bg-transparent',
      },
      size: {
        sm: 'min-h-11 px-4 py-2',
        md: 'min-h-12 px-6 py-2.5',
        lg: 'min-h-14 px-7 py-3',
        capture: 'min-h-16 flex-col gap-1 px-4 py-2.5',
        icon: 'h-11 w-11 p-0',
      },
    },
  },
);

const labelClass: Record<Variant, string> = {
  primary: 'text-primary-foreground',
  secondary: 'text-secondary-foreground',
  outline: 'text-foreground',
  quiet: 'text-primary',
  destructive: 'text-destructive',
};

const labelToken = (size: Exclude<Size, 'default'>): TypeToken => (size === 'sm' ? 'labelSmall' : 'label');

export type ButtonProps = Omit<PressableProps, 'children' | 'style'> &
  React.RefAttributes<View> & {
    variant?: Variant | LegacyVariant | null;
    size?: Size | null;
    className?: string;
    style?: StyleProp<ViewStyle>;
    /** Visible label. Also the accessible name unless accessibilityLabel is given. */
    label?: string;
    /** Phosphor icon component, coloured to match the label. */
    icon?: PhosphorIcon;
    loading?: boolean;
    fullWidth?: boolean;
    haptic?: HapticIntent;
    children?: React.ReactNode;
  };

/** Icon colour that matches a variant's label colour (JS side of the same token). */
function useIconColor(variant: Variant, disabled?: boolean | null) {
  const { c } = useTheme();
  if (disabled) return c.textMuted;
  return { primary: c.onAccent, secondary: c.accent, outline: c.text, quiet: c.accent, destructive: c.destructive }[variant];
}

function Button({
  className,
  style,
  variant: v,
  size: s,
  disabled,
  label,
  icon: IconCmp,
  loading,
  fullWidth,
  haptic,
  onPress,
  onPressIn,
  onPressOut,
  accessibilityState,
  accessibilityLabel,
  children,
  ...props
}: ButtonProps) {
  const variant = canonical(v);
  const size = canonicalSize(s);
  const inactive = !!disabled || !!loading;
  const press = usePressScale('control', !inactive);
  const iconColor = useIconColor(variant, disabled);
  const filled = variant === 'primary' || variant === 'secondary';
  const iconSize = size === 'capture' ? 28 : size === 'sm' ? 18 : 20;

  return (
    <TextClassContext.Provider value={cn(labelClass[variant], disabled && 'text-muted-foreground', 'text-center')}>
      <TextVariantContext.Provider value={labelToken(size)}>
        <AnimatedPressable
          className={cn(buttonVariants({ variant, size }), fullWidth && 'self-stretch', disabled && filled && 'bg-muted', className)}
          style={[{ minHeight: BUTTON_MIN_HEIGHT[size] }, press.animatedStyle, style]}
          role="button"
          disabled={inactive}
          accessibilityLabel={accessibilityLabel ?? label}
          accessibilityState={{ ...accessibilityState, disabled: !!disabled, busy: !!loading }}
          onPressIn={(e) => {
            press.onPressIn();
            if (haptic && !inactive) playHaptic(haptic);
            onPressIn?.(e);
          }}
          onPressOut={(e) => {
            press.onPressOut();
            onPressOut?.(e);
          }}
          onPress={onPress}
          {...props}>
          {loading ? (
            <ActivityIndicator color={iconColor} accessibilityElementsHidden importantForAccessibility="no" />
          ) : IconCmp ? (
            <IconCmp size={iconSize} color={iconColor} weight={size === 'capture' ? 'fill' : 'regular'} />
          ) : null}
          {label != null ? <Text>{label}</Text> : children}
        </AnimatedPressable>
      </TextVariantContext.Provider>
    </TextClassContext.Provider>
  );
}

export type IconButtonProps = Omit<ButtonProps, 'label' | 'icon' | 'size' | 'children' | 'variant'> & {
  icon: PhosphorIcon;
  /** Required: what VoiceOver says. */
  label: string;
  variant?: 'plain' | 'tinted' | 'filled';
  size?: 'sm' | 'md' | 'lg';
  selected?: boolean;
  iconWeight?: 'regular' | 'fill' | 'bold' | 'light';
  /** Glyph colour override (e.g. paper-coloured on the inverse toast). */
  color?: string;
};

/**
 * iOS Large Content Viewer: icon-only controls do not grow with Dynamic Type, so a long
 * press at accessibility sizes shows the label in the system HUD (HIG, TDD 09 2.3).
 * RN 0.86 ViewAccessibility props; iOS only, so web never receives unknown DOM props.
 */
export const LARGE_CONTENT = (title: string) =>
  Platform.OS === 'ios' ? { accessibilityShowsLargeContentViewer: true, accessibilityLargeContentTitle: title } : {};

/** Icon-only action (COMPONENTS 2.2). `sm` draws 32 pt and reaches 44 pt through hitSlop. */
function IconButton({ icon: IconCmp, label, variant = 'plain', size = 'md', selected, iconWeight, color: colorOverride, disabled, haptic, className, style, onPressIn, onPressOut, accessibilityState, ...props }: IconButtonProps) {
  const { c } = useTheme();
  const press = usePressScale('control', !disabled);
  const dim = size === 'sm' ? 32 : size === 'lg' ? 64 : 44;
  const glyph = size === 'sm' ? 20 : size === 'lg' ? 28 : 24;
  const color = disabled ? c.textMuted : colorOverride ?? (variant === 'filled' ? c.onAccent : variant === 'tinted' ? c.accent : c.text);
  return (
    <AnimatedPressable
      className={cn(
        'items-center justify-center rounded-full',
        variant === 'tinted' && 'bg-secondary',
        variant === 'filled' && 'bg-primary',
        variant === 'plain' && Platform.select({ web: 'hover:bg-secondary' }),
        Platform.select({ web: 'outline-none focus-visible:ring-2 focus-visible:ring-ring' }),
        className,
      )}
      style={[{ width: dim, height: dim }, press.animatedStyle, style]}
      hitSlop={size === 'sm' ? 6 : undefined}
      role="button"
      accessibilityLabel={label}
      accessibilityState={{ ...accessibilityState, disabled: !!disabled, ...(selected !== undefined ? { selected } : {}) }}
      {...LARGE_CONTENT(label)}
      disabled={disabled}
      onPressIn={(e) => {
        press.onPressIn();
        if (haptic && !disabled) playHaptic(haptic);
        onPressIn?.(e);
      }}
      onPressOut={(e) => {
        press.onPressOut();
        onPressOut?.(e);
      }}
      {...props}>
      <IconCmp size={glyph} color={color} weight={iconWeight ?? (selected ? 'fill' : 'regular')} />
    </AnimatedPressable>
  );
}

/**
 * Two or three equal buttons side by side (Speak / Type, Pause / Finish). They stack,
 * full width, from xxxLarge text up (COMPONENTS 2.18, TDD 09 A11Y-F10), so labels never
 * squeeze to one word per line.
 */
function ButtonRow({ children, className, gap = 3 }: { children: React.ReactNode; className?: string; gap?: 2 | 3 | 4 }) {
  const stacked = useIsLargeText();
  const items = React.Children.toArray(children).filter(Boolean);
  return (
    <View className={cn(stacked ? 'flex-col' : 'flex-row', gap === 2 ? 'gap-2' : gap === 4 ? 'gap-4' : 'gap-3', className)}>
      {items.map((child, i) => (
        <View key={i} className={stacked ? undefined : 'flex-1'}>
          {child}
        </View>
      ))}
    </View>
  );
}

const buttonTextVariants = labelClass;
export { Button, ButtonRow, IconButton, buttonTextVariants, buttonVariants };
export const BUTTON_MIN_HEIGHT = { sm: tokens.target.min, md: 48, lg: tokens.target.primary, capture: tokens.target.capture, icon: tokens.target.min } as const;
