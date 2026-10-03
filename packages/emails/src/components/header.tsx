import { assetFor, brand } from '@scribe/brand';
import type { CSSProperties } from 'react';
import { ASSET_ORIGIN, dark, layout, light, space } from '../tokens';
import { NotMso } from './mso';
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

/**
 * Alt text when images are blocked: the brand name in the email serif, so the header line keeps its weight. It is
 * not a stand-in wordmark (DESIGN_LANGUAGE.md: never retype the name to imitate the logo), so no EB Garamond here.
 */
const altFont = "Georgia, 'Times New Roman', serif";

export type EmailHeaderProps = {
  /** Override the alt text. Defaults to the brand name (packages/brand), which is what the logo says. */
  alt?: string;
};

/**
 * Letterhead: the logo at the top left of the sheet. Not a link (one action
 * per email, chrome.en.ts). Light logo by default; clients that support dark
 * mode targeting swap in the dark logo.
 *
 * Gmail's apps force-invert the sheet but not images, which would leave the
 * ink logo on near-black. The light logo therefore sits on a paper plate whose
 * colour is also set as a `background-image` gradient: Gmail does not invert
 * background images, so the plate stays paper there (DSN-01). In light mode the
 * plate is the sheet colour and invisible; real dark-mode clients remove it
 * (`el-logo-plate` rules in theme.ts) and swap in the dark logo.
 *
 * The dark copy is hidden from classic Outlook twice: inside a non-mso
 * conditional and with `mso-hide:all` on both the wrapper and the image.
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
    fontFamily: altFont,
    fontSize: 22,
    lineHeight: `${layout.logoHeight}px`,
    fontWeight: 400,
    color: light.ink,
  } as const;
  const plate = `linear-gradient(${light.sheet},${light.sheet})`;

  return (
    <Block bottom={space[9]}>
      <table
        role="presentation"
        cellPadding={0}
        cellSpacing={0}
        border={0}
        className={cls.logoPlate}
        style={{ backgroundColor: light.sheet, backgroundImage: plate, borderRadius: layout.plateRadius, borderCollapse: 'separate' }}
      >
        <tbody>
          <tr>
            <td className={cls.logoPlate} style={{ padding: '3px 8px 3px 0', backgroundColor: light.sheet, backgroundImage: plate, borderRadius: layout.plateRadius }}>
              <img className={`${cls.logoLight} ${cls.ink}`} src={LOGO.light} width={layout.logoWidth} height={layout.logoHeight} alt={text} style={imgStyle} />
            </td>
          </tr>
        </tbody>
      </table>
      <NotMso>
        <div className={cls.logoDark} style={{ display: 'none', maxHeight: 0, overflow: 'hidden', msoHide: 'all' } as CSSProperties}>
          <img
            src={LOGO.dark}
            width={layout.logoWidth}
            height={layout.logoHeight}
            alt={text}
            style={{ ...imgStyle, color: dark.ink, msoHide: 'all' } as CSSProperties}
          />
        </div>
      </NotMso>
    </Block>
  );
}
