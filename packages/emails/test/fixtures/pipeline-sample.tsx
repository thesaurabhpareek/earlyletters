/**
 * Pipeline fixture: proves discovery, rendering, plain text and the gallery
 * using every component once. Not a product email; real emails live in
 * src/templates (lane D2) with copy from @scribe/content.
 * Fictional family only (CLAUDE.md): Asha.
 */
import {
  Button,
  CodeBox,
  Divider,
  EmailFooter,
  EmailHeader,
  EmailLayout,
  Heading,
  LinkFallback,
  Note,
  Paragraph,
  Signature,
} from '../../src';

export type PipelineSampleProps = { signInUrl: string; code: string };

export const subject = 'Pipeline sample';

export const PreviewProps: PipelineSampleProps = {
  signInUrl: 'https://earlyletters.com/auth/confirm?token_hash=fixture-not-a-real-token&type=email',
  code: '482913',
};

export default function PipelineSample({ signInUrl, code }: PipelineSampleProps) {
  return (
    <EmailLayout preheader="A fixture that walks through every component once, for the test suite.">
      <EmailHeader />
      <Heading>Tap to open Asha&apos;s book</Heading>
      <Paragraph>This sample exists so the render pipeline has something to render. It uses each component once.</Paragraph>
      <Paragraph>The link and the code work once, for {'{expiresIn}'}.</Paragraph>
      <Button href={signInUrl}>Sign in to my book</Button>
      <CodeBox label="Or enter this code in the app" code={code} />
      <Divider />
      <LinkFallback href={signInUrl} label="Button not working? Copy and paste this link:" />
      <Note tone="safety">Did not ask for this? You can ignore it. Nothing changes without this link or code.</Note>
      <Note tone="quiet">A quiet aside, set small.</Note>
      <Signature />
      <EmailFooter kind="transactional" />
    </EmailLayout>
  );
}
