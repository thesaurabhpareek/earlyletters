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
import { dark, layout, type Palette } from '../tokens';

export type Theme = 'auto' | 'light' | 'dark';

/**
 * Lets a renderer force a theme for every email it renders without touching
 * templates. The gallery uses it to show the dark styles in any browser.
 */
export const EmailThemeContext = createContext<Theme | undefined>(undefined);
export const EmailThemeProvider = EmailThemeContext.Provider;
export const useForcedTheme = () => useContext(EmailThemeContext);

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
  logoLight: 'el-logo-light',
  logoDark: 'el-logo-dark',
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
    `@media only screen and (max-width:${layout.maxWidth}px){`,
    `.${cls.gutter}{padding-left:${layout.gutterMobile}px !important;padding-right:${layout.gutterMobile}px !important;}`,
    `.${cls.pad}{padding-left:${layout.padMobile}px !important;padding-right:${layout.padMobile}px !important;}`,
    `.${cls.heading}{font-size:24px !important;}`,
    '}',
    '@media only screen and (max-width:480px){',
    `.${cls.btnWrap}{width:100% !important;}`,
    `.${cls.btnCell} a{display:block !important;text-align:center !important;}`,
    '}',
  ].join('\n');
}
