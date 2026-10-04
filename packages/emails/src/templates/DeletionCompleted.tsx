import { docs, type DeletionData } from '../docs';
import { EmailLayout } from '../EmailLayout';

/** React Email template (preview with `npx email dev --dir src/templates`). Copy: packages/content emails.deletionCompleted. */
export default function DeletionCompleted(props: DeletionData) {
  return <EmailLayout doc={docs.deletionCompleted(props)} />;
}

DeletionCompleted.PreviewProps = { date: 'November 2, 2026', reference: 'DR-7Q4K-2M9X' } satisfies DeletionData;
