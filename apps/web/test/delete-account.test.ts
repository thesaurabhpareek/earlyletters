/**
 * /delete-account (BL-2128, FR-MSG-34, D-042): the words, the route, the sitemap. Owner: E1 (web platform).
 *
 * The page's words are the counsel draft docs/legal/delete-account-page.md, unchanged. These cases prove it: every
 * `##` heading of the draft is a key of deleteAccountCopy and nothing else is, and each section's words equal the
 * draft's once {brand.name}, {brand.storeName} and {contact} are filled. Voice and claims rules are also checked by
 * copy-rules.test.ts, which reads src/lib/legal.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { brand } from '@scribe/brand';
import { describe, expect, it } from 'vitest';
import { deleteAccountCopy, deleteAccountMailto } from '../src/lib/legal/delete-account-copy';
import { legalCopy } from '../src/lib/legal/legal-copy';
import { legalSlugs } from '../src/lib/legal/pages';

const WEB = fileURLToPath(new URL('..', import.meta.url));
const DRAFT = readFileSync(join(WEB, '../../docs/legal/delete-account-page.md'), 'utf8');

/** The draft's sections by `##` heading, in order; the front matter, the `#` title and the changelog are not copy. */
function draftSections(md: string): Map<string, string[]> {
  const body = md.replace(/^---\n[\s\S]*?\n---\n/, '');
  const out = new Map<string, string[]>();
  let current: string[] | undefined;
  for (const line of body.split('\n')) {
    const heading = /^## (.+)$/.exec(line);
    if (heading) {
      current = heading[1] === 'Changelog' ? undefined : [];
      if (current) out.set(heading[1], current);
    } else if (current) current.push(line);
  }
  return out;
}

const fill = (text: string) =>
  text.replaceAll('{brand.name}', brand.name).replaceAll('{brand.storeName}', brand.storeName).replaceAll('{contact}', legalCopy.contact);

/** A section's text pieces, in reading order: `**field:**` labels, list markers and step bold are layout, not words. */
function draftPieces(lines: readonly string[]): string[] {
  return lines.flatMap((raw) => {
    const line = raw.trim();
    if (!line) return [];
    const field = /^\*\*\w+:\*\*\s*(.*)$/.exec(line);
    if (field) return field[1] ? [fill(field[1])] : [];
    const step = /^\d+\. \*\*(.+?)\*\* (.+)$/.exec(line);
    if (step) return [fill(step[1]), fill(step[2])];
    return [fill(line.replace(/^- /, ''))];
  });
}

/** Every string in a copy value, in key order. */
const pieces = (value: unknown): string[] =>
  typeof value === 'string' ? [value] : Array.isArray(value) ? value.flatMap(pieces) : value && typeof value === 'object' ? Object.values(value).flatMap(pieces) : [];

const sections = draftSections(DRAFT);
const allWords = pieces(deleteAccountCopy);

describe('/delete-account copy is the counsel draft, unchanged (BL-2128)', () => {
  it('reads the draft it is built from', () => {
    expect(DRAFT).toMatch(/^title: Delete account page copy/m);
    expect(sections.size).toBeGreaterThan(5);
  });

  it('has every heading of the draft as a key, in the draft order, and no other key', () => {
    expect(Object.keys(deleteAccountCopy)).toEqual([...sections.keys()]);
  });

  it.each([...sections.keys()])('section %s holds the draft words exactly', (key) => {
    expect(pieces(deleteAccountCopy[key as keyof typeof deleteAccountCopy])).toEqual(draftPieces(sections.get(key)!));
  });

  it('fills the three tokens from packages/brand and the legal pages, and leaves none unfilled', () => {
    expect(deleteAccountCopy.title).toContain(brand.name);
    expect(deleteAccountCopy.intro).toContain(brand.storeName);
    expect(deleteAccountCopy.email.items[0]).toContain(legalCopy.contact);
    expect(legalCopy.contact).toBe(brand.support.email);
    for (const text of allWords) expect(text, text).not.toMatch(/[{}[\]]|\*\*/);
  });

  it('has no banned character: dashes, curly quotes, ellipsis characters or emoji', () => {
    for (const text of allWords) {
      expect(text, text).not.toMatch(/[—–―‒‘’‚‛“”„‟…]/);
      expect(text, text).not.toMatch(/\p{Extended_Pictographic}/u);
      expect(text, text).toBe(text.normalize('NFC'));
    }
  });

  it('names no internal reference', () => {
    for (const text of allWords) expect(text, text).not.toMatch(/\bD-\d{2,3}\b|\bBL-\d+|\b[A-Z]+-REQ-\d+|counsel|\bTODO\b|\bdraft/i);
  });

  it('the button mails the contact address with the draft subject', () => {
    expect(deleteAccountMailto).toBe(`mailto:${brand.support.email}?subject=Delete%20my%20account`);
  });
});

describe('/delete-account route', () => {
  const read = (rel: string) => readFileSync(join(WEB, rel), 'utf8');
  /** Source without comments, so a comment that says "no analytics" is not read as code. */
  const code = (src: string) => src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');

  it('is a static route at the address packages/brand publishes', () => {
    expect(new URL(brand.web.deleteAccount).pathname).toBe('/delete-account');
    const page = read('src/app/(legal)/delete-account/page.tsx');
    expect(page).toContain("export const dynamic = 'error'");
    expect(page).toContain('deleteAccountMetadata');
  });

  it('says noindex and is absent from the sitemap', () => {
    // Read as source: the component and the sitemap import through the `@/` alias, which this test runner does not resolve.
    expect(code(read('src/components/site/DeleteAccountPage.tsx'))).toMatch(/robots: \{ index: false, follow: false \}/);
    // The sitemap lists the home page and legalSlugs only (e2e/http.e2e.ts checks the served file).
    expect(code(read('src/app/sitemap.ts'))).not.toMatch(/delete-account/);
    expect(legalSlugs as readonly string[]).not.toContain('delete-account');
  });

  it('loads no analytics and no client script of its own (FR-MSG-36)', () => {
    const component = code(read('src/components/site/DeleteAccountPage.tsx'));
    expect(component).not.toMatch(/['"]use client['"]/);
    expect(component).not.toMatch(/analytics|<script|next\/script/i);
    // The root layout and the legal frame mount no analytics either; this page inherits only those.
    for (const rel of ['src/app/layout.tsx', 'src/app/(legal)/layout.tsx', 'src/components/site/LegalFrame.tsx']) {
      expect(code(read(rel)), rel).not.toMatch(/WebAnalytics|@vercel\/analytics|next\/script/);
    }
  });
});
