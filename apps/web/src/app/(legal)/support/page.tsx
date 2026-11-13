import { SupportPage, supportMetadata } from '@/components/site/SupportPage';

// Built once at `next build`. If anything here turned dynamic, the build would fail.
export const dynamic = 'error';

export const metadata = supportMetadata;

export default function Page() {
  return <SupportPage />;
}
