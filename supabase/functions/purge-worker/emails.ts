/**
 * Plain-text deletion emails (DATA-REQ-022, DATA-REQ-025, DATA-REQ-026) built from the words in
 * packages/content (src/emails/account.en.ts: account-deletion-scheduled, account-deletion-cancelled,
 * account-deleted) and the shared email chrome. The HTML twin rendered by packages/emails
 * (`renderForResend`) can replace `text` later; the words stay the same.
 *
 * Content-free by construction: the only values filled in are dates, the request reference (an L2 id)
 * and public links. Never a child's name, a letter or anything from a book.
 */
import { brand } from '../../../packages/brand/index.ts';
import { accountEmails } from '../../../packages/content/src/emails/account.en.ts';
import { emailChrome } from '../../../packages/content/src/emails/chrome.en.ts';
import { emailLegal } from '../../../packages/content/src/emails/legal.en.ts';
import type { EmailCopy } from '../../../packages/content/src/emails/types.ts';
import { ALERT_RUNBOOK, workerCopy } from './copy.ts';
import type { AlertKind } from '../_shared/log/log.ts';

export interface ComposedEmail {
  subject: string;
  text: string;
}

const fill = (s: string, vars: Record<string, string>): string => s.replace(/\{(\w+)\}/g, (m, k) => (k in vars ? vars[k] : m));

/** Long date, US English, in UTC (the reader's zone is unknown on the server). */
export function longDate(iso: string | Date): string {
  const d = typeof iso === 'string' ? new Date(iso) : iso;
  return new Intl.DateTimeFormat('en-US', { dateStyle: 'long', timeZone: 'UTC' }).format(d);
}

const DAY = 24 * 60 * 60 * 1000;

/** Values every deletion email can use: public links only (packages/emails fixtures use the same shapes). */
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

/** One EmailCopy to plain text: heading, body, key facts, the action, the safety line, sign-off, footer. */
function compose(copy: EmailCopy, vars: Record<string, string>, keep: (paragraph: string) => boolean = () => true): ComposedEmail {
  const f = (t: string) => fill(t, vars);
  const lines = [f(copy.heading), '', ...copy.body.filter(keep).flatMap((b) => [f(b), ''])];
  if (copy.facts?.length) lines.push(...copy.facts.map((k) => `${f(k.label)}: ${f(k.value)}`), '');
  if (copy.cta) lines.push(`${f(copy.cta.label)}: ${f(copy.cta.urlVar)}`, '');
  if (copy.safety) lines.push(f(copy.safety), '');
  lines.push(...emailChrome.signature.split('\n'), ...footer(vars));
  return { subject: f(copy.subject), text: lines.join('\n') };
}

/** The Plus line (DATA-REQ-022). Every one starts this way in account.en.ts. */
const isPlusLine = (p: string) => /^If you have Plus\b/.test(p);

export function deletionRequestedEmail(args: { scheduledFor: string; reference: string; requestedAt?: string }): ComposedEmail {
  const vars = {
    ...base(),
    requestId: args.reference,
    deletionDate: longDate(args.scheduledFor),
    requestDate: longDate(args.requestedAt ?? new Date(new Date(args.scheduledFor).getTime() - 30 * DAY)),
  };
  return compose(accountEmails['account-deletion-scheduled'], vars);
}

export function deletionCancelledEmail(args: { reference: string }): ComposedEmail {
  return compose(accountEmails['account-deletion-cancelled'], { ...base(), requestId: args.reference });
}

export function deletionCompletedEmail(args: { completedAt: string; reference: string; hadSubscription: boolean | null }): ComposedEmail {
  const done = new Date(args.completedAt);
  const vars = { ...base(), requestId: args.reference, completedDate: longDate(done), backupClearDate: longDate(new Date(done.getTime() + 7 * DAY)) };
  // DATA-REQ-022: repeat how to cancel with Apple when a subscription was active at request time
  // (unknown counts as active: saying it costs nothing, missing it costs money).
  return compose(accountEmails['account-deleted'], vars, (p) => args.hadSubscription !== false || !isPlusLine(p));
}

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
