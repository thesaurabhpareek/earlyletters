import { LegalDocument, legalMetadata } from '@/components/site/LegalDocument';

// Built once at `next build`. If anything here turned dynamic, the build would fail.
export const dynamic = 'error';

export const generateMetadata = () => legalMetadata('privacy');

export default function Page() {
  return <LegalDocument slug="privacy" />;
}
