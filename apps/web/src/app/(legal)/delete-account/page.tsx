/**
 * Owner: E1 (web platform). D-042: at v1.0 this is a static page plus an email route.
 * The words live in src/lib/legal/delete-account-copy.ts, with the questions counsel must confirm.
 */
import type { Metadata } from 'next';
import Link from 'next/link';
import styles from '@/components/site/Legal.module.css';
import { deleteAccountCopy as copy } from '@/lib/legal/delete-account-copy';

export const dynamic = 'error';

export const metadata: Metadata = {
  title: copy.metaTitle,
  description: copy.metaDescription,
  alternates: { canonical: '/delete-account' },
};

export default function DeleteAccountPage() {
  return (
    <article className={styles.prose} lang="en">
      <h1>{copy.title}</h1>
      <p className={styles.lead}>{copy.intro}</p>

      <h2>{copy.inApp.heading}</h2>
      <p>{copy.inApp.lead}</p>
      <ol className={styles.steps}>
        {copy.inApp.steps.map((step) => (
          <li key={step.title}>
            <strong>{step.title}</strong>
            <span>{step.body}</span>
          </li>
        ))}
      </ol>

      <h2>{copy.next.heading}</h2>
      <ul>
        {copy.next.items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>

      <h2>{copy.removed.heading}</h2>
      <ul>
        {copy.removed.items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>

      <h2>{copy.kept.heading}</h2>
      <p>{copy.kept.lead}</p>
      <ul>
        {copy.kept.items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>

      <h2>{copy.email.heading}</h2>
      {copy.email.body.map((paragraph) => (
        <p key={paragraph}>{paragraph}</p>
      ))}
      <p className={styles.buttonRow}>
        <a className={styles.button} href={copy.email.href}>
          {copy.email.button}
        </a>
      </p>

      <h2>{copy.other.heading}</h2>
      <p>
        {copy.other.body} <Link href={copy.other.href}>{copy.other.linkLabel}</Link>
        {copy.other.after}
      </p>
    </article>
  );
}
