'use client';
/**
 * Owner: E3 (release). Loads Vercel Web Analytics, and only when NEXT_PUBLIC_ANALYTICS=vercel.
 * Mount once, inside <body> in src/app/layout.tsx (coordinator):
 *
 *   import { WebAnalytics } from '@/lib/analytics/WebAnalytics';
 *   ...
 *   <body>{children}<WebAnalytics /></body>
 *
 * With the variable unset it renders nothing and the Vercel package is never downloaded (it sits in a lazy
 * chunk that is only requested when this component actually mounts it). Skipped as well when the browser
 * sends Do Not Track or Global Privacy Control. Page URLs are scrubbed before sending (./scrub.ts).
 */
import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import { analyticsEnabled, privacySignalOn } from './index';
import { scrubEvent } from './scrub';

const Analytics = dynamic(() => import('@vercel/analytics/next').then((m) => m.Analytics), { ssr: false });

export function WebAnalytics() {
  const [on, setOn] = useState(false);
  useEffect(() => {
    setOn(analyticsEnabled && !privacySignalOn());
  }, []);
  return on ? <Analytics beforeSend={scrubEvent} /> : null;
}
