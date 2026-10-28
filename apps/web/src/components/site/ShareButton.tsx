'use client';
/**
 * Shares the plain site address, nothing else: no tracking code, no referral id, no count. Three one-tap routes
 * the people this is for already use (WhatsApp, Messages, Email), then the phone's own share sheet when there is
 * one, otherwise a copied link. The links are built from the page's own origin, so a preview or another domain
 * shares itself. Words from site.comingSoon.
 */
import { useEffect, useState } from 'react';
import { site } from '@/content/site';
import styles from './ShareButton.module.css';

const c = site.comingSoon;

export function ShareButton() {
  const [copied, setCopied] = useState(false);
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => setUrl(`${window.location.origin}/`), []);

  async function onClick() {
    const link = `${window.location.origin}/`;
    try {
      if (typeof navigator.share === 'function') {
        await navigator.share({ title: c.shareTitle, text: c.shareText, url: link });
        return;
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return; // the visitor closed the sheet
    }
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 3000);
    } catch {
      // No clipboard access: nothing to do, and nothing was sent anywhere.
    }
  }

  const message = url ? `${c.shareText} ${url}` : '';
  const channels = url
    ? [
        { label: c.shareWhatsapp, href: `https://wa.me/?text=${encodeURIComponent(message)}`, external: true },
        { label: c.shareMessages, href: `sms:?&body=${encodeURIComponent(message)}`, external: false },
        { label: c.shareEmail, href: `mailto:?subject=${encodeURIComponent(c.shareTitle)}&body=${encodeURIComponent(message)}`, external: false },
      ]
    : [];

  return (
    <div className={styles.wrap}>
      <p className={styles.heading}>{c.shareHeading}</p>
      <ul className={styles.channels} aria-label={c.shareButton}>
        {channels.map((ch) => (
          <li key={ch.label}>
            <a className={styles.channel} href={ch.href} {...(ch.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>
              {ch.label}
            </a>
          </li>
        ))}
      </ul>
      <button type="button" className={styles.button} onClick={onClick}>
        {c.shareButton}
      </button>
      <p className={styles.status} role="status" aria-live="polite">
        {copied ? c.shareCopied : ''}
      </p>
    </div>
  );
}
