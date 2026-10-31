'use client';
/**
 * The share row: six apps new parents already use, a copied link, and the phone's own share sheet when there is one.
 * It shares the plain site address and one line of words (site.comingSoon), nothing else: no tracking code, no
 * referral id. The address is the public one (NEXT_PUBLIC_SITE_URL, else https://earlyletters.com), never the
 * page's own origin, so the www host or a preview address is never what gets shared.
 *
 * The six app links are plain links rendered on the server, so they work with scripts off (the two signup pages
 * are where a no-script form post lands). Copy link and More need scripts, so they appear only after load.
 *
 * Counting: each tap reports only which button and which page it sat on (`share_click`, a fixed list in
 * src/lib/analytics/events.ts). The link, the words and anything about the person are never sent.
 */
import { useEffect, useState } from 'react';
import { site } from '@/content/site';
import { track, type ShareChannel, type SharePlacement } from '@/lib/analytics';
import { tap } from '@/lib/haptics';
import { FALLBACK_SITE_URL } from '@/lib/site-url';
import { ShareIcons } from './shareIcons';
import styles from './ShareRow.module.css';

const c = site.comingSoon;

type AppChannel = { id: Exclude<ShareChannel, 'copy' | 'native'>; label: string; href: string; external: boolean };

/** The public address to share: the site root, from NEXT_PUBLIC_SITE_URL when set, else the production domain. */
export function shareLink(explicit: string | undefined = process.env.NEXT_PUBLIC_SITE_URL): string {
  try {
    if (explicit?.trim()) return `${new URL(explicit.trim()).origin}/`;
  } catch {
    // A malformed value falls back to the production domain rather than breaking the row.
  }
  return `${new URL(FALLBACK_SITE_URL).origin}/`;
}

/** The exact address each app is sent to. `link` is the plain site address. */
export function shareChannels(link: string): AppChannel[] {
  const message = `${c.shareText} ${link}`;
  const q = encodeURIComponent;
  return [
    { id: 'whatsapp', label: c.shareWhatsapp, href: `https://wa.me/?text=${q(message)}`, external: true },
    { id: 'messages', label: c.shareMessages, href: `sms:?&body=${q(message)}`, external: false },
    { id: 'email', label: c.shareEmail, href: `mailto:?subject=${q(c.shareTitle)}&body=${q(message)}`, external: false },
    { id: 'facebook', label: c.shareFacebook, href: `https://www.facebook.com/sharer/sharer.php?u=${q(link)}`, external: true },
    { id: 'telegram', label: c.shareTelegram, href: `https://t.me/share/url?url=${q(link)}&text=${q(c.shareText)}`, external: true },
    { id: 'x', label: c.shareX, href: `https://x.com/intent/post?text=${q(c.shareText)}&url=${q(link)}`, external: true },
  ];
}

export function ShareRow({ placement }: { placement: SharePlacement }) {
  const link = shareLink();
  const [mounted, setMounted] = useState(false);
  const [canShare, setCanShare] = useState(false);
  const [copied, setCopied] = useState(false);
  const [copyFailed, setCopyFailed] = useState(false);
  useEffect(() => {
    setMounted(true);
    setCanShare(typeof navigator.share === 'function');
  }, []);
  useEffect(() => {
    if (!copied) return;
    const t = window.setTimeout(() => setCopied(false), 3000);
    return () => window.clearTimeout(t);
  }, [copied]);

  function report(channel: ShareChannel) {
    tap('light');
    track({ name: 'share_click', channel, placement });
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(link);
      setCopyFailed(false);
      setCopied(true);
      report('copy');
    } catch {
      // No clipboard access: show the address so it can be copied by hand. Nothing was sent anywhere.
      setCopyFailed(true);
    }
  }

  async function more() {
    report('native');
    try {
      await navigator.share({ title: c.shareTitle, text: c.shareText, url: link });
    } catch {
      // The visitor closed the sheet, or the browser refused it: either way, nothing was sent anywhere.
    }
  }

  const channels = shareChannels(link);
  return (
    <section className={styles.wrap} aria-labelledby={`share-heading-${placement}`} data-testid="share-row">
      <p id={`share-heading-${placement}`} className={styles.heading}>
        {c.shareHeading}
      </p>
      <ul className={styles.channels}>
        {channels.map((ch) => (
          <li key={ch.id} className={styles.item}>
            <a
              className={styles.channel}
              href={ch.href}
              aria-label={`${c.shareVia} ${ch.label}`}
              title={ch.label}
              data-channel={ch.id}
              onClick={() => report(ch.id)}
              {...(ch.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
            >
              {ShareIcons[ch.id]}
            </a>
          </li>
        ))}
      </ul>
      {mounted ? (
        <div className={styles.actions}>
          <button type="button" className={styles.pill} data-channel="copy" onClick={copy}>
            {ShareIcons.link}
            {/* The visible label changes; the status line below is what a screen reader hears, once. */}
            <span aria-hidden="true">{copied ? c.shareCopied : c.shareCopy}</span>
            <span className="visually-hidden">{c.shareCopy}</span>
          </button>
          {canShare ? (
            <button type="button" className={styles.pill} data-channel="native" onClick={more}>
              {ShareIcons.more}
              <span>{c.shareMore}</span>
            </button>
          ) : null}
        </div>
      ) : null}
      {copyFailed ? (
        <p className={styles.heading} data-testid="share-copy-failed">
          {c.shareCopyFailed} <span className={styles.address}>{link}</span>
        </p>
      ) : null}
      <p className="visually-hidden" role="status" aria-live="polite">
        {copied ? c.shareCopied : copyFailed ? c.shareCopyFailed : ''}
      </p>
    </section>
  );
}
