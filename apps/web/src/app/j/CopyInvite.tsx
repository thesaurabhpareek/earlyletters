'use client';
/**
 * Owner: S20 (web). Copies the invite link on a tap. Nothing is sent anywhere: the clipboard is the only place the
 * link goes, and only when the person asks. When the fragment has no invite token (an in-app browser dropped it,
 * F11-U02), there is nothing worth copying, so the button is replaced by a line asking for the link again.
 *
 * The copy is exactly `<origin>/j#t=<token>`, the form the app writes, whatever else the address carries: a query a
 * chat app added (`?fbclid=...`) or other fragment parameters. The app's "I was invited" reads only that form
 * (apps/mobile src/lib/family/invite-link.logic.ts parseInviteInput).
 */
import { useEffect, useState } from 'react';
import styles from '../auth/confirm/confirm.module.css';

type Props = { label: string; copied: string; failed: string; missing: string };

/** The `t` fragment parameter when it is shaped like the app's invite tokens (32 to 128 url-safe characters). */
function inviteToken(hash: string): string | null {
  return /(?:^#|&)t=([A-Za-z0-9_-]{32,128})(?:&|$)/.exec(hash)?.[1] ?? null;
}

export function CopyInvite({ label, copied, failed, missing }: Props) {
  const [state, setState] = useState<'idle' | 'copied' | 'failed'>('idle');
  // Read after hydration: the server never sees the fragment, so the first render always shows the button.
  const [complete, setComplete] = useState(true);
  useEffect(() => setComplete(inviteToken(window.location.hash) !== null), []);

  async function copyLink() {
    const token = inviteToken(window.location.hash);
    if (!token) {
      setComplete(false);
      return;
    }
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/j#t=${token}`);
      setState('copied');
    } catch {
      setState('failed');
    }
  }

  if (!complete) {
    return (
      <p className={styles.body} role="status">
        {missing}
      </p>
    );
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
