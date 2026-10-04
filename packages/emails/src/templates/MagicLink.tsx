import { docs, type MagicLinkData } from '../docs';
import { EmailLayout } from '../EmailLayout';

/** React Email template (preview with `npx email dev --dir src/templates`). Copy: packages/content emails.magicLink. */
export default function MagicLink(props: MagicLinkData) {
  return <EmailLayout doc={docs.magicLink(props)} />;
}

MagicLink.PreviewProps = { url: 'https://earlyletters.com/auth/confirm?token=preview' } satisfies MagicLinkData;
