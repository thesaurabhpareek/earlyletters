import { familyEmails } from '@scribe/content/src/emails/family.en';
import { LetterEmail } from '../LetterEmail';
import { fill, type EmailValues } from '../fill';
import { previewValues } from '../fixtures';

/** Ported from develop's CoParentInvite (D-055): a parent typed their co-parent's address in the app. */
export const copy = familyEmails['coparent-invite'];
/** Subject with preview values, for the gallery. Senders use copy.subject. */
export const subject = fill(copy.subject, previewValues);

export default function CoparentInviteEmail({ values }: { values?: EmailValues }) {
  return <LetterEmail copy={copy} values={values} />;
}

export const PreviewProps = { values: previewValues };
CoparentInviteEmail.PreviewProps = PreviewProps;
