import { authEmails } from '@scribe/content/src/emails/auth.en';
import { CopyEmail } from '../CopyEmail';
import { fill, type EmailValues } from '../fill';
import { previewValues } from '../fixtures';

export const copy = authEmails['account-create-attempt'];
/** Subject with preview values, for the gallery. Senders use copy.subject. */
export const subject = fill(copy.subject, previewValues);

export default function AccountCreateAttemptEmail({ values }: { values?: EmailValues }) {
  return <CopyEmail copy={copy} values={values} />;
}

export const PreviewProps = { values: previewValues };
AccountCreateAttemptEmail.PreviewProps = PreviewProps;
