import { docs } from '../docs';
import { EmailLayout } from '../EmailLayout';

/** React Email template (preview with `npx email dev --dir src/templates`). Copy: packages/content emails.welcome. */
export default function Welcome() {
  return <EmailLayout doc={docs.welcome()} />;
}

Welcome.PreviewProps = {};
