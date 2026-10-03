/**
 * The letter layout, for the few emails that are a hello rather than a notice
 * (welcome, welcome-family, welcome-coparent): body in the reading serif, the
 * signature straight after the words as a letter would have it, then the one
 * button, then the quiet part. Same copy contract as CopyEmail.
 */
import type { EmailCopy } from '@scribe/content/src/emails/types';
import { token } from './CopyEmail';
import { fill, type EmailValues } from './fill';
import {
  Button,
  Divider,
  EmailFooter,
  EmailHeader,
  EmailLayout,
  Heading,
  LinkFallback,
  Note,
  Paragraph,
  Signature,
} from './ui';

export function LetterEmail({ copy, values }: { copy: EmailCopy; values?: EmailValues }) {
  const f = (s: string) => fill(s, values);
  const href = copy.cta ? token(copy.cta.urlVar, values) : undefined;
  return (
    <EmailLayout preheader={f(copy.preheader)}>
      <EmailHeader />
      <Heading>{f(copy.heading)}</Heading>
      {copy.body.map((p, i) => (
        <Paragraph key={i} variant="letter">
          {f(p)}
        </Paragraph>
      ))}
      <Signature text={copy.signoff ? f(copy.signoff) : undefined} />
      {copy.cta && href ? (
        <>
          <Divider />
          <Button href={href}>{f(copy.cta.label)}</Button>
        </>
      ) : null}
      {copy.cta && href && copy.fallback ? <LinkFallback href={href} label={f(copy.fallback)} /> : null}
      {copy.safety ? <Note tone="quiet">{f(copy.safety)}</Note> : null}
      <EmailFooter kind={copy.kind} />
    </EmailLayout>
  );
}

export default LetterEmail;
