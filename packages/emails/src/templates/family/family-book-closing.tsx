import { familyEmails } from '@scribe/content/src/emails/family.en';
import { CopyEmail } from '../CopyEmail';
import { fill, type EmailValues } from '../fill';
import { previewValues } from '../fixtures';

export const copy = familyEmails['family-book-closing'];
/** Subject with preview values, for the gallery. Senders use copy.subject. */
export const subject = fill(copy.subject, previewValues);

export default function FamilyBookClosingEmail({ values }: { values?: EmailValues }) {
  return <CopyEmail copy={copy} values={values} />;
}

export const PreviewProps = { values: previewValues };
FamilyBookClosingEmail.PreviewProps = PreviewProps;
