// web: apps/web/components/ui/text.tsx (later), same variant names | android: same
/**
 * Text (COMPONENTS 2.3): the only way text is rendered.
 *
 * Type ramp variants come from tokens.type (size, line height, tracking, face, cap):
 *   display title1 title2 headline body callout subhead footnote caption label
 *   letterBody letterDateline signature prompt
 * Older shadcn variants (h1..muted, default) still work for screens not yet moved.
 *
 * Accessibility contract
 * - Dynamic Type always on. Caps come only from tokens: display 1.6x, title1 1.8x,
 *   title2 2.0x, letterDateline 2.4x. Body, label, letter and signature text are
 *   uncapped (maxFontSizeMultiplier 0 overrides any parent cap) and reach AX5.
 * - `caps` uses textTransform, so VoiceOver hears "For Asha", not "F-O-R A-S-H-A", and
 *   Devanagari is untouched (TDD 09 A11Y-F13). Never .toUpperCase() a string.
 * - `asHeading` sets role="heading" for the rotor.
 * - Faces: the bundled face for the variant (or for the className's family and weight),
 *   with fontWeight and fontStyle reset so nothing is synthesised.
 */
import { Slot } from '@rn-primitives/slot';
import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';
import { Platform, Text as RNText, type Role, type TextStyle } from 'react-native';
import { tokens, type TypeToken } from '@scribe/design-tokens';
import { cn } from '@/lib/utils';
import { faceForClassName, useFontsReady } from './fonts';

const legacyVariants = cva(cn('text-foreground text-base', Platform.select({ web: 'select-text' })), {
  variants: {
    variant: {
      default: '',
      h1: cn('text-center text-4xl font-extrabold tracking-tight', Platform.select({ web: 'scroll-m-20 text-balance' })),
      h2: cn('border-border border-b pb-2 text-3xl font-semibold tracking-tight', Platform.select({ web: 'scroll-m-20 first:mt-0' })),
      h3: cn('text-2xl font-semibold tracking-tight', Platform.select({ web: 'scroll-m-20' })),
      h4: cn('text-xl font-semibold tracking-tight', Platform.select({ web: 'scroll-m-20' })),
      p: 'mt-3 leading-7 sm:mt-6',
      blockquote: 'mt-4 border-l-2 pl-3 italic sm:mt-6 sm:pl-6',
      code: cn('bg-muted relative rounded px-[0.3rem] py-[0.2rem] font-mono text-sm font-semibold'),
      lead: 'text-muted-foreground text-xl',
      large: 'text-lg font-semibold',
      small: 'text-sm font-medium leading-none',
      muted: 'text-muted-foreground text-sm',
    },
  },
  defaultVariants: { variant: 'default' },
});

type LegacyVariant = NonNullable<VariantProps<typeof legacyVariants>['variant']>;
export type TextVariant = TypeToken | LegacyVariant;

const TYPE = tokens.type;
const isToken = (v: string | undefined): v is TypeToken => !!v && v in TYPE;

/** Default colour per ramp style: datelines and captions are quiet, everything else ink. */
const TOKEN_TONE: Partial<Record<TypeToken, Tone>> = {
  letterDateline: 'muted',
  caption: 'muted',
  footnote: 'muted',
};

export type Tone = 'default' | 'muted' | 'accent' | 'onAccent' | 'destructive' | 'onDestructive' | 'success' | 'caution' | 'recording' | 'inverse';
const TONE: Record<Tone, string> = {
  default: 'text-foreground',
  muted: 'text-muted-foreground',
  accent: 'text-primary',
  onAccent: 'text-primary-foreground',
  destructive: 'text-destructive',
  onDestructive: 'text-destructive-foreground',
  success: 'text-success',
  caution: 'text-caution',
  recording: 'text-recording',
  inverse: 'text-background',
};

