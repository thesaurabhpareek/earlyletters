/**
 * Transactional emails for Early Letters (React Email, MIT). Server-side only: Edge Functions or a
 * Supabase Send Email hook call `renderEmail` and send the result through Resend with both parts.
 *
 * Guarantees, enforced by test/emails.test.tsx:
 * - every email has an HTML part and a plain-text part built from the same copy;
 * - no images, no remote fonts, no tracking pixels, only https and mailto links;
 * - light and dark mode (prefers-color-scheme plus clean inversion);
 * - words come from @scribe/content (emails.en.ts) and obey the content rules.
 *
 * Sending rules for the caller: turn off open and click tracking in Resend for the domain
 * (Resend adds a pixel and rewrites links when they are on); set From to `brand.email`.
 */
import { render } from '@react-email/render';
import { createElement } from 'react';
import { docs, toText, type EmailData, type EmailName } from './docs';
import { EmailLayout } from './EmailLayout';

export { docs, toText } from './docs';
export type { EmailDoc, EmailData, EmailName } from './docs';
export { EmailLayout } from './EmailLayout';

export interface RenderedEmail {
  subject: string;
  html: string;
  text: string;
}

export async function renderEmail<N extends EmailName>(name: N, data: EmailData<N>): Promise<RenderedEmail> {
  const doc = (docs[name] as (d: EmailData<N>) => ReturnType<(typeof docs)[N]>)(data);
  const html = await render(createElement(EmailLayout, { doc }));
  return { subject: doc.subject, html, text: toText(doc) };
}

/** Supabase Auth fills this itself in its email templates. */
export const SUPABASE_CONFIRMATION_URL = '{{ .ConfirmationURL }}';
