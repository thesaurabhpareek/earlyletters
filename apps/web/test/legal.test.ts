/**
 * The gate between docs/legal and the live site (src/lib/legal/publishable.ts and what reads it). Owner: E1 (web platform).
 * A counsel draft never reaches a visitor, in either LEGAL_PAGES mode: every draft marker holds a document back, the
 * footer and the sitemap follow the decision, and the version line comes from the front matter alone.
 */
import { describe, expect, it } from 'vitest';
import { site } from '../src/content/site';
import { legalSlugs } from '../src/lib/legal/documents';
import { legalCopy } from '../src/lib/legal/legal-copy';
import { loadLegalDocument } from '../src/lib/legal/load';
import {
  DRAFT_MARKERS,
  decidePublishable,
  filterFooterLinks,
  findDraftMarkers,
  isFinalStatus,
  resolveLegalPagesMode,
} from '../src/lib/legal/publishable';
import { renderMarkdown } from '../src/lib/legal/render';
import { sitemapEntries } from '../src/lib/legal/sitemap';

/** A body with nothing a visitor must not see. */
const CLEAN = '# A Policy\n\nWe keep your words as you said them.\n\n## 1. Who we are\n\nA person in California.\n';

describe('LEGAL_PAGES', () => {
  // RULE: holding unless the variable says unlink; an unknown value never changes what a deploy shows.
  it('defaults to holding, accepts unlink, and ignores anything else', () => {
    expect(resolveLegalPagesMode({})).toBe('holding');
    expect(resolveLegalPagesMode({ LEGAL_PAGES: 'holding' })).toBe('holding');
    expect(resolveLegalPagesMode({ LEGAL_PAGES: 'unlink' })).toBe('unlink');
    expect(resolveLegalPagesMode({ LEGAL_PAGES: ' unlink ' })).toBe('unlink');
    expect(resolveLegalPagesMode({ LEGAL_PAGES: 'hide' })).toBe('holding');
    expect(resolveLegalPagesMode({ LEGAL_PAGES: '' })).toBe('holding');
  });
});

describe('front-matter status', () => {
  // RULE: only status: final means counsel signed off.
  it('treats only final as signed off', () => {
    expect(isFinalStatus('final')).toBe(true);
    expect(isFinalStatus(' Final ')).toBe(true);
    for (const status of ['draft-for-counsel', 'published', 'approved', 'counsel-approved', 'finalised', 'draft', '', undefined]) {
      expect(isFinalStatus(status), String(status)).toBe(false);
    }
  });

  it('holds a clean body back while the status is not final, and says so', () => {
    const draft = decidePublishable('draft-for-counsel', CLEAN);
    expect(draft.publishable).toBe(false);
    expect(draft.blockers).toEqual(['status is "draft-for-counsel", not "final"']);
    expect(decidePublishable(undefined, CLEAN).blockers).toEqual(['status is missing, not "final"']);
  });

  it('publishes a clean body with a final status', () => {
    expect(decidePublishable('final', CLEAN)).toEqual({ publishable: true, blockers: [] });
  });
});

describe('draft markers', () => {
  const samples: [string, string][] = [
    ['{PLACEHOLDER}', 'Made and run by {PUBLISHER_LEGAL_NAME}, an individual based in California.'],
    ['{PLACEHOLDER}', 'Reach us at {PRIVACY_EMAIL}.'],
    ['[CN-', 'We decide how your information is used. [CN-1]'],
    ['[HN-', 'That can be consumer health data. [HN-1]'],
    ['[COUNSEL', '**[COUNSEL: confirm the wording.]**'],
    ['[COUNSEL', '> **[COUNSEL NOTE FOR THE FOUNDER. Not part of the Terms.]**'],
    ['[TODO', 'Our address is [TODO: mailing address].'],
    ['TODO(', 'TODO(founder): pick the email provider.'],
    ['Drafting notice', '> **Drafting notice.** This document was drafted for review by a licensed attorney.'],
    ['Appendix A. Notes for counsel', '## Appendix A. Notes for counsel (remove before publishing)'],
    ['COUNSEL MUST CONFIRM', 'COUNSEL MUST CONFIRM the retention periods.'],
  ];

  // RULE: each marker on its own holds a document back, even with status: final.
  it.each(samples)('%s holds the document back even when the status is final', (_name, line) => {
    const decision = decidePublishable('final', `${CLEAN}\n${line}\n`);
    expect(decision.publishable).toBe(false);
    expect(decision.blockers).toHaveLength(1);
  });

  it('is proven for every pattern in the list', () => {
    const proven = new Set(samples.flatMap(([, line]) => findDraftMarkers(line)));
    expect([...proven].sort()).toEqual(DRAFT_MARKERS.map((marker) => marker.name).sort());
  });

  it('names every marker a body carries, in list order', () => {
    const body = `${CLEAN}\n{CONTACT_ADDRESS} [CN-2]\n\n## Appendix A. Notes for counsel\n`;
    expect(findDraftMarkers(body)).toEqual([
      'placeholder token such as {PUBLISHER_LEGAL_NAME}',
      'counsel note tag [CN-n]',
      'notes for counsel appendix',
    ]);
  });

  it('leaves ordinary legal text alone', () => {
    for (const line of [
      'the {child} placeholder the app fills in',
      'see Appendix A. Definitions',
      'Section [4] applies',
      'todo lists are not records',
      'a drafting process',
      'Counsel confirmed the dates',
      'Reach us at hello@example.com',
    ]) {
      expect(findDraftMarkers(line), line).toEqual([]);
    }
  });
});

