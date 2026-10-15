'use client';
/**
 * "Share with a fellow parent": a quiet text control. It shares the plain site address, nothing else: no
 * tracking code, no referral id, no count, no event, and the page never learns whether anything was shared.
 * It uses the phone's share sheet when there is one, otherwise copies the link; when neither is allowed it shows
 * the address in a field, selected, so the person can copy it by hand. Words from site.comingSoon.
 *
 * It needs script, so it stays hidden until the page has loaded (a dead button is worse than none).
 */
import { useEffect, useRef, useState } from 'react';
import { site } from '@/content/site';
import styles from './ShareButton.module.css';

const c = site.comingSoon;
type Status = 'idle' | 'copied' | 'manual';

export function ShareButton({ spaceAbove = 20 }: { spaceAbove?: number }) {
  const [ready, setReady] = useState(false);
  const [status, setStatus] = useState<Status>('idle');
  const [url, setUrl] = useState('');
  const field = useRef<HTMLInputElement>(null);
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => {
    setReady(true);
    return () => window.clearTimeout(timer.current);
  }, []);

  // When the address is offered by hand, select it so one copy gesture is enough.
  useEffect(() => {
    if (status === 'manual') {
      field.current?.focus();
      field.current?.select();
    }
  }, [status]);

  async function onClick() {
    const shareUrl = `${window.location.origin}/`;
    try {
      if (typeof navigator.share === 'function') {
        await navigator.share({ title: c.shareTitle, text: c.shareText, url: shareUrl });
        return;
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return; // the visitor closed the sheet: not an error
    }
    try {
      await navigator.clipboard.writeText(shareUrl);
      setStatus('copied');
      window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => setStatus('idle'), 3000);
    } catch {
      setUrl(shareUrl);
      setStatus('manual');
    }
  }

  return (
    <div className={styles.wrap} style={{ marginTop: spaceAbove }} hidden={!ready}>
      <button type="button" className={styles.button} onClick={onClick}>
        <svg viewBox="0 0 256 256" fill="currentColor" aria-hidden="true" focusable="false">
          <path d="M216,112v96a16,16,0,0,1-16,16H56a16,16,0,0,1-16-16V112A16,16,0,0,1,56,96H80a8,8,0,0,1,0,16H56v96H200V112H176a8,8,0,0,1,0-16h24A16,16,0,0,1,216,112ZM93.66,69.66,120,43.31V136a8,8,0,0,0,16,0V43.31l26.34,26.35a8,8,0,0,0,11.32-11.32l-40-40a8,8,0,0,0-11.32,0l-40,40A8,8,0,0,0,93.66,69.66Z" />
        </svg>
        {c.shareButton}
      </button>
      <p className={styles.status} role="status" aria-live="polite">
        {status === 'copied' ? c.shareCopied : status === 'manual' ? c.shareManual : ''}
      </p>
      {status === 'manual' ? <input ref={field} className={styles.manual} readOnly value={url} aria-label={c.shareFieldLabel} onFocus={(e) => e.currentTarget.select()} /> : null}
    </div>
  );
}
