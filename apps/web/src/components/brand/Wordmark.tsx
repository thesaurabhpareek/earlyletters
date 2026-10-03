/** Owner: BR2 (web identity). Type-only wordmark until a drawn lockup exists. */
import { site } from '@/content/site';

export function Wordmark({ className }: { className?: string }) {
  return (
    <span className={className} style={{ fontFamily: 'var(--font-serif)', fontWeight: 500, letterSpacing: '-0.01em' }}>
      {site.brand.name}
    </span>
  );
}