describe('footer links by mode', () => {
  const held = new Set(['/privacy', '/terms']);
  const hrefs = (links: readonly { href: string }[]) => links.map((link) => link.href);

  // RULE: holding keeps every link; unlink drops only links to documents that are held back.
  it('holding: every link stays', () => {
    expect(filterFooterLinks(site.footer.links, 'holding', held)).toEqual([...site.footer.links]);
  });

  it('unlink: links to held documents go, the others stay in order', () => {
    const links = filterFooterLinks(site.footer.links, 'unlink', held);
    expect(hrefs(links)).toEqual(hrefs(site.footer.links).filter((href) => !held.has(href)));
    expect(hrefs(links)).toContain('/delete-account');
    expect(hrefs(links)).not.toContain('/privacy');
  });

  it('unlink with nothing held: every link stays', () => {
    expect(filterFooterLinks(site.footer.links, 'unlink', new Set())).toEqual([...site.footer.links]);
  });
});

describe('sitemap', () => {
  const docs = [
    { href: '/privacy', publishable: true, lastUpdated: '2026-11-01' },
    { href: '/terms', publishable: false, lastUpdated: '2026-10-04' },
    { href: '/subprocessors', publishable: true, lastUpdated: undefined },
  ];

  // RULE: only indexable, publishable addresses; a held (noindex) document is never listed; no changefreq or priority.
  it('lists home, publishable documents with their date, and delete-account, with nothing else', () => {
    expect(sitemapEntries('https://example.com', docs)).toEqual([
      { url: 'https://example.com' },
      { url: 'https://example.com/privacy', lastModified: '2026-11-01' },
      { url: 'https://example.com/subprocessors' },
      { url: 'https://example.com/delete-account' },
    ]);
  });

  it('lists only home and delete-account while every document is held back', () => {
    const entries = sitemapEntries('https://example.com', docs.map((doc) => ({ ...doc, publishable: false })));
    expect(entries.map((entry) => entry.url)).toEqual(['https://example.com', 'https://example.com/delete-account']);
  });
});

describe('version and effective date come from the front matter', () => {
  const labels = legalCopy.labels;

  // RULE: the line under the title is built from the front matter; a body line that repeats it is left out.
  it('shows the front-matter line under the title and drops the body line that repeats it', async () => {
    const body = '# Policy\n\nVersion 1.1.0. Effective date: TBD.\n\nIntro.\n\n## 1. One\n\nA.\n\n## 2. Two\n\nB.\n';
    const { html, stripped } = await renderMarkdown(body, labels, { version: '1.4.0', effectiveDate: '1 November 2026' });
    expect(stripped).toEqual(['Version 1.1.0. Effective date: TBD.']);
    expect(html).not.toContain('1.1.0');
    expect(html).toContain('<p data-doc-meta="">Version 1.4.0. Effective date: 1 November 2026.</p>');
    expect(html.indexOf('<h1')).toBeLessThan(html.indexOf('data-doc-meta'));
    expect(html.indexOf('data-doc-meta')).toBeLessThan(html.indexOf('data-toc'));
    expect(html.indexOf('data-toc')).toBeLessThan(html.indexOf('Intro.'));
  });

  it('strips a lone version or date line too, but never a sentence', async () => {
    const body = [
      '# P',
      'Version 2.0.0.',
      'Effective date: 2026-11-01.',
      'Effective date: November 1, 2026.',
      'Version control matters to us.',
      'Effective date: we tell you 30 days before a change applies.',
    ].join('\n\n');
    const { html, stripped } = await renderMarkdown(body, labels, { version: '2.0.0' });
    expect(stripped).toEqual(['Version 2.0.0.', 'Effective date: 2026-11-01.', 'Effective date: November 1, 2026.']);
    expect(html).toContain('<p data-doc-meta="">Version 2.0.0.</p>');
    expect(html).toContain('Version control matters to us.');
    expect(html).toContain('Effective date: we tell you 30 days before a change applies.');
  });

  it('goes before the first section when the body has no title', async () => {
    const { html } = await renderMarkdown('Notice.\n\n## 1. One\n\nA.\n', labels, { effectiveDate: 'TBD' });
    expect(html).toContain('<p data-doc-meta="">Effective date: TBD.</p>');
    expect(html.indexOf('data-doc-meta')).toBeLessThan(html.indexOf('<h2'));
  });

  it('leaves the body alone when the front matter has no version or date', async () => {
    const { html, stripped } = await renderMarkdown('# P\n\nVersion 1.0.0. Effective date: TBD.\n', labels);
    expect(stripped).toEqual([]);
    expect(html).toContain('Version 1.0.0. Effective date: TBD.');
    expect(html).not.toContain('data-doc-meta');
  });
});

describe('the real documents in docs/legal', () => {
  it.each(legalSlugs)('%s: the loader decides as the gate does, names its blockers, and shows the header version', async (slug) => {
    const doc = await loadLegalDocument(slug);
    expect(doc.publishable).toBe(doc.blockers.length === 0);
    if (!doc.publishable) expect(doc.blockers[0]).toMatch(/status|token|tag|note|notice|appendix|confirm/);
    expect(doc.title.length).toBeGreaterThan(5);
    if (doc.version) {
      expect(doc.html).toContain(`<p data-doc-meta="">${legalCopy.labels.version} ${doc.version}.`);
      // No other version line survives in the body.
      expect(doc.html).not.toMatch(new RegExp(`<p>${legalCopy.labels.version} \\d`));
    }
  });
});

describe('holding page words', () => {
  // RULE: the contact comes from the site content, the sentence is the one the brief asks for.
  it('use the site contact and the agreed sentence', () => {
    expect(legalCopy.holding.contact).toBe(site.footer.contact);
    expect(legalCopy.holding.line).toBe('This page is being finished with our lawyers and will be here before the app is.');
    expect(legalCopy.holding.questions).toBe('Questions:');
  });
});
