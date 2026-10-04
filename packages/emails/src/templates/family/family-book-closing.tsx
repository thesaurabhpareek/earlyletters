import { familyEmails } from '@scribe/content/src/emails/family.en';
import { LetterEmail } from '../LetterEmail';
import { fill, type EmailValues } from '../fill';
import { previewValues } from '../fixtures';

export const copy = familyEmails['family-book-closing'];
/** Subject with preview values, for the gallery. Senders use copy.subject. */
export const subject = fill(copy.subject, previewValues);

export default function FamilyBookClosingEmail({ values }: { values?: EmailValues }) {
  return <LetterEmail copy={copy} values={values} />;
}

export const PreviewProps = { values: previewValues };
FamilyBookClosingEmail.PreviewProps = PreviewProps;
