/**
 * Owner: E1 (web platform). Pure Markdown to safe HTML for the legal pages. No file access here,
 * so it can be tested without the repo's docs.
 *
 * Rules this module keeps:
 * - It never changes the words of a document. It adds navigation only: heading ids, a collapsed
 *   contents list under the title, table labels for small screens, and rel on outside links.
 * - The version and effective date a visitor sees come from the document's front matter (one line under
 *   the title). A body paragraph that only repeats them is left out, so the two can never disagree.
 * - Raw HTML in a document is dropped (remark-rehype does not pass it through), and the final tree
 *   goes through rehype-sanitize last, so nothing a plugin adds can be unsafe.
 */
import type { Element, ElementContent, Nodes, Parent, Root } from 'hast';
import rehypeSanitize, { defaultSchema, type Options as SanitizeOptions } from 'rehype-sanitize';
import rehypeSlug from 'rehype-slug';
import rehypeStringify from 'rehype-stringify';
import remarkGfm from 'remark-gfm';
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';
import { unified, type Plugin } from 'unified';

export interface RenderLabels {
  /** Summary text of the collapsed contents list. */
  contents: string;
  /** Accessible name of the sideways-scrolling table wrapper. */
  table: string;
  /** "Version" and "Effective date": the line under the title, built from the front matter. */
  version: string;
  effectiveDate: string;
}

/** From the front matter. Either part may be missing; with neither, no line is added and the body is left as it is. */
export interface RenderMeta {
  version?: string;
  effectiveDate?: string;
}

export interface TocEntry {
  id: string;
  text: string;
}

export interface Rendered {
  html: string;
  toc: TocEntry[];
  /** False when the document body has no first-level heading (subprocessors.md starts at "## 1."). */
  hasTitle: boolean;
  /** Body paragraphs that only repeated the front matter (version, effective date) and were left out. */
  stripped: string[];
}

/** A date as the documents write it (1 November 2026, November 1, 2026, 2026-11-01) or TBD. Never a sentence. */
const DATE_OR_TBD = String.raw`(?:TBD|\d{4}-\d{2}-\d{2}|[\w ,-]{0,40}\d{4})`;
/** A paragraph that only repeats the header, such as "Version 1.1.0. Effective date: TBD." */
const REPEATED_META = new RegExp(String.raw`^(?:version\s+\d[\w.-]*\.?)?\s*(?:effective date:?\s*${DATE_OR_TBD}\.?)?$`, 'i');

function metaLine(labels: RenderLabels, meta: RenderMeta | undefined): string | undefined {
  const parts: string[] = [];
  if (meta?.version) parts.push(`${labels.version} ${meta.version}.`);
  if (meta?.effectiveDate) parts.push(`${labels.effectiveDate}: ${meta.effectiveDate}.`);
  return parts.length ? parts.join(' ') : undefined;
}

function textOf(node: Nodes | ElementContent): string {
  if (node.type === 'text') return node.value;
  if ('children' in node) return (node.children as ElementContent[]).map(textOf).join('');
  return '';
}

function el(tagName: string, properties: Element['properties'], children: ElementContent[]): Element {
  return { type: 'element', tagName, properties, children };
}

function walk(node: Nodes, visit: (el: Element, parent: Parent, index: number) => void): void {
  if (!('children' in node)) return;
  const parent = node as Parent;
  // Iterate over a copy: visitors may replace or remove the node they are given.
  parent.children.slice().forEach((child) => {
    if (child.type !== 'element') return;
    visit(child, parent, parent.children.indexOf(child));
    walk(child, visit);
  });
}

interface EnhanceOptions {
  labels: RenderLabels;
  toc: TocEntry[];
  state: { hasTitle: boolean };
  /** The front-matter line to show under the title; with none, repeated body lines are kept. */
  metaLine: string | undefined;
  stripped: string[];
}

