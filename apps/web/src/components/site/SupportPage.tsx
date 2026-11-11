/** Owner: content with E1 (web platform). /support: plain sections in the same frame and style as the legal pages. Words: lib/support/copy.ts. */
import type { Metadata } from 'next';
import { Fragment } from 'react';
import { brand } from '@scribe/brand';
import { splitLinks } from '@/lib/legal/pages';
import type { InlineLink } from '@/lib/legal/types';
import { supportCopy } from '@/lib/support/copy';
import styles from './Legal.module.css';

const links: readonly InlineLink[] = [{ text: brand.support.email, href: brand.support.mailto }];

function Text({ text }: { text: string }) {
  return splitLinks(text, links).map((part, i) =>
    typeof part === 'string' ? <Fragment key={i}>{part}</Fragment> : <a key={i} href={part.href}>{part.text}</a>,
  );
}

export const supportMetadata: Metadata = {
  title: supportCopy.metaTitle,
  description: supportCopy.metaDescription,
  alternates: { canonical: '/support' },
};

export function SupportPage() {
  return (
    <article className={styles.prose} lang="en">
      <h1>{supportCopy.title}</h1>
      {supportCopy.intro.map((p) => (
        <p key={p}>
          <Text text={p} />
        </p>
      ))}
      {supportCopy.sections.map((s) => (
        <Fragment key={s.id}>
          <h2 id={s.id}>{s.heading}</h2>
          {s.blocks.map((b) => (
            <p key={b}>
              <Text text={b} />
            </p>
          ))}
        </Fragment>
      ))}
    </article>
  );
}
