/**
 * Brand asset registry: every brand asset has ONE stable id, and every touchpoint names the ids it uses.
 *
 * Agents and code never hardcode a logo path. They ask the registry:
 *   assetFor('email.header.light')        -> [the 2x light email logo, then its @1x]
 *   asset('logo.lockup.horizontal.ink')   -> path, size, colour, min size, status
 *
 * Rules (docs/brand/BRAND_SYSTEM.md):
 * - Ids are permanent. A new drawing gets a new `version`, not a new id; a retired file gets `status: 'deprecated'`.
 * - A context may only reference `primary` assets (the test enforces it).
 * - Paths are relative to the repo root. `url` is where the file is served on earlyletters.com
 *   (apps/web/scripts/sync-brand-assets.mjs copies every asset that has one).
 * - This file imports nothing, so plain Node (registry.json build, Expo app.config) can load it.
 *   Colour values repeat packages/brand/index.ts; the test checks they are equal.
 *
 * After editing, regenerate the JSON: node packages/brand/scripts/build-registry.mjs
 */

export type AssetStatus = 'primary' | 'deprecated';
export type AssetKind = 'logo' | 'icon' | 'favicon' | 'email' | 'image' | 'color' | 'font' | 'source' | 'archive';
export type AssetFormat = 'svg' | 'png' | 'json' | 'webmanifest' | 'woff2' | 'npm' | 'hex' | 'mjs' | 'dir';
/** The surface an asset is drawn for. `any` = carries its own background. */
export type Surface = 'light' | 'dark' | 'any' | 'tinted';

export interface BrandAsset {
  readonly id: string;
  readonly kind: AssetKind;
  readonly title: string;
  /** Repo-relative file or folder. Absent only for colours and npm fonts. */
  readonly path?: string;
  /** Hex for colours. */
  readonly value?: string;
  readonly format: AssetFormat;
  /** px for rasters, viewBox units for SVG (aspect only). */
  readonly dimensions?: { readonly width: number; readonly height: number; readonly unit: 'px' | 'viewBox' };
  /** Colour of the artwork (hex), or 'currentColor'-style notes. */
  readonly fill?: string;
  /** Background baked into the file: 'transparent', a hex, or a gradient description. */
  readonly background?: string;
  /** Surface it is made to sit on. */
  readonly surface: Surface;
  /** Smallest allowed display size. */
  readonly minSize?: { readonly px: number; readonly dimension: 'height' | 'width' | 'square'; readonly below?: string };
  /** Path on https://earlyletters.com when the file is served. */
  readonly url?: string;
  /** npm package that ships the font (fonts not vendored here). */
  readonly package?: string;
  readonly status: AssetStatus;
  readonly version: string;
  /** ISO date of this version. */
  readonly date: string;
  readonly supersededBy?: string;
  readonly notes?: string;
}

const P = 'packages/brand/assets/logo/primary';
const V = '1.0.0';
const D = '2026-10-03';

const symbol = { kind: 'logo', format: 'svg', status: 'primary', version: V, date: D, background: 'transparent' } as const;
const icon = { kind: 'icon', format: 'png', status: 'primary', version: V, date: D } as const;
const color = { kind: 'color', format: 'hex', surface: 'any', status: 'primary', version: V, date: D } as const;
const old = { status: 'deprecated', format: 'dir', surface: 'any', kind: 'archive' } as const;

const ICON_TILE = 'gradient #9A613C to #7F4F30 (dithered)';
const ICON_TILE_DARK = 'gradient #2C2926 to #1F1B18';

