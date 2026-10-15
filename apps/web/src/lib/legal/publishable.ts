/**
 * Owner: E1 (web platform). The gate between docs/legal and the public site.
 *
 * A legal document reaches a visitor only when counsel has marked it final in the front matter AND its body
 * carries none of the marks a counsel draft has: placeholder tokens, counsel tags and notes, the drafting
 * notice, the notes appendix. Until then its address shows the holding page (components/site/LegalHolding.tsx).
 *
 * LEGAL_PAGES chooses, at build time, how the rest of the site treats a document that is held back:
 *   holding (default)  the footer keeps its link; the address shows the holding page
 *   unlink             the footer omits the link; the address still shows the holding page, never a 404
 *
 * Pure: no file access, so the unit tests and the e2e suite can run it over any text.
 */
export type LegalPagesMode = 'holding' | 'unlink';

export function resolveLegalPagesMode(env: Readonly<Record<string, string | undefined>>): LegalPagesMode {
  return env.LEGAL_PAGES?.trim() === 'unlink' ? 'unlink' : 'holding';
}

/** The one front-matter status that means counsel signed the document off. Anything else, or none, is a draft. */
export const FINAL_STATUS = 'final';

export function isFinalStatus(status: string | undefined): boolean {
  return status?.trim().toLowerCase() === FINAL_STATUS;
}

export interface DraftMarker {
  name: string;
  pattern: RegExp;
}

/** What a counsel draft carries that a visitor must never see. The e2e suite checks the live pages for the same marks. */
export const DRAFT_MARKERS: readonly DraftMarker[] = [
  { name: 'placeholder token such as {PUBLISHER_LEGAL_NAME}', pattern: /\{[A-Z_]+\}/ },
  { name: 'counsel note tag [CN-n]', pattern: /\[CN-/ },
  { name: 'counsel note tag [HN-n]', pattern: /\[HN-/ },
  { name: 'counsel note [COUNSEL ...]', pattern: /\[COUNSEL/ },
  { name: 'todo tag [TODO ...]', pattern: /\[TODO/ },
  { name: 'todo call TODO(...)', pattern: /TODO\(/ },
  { name: 'drafting notice', pattern: /Drafting notice/ },
  { name: 'notes for counsel appendix', pattern: /Appendix A\. Notes for counsel/ },
  { name: 'counsel must confirm', pattern: /COUNSEL MUST CONFIRM/ },
];

/** The names of the markers a body carries, in list order. Empty for a clean body. */
export function findDraftMarkers(body: string): string[] {
  return DRAFT_MARKERS.filter((marker) => marker.pattern.test(body)).map((marker) => marker.name);
}

export interface PublishDecision {
  publishable: boolean;
  /** Why the document is held back; empty when it is publishable. Names the marks, never quotes the document. */
  blockers: string[];
}

export function decidePublishable(status: string | undefined, body: string): PublishDecision {
  const blockers: string[] = [];
  if (!isFinalStatus(status)) {
    const shown = status?.trim() ? JSON.stringify(status.trim()) : 'missing';
    blockers.push(`status is ${shown}, not ${JSON.stringify(FINAL_STATUS)}`);
  }
  blockers.push(...findDraftMarkers(body));
  return { publishable: blockers.length === 0, blockers };
}

export interface FooterLink {
  readonly href: string;
  readonly label: string;
}

/**
 * The footer's legal links for a mode. In unlink mode a link to a document that is held back is left out;
 * every other link (delete-account, a publishable document) stays. Holding mode keeps them all.
 */
export function filterFooterLinks(links: readonly FooterLink[], mode: LegalPagesMode, heldHrefs: ReadonlySet<string>): FooterLink[] {
  return mode === 'unlink' ? links.filter((link) => !heldHrefs.has(link.href)) : [...links];
}
