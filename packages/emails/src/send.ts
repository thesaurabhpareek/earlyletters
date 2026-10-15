/**
 * What a sender needs to send one email through Resend: subject, HTML, plain text and the inline logo files.
 *
 * Nothing in an email loads from a server (develop's privacy rule; docs/emails/README.md "Images and fonts").
 * The header logo therefore travels inside the message as inline attachments, and the HTML points at them by
 * Content-ID (`<img src="cid:el-logo-light">`). Resend supports this (verified 3 Oct 2026 in the Resend docs,
 * "Embed inline images" and the send-email API reference): an attachment with `content_id` (REST) or
 * `contentId` (Node SDK) plus `filename` or `content_type`; content as a Buffer or Base64 string; content id
 * under 128 characters; at most 40MB per email after Base64; NOT available on the batch endpoint, so send
 * these one at a time. Resend notes some webmail clients may reject inline images: the alt text (the brand
 * name in the email serif) then shows in the logo's place.
 *
 * Server-side only (reads the PNGs from packages/brand). Turn open and click tracking off for the domain.
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { brand } from '@scribe/brand';
import { assetFor } from '@scribe/brand/registry';
import type { ReactElement } from 'react';
import { LOGO_CID } from './components/header';
import { renderEmail, renderEmailText } from './components/render';
import type { LogoMode } from './components/theme';

/** One inline attachment, shaped for the Resend Node SDK (`resend.emails.send({ attachments })`). */
export type InlineAttachment = {
  filename: string;
  /** Base64 of the file. */
  content: string;
  contentType: 'image/png';
  /** Matches the `cid:` in the HTML. */
  contentId: string;
};

/** The same attachment for the Resend REST API (`POST /emails`), which uses snake_case. */
export type InlineAttachmentApi = { filename: string; content: string; content_type: string; content_id: string };

export const toResendApi = (a: InlineAttachment): InlineAttachmentApi => ({
  filename: a.filename,
  content: a.content,
  content_type: a.contentType,
  content_id: a.contentId,
});

const REPO_ROOT = resolve(import.meta.dirname, '..', '..', '..');

let cache: InlineAttachment[] | undefined;

/** The light and dark header logos (registry contexts `email.header.light` / `.dark`, 2x PNGs) as inline attachments. */
export function logoAttachments(): InlineAttachment[] {
  cache ??= (['light', 'dark'] as const).map((which) => {
    const a = assetFor(`email.header.${which}`)[0];
    if (!a.path) throw new Error(`brand registry: ${a.id} has no file path`);
    return {
      filename: `${brand.publisher.domain.split('.')[0]}-logo-${which}.png`,
      content: readFileSync(resolve(REPO_ROOT, a.path)).toString('base64'),
      contentType: 'image/png',
      contentId: LOGO_CID[which],
    };
  });
  return cache;
}

export type SendOptions = {
  /**
   * `inline` (default) attaches the logos. `text` sends no image. `remote` loads the logo from
   * earlyletters.com/email/: off by default, only if the founder decides a server request is acceptable.
   */
  logo?: LogoMode;
};

export type ReadyToSend = {
  html: string;
  text: string;
  /** Empty unless the logo is inline. Pass as Resend `attachments`. */
  attachments: InlineAttachment[];
};

/**
 * Render an email for Resend: HTML and plain-text parts plus the attachments the HTML refers to.
 *
 *   const mail = await renderForResend(<CopyEmail copy={authEmails.welcome} values={v} />);
 *   await resend.emails.send({ from, to, subject, html: mail.html, text: mail.text, attachments: mail.attachments });
 */
export async function renderForResend(element: ReactElement, opts: SendOptions = {}): Promise<ReadyToSend> {
  const logo = opts.logo ?? 'inline';
  const assets = { logo, webFonts: false };
  const [html, text] = await Promise.all([renderEmail(element, { assets }), renderEmailText(element, { assets })]);
  return { html, text, attachments: logo === 'inline' ? logoAttachments() : [] };
}
