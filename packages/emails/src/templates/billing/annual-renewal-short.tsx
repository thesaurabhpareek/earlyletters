import { billingEmails } from '@scribe/content/src/emails/billing.en';
import { CopyEmail } from '../CopyEmail';
import { fill, type EmailValues } from '../fill';
import { previewValues } from '../fixtures';

export const copy = billingEmails['annual-renewal-short'];
/** Subject with preview values, for the gallery. Senders use copy.subject. */
export const subject = fill(copy.subject, previewValues);

export default function AnnualRenewalShortEmail({ values }: { values?: EmailValues }) {
  return <CopyEmail copy={copy} values={values} />;
}

export const PreviewProps = { values: previewValues };
AnnualRenewalShortEmail.PreviewProps = PreviewProps;
