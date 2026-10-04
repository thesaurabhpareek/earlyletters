/**
 * Light/dark plumbing shared by every component.
 *
 * Strategy (details and sources in README.md):
 * 1. Light palette is inline on every element, so clients that strip <style>
 *    (Gmail with non-Google accounts, some webmails) still get a finished email.
 * 2. Clients that honour `@media (prefers-color-scheme: dark)` (Apple Mail,
 *    Outlook macOS/iOS/Android, Thunderbird, Proton) get our own dark palette
 *    through `el-*` classes and `!important`.
 * 3. Outlook.com and the Outlook apps that rewrite colours themselves mark
 *    elements with `data-ogsc` (text) and `data-ogsb` (background); the same
 *    rules are repeated under those attribute selectors.
 * 4. Clients that force-invert (Gmail iOS/Android, classic Outlook Windows)
 *    cannot be targeted. The light palette is chosen to survive inversion:
 *    warm mid-tones, no pure white or black, and the logo carries its own halo.
 *
 * Gmail discards a whole <style> block it cannot parse, so the dark rules and
 * the responsive rules are emitted as two separate blocks.
 */
import { createContext, useContext } from 'react';
import { dark, layout, webFonts, type Palette } from '../tokens';

export type Theme = 'auto' | 'light' | 'dark';

/**
 * Lets a renderer force a theme for every email it renders without touching
 * templates. The gallery uses it to show the dark styles in any browser.
 */
export const EmailThemeContext = createContext<Theme | undefined>(undefined);
export const EmailThemeProvider = EmailThemeContext.Provider;
export const useForcedTheme = () => useContext(EmailThemeContext);

/**
 * How the header logo travels with the email. Nothing in an email loads from a server (develop's privacy rule,
 * docs/emails/README.md "Images and fonts"), so the default is `inline`.
 * - `inline`: the logo PNGs ride along as inline attachments and the HTML points at them by Content-ID
 *   (`cid:`). Send with `renderForResend` (src/send.ts), which returns the attachments too.
 * - `text`: no image at all; the brand name set in the email serif. For senders that cannot attach files,
 *   such as Supabase Auth over SMTP (supabase/templates).
 * - `remote`: the hosted PNGs on earlyletters.com/email/. Off by default; only if the founder decides that
 *   loading the logo from our server is acceptable.
 */
export type LogoMode = 'inline' | 'text' | 'remote';

export type EmailAssets = {
  logo: LogoMode;
  /**
   * Self-hosted web fonts (@font-face from earlyletters.com/fonts/). Off: a font file loaded from our server is
   * a request that tells us the email was opened, the same as a pixel. On only if the founder decides otherwise.
   */
  webFonts: boolean;
};

export const DEFAULT_ASSETS: EmailAssets = { logo: 'inline', webFonts: false };
export const EmailAssetsContext = createContext<EmailAssets>(DEFAULT_ASSETS);
export const EmailAssetsProvider = EmailAssetsContext.Provider;
export const useEmailAssets = () => useContext(EmailAssetsContext);

/** Class names. One per colour role; components combine them. */
export const cls = {
  desk: 'el-desk',
  sheet: 'el-sheet',
  ink: 'el-ink',
  muted: 'el-muted',
  accent: 'el-accent',
  soft: 'el-soft',
  btn: 'el-btn',
  btnText: 'el-btn-text',
  rule: 'el-rule',
  /** The decorative hairline; skipped in plain text. */
  divider: 'el-divider',
  logoLight: 'el-logo-light',
  logoDark: 'el-logo-dark',
  /** Paper plate behind the light logo; Gmail does not invert background-image, so the logo keeps its paper there. */
  logoPlate: 'el-logo-plate',
  /** Fallback link block; skipped in the plain-text part (the button line already carries the URL). */
  fallback: 'el-fallback',
  facts: 'el-facts',
  factRow: 'el-fact-row',
  factLabel: 'el-fact-label',
  factValue: 'el-fact-value',
  pad: 'el-pad',
  gutter: 'el-gutter',
  heading: 'el-heading',
  btnWrap: 'el-btn-wrap',
  btnCell: 'el-btn-cell',
  preheader: 'el-preheader',
} as const;