export const ASSETS = [
  // ------------------------------------------------------------------ the mark
  { ...symbol, id: 'logo.symbol.ink', title: 'Symbol (two opening quotation marks), ink', path: `${P}/symbol.svg`, dimensions: { width: 1112, height: 1082.37, unit: 'viewBox' }, fill: '#2B2722', surface: 'light', minSize: { px: 24, dimension: 'height', below: 'logo.symbol.small.ink' } },
  { ...symbol, id: 'logo.symbol.reversed', title: 'Symbol, reversed for dark surfaces', path: `${P}/symbol-reversed.svg`, dimensions: { width: 1112, height: 1082.37, unit: 'viewBox' }, fill: '#F2ECE4', surface: 'dark', minSize: { px: 24, dimension: 'height', below: 'logo.symbol.small.reversed' } },
  { ...symbol, id: 'logo.symbol.accent', title: 'Symbol in accent, the one warm brand moment on paper', path: `${P}/symbol-accent.svg`, dimensions: { width: 1112, height: 1082.37, unit: 'viewBox' }, fill: '#8A5A3B', surface: 'light', minSize: { px: 24, dimension: 'height', below: 'logo.symbol.small.ink' } },
  { ...symbol, id: 'logo.symbol.small.ink', title: 'Symbol small cut (open notch, heavier tails) for 12 to 23 px', path: `${P}/symbol-small.svg`, dimensions: { width: 1205.46, height: 1089.29, unit: 'viewBox' }, fill: '#2B2722', surface: 'light', minSize: { px: 12, dimension: 'height' } },
  { ...symbol, id: 'logo.symbol.small.reversed', title: 'Symbol small cut, reversed', path: `${P}/symbol-small-reversed.svg`, dimensions: { width: 1205.46, height: 1089.29, unit: 'viewBox' }, fill: '#F2ECE4', surface: 'dark', minSize: { px: 12, dimension: 'height' } },
  { ...symbol, id: 'logo.lockup.horizontal.ink', title: 'Horizontal lockup: symbol + EB Garamond wordmark, ink', path: `${P}/lockup-horizontal.svg`, dimensions: { width: 6394.95, height: 1332, unit: 'viewBox' }, fill: '#2B2722', surface: 'light', minSize: { px: 27, dimension: 'height', below: 'logo.lockup.horizontal.small.ink' } },
  { ...symbol, id: 'logo.lockup.horizontal.reversed', title: 'Horizontal lockup, reversed', path: `${P}/lockup-horizontal-reversed.svg`, dimensions: { width: 6394.95, height: 1332, unit: 'viewBox' }, fill: '#F2ECE4', surface: 'dark', minSize: { px: 27, dimension: 'height', below: 'logo.lockup.horizontal.small.reversed' } },
  { ...symbol, id: 'logo.lockup.horizontal.small.ink', title: 'Horizontal lockup, small cut (tracked wordmark, small symbol) for 17 to 26 px tall', path: `${P}/lockup-horizontal-small.svg`, dimensions: { width: 7005.89, height: 1332, unit: 'viewBox' }, fill: '#2B2722', surface: 'light', minSize: { px: 17, dimension: 'height', below: 'logo.symbol.small.ink' } },
  { ...symbol, id: 'logo.lockup.horizontal.small.reversed', title: 'Horizontal lockup, small cut, reversed', path: `${P}/lockup-horizontal-small-reversed.svg`, dimensions: { width: 7005.89, height: 1332, unit: 'viewBox' }, fill: '#F2ECE4', surface: 'dark', minSize: { px: 17, dimension: 'height', below: 'logo.symbol.small.reversed' } },
  { ...symbol, id: 'logo.lockup.stacked.ink', title: 'Stacked lockup: symbol over wordmark, ink', path: `${P}/lockup-stacked.svg`, dimensions: { width: 5264.3, height: 3294, unit: 'viewBox' }, fill: '#2B2722', surface: 'light', minSize: { px: 66, dimension: 'height', below: 'logo.lockup.horizontal.ink' } },
  { ...symbol, id: 'logo.lockup.stacked.reversed', title: 'Stacked lockup, reversed', path: `${P}/lockup-stacked-reversed.svg`, dimensions: { width: 5264.3, height: 3294, unit: 'viewBox' }, fill: '#F2ECE4', surface: 'dark', minSize: { px: 66, dimension: 'height', below: 'logo.lockup.horizontal.reversed' } },

  // ------------------------------------------------------------------ app icon
  { ...icon, id: 'icon.app.default', title: 'App icon, default appearance: paper mark on sepia gradient tile. Opaque RGB, no alpha (App Store rule)', path: `${P}/app-icon-1024.png`, dimensions: { width: 1024, height: 1024, unit: 'px' }, fill: '#FBF8F3', background: ICON_TILE, surface: 'any', minSize: { px: 1024, dimension: 'square', below: 'icon.app.180 and smaller hand-tuned PNGs' } },
  { ...icon, id: 'icon.app.dark', title: 'App icon, dark appearance: accentDark mark on warm near-black', path: `${P}/app-icon-dark-1024.png`, dimensions: { width: 1024, height: 1024, unit: 'px' }, fill: '#D9A47E', background: ICON_TILE_DARK, surface: 'dark' },
  { ...icon, id: 'icon.app.tinted', title: 'App icon, tinted appearance: white mark on black, the system tints it', path: `${P}/app-icon-tinted-1024.png`, dimensions: { width: 1024, height: 1024, unit: 'px' }, fill: '#FFFFFF', background: '#000000', surface: 'tinted' },
  // 58, 80, 87, 120 added 2026-10-03 (BRD-04) so the iOS asset catalog carries hand-tuned rasters at Settings, Spotlight
  // and notification sizes instead of iOS downsampling the 1024 master.
  ...([16, 29, 32, 40, 58, 60, 80, 87, 120, 180, 192, 512] as const).flatMap((px) => [
    { ...icon, id: `icon.app.${px}`, title: `App icon at ${px} px, hand-tuned (sub-pixel offset${px <= 40 ? ', small-cut mark' : ''})`, path: `${P}/png/icon-${px}.png`, dimensions: { width: px, height: px, unit: 'px' }, fill: '#FBF8F3', background: ICON_TILE, surface: 'any' } as const,
    { ...icon, id: `icon.app.${px}.dark`, title: `App icon at ${px} px, dark, hand-tuned`, path: `${P}/png/icon-${px}-dark.png`, dimensions: { width: px, height: px, unit: 'px' }, fill: '#D9A47E', background: ICON_TILE_DARK, surface: 'dark' } as const,
  ]),

  // ------------------------------------------------------------------ notification glyph (monochrome, small cut)
  { ...icon, id: 'icon.notification.svg', title: 'Notification glyph: small-cut symbol, white on transparent, 24 x 24 canvas with the mark in the 20 px live area', path: 'packages/brand/assets/notification/glyph.svg', format: 'svg', dimensions: { width: 24, height: 24, unit: 'viewBox' }, fill: '#FFFFFF', background: 'transparent', surface: 'dark', minSize: { px: 24, dimension: 'square' }, notes: 'Android status-bar small icon (v1.1) and any monochrome notification slot. The OS tints it; never colour or tile it.' },
  ...([24, 36, 48, 72, 96] as const).map((px) => ({ ...icon, id: `icon.notification.${px}`, title: `Notification glyph at ${px} px (Android ${({ 24: 'mdpi', 36: 'hdpi', 48: 'xhdpi', 72: 'xxhdpi', 96: 'xxxhdpi' } as const)[px]})`, path: `packages/brand/assets/notification/glyph-${px}.png`, dimensions: { width: px, height: px, unit: 'px' }, fill: '#FFFFFF', background: 'transparent', surface: 'dark' }) as const),

  // ------------------------------------------------------------------ video, social
  { kind: 'image', id: 'video.endcard.landscape', title: 'Video end card 1920 x 1080: stacked lockup with the canonical tagline on paper', path: 'packages/brand/assets/video/end-card-1920x1080.png', format: 'png', dimensions: { width: 1920, height: 1080, unit: 'px' }, fill: '#2B2722', background: '#FBF8F3', surface: 'any', status: 'primary', version: V, date: D },
  { kind: 'image', id: 'video.endcard.portrait', title: 'Video end card 1080 x 1920 (9:16 stories, Play, the App Store preview at 886 x 1920 crops the sides only)', path: 'packages/brand/assets/video/end-card-1080x1920.png', format: 'png', dimensions: { width: 1080, height: 1920, unit: 'px' }, fill: '#2B2722', background: '#FBF8F3', surface: 'any', status: 'primary', version: V, date: D },
  { kind: 'image', id: 'social.post.template', title: 'Social post background plate 1080 x 1350 (4:5): accent pair opens the quote at top left, small-cut lockup at the foot, quote area empty', path: 'packages/brand/assets/social/post-template-1080x1350.png', format: 'png', dimensions: { width: 1080, height: 1350, unit: 'px' }, fill: '#8A5A3B / #2B2722', background: '#FBF8F3', surface: 'any', status: 'primary', version: V, date: D, notes: 'Set the quote in Literata 400, ink, 56 to 64 px, left aligned at x 96, starting 48 px under the pair. Real recorded words only, with the speaker credited by relationship ("Papa, Month 3").' },

  // ------------------------------------------------------------------ web
  { kind: 'favicon', id: 'favicon.svg', title: 'Favicon, small-cut symbol; accentDeep on light, accentDark on dark (prefers-color-scheme)', path: 'packages/brand/assets/favicon/favicon.svg', format: 'svg', dimensions: { width: 1183.14, height: 1183.14, unit: 'viewBox' }, fill: '#7F4F30 / #D9A47E', background: 'transparent', surface: 'any', minSize: { px: 16, dimension: 'square' }, url: '/favicon/favicon.svg', status: 'primary', version: V, date: D },
  { kind: 'favicon', id: 'favicon.png32', title: 'Favicon PNG fallback (app icon tile, small cut)', path: 'packages/brand/assets/favicon/favicon-32.png', format: 'png', dimensions: { width: 32, height: 32, unit: 'px' }, fill: '#FBF8F3', background: ICON_TILE, surface: 'any', url: '/favicon/favicon-32.png', status: 'primary', version: V, date: D },
  { kind: 'favicon', id: 'favicon.apple-touch', title: 'Apple touch icon (full-bleed square, iOS rounds it)', path: 'packages/brand/assets/favicon/apple-touch-icon.png', format: 'png', dimensions: { width: 180, height: 180, unit: 'px' }, fill: '#FBF8F3', background: ICON_TILE, surface: 'any', url: '/favicon/apple-touch-icon.png', status: 'primary', version: V, date: D },
  { kind: 'favicon', id: 'favicon.icon192', title: 'Web manifest icon 192', path: 'packages/brand/assets/favicon/icon-192.png', format: 'png', dimensions: { width: 192, height: 192, unit: 'px' }, fill: '#FBF8F3', background: ICON_TILE, surface: 'any', url: '/favicon/icon-192.png', status: 'primary', version: V, date: D },
  { kind: 'favicon', id: 'favicon.icon512', title: 'Web manifest icon 512', path: 'packages/brand/assets/favicon/icon-512.png', format: 'png', dimensions: { width: 512, height: 512, unit: 'px' }, fill: '#FBF8F3', background: ICON_TILE, surface: 'any', url: '/favicon/icon-512.png', status: 'primary', version: V, date: D },
  { kind: 'favicon', id: 'favicon.manifest', title: 'Web app manifest', path: 'packages/brand/assets/favicon/site.webmanifest', format: 'webmanifest', surface: 'any', url: '/favicon/site.webmanifest', status: 'primary', version: V, date: D },
  { kind: 'image', id: 'og.image', title: 'Open Graph / social share image: stacked lockup and tagline on paper', path: 'packages/brand/assets/og/og-image.png', format: 'png', dimensions: { width: 1200, height: 630, unit: 'px' }, fill: '#2B2722', background: '#FBF8F3', surface: 'any', url: '/og/og-image.png', status: 'primary', version: V, date: D },

  // ------------------------------------------------------------------ email (EMAIL_IDENTITY.md)
  { kind: 'email', id: 'email.logo.light@2x', title: 'Email header logo, light: ink lockup with 0.7 px paper halo (survives Gmail forced dark). Show at 154 x 32', path: 'packages/brand/assets/email/logo-light.png', format: 'png', dimensions: { width: 308, height: 64, unit: 'px' }, fill: '#2B2722', background: 'transparent', surface: 'light', url: '/email/logo-light.png', status: 'primary', version: V, date: D },
  { kind: 'email', id: 'email.logo.light@1x', title: 'Email header logo, light, 1x (previews, mis-scaling clients)', path: 'packages/brand/assets/email/logo-light@1x.png', format: 'png', dimensions: { width: 154, height: 32, unit: 'px' }, fill: '#2B2722', background: 'transparent', surface: 'light', url: '/email/logo-light@1x.png', status: 'primary', version: V, date: D },
  { kind: 'email', id: 'email.logo.dark@2x', title: 'Email header logo, dark: reversed lockup with near-black halo. Swapped in by dark CSS', path: 'packages/brand/assets/email/logo-dark.png', format: 'png', dimensions: { width: 308, height: 64, unit: 'px' }, fill: '#F2ECE4', background: 'transparent', surface: 'dark', url: '/email/logo-dark.png', status: 'primary', version: V, date: D },
  { kind: 'email', id: 'email.logo.dark@1x', title: 'Email header logo, dark, 1x', path: 'packages/brand/assets/email/logo-dark@1x.png', format: 'png', dimensions: { width: 154, height: 32, unit: 'px' }, fill: '#F2ECE4', background: 'transparent', surface: 'dark', url: '/email/logo-dark@1x.png', status: 'primary', version: V, date: D },
  { kind: 'email', id: 'email.logo.light.svg', title: 'Halo SVG source of the light email logo (not for email: Gmail does not render SVG)', path: 'packages/brand/assets/email/logo-light.svg', format: 'svg', dimensions: { width: 6394.95, height: 1332, unit: 'viewBox' }, fill: '#2B2722', background: 'transparent', surface: 'light', status: 'primary', version: V, date: D },
  { kind: 'email', id: 'email.logo.dark.svg', title: 'Halo SVG source of the dark email logo', path: 'packages/brand/assets/email/logo-dark.svg', format: 'svg', dimensions: { width: 6394.95, height: 1332, unit: 'viewBox' }, fill: '#F2ECE4', background: 'transparent', surface: 'dark', status: 'primary', version: V, date: D },
  { kind: 'email', id: 'email.avatar', title: 'Sender avatar (Apple Branded Mail upload, inbox tile): the default app icon, opaque 1024', path: 'packages/brand/assets/email/avatar-1024.png', format: 'png', dimensions: { width: 1024, height: 1024, unit: 'px' }, fill: '#FBF8F3', background: ICON_TILE, surface: 'any', status: 'primary', version: V, date: D },
  { kind: 'email', id: 'email.bimi.template', title: 'BIMI SVG Tiny PS template (solid accentDeep, paper symbol). Do not publish before DMARC enforcement and a validator pass', path: 'packages/brand/assets/email/avatar.tiny-ps.svg', format: 'svg', dimensions: { width: 1024, height: 1024, unit: 'viewBox' }, fill: '#FBF8F3', background: '#7F4F30', surface: 'any', status: 'primary', version: V, date: D },
  { kind: 'email', id: 'email.manifest', title: 'Email logo sizes, halo and alt text (machine-readable)', path: 'packages/brand/assets/email/manifest.json', format: 'json', surface: 'any', status: 'primary', version: V, date: D },

  // ------------------------------------------------------------------ colour (values = packages/brand/index.ts)
  { ...color, id: 'color.ink', title: 'Ink: text and one-colour logo on light', value: '#2B2722' },
  { ...color, id: 'color.inkMuted', title: 'Ink muted: secondary text on light (5.5:1 on paper)', value: '#6B645B' },
  { ...color, id: 'color.paper', title: 'Paper: the light background; icon mark colour', value: '#FBF8F3' },
  { ...color, id: 'color.paperRaised', title: 'Paper raised: cards and sheets on light', value: '#FFFFFF' },
  { ...color, id: 'color.accent', title: 'Accent: links, buttons, the warm brand moment (5.5:1 on paper)', value: '#8A5A3B' },
  { ...color, id: 'color.accentDeep', title: 'Accent deep: icon tile base, favicon, single-colour brand fills (6.47:1 on paper)', value: '#7F4F30' },
  { ...color, id: 'color.accentSoft', title: 'Accent soft: wash behind chips, code boxes, notes', value: '#F1E6DC' },
  { ...color, id: 'color.line', title: 'Line: hairlines, decorative only', value: '#E6DED3' },
  { ...color, id: 'color.inkDark', title: 'Ink on dark (reversed logo)', value: '#F2ECE4' },
  { ...color, id: 'color.inkMutedDark', title: 'Ink muted on dark', value: '#B3AA9E' },
  { ...color, id: 'color.paperDark', title: 'Paper dark: the dark background', value: '#161412' },
  { ...color, id: 'color.paperRaisedDark', title: 'Paper raised dark', value: '#201D1A' },
  { ...color, id: 'color.accentDark', title: 'Accent on dark; dark icon mark (8.4:1 on paperDark)', value: '#D9A47E' },
  { ...color, id: 'color.lineDark', title: 'Line on dark', value: '#33302C' },
  { ...color, id: 'color.icon.tileTop', title: 'App icon tile, gradient top (icon only, never UI)', value: '#9A613C' },
  { ...color, id: 'color.icon.tileBottom', title: 'App icon tile, gradient bottom (= accentDeep)', value: '#7F4F30' },
  { ...color, id: 'color.icon.darkTileTop', title: 'Dark app icon tile, top', value: '#2C2926' },
  { ...color, id: 'color.icon.darkTileBottom', title: 'Dark app icon tile, bottom', value: '#1F1B18' },

  // ------------------------------------------------------------------ type (all SIL OFL 1.1)
  { kind: 'font', id: 'font.wordmark', title: 'EB Garamond 1.003 (variable). The wordmark and brand display only (covers, splash titles, OG); never UI or letters', path: 'packages/brand/assets/fonts/eb-garamond/EBGaramond-VF.woff2', format: 'woff2', surface: 'any', status: 'primary', version: V, date: D, notes: 'Licence: packages/brand/assets/fonts/eb-garamond/OFL.txt. The wordmark itself is outlined artwork; never retype it.' },
  { kind: 'font', id: 'font.reading', title: 'Literata: letters, reading view, book pages, email headings and sign-off', format: 'npm', package: '@fontsource/literata', surface: 'any', status: 'primary', version: V, date: D },
  { kind: 'font', id: 'font.ui', title: 'Mukta: all interface text (Latin and Devanagari), email body', format: 'npm', package: '@fontsource/mukta', surface: 'any', status: 'primary', version: V, date: D },
  // Self-hosted latin subsets (from @fontsource, OFL copied alongside), served at https://earlyletters.com/fonts/.
  // Progressive enhancement in email: Apple Mail, iOS Mail and Outlook for Mac load them; everyone else keeps the
  // fallback stack (Georgia, system UI). Same files for the website.
  { kind: 'font', id: 'font.reading.web', title: 'Literata 400, latin, woff2 (email and web; headings, letters)', path: 'packages/brand/assets/fonts/literata/literata-latin-400-normal.woff2', format: 'woff2', surface: 'any', url: '/fonts/literata-latin-400-normal.woff2', status: 'primary', version: V, date: D, notes: 'Licence: packages/brand/assets/fonts/literata/OFL.txt (SIL OFL 1.1).' },
  { kind: 'font', id: 'font.reading.web.500', title: 'Literata 500, latin, woff2 (email and web headings)', path: 'packages/brand/assets/fonts/literata/literata-latin-500-normal.woff2', format: 'woff2', surface: 'any', url: '/fonts/literata-latin-500-normal.woff2', status: 'primary', version: V, date: D },
  { kind: 'font', id: 'font.reading.web.italic', title: 'Literata 400 italic, latin, woff2 (sign-off, tagline)', path: 'packages/brand/assets/fonts/literata/literata-latin-400-italic.woff2', format: 'woff2', surface: 'any', url: '/fonts/literata-latin-400-italic.woff2', status: 'primary', version: V, date: D },
  { kind: 'font', id: 'font.ui.web', title: 'Mukta 400, latin, woff2 (email and web UI text)', path: 'packages/brand/assets/fonts/mukta/mukta-latin-400-normal.woff2', format: 'woff2', surface: 'any', url: '/fonts/mukta-latin-400-normal.woff2', status: 'primary', version: V, date: D, notes: 'Licence: packages/brand/assets/fonts/mukta/OFL.txt (SIL OFL 1.1).' },
  { kind: 'font', id: 'font.ui.web.600', title: 'Mukta 600, latin, woff2 (buttons, emphasis)', path: 'packages/brand/assets/fonts/mukta/mukta-latin-600-normal.woff2', format: 'woff2', surface: 'any', url: '/fonts/mukta-latin-600-normal.woff2', status: 'primary', version: V, date: D },
  { kind: 'font', id: 'font.devanagari', title: 'Tiro Devanagari Hindi: Devanagari runs inside letters (Literata has no Devanagari)', format: 'npm', package: '@fontsource/tiro-devanagari-hindi', surface: 'any', status: 'primary', version: V, date: D },

  // ------------------------------------------------------------------ sources and tools
  { kind: 'source', id: 'source.logo.build', title: 'Builds every file in logo/primary from the drawing (byte-identical to the approved r3 final-a)', path: `${P}/source/build.mjs`, format: 'mjs', surface: 'any', status: 'primary', version: V, date: D },
  { kind: 'source', id: 'source.logo.geometry', title: 'Mark parameters and measured facts (gap, mass centre, tuning offsets)', path: `${P}/geometry.json`, format: 'json', surface: 'any', status: 'primary', version: V, date: D },
  { kind: 'source', id: 'source.touchpoints.build', title: 'Builds email logos, avatar, BIMI template, favicon set, OG image, notification glyphs, video end cards, social plate and the web font copies from the primary mark', path: 'packages/brand/scripts/build-touchpoints.mjs', format: 'mjs', surface: 'any', status: 'primary', version: V, date: D },
  { kind: 'source', id: 'source.logo.favicon', title: 'Favicon SVG as emitted by the mark build; copied unchanged to favicon.svg by build-touchpoints (use favicon.svg, never this file)', path: `${P}/favicon.svg`, format: 'svg', surface: 'any', status: 'primary', version: V, date: D },
  { kind: 'source', id: 'source.icon.bench', title: 'iOS icon test bench (home screen, sizes, App Store, notifications)', path: `${P}/source/bench.mjs`, format: 'mjs', surface: 'any', status: 'primary', version: V, date: D },

  // ------------------------------------------------------------------ deprecated (kept on disk until pruned; never use)
  { ...old, id: 'deprecated.logo.r1.a', title: 'Logo round 1, direction A (envelope e)', path: 'packages/brand/assets/logo/a', version: '0.1.0', date: '2026-10-02', supersededBy: 'logo.lockup.horizontal.ink' },
  { ...old, id: 'deprecated.logo.r1.b', title: 'Logo round 1, direction B (script mark)', path: 'packages/brand/assets/logo/b', version: '0.1.0', date: '2026-10-02', supersededBy: 'logo.lockup.horizontal.ink' },
  { ...old, id: 'deprecated.logo.r2', title: 'Logo round 2: six concepts, wordmark study, icon-craft bench (bench copy lives in primary/source)', path: 'packages/brand/assets/logo/r2', version: '0.2.0', date: '2026-10-03', supersededBy: 'logo.symbol.ink' },
  { ...old, id: 'deprecated.logo.r3', title: 'Logo round 3: quote, quote-letter, color-type, finals A and B (final-a is the archived original of primary)', path: 'packages/brand/assets/logo/r3', version: '0.3.0', date: '2026-10-03', supersededBy: 'logo.symbol.ink' },
  { ...old, id: 'deprecated.email.interim.source', title: 'B3 interim email lockup (Literata wordmark), its build scripts and mocks', path: 'packages/brand/assets/email/source', version: '0.1.0', date: '2026-10-03', supersededBy: 'email.logo.light@2x' },
  { ...old, id: 'deprecated.email.interim.bimi', title: 'B3 interim BIMI template (serif E monogram)', path: 'packages/brand/assets/email/avatar-interim.tiny-ps.svg', format: 'svg', version: '0.1.0', date: '2026-10-03', supersededBy: 'email.bimi.template' },
  { ...old, id: 'deprecated.email.direction.a', title: 'Email build of round 1 direction A', path: 'packages/brand/assets/email/a', version: '0.1.0', date: '2026-10-03', supersededBy: 'email.logo.light@2x' },
  { ...old, id: 'deprecated.email.direction.b', title: 'Email build of round 1 direction B', path: 'packages/brand/assets/email/b', version: '0.1.0', date: '2026-10-03', supersededBy: 'email.logo.light@2x' },
] as const satisfies readonly BrandAsset[];

