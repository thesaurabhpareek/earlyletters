import { DeleteAccountPage, deleteAccountMetadata } from '@/components/site/DeleteAccountPage';

// Built once at `next build`. If anything here turned dynamic, the build would fail.
export const dynamic = 'error';

export const metadata = deleteAccountMetadata;

export default function Page() {
  return <DeleteAccountPage />;
}
