import { accountEmails } from '@scribe/content/src/emails/account.en';
import { CopyEmail } from '../CopyEmail';
import { fill, type EmailValues } from '../fill';
import { previewValues } from '../fixtures';

export const copy = accountEmails['coparent-left'];
/** Subject with preview values, for the gallery. Senders use copy.subject. */
export const subject = fill(copy.subject, previewValues);

export default function CoparentLeftEmail({ values }: { values?: EmailValues }) {
  return <CopyEmail copy={copy} values={values} />;
}

export const PreviewProps = { values: previewValues };
CoparentLeftEmail.PreviewProps = PreviewProps;
