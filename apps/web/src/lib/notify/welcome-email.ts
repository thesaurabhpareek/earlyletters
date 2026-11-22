/**
 * Owner: E2 (back-end). The one short hello sent after someone leaves their address.
 * The design is the shared layout (lib/email/layout.ts); the words are `site.welcomeEmail`, so the
 * website's copy rules cover them.
 */
import { site } from '../../content/site';
import { renderEmail } from '../email/layout';

const w = site.welcomeEmail;

export type WelcomeEmail = { subject: string; html: string; text: string };

/** `unsubscribeHref` is the personal one-click link, or a mailto address when no link can be made. */
export function renderWelcomeEmail(siteUrl: string, unsubscribeHref: string): WelcomeEmail {
  const { html, text } = renderEmail({
    title: w.subject,
    preheader: w.preheader,
    hero: { kicker: w.kicker, headline: w.headline, intro: w.intro },
    blocks: [
      {
        type: 'letter',
        label: w.letterLabel,
        to: w.letterTo,
        meta: w.letterMeta,
        from: w.letterFrom,
        excerpt: w.letterExcerpt,
        note: w.letterNote,
      },
      { type: 'list', title: w.promisesTitle, items: w.promises },
      { type: 'paragraph', text: w.closing },
      { type: 'signoff', text: w.signoff },
    ],
    footer: {
      lines: [w.footerLine, w.why],
      unsubscribe: { prefix: w.unsubscribePrefix, label: w.unsubscribeLabel, href: unsubscribeHref },
    },
    siteUrl,
  });
  return { subject: w.subject, html, text };
}
