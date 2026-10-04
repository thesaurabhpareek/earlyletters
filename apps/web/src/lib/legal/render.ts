/**
 * Owner: E1 (web platform). Pure Markdown to safe HTML for the legal pages. No file access here,
 * so it can be tested without the repo's docs.
 *
 * Rules this module keeps:
 * - It never changes the words of a document. It adds navigation only: heading ids, a collapsed
 *   contents list under the title, table labels for small screens, and rel on outside links.
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
import { parse as parseYaml } from 'yaml';

export interface RenderLabels {
  /** Summary text of the collapsed contents list. */
  contents: string;
  /** Accessible name of the sideways-scrolling table wrapper. */
  table: string;
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
}

export interface Frontmatter {
  title?: string;
  status?: string;
  version?: string;
  lastUpdated?: string;
  effectiveDate?: string;
}

/** Statuses that mean counsel has signed off. Anything else, or no status, shows the "being finalised" note. */
const FINAL_STATUSES = new Set(['published', 'final', 'approved', 'counsel-approved']);

export function isFinalStatus(status: string | undefined): boolean {
  return status !== undefined && FINAL_STATUSES.has(status.trim().toLowerCase());
}

export function splitFrontmatter(source: string): { data: Frontmatter; body: string } {
  const text = source.replace(/^﻿/, '');
  const match = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/.exec(text);
  if (!match) return { data: {}, body: text };
  const raw = parseYaml(match[1]) as Record<string, unknown> | null;
  const str = (v: unknown) => (v === undefined || v === null ? undefined : String(v));
  return {
    data: {
      title: str(raw?.title),
      status: str(raw?.status),
      version: str(raw?.version),
      lastUpdated: str(raw?.last_updated),
      effectiveDate: str(raw?.effective_date),
    },
    body: text.slice(match[0].length),
  };
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
  // Iterate over a copy: visitors may replace the node they are given.
  parent.children.slice().forEach((child) => {
    if (child.type !== 'element') return;
    visit(child, parent, parent.children.indexOf(child));
    walk(child, visit);
  });
}

/** Adds navigation and small-screen labels. Runs before sanitising, which is the last step. */
const enhance: Plugin<[RenderLabels, TocEntry[], { hasTitle: boolean }], Root> = (labels, toc, state) => (tree) => {
  let firstH1: { parent: Parent; index: number } | undefined;
  let firstH2: { parent: Parent; index: number } | undefined;

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

  if (toc.length > 1) {
    const list = el(
      'ul',
      {},
      toc.map((entry) =>
        el('li', {}, [el('a', { href: `#${entry.id}` }, [{ type: 'text', value: entry.text }])]),
      ),
    );
    const details = el('details', { dataToc: '' }, [
      el('summary', {}, [{ type: 'text', value: labels.contents }]),
      list,
    ]);
    // After the title; with no title in the body, before the first section (the page then shows the header title).
    if (firstH1) firstH1.parent.children.splice(firstH1.index + 1, 0, details);
    else if (firstH2) firstH2.parent.children.splice(firstH2.index, 0, details);
  }
};

/** Default GitHub-style schema plus the few attributes `enhance` adds. Ids are not prefixed: only `rehype-slug` makes them. */
const schema: SanitizeOptions = {
  ...defaultSchema,
  clobber: [],
  attributes: {
    ...defaultSchema.attributes,
    '*': [...(defaultSchema.attributes?.['*'] ?? []), 'role', 'ariaLabel', 'tabIndex', 'dataLabel', 'dataTableWrap', 'dataToc'],
    a: [...(defaultSchema.attributes?.a ?? []), 'rel'],
  },
};

export async function renderMarkdown(markdown: string, labels: RenderLabels): Promise<Rendered> {
  const toc: TocEntry[] = [];
  const state = { hasTitle: false };
  const file = await unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkRehype) // raw HTML in the source is dropped here
    .use(rehypeSlug)
    .use(enhance, labels, toc, state)
    .use(rehypeSanitize, schema)
    .use(rehypeStringify)
    .process(markdown);
  return { html: String(file), toc, hasTitle: state.hasTitle };
}