const ROLE: Partial<Record<LegacyVariant, Role>> = {
  h1: 'heading',
  h2: 'heading',
  h3: 'heading',
  h4: 'heading',
  blockquote: Platform.select({ web: 'blockquote' as Role }),
  code: Platform.select({ web: 'code' as Role }),
};
const ARIA_LEVEL: Partial<Record<LegacyVariant, string>> = { h1: '1', h2: '2', h3: '3', h4: '4' };

/** Set by Button, Chip and similar so their label Text inherits colour and size classes. */
const TextClassContext = React.createContext<string | undefined>(undefined);
/** Set by Button and Chip: the ramp style their label uses unless the caller picks one. */
const TextVariantContext = React.createContext<TypeToken | undefined>(undefined);

export type TextProps = React.ComponentProps<typeof RNText> &
  React.RefAttributes<RNText> & {
    variant?: TextVariant;
    tone?: Tone;
    /** Uppercase through textTransform; the accessible name stays in sentence case. */
    caps?: boolean;
    /** role="heading" (rotor). A number also sets aria-level on web. */
    asHeading?: boolean | 1 | 2 | 3;
    /** Reader-owned size on top of Dynamic Type (Reading Size); letter styles only. */
    scale?: number;
    asChild?: boolean;
  };

/** Style for a ramp token: size, leading, tracking, face. Exposed for TextInput and animated text. */
export function typeStyle(variant: TypeToken, opts: { scale?: number; fontsReady?: boolean } = {}): TextStyle {
  const t = TYPE[variant];
  const s = opts.scale ?? 1;
  const ready = opts.fontsReady ?? true;
  return {
    fontSize: t.fontSize * s,
    lineHeight: t.lineHeight * s,
    letterSpacing: t.letterSpacing,
    ...(ready ? { fontFamily: t.fontFamily, fontWeight: 'normal', fontStyle: 'normal' } : { fontWeight: t.fontWeight, fontStyle: variant === 'signature' ? 'italic' : 'normal' }),
  };
}

/** maxFontSizeMultiplier for a ramp token: 0 means uncapped (overrides parent caps). */
export function maxScaleFor(variant: TypeToken): number {
  return TYPE[variant].maxScale ?? 0;
}

function Text({ className, asChild = false, variant, tone, caps, asHeading, scale, style, maxFontSizeMultiplier, role, ...props }: TextProps) {
  const textClass = React.useContext(TextClassContext);
  const contextVariant = React.useContext(TextVariantContext);
  const ready = useFontsReady();
  const Component = asChild ? Slot : RNText;

  const v = variant ?? contextVariant;
  const token = isToken(v) ? v : undefined;
  const legacy = token ? undefined : ((v as LegacyVariant | undefined) ?? 'default');
  const toneClass = tone ? TONE[tone] : token && TOKEN_TONE[token] ? TONE[TOKEN_TONE[token]!] : undefined;

  const classes = token
    ? cn('text-foreground', Platform.select({ web: 'select-text' }), textClass, toneClass, className)
    : cn(legacyVariants({ variant: legacy }), textClass, toneClass, className);

  const own: TextStyle = token
    ? typeStyle(token, { scale, fontsReady: ready })
    : ready
      ? { fontFamily: faceForClassName(classes), fontWeight: 'normal', fontStyle: 'normal' }
      : {};
  const capsStyle: TextStyle | undefined = caps ? { textTransform: 'uppercase' } : undefined;

  const heading = asHeading || (legacy && ROLE[legacy] === 'heading');
  return (
    <Component
      className={classes}
      style={[own, capsStyle, style]}
      maxFontSizeMultiplier={maxFontSizeMultiplier ?? (token ? maxScaleFor(token) : undefined)}
      role={role ?? (heading ? 'heading' : legacy ? ROLE[legacy] : undefined)}
      aria-level={typeof asHeading === 'number' ? String(asHeading) : legacy ? ARIA_LEVEL[legacy] : undefined}
      {...props}
    />
  );
}

export { Text, TextClassContext, TextVariantContext };
