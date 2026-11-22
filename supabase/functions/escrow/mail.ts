/**
 * The owner emails (F08 6.5 C3 and C7) through Resend's REST API, from templates rendered by
 * packages/emails (scripts/export-escrow.ts writes email/templates.ts; a test there fails if the
 * committed file drifts). The function only fills placeholders, HTML-escaped in the HTML part,
 * and refuses to send an email with any placeholder left. Idempotency keys make a retried call
 * send once (Resend keeps them 24 hours).
 */
import { templates, type TemplateId } from './email/templates.ts';
import type { FetchFn } from './jwt.ts';

export interface Mail {
  to: string;
  subject: string;
  html: string;
  text: string;
  idempotencyKey: string;
}

export interface Mailer {
  send(m: Mail): Promise<void>;
}

export class MailError extends Error {
  readonly status: number;
  constructor(status: number) {
    super(`resend ${status}`);
    this.status = status;
  }
}

const escapeHtml = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
const TOKEN = /\{([a-zA-Z][a-zA-Z0-9]*)\}/g;

export function render(id: TemplateId, values: Record<string, string>): { subject: string; html: string; text: string } {
  const t = templates.emails[id];
  const fill = (s: string, html: boolean) => s.replace(TOKEN, (whole, k: string) => (k in values ? (html ? escapeHtml(values[k]) : values[k]) : whole));
  const out = { subject: fill(t.subject, false), html: fill(t.html, true), text: fill(t.text, false) };
  const left = [...`${out.subject}${out.html}${out.text}`.matchAll(TOKEN)].map((m) => m[1]);
  if (left.length) throw new Error(`unfilled placeholders: ${[...new Set(left)].join(', ')}`);
  return out;
}

export function resendMailer(fetchFn: FetchFn, apiKey: string, from: string, replyTo: string): Mailer {
  return {
    async send(m) {
      const r = await fetchFn('https://api.resend.com/emails', {
        method: 'POST',
        headers: { authorization: `Bearer ${apiKey}`, 'content-type': 'application/json', 'idempotency-key': m.idempotencyKey },
        body: JSON.stringify({ from, to: [m.to], reply_to: replyTo, subject: m.subject, html: m.html, text: m.text }),
      });
      if (!r.ok) throw new MailError(r.status);
    },
  };
}

/** "Thursday, October 29, 2026 at 9:14 pm UTC". The server does not know the person's time zone. */
export function when(d: Date): string {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const h = d.getUTCHours();
  const hh = h % 12 === 0 ? 12 : h % 12;
  const mm = String(d.getUTCMinutes()).padStart(2, '0');
  return `${days[d.getUTCDay()]}, ${months[d.getUTCMonth()]} ${d.getUTCDate()}, ${d.getUTCFullYear()} at ${hh}:${mm} ${h < 12 ? 'am' : 'pm'} UTC`;
}
