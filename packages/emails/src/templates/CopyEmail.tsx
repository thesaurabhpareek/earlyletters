/**
 * The generic renderer: one EmailCopy (from @scribe/content) to one email.
 *
 * Layout, top to bottom: header, heading, body, key facts (when the copy has them), the one action (button and,
 * when there is one, the code for the other device), then the quiet part
 * (fallback link, safety line), signature, footer.
 *
 * Templates never contain words of their own. Every visible string comes from
 * the copy object or from the chrome copy D1's components read.
 */
import type { EmailCopy } from '@scribe/content/src/emails/types';
import { fill, varName, type EmailValues } from './fill';
import {
  Button,
  CodeBox,
  Divider,
  EmailFooter,
  EmailHeader,
  EmailLayout,
  Heading,
  KeyFacts,
  LinkFallback,
  Note,
  Paragraph,
  Signature,
} from './ui';

export type CopyEmailProps = {
  copy: EmailCopy;
  /** Placeholder values. Missing keys stay literal, e.g. `{signInUrl}`. */
  values?: EmailValues;
};

/** Resolve a `{var}` token to its value, or keep the literal token. */
export function token(t: string, values?: EmailValues): string {
  return fill(`{${varName(t)}}`, values);
}

export function CopyEmail({ copy, values }: CopyEmailProps) {
  const f = (s: string) => fill(s, values);
  const href = copy.cta ? token(copy.cta.urlVar, values) : undefined;

  return (
    <EmailLayout preheader={f(copy.preheader)}>
      <EmailHeader />
      <Heading>{f(copy.heading)}</Heading>
      {copy.body.map((p, i) => (
        <Paragraph key={i}>{f(p)}</Paragraph>
      ))}
      {copy.facts?.length ? <KeyFacts facts={copy.facts.map((k) => ({ label: f(k.label), value: f(k.value) }))} /> : null}

      {copy.cta && href ? <Button href={href}>{f(copy.cta.label)}</Button> : null}
      {copy.code ? <CodeBox label={f(copy.code.label)} code={token(copy.code.codeVar, values)} /> : null}

      {(copy.cta && copy.fallback) || copy.safety ? <Divider /> : null}
      {copy.cta && href && copy.fallback ? <LinkFallback href={href} label={f(copy.fallback)} /> : null}
      {copy.safety ? <Note tone="safety">{f(copy.safety)}</Note> : null}

      <Signature text={copy.signoff ? f(copy.signoff) : undefined} />
      <EmailFooter kind={copy.kind} />
    </EmailLayout>
  );
}

export default CopyEmail;
