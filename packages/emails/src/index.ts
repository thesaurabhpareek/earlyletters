/**
 * @scribe/emails: component library, tokens and renderer for every email.
 * Templates live in src/templates; copy lives in @scribe/content (src/emails/*.en.ts).
 * Senders use `renderForResend` (src/send.ts): it returns the HTML, the plain text and the inline logo files.
 */
export * from './components';
export * as tokens from './tokens';
export { logoAttachments, renderForResend, toResendApi, type InlineAttachment, type InlineAttachmentApi, type ReadyToSend, type SendOptions } from './send';
