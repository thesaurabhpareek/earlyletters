import { accountEmails } from '@scribe/content/src/emails/account.en';
import { CopyEmail } from '../CopyEmail';
import { fill, type EmailValues } from '../fill';
import { previewValues } from '../fixtures';

export const copy = accountEmails['export-ready'];
/** Subject with preview values, for the gallery. Senders use copy.subject. */
export const subject = fill(copy.subject, previewValues);

export default function ExportReadyEmail({ values }: { values?: EmailValues }) {
  return <CopyEmail copy={copy} values={values} />;
}

// Server export links last 7 days (DATA-REQ-054), not the sign-in 15 minutes.
export const PreviewProps = { values: { ...previewValues, expiresIn: '7 days' } };
ExportReadyEmail.PreviewProps = PreviewProps;
