import { backupEmails } from '@scribe/content/src/emails/backup.en';
import { CopyEmail } from '../CopyEmail';
import { fill, type EmailValues } from '../fill';
import { previewValues } from '../fixtures';

export const copy = backupEmails['backup-key-rotated'];
/** Subject with preview values, for the gallery. The escrow function sends copy.subject. */
export const subject = fill(copy.subject, previewValues);

export default function BackupKeyRotatedEmail({ values }: { values?: EmailValues }) {
  return <CopyEmail copy={copy} values={values} />;
}

export const PreviewProps = { values: previewValues };
BackupKeyRotatedEmail.PreviewProps = PreviewProps;
