import { lifecycleEmails } from '@scribe/content/src/emails/lifecycle.en';
import { LetterEmail } from '../LetterEmail';
import { fill, type EmailValues } from '../fill';
import { previewValues } from '../fixtures';

export const copy = lifecycleEmails['welcome-coparent'];
/** Subject with preview values, for the gallery. Senders use copy.subject. */
export const subject = fill(copy.subject, previewValues);

export default function WelcomeCoparentEmail({ values }: { values?: EmailValues }) {
  return <LetterEmail copy={copy} values={values} />;
}

export const PreviewProps = { values: previewValues };
WelcomeCoparentEmail.PreviewProps = PreviewProps;
