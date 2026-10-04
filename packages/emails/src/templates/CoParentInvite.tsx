import { docs, type CoParentInviteData } from '../docs';
import { EmailLayout } from '../EmailLayout';

/** React Email template (preview with `npx email dev --dir src/templates`). Copy: packages/content emails.coParentInvite. */
export default function CoParentInvite(props: CoParentInviteData) {
  return <EmailLayout doc={docs.coParentInvite(props)} />;
}

CoParentInvite.PreviewProps = { inviter: 'Mama', url: 'https://earlyletters.com/i/preview' } satisfies CoParentInviteData;
