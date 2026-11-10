/**
 * Owner: E1 (web platform). The legal texts the site publishes: versioned markdown files under content/legal/<doc>/<version>.md.
 *
 * The files are the texts themselves, copied byte for byte from docs/legal/beta (BL-565). They are never edited: a change
 * is a new version at a new path (docs/legal/POLICY_VERSIONING.md). The site serves the raw bytes at /legal/<doc>/<version>.md
 * and renders the body (frontmatter removed) at /legal/<doc>/<version>. The floating /terms and /privacy are the website's
 * own short pages (terms-copy.ts, privacy-copy.ts) and do not read these files (founder decision, 8 Nov 2026: versioned only).
 * The sha256 of the raw bytes is what `policy_versions.content_sha256` records, so nothing here may change a byte.
 */
import { readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import rehypeSanitize from 'rehype-sanitize';
import rehypeSlug from 'rehype-slug';
import rehypeStringify from 'rehype-stringify';
import remarkGfm from 'remark-gfm';
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';
import { unified } from 'unified';
import { parse as parseYaml } from 'yaml';
import type { Element, Root } from 'hast';
import { siteOrigin } from './origin';

export const legalDocs = ['terms', 'privacy'] as const;
export type LegalDoc = (typeof legalDocs)[number];

export interface LegalFrontmatter {
  title: string;
  document: LegalDoc;
  version: string;
  status: string;
  review: string;
  source: string;
  url: string;
}

export interface LegalSource {
  doc: LegalDoc;
  version: string;
  /** The file exactly as it is on disk: what is served at the .md address and what the hash covers. */
  raw: Buffer;
  meta: LegalFrontmatter;
  /** The markdown after the frontmatter. */
  body: string;
}

/**
 * `content/legal` under the web app, whether the process starts in apps/web (next, vitest) or at the repo root.
 * No environment variable names it (BL-778): the pins on these bytes run in CI, not in the hosting build, so a variable
 * set only in the hosting project could point the site at another folder without any test seeing it. The build command,
 * node options and root directory are not covered by this: the check after a deploy (the sha256 of the two raw files,
 * CR-60) is the gate for those.
 */
function contentDir(): string {
  const here = join(process.cwd(), 'content', 'legal');
  return existsDir(here) ? here : join(process.cwd(), 'apps', 'web', 'content', 'legal');
}

function existsDir(path: string): boolean {
  try {
    return statSync(path).isDirectory();
  } catch {
    return false;
  }
}

export function isLegalDoc(value: string): value is LegalDoc {
  return (legalDocs as readonly string[]).includes(value);
}

/** Splits a text into its frontmatter and body. The file must start with a `---` line and close it with another. */
export function splitFrontmatter(text: string): { front: string; body: string } {
  const match = /^---\n([\s\S]*?)\n---\n/.exec(text);
  if (!match) throw new Error('A legal text must start with a frontmatter block.');
  return { front: match[1], body: text.slice(match[0].length).replace(/^\n+/, '') };
}

export function readLegalSource(doc: LegalDoc, version: string): LegalSource {
  if (!/^\d+\.\d+\.\d+$/.test(version)) throw new Error(`Not a version: ${version}`);
  const raw = readFileSync(join(contentDir(), doc, `${version}.md`));
  const { front, body } = splitFrontmatter(raw.toString('utf8'));
  const meta = parseYaml(front) as LegalFrontmatter;
  if (meta.document !== doc || String(meta.version) !== version) throw new Error(`${doc}/${version}.md says it is ${meta.document} ${meta.version}.`);
  return { doc, version, raw, meta: { ...meta, version }, body };
}

/**
 * A link to our own address (the Terms point at the Privacy Policy's permanent URL) goes to the same page on whichever
 * origin is serving, so a preview or a local build stays on itself. The visible text, the full address, is unchanged.
 */
function rehypeOwnLinks() {
  return (tree: Root) => {
    const visit = (node: Root | Element) => {
      for (const child of node.children) {
        if (child.type !== 'element') continue;
        const href = child.properties?.href;
        if (child.tagName === 'a' && typeof href === 'string' && href.startsWith(`${siteOrigin}/`)) child.properties.href = href.slice(siteOrigin.length);
        visit(child);
      }
    };
    visit(tree);
  };
}

/**
 * The body as HTML. Sanitized, though the text is ours: raw HTML in markdown is dropped, links keep to http, https and
 * mailto. Addresses and web links in the text become links (GFM autolinks); tables are real tables.
 */
export function renderLegalHtml(body: string): string {
  return String(
    unified()
      .use(remarkParse)
      .use(remarkGfm)
      .use(remarkRehype)
      .use(rehypeSanitize)
      .use(rehypeOwnLinks)
      .use(rehypeSlug)
      .use(rehypeStringify)
      .processSync(body),
  );
}
