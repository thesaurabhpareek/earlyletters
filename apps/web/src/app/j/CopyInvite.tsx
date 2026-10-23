'use client';
/**
 * Owner: S20 (web). Copies this page's own address (the invite link, token in the fragment) on a tap. Nothing is
 * sent anywhere: the clipboard is the only place the link goes, and only when the person asks. When the address
 * has no `t` in its fragment (an in-app browser dropped it, F11-U02), there is nothing worth copying, so the button
 * is replaced by a line asking for the link again.
 *
 * The copy leaves out any query string. Some chat apps add one on the way (`?fbclid=...`), and the app's
 * "I was invited" reads only `/j#t=<token>` with nothing between the path and the fragment
 * (apps/mobile src/lib/family/invite-link.logic.ts parseInviteInput).
 */
import { useEffect, useState } from 'react';
import styles from '../auth/confirm/confirm.module.css';

type Props = { label: string; copied: string; failed: string; missing: string };

/** True when the fragment carries a `t` parameter (the app checks the token itself). */
function hasInvite(hash: string): boolean {
  return /(?:^#|&)t=[^&]+/.test(hash);
}

/** The invite link as the app writes it: this page's address with its fragment, without any query. */
function inviteLinkFrom(loc: Pick<Location, 'origin' | 'pathname' | 'hash'>): string {
  return `${loc.origin}${loc.pathname}${loc.hash}`;
}

export function CopyInvite({ label, copied, failed, missing }: Props) {
  const [state, setState] = useState<'idle' | 'copied' | 'failed'>('idle');
  // Read after hydration: the server never sees the fragment, so the first render always shows the button.
  const [complete, setComplete] = useState(true);
  useEffect(() => setComplete(hasInvite(window.location.hash)), []);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(inviteLinkFrom(window.location));
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
