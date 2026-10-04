import { brand } from '@scribe/brand';
import { emails } from '@scribe/content';
import { fill, type Values } from './fill';

/**
 * One email, as data. The HTML (React Email) and the plain-text version are both built from this,
 * so they can never say different things.
 */
export interface EmailDoc {
  subject: string;
  preview: string;
  heading: string;
  paragraphs: string[];
  /** At most one action per email. */
  action?: { label: string; url: string };
  /** A quiet line right under the action (link lifetime, where it opens). */
  actionNote?: string;
  /** Quiet lines after the main text: ignore notes, subscription notes, what we keep. */
  notes: string[];
  reference?: string;
  /** Why this person got the email. */
  footer: string;
}

const c = emails.common;

export interface MagicLinkData {
  /** Supabase fills `{{ .ConfirmationURL }}` itself; pass that literal for the Auth template. */
  url: string;
}
export interface CoParentInviteData {
  /** What the inviter signs as, for example "Mama". Never the child's name. */
  inviter: string;
  url: string;
}
export interface DeletionData {
  /** Long date in the reader's locale, for example "November 2, 2026". */
  date: string;
  reference: string;
}
export interface ReferenceData {
  reference: string;
}
export interface ExportReadyData {
  url: string;
  days: number;
}

const f = (t: string, v?: Values) => fill(t, v);
const all = (ts: readonly string[], v?: Values) => ts.map((t) => f(t, v));

export const docs = {
  magicLink: ({ url }: MagicLinkData): EmailDoc => {
    const e = emails.magicLink;
    return {
      subject: f(e.subject),
      preview: f(e.preview),
      heading: f(e.heading),
      paragraphs: all(e.body),
      action: { label: e.button, url },
      notes: [f(e.ignore)],
      footer: f(c.footerAccount),
    };
  },

  coParentInvite: ({ inviter, url }: CoParentInviteData): EmailDoc => {
    const e = emails.coParentInvite;
    const v = { inviter };
    return {
      subject: f(e.subject, v),
      preview: f(e.preview, v),
      heading: f(e.heading, v),
      paragraphs: all(e.body, v),
      action: { label: e.button, url },
      actionNote: f(e.linkNote, v),
      notes: [f(e.ignore, v)],
      footer: f(e.footerInvite, v),
    };
  },

  welcome: (): EmailDoc => {
    const e = emails.welcome;
    return {
      subject: f(e.subject),
      preview: f(e.preview),
      heading: f(e.heading),
      paragraphs: [...all(e.body), f(e.promise)],
      notes: [],
      footer: f(c.footerAccount),
    };
  },

  deletionRequested: ({ date, reference }: DeletionData): EmailDoc => {
    const e = emails.deletionRequested;
    const v = { date, reference };
    return {
      subject: f(e.subject, v),
      preview: f(e.preview, v),
      heading: f(e.heading, v),
      paragraphs: all(e.body, v),
      notes: [f(e.subscription, v), f(e.kept, v)],
      reference: f(e.reference, v),
      footer: f(c.footerAccount),
    };
  },

  deletionCancelled: ({ reference }: ReferenceData): EmailDoc => {
    const e = emails.deletionCancelled;
    const v = { reference };
    return {
      subject: f(e.subject, v),
      preview: f(e.preview, v),
      heading: f(e.heading, v),
      paragraphs: all(e.body, v),
      notes: [],
      reference: f(e.reference, v),
      footer: f(c.footerAccount),
    };
  },

  deletionCompleted: ({ date, reference }: DeletionData): EmailDoc => {
    const e = emails.deletionCompleted;
    const v = { date, reference };
    return {
      subject: f(e.subject, v),
      preview: f(e.preview, v),
      heading: f(e.heading, v),
      paragraphs: all(e.body, v),
      notes: [f(e.subscription, v)],
      reference: f(e.reference, v),
      // The account no longer exists, so the footer says where the email came from instead.
      footer: f(c.footerContact),
    };
  },

  exportReady: ({ url, days }: ExportReadyData): EmailDoc => {
    const e = emails.exportReady;
    const v = { days };
    return {
      subject: f(e.subject, v),
      preview: f(e.preview, v),
      heading: f(e.heading, v),
      paragraphs: all(e.body, v),
      action: { label: e.button, url },
      notes: [f(e.ignore, v)],
      footer: f(c.footerAccount),
    };
  },
} as const;

export type EmailName = keyof typeof docs;
export type EmailData<N extends EmailName> = Parameters<(typeof docs)[N]>[0];

/** Plain-text twin, built from the same doc. Wraps nothing: mail clients wrap plain text themselves. */
export function toText(doc: EmailDoc): string {
  const lines: string[] = [f(c.wordmark), '', doc.heading, '', ...doc.paragraphs.flatMap((p) => [p, ''])];
  if (doc.action) lines.push(`${doc.action.label}: ${doc.action.url}`, '');
  if (doc.actionNote) lines.push(doc.actionNote, '');
  for (const n of doc.notes) lines.push(n, '');
  if (doc.reference) lines.push(doc.reference, '');
  lines.push(
    '--',
    doc.footer,
    ...(doc.footer === f(c.footerContact) ? [] : [f(c.footerContact)]),
    `${c.privacyLink}: ${brand.web.privacy}`,
    `${c.termsLink}: ${brand.web.terms}`,
  );
  return `${lines.join('\n').trim()}\n`;
}
