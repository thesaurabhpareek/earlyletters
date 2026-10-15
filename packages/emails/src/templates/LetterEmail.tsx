/**
 * The letter layout, for emails that are a hello or a personal word rather than a notice (welcome,
 * welcome-family, welcome-coparent, coparent-invite, family-book-closing, family-book-restored; design review DSN-11):
 * body in the reading serif, built on D1's `Letter` (action before the sign-off by default, then the quiet
 * part). Same copy contract as CopyEmail.
 */
import type { EmailCopy } from '@scribe/content/src/emails/types';
import { token } from './CopyEmail';
import { fill, type EmailValues } from './fill';
import { EmailFooter, EmailHeader, EmailLayout, Heading, Letter, Paragraph } from './ui';

export function LetterEmail({ copy, values }: { copy: EmailCopy; values?: EmailValues }) {
  const f = (s: string) => fill(s, values);
  const href = copy.cta ? token(copy.cta.urlVar, values) : undefined;
  return (
    <EmailLayout preheader={f(copy.preheader)}>
      <EmailHeader />
      <Heading>{f(copy.heading)}</Heading>
      <Letter
        signoff={copy.signoff ? f(copy.signoff) : undefined}
        action={copy.cta && href ? { href, label: f(copy.cta.label) } : undefined}
        fallback={copy.fallback ? f(copy.fallback) : undefined}
        note={copy.safety ? f(copy.safety) : undefined}
      >
        {copy.body.map((p, i) => (
          <Paragraph key={i} variant="letter">
            {f(p)}
          </Paragraph>
        ))}
      </Letter>
      <EmailFooter kind={copy.kind} whyText={copy.whyText ? f(copy.whyText) : undefined} />
    </EmailLayout>
  );
}

export default LetterEmail;