export type AssetId = (typeof ASSETS)[number]['id'];

export interface BrandContext {
  readonly title: string;
  /**
   * Absent = live: the assets listed are the production files. `planned` = the touchpoint is specified (rule and
   * the rule-only assets it draws on) but its own artwork is not made yet; `release` says when it is needed.
   */
  readonly status?: 'planned';
  readonly release?: 'v1.0' | 'v1.1';
  /** In order of preference: light first, then dark, then fallbacks. */
  readonly assets: readonly AssetId[];
  /** Display size and placement rule for this touchpoint. */
  readonly rule: string;
}

export const CONTEXTS = {
  'app.icon': { title: 'iOS app icon (home screen, all appearances)', assets: ['icon.app.default', 'icon.app.dark', 'icon.app.tinted'], rule: 'The 1024 masters plus the hand-tuned asset catalog sizes (context app.notification), or an Icon Composer .icon with a small-size variant. Never add text, a border, or rounded corners (the system masks). Final glass check in Icon Composer on a device.' },
  'app.notification': { title: 'Notifications, Settings and Spotlight (small sizes)', assets: ['icon.app.40', 'icon.app.60', 'icon.app.58', 'icon.app.87', 'icon.app.80', 'icon.app.120', 'icon.app.40.dark', 'icon.app.60.dark', 'icon.app.58.dark', 'icon.app.87.dark', 'icon.notification.svg', 'icon.notification.24', 'icon.notification.36', 'icon.notification.48', 'icon.notification.72', 'icon.notification.96'], rule: 'iOS draws notifications with the app icon: ship the hand-tuned PNGs for 20 pt @2x/@3x (40/60), 29 pt @2x/@3x (58/87) and 40 pt @2x/@3x (80/120) in the asset catalog so iOS never downsamples the 1024 master. 40 px and below are the small cut. Monochrome slots (Android status bar, v1.1) use the small-cut glyph, white on transparent; the OS tints it.' },
  'app.splash': { title: 'Launch screen', assets: ['logo.symbol.ink', 'logo.symbol.reversed', 'color.paper', 'color.paperDark'], rule: 'Symbol alone, centred, 96 pt tall, on paper (paperDark in dark mode). No wordmark, no tagline, no motion.' },
  'app.header': { title: 'In-app brand header (welcome, empty book)', assets: ['logo.lockup.horizontal.small.ink', 'logo.lockup.horizontal.small.reversed'], rule: 'Small cut, 20 to 26 pt tall. Navigation bars use the system title, not the logo.' },
  'app.paywall': { title: 'Plus paywall header (above Apple SubscriptionStoreView)', assets: ['logo.lockup.stacked.ink', 'logo.lockup.stacked.reversed'], rule: 'Stacked lockup, 88 to 120 pt tall, centred, one per screen.' },
  'app.settings.about': { title: 'Settings > About', assets: ['icon.app.180', 'icon.app.180.dark', 'logo.lockup.horizontal.small.ink', 'logo.lockup.horizontal.small.reversed'], rule: 'App icon at 60 pt with the continuous-corner mask, small-cut lockup beneath at 22 pt.' },
  'web.header': { title: 'earlyletters.com header', assets: ['logo.lockup.horizontal.ink'], rule: 'Inline SVG with fill currentColor (one file serves light and dark), 28 px tall, links home.' },
  'web.footer': { title: 'earlyletters.com footer', assets: ['logo.lockup.horizontal.small.ink'], rule: 'Inline SVG, currentColor, 22 px tall (small cut).' },
  'web.og-image': { title: 'Link previews (Open Graph, Twitter, iMessage)', assets: ['og.image'], rule: '1200 x 630, absolute URL in og:image with width, height and alt.' },
  'web.favicon': { title: 'Browser tab and web manifest', assets: ['favicon.svg', 'favicon.png32', 'favicon.manifest', 'favicon.icon192', 'favicon.icon512'], rule: 'SVG first (follows the colour scheme), 32 px PNG fallback, manifest icons.' },
  'web.apple-touch': { title: 'iOS home-screen bookmark', assets: ['favicon.apple-touch'], rule: '180 px opaque square; iOS adds the corners.' },
  'email.header.light': { title: 'Email header, default (light)', assets: ['email.logo.light@2x', 'email.logo.light@1x'], rule: 'img 154 x 32, left aligned, not a link, on a paper plate (background-image) that Gmail forced dark does not invert; alt = brand name in Georgia, not a stand-in wordmark (EMAIL_IDENTITY.md 4).' },
  'email.header.dark': { title: 'Email header, dark-mode swap', assets: ['email.logo.dark@2x', 'email.logo.dark@1x'], rule: 'Hidden by default, shown by prefers-color-scheme and [data-ogsc] rules.' },
  'email.avatar': { title: 'Sender avatar (Apple Branded Mail, BIMI later)', assets: ['email.avatar', 'email.bimi.template'], rule: 'Upload the 1024 PNG to Apple Business. BIMI only after DMARC p=quarantine and a validator pass (EMAIL_IDENTITY.md 6).' },
  'email.footer': { title: 'Email footer (no logo)', assets: ['font.ui', 'color.inkMuted', 'color.inkMutedDark', 'color.line', 'color.lineDark'], rule: 'Text only: Mukta 13/19, inkMuted, a line rule above. No logo, no social icons.' },
  'appstore.icon': { title: 'App Store Connect icon', assets: ['icon.app.default'], rule: '1024 x 1024 PNG, opaque RGB, no alpha, no rounded corners.' },
  'appstore.screenshot-frame': { title: 'App Store and Play screenshot frame (caption band and device area)', status: 'planned', release: 'v1.0', assets: ['logo.symbol.accent', 'logo.symbol.reversed', 'color.paper', 'color.paperDark', 'color.ink', 'color.inkDark', 'font.reading', 'font.ui'], rule: 'Caption band on top, 22 percent of the frame height, paper (paperDark on the dark-mode frame). Headline Literata 500, ink, sentence case, 6 words or fewer, 84 px at 1260 x 2736 (64 px at 1080 x 1920); optional subline Mukta 400 inkMuted at 0.5 x. Symbol per appstore.screenshot-badge. Safe area 64 px from every edge. No lockup, price, rating or award text. Only v1.0 features (docs/design/CREATIVE.md 4).' },
  'play.feature-graphic': { title: 'Google Play feature graphic 1024 x 500', status: 'planned', release: 'v1.1', assets: ['logo.symbol.accent', 'logo.symbol.reversed', 'color.paper', 'color.paperDark', 'font.reading.web.italic'], rule: 'The pair (accent on paper, or reversed on paperDark) left of centre with the tagline in the canonical treatment (BRAND_SYSTEM.md 5). Keep everything inside the central 924 x 400; no price or promo text. Android ships in v1.1.' },
  'video.end-card': { title: 'Last beat of every video (store preview, film, social cuts)', assets: ['video.endcard.landscape', 'video.endcard.portrait'], rule: 'Hold at least 1 second, no motion on the mark, no sound sting. 16:9 and 9:16 PNGs; the 886 x 1920 App Store preview crops the 9:16 card at the sides (the lockup stays inside).' },
  'social.post-template': { title: 'Social post (4:5) and story (9:16) templates', assets: ['social.post.template', 'video.endcard.portrait', 'font.reading'], rule: 'Posts: the 1080 x 1350 plate, quote in Literata 400 ink from a real recording, credited by relationship. Stories: the 9:16 end card closes the story. One logo per post: the plate already carries it.' },
  'export.pdf': { title: 'Free PDF export of the book (v1.0)', status: 'planned', release: 'v1.0', assets: ['logo.lockup.stacked.ink', 'logo.symbol.small.ink', 'font.wordmark', 'font.reading', 'font.devanagari', 'color.ink', 'color.inkMuted', 'color.paper'], rule: 'Cover: stacked lockup at the foot, the child\'s name (as the parent typed it) and the title in EB Garamond. Interior per book.page. Running footer: page number and month in Mukta 9 pt inkMuted; no logo on interior pages. Colophon on the last page: horizontal lockup and "Kept exactly as you said it."' },
  'book.page': { title: 'Printed book and PDF interior pages (title page, letter pages, colophon)', status: 'planned', release: 'v1.1', assets: ['logo.symbol.small.ink', 'font.wordmark', 'font.reading', 'font.devanagari', 'color.ink', 'color.inkMuted'], rule: 'Title page and cover title in EB Garamond (brand display); letters in Literata, Devanagari in Tiro Devanagari Hindi. The small-cut symbol may mark a section break at most once per page (the only place the mark is used as a divider); never as a bullet or a pattern.' },
  'email.type': { title: 'Email web fonts (progressive)', assets: ['font.reading.web', 'font.reading.web.500', 'font.reading.web.italic', 'font.ui.web', 'font.ui.web.600'], rule: '@font-face from https://earlyletters.com/fonts/ only, hidden from Outlook for Windows. Fallbacks unchanged: Georgia for Literata, the platform UI font for Mukta.' },
  'appstore.screenshot-badge': { title: 'Brand mark on App Store screenshot frames', assets: ['logo.symbol.accent', 'logo.symbol.reversed'], rule: 'Symbol only, top-left of the caption band, cap-height of the caption tall. The app UI is the hero; no lockup on screenshots.' },
  'book.cover.emboss': { title: 'Printed book cover (blind emboss or foil)', assets: ['logo.symbol.ink'], rule: 'One-colour vector, symbol alone, 18 to 30 mm tall, centred on the lower third. Foil in accentDeep or blind.' },
  'book.spine': { title: 'Printed book spine', assets: ['logo.symbol.small.ink', 'logo.lockup.horizontal.small.ink'], rule: 'Small-cut symbol at the foot of the spine; lockup only if the spine is 12 mm or wider.' },
  'gift.card': { title: 'Gift card (print and digital)', assets: ['logo.lockup.stacked.ink', 'color.accentSoft', 'font.reading'], rule: 'Stacked lockup on accentSoft or paper; the message in Literata.' },
  'invite.card': { title: 'Co-parent invite card / share image', assets: ['logo.lockup.horizontal.ink', 'logo.lockup.horizontal.reversed', 'font.reading'], rule: 'Horizontal lockup at the foot, at least 27 px tall; the invite line in Literata. Never the child\'s name on a shared image unless the parent typed it.' },
  'social.avatar': { title: 'Social profile picture', assets: ['icon.app.default'], rule: 'The app icon square; platforms crop to a circle and the mark sits inside the safe zone.' },
  'press.kit': { title: 'Press kit download', assets: ['logo.lockup.horizontal.ink', 'logo.lockup.horizontal.reversed', 'logo.lockup.stacked.ink', 'logo.lockup.stacked.reversed', 'logo.symbol.ink', 'logo.symbol.reversed', 'logo.symbol.accent', 'icon.app.default', 'icon.app.dark', 'og.image'], rule: 'SVG and PNG as listed, plus docs/brand/BRAND_SYSTEM.md sections 3 to 5.' },
} as const satisfies Record<string, BrandContext>;

