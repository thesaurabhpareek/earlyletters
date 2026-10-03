// web: apps/web/components/ui/input.tsx + label (shadcn) | android: same (autoComplete maps from textContentType)
/**
 * TextField (COMPONENTS 2.7, 2.8).
 *   field   one line (child's name, "what they call you"): visible label above, 1 pt
 *           controlBorder edge (3:1, WCAG 1.4.11), 2 pt focus ring drawn outside the
 *           edge so nothing shifts, helper below.
 *   letter  the Type half of capture: paper, no box, Literata at letter size, grows
 *           with the text (Day One / Apple Notes writing surface).
 *
 * Accessibility contract
 * - The label is always visible and is the accessible name (never placeholder-only).
 * - Errors show caution text + icon + words, and are announced once when they appear
 *   (announce() on iOS, a polite live region on Android).
 * - Uncapped Dynamic Type; the field grows taller, never clips.
 */
import { WarningCircleIcon } from 'phosphor-react-native';
import * as React from 'react';
import { Platform, TextInput, View, type TextInputProps } from 'react-native';
import { tokens } from '@scribe/design-tokens';
import { Text, typeStyle } from '@/components/ui/text';
import { useFontsReady } from '@/components/ui/fonts';
import { announce, useTheme } from '@/lib/a11y';
import { cn } from '@/lib/utils';

export type TextFieldProps = Omit<TextInputProps, 'style'> & {
  label: string;
  /** Hide the label visually when a heading right above already says it (still the accessible name). */
  labelHidden?: boolean;
  helper?: string;
  error?: string | null;
  variant?: 'field' | 'letter';
  /** Reading Size multiplier for the letter variant. */
  scale?: number;
  trailing?: React.ReactNode;
  className?: string;
  inputClassName?: string;
};

const R = tokens.radius;

export const TextField = React.forwardRef<TextInput, TextFieldProps>(function TextField(
  { label, labelHidden, helper, error, variant = 'field', scale, trailing, className, inputClassName, onFocus, onBlur, multiline, ...props },
  ref,
) {
  const { c } = useTheme();
  const ready = useFontsReady();
  const [focused, setFocused] = React.useState(false);
  const letter = variant === 'letter';

  React.useEffect(() => {
    if (error) announce(error);
  }, [error]);

  // Single-line iOS inputs mis-place text with an explicit lineHeight, so the field style drops it.
  const { lineHeight: _lh, ...fieldStyle } = typeStyle('body', { fontsReady: ready });
  const textStyle = letter ? typeStyle('letterBody', { scale, fontsReady: ready }) : multiline ? typeStyle('body', { fontsReady: ready }) : fieldStyle;
  const hint = [helper, error].filter(Boolean).join('. ') || undefined;

  const input = (
    <TextInput
      ref={ref}
      {...props}
      multiline={letter ? true : multiline}
      textAlignVertical={letter || multiline ? 'top' : 'center'}
      placeholderTextColor={c.textMuted}
      selectionColor={c.accent}
      cursorColor={c.accent}
      maxFontSizeMultiplier={0}
      accessibilityLabel={label}
      accessibilityHint={props.accessibilityHint ?? hint}
      aria-invalid={!!error}
      onFocus={(e) => {
        setFocused(true);
        onFocus?.(e);
      }}
      onBlur={(e) => {
        setFocused(false);
        onBlur?.(e);
      }}
      className={cn('text-foreground', Platform.select({ web: 'outline-none resize-none' }), letter ? 'min-h-64 flex-1' : 'min-h-[52px] flex-1 px-4 py-3', inputClassName)}
      style={[textStyle, letter ? { paddingTop: 0 } : null]}
    />
  );

  return (
    <View className={cn('gap-2', letter && 'flex-1', className)}>
      {!labelHidden && (
        <Text variant="labelSmall" tone="muted">
          {label}
        </Text>
      )}
      {letter ? (
        input
      ) : (
        <View>
          {focused && (
            <View
              pointerEvents="none"
              style={{
                position: 'absolute',
                top: -3,
                left: -3,
                right: -3,
                bottom: -3,
                borderRadius: R.md + 3,
                borderWidth: tokens.focusRing.width,
                borderColor: c.focus,
              }}
            />
          )}
          <View
            className={cn('flex-row items-center bg-card', error ? 'border-caution' : 'border-input')}
            style={{ borderRadius: R.md, borderWidth: error ? tokens.stroke.selected : tokens.stroke.control }}>
            {input}
            {trailing}
          </View>
        </View>
      )}
      {error ? (
        <View className="flex-row items-start gap-1.5" accessibilityLiveRegion="polite">
          <WarningCircleIcon size={18} color={c.caution} weight="bold" style={{ marginTop: 1 }} />
          <Text variant="footnote" tone="caution" className="flex-1">
            {error}
          </Text>
        </View>
      ) : helper ? (
        <Text variant="footnote" tone="muted">
          {helper}
        </Text>
      ) : null}
    </View>
  );
});
