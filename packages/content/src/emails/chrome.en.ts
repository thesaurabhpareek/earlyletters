/**
 * Email chrome: the words around every email (lane B3, docs/brand/EMAIL_IDENTITY.md).
 * Header alt text, footer lines and the sign-off. The body of each email lives in
 * its own copy file (auth.en.ts and friends); legal lines live in legal.en.ts (L2).
 *
 * Placeholders, filled by the sender or by <EmailFooter> (D1):
 *   {whyYouGotThis}   one line, from the email's own whyText or emailLegal.whyYouGotThis[kind]
 *   {helpUrl}         https://earlyletters.com/help (or /contact until a help page exists)
 *   {privacyUrl}      published Privacy Policy URL (brand.publisher.privacyUrl)
 *   {preferencesUrl}  commercial only: signed link to the email preferences page
 *   {unsubscribe}     commercial only: emailLegal.unsubscribe (L2 owns the wording)
 *   {postalAddress}   commercial only: emailLegal.postalLine. Never a home address (D-004)
 *
 * Rules: plain text, straight quotes, no dashes, no emoji. No "view in browser"
 * link (personal emails are never hosted). No social icons. No tracking.
 */

export const emailChrome = {
  header: {
    /** Alt text for the logo image. When images are blocked this is what shows, styled as the wordmark. */
    alt: "Early Letters",
    /** The logo is not a link: every email has one action, and that action is in the body. */
    linked: false,
  },

  footer: {
    /** Account, security and receipt emails. Order is the render order, top to bottom. */
    transactional: [
      "{whyYouGotThis}",
      "Questions? Reply to this email. A person reads every one.",
    ],
    /** Newsletters and anything promotional. Sent from a separate subdomain, never mixed with sign-in mail. */
    commercial: [
      "{whyYouGotThis}",
      "Questions? Reply to this email. A person reads every one.",
      "{unsubscribe}",
      "{postalAddress}",
    ],
    /** One small row of text links under the lines above. Labels, then the placeholder each one points to. */
    links: {
      transactional: [
        { label: "Help", urlVar: "{helpUrl}" },
        { label: "Privacy", urlVar: "{privacyUrl}" },
      ],
      commercial: [
        { label: "Help", urlVar: "{helpUrl}" },
        { label: "Privacy", urlVar: "{privacyUrl}" },
        { label: "Email preferences", urlVar: "{preferencesUrl}" },
      ],
    },
    /** Last line of every footer, quiet. */
    nameLine: "Early Letters. Exactly as you said it.",
    /** Separator between footer links. A middle dot with spaces. */
    linkSeparator: " · ",
  },

  /** Letter-like sign-off. Two lines; <Signature> splits on the newline. */
  signature: "Warmly,\nEarly Letters",
} as const;

export type EmailChrome = typeof emailChrome;
