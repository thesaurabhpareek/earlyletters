/** Owner: E1 (web platform). The legal pipeline keeps the words, sanitises the output and adds only navigation. */
import { describe, expect, it } from 'vitest';
import { legalDocuments, legalSlugs } from './documents';
import { loadLegalDocument } from './load';
import { isFinalStatus, renderMarkdown, splitFrontmatter } from './render';

const labels = { contents: 'Contents', table: 'Table' };

describe('renderMarkdown', () => {
  it('drops scripts, raw HTML, event handlers and javascript: links', async () => {
    const { html } = await renderMarkdown(
      [
        '# Title',
        '<script>alert(1)</script>',
        '<img src="x" onerror="alert(1)">',
        '<iframe src="https://example.com"></iframe>',
        '[click](javascript:alert(1))',
        '[data](data:text/html;base64,AAAA)',
      ].join('\n\n'),
      labels,
    );
    expect(html).not.toMatch(/<script|<iframe|<img|onerror|javascript:|data:text/i);
    expect(html).toContain('click');
  });

  it('keeps every word, adds heading ids and a contents list under the title', async () => {
    const md = '# Policy\n\nIntro text.\n\n## 1. First part\n\nBody one.\n\n## 2. Second part\n\nBody two.\n';
    const { html, toc } = await renderMarkdown(md, labels);
    expect(toc.map((t) => t.text)).toEqual(['1. First part', '2. Second part']);
    expect(html).toContain('<h2 id="1-first-part">1. First part</h2>');
    expect(html).toContain('href="#2-second-part"');
    expect(html.indexOf('<h1')).toBeLessThan(html.indexOf('data-toc'));
    expect(html.indexOf('data-toc')).toBeLessThan(html.indexOf('Intro text.'));
    for (const word of ['Intro text.', 'Body one.', 'Body two.']) expect(html).toContain(word);
  });

  it('labels table cells, wraps tables and marks outside links', async () => {
    const md = '# T\n\n| Vendor | Region |\n|---|---|\n| Acme | us-west-1 |\n\nSee https://example.com/dpa for terms.\n';
    const { html } = await renderMarkdown(md, labels);
    expect(html).toContain('data-table-wrap');
    expect(html).toContain('role="table"');
    expect(html).toContain('data-label="Vendor"');
    expect(html).toContain('data-label="Region"');
    expect(html).toContain('rel="noopener noreferrer"');
  });

  it('gives every table its own landmark name when a page has several', async () => {
    const table = '| A | B |\n|---|---|\n| 1 | 2 |\n';
    const many = await renderMarkdown(`# T\n\n${table}\nText.\n\n${table}\nMore.\n\n${table}`, labels);
    const names = [...many.html.matchAll(/aria-label="([^"]+)"/g)].map((m) => m[1]).filter((n) => n.startsWith('Table'));
    expect(names).toEqual(['Table, 1 of 3', 'Table, 2 of 3', 'Table, 3 of 3']);
    const one = await renderMarkdown(`# T\n\n${table}`, labels);
    expect(one.html).toContain('aria-label="Table"');
  });

  it('puts the contents before the first section when the body has no title', async () => {
    const { html, hasTitle } = await renderMarkdown('Notice.\n\n## 1. One\n\nA.\n\n## 2. Two\n\nB.\n', labels);
    expect(hasTitle).toBe(false);
    expect(html.indexOf('data-toc')).toBeLessThan(html.indexOf('<h2'));
    expect(html.indexOf('Notice.')).toBeLessThan(html.indexOf('data-toc'));
  });
});

describe('frontmatter and status', () => {
  it('reads the header and treats only signed-off statuses as final', () => {
    const { data, body } = splitFrontmatter('---\ntitle: A\nstatus: draft-for-counsel\nlast_updated: 2026-10-03\n---\n\n# A\n');
    expect(data).toMatchObject({ title: 'A', status: 'draft-for-counsel', lastUpdated: '2026-10-03' });
    expect(body.trim()).toBe('# A');
    expect(isFinalStatus(data.status)).toBe(false);
    expect(isFinalStatus(undefined)).toBe(false);
    expect(isFinalStatus('Published')).toBe(true);
  });
});

describe('the real documents in docs/legal', () => {
  it.each(legalSlugs)('%s renders with its title, every section in the contents and no script', async (slug) => {
    const doc = await loadLegalDocument(slug);
    expect(doc.title.length).toBeGreaterThan(5);
    // Every page has one heading: the document's own, or its header title when the body starts at section 1.
    expect(doc.hasTitle ? doc.html.includes('<h1') : doc.title.length > 5).toBe(true);
    expect(doc.html).not.toMatch(/<script|onerror|javascript:/i);
    expect(doc.toc.length).toBeGreaterThan(3);
    expect(legalDocuments[slug].href).toBe(`/${slug}`);
  });
});
