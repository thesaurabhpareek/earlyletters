/** Owner: E1 (web platform). The shape of a legal page: a title, a date, a short intro and plain sections. */

/** A paragraph, or a bulleted list. */
export type LegalBlock = string | { readonly list: readonly string[] };

export interface LegalSection {
  /** The heading's id, for links into the page. */
  readonly id: string;
  readonly heading: string;
  readonly blocks: readonly LegalBlock[];
}

export interface LegalPageCopy {
  readonly metaTitle: string;
  readonly metaDescription: string;
  readonly title: string;
  /** ISO date (YYYY-MM-DD). The page shows "Last updated" with it; git history is the change log. */
  readonly lastUpdated: string;
  readonly intro: readonly LegalBlock[];
  readonly sections: readonly LegalSection[];
}

/**
 * Who runs the site, in the two places a page names them (lib/legal/publisher.ts): "run by <subject> as an
 * individual" and "we and us mean <reference>". With the legal name set, both are the name.
 */
export interface Publisher {
  readonly subject: string;
  readonly reference: string;
}

/** Text in a paragraph that becomes a link: the contact address, or the name of the other page. */
export interface InlineLink {
  readonly text: string;
  readonly href: string;
}
