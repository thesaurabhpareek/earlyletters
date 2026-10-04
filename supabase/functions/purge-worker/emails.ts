/**
 * Plain-text deletion emails (DATA-REQ-022, DATA-REQ-025) built from the
 * words in packages/content (emails.en.ts) and the brand package. The HTML
 * twin rendered by packages/emails can replace `text` later; the words stay
 * the same.
 *
 * Content-free by construction: the only values filled in are the app name,
 * a date, the support address and the request reference (an L2 id). Never a
 * child's name, a letter or anything from a book.
 */
import { brand } from '../../../packages/brand/index.ts';
import { emails } from '../../../packages/content/src/emails.en.ts';
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

const footer = (vars: Record<string, string>): string[] => [
  '',
  fill(emails.common.footerAccount, vars),
  fill(emails.common.footerContact, vars),
  `${emails.common.privacyLink}: ${brand.web.privacy}`,
];

const base = () => ({ app: brand.name, email: brand.support.email });

export function deletionRequestedEmail(args: { scheduledFor: string; reference: string }): ComposedEmail {
  const t = emails.deletionRequested;
  const vars = { ...base(), date: longDate(args.scheduledFor), reference: args.reference };
  const lines = [fill(t.heading, vars), '', ...t.body.map((b) => fill(b, vars)), '', fill(t.subscription, vars), fill(t.kept, vars), '', fill(t.reference, vars), ...footer(vars)];
  return { subject: fill(t.subject, vars), text: lines.join('\n') };
}

export function deletionCancelledEmail(args: { reference: string }): ComposedEmail {
  const t = emails.deletionCancelled;
  const vars = { ...base(), reference: args.reference };
  const lines = [fill(t.heading, vars), '', ...t.body.map((b) => fill(b, vars)), '', fill(t.reference, vars), ...footer(vars)];
  return { subject: fill(t.subject, vars), text: lines.join('\n') };
}

export function deletionCompletedEmail(args: { completedAt: string; reference: string; hadSubscription: boolean | null }): ComposedEmail {
  const t = emails.deletionCompleted;
  const vars = { ...base(), date: longDate(args.completedAt), reference: args.reference };
  const lines = [fill(t.heading, vars), '', ...t.body.map((b) => fill(b, vars))];
  // DATA-REQ-022: repeat how to cancel with Apple when a subscription was active at request time
  // (unknown counts as active: saying it costs nothing, missing it costs money).
  if (args.hadSubscription !== false) lines.push('', fill(t.subscription, vars));
  lines.push('', fill(t.reference, vars), ...footer(vars));
  return { subject: fill(t.subject, vars), text: lines.join('\n') };
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
