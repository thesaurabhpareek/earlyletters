/**
 * The deletion emails (DATA-REQ-022, DATA-REQ-025, DATA-REQ-026): account-deletion-scheduled,
 * account-deletion-cancelled and account-deleted, rendered by packages/emails at build time
 * (`npm run export:resend -w @scribe/emails` writes packages/emails/generated/resend.ts, a self-contained
 * module Deno can import). Each has HTML with the inline logo (two `cid:` attachments), a plain-text twin and
 * a subject (TPL-02). The words live in packages/content src/emails/account.en.ts.
 *
 * Content-free by construction: the only values filled in are dates, the request reference (an L2 id)
 * and public links. Never a child's name, a letter or anything from a book.
 *
 * The contributor notice and the founder alert stay plain text (see below).
 */
import { brand } from '../../../packages/brand/index.ts';
import { emailChrome } from '../../../packages/content/src/emails/chrome.en.ts';
import { emailLegal } from '../../../packages/content/src/emails/legal.en.ts';
import { longDate, renderForResend, type InlineAttachment } from '../../../packages/emails/generated/resend.ts';
import { ALERT_RUNBOOK, workerCopy } from './copy.ts';
import type { AlertKind } from '../_shared/log/log.ts';

export { longDate };

export interface ComposedEmail {
  subject: string;
  text: string;
  /** Present on the library emails: HTML that shows the logo from `attachments` by Content-ID. */
  html?: string;
  attachments?: InlineAttachment[];
}

const fill = (s: string, vars: Record<string, string>): string => s.replace(/\{(\w+)\}/g, (m, k) => (k in vars ? vars[k] : m));

const DAY = 24 * 60 * 60 * 1000;

/** Public links for the worker's own plain-text emails (the library emails take theirs from the generated meta). */
const base = (): Record<string, string> => ({
  app: brand.name,
  email: brand.support.email,
  appUrl: `${brand.web.universalLinkBase}/open`,
  helpUrl: `${brand.web.origin}/contact`,
  privacyUrl: brand.web.privacy,
});

/** The footer, as packages/emails renders it in plain text (chrome.en.ts, legal.en.ts). */
const footer = (vars: Record<string, string>): string[] => {
  const v = { ...vars, whyYouGotThis: emailLegal.whyYouGotThis.transactional };
  return [
    '',
    ...emailChrome.footer.transactional.map((l) => fill(l, v)),
    ...emailChrome.footer.links.transactional.map((l) => `${l.label}: ${fill(l.urlVar, v)}`),
    emailChrome.footer.nameLine,
  ];
};

/** The Plus line of account-deleted (DATA-REQ-022). It starts this way in account.en.ts. */
const PLUS = 'If you have Plus';

/**
 * Drops the Plus paragraph from a rendered email: one `<p>` in the HTML and one paragraph in the text.
 * If the line is not found exactly once in each part, the email is returned unchanged: saying it costs
 * nothing, a half-removed line would be a broken email.
 */
export function withoutPlusLine(mail: ComposedEmail): ComposedEmail {
  const html = mail.html ?? '';
  const htmlRe = new RegExp(`<p\\b[^>]*>${PLUS}\\b[^<]*</p>`, 'g');
  const textRe = new RegExp(`(?<=^|\\n)${PLUS}\\b[^\\n]*\\n\\n`, 'g');
  if ((html.match(htmlRe) ?? []).length !== 1 || (mail.text.match(textRe) ?? []).length !== 1) return mail;
  return { ...mail, html: html.replace(htmlRe, ''), text: mail.text.replace(textRe, '') };
}

export function deletionRequestedEmail(args: { scheduledFor: string; reference: string; requestedAt?: string }): ComposedEmail {
  return renderForResend('account-deletion-scheduled', {
    requestId: args.reference,
    deletionDate: longDate(args.scheduledFor),
    requestDate: longDate(args.requestedAt ?? new Date(new Date(args.scheduledFor).getTime() - 30 * DAY)),
  });
}

export function deletionCancelledEmail(args: { reference: string }): ComposedEmail {
  return renderForResend('account-deletion-cancelled', { requestId: args.reference });
}

export function deletionCompletedEmail(args: { completedAt: string; reference: string; hadSubscription: boolean | null }): ComposedEmail {
  const done = new Date(args.completedAt);
  const mail = renderForResend('account-deleted', {
    requestId: args.reference,
    completedDate: longDate(done),
    backupClearDate: longDate(new Date(done.getTime() + 7 * DAY)),
  });
  // DATA-REQ-022: repeat how to cancel with Apple when a subscription was active at request time
  // (unknown counts as active: saying it costs nothing, missing it costs money).
  return args.hadSubscription === false ? withoutPlusLine(mail) : mail;
}

/**
 * Plain text, off the email catalog (TPL-05, deferred): the catalogued `family-book-closing` needs the
 * requester's display name ({parentName}), which no service function returns. Unreachable in the 1.0 line:
 * the database refuses contributor memberships while `contributors_enabled()` is false, so
 * `ops_deletion_contributors` returns none and the step is recorded not_applicable.
 */
export function contributorNoticeEmail(args: { scheduledFor: string }): ComposedEmail {
  const t = workerCopy.contributorNotice;
  const vars = { ...base(), date: longDate(args.scheduledFor) };
  return { subject: fill(t.subject, vars), text: [...t.body.map((b) => fill(b, vars)), ...footer(vars)].join('\n') };
}

export function alertEmail(args: { conditions: { kind: AlertKind; count: number }[]; run: string; at: Date }): ComposedEmail {
  const t = workerCopy.alert;
  const lines = [
    t.intro,
    '',
    ...args.conditions.map((c) => fill(t.line, { kind: c.kind, count: String(Math.max(0, Math.floor(c.count))), runbook: ALERT_RUNBOOK[c.kind] })),
    '',
    fill(t.footer, { run: args.run, time: args.at.toISOString().slice(0, 16).replace('T', ' ') }),
  ];
  return { subject: `[${brand.name} ops] ${t.subject}`, text: lines.join('\n') };
}
