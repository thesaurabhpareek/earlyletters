import { docs, type ReferenceData } from '../docs';
import { EmailLayout } from '../EmailLayout';

/** React Email template (preview with `npx email dev --dir src/templates`). Copy: packages/content emails.deletionCancelled. */
export default function DeletionCancelled(props: ReferenceData) {
  return <EmailLayout doc={docs.deletionCancelled(props)} />;
}

DeletionCancelled.PreviewProps = { reference: 'DR-7Q4K-2M9X' } satisfies ReferenceData;
