'use client';
/**
 * Owner: S20 (web). Copies this page's own address (the invite link) on a tap. Nothing is sent anywhere: the
 * clipboard is the only place the link goes, and only when the person asks.
 */
import { useState } from 'react';
import styles from '../auth/confirm/confirm.module.css';

type Props = { label: string; copied: string; failed: string };

export function CopyInvite({ label, copied, failed }: Props) {
  const [state, setState] = useState<'idle' | 'copied' | 'failed'>('idle');

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setState('copied');
    } catch {
      setState('failed');
    }
  }

  return (
    <>
      <button type="button" className={styles.open} onClick={copyLink}>
        {label}
      </button>
      <p className={styles.small} role="status" aria-live="polite">
        {state === 'copied' ? copied : state === 'failed' ? failed : ''}
      </p>
    </>
  );
}
