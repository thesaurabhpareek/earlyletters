import { authEmails } from '@scribe/content/src/emails/auth.en';
import { fill, type EmailValues } from '../fill';
import { previewValues } from '../fixtures';
import { LetterEmail } from '../LetterEmail';

/** Welcome reads as a short letter, not a notice (LetterEmail). */
export const copy = authEmails.welcome;
/** Subject with preview values, for the gallery. Senders use copy.subject. */
export const subject = fill(copy.subject, previewValues);

export default function WelcomeEmail({ values }: { values?: EmailValues }) {
  return <LetterEmail copy={copy} values={values} />;
}

export const PreviewProps = { values: previewValues };
WelcomeEmail.PreviewProps = PreviewProps;