/** Adds navigation, the front-matter line and small-screen labels. Runs before sanitising, which is the last step. */
const enhance: Plugin<[EnhanceOptions], Root> =
  ({ labels, toc, state, metaLine, stripped }) =>
  (tree) => {
    let firstH1: { parent: Parent; index: number } | undefined;
    let firstH2: { parent: Parent; index: number } | undefined;

    // A body line that only repeats the front matter goes first, before any index below is recorded.
    if (metaLine) {
      walk(tree, (node, parent, index) => {
        if (node.tagName !== 'p') return;
        const text = textOf(node).trim();
        if (text && REPEATED_META.test(text)) {
          stripped.push(text);
          parent.children.splice(index, 1);
        }
      });
    }

    // Several tables on one page must not share one landmark name, so a screen reader can tell them apart.
    let tableTotal = 0;
    walk(tree, (node) => {
      if (node.tagName === 'table') tableTotal += 1;
    });
    let tableNumber = 0;

    walk(tree, (node, parent, index) => {
      switch (node.tagName) {
        case 'h1':
          firstH1 ??= { parent, index };
          break;
        case 'h2': {
          firstH2 ??= { parent, index };
          const id = typeof node.properties.id === 'string' ? node.properties.id : '';
          if (id) toc.push({ id, text: textOf(node).trim() });
          break;
        }
        case 'a': {
          const href = typeof node.properties.href === 'string' ? node.properties.href : '';
          if (/^https?:\/\//i.test(href)) node.properties.rel = ['noopener', 'noreferrer'];
          break;
        }
        case 'table': {
          const labelsByColumn: string[] = [];
          walk(node, (inner) => {
            if (inner.tagName === 'thead') {
              walk(inner, (cell) => {
                if (cell.tagName === 'th') labelsByColumn.push(textOf(cell).trim());
              });
            }
          });
          node.properties.role = 'table';
          walk(node, (inner) => {
            if (inner.tagName === 'thead' || inner.tagName === 'tbody') inner.properties.role = 'rowgroup';
            if (inner.tagName === 'tr') {
              inner.properties.role = 'row';
              let column = 0;
              inner.children.forEach((cell) => {
                if (cell.type !== 'element') return;
                if (cell.tagName === 'th') cell.properties.role = 'columnheader';
                if (cell.tagName === 'td') {
                  cell.properties.role = 'cell';
                  const label = labelsByColumn[column];
                  if (label) cell.properties.dataLabel = label;
                }
                column += 1;
              });
            }
          });
          tableNumber += 1;
          const tableLabel = tableTotal > 1 ? `${labels.table}, ${tableNumber} of ${tableTotal}` : labels.table;
          const wrap = el('div', { dataTableWrap: '', role: 'region', tabIndex: 0, ariaLabel: tableLabel }, [node]);
          parent.children[index] = wrap;
          break;
        }
      }
    });

    state.hasTitle = firstH1 !== undefined;

    // Under the title: the front-matter line, then the contents list.
    const underTitle: ElementContent[] = [];
    if (metaLine) underTitle.push(el('p', { dataDocMeta: '' }, [{ type: 'text', value: metaLine }]));
    if (toc.length > 1) {
      const list = el(
        'ul',
        {},
        toc.map((entry) => el('li', {}, [el('a', { href: `#${entry.id}` }, [{ type: 'text', value: entry.text }])])),
      );
      underTitle.push(el('details', { dataToc: '' }, [el('summary', {}, [{ type: 'text', value: labels.contents }]), list]));
    }
    if (underTitle.length) {
      // After the title; with no title in the body, before the first section (the page then shows the header title).
      if (firstH1) firstH1.parent.children.splice(firstH1.index + 1, 0, ...underTitle);
      else if (firstH2) firstH2.parent.children.splice(firstH2.index, 0, ...underTitle);
      else tree.children.unshift(...underTitle);
    }
  };

/** Default GitHub-style schema plus the few attributes `enhance` adds. Ids are not prefixed: only `rehype-slug` makes them. */
const schema: SanitizeOptions = {
  ...defaultSchema,
  clobber: [],
  attributes: {
    ...defaultSchema.attributes,
    '*': [...(defaultSchema.attributes?.['*'] ?? []), 'role', 'ariaLabel', 'tabIndex', 'dataLabel', 'dataTableWrap', 'dataToc', 'dataDocMeta'],
    a: [...(defaultSchema.attributes?.a ?? []), 'rel'],
  },
};

export async function renderMarkdown(markdown: string, labels: RenderLabels, meta?: RenderMeta): Promise<Rendered> {
  const toc: TocEntry[] = [];
  const state = { hasTitle: false };
  const stripped: string[] = [];
  const file = await unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkRehype) // raw HTML in the source is dropped here
    .use(rehypeSlug)
    .use(enhance, { labels, toc, state, metaLine: metaLine(labels, meta), stripped })
    .use(rehypeSanitize, schema)
    .use(rehypeStringify)
    .process(markdown);
  return { html: String(file), toc, hasTitle: state.hasTitle, stripped };
}
