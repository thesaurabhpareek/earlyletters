import { docs, type ExportReadyData } from '../docs';
import { EmailLayout } from '../EmailLayout';

/** React Email template (preview with `npx email dev --dir src/templates`). Copy: packages/content emails.exportReady. */
export default function ExportReady(props: ExportReadyData) {
  return <EmailLayout doc={docs.exportReady(props)} />;
}

ExportReady.PreviewProps = { url: 'https://earlyletters.com/export/preview', days: 7 } satisfies ExportReadyData;
