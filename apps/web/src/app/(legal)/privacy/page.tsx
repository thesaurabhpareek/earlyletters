import type { Metadata } from 'next';
import { LegalPage, legalMetadata } from '@/components/site/LegalPage';

// Built once at `next build`. If anything here turned dynamic, the build would fail.
export const dynamic = 'error';

export const metadata: Metadata = legalMetadata('privacy');

export default function Page() {
  return <LegalPage slug="privacy" />;
}
