/** Owner: E1 (web platform). Shared frame for /privacy and /terms. */
import type { Viewport } from 'next';
import { brand } from '@scribe/brand';
import { LegalFrame } from '@/components/site/LegalFrame';

// The root layout sets a night theme colour for the film. These pages follow the phone's theme (Legal.module.css):
// paper in light, night in dark, so the browser bar matches the page in both.
export const viewport: Viewport = {
  colorScheme: 'light dark',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: brand.colors.paper },
    { media: '(prefers-color-scheme: dark)', color: brand.colors.paperDark },
  ],
};

export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return <LegalFrame>{children}</LegalFrame>;
}
