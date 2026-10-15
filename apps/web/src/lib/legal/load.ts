/**
 * Owner: E1 (web platform). Reads the legal Markdown from docs/legal at build time, decides whether it may be
 * shown (publishable.ts) and renders it.
 *
 * The pages that call this are statically rendered: the Markdown is read once during `next build`
 * and the files are not needed at runtime (hence the turbopackIgnore comments: nothing under docs/ is traced into the server bundle). When deploying from the apps/web root directory, the
 * Vercel project must be allowed to read files outside it (docs/legal), or this fails the build, loudly.
 */
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { legalDocuments, type LegalSlug } from './documents';
import { splitFrontmatter } from './frontmatter';
import { legalCopy } from './legal-copy';
import { decidePublishable } from './publishable';
import { renderMarkdown, type TocEntry } from './render';

export interface LoadedLegalDocument {
  slug: LegalSlug;
  href: string;
  title: string;
  status: string | undefined;
  version: string | undefined;
  effectiveDate: string | undefined;
  lastUpdated: string | undefined;
  /** True only when counsel marked the document final and its body carries no draft marker (publishable.ts). */
  publishable: boolean;
  /** Why a document is held back, for the build log. Empty when it is publishable. */
  blockers: string[];
  /** The rendered document. Shown only when `publishable`; the holding page never reads it. */
  html: string;
  toc: TocEntry[];
  /** False when the body has no first-level heading, so the page shows `title` as the heading. */
  hasTitle: boolean;
}

const cache = new Map<LegalSlug, Promise<LoadedLegalDocument>>();

async function findLegalDir(): Promise<string> {
  const override = process.env.LEGAL_DOCS_DIR;
  if (override) return path.resolve(/*turbopackIgnore: true*/ override);
  // `next build` runs with the app (apps/web) or the repo root as the working directory.
  let dir = process.cwd();
  for (let i = 0; i < 4; i += 1) {
    const candidate = path.join(/*turbopackIgnore: true*/ dir, 'docs', 'legal');
    try {
      await fs.access(path.join(/*turbopackIgnore: true*/ candidate, 'privacy-policy.md'));
      return candidate;
    } catch {
      dir = path.dirname(dir);
    }
  }
  throw new Error(
    `Could not find docs/legal above ${process.cwd()}. Set LEGAL_DOCS_DIR to the folder that holds privacy-policy.md.`,
  );
}

async function load(slug: LegalSlug): Promise<LoadedLegalDocument> {
  const info = legalDocuments[slug];
  const source = await fs.readFile(path.join(/*turbopackIgnore: true*/ await findLegalDir(), info.file), 'utf8');
  const { data, body } = splitFrontmatter(source);
  const { publishable, blockers } = decidePublishable(data.status, body);
  const { html, toc, hasTitle } = await renderMarkdown(body, legalCopy.labels, { version: data.version, effectiveDate: data.effectiveDate });
  if (!publishable) {
    // For the build log, so a deploy says which documents show the holding page and why. Names the marks, never the text.
    console.warn(`[legal] ${info.href} is held back (${blockers.join('; ')}); its address shows the holding page.`);
  }
  return {
    slug,
    href: info.href,
    title: data.title ?? info.description,
    status: data.status,
    version: data.version,
    effectiveDate: data.effectiveDate,
    lastUpdated: data.lastUpdated,
    publishable,
    blockers,
    html,
    toc,
    hasTitle,
  };
}

export function loadLegalDocument(slug: LegalSlug): Promise<LoadedLegalDocument> {
  let pending = cache.get(slug);
  if (!pending) {
    pending = load(slug);
    cache.set(slug, pending);
  }
  return pending;
}