/** The dark declarations, without a wrapper. */
function darkDeclarations(p: Palette, prefix = ''): string {
  const s = (sel: string) => `${prefix}.${sel}`;
  return [
    `${s(cls.desk)}{background-color:${p.desk} !important;}`,
    `${s(cls.sheet)}{background-color:${p.sheet} !important;border-color:${p.line} !important;}`,
    `${s(cls.ink)}{color:${p.ink} !important;}`,
    `${s(cls.muted)}{color:${p.inkMuted} !important;}`,
    `${s(cls.accent)}{color:${p.accent} !important;}`,
    `${s(cls.soft)}{background-color:${p.accentSoft} !important;}`,
    `${s(cls.btn)}{background-color:${p.accent} !important;}`,
    `${s(cls.btnText)}{color:${p.onAccent} !important;}`,
    `${s(cls.rule)}{border-color:${p.line} !important;}`,
    `${s(cls.logoLight)}{display:none !important;}`,
    `${s(cls.logoDark)}{display:block !important;max-height:none !important;overflow:visible !important;}`,
    `${s(cls.logoPlate)}{background-image:none !important;background-color:transparent !important;}`,
  ].join('\n');
}

/** Outlook.com / Outlook apps: same rules under its rewrite markers. */
function outlookDeclarations(p: Palette): string {
  return [
    `[data-ogsb] .${cls.desk}{background-color:${p.desk} !important;}`,
    `[data-ogsb] .${cls.sheet}{background-color:${p.sheet} !important;}`,
    `[data-ogsb] .${cls.soft}{background-color:${p.accentSoft} !important;}`,
    `[data-ogsb] .${cls.btn}{background-color:${p.accent} !important;}`,
    `[data-ogsc] .${cls.ink}{color:${p.ink} !important;}`,
    `[data-ogsc] .${cls.muted}{color:${p.inkMuted} !important;}`,
    `[data-ogsc] .${cls.accent}{color:${p.accent} !important;}`,
    `[data-ogsc] .${cls.btnText}{color:${p.onAccent} !important;}`,
    `[data-ogsc] .${cls.logoLight}{display:none !important;}`,
    `[data-ogsc] .${cls.logoDark}{display:block !important;max-height:none !important;overflow:visible !important;}`,
    `[data-ogsb] .${cls.logoPlate}{background-image:none !important;background-color:transparent !important;}`,
  ].join('\n');
}

/** CSS for the dark palette, by theme. `light` returns nothing. */
export function darkCss(theme: Theme): string {
  if (theme === 'light') return '';
  if (theme === 'dark') return `:root{color-scheme:dark;}\n${darkDeclarations(dark)}`;
  return [
    ':root{color-scheme:light dark;supported-color-schemes:light dark;}',
    `@media (prefers-color-scheme: dark){\n${darkDeclarations(dark)}\n}`,
    outlookDeclarations(dark),
  ].join('\n');
}

/**
 * Off by default (`EmailAssets.webFonts`): nothing in an email loads from a server.
 * Progressive web fonts (registry context `email.type`), self-hosted on earlyletters.com/fonts/. Apple Mail, iOS
 * Mail and Outlook for Mac use them; every other client keeps the fallback stack. Emitted as its own <style> block
 * (Gmail drops a block it will not parse) and hidden from classic Outlook, which otherwise falls back to Times.
 */
export function fontCss(): string {
  return webFonts
    .map((f) => `@font-face{font-family:'${f.family}';font-style:${f.style};font-weight:${f.weight};font-display:swap;src:url(${f.url}) format('woff2');}`)
    .join('\n');
}

/** Responsive and client-reset CSS. Independent of theme. */
export function baseCss(): string {
  return [
    // Client resets.
    'body{margin:0 !important;padding:0 !important;width:100% !important;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;}',
    'table,td{mso-table-lspace:0pt;mso-table-rspace:0pt;}',
    'img{-ms-interpolation-mode:bicubic;border:0;outline:none;text-decoration:none;}',
    // Stop iOS Mail turning codes, dates and times into blue links.
    'a[x-apple-data-detectors]{color:inherit !important;text-decoration:none !important;font-size:inherit !important;font-family:inherit !important;font-weight:inherit !important;line-height:inherit !important;}',
    // Gmail's equivalent for auto-linked text.
    'u + #body a{color:inherit;text-decoration:none;font-size:inherit;font-family:inherit;font-weight:inherit;line-height:inherit;}',
    // Mobile first (DSN-10): the inline padding is the phone layout, so clients that strip <style> still fit a
    // 375px screen. Wider screens get the desktop measure here; classic Outlook gets it from MsoHead.
    `@media only screen and (min-width:${layout.maxWidth + 1}px){`,
    `.${cls.gutter}{padding-left:${layout.gutter}px !important;padding-right:${layout.gutter}px !important;}`,
    `.${cls.pad}{padding-left:${layout.pad}px !important;padding-right:${layout.pad}px !important;}`,
    '}',
    `@media only screen and (max-width:${layout.maxWidth}px){`,
    `.${cls.heading}{font-size:${24}px !important;}`,
    '}',
    '@media only screen and (max-width:480px){',
    `.${cls.btnWrap}{width:100% !important;}`,
    `.${cls.btnCell} a{display:block !important;text-align:center !important;}`,
    '}',
  ].join('\n');
}
