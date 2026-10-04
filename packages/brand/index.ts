/**
 * The ONLY place the product's public identity lives.
 *
 * Renaming the product = edit this file. Code, repo, database and bundle ID
 * use the permanent codename "scribe" and never change.
 *
 * WARNING: `bundleId` cannot be changed after the first build is uploaded to
 * App Store Connect. `publisher.domain` is the real domain (BL-100); do not change it once the production
 * App Store Connect record exists.
 */

/**
 * Who publishes the app. Founder decision, Oct 3 2026 (docs/DECISIONS.md D-004):
 * an individual Apple Developer account, no company for now. The seller name on
 * the App Store is the founder's personal legal name; it is entered only in App
 * Store Connect and the published legal documents, never in code. Nothing in
 * the app renders `legalName`.
 */
const publisher = {
  /** 'individual' until the founder forms an entity and transfers the app (D-004). */
  kind: 'individual',
  /** TODO(founder): never put a real name here; legal documents carry it. */
  legalName: 'TODO: individual publisher (name set in legal documents, not in code)',
  /**
   * Reverse of this domain prefixes every app's bundle ID: com.earlyletters.scribe. The domain is the founder's
   * (earlyletters.com, live since 3 Oct 2026). The production bundle ID becomes permanent when its App Store
   * Connect record is first created; TestFlight builds use the `.preview` suffix (apps/mobile/app.config.ts) so
   * that id is not spent while testing.
   */
  domain: 'earlyletters.com',
  /** Mailbox on the real domain (receives replies to the welcome email). */
  supportEmail: 'hello@earlyletters.com',
  /** Published Privacy Policy page (draft-for-counsel until the founder marks it final). */
  privacyUrl: 'https://earlyletters.com/privacy',
} as const;

export const brand = {
  /** Brand name. Decided Oct 1 2026. Not yet trademark-cleared. */
  name: 'Early Letters',
  /** The category word people search for and understand. Always paired with the name. */
  category: 'memory book',
  /** App Store name, max 30 characters. */
  storeName: 'Early Letters: Memory Book',
  /** App Store subtitle, max 30 characters. */
  subtitle: 'Baby memory book in your voice',
  tagline: 'Exactly as you said it.',
  /** Printed product naming pattern. */
  printTitle: (year: number) => `Early Letters: Year ${year === 1 ? 'One' : year === 2 ? 'Two' : year === 3 ? 'Three' : year}`,
  publisher,
  /** Deprecated alias of `publisher`, kept so existing imports (`brand.company.privacyUrl`) keep working. */
  company: publisher,
  /** URL scheme for deep links. Lowercase, no spaces. */
  scheme: 'scribe',
  /** Permanent codename. Do not change. */
  codename: 'scribe',
  colors: {
    // Warm, literary palette; independent of Lumira's sage/terra on purpose.
    // All text pairs pass WCAG AA (4.5:1), computed Sept 30 2026:
    // ink/paper 14.0, inkMuted/paper 5.5, accent/paper 5.5, accent/accentSoft 4.7,
    // white on accent 5.8; dark: ink 15.7, inkMuted 8.0, accent 8.4.
    ink: '#2B2722',
    inkMuted: '#6B645B',
    paper: '#FBF8F3',
    paperRaised: '#FFFFFF',
    accent: '#8A5A3B',
    accentSoft: '#F1E6DC',
    line: '#E6DED3',
    // dark
    inkDark: '#F2ECE4',
    inkMutedDark: '#B3AA9E',
    paperDark: '#161412',
    paperRaisedDark: '#201D1A',
    accentDark: '#D9A47E',
    lineDark: '#33302C',
  },
} as const;

export function bundleId(): string {
  const reversed = brand.publisher.domain.split('.').reverse().join('.');
  return `${reversed}.${brand.codename}`;
}
