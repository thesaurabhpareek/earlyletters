/**
 * Owner: E1 (web platform). /delete-account (BL-2128, D-042): how to delete an account in the app, and by email for a
 * person who cannot open it. Same frame and style as the legal pages. Words: lib/legal/delete-account-copy.ts.
 *
 * Static, noindex and not in the sitemap (CR-193 D-15 holds it off `main` until its text is read). No analytics and no
 * script from another origin (FR-MSG-36): the root layout mounts neither, and this page adds no client component.
 */
import type { Metadata } from 'next';
import Link from 'next/link';
import { Fragment } from 'react';
import { deleteAccountCopy as c, deleteAccountMailto } from '@/lib/legal/delete-account-copy';
import { legalCopy } from '@/lib/legal/legal-copy';
import { splitLinks } from '@/lib/legal/pages';
import type { InlineLink } from '@/lib/legal/types';
import styles from './Legal.module.css';

const links: readonly InlineLink[] = [
  { text: legalCopy.contact, href: `mailto:${legalCopy.contact}` },
  { text: 'Privacy Policy', href: c.other.href },
];

function Text({ text }: { text: string }) {
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

function List({ items }: { items: readonly string[] }) {
  return (
    <ul>
      {items.map((item) => (
        <li key={item}>
          <Text text={item} />
        </li>
      ))}
    </ul>
  );
}

export const deleteAccountMetadata: Metadata = {
  title: c.metaTitle,
  description: c.metaDescription,
  alternates: { canonical: '/delete-account' },
  robots: { index: false, follow: false },
};

export function DeleteAccountPage() {
  return (
    <article className={styles.prose} lang="en">
      <h1>{c.title}</h1>
      <p>
        <Text text={c.intro} />
      </p>

      <h2 id="in-app">{c.inApp.heading}</h2>
      <p>{c.inApp.lead}</p>
      <ol>
        {c.inApp.steps.map((step) => (
          <li key={step.lead}>
            <strong>{step.lead}</strong> {step.body}
          </li>
        ))}
      </ol>

      <h2 id="next">{c.next.heading}</h2>
      <List items={c.next.items} />

      <h2 id="removed">{c.removed.heading}</h2>
      <List items={c.removed.items} />

      <h2 id="kept">{c.kept.heading}</h2>
      <p>{c.kept.lead}</p>
      <List items={c.kept.items} />

      <h2 id="email">{c.email.heading}</h2>
      <List items={c.email.items} />
      <p>
        <a href={deleteAccountMailto}>{c.email.button}</a>
      </p>
      <p>
        <Text text={c.email.websiteList} />
      </p>

      <h2 id="other">{c.other.heading}</h2>
      <p>
        <Text text={c.other.body} />
      </p>
    </article>
  );
}
