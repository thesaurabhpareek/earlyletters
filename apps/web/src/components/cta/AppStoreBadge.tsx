'use client';
/**
 * The App Store action after launch. The official "Download on the App Store" artwork must come from
 * Apple's marketing tools (it cannot be fetched here); place it at public/brand/app-store-badge.svg.
 * Until then a plainly temporary text button stands in. Only shown when launch.mode is 'live'.
 */
import { site } from '@/content/site';
import { appStoreHref } from '@/lib/launch';
import { track } from '@/lib/analytics';
import type { CtaPlacement } from '@/lib/analytics';

export const BADGE_SRC = '/brand/app-store-badge.svg';
const HAS_BADGE = process.env.NEXT_PUBLIC_APP_STORE_BADGE === '1';

export function AppStoreBadge({ placement, height = 54 }: { placement: CtaPlacement; height?: number }) {
  const href = appStoreHref(placement);
  return (
    <a
      href={href}
      aria-label={site.cta.live.badgeLabel}
      onClick={() => track({ name: 'cta_click', mode: 'live', placement })}
      style={{ display: 'inline-flex', alignItems: 'center', height }}
    >
      {HAS_BADGE ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={BADGE_SRC} alt="" height={height} style={{ height, width: 'auto' }} />
      ) : (
        <span style={{ padding: '0 20px', height, display: 'inline-flex', alignItems: 'center', borderRadius: 12, background: '#000', color: '#fff', font: '600 16px/1 var(--font-sans)' }}>
          App Store
        </span>
      )}
    </a>
  );
}
