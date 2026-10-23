'use client';
/**
 * Owner: S20 (web). Copies the invite link on a tap. Nothing is sent anywhere: the clipboard is the only place the
 * link goes, and only when the person asks. When the fragment has no invite token (an in-app browser dropped it,
 * F11-U02), there is nothing worth copying, so the button is replaced by a line asking for the link again.
 *
 * The copy is exactly `<origin>/j#t=<token>`, the form the app writes, whatever else the address carries: a query a
 * chat app added (`?fbclid=...`) or other fragment parameters. The app's "I was invited" reads only that form
 * (apps/mobile src/lib/family/invite-link.logic.ts parseInviteInput).
 *
 * On load, a query in the address is dropped from the address bar (history.replaceState, no request), so the
 * fallback "copy the address of this page" (site.invite.copyFailed) also gives the app a link it can read.
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
  // Read after hydration: the server never sees the fragment. Until then this slot stays empty, so a link without
  // its invite never flashes the button and a good link never flashes the ask-again line.
  const [complete, setComplete] = useState<boolean | null>(null);
  useEffect(() => {
    const { pathname, search, hash } = window.location;
    // Keep the entry's history state (Next's router data), so Back and Forward still show this page.
    if (search) window.history.replaceState(window.history.state, '', `${pathname}${hash}`);
    setComplete(inviteToken(hash) !== null);
  }, []);

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

  if (complete === null) return null;

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