export type ContextId = keyof typeof CONTEXTS;

const byId: ReadonlyMap<string, BrandAsset> = new Map(ASSETS.map((a) => [a.id, a]));

/** One asset by id. Throws on an unknown id, so a typo fails loudly. */
export function asset(id: AssetId): BrandAsset {
  const a = byId.get(id);
  if (!a) throw new Error(`brand registry: unknown asset id "${id}"`);
  return a;
}

/** The assets a touchpoint uses, in order of preference. Only primary assets are ever returned. */
export function assetFor(context: ContextId): BrandAsset[] {
  const c: BrandContext | undefined = CONTEXTS[context];
  if (!c) throw new Error(`brand registry: unknown context "${String(context)}"`);
  return c.assets.map((id) => asset(id));
}

/** Repo-relative path of an asset; throws if the asset has none (colours, npm fonts). */
export function assetPath(id: AssetId): string {
  const a = asset(id);
  if (!a.path) throw new Error(`brand registry: "${id}" has no file path`);
  return a.path;
}

/** Status of any repo-relative path: the asset that covers it (exact file or a registered folder), or null. */
export function assetForPath(path: string): BrandAsset | null {
  const clean = path.replace(/^\.?\//, '').replace(/\/$/, '');
  let best: BrandAsset | null = null;
  for (const a of ASSETS as readonly BrandAsset[]) {
    if (!a.path) continue;
    if (clean === a.path || clean.startsWith(a.path + '/')) {
      if (!best || a.path.length > (best.path?.length ?? 0)) best = a;
    }
  }
  return best;
}

export const REGISTRY_VERSION = '1.0.0';
