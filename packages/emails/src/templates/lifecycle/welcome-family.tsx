import { lifecycleEmails } from '@scribe/content/src/emails/lifecycle.en';
import { LetterEmail } from '../LetterEmail';
import { fill, type EmailValues } from '../fill';
import { previewValues } from '../fixtures';

export const copy = lifecycleEmails['welcome-family'];
/** Subject with preview values, for the gallery. Senders use copy.subject. */
export const subject = fill(copy.subject, previewValues);

export default function WelcomeFamilyEmail({ values }: { values?: EmailValues }) {
  return <LetterEmail copy={copy} values={values} />;
}

export const PreviewProps = { values: previewValues };
WelcomeFamilyEmail.PreviewProps = PreviewProps;
