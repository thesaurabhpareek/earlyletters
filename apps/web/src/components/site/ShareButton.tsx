'use client';
/**
 * Shares the plain site address, nothing else: no tracking code, no referral id, no count. Uses the phone's
 * share sheet when there is one, otherwise copies the link. Words from site.comingSoon.
 */
import { useState } from 'react';
import { site } from '@/content/site';
import styles from './ShareButton.module.css';

const c = site.comingSoon;

export function ShareButton() {
  const [copied, setCopied] = useState(false);

  async function onClick() {
    const url = `${window.location.origin}/`;
    try {
      if (typeof navigator.share === 'function') {
        await navigator.share({ title: c.shareTitle, text: c.shareText, url });
        return;
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return; // the visitor closed the sheet
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 3000);
    } catch {
      // No clipboard access: nothing to do, and nothing was sent anywhere.
    }
  }

  return (
    <div className={styles.wrap}>
      <button type="button" className={styles.button} onClick={onClick}>
        {c.shareButton}
      </button>
      <p className={styles.status} role="status" aria-live="polite">
        {copied ? c.shareCopied : ''}
      </p>
    </div>
  );
}
