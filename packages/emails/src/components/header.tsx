import { brand } from '@scribe/brand';
import { assetFor } from '@scribe/brand/registry';
import type { CSSProperties } from 'react';
import { ASSET_ORIGIN, dark, fonts, layout, light, space } from '../tokens';
import { NotMso } from './mso';
import { Block } from './primitives';
import { cls, useEmailAssets, type LogoMode } from './theme';

type HeaderContext = 'email.header.light' | 'email.header.dark';

/** Hosted URL of the first (2x) asset a registry context names. */
const hosted = (context: HeaderContext) => {
  const a = assetFor(context)[0];
  if (!a.url) throw new Error(`brand registry: ${a.id} has no hosted url`);
  return `${ASSET_ORIGIN}${a.url}`;
};

/**
 * Content-IDs of the inline logo attachments (`cid:` in the HTML, `contentId` on the Resend attachment).
 * Resend: under 128 characters; src/send.ts attaches the files under these ids.
 */
export const LOGO_CID = { light: 'el-logo-light', dark: 'el-logo-dark' } as const;

/**
 * Header logos, resolved through the brand registry (contexts `email.header.light` / `email.header.dark`).
 * 2x PNGs with the halo, shown at `layout.logoWidth`. `LOGO` is the hosted copy on
 * https://earlyletters.com/email/, used only in `remote` mode (off by default).
 */
export const LOGO = {
  light: hosted('email.header.light'),
  dark: hosted('email.header.dark'),
} as const;

/** Where the header image points, by logo mode. */
export function logoSrc(mode: Exclude<LogoMode, 'text'>, which: 'light' | 'dark'): string {
  return mode === 'remote' ? LOGO[which] : `cid:${LOGO_CID[which]}`;
}

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
  const { logo } = useEmailAssets();
  if (logo === 'text') return <TextWordmark text={text} />;
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
              <img className={`${cls.logoLight} ${cls.ink}`} src={logoSrc(logo, 'light')} width={layout.logoWidth} height={layout.logoHeight} alt={text} style={imgStyle} />
            </td>
          </tr>
        </tbody>
      </table>
      <NotMso>
        <div className={cls.logoDark} style={{ display: 'none', maxHeight: 0, overflow: 'hidden', msoHide: 'all' } as CSSProperties}>
          <img
            src={logoSrc(logo, 'dark')}
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

/**
 * `text` mode: no image. The brand name set in the email serif (Literata where installed, else Georgia), in the
 * ink colour, where the logo would sit. Used where the sender cannot attach files (Supabase Auth over SMTP).
 */
function TextWordmark({ text }: { text: string }) {
  return (
    <Block bottom={space[9]}>
      <p
        className={cls.ink}
        style={{
          margin: 0,
          fontFamily: fonts.serif,
          fontSize: 22,
          lineHeight: `${layout.logoHeight}px`,
          fontWeight: 500,
          letterSpacing: '0.2px',
          color: light.ink,
        }}
      >
        {text}
      </p>
    </Block>
  );
}
