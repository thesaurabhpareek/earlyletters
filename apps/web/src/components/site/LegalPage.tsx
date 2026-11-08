/** Owner: E1 (web platform). One legal page: title, "Last updated", a short intro and plain sections. Words: lib/legal/*-copy.ts. */
import type { Metadata } from 'next';
import Link from 'next/link';
import { Fragment } from 'react';
import { legalCopy } from '@/lib/legal/legal-copy';
import { formatDate, legalPage, splitLinks, type LegalSlug } from '@/lib/legal/pages';
import type { InlineLink, LegalBlock } from '@/lib/legal/types';
import styles from './Legal.module.css';

function Inline({ text, links }: { text: string; links: readonly InlineLink[] }) {
  return splitLinks(text, links).map((part, i) =>
    typeof part === 'string' ? (
      <Fragment key={i}>{part}</Fragment>
    ) : part.href.startsWith('mailto:') ? (
      <a key={i} href={part.href}>
        {part.text}
      </a>
    ) : (
      <Link key={i} href={part.href}>
        {part.text}
      </Link>
    ),
  );
}

function Block({ block, links }: { block: LegalBlock; links: readonly InlineLink[] }) {
  if (typeof block === 'string') {
    return (
      <p>
        <Inline text={block} links={links} />
      </p>
    );
  }
  return (
    <ul>
      {block.list.map((item) => (
        <li key={item}>
          <Inline text={item} links={links} />
        </li>
      ))}
    </ul>
  );
}

export function LegalPage({ slug }: { slug: LegalSlug }) {
  const page = legalPage(slug);
  return (
    <article className={styles.prose} lang="en">
      <h1>{page.title}</h1>
      <p className={styles.updated}>
        {legalCopy.lastUpdated} <time dateTime={page.lastUpdated}>{formatDate(page.lastUpdated)}</time>
      </p>
      {page.intro.map((block, i) => (
        <Block key={`intro-${i}`} block={block} links={page.links} />
      ))}
      {page.sections.map((section) => (
        <Fragment key={section.id}>
          <h2 id={section.id}>{section.heading}</h2>
          {section.blocks.map((block, i) => (
            <Block key={i} block={block} links={page.links} />
          ))}
        </Fragment>
      ))}
    </article>
  );
}

export function legalMetadata(slug: LegalSlug): Metadata {
  const page = legalPage(slug);
  return {
    title: page.metaTitle,
    description: page.metaDescription,
    alternates: { canonical: page.href },
  };
}
