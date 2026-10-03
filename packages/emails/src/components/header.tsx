import { assetFor, brand } from '@scribe/brand';
import type { CSSProperties } from 'react';
import { ASSET_ORIGIN, dark, layout, light, space } from '../tokens';
import { Block } from './primitives';
import { cls } from './theme';

/** Hosted URL of the first (2x) asset a registry context names. */
const hosted = (context: 'email.header.light' | 'email.header.dark') => {
  const a = assetFor(context)[0];
  if (!a.url) throw new Error(`brand registry: ${a.id} has no hosted url`);
  return `${ASSET_ORIGIN}${a.url}`;
};

/**
 * Header logos, resolved through the brand registry (contexts `email.header.light` / `email.header.dark`).
 * 2x PNGs with the halo, served from https://earlyletters.com/email/ and shown at `layout.logoWidth`.
 */
export const LOGO = {
  light: hosted('email.header.light'),
  dark: hosted('email.header.dark'),
} as const;

/** Alt text styled as the wordmark when images are blocked: EB Garamond where installed, else Georgia. */
const wordmarkFallback = "'EB Garamond', Garamond, Georgia, 'Times New Roman', serif";

export type EmailHeaderProps = {
  /** Override the alt text. Defaults to the brand name (packages/brand), which is what the logo says. */
  alt?: string;
};

/**
 * Letterhead: the logo at the top left of the sheet. Not a link (one action
 * per email, chrome.en.ts). Light logo by default; clients that support dark
 * mode targeting swap in the dark logo. The dark copy is hidden with
 * `display:none` plus `mso-hide:all` so Outlook never shows both.
 *
 * When images are blocked, the alt text is styled as a serif wordmark.
 */
export function EmailHeader({ alt }: EmailHeaderProps = {}) {
  const text = alt ?? brand.name;
  const imgStyle = {
    display: 'block',
    width: layout.logoWidth,
    maxWidth: '100%',
    height: 'auto',
    border: 0,
    outline: 'none',
    textDecoration: 'none',
    // Alt text styling (shown when images are off).
    fontFamily: wordmarkFallback,
    fontSize: 22,
    lineHeight: `${layout.logoHeight}px`,
    fontWeight: 500,
    color: light.ink,
  } as const;

  return (
    <Block bottom={space[9]}>
      <img className={`${cls.logoLight} ${cls.ink}`} src={LOGO.light} width={layout.logoWidth} height={layout.logoHeight} alt={text} style={imgStyle} />
      <div
        className={cls.logoDark}
        style={{ display: 'none', maxHeight: 0, overflow: 'hidden', msoHide: 'all' } as CSSProperties}
      >
        <img src={LOGO.dark} width={layout.logoWidth} height={layout.logoHeight} alt={text} style={{ ...imgStyle, color: dark.ink }} />
      </div>
    </Block>
  );
}
