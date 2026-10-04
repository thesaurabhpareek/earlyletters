/**
 * Owner: E2 (back-end). The page behind an email's unsubscribe link. It asks first (a link scanner that fetches
 * the page unsubscribes nobody), then the form posts to /api/unsubscribe, which answers with a redirect back here.
 * The words are `site.unsubscribe`. Never indexed.
 */
import type { Metadata } from 'next';
import Link from 'next/link';
import styles from '@/components/site/Unsubscribe.module.css';
import { site } from '@/content/site';
import { readUnsubscribeToken } from '@/lib/notify/unsubscribe';

export const metadata: Metadata = {
  title: site.unsubscribe.title,
  robots: { index: false, follow: false },
};

type Search = { t?: string; done?: string; invalid?: string; error?: string };

export default async function UnsubscribePage({ searchParams }: { searchParams: Promise<Search> }) {
  const q = await searchParams;
  const copy = site.unsubscribe;
  const token = typeof q.t === 'string' ? q.t : '';
  const genuine = Boolean(readUnsubscribeToken(token, process.env.UNSUBSCRIBE_SECRET));

  let title: string = copy.invalidTitle;
  let body: string = copy.invalidBody;
  let showForm = false;
  if (q.done) {
    title = copy.doneTitle;
    body = copy.doneBody;
  } else if (genuine) {
    title = copy.title;
    body = q.error ? copy.error : copy.body;
    showForm = true;
  }

  return (
    <main className={styles.page}>
      <h1 className={styles.line}>{title}</h1>
      <p className={styles.body} role={q.error ? 'alert' : undefined}>
        {body}
      </p>
      {showForm && (
        <form method="post" action="/api/unsubscribe" className={styles.form}>
          <input type="hidden" name="t" value={token} />
          <button type="submit" className={styles.button}>
            {copy.button}
          </button>
        </form>
      )}
      <Link className={styles.home} href="/">
        {copy.home}
      </Link>
    </main>
  );
}
