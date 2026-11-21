/**
 * The new-device sign-in email, from the words in packages/content (emails/auth.en.ts, id 'new-device-sign-in', E83).
 * No word is written here except the two device names and the time format, which are PROPOSED (NDS-3).
 * Plain text only: the generated Resend template for this id still carries the old "reply to this email" words
 * (packages/emails/generated/resend.ts), so it is not used (NDS-4).
 * With no link (the 21st token of a day), the "open this link" paragraph is left out and the in-app path stays.
 * The E78 line (heldEmailLine) is not added: the sign-out page does not exist yet.
 */
import { brand } from '@scribe/brand';
import { authEmails } from '../../../packages/content/src/emails/auth.en.ts';

export const DEVICE_WORDS = { apple: 'an iPhone or iPad', other: 'a new device' } as const; // PROPOSED
const copy = authEmails['new-device-sign-in'];
const LINK_PARAGRAPH = /\{notYouUrl\}/;

export const notYouUrl = (plainToken: string): string => `${brand.web.origin}/not-you#token=${plainToken}`;

export function whenWords(at: Date): string {
  const f = new Intl.DateTimeFormat('en-US', { dateStyle: 'full', timeStyle: 'short', timeZone: 'UTC' }).format(at);
  return `${f.replace(/ (AM|PM)$/, (_m, ap: string) => ` ${ap.toLowerCase()}`)} UTC`;
}

export function composeEmail(args: { deviceClass: string; at: Date; url: string | null }): { subject: string; text: string } {
  const vars: Record<string, string> = {
    device: args.deviceClass === 'apple' ? DEVICE_WORDS.apple : DEVICE_WORDS.other,
    when: whenWords(args.at),
    notYouUrl: args.url ?? '',
  };
  const fill = (s: string) => s.replace(/\{(\w+)\}/g, (m, k: string) => (k in vars ? vars[k] : m));
  const paragraphs = copy.body.filter((p) => args.url !== null || !LINK_PARAGRAPH.test(p)).map(fill);
  return { subject: copy.subject, text: [fill(copy.heading), ...paragraphs, copy.safety ?? ''].filter(Boolean).join('\n\n') + '\n' };
}
