/**
 * The ONLY place the product's public identity lives.
 *
 * Renaming the product = edit this file. Code, repo, database and bundle ID
 * use the permanent codename "scribe" and never change.
 *
 * WARNING: `bundleId` cannot be changed after the first build is uploaded to
 * App Store Connect. It is derived from `publisher.domain` (earlyletters.com,
 * owned by the founder, docs/DECISIONS.md D-063), so the production bundle id
 * is `com.earlyletters.scribe`. Do not change the domain after that upload.
 */

/** The public website. Founder, 3 Oct 2026 (D-063): earlyletters.com is primary; earlyletters.app redirects to it (both at Porkbun). */
const domain = 'earlyletters.com';
const origin = `https://${domain}` as const;

/** Brand name. Decided Oct 1 2026. Not yet trademark-cleared. */
const name = 'Early Letters';

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
  /** Reverse of this domain prefixes every app's bundle ID (D-063). */
  domain,
  /** Live support mailbox (D-063; mail runs through Resend). Shown in Help, emails and the store listing. */
  supportEmail: `hello@${domain}`,
  /** Published, versioned Privacy Policy URL (D-063). */
  privacyUrl: `${origin}/privacy`,
} as const;

/**
 * Public web addresses (founder, 3 Oct 2026, D-063). The one-page website and
 * the legal pages are built in a separate thread; these paths are the contract.
 */
const web = {
  origin,
  /** Universal links (invites, email sign-in) live under this origin; the AASA file is served here. */
  universalLinkBase: origin,
  /** Other owned domains. They redirect to `origin` and never serve app links. */
  redirectDomains: ['earlyletters.app'],
  terms: `${origin}/terms`,
  privacy: `${origin}/privacy`,
  /** Consumer Health Data Privacy Policy (Washington MHMDA and similar laws). */
  healthPrivacy: `${origin}/health-privacy`,
  subprocessors: `${origin}/subprocessors`,
  /** Static page explaining in-app deletion plus an email route (D-042). */
  deleteAccount: `${origin}/delete-account`,
} as const;

const support = {
  email: publisher.supportEmail,
  mailto: `mailto:${publisher.supportEmail}`,
} as const;

/**
 * Transactional email identity (packages/emails). Sent through Resend from the verified domain.
 * Replies go to the support mailbox, so "write to us" and "reply" reach the same place.
 */
const email = {
  fromName: name,
  fromAddress: publisher.supportEmail,
  replyTo: publisher.supportEmail,
} as const;

export const brand = {
  /** Brand name. Decided Oct 1 2026. Not yet trademark-cleared. */
  name,
  /** The category word people search for and understand. Always paired with the name. */
  category: 'memory book',
  /** App Store name, max 30 characters. */
  storeName: `${name}: Memory Book`,
  /** App Store subtitle, max 30 characters. Adds search words the name lacks ("baby", "journal"). */
  subtitle: 'Baby journal in your own voice',
  tagline: 'Exactly as you said it.',
  /** Printed product naming pattern. */
  printTitle: (year: number) => `${name}: Year ${year === 1 ? 'One' : year === 2 ? 'Two' : year === 3 ? 'Three' : year}`,
  publisher,
  /** Deprecated alias of `publisher`, kept so existing imports (`brand.company.privacyUrl`) keep working. */
  company: publisher,
  web,
  support,
  email,
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
    /**
     * One step deeper than accent (Oct 3 2026, logo r3 color-type, approved with the mark). App icon tile
     * base, favicon on light, single-colour brand fills. paper on it 6.47, white on it 6.85, on accentSoft 5.58.
     */
    accentDeep: '#7F4F30',
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
  /**
   * App icon only (tile fills), not UI colours. Default: vertical gradient, paper mark.
   * Dark: warm near-black, accentDark mark. Tinted: mark shape only (the system tints it).
   * Mark on tile: 4.78 top, 5.53 middle, 6.47 bottom; dark 6.58 to 7.79.
   */
  icon: {
    tileTop: '#9A613C',
    tileBottom: '#7F4F30', // = colors.accentDeep
    mark: '#FBF8F3', // = colors.paper, never pure white
    darkTileTop: '#2C2926',
    darkTileBottom: '#1F1B18',
    darkMark: '#D9A47E', // = colors.accentDark
  },
} as const;

// Named re-exports (not `export *`): tsx loads this package as CommonJS, and Node's CJS export detection cannot
// see through a star re-export of a .ts file.
export { ASSETS, CONTEXTS, REGISTRY_VERSION, asset, assetFor, assetForPath, assetPath } from './registry';
export type { AssetFormat, AssetId, AssetKind, AssetStatus, BrandAsset, BrandContext, ContextId, Surface } from './registry';

export function bundleId(): string {
  const reversed = brand.publisher.domain.split('.').reverse().join('.');
  return `${reversed}.${brand.codename}`;
}

/** A support email link with an optional subject. Never put letter text, names or ids in it (LEGAL-REQ-014). */
export function supportMailto(subject?: string): string {
  return subject ? `${brand.support.mailto}?subject=${encodeURIComponent(subject)}` : brand.support.mailto;
}
