'use client';
/**
 * The share row: six apps new parents already use, a copied link, and the phone's own share sheet when there is one.
 * It shares the plain site address and one line of words (site.comingSoon), nothing else: no tracking code, no
 * referral id. The address is built from the page's own origin, so a preview or another domain shares itself.
 *
 * Counting: each tap reports only which button and which page it sat on (`share_click`, a fixed list in
 * src/lib/analytics/events.ts). The link, the words and anything about the person are never sent.
 */
import { useEffect, useState } from 'react';
import { site } from '@/content/site';
import { track, type ShareChannel, type SharePlacement } from '@/lib/analytics';
import { tap } from '@/lib/haptics';
import { ShareIcons } from './shareIcons';
import styles from './ShareRow.module.css';

const c = site.comingSoon;

type AppChannel = { id: Exclude<ShareChannel, 'copy' | 'native'>; label: string; href: string; external: boolean };

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
  const [link, setLink] = useState<string | null>(null);
  const [canShare, setCanShare] = useState(false);
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    setLink(`${window.location.origin}/`);
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
    report('copy');
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/`);
      setCopied(true);
    } catch {
      // No clipboard access: nothing to do, and nothing was sent anywhere.
    }
  }

  async function more() {
    report('native');
    try {
      await navigator.share({ title: c.shareTitle, text: c.shareText, url: `${window.location.origin}/` });
    } catch {
      // The visitor closed the sheet, or the browser refused it: either way, nothing was sent anywhere.
    }
  }

  // Nothing to share until the page's own address is known (and nothing to tap with scripts off).
  if (!link) return null;
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
      <div className={styles.actions}>
        <button type="button" className={styles.pill} data-channel="copy" onClick={copy}>
          {ShareIcons.link}
          <span>{copied ? c.shareCopied : c.shareCopy}</span>
        </button>
        {canShare ? (
          <button type="button" className={styles.pill} data-channel="native" onClick={more}>
            {ShareIcons.more}
            <span>{c.shareMore}</span>
          </button>
        ) : null}
      </div>
      <p className="visually-hidden" role="status" aria-live="polite">
        {copied ? c.shareCopied : ''}
      </p>
    </section>
  );
}
