import { brand } from '@scribe/brand';
import { emailChrome } from '@scribe/content/src/emails/chrome.en';
import type { CSSProperties } from 'react';
import { ASSET_BASE, dark, fonts, layout, light, space } from '../tokens';
import { Block } from './primitives';
import { cls } from './theme';

/** Logo files B3 publishes to https://earlyletters.com/email/ (2x, shown at 160px wide). */
export const LOGO = {
  light: `${ASSET_BASE}/logo-light.png`,
  dark: `${ASSET_BASE}/logo-dark.png`,
} as const;

export type EmailHeaderProps = {
  /** Override the alt text. Defaults to the chrome copy, then the brand name. */
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
  const text = alt ?? emailChrome.header.alt ?? brand.name;
  const imgStyle = {
    display: 'block',
    width: layout.logoWidth,
    maxWidth: '100%',
    height: 'auto',
    border: 0,
    outline: 'none',
    textDecoration: 'none',
    // Alt text styling (shown when images are off).
    fontFamily: fonts.serif,
    fontSize: 22,
    lineHeight: '28px',
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
