import { tokens, type TypeToken } from '@scribe/design-tokens';

/**
 * Dynamic Type cap for a type style: tokens.type[t].maxScale, or undefined
 * (unbounded) when the token says null. One source, so screens never repeat
 * `maxFontSizeMultiplier={1.5}` by hand.
 */
export function maxScaleFor(type: TypeToken): number | undefined {
  return tokens.type[type].maxScale ?? undefined;
}

/** Tailwind classes for each style; static strings so the class scanner sees them. */
export const typeClass: Record<TypeToken, string> = {
  display: 'font-serif text-display',
  title1: 'font-serif text-title1',
  title2: 'font-serif text-title2',
  headline: 'text-headline font-semibold',
  body: 'text-body',
  callout: 'text-callout',
  subhead: 'text-subhead',
  footnote: 'text-footnote',
  caption: 'text-caption font-medium',
  letterBody: 'font-serif text-letter-body',
  letterDateline: 'text-letter-dateline font-medium',
};
