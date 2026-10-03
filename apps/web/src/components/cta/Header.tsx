'use client';
/** Owner: SC6. Persistent header: wordmark left, the one action right (CtaBar). Stub. */
import { Wordmark } from '@/components/brand/Wordmark';

export function Header() {
  return (
    <header style={{ position: 'fixed', inset: '0 0 auto 0', zIndex: 50, display: 'flex', justifyContent: 'space-between', padding: '16px var(--gutter)', color: 'var(--night-ink)', mixBlendMode: 'difference' }}>
      <Wordmark />
    </header>
  );
}
