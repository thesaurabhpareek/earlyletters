'use client';
/**
 * The desktop QR (W2). Owner: E3 (release). Shown only in launch mode, only on a device with a fine pointer and
 * hover (a laptop or desktop), where it replaces the badge: one download action at a time, one badge per layout.
 * The code is a static SVG path committed in src/lib/qr/qr.generated.ts (made at author time by `npm run qr:generate`,
 * reviewed in the launch PR). Nothing is generated at build time or in the browser, and no service is called. It does not
 * animate, scale on press or fade by itself (Apple's marketing rules for the badge are kept for the QR too). The text
 * link beside it goes to the same place, for anyone who cannot scan.
 */
import type { ReactNode } from 'react';
import { site } from '@/content/site';
import { appStoreHref, launch } from '@/lib/launch';
import { track } from '@/lib/analytics';
import { storeQrMatches } from '@/lib/qr/build';
import { STORE_QR } from '@/lib/qr/qr.generated';
import styles from './StoreQr.module.css';

// Drawn only if the committed QR opens exactly this deployment's QR link. Fail closed: a stale or foreign file draws
// nothing and the badge stays.
const QR_HREF = appStoreHref('qr');

/** True when this build carries a QR. The wrapper uses it to decide whether the badge steps aside on desktop. */
export const HAS_STORE_QR = launch.mode === 'live' && storeQrMatches(STORE_QR, QR_HREF);

// The paper tile: dark modules on a light ground in every theme, so it scans from a dark page too.
const INK = '#2b2722';
const PAPER = '#fbf8f3';

export function StoreQr() {
  if (!HAS_STORE_QR) return null;
  const label = site.cta.live.qrAlt;
  return (
    <div className={styles.qr} data-store-qr>
      <svg
        className={styles.tile}
        viewBox={`0 0 ${STORE_QR.dim} ${STORE_QR.dim}`}
        role="img"
        aria-label={label}
        shapeRendering="crispEdges"
        xmlns="http://www.w3.org/2000/svg"
      >
        <title>{label}</title>
        <rect width={STORE_QR.dim} height={STORE_QR.dim} fill={PAPER} />
        <path d={STORE_QR.path} fill={INK} />
      </svg>
      <div className={styles.words}>
        <p className={styles.hint}>{site.cta.live.qrHint}</p>
        <a className={styles.link} href={QR_HREF} onClick={() => track({ name: 'cta_click', mode: 'live', placement: 'qr' })}>
          {site.cta.live.qrLink}
        </a>
      </div>
    </div>
  );
}

/**
 * The launch action in the end card: the badge on touch devices, the QR with its text link on a laptop.
 * Both are plain markup; a CSS media query picks one, so there is no script, no flash and no layout shift.
 */
export function LaunchAction({ badge }: { badge: ReactNode }) {
  return (
    <div className={styles.launch} data-qr={HAS_STORE_QR || undefined}>
      <div className={styles.badge} data-launch-badge>
        {badge}
      </div>
      <StoreQr />
    </div>
  );
}
