/** Owner: E1 (web platform). Shared frame for /privacy, /terms, /health-privacy, /subprocessors and /delete-account. */
import type { Viewport } from 'next';
import { brand } from '@scribe/brand';
import { LegalFrame } from '@/components/site/LegalFrame';

// The root layout sets a night theme colour for the film. These pages are paper.
export const viewport: Viewport = { themeColor: brand.colors.paper };

export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return <LegalFrame>{children}</LegalFrame>;
}
